<?php

namespace App\Services\Notifications;

use App\Models\NotificationDeliveryLog;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Throwable;

class NotificationQueueService
{
    /**
     * Inspect queue health metrics.
     */
    public function inspectQueueHealth(): array
    {
        $connection = config('queue.default', 'database');
        $pendingJobs = 0;
        $failedJobs = 0;

        try {
            if ($connection === 'database') {
                $pendingJobs = DB::table('jobs')->count();
            }
            $failedJobs = DB::table('failed_jobs')->count();
        } catch (Throwable) {
            // DB table might not exist in some setups
        }

        return [
            'connection' => $connection,
            'pending_jobs' => $pendingJobs,
            'failed_jobs' => $failedJobs,
            'status' => $failedJobs > 0 ? 'WARNING (FAILED JOBS EXIST)' : 'HEALTHY',
        ];
    }

    /**
     * Retry a failed notification delivery log.
     */
    public function retryLog(int $logId, EmailDeliveryService $emailDelivery): array
    {
        $log = NotificationDeliveryLog::findOrFail($logId);

        if ($log->channel !== 'email' || empty($log->recipient_email)) {
            return [
                'success' => false,
                'message' => 'Hanya log email dengan alamat tujuan valid yang dapat di-retry.',
            ];
        }

        $metadata = $log->metadata ?? [];
        $payload = [
            'title' => $log->subject ?? 'Notifikasi RAKIT Campus',
            'greeting' => 'Halo ' . ($metadata['recipient_name'] ?? 'Rekan RAKIT') . ',',
            'message' => 'Pengiriman ulang notifikasi: ' . ($log->subject ?? ''),
            'category_name' => ucfirst(str_replace('_', ' ', $log->category)),
            'action_url' => $metadata['action_url'] ?? null,
            'details' => [
                'Tipe Notifikasi' => $log->notification_type,
                'Prioritas' => strtoupper($log->priority),
                'Upaya Ulang' => 'Ke-' . ($log->retry_count + 1),
            ],
        ];

        return $emailDelivery->deliver(
            toEmail: $log->recipient_email,
            toName: $metadata['recipient_name'] ?? 'Rekan RAKIT',
            subject: $log->subject ?? 'Notifikasi RAKIT Campus',
            templatePayload: $payload,
            notificationType: $log->notification_type,
            category: $log->category,
            priority: $log->priority,
            recipientId: $log->recipient_id,
            idempotencyKey: 'retry_' . $log->id . '_' . time()
        );
    }

    /**
     * Retry a failed job from the failed_jobs table.
     */
    public function retryFailedJob(string $uuid): bool
    {
        try {
            $exitCode = Artisan::call('queue:retry', ['id' => [$uuid]]);
            return $exitCode === 0;
        } catch (Throwable) {
            return false;
        }
    }
}
