<?php

namespace App\Services\Notifications;

use App\Contracts\Notifications\NotificationLogServiceInterface;
use App\Models\NotificationDeliveryLog;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;

class NotificationLogService implements NotificationLogServiceInterface
{
    /**
     * Check if an idempotent delivery already happened within a time window.
     */
    public function hasDuplicate(?string $idempotencyKey, int $withinSeconds = 300): bool
    {
        if (empty($idempotencyKey)) {
            return false;
        }

        // Fast path: check atomic memory / cache key
        if (Cache::has("notif_processed:{$idempotencyKey}")) {
            return true;
        }

        return NotificationDeliveryLog::where(function ($q) use ($idempotencyKey) {
                $q->where('idempotency_key', $idempotencyKey)
                  ->orWhere('idempotency_key', 'like', $idempotencyKey . '_%');
            })
            ->where('created_at', '>=', now()->subSeconds($withinSeconds))
            ->whereIn('status', ['sent', 'queued'])
            ->exists();
    }

    /**
     * Acquire atomic concurrency lock for an idempotency key to prevent race conditions under 1000+ users.
     */
    public function acquireLock(string $idempotencyKey, int $seconds = 10): bool
    {
        if (empty($idempotencyKey)) {
            return true;
        }

        return (bool) Cache::lock("notif_lock:{$idempotencyKey}", $seconds)->get();
    }

    /**
     * Release atomic concurrency lock for an idempotency key.
     */
    public function releaseLock(string $idempotencyKey): void
    {
        if (!empty($idempotencyKey)) {
            Cache::lock("notif_lock:{$idempotencyKey}")->forceRelease();
        }
    }

    /**
     * Create initial log entry.
     */
    public function createLog(array $attributes): NotificationDeliveryLog
    {
        $log = NotificationDeliveryLog::create(array_merge([
            'status' => 'queued',
            'last_attempted_at' => now(),
        ], $attributes));

        if (!empty($log->idempotency_key)) {
            Cache::put("notif_processed:{$log->idempotency_key}", true, 300);
        }

        return $log;
    }

    /**
     * Mark delivery as successfully sent.
     */
    public function markSent(NotificationDeliveryLog $log): void
    {
        $log->update([
            'status' => 'sent',
            'sent_at' => now(),
            'error_message' => null,
            'last_attempted_at' => now(),
        ]);
    }

    /**
     * Mark delivery as failed.
     */
    public function markFailed(NotificationDeliveryLog $log, string $errorMessage): void
    {
        $log->increment('retry_count');
        $log->update([
            'status' => 'failed',
            'error_message' => $errorMessage,
            'last_attempted_at' => now(),
        ]);
    }

    /**
     * Mark delivery as skipped (e.g. by user preferences or duplicate).
     */
    public function markSkipped(NotificationDeliveryLog $log, string $reason): void
    {
        $log->update([
            'status' => 'skipped',
            'error_message' => $reason,
        ]);
    }

    /**
     * Get aggregate statistics for monitoring.
     */
    public function getStatistics(): array
    {
        $total = NotificationDeliveryLog::count();
        $sent = NotificationDeliveryLog::where('status', 'sent')->count();
        $failed = NotificationDeliveryLog::where('status', 'failed')->count();
        $queued = NotificationDeliveryLog::where('status', 'queued')->count();
        $skipped = NotificationDeliveryLog::where('status', 'skipped')->count();

        $lastSuccess = NotificationDeliveryLog::where('status', 'sent')
            ->latest('sent_at')
            ->first();

        $lastFailure = NotificationDeliveryLog::where('status', 'failed')
            ->latest('last_attempted_at')
            ->first();

        return [
            'total' => $total,
            'sent' => $sent,
            'failed' => $failed,
            'queued' => $queued,
            'skipped' => $skipped,
            'success_rate' => $total > 0 ? round(($sent / $total) * 100, 1) : 100,
            'last_successful_at' => $lastSuccess?->sent_at?->diffForHumans() ?? 'Belum ada',
            'last_failure_at' => $lastFailure?->last_attempted_at?->diffForHumans() ?? 'Tidak ada',
            'last_failure_reason' => $lastFailure?->error_message ?? null,
        ];
    }

    /**
     * Paginate delivery logs with search and filters.
     */
    public function getPaginatedLogs(int $perPage = 25, array $filters = []): LengthAwarePaginator
    {
        return NotificationDeliveryLog::with('recipient:id,name,email')
            ->when(!empty($filters['status']), fn ($q) => $q->where('status', $filters['status']))
            ->when(!empty($filters['channel']), fn ($q) => $q->where('channel', $filters['channel']))
            ->when(!empty($filters['category']), fn ($q) => $q->where('category', $filters['category']))
            ->when(!empty($filters['search']), function ($q) use ($filters) {
                $term = '%' . $filters['search'] . '%';
                $q->where(function ($sub) use ($term) {
                    $sub->where('recipient_email', 'like', $term)
                        ->orWhere('subject', 'like', $term)
                        ->orWhere('notification_type', 'like', $term);
                });
            })
            ->latest()
            ->paginate($perPage);
    }
}
