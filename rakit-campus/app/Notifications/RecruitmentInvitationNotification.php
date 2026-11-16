<?php

namespace App\Notifications;

use App\Contracts\Notifications\NotificationCounterInterface;
use App\Contracts\Notifications\NotificationTemplateServiceInterface;
use App\Models\Invitation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RecruitmentInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Invitation $invitation)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray(object $notifiable): array
    {
        $this->invitation->loadMissing(['team.project', 'inviter', 'role']);
        $teamName = $this->invitation->team?->name ?? 'Tim Proyek';
        $project = $this->invitation->team?->project;
        $projectTitle = $project?->title ?? $teamName;
        $roleName = $this->invitation->role?->name ?? $this->invitation->role_name ?? 'Kolaborator';
        $inviterName = $this->invitation->inviter?->name ?? 'Mahasiswa';

        if (isset($notifiable->id)) {
            app(NotificationCounterInterface::class)->invalidateUnreadCountCache($notifiable->id);
        }

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

    public function toMail(object $notifiable): MailMessage
    {
        $this->invitation->loadMissing(['team.project', 'inviter', 'role']);
        $teamName = $this->invitation->team?->name ?? 'Tim Proyek';
        $project = $this->invitation->team?->project;
        $projectTitle = $project?->title ?? $teamName;
        $roleName = $this->invitation->role?->name ?? $this->invitation->role_name ?? 'Kolaborator';
        $inviterName = $this->invitation->inviter?->name ?? 'Mahasiswa';

        $title = "Undangan Kolaborasi: {$teamName}";
        $message = "Halo, {$inviterName} mengajak Anda untuk bergabung dan berkolaborasi dalam tim \"{$teamName}\" pada proyek \"{$projectTitle}\" untuk mengisi posisi {$roleName}.";

        $actionUrl = url('/dashboard#undangan-kolaborasi');
        $actionText = 'Lihat & Tanggapi Undangan';

        $templateService = app(NotificationTemplateServiceInterface::class);
        $payload = [
            'title' => $title,
            'greeting' => 'Halo ' . ($notifiable->name ?? 'Mahasiswa') . ',',
            'message' => $message,
            'category_name' => 'Project Hub',
            'action_url' => $actionUrl,
            'action_text' => $actionText,
            'details' => [
                'Tim Pengundang' => $teamName,
                'Proyek' => $projectTitle,
                'Posisi Ditawarkan' => $roleName,
                'Pengundang' => $inviterName,
                'Waktu Undangan' => now()->format('d M Y, H:i T'),
            ],
        ];

        $html = $templateService->renderHtml($payload);
        $text = $templateService->renderText($payload);

        return (new MailMessage)
            ->subject($title)
            ->view('emails.unified-notification', ['htmlContent' => $html, 'textContent' => $text])
            ->text('emails.unified-notification-text', ['htmlContent' => $html, 'textContent' => $text]);
    }
}
