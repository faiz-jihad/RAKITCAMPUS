<?php

namespace App\Contracts\Notifications;

use App\Models\User;

interface NotificationPreferenceServiceInterface
{
    /**
     * Get user preferences across all categories, merged with system defaults.
     */
    public function getPreferences(User $user): array;

    /**
     * Update user preferences safely.
     */
    public function updatePreferences(User $user, array $preferences): void;

    /**
     * Check if in-app notification is enabled for this category.
     */
    public function shouldSendInApp(User $user, string $category): bool;

    /**
     * Check if email notification is enabled for this category.
     */
    public function shouldSendEmail(User $user, string $category, string $priority = 'medium'): bool;
}
