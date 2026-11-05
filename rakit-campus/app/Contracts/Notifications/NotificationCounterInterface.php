<?php

namespace App\Contracts\Notifications;

use App\Models\User;

/**
 * Interface Segregation: Specific contract for unread notification count
 * querying and cache invalidation.
 */
interface NotificationCounterInterface
{
    /**
     * Get cached unread count for user to avoid high-concurrency database load.
     */
    public function getUnreadCount(User $user): int;

    /**
     * Invalidate unread count cache when notifications change.
     */
    public function invalidateUnreadCountCache(User|int $user): void;
}
