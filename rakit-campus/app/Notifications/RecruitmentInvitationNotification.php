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
        $this->invitation->loadMissing(['team.project', 'inviter', 'role']);
        $teamName = $this->invitation->team?->name ?? 'Tim Proyek';
        $project = $this->invitation->team?->project;
        $projectTitle = $project?->title ?? $teamName;
        $roleName = $this->invitation->role?->name ?? $this->invitation->role_name ?? 'Kolaborator';
        $inviterName = $this->invitation->inviter?->name ?? 'Mahasiswa';

        return [
            'type' => 'invitation_received',
            'notification_type' => 'collaboration_invitation_received',
            'category' => 'project_hub',
            'priority' => 'high',
            'invitation_id' => $this->invitation->id,
            'team_id' => $this->invitation->team_id,
            'project_id' => $project?->id,
            'team_name' => $teamName,
            'project_title' => $projectTitle,
            'role_name' => $roleName,
            'inviter_name' => $inviterName,
            'title' => "Undangan Kolaborasi: {$teamName}",
            'message' => "{$inviterName} mengundang Anda bergabung dengan tim \"{$teamName}\" ({$projectTitle}) sebagai {$roleName}.",
            'action_url' => '/dashboard#undangan-kolaborasi',
            'action_text' => 'Tanggapi Undangan',
            'details' => [
                'Tim Pengundang' => $teamName,
                'Proyek' => $projectTitle,
                'Posisi Ditawarkan' => $roleName,
                'Dari' => $inviterName,
            ],
            'created_at' => now()->toIso8601String(),
        ];
    }
}
