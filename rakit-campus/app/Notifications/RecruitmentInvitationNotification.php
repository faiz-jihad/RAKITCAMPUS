<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RecruitmentInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(public Invitation $invitation)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $this->invitation->loadMissing(['team', 'inviter']);

        return [
            'type' => 'invitation_received',
            'invitation_id' => $this->invitation->id,
            'team_id' => $this->invitation->team_id,
            'team_name' => $this->invitation->team?->name,
            'role_name' => $this->invitation->role_name,
            'inviter_name' => $this->invitation->inviter?->name,
            'message' => "Anda diundang bergabung dengan tim {$this->invitation->team?->name} sebagai {$this->invitation->role_name}.",
        ];
    }
}
