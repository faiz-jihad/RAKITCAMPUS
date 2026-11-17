<?php

namespace App\Http\Controllers\Web;

use App\Contracts\Feedback\FeedbackServiceInterface;
use App\Http\Controllers\Controller;
use App\Models\SystemFeedback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedbackWebController extends Controller
{
    public function __construct(
        protected FeedbackServiceInterface $feedbackService
    ) {}

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

        $feedback = $this->feedbackService->submitFeedback(
            data: $validated,
            user: $request->user(),
            ip: $request->ip(),
            userAgent: $request->userAgent()
        );

        $ticketCode = sprintf('#TKT-%05d', $feedback->id);

        $successMessage = $feedback->feedback_type === 'bug_report'
            ? "Laporan kendala Anda telah berhasil dikirim dengan Nomor Tiket {$ticketCode}. Tim pengembang akan segera meninjaunya."
            : "Terima kasih! Saran & masukan Anda berhasil kami terima dengan Nomor Tiket {$ticketCode}.";

        return back()
            ->with('success', $successMessage)
            ->with('feedback_ticket', $ticketCode);
    }
}
