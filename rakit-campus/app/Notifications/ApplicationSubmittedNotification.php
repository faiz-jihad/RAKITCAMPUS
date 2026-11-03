<?php

namespace App\Notifications;

use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ApplicationSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(public Application $application)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $this->application->loadMissing(['user', 'recruitment.team']);
        $applicantName = $this->application->user?->name;
        $teamName = $this->application->recruitment?->team?->name;

        return [
            'type' => 'application_submitted',
            'application_id' => $this->application->id,
            'applicant_name' => $applicantName,
            'team_name' => $teamName,
            'message' => "{$applicantName} mengajukan lamaran untuk bergabung dengan tim {$teamName}.",
        ];
    }
}
