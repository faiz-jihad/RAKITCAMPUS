<?php

namespace App\Services\Notifications\Channels;

use App\Contracts\Notifications\NotificationChannelInterface;
use App\Contracts\Notifications\NotificationPreferenceServiceInterface;
use App\Models\User;
use App\Notifications\RakitUnifiedNotification;

class InAppNotificationChannel implements NotificationChannelInterface
{
    public function __construct(
        protected NotificationPreferenceServiceInterface $preferenceService
    ) {}

    public function channelName(): string
    {
        return 'database';
    }

    public function isAvailable(User $user, string $category, string $priority = 'medium'): bool
    {
        return $this->preferenceService->shouldSendInApp($user, $category);
    }

    public function send(User $user, RakitUnifiedNotification $notification): bool
    {
        // Handled via Laravel notification database channel
        return true;
    }
}
