<?php

namespace App\Http\Controllers\Web;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Http\Controllers\Controller;
use App\Models\SystemFeedback;
use App\Models\User;
use App\Services\Notifications\NotificationPreferenceService;
use App\Services\Notifications\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackWebController extends Controller
{
    /**
     * Show the dedicated feedback, suggestion & bug report center.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $myFeedbacks = $user
            ? SystemFeedback::where('user_id', $user->id)
                ->latest()
                ->take(20)
                ->get()
                ->map(function (SystemFeedback $fb) {
                    $categoryLabels = [
                        'saran_fitur' => 'Saran Fitur Baru',
                        'antarmuka_ui' => 'Desain & Tampilan',
                        'kendala_bug' => 'Laporan Kendala / Bug',
                        'performa' => 'Kecepatan & Performa',
                        'lainnya' => 'Lainnya',
                    ];

                    $statusLabels = [
                        'pending' => 'Menunggu Review',
                        'reviewed' => 'Sedang Ditinjau',
                        'resolved' => 'Terselesaikan',
                        'dismissed' => 'Diarsipkan',
                    ];

                    $urgencyLabels = [
                        'low' => 'Rendah (Minor)',
                        'medium' => 'Sedang',
                        'high' => 'Tinggi',
                        'critical' => 'Kritis (Blokir)',
                    ];

                    return [
                        'id' => $fb->id,
                        'ticket_code' => sprintf('#TKT-%05d', $fb->id),
                        'category' => $fb->category,
                        'category_label' => $categoryLabels[$fb->category] ?? ucfirst($fb->category),
                        'feedback_type' => $fb->feedback_type ?: ($fb->category === 'kendala_bug' ? 'bug_report' : 'suggestion'),
                        'urgency' => $fb->urgency ?: 'medium',
                        'urgency_label' => $urgencyLabels[$fb->urgency] ?? 'Sedang',
                        'page_url' => $fb->page_url,
                        'message' => $fb->message,
                        'rating' => $fb->rating,
                        'status' => $fb->status,
                        'status_label' => $statusLabels[$fb->status] ?? ucfirst($fb->status),
                        'admin_notes' => $fb->admin_notes,
                        'created_at' => $fb->created_at?->translatedFormat('d M Y, H:i'),
                        'created_at_human' => $fb->created_at?->diffForHumans(),
                    ];
                })
            : [];

        return Inertia::render('feedback/index', [
            'myFeedbacks' => $myFeedbacks,
            'defaultCategory' => $request->query('category', 'saran_fitur'),
            'defaultType' => $request->query('type', 'suggestion'),
            'defaultUrl' => $request->query('url', ''),
        ]);
    }

    /**
     * Store feedback and suggestions for the system.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:150'],
            'feedback_type' => ['nullable', 'string', 'in:suggestion,bug_report'],
            'category' => ['required', 'string', 'in:saran_fitur,antarmuka_ui,kendala_bug,performa,lainnya'],
            'urgency' => ['nullable', 'string', 'in:low,medium,high,critical'],
            'page_url' => ['nullable', 'string', 'max:500'],
            'message' => ['required', 'string', 'min:5', 'max:2000'],
            'rating' => ['nullable', 'integer', 'min:1', 'max:5'],
        ], [
            'category.required' => 'Pilih kategori masukan atau kendala.',
            'category.in' => 'Kategori masukan tidak valid.',
            'message.required' => 'Tuliskan rincian saran atau kendala Anda.',
            'message.min' => 'Rincian pesan minimal 5 karakter.',
            'message.max' => 'Rincian pesan maksimal 2000 karakter.',
            'email.email' => 'Format email tidak valid.',
        ]);

        $user = $request->user();

        $name = $validated['name'] ?? null;
        $email = $validated['email'] ?? null;

        if ($user) {
            $name = $name ?: $user->name;
            $email = $email ?: $user->email;
        }

        $feedbackType = $validated['feedback_type'] ?? ($validated['category'] === 'kendala_bug' ? 'bug_report' : 'suggestion');
        $urgency = $validated['urgency'] ?? ($validated['category'] === 'kendala_bug' ? 'high' : 'medium');

        $feedback = SystemFeedback::create([
            'user_id' => $user?->id,
            'name' => $name,
            'email' => $email,
            'category' => $validated['category'],
            'feedback_type' => $feedbackType,
            'urgency' => $urgency,
            'page_url' => $validated['page_url'] ?? null,
            'message' => $validated['message'],
            'rating' => $feedbackType === 'bug_report' ? null : ($validated['rating'] ?? null),
            'status' => 'pending',
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500),
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
                    'lainnya' => 'Masukan Lainnya',
                ];
                $catName = $categoryLabels[$validated['category']] ?? 'Saran & Masukan';
                $sender = $name ?: ($email ?: 'Pengguna Anonim');
                $ratingText = !empty($validated['rating']) && $feedbackType !== 'bug_report' ? " [★{$validated['rating']}/5]" : '';
                $typePrefix = $feedbackType === 'bug_report' ? '🚨 [BUG REPORT]' : '💡 [SARAN]';

                app(NotificationService::class)->notify(
                    recipients: $admins,
                    notificationType: 'system_feedback_received',
                    category: NotificationPreferenceService::CATEGORY_ACCOUNT_SECURITY,
                    title: "{$typePrefix} {$catName} ({$ticketCode}){$ratingText}",
                    message: "{$sender}: \"" . Str::limit($validated['message'], 100) . "\"",
                    options: [
                        'priority' => $feedbackType === 'bug_report' ? 'high' : 'medium',
                        'action_url' => url('/admin/feedback'),
                        'action_text' => 'Buka Panel Masukan',
                        'entity_type' => 'system_feedback',
                        'entity_id' => $feedback->id,
                    ]
                );
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Failed to send admin feedback notification: ' . $e->getMessage());
        }

        $successMsg = $feedbackType === 'bug_report'
            ? "Laporan kendala Anda telah diterima dengan nomor tiket {$ticketCode}. Tim teknis segera meninjaunya."
            : "Terima kasih atas saran Anda ({$ticketCode})! Masukan Anda sangat berharga untuk pengembangan RAKIT Campus.";

        return back()
            ->with('feedback_ticket', [
                'id' => $feedback->id,
                'ticket_code' => $ticketCode,
                'feedback_type' => $feedbackType,
                'category' => $feedback->category,
                'urgency' => $urgency,
                'message' => $feedback->message,
                'created_at' => now()->translatedFormat('d M Y, H:i'),
            ])
            ->with('feedback_success', $successMsg)
            ->with('success', $successMsg);
    }
}
