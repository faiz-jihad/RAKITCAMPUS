<?php

namespace App\Jobs;

use App\Contracts\Notifications\NotificationServiceInterface;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class BulkNotificationDispatchJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     *
     * @param array<int>|null $recipientIds If null, targets all active students
     */
    public function __construct(
        public string $notificationType,
        public string $category,
        public string $title,
        public string $message,
        public array $options = [],
        public ?array $recipientIds = null
    ) {
        $this->afterCommit = true;
    }

    /**
     * Execute the job in chunked batches (O(1) memory for 1000+ users).
     */
    public function handle(NotificationServiceInterface $notificationService): void
    {
        $query = User::query()->where('status', 'active');

        if (!empty($this->recipientIds)) {
            $query->whereIn('id', $this->recipientIds);
        } else {
            // Default target: active students
            $query->whereHas('studentProfile');
        }

        // Process in fixed-size memory batches to prevent OOM
        $query->chunkById(100, function ($users) use ($notificationService) {
            $notificationService->notify(
                recipients: $users,
                notificationType: $this->notificationType,
                category: $this->category,
                title: $this->title,
                message: $this->message,
                options: $this->options
            );
        });
    }
}
