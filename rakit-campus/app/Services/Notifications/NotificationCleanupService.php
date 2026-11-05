<?php

namespace App\Services\Notifications;

use App\Models\NotificationDeliveryLog;
use Illuminate\Support\Facades\DB;

class NotificationCleanupService
{
    /**
     * Prune old read notifications and old delivery logs.
     */
    public function cleanup(int $daysToKeep = 90): array
    {
        $cutoff = now()->subDays($daysToKeep);

        // Delete read database notifications older than cutoff
        $deletedNotifications = DB::table('notifications')
            ->whereNotNull('read_at')
            ->where('read_at', '<', $cutoff)
            ->delete();

        // Delete successful or skipped delivery logs older than cutoff
        $deletedLogs = NotificationDeliveryLog::where('created_at', '<', $cutoff)
            ->whereIn('status', ['sent', 'skipped'])
            ->delete();

        return [
            'deleted_notifications' => $deletedNotifications,
            'deleted_logs' => $deletedLogs,
            'cutoff_date' => $cutoff->toDateTimeString(),
        ];
    }
}
