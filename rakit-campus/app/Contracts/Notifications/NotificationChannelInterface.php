<?php

namespace App\Contracts\Notifications;

use App\Models\User;
use App\Notifications\RakitUnifiedNotification;

/**
 * Open/Closed Principle:
 * Pluggable notification channel interface for supporting in-app, email,
 * and future channels (SMS, WhatsApp, WebPush) without modifying core dispatcher.
 */
interface NotificationChannelInterface
{
    /**
     * Unique identifier of the notification channel (e.g. 'database', 'mail', 'whatsapp').
     */
    public function channelName(): string;

    /**
     * Determine if this channel is applicable and allowed for the given user and category.
     */
    public function isAvailable(User $user, string $category, string $priority = 'medium'): bool;

    /**
     * Send or format the notification for this specific channel.
     */
    public function send(User $user, RakitUnifiedNotification $notification): bool;
}
