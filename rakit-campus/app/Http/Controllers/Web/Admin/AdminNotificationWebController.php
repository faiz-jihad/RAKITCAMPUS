<?php

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Services\Notifications\EmailDeliveryService;
use App\Services\Notifications\NotificationLogService;
use App\Services\Notifications\NotificationQueueService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminNotificationWebController extends Controller
{
    public function __construct(
        protected EmailDeliveryService $emailDelivery,
        protected NotificationLogService $logService,
        protected NotificationQueueService $queueService
    ) {}

    /**
     * Display central admin monitoring dashboard for email & notification system.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $isCampusAdmin = ($membership && $membership->role?->value === 'campus_admin') || $user->isPlatformAdmin();
        if (!$isCampusAdmin) {
            abort(403, 'Akses terbatas untuk administrator kampus atau platform.');
        }

        $providerConfig = $this->emailDelivery->inspectConfiguration();
        $queueHealth = $this->queueService->inspectQueueHealth();
        $statistics = $this->logService->getStatistics();

        $filters = [
            'status' => $request->query('status'),
            'channel' => $request->query('channel'),
            'category' => $request->query('category'),
            'search' => $request->query('search'),
        ];

        $logs = $this->logService->getPaginatedLogs(20, $filters);

        return Inertia::render('admin/notifications/index', [
            'providerConfig' => $providerConfig,
            'queueHealth' => $queueHealth,
            'statistics' => $statistics,
            'logs' => $logs,
            'filters' => $filters,
        ]);
    }

    /**
     * Trigger a real test email delivery to verify provider connectivity.
     */
    public function sendTestEmail(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:150'],
        ]);

        $result = $this->emailDelivery->sendTestEmail($validated['email'], $request->user());

        if ($result['success']) {
            return back()->with('success', 'Email pengujian berhasil dikirimkan ke provider mail.');
        }

        return back()->with('warning', 'Pengiriman email gagal atau ditolak provider: ' . ($result['error'] ?? 'Unknown error'));
    }

    /**
     * Retry a failed notification delivery record.
     */
    public function retryLog(Request $request, int $id): RedirectResponse
    {
        $result = $this->queueService->retryLog($id, $this->emailDelivery);

        if ($result['success']) {
            return back()->with('success', 'Pengiriman ulang notifikasi berhasil diproses.');
        }

        return back()->with('error', 'Gagal memproses ulang notifikasi: ' . ($result['error'] ?? $result['message'] ?? 'Unknown error'));
    }
}
