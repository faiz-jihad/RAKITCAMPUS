<?php

namespace App\Contracts\Notifications;

use App\Services\Notifications\EmailDeliveryService;

interface NotificationQueueServiceInterface
{
    /**
     * Inspect queue health metrics.
     */
    public function inspectQueueHealth(): array;

    /**
     * Retry a failed notification delivery log.
     */
    public function retryLog(int $logId, EmailDeliveryService $emailDelivery): array;
}
