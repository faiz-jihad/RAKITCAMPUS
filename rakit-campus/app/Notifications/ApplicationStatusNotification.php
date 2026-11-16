<?php

namespace App\Notifications;

use App\Contracts\Notifications\NotificationCounterInterface;
use App\Contracts\Notifications\NotificationTemplateServiceInterface;
use App\Models\Application;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ApplicationStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Application $application, public string $status)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray(object $notifiable): array
    {
        $this->application->loadMissing(['recruitment.team.project']);
        $team = $this->application->recruitment?->team;
        $teamName = $team?->name ?? 'Tim Proyek';
        $statusIndo = $this->status === 'accepted' ? 'diterima' : 'belum dapat diterima';
        $title = $this->status === 'accepted'
            ? "Selamat! Lamaran Anda Diterima di {$teamName}"
            : "Pembaruan Status Lamaran: {$teamName}";

        $message = "Lamaran Anda untuk bergabung ke {$teamName} telah {$statusIndo}.";
        $actionUrl = $team?->project_id ? "/projects/{$team->project_id}?tab=workspace" : '/dashboard';

        if (isset($notifiable->id)) {
            app(NotificationCounterInterface::class)->invalidateUnreadCountCache($notifiable->id);
        }

        return [
            'type' => 'application_' . $this->status,
            'notification_type' => 'application_' . $this->status,
            'category' => 'project_hub',
            'priority' => $this->status === 'accepted' ? 'high' : 'medium',
            'application_id' => $this->application->id,
            'team_id' => $team?->id,
            'team_name' => $teamName,
            'status' => $this->status,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'action_text' => $this->status === 'accepted' ? 'Buka Workspace Tim' : 'Lihat Peluang Lain',
            'details' => [
                'Tim' => $teamName,
                'Status' => ucfirst($statusIndo),
            ],
            'created_at' => now()->toIso8601String(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $this->application->loadMissing(['recruitment.team.project']);
        $team = $this->application->recruitment?->team;
        $teamName = $team?->name ?? 'Tim Proyek';
        $statusIndo = $this->status === 'accepted' ? 'diterima' : 'belum dapat diterima';
        $title = $this->status === 'accepted'
            ? "Selamat! Lamaran Anda Diterima di {$teamName}"
            : "Pembaruan Status Lamaran: {$teamName}";

        $message = $this->status === 'accepted'
            ? "Selamat! Pengajuan Anda untuk bergabung dengan tim {$teamName} telah disetujui. Anda kini resmi menjadi anggota tim dan dapat berkolaborasi di ruang kerja tim."
            : "Terima kasih atas ketertarikan Anda. Mohon maaf, untuk saat ini lamaran Anda di tim {$teamName} belum dapat diterima karena keterbatasan kuota. Anda tetap dapat mengeksplorasi tim lain di Project Hub.";

        $actionUrl = url($team?->project_id ? "/projects/{$team->project_id}?tab=workspace" : '/projects');
        $actionText = $this->status === 'accepted' ? 'Buka Workspace Tim' : 'Cari Peluang Proyek';

        $templateService = app(NotificationTemplateServiceInterface::class);
        $payload = [
            'title' => $title,
            'greeting' => 'Halo ' . ($notifiable->name ?? 'Mahasiswa') . ',',
            'message' => $message,
            'category_name' => 'Project Hub',
            'action_url' => $actionUrl,
            'action_text' => $actionText,
            'details' => [
                'Nama Tim' => $teamName,
                'Status Seleksi' => ucfirst($statusIndo),
                'Waktu Pembaruan' => now()->format('d M Y, H:i T'),
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
