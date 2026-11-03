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

        // If not logged in, or is lecturer / admin, bypass onboarding check
        if (!$user || $user->isLecturer() || $user->isPlatformAdmin()) {
            return $next($request);
        }

        // Routes that should always be accessible even with incomplete profile
        $allowedRoutes = [
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
        $membership = $user->activeMembership();
        $profile = $user->profile()->with('skills')->first();

        $hasNim = $membership && filled($membership->student_number) && !str_starts_with($membership->student_number, 'REG-');
        $hasDepartment = $profile && filled($profile->department);
        $hasStudyProgram = $profile && filled($profile->study_program);
        $hasSkills = $profile && $profile->skills->count() >= 2;
        $hasAvailability = $profile && filled($profile->availability_hours);

        // If profile is incomplete, redirect to profile settings with friendly notice
        if (!$hasNim || !$hasDepartment || !$hasStudyProgram || !$hasSkills || !$hasAvailability) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => 'Lengkapi data profil dan keahlian Anda terlebih dahulu sebelum melanjutkan.',
                    'redirect' => route('profile.edit', ['mandatory' => 1]),
                ], 403);
            }

            return redirect()->route('profile.edit', ['mandatory' => 1])
                ->with('info', 'Langkah Awal: Yuk lengkapi data profil, NIM, program studi, dan minimal 2 keahlian kamu terlebih dahulu agar bisa matchmaking dan gabung kelas!');
        }

        return $next($request);
    }
}
