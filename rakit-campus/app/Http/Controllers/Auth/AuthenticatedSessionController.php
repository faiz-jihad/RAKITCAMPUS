<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('auth/login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = $request->user();
        $membership = $user?->activeMembership();
        $isAdmin = $user && ($user->isPlatformAdmin() || $user->isCampusAdmin() || ($membership?->role === \App\Enums\CampusRole::Admin) || ($membership?->role === \App\Enums\CampusRole::CampusAdmin));
        $isLecturer = $user && ($user->isLecturer() || ($membership?->role === \App\Enums\CampusRole::Lecturer));

        if ($isAdmin) {
            // Administrator langsung diarahkan ke panel admin tanpa selector hub
            return redirect()->intended(route('admin.index', absolute: false));
        }

        if ($isLecturer) {
            // Dosen langsung masuk ke halaman dosen tanpa selector ruang kerja
            return redirect()->intended(route('dashboard', absolute: false));
        }

        $profile = $user?->profile;
        if ($user && !$user->isPlatformAdmin() && (!$profile || !$profile->is_onboarded)) {
            return redirect()->route('onboarding');
        }

        $request->session()->put('show_hub_selector', true);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
