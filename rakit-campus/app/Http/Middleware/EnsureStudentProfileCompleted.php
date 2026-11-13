<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStudentProfileCompleted
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If not logged in, or is lecturer / platform admin / campus admin, bypass onboarding check
        if (!$user || $user->isLecturer() || $user->isPlatformAdmin() || $user->isCampusAdmin()) {
            return $next($request);
        }

        // Routes that should always be accessible even with incomplete profile
        $allowedRoutes = [
            'onboarding',
            'onboarding.*',
            'competitions.index',
            'competitions.show',
            'projects.index',
            'projects.show',
            'matching.index',
            'notifications',
            'notifications.*',
            'portfolio.index',
            'workspace.index',
            'classes.index',
            'profile.edit',
            'profile.update',
            'profile.destroy',
            'logout',
            'role.switch',
            'password.edit',
            'password.update',
            'appearance',
        ];

        if ($request->routeIs($allowedRoutes)) {
            return $next($request);
        }

        // Check student profile completeness
        $profile = $user->profile()->first();

        // Auto-heal: Jika profil mahasiswa sudah terisi lengkap (prodi/jurusan dan NIM/membership ada),
        // otomatis set is_onboarded = true agar akun demo / yang sudah mengisi tidak dipaksa mengisi ulang
        if ($profile && ($profile->study_program || $profile->department) && $user->activeMembership()?->student_number) {
            if (!$profile->is_onboarded) {
                $profile->update(['is_onboarded' => true]);
            }
            return $next($request);
        }

        // If profile is not yet onboarded, redirect to 5-step onboarding wizard
        if (!$profile || !$profile->is_onboarded) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Lengkapi biodata profil Anda terlebih dahulu sebelum melanjutkan.',
                    'redirect' => route('onboarding'),
                ], 403);
            }

            return redirect()->route('onboarding')
                ->with('info', 'Yuk lengkapi biodata singkatmu agar rekan tim dan ketua lomba dapat mengenalimu!');
        }

        return $next($request);
    }
}
