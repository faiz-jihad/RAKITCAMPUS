<?php

namespace App\Services\Feedback;

use App\Contracts\Feedback\FeedbackServiceInterface;
use App\Contracts\Notifications\NotificationCounterInterface;
use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Models\SystemFeedback;
use App\Models\User;
use App\Notifications\RakitUnifiedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FeedbackService implements FeedbackServiceInterface
{
    /**
     * Store system feedback, suggestion, or bug report atomically.
     */
    public function submitFeedback(array $data, ?User $user = null, ?string $ip = null, ?string $userAgent = null): SystemFeedback
    {
        return DB::transaction(function () use ($data, $user, $ip, $userAgent) {
            $name = $data['name'] ?? null;
            $email = $data['email'] ?? null;

            if ($user) {
                $name = $name ?: $user->name;
                $email = $email ?: $user->email;
            }

            $feedbackType = $data['feedback_type'] ?? (($data['category'] ?? '') === 'kendala_bug' ? 'bug_report' : 'suggestion');
            $urgency = $data['urgency'] ?? (($data['category'] ?? '') === 'kendala_bug' ? 'high' : 'medium');

            $feedback = SystemFeedback::create([
                'user_id' => $user?->id,
                'name' => $name,
                'email' => $email,
                'category' => $data['category'],
                'feedback_type' => $feedbackType,
                'urgency' => $urgency,
                'page_url' => $data['page_url'] ?? null,
                'message' => $data['message'],
                'rating' => $feedbackType === 'bug_report' ? null : ($data['rating'] ?? null),
                'status' => 'pending',
                'ip_address' => $ip,
                'user_agent' => $userAgent ? substr((string) $userAgent, 0, 500) : null,
            ]);

            $ticketCode = sprintf('#TKT-%05d', $feedback->id);

            // Notify admins about new feedback/bug report
            try {
                $admins = User::where('status', 'active')
                    ->where(function ($q) {
                        $q->where('is_platform_admin', true)
                            ->orWhereHas('memberships', fn ($m) => $m->where('role', CampusRole::CampusAdmin->value)->where('status', MembershipStatus::Active->value));
                    })
                    ->get();

                if ($admins->isNotEmpty()) {
                    $categoryLabels = [
                        'saran_fitur' => 'Saran Fitur Baru',
                        'antarmuka_ui' => 'Desain & Tampilan',
                        'kendala_bug' => 'Laporan Kendala / Bug',
                        'performa' => 'Kecepatan & Performa',
                        'lainnya' => 'Lainnya',
                    ];

                    $catLabel = $categoryLabels[$feedback->category] ?? ucfirst($feedback->category);
                    $notifTitle = $feedbackType === 'bug_report'
                        ? "[BUG {$urgency}] {$catLabel} dari " . ($name ?: 'Pengguna')
                        : "[SARAN] {$catLabel} dari " . ($name ?: 'Pengguna');

                    $snippet = Str::limit($feedback->message, 120);

                    foreach ($admins as $admin) {
                        $admin->notify(new RakitUnifiedNotification(
                            notificationType: 'system_feedback_received',
                            category: 'system',
                            title: $notifTitle,
                            message: "Tiket {$ticketCode}: {$snippet}",
                            priority: ($feedbackType === 'bug_report' && in_array($urgency, ['high', 'critical'], true)) ? 'high' : 'normal',
                            actionUrl: url('/admin/feedback'),
                            actionText: 'Tinjau Masukan',
                            entityType: 'system_feedback',
                            entityId: $feedback->id,
                            details: [
                                'ticket_code' => $ticketCode,
                                'category' => $feedback->category,
                                'urgency' => $feedback->urgency,
                                'reporter' => $name,
                                'email' => $email,
                            ],
                            idempotencyKey: 'fb_admin_' . $feedback->id . '_' . $admin->id
                        ));

                        app(NotificationCounterInterface::class)->invalidateUnreadCountCache($admin);
                    }
                }
            } catch (\Throwable $e) {
                // Non-blocking notification dispatch
            }

            return $feedback;
        });
    }

    /**
     * Update status and resolution notes of a feedback item atomically.
     */
    public function updateStatus(int|SystemFeedback $feedback, string $status, ?string $adminNotes = null, ?User $admin = null): SystemFeedback
    {
        return DB::transaction(function () use ($feedback, $status, $adminNotes, $admin) {
            $feedbackModel = $feedback instanceof SystemFeedback
                ? SystemFeedback::where('id', $feedback->id)->lockForUpdate()->firstOrFail()
                : SystemFeedback::where('id', $feedback)->lockForUpdate()->firstOrFail();

            $updateData = ['status' => $status];
            if ($adminNotes !== null) {
                $updateData['admin_notes'] = $adminNotes;
            }

            $feedbackModel->update($updateData);

            // If user is registered, notify them about ticket update
            if ($feedbackModel->user_id && $feedbackModel->user) {
                try {
                    $statusLabels = [
                        'pending' => 'Menunggu Review',
                        'reviewed' => 'Sedang Ditinjau',
                        'resolved' => 'Terselesaikan',
                        'dismissed' => 'Diarsipkan',
                    ];
                    $stLabel = $statusLabels[$status] ?? ucfirst($status);
                    $ticketCode = sprintf('#TKT-%05d', $feedbackModel->id);

                    $feedbackModel->user->notify(new RakitUnifiedNotification(
                        notificationType: 'feedback_status_updated',
                        category: 'system',
                        title: "Pembaruan Tiket {$ticketCode}",
                        message: "Status tiket Anda telah diperbarui menjadi '{$stLabel}'." . ($adminNotes ? " Catatan: {$adminNotes}" : ''),
                        priority: 'normal',
                        actionUrl: url('/feedback'),
                        actionText: 'Lihat Tiket',
                        entityType: 'system_feedback',
                        entityId: $feedbackModel->id,
                        details: [
                            'ticket_code' => $ticketCode,
                            'status' => $status,
                            'admin_notes' => $adminNotes,
                        ],
                        idempotencyKey: 'fb_user_' . $feedbackModel->id . '_' . $status . '_' . now()->timestamp
                    ));

                    app(NotificationCounterInterface::class)->invalidateUnreadCountCache($feedbackModel->user);
                } catch (\Throwable $e) {
                    // Non-blocking notification
                }
            }

            return $feedbackModel;
        });
    }

    /**
     * Delete a feedback record atomically.
     */
    public function deleteFeedback(int|SystemFeedback $feedback, ?User $admin = null): bool
    {
        return DB::transaction(function () use ($feedback) {
            $feedbackModel = $feedback instanceof SystemFeedback
                ? SystemFeedback::where('id', $feedback->id)->lockForUpdate()->firstOrFail()
                : SystemFeedback::where('id', $feedback)->lockForUpdate()->firstOrFail();

            return (bool) $feedbackModel->delete();
        });
    }
}
