<?php

namespace App\Contracts\Notifications;

use App\Models\NotificationDeliveryLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface NotificationLogServiceInterface
{
    /**
     * Check if an idempotent delivery already happened within a time window.
     */
    public function hasDuplicate(?string $idempotencyKey, int $withinSeconds = 300): bool;

    /**
     * Acquire atomic concurrency lock for an idempotency key to prevent race conditions.
     */
    public function acquireLock(string $idempotencyKey, int $seconds = 10): bool;

    /**
     * Release atomic concurrency lock for an idempotency key.
     */
    public function releaseLock(string $idempotencyKey): void;

    /**
     * Create initial log entry.
     */
    public function createLog(array $attributes): NotificationDeliveryLog;

    /**
     * Mark delivery as successfully sent.
     */
    public function markSent(NotificationDeliveryLog $log): void;

    /**
     * Mark delivery as failed.
     */
    public function markFailed(NotificationDeliveryLog $log, string $errorMessage): void;

    /**
     * Mark delivery as skipped.
     */
    public function markSkipped(NotificationDeliveryLog $log, string $reason): void;

    /**
     * Get aggregate statistics for monitoring.
     */
    public function getStatistics(): array;

    /**
     * Paginate delivery logs with search and filters.
     */
    public function getPaginatedLogs(int $perPage = 25, array $filters = []): LengthAwarePaginator;
}
