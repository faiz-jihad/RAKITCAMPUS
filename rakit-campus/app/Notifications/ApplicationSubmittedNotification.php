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
}
