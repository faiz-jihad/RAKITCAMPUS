<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();
        $membership = $user?->activeMembership();
        $membership?->loadMissing('campus');
        $isLecturer = $user && ($user->isLecturer() || ($membership?->role === \App\Enums\CampusRole::Lecturer));

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'show_hub_selector' => false,
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'flash' => [
                'success' => $request->session()->get('success'),
                'info' => $request->session()->get('info'),
                'warning' => $request->session()->get('warning'),
                'error' => $request->session()->get('error'),
                'status' => $request->session()->get('status'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_platform_admin' => $user->isPlatformAdmin(),
                    'is_lecturer' => $user->isLecturer(),
                    'is_onboarded' => (bool) ($user->profile?->is_onboarded ?? false),
                    'unread_notifications_count' => app(\App\Contracts\Notifications\NotificationCounterInterface::class)->getUnreadCount($user),
                    'recent_notifications' => $user->notifications()
                        ->latest()
                        ->limit(5)
                        ->get(['id', 'data', 'read_at', 'created_at'])
                        ->map(fn ($n) => [
                            'id' => $n->id,
                            'data' => $n->data,
                            'read_at' => $n->read_at?->toIso8601String(),
                            'created_at' => $n->created_at?->diffForHumans(),
                        ])
                        ->values()
                        ->all(),
                    'role' => $membership?->role?->value ?? ($user->isPlatformAdmin() ? 'platform_admin' : 'student'),
                    'campus' => ($membership && $membership->campus) ? [
                        'id' => $membership->campus->id,
                        'name' => $membership->campus->name,
                        'slug' => $membership->campus->slug,
                        'role' => $membership->role?->value ?? 'student',
                        'verification_status' => $membership->verification_status?->value ?? 'verified',
                    ] : null,
                ] : null,
            ],
        ]);
    }
}
