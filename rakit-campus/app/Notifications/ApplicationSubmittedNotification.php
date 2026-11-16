<?php

namespace App\Notifications;

use App\Contracts\Notifications\NotificationCounterInterface;
use App\Contracts\Notifications\NotificationTemplateServiceInterface;
use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Application $application)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray(object $notifiable): array
    {
        $this->application->loadMissing(['user', 'role', 'recruitment.team.project']);
        $applicantName = $this->application->user?->name ?? 'Mahasiswa';
        $team = $this->application->recruitment?->team;
        $project = $team?->project;
        $teamName = $team?->name ?? 'Tim Proyek';
        $projectTitle = $project?->title ?? $teamName;
        $roleName = $this->application->role?->name;

        $message = $roleName
            ? "{$applicantName} mengajukan diri untuk bergabung ke proyek \"{$projectTitle}\" pada posisi {$roleName}."
            : "{$applicantName} mengajukan diri untuk bergabung ke proyek \"{$projectTitle}\".";

        $details = [
            'Pelamar' => $applicantName,
            'Proyek' => $projectTitle,
        ];
        if ($roleName) {
            $details['Posisi'] = $roleName;
        }
        $details['Keterangan'] = 'Mengajukan diri untuk bergabung ke tim';

        if (isset($notifiable->id)) {
            app(NotificationCounterInterface::class)->invalidateUnreadCountCache($notifiable->id);
        }

        return [
            'type' => 'application_submitted',
            'notification_type' => 'project_application_submitted',
            'category' => 'project_hub',
            'priority' => 'high',
            'application_id' => $this->application->id,
            'project_id' => $project?->id,
            'applicant_id' => $this->application->user_id,
            'applicant_name' => $applicantName,
            'team_name' => $teamName,
            'project_title' => $projectTitle,
            'role_name' => $roleName,
            'title' => "Pengajuan Anggota Baru: {$projectTitle}",
            'message' => $message,
            'action_url' => $project ? "/projects/{$project->id}?tab=members#applications-section" : '/projects',
            'action_text' => 'Kelola Pengajuan Anggota',
            'details' => $details,
            'created_at' => now()->toIso8601String(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $this->application->loadMissing(['user', 'role', 'recruitment.team.project']);
        $applicantName = $this->application->user?->name ?? 'Mahasiswa';
        $team = $this->application->recruitment?->team;
        $project = $team?->project;
        $teamName = $team?->name ?? 'Tim Proyek';
        $projectTitle = $project?->title ?? $teamName;
        $roleName = $this->application->role?->name;

        $title = "Pengajuan Anggota Baru: {$projectTitle}";
        $message = "Halo, {$applicantName} baru saja mengirimkan lamaran untuk bergabung dengan tim Anda pada proyek \"{$projectTitle}\"" . ($roleName ? " sebagai {$roleName}." : ".");

        $actionUrl = url($project ? "/projects/{$project->id}?tab=members#applications-section" : '/dashboard');
        $actionText = 'Tinjau Pengajuan Mahasiswa';

        $details = [
            'Nama Pelamar' => $applicantName,
            'Target Proyek' => $projectTitle,
            'Nama Tim' => $teamName,
        ];
        if ($roleName) {
            $details['Posisi Dilamar'] = $roleName;
        }
        $details['Waktu Pengajuan'] = now()->format('d M Y, H:i T');

        $templateService = app(NotificationTemplateServiceInterface::class);
        $payload = [
            'title' => $title,
            'greeting' => 'Halo ' . ($notifiable->name ?? 'Ketua Tim') . ',',
            'message' => $message,
            'category_name' => 'Project Hub',
            'action_url' => $actionUrl,
            'action_text' => $actionText,
            'details' => $details,
        ];

        $html = $templateService->renderHtml($payload);
        $text = $templateService->renderText($payload);

        return (new MailMessage)
            ->subject($title)
            ->view('emails.unified-notification', ['htmlContent' => $html, 'textContent' => $text])
            ->text('emails.unified-notification-text', ['htmlContent' => $html, 'textContent' => $text]);
    }
}
