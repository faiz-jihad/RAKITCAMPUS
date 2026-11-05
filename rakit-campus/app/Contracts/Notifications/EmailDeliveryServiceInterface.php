<?php

namespace App\Contracts\Notifications;

use App\Models\User;

interface EmailDeliveryServiceInterface
{
    /**
     * Inspect email provider configuration and health status.
     * Never exposes plain-text passwords or secret keys.
     */
    public function inspectConfiguration(): array;

    /**
     * Deliver transactional email safely with error trapping and delivery logging.
     */
    public function deliver(
        string $toEmail,
        string $toName,
        string $subject,
        array $templatePayload,
        string $notificationType = 'transactional',
        string $category = 'general',
        string $priority = 'medium',
        ?int $recipientId = null,
        ?string $idempotencyKey = null
    ): array;

    /**
     * Send test email to verify credentials without affecting business logic.
     */
    public function sendTestEmail(string $targetEmail, ?User $actor = null): array;
}
