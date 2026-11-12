<?php

namespace App\Services\AI;

use App\Models\Team;
use App\Models\TeamAiQuota;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TeamAiQuotaService
{
    protected const QUOTA_LIMIT = 10;
    protected const QUOTA_PERIOD_HOURS = 120; // 5 days

    /**
     * Get quota info for a team. Returns quota details without modifying anything.
     */
    public function getQuotaInfo(Team $team): array
    {
        $quota = TeamAiQuota::where('team_id', $team->id)->first();

        if (!$quota || $quota->isExpired()) {
            return [
                'quota_limit' => self::QUOTA_LIMIT,
                'quota_used' => 0,
                'quota_remaining' => self::QUOTA_LIMIT,
                'period_started_at' => null,
                'period_expires_at' => null,
                'reset_in_seconds' => null,
                'is_exhausted' => false,
            ];
        }

        return [
            'quota_limit' => $quota->quota_limit,
            'quota_used' => $quota->quota_used,
            'quota_remaining' => $quota->remaining(),
            'period_started_at' => $quota->period_started_at?->toIso8601String(),
            'period_expires_at' => $quota->period_expires_at?->toIso8601String(),
            'reset_in_seconds' => $quota->getResetInSeconds(),
            'is_exhausted' => $quota->remaining() === 0,
        ];
    }

    /**
     * Atomically reserve a quota slot. Returns true on success, false if exhausted.
     * Uses DB transaction + row-level lock + idempotency key.
     */
    public function reserveQuota(Team $team, string $idempotencyKey): bool
    {
        return DB::transaction(function () use ($team, $idempotencyKey) {
            // Lock or create the quota row
            $quota = TeamAiQuota::lockForUpdate()
                ->where('team_id', $team->id)
                ->first();

            if (!$quota) {
                $quota = new TeamAiQuota([
                    'team_id' => $team->id,
                    'quota_limit' => self::QUOTA_LIMIT,
                    'quota_used' => 0,
                    'idempotency_keys' => [],
                ]);
            }

            // If period expired, reset
            if ($quota->isExpired()) {
                $quota->quota_used = 0;
                $quota->period_started_at = null;
                $quota->period_expires_at = null;
                $quota->idempotency_keys = [];
            }

            // Check idempotency - same key means already processed
            $keys = $quota->idempotency_keys ?? [];
            if (in_array($idempotencyKey, $keys)) {
                Log::info("AI quota: idempotency key already consumed for team {$team->id}");
                return true; // Already counted
            }

            // Check exhaustion
            if ($quota->quota_used >= $quota->quota_limit) {
                return false;
            }

            // Start period if not started
            if (!$quota->period_started_at) {
                $quota->period_started_at = now('UTC');
                $quota->period_expires_at = now('UTC')->addHours(self::QUOTA_PERIOD_HOURS);
            }

            // Consume quota
            $quota->quota_used += 1;
            $keys[] = $idempotencyKey;
            // Keep only last 50 keys to avoid bloat
            if (count($keys) > 50) {
                $keys = array_slice($keys, -50);
            }
            $quota->idempotency_keys = $keys;
            $quota->save();

            return true;
        });
    }

    /**
     * Release a quota slot if the session initialization failed.
     * Only works if the idempotency key hasn't been committed.
     */
    public function releaseQuota(Team $team, string $idempotencyKey): void
    {
        DB::transaction(function () use ($team, $idempotencyKey) {
            $quota = TeamAiQuota::lockForUpdate()
                ->where('team_id', $team->id)
                ->first();

            if (!$quota) return;

            $keys = $quota->idempotency_keys ?? [];
            if (in_array($idempotencyKey, $keys)) {
                $quota->quota_used = max(0, $quota->quota_used - 1);
                $quota->idempotency_keys = array_values(array_filter($keys, fn($k) => $k !== $idempotencyKey));
                $quota->save();
            }
        });
    }
}
