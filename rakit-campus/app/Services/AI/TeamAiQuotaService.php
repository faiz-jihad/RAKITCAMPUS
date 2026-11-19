<?php

namespace App\Services\AI;

use App\Models\Team;
use App\Models\TeamAiQuota;
use App\Models\TeamSubscription;
use App\Models\User;
use App\Models\UserSubscription;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TeamAiQuotaService
{
    protected const BASE_FREE_QUOTA = 10;
    protected const QUOTA_PERIOD_HOURS = 120; // 5 days for free reset

    /**
     * Compute effective AI quota limit and tier metadata based on team and user active subscriptions.
     */
    public function getPlanMetadata(Team $team, ?User $user = null): array
    {
        $baseLimit = self::BASE_FREE_QUOTA;
        $planNames = [];
        $isPro = false;
        $hasBonus = false;

        // 1. Team-level subscription (RAKIT Team - pooled credits)
        $teamSub = TeamSubscription::where('team_id', $team->id)
            ->where('status', 'active')
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->latest()
            ->first();

        if ($teamSub) {
            $baseLimit += (int) $teamSub->ai_credits_pooled;
            $planNames[] = 'RAKIT Team (+' . $teamSub->ai_credits_pooled . ' Pooled)';
            $hasBonus = true;
        }

        // 2. User-level subscription (AI Pass, Pro Monthly, Semester Pass)
        $targetUser = $user ?? $team->leader;
        if ($targetUser) {
            if ($targetUser->isPlatformAdmin()) {
                $hasBonus = true;
                $isPro = true;
                $baseLimit += 500;
                $planNames[] = 'Admin VIP (500 Sesi)';
            }

            $userSub = UserSubscription::where('user_id', $targetUser->id)
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->latest()
                ->first();

            if ($userSub) {
                $hasBonus = true;
                $bonus = (int) $userSub->ai_credits_bonus;
                $baseLimit += $bonus;

                if ($userSub->plan_type === 'ai_pass') {
                    $planNames[] = 'AI Pass (+' . $bonus . ' Kredit)';
                } elseif ($userSub->plan_type === 'pro_monthly') {
                    $isPro = true;
                    $planNames[] = 'RAKIT Pro (100 Sesi/Bln)';
                } elseif ($userSub->plan_type === 'semester_pass') {
                    $isPro = true;
                    $planNames[] = 'RAKIT Semester (300 Sesi)';
                }
            }
        }

        $tierLabel = !empty($planNames) ? implode(' + ', $planNames) : 'Paket Free (10 Sesi/5 Hari)';

        return [
            'limit' => $baseLimit,
            'plan_name' => !empty($planNames) ? $planNames[0] : 'Free',
            'is_pro' => $isPro,
            'has_bonus' => $hasBonus,
            'tier_label' => $tierLabel,
        ];
    }

    /**
     * Get quota info for a team. Returns dynamic quota details without modifying data.
     */
    public function getQuotaInfo(Team $team, ?User $user = null): array
    {
        $planMeta = $this->getPlanMetadata($team, $user);
        $effectiveLimit = $planMeta['limit'];

        $quota = TeamAiQuota::where('team_id', $team->id)->first();

        if (!$quota || $quota->isExpired()) {
            return [
                'quota_limit' => $effectiveLimit,
                'quota_used' => 0,
                'quota_remaining' => $effectiveLimit,
                'period_started_at' => null,
                'period_expires_at' => null,
                'reset_in_seconds' => null,
                'is_exhausted' => false,
                'plan_name' => $planMeta['plan_name'],
                'is_pro' => $planMeta['is_pro'],
                'tier_label' => $planMeta['tier_label'],
                'has_bonus' => $planMeta['has_bonus'],
            ];
        }

        $remaining = max(0, $effectiveLimit - $quota->quota_used);

        return [
            'quota_limit' => $effectiveLimit,
            'quota_used' => $quota->quota_used,
            'quota_remaining' => $remaining,
            'period_started_at' => $quota->period_started_at?->toIso8601String(),
            'period_expires_at' => $quota->period_expires_at?->toIso8601String(),
            'reset_in_seconds' => $quota->getResetInSeconds(),
            'is_exhausted' => $remaining === 0,
            'plan_name' => $planMeta['plan_name'],
            'is_pro' => $planMeta['is_pro'],
            'tier_label' => $planMeta['tier_label'],
            'has_bonus' => $planMeta['has_bonus'],
        ];
    }

    /**
     * Atomically reserve a quota slot. Returns true on success, false if exhausted.
     * Uses DB transaction + row-level lock + idempotency key.
     */
    public function reserveQuota(Team $team, string $idempotencyKey, ?User $user = null): bool
    {
        return DB::transaction(function () use ($team, $idempotencyKey, $user) {
            $planMeta = $this->getPlanMetadata($team, $user);
            $effectiveLimit = $planMeta['limit'];

            // Lock or create the quota row
            $quota = TeamAiQuota::lockForUpdate()
                ->where('team_id', $team->id)
                ->first();

            if (!$quota) {
                $quota = new TeamAiQuota([
                    'team_id' => $team->id,
                    'quota_limit' => $effectiveLimit,
                    'quota_used' => 0,
                    'idempotency_keys' => [],
                ]);
            } else {
                // Keep limit dynamically synchronized with subscription state
                $quota->quota_limit = $effectiveLimit;
            }

            // If period expired and user doesn't have lifetime bonus, reset period
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
                return true;
            }

            // Check exhaustion
            if ($quota->quota_used >= $effectiveLimit) {
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
