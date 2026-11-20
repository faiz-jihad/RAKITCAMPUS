<?php

namespace App\Notifications;

use App\Contracts\Notifications\NotificationCounterInterface;
use App\Contracts\Notifications\NotificationLogServiceInterface;
use App\Contracts\Notifications\NotificationPreferenceServiceInterface;
use App\Contracts\Notifications\NotificationTemplateServiceInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class RakitUnifiedNotification extends Notification implements ShouldQueue, ShouldBroadcastNow
{
    use Queueable;

    public function __construct(
        public string $notificationType = 'general_notification',
        public string $category = 'project_hub',
        public string $title = 'Notifikasi Baru',
        public string $message = '',
        public string $priority = 'medium',
        public ?string $actionUrl = null,
        public ?string $actionText = 'Lihat Detail',
        public ?string $entityType = null,
        public string|int|null $entityId = null,
        public array $details = [],
        public ?string $idempotencyKey = null,
        // Optional alias parameters to prevent PHP 8 named argument mismatches
        ?string $type = null,
        ?string $body = null,
        ?string $icon = null,
        public ?array $channels = null
    ) {
        if ($type !== null) {
            $this->notificationType = $type;
        }
        if ($body !== null) {
            $this->message = $body;
        }
        $this->idempotencyKey = $idempotencyKey ?: 'notif_' . Str::uuid();
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        if (!empty($this->channels)) {
            return $this->channels;
        }

        $preferenceService = app(NotificationPreferenceServiceInterface::class);
        $logService = app(NotificationLogServiceInterface::class);

        // Check deduplication
        if ($logService->hasDuplicate($this->idempotencyKey, 60)) {
            return [];
        }

        $channels = [];

        if ($preferenceService->shouldSendInApp($notifiable, $this->category)) {
            $channels[] = 'database';
            $broadcaster = config('broadcasting.default');
            if ($broadcaster && !in_array($broadcaster, ['log', 'null', 'none'], true)) {
                $channels[] = 'broadcast';
            }
        }

        if ($preferenceService->shouldSendEmail($notifiable, $this->category, $this->priority)) {
            $channels[] = 'mail';
        }

        return $channels;
    }

    /**
     * Alias for toDatabase to support standard Laravel array notification channel
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage([
            'id' => (string) Str::uuid(),
            'notification_type' => $this->notificationType,
            'category' => $this->category,
            'priority' => $this->priority,
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->actionUrl,
            'action_text' => $this->actionText,
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
            'details' => $this->details,
            'created_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Store in-app notification in database.
     */
    public function toDatabase(object $notifiable): array
    {
        $logService = app(NotificationLogServiceInterface::class);

        $log = $logService->createLog([
            'idempotency_key' => $this->idempotencyKey . '_inapp',
            'notification_type' => $this->notificationType,
            'category' => $this->category,
            'priority' => $this->priority,
            'channel' => 'in_app',
            'recipient_id' => $notifiable->id ?? null,
            'recipient_email' => $notifiable->email ?? null,
            'subject' => $this->title,
            'status' => 'sent',
            'sent_at' => now(),
            'metadata' => [
                'action_url' => $this->actionUrl,
                'entity_type' => $this->entityType,
                'entity_id' => $this->entityId,
            ],
        ]);

        if (isset($notifiable->id)) {
            app(NotificationCounterInterface::class)->invalidateUnreadCountCache($notifiable->id);
        }

        return [
            'id' => (string) Str::uuid(),
            'notification_type' => $this->notificationType,
            'category' => $this->category,
            'priority' => $this->priority,
            'title' => $this->title,
            'message' => $this->message,
            'action_url' => $this->actionUrl,
            'action_text' => $this->actionText,
            'entity_type' => $this->entityType,
            'entity_id' => $this->entityId,
            'details' => $this->details,
            'created_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Build the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $templateService = app(NotificationTemplateServiceInterface::class);
        $logService = app(NotificationLogServiceInterface::class);

        $payload = [
            'title' => $this->title,
            'greeting' => 'Halo ' . ($notifiable->name ?? 'Rekan Mahasiswa') . ',',
            'message' => $this->message,
            'category_name' => ucfirst(str_replace('_', ' ', $this->category)),
            'action_url' => $this->actionUrl,
            'action_text' => $this->actionText,
            'details' => $this->details,
            'recipient_email' => $notifiable->email ?? null,
        ];

        $html = $templateService->renderHtml($payload);
        $text = $templateService->renderText($payload);

        // Record queued/sent status in logs
        $log = $logService->createLog([
            'idempotency_key' => $this->idempotencyKey . '_email',
            'notification_type' => $this->notificationType,
            'category' => $this->category,
            'priority' => $this->priority,
            'channel' => 'email',
            'recipient_id' => $notifiable->id ?? null,
            'recipient_email' => $notifiable->email ?? null,
            'subject' => $this->title,
            'status' => 'sent',
            'sent_at' => now(),
            'metadata' => [
                'action_url' => $this->actionUrl,
            ],
        ]);

        $viewData = [
            'htmlContent' => $html,
            'textContent' => $text,
        ];

        return (new MailMessage)
            ->subject($this->title)
            ->view('emails.unified-notification', $viewData)
            ->text('emails.unified-notification-text', $viewData);
    }
}
