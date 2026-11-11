<?php

namespace App\Http\Controllers\Auth;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Skill;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect(): RedirectResponse
    {
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        // Check if real Google credentials are configured in .env
        if (empty($clientId) || empty($clientSecret) || $clientId === 'your-google-client-id') {
            return redirect()->route('login')->with('warning', 'Google Client ID belum dikonfigurasi di file .env server. Silakan masukkan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET.');
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            try {
                $googleUser = Socialite::driver('google')->stateless()->user();
            } catch (\Throwable $ex) {
                return redirect()->route('login')->withErrors([
                    'email' => 'Gagal melakukan otentikasi Google: ' . $ex->getMessage(),
                ]);
            }
        }

        $email = $googleUser->getEmail();
        $name = $googleUser->getName() ?: 'Mahasiswa Google';
        $googleId = $googleUser->getId();
        $avatar = $googleUser->getAvatar();

        $user = DB::transaction(function () use ($email, $name, $googleId, $avatar) {
            // 1. Find user by google_id or email
            $user = User::where('google_id', $googleId)
                ->orWhere('email', $email)
                ->first();

            if ($user) {
                $user->update([
                    'google_id' => $googleId,
                    'avatar' => $avatar ?: $user->avatar,
                    'email_verified_at' => $user->email_verified_at ?: now(),
                ]);
            } else {
                $user = User::create([
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $googleId,
                    'avatar' => $avatar,
                    'password' => Hash::make(Str::random(32)),
                    'email_verified_at' => now(),
                ]);
            }

            // 2. Resolve Campus by email domain or default to first active campus
            $emailDomain = substr(strrchr($email, "@"), 1);
            $campus = Campus::where('email_domain', $emailDomain)->first()
                ?? Campus::where('slug', 'polindra')->first()
                ?? Campus::first();

            if ($campus) {
                // Ensure Campus Membership
                CampusMembership::firstOrCreate(
                    [
                        'campus_id' => $campus->id,
                        'user_id' => $user->id,
                    ],
                    [
                        'role' => CampusRole::Student,
                        'status' => MembershipStatus::Active,
                        'verification_status' => VerificationStatus::Verified,
                        'student_number' => 'G-' . substr(abs(crc32($email)), 0, 8),
                        'verified_at' => now(),
                    ]
                );

                // Ensure Student Profile with all required fields
                $profile = StudentProfile::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'campus_id' => $campus->id,
                        'slug' => Str::slug($name) . '-' . substr(md5($email), 0, 6),
                        'department' => 'Teknologi Informasi',
                        'study_program' => 'Teknik Informatika',
                        'semester' => 5,
                        'availability_hours' => 20,
                        'bio' => 'Mahasiswa ' . $campus->name . ' (Akun Google)',
                        'interests' => ['Teknologi', 'Inovasi Kampus', 'Software Development'],
                        'preferred_roles' => ['Software Engineer', 'Frontend Developer', 'UI/UX Designer'],
                    ]
                );

                // Ensure profile has at least 2 skills attached for onboarding readiness
                if ($profile->skills()->count() < 2) {
                    $defaultSkills = Skill::take(2)->pluck('id');
                    if ($defaultSkills->isNotEmpty()) {
                        $profile->skills()->syncWithoutDetaching($defaultSkills);
                    }
                }
            }

            return $user;
        });

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        $profile = $user->profile;
        if (!$user->isLecturer() && !$user->isPlatformAdmin() && (!$profile || !$profile->is_onboarded)) {
            return redirect()->route('onboarding')
                ->with('success', "Selamat datang, {$user->name}! Silakan lengkapi biodata singkatmu.");
        }

        $request->session()->put('show_hub_selector', true);

        return redirect()->intended(route('dashboard'))
            ->with('success', "Selamat datang, {$user->name}! Anda berhasil masuk melalui Akun Google.");
    }

    /**
     * One-click demo Google sign-in for testing when Google OAuth credentials
     * are still in configuration phase.
     */
    public function demoGoogleLogin(Request $request): RedirectResponse
    {
        $email = 'google.student@polindra.ac.id';
        $name = 'Google Student Demo';
        $googleId = 'google_demo_1092837465';

        $user = DB::transaction(function () use ($email, $name, $googleId) {
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'google_id' => $googleId,
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                ]
            );

            $campus = Campus::where('slug', 'polindra')->first() ?? Campus::first();
            if ($campus) {
                CampusMembership::firstOrCreate(
                    ['campus_id' => $campus->id, 'user_id' => $user->id],
                    [
                        'role' => CampusRole::Student,
                        'status' => MembershipStatus::Active,
                        'verification_status' => VerificationStatus::Verified,
                        'student_number' => '2209999',
                        'verified_at' => now(),
                    ]
                );

                $profile = StudentProfile::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'campus_id' => $campus->id,
                        'slug' => 'google-student-demo',
                        'department' => 'Teknologi Informasi',
                        'study_program' => 'Teknik Informatika',
                        'semester' => 6,
                        'availability_hours' => 25,
                        'bio' => 'Google Student Developer — ' . $campus->name,
                        'interests' => ['Google Cloud', 'Flutter', 'AI'],
                        'preferred_roles' => ['Full Stack Developer', 'Cloud Architect'],
                    ]
                );

                if ($profile->skills()->count() < 2) {
                    $defaultSkills = Skill::take(2)->pluck('id');
                    if ($defaultSkills->isNotEmpty()) {
                        $profile->skills()->syncWithoutDetaching($defaultSkills);
                    }
                }
            }

            return $user;
        });

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        $request->session()->put('show_hub_selector', true);

        return redirect()->intended(route('dashboard'))
            ->with('success', 'Berhasil masuk dengan akun demo Google Student.');
    }
}
