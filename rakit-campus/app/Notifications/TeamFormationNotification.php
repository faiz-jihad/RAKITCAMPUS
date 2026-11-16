<?php

namespace App\Notifications;

use App\Contracts\Notifications\NotificationCounterInterface;
use App\Contracts\Notifications\NotificationTemplateServiceInterface;
use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TeamFormationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Project $project,
        public string $event,
        public ?string $notes = null,
        public ?string $actorName = null
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray(object $notifiable): array
    {
        $this->project->loadMissing(['team', 'academicClass', 'leader']);
        $teamName = $this->project->team?->name ?? $this->project->title;
        $projectTitle = $this->project->title;
        $classLabel = $this->project->academicClass
            ? "{$this->project->academicClass->name} ({$this->project->academicClass->code})"
            : null;
        $projectSlugOrId = $this->project->slug ?: $this->project->id;

        [$title, $message, $priority, $actionUrl, $actionText] = match ($this->event) {
            'formation_submitted' => [
                "Pengajuan Persetujuan Tim: {$teamName}",
                ($this->actorName ?: $this->project->leader?->name ?: 'Ketua tim') . " mengajukan formasi tim \"{$teamName}\" pada proyek \"{$projectTitle}\" untuk persetujuan dosen.",
                'high',
                '/dashboard#persetujuan-tim',
                'Tinjau Pengajuan Tim',
            ],
            'formation_approved' => [
                "Formasi Tim Disetujui Dosen: {$projectTitle}",
                "Selamat! Pengajuan formasi tim \"{$teamName}\" pada proyek \"{$projectTitle}\" telah disetujui oleh dosen" . ($this->actorName ? " ({$this->actorName})" : '') . '.',
                'high',
                "/projects/{$projectSlugOrId}?tab=formation",
                'Lihat Status Tim',
            ],
            'formation_rejected' => [
                "Pengajuan Tim Ditolak: {$projectTitle}",
                "Pengajuan formasi tim \"{$teamName}\" pada proyek \"{$projectTitle}\" ditolak oleh dosen." . ($this->notes ? " Alasan: {$this->notes}" : ''),
                'high',
                "/projects/{$projectSlugOrId}?tab=formation",
                'Lihat Alasan & Perbaiki',
            ],
            default => [
                "Permintaan Revisi Formasi Tim: {$projectTitle}",
                "Dosen meminta revisi susunan tim \"{$teamName}\" pada proyek \"{$projectTitle}\"." . ($this->notes ? " Catatan: {$this->notes}" : ''),
                'medium',
                "/projects/{$projectSlugOrId}?tab=formation",
                'Lihat Catatan Dosen',
            ],
        };

        if (isset($notifiable->id)) {
            app(NotificationCounterInterface::class)->invalidateUnreadCountCache($notifiable->id);
        }

        return [
            'type' => 'team_formation_' . $this->event,
            'notification_type' => 'team_formation_' . $this->event,
            'category' => 'project_hub',
            'priority' => $priority,
            'project_id' => $this->project->id,
            'project_title' => $projectTitle,
            'team_name' => $teamName,
            'class_name' => $classLabel,
            'event' => $this->event,
            'notes' => $this->notes,
            'actor_name' => $this->actorName,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'action_text' => $actionText,
            'details' => array_filter([
                'Proyek' => $projectTitle,
                'Tim' => $teamName,
                'Kelas' => $classLabel,
                'Keterangan' => $this->notes,
            ]),
            'created_at' => now()->toIso8601String(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $this->project->loadMissing(['team', 'academicClass', 'leader']);
        $teamName = $this->project->team?->name ?? $this->project->title;
        $projectTitle = $this->project->title;
        $classLabel = $this->project->academicClass
            ? "{$this->project->academicClass->name} ({$this->project->academicClass->code})"
            : null;
        $projectSlugOrId = $this->project->slug ?: $this->project->id;

        [$title, $message, $actionUrl, $actionText] = match ($this->event) {
            'formation_submitted' => [
                "Pengajuan Persetujuan Tim: {$teamName}",
                ($this->actorName ?: $this->project->leader?->name ?: 'Ketua tim') . " mengajukan formasi tim \"{$teamName}\" pada proyek \"{$projectTitle}\" untuk persetujuan dosen pembimbing.",
                url('/dashboard#persetujuan-tim'),
                'Tinjau Pengajuan Tim',
            ],
            'formation_approved' => [
                "Formasi Tim Disetujui Dosen: {$projectTitle}",
                "Selamat! Pengajuan formasi tim \"{$teamName}\" pada proyek \"{$projectTitle}\" telah disetujui secara resmi oleh dosen pembimbing" . ($this->actorName ? " ({$this->actorName})" : '') . '.',
                url("/projects/{$projectSlugOrId}?tab=formation"),
                'Buka Status Tim',
            ],
            'formation_rejected' => [
                "Pengajuan Tim Ditolak: {$projectTitle}",
                "Pengajuan formasi tim \"{$teamName}\" pada proyek \"{$projectTitle}\" ditolak oleh dosen." . ($this->notes ? " Catatan: {$this->notes}" : ''),
                url("/projects/{$projectSlugOrId}?tab=formation"),
                'Lihat Evaluasi & Revisi',
            ],
            default => [
                "Permintaan Revisi Formasi Tim: {$projectTitle}",
                "Dosen meminta revisi susunan tim \"{$teamName}\" pada proyek \"{$projectTitle}\"." . ($this->notes ? " Catatan: {$this->notes}" : ''),
                url("/projects/{$projectSlugOrId}?tab=formation"),
                'Lihat Catatan Dosen',
            ],
        };

        $details = array_filter([
            'Proyek' => $projectTitle,
            'Tim' => $teamName,
            'Kelas Akademik' => $classLabel,
            'Catatan Evaluasi' => $this->notes,
            'Waktu' => now()->format('d M Y, H:i T'),
        ]);

        $templateService = app(NotificationTemplateServiceInterface::class);
        $payload = [
            'title' => $title,
            'greeting' => 'Halo ' . ($notifiable->name ?? 'Rekan RAKIT') . ',',
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
