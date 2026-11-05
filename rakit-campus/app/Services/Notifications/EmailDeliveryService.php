<?php

namespace App\Services\Notifications;

use App\Contracts\Notifications\EmailDeliveryServiceInterface;
use App\Contracts\Notifications\NotificationLogServiceInterface;
use App\Contracts\Notifications\NotificationTemplateServiceInterface;
use App\Models\NotificationDeliveryLog;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Throwable;

class EmailDeliveryService implements EmailDeliveryServiceInterface
{
    public function __construct(
        protected NotificationTemplateServiceInterface $templateService,
        protected NotificationLogServiceInterface $logService
    ) {}

    /**
     * Inspect email provider configuration and health status.
     * Never exposes plain-text passwords or secret keys.
     */
    public function inspectConfiguration(): array
    {
        $mailer = config('mail.default', 'log');
        $fromAddress = config('mail.from.address');
        $fromName = config('mail.from.name');

        $smtpHost = config('mail.mailers.smtp.host');
        $smtpPort = config('mail.mailers.smtp.port');
        $smtpUser = config('mail.mailers.smtp.username');
        $smtpPass = config('mail.mailers.smtp.password');
        $smtpEncryption = config('mail.mailers.smtp.encryption');

        $isConfigured = false;
        $statusLabel = 'NOT CONFIGURED';
        $healthNote = '';

        if ($mailer === 'smtp') {
            $hasHost = !empty($smtpHost) && $smtpHost !== '127.0.0.1' && $smtpHost !== 'localhost';
            $hasUser = !empty($smtpUser);
            $hasPass = !empty($smtpPass);
            $hasFrom = !empty($fromAddress) && $fromAddress !== 'hello@example.com';

            if ($hasHost && $hasUser && $hasPass && $hasFrom) {
                $isConfigured = true;
                $statusLabel = 'CONFIGURED (SMTP)';
                $healthNote = 'SMTP provider credentials configured for outbound transactional delivery.';
            } else {
                $isConfigured = false;
                $statusLabel = 'NOT CONFIGURED';
                $missing = [];
                if (!$hasHost) $missing[] = 'MAIL_HOST';
                if (!$hasUser) $missing[] = 'MAIL_USERNAME';
                if (!$hasPass) $missing[] = 'MAIL_PASSWORD';
                if (!$hasFrom) $missing[] = 'MAIL_FROM_ADDRESS';
                $healthNote = 'Kredensial SMTP belum lengkap: ' . implode(', ', $missing) . '. Email nyata belum dapat terkirim.';
            }
        } elseif ($mailer === 'log') {
            $isConfigured = true;
            $statusLabel = 'CONFIGURED (LOG DRIVER)';
            $healthNote = 'Driver disetel ke "log". Email akan dicatat ke storage/logs/laravel.log tanpa pengiriman ke jaringan publik.';
        } elseif ($mailer === 'array') {
            $isConfigured = true;
            $statusLabel = 'TESTING (ARRAY)';
            $healthNote = 'Driver disetel ke memory array untuk keperluan automated unit testing.';
        } else {
            $statusLabel = strtoupper($mailer) . ' DRIVER';
            $isConfigured = !empty($fromAddress);
            $healthNote = "Driver {$mailer} aktif.";
        }

        return [
            'mailer' => $mailer,
            'is_configured' => $isConfigured,
            'status' => $statusLabel,
            'note' => $healthNote,
            'host' => $mailer === 'smtp' ? $smtpHost : '-',
            'port' => $mailer === 'smtp' ? $smtpPort : '-',
            'encryption' => $mailer === 'smtp' ? ($smtpEncryption ?: 'none') : '-',
            'username' => !empty($smtpUser) ? substr($smtpUser, 0, 3) . '***' . substr($smtpUser, -2) : 'null',
            'has_password' => !empty($smtpPass),
            'from_address' => $fromAddress ?: 'Belum diisi',
            'from_name' => $fromName ?: 'RAKIT Campus',
        ];
    }

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
    ): array {
        $html = $this->templateService->renderHtml($templatePayload);
        $text = $this->templateService->renderText($templatePayload);

        $log = $this->logService->createLog([
            'idempotency_key' => $idempotencyKey,
            'notification_type' => $notificationType,
            'category' => $category,
            'priority' => $priority,
            'channel' => 'email',
            'recipient_id' => $recipientId,
            'recipient_email' => $toEmail,
            'subject' => $subject,
            'status' => 'queued',
            'metadata' => [
                'recipient_name' => $toName,
                'action_url' => $templatePayload['action_url'] ?? null,
            ],
        ]);

        try {
            Mail::send([], [], function ($message) use ($toEmail, $toName, $subject, $html, $text) {
                $message->to($toEmail, $toName)
                    ->subject($subject)
                    ->html($html)
                    ->text($text);
            });

            $this->logService->markSent($log);

            return [
                'success' => true,
                'log_id' => $log->id,
                'message' => 'Email berhasil dikirimkan ke provider mail.',
            ];
        } catch (Throwable $e) {
            $this->logService->markFailed($log, $e->getMessage());

            return [
                'success' => false,
                'log_id' => $log->id,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Send test email to verify credentials without affecting business logic.
     */
    public function sendTestEmail(string $targetEmail, ?User $actor = null): array
    {
        $payload = [
            'title' => 'Tes Pengiriman Email RAKIT Campus',
            'greeting' => 'Halo Administrator,',
            'message' => 'Ini adalah pesan email pengujian untuk memverifikasi bahwa konfigurasi email dan infrastruktur pengiriman RAKIT Campus berjalan dengan normal.',
            'category_name' => 'Email Test',
            'action_url' => url('/admin/notifications'),
            'action_text' => 'Buka Admin Monitoring',
            'details' => [
                'Waktu Pengujian' => now()->format('Y-m-d H:i:s T'),
                'Mailer Driver' => config('mail.default'),
                'Inisiator' => $actor ? "{$actor->name} ({$actor->email})" : 'System Admin',
            ],
        ];

        return $this->deliver(
            toEmail: $targetEmail,
            toName: $actor ? $actor->name : 'Administrator',
            subject: '[Test] Verifikasi Sistem Notifikasi RAKIT Campus',
            templatePayload: $payload,
            notificationType: 'admin_test_email',
            category: 'account_security',
            priority: 'high',
            recipientId: $actor?->id,
            idempotencyKey: 'test_mail_' . uniqid()
        );
    }
}
