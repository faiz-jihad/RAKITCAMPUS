<?php

namespace App\Services\Notifications\Channels;

use App\Contracts\Notifications\NotificationChannelInterface;
use App\Contracts\Notifications\NotificationPreferenceServiceInterface;
use App\Models\User;
use App\Notifications\RakitUnifiedNotification;

class EmailNotificationChannel implements NotificationChannelInterface
{
    public function __construct(
        protected NotificationPreferenceServiceInterface $preferenceService
    ) {}

    public function channelName(): string
    {
        return 'mail';
    }

    public function isAvailable(User $user, string $category, string $priority = 'medium'): bool
    {
        return $this->preferenceService->shouldSendEmail($user, $category, $priority);
    }

    public function send(User $user, RakitUnifiedNotification $notification): bool
    {
        // Handled via Laravel notification mail channel
        return true;
    }
}
