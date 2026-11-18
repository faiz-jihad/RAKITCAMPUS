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
        $isLecturer = $user && ($user->isLecturer() || ($membership?->role === \App\Enums\CampusRole::Lecturer));

        if ($isLecturer) {
            // Dosen langsung masuk ke halaman dashboard dosen
            $request->session()->forget('url.intended');
            return redirect()->route('dashboard');
        }

        $profile = $user?->profile;
        if ($user && !$user->isPlatformAdmin() && (!$profile || !$profile->is_onboarded)) {
            return redirect()->route('onboarding');
        }

        // Redirect langsung ke dashboard tanpa popup hub selector atau intended url lama
        $request->session()->forget('url.intended');
        return redirect()->route('dashboard');
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
