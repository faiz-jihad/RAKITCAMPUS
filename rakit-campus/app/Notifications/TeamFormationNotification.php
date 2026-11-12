<?php

namespace App\Notifications;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TeamFormationNotification extends Notification
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
        return ['database'];
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
                'high',
                "/projects/{$projectSlugOrId}?tab=formation",
                'Revisi Formasi Tim',
            ],
        };

        $details = array_filter([
            'Tim' => $teamName,
            'Proyek' => $projectTitle,
            'Kelas' => $classLabel,
            'Catatan' => $this->notes,
        ]);

        return [
            'type' => $this->event,
            'notification_type' => $this->event,
            'category' => 'project_hub',
            'priority' => $priority,
            'project_id' => $this->project->id,
            'team_id' => $this->project->team?->id,
            'team_name' => $teamName,
            'project_title' => $projectTitle,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'action_text' => $actionText,
            'details' => $details,
            'created_at' => now()->toIso8601String(),
        ];
    }
}

