<?php

namespace App\Notifications;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ApplicationStatusNotification extends Notification
{
    use Queueable;

    public function __construct(public Application $application, public string $status)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $this->application->loadMissing(['recruitment.team']);
        $teamName = $this->application->recruitment?->team?->name;
        $statusIndo = $this->status === 'accepted' ? 'diterima' : 'ditolak';

        return [
            'type' => 'application_' . $this->status,
            'application_id' => $this->application->id,
            'team_name' => $teamName,
            'status' => $this->status,
            'message' => "Lamaran Anda untuk tim {$teamName} telah {$statusIndo}.",
        ];
    }
}
