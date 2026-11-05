<?php

namespace App\Http\Controllers\Web;

use App\Contracts\Notifications\NotificationCounterInterface;
use App\Contracts\Notifications\NotificationPreferenceServiceInterface;
use App\Http\Controllers\Controller;
use App\Services\Notifications\NotificationPreferenceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationWebController extends Controller
{
    public function __construct(
        protected NotificationPreferenceServiceInterface $preferenceService,
        protected NotificationCounterInterface $counter
    ) {}

    /**
     * Display the notification center.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $filter = $request->query('filter', 'all'); // all, unread
        $category = $request->query('category', 'all');

        $query = $user->notifications();

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        }

        if ($category !== 'all') {
            $query->where('data->category', $category);
        }

        $notifications = $query->latest()->paginate(15)->withQueryString();

        $unreadCount = $this->counter->getUnreadCount($user);
        $preferences = $this->preferenceService->getPreferences($user);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'unreadCount' => $unreadCount,
            'currentFilter' => $filter,
            'currentCategory' => $category,
            'preferences' => $preferences,
            'categories' => NotificationPreferenceService::categories(),
        ]);
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(Request $request, string $id): RedirectResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        $notification->markAsRead();

        $this->counter->invalidateUnreadCountCache($user);

        return back()->with('success', 'Notifikasi telah ditandai dibaca.');
    }

    /**
     * Mark all unread notifications as read.
     */
    public function markAllAsRead(Request $request): RedirectResponse
    {
        $user = $request->user();
        $user->unreadNotifications()->update(['read_at' => now()]);

        $this->counter->invalidateUnreadCountCache($user);

        return back()->with('success', 'Semua notifikasi berhasil ditandai dibaca.');
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, string $id): RedirectResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->where('id', $id)->firstOrFail();
        $notification->delete();

        $this->counter->invalidateUnreadCountCache($user);

        return back()->with('success', 'Notifikasi berhasil dihapus.');
    }

    /**
     * Update user notification preferences.
     */
    public function updatePreferences(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'preferences' => ['required', 'array'],
            'preferences.*.in_app' => ['boolean'],
            'preferences.*.email' => ['boolean'],
        ]);

        $this->preferenceService->updatePreferences($request->user(), $validated['preferences']);

        return back()->with('success', 'Preferensi notifikasi Anda berhasil disimpan.');
    }
}
