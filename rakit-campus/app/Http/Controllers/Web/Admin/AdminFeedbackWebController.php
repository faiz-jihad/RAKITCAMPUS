<?php

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemFeedback;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminFeedbackWebController extends Controller
{
    private function checkAdminAccess(Request $request): void
    {
        $user = $request->user();
        if (!$user) {
            abort(401);
        }

        $membership = $user->activeMembership();
        $isCampusAdmin = $user->isPlatformAdmin()
            || $user->isCampusAdmin()
            || ($membership && (
                $membership->role === \App\Enums\CampusRole::CampusAdmin
                || $membership->role?->value === 'campus_admin'
                || (string) $membership->role === 'campus_admin'
            ));

        if (!$isCampusAdmin) {
            abort(403, 'Akses terbatas untuk administrator kampus atau platform.');
        }
    }

    /**
     * Display list of system suggestions & bug reports for admins.
     */
    public function index(Request $request): Response
    {
        $this->checkAdminAccess($request);

        $status = $request->query('status', 'all');
        $category = $request->query('category', 'all');
        $search = $request->query('search');

        $query = SystemFeedback::with(['user:id,name,email,avatar'])->latest();

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

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

        $feedbacks = $query->paginate(15)->through(function (SystemFeedback $fb) use ($categoryLabels, $statusLabels) {
            return [
                'id' => $fb->id,
                'user_id' => $fb->user_id,
                'user' => $fb->user ? [
                    'id' => $fb->user->id,
                    'name' => $fb->user->name,
                    'email' => $fb->user->email,
                    'avatar' => $fb->user->avatar,
                ] : null,
                'name' => $fb->name ?: ($fb->user?->name ?? 'Anonim'),
                'email' => $fb->email ?: ($fb->user?->email ?? '-'),
                'category' => $fb->category,
                'category_label' => $categoryLabels[$fb->category] ?? ucfirst($fb->category),
                'feedback_type' => $fb->feedback_type ?: ($fb->category === 'kendala_bug' ? 'bug_report' : 'suggestion'),
                'urgency' => $fb->urgency ?: 'medium',
                'page_url' => $fb->page_url,
                'message' => $fb->message,
                'rating' => $fb->rating,
                'status' => $fb->status,
                'status_label' => $statusLabels[$fb->status] ?? ucfirst($fb->status),
                'admin_notes' => $fb->admin_notes,
                'ip_address' => $fb->ip_address,
                'user_agent' => $fb->user_agent,
                'created_at' => $fb->created_at?->translatedFormat('d M Y, H:i'),
                'created_at_human' => $fb->created_at?->diffForHumans(),
            ];
        })->withQueryString();

        $statistics = [
            'total' => SystemFeedback::count(),
            'pending' => SystemFeedback::where('status', 'pending')->count(),
            'reviewed' => SystemFeedback::where('status', 'reviewed')->count(),
            'resolved' => SystemFeedback::where('status', 'resolved')->count(),
            'bugs' => SystemFeedback::where('category', 'kendala_bug')->count(),
            'feature_requests' => SystemFeedback::where('category', 'saran_fitur')->count(),
            'average_rating' => round((float) (SystemFeedback::whereNotNull('rating')->avg('rating') ?? 0), 1),
        ];

        return Inertia::render('admin/feedback/index', [
            'feedbacks' => $feedbacks,
            'statistics' => $statistics,
            'filters' => [
                'status' => $status,
                'category' => $category,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Update status of a feedback.
     */
    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        $this->checkAdminAccess($request);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending,reviewed,resolved,dismissed'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $feedback = SystemFeedback::findOrFail($id);
        $updateData = ['status' => $validated['status']];
        if (array_key_exists('admin_notes', $validated)) {
            $updateData['admin_notes'] = $validated['admin_notes'];
        }
        $feedback->update($updateData);

        return back()->with('success', 'Status masukan berhasil diperbarui.');
    }

    /**
     * Delete a feedback record.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $this->checkAdminAccess($request);

        $feedback = SystemFeedback::findOrFail($id);
        $feedback->delete();

        return back()->with('success', 'Masukan berhasil dihapus.');
    }
}
