<?php

namespace App\Http\Controllers\Auth;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'nim' => 'nullable|string|max:50',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = DB::transaction(function () use ($request) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'email_verified_at' => now(),
            ]);

            // Auto-assign campus from email domain or fallback
            $emailDomain = substr(strrchr($request->email, "@"), 1);
            $campus = Campus::where('email_domain', $emailDomain)->first()
                ?? Campus::where('slug', 'polindra')->first()
                ?? Campus::first();

            if ($campus) {
                $studentNumber = !empty($request->nim) ? trim($request->nim) : ('REG-' . substr(abs(crc32($request->email)), 0, 7));

                CampusMembership::create([
                    'campus_id' => $campus->id,
                    'user_id' => $user->id,
                    'role' => CampusRole::Student,
                    'status' => MembershipStatus::Active,
                    'verification_status' => VerificationStatus::Verified,
                    'student_number' => $studentNumber,
                    'verified_at' => now(),
                ]);

                StudentProfile::create([
                    'user_id' => $user->id,
                    'campus_id' => $campus->id,
                    'slug' => Str::slug($request->name) . '-' . Str::random(4),
                    'nim' => !empty($request->nim) ? trim($request->nim) : null,
                    'headline' => 'Mahasiswa Baru ' . $campus->name,
                    'interests' => ['Teknologi', 'Proyek Mahasiswa'],
                    'preferred_roles' => ['Developer', 'Anggota Tim'],
                ]);
            }

            return $user;
        });

        event(new Registered($user));

        Auth::login($user);

        return to_route('onboarding');
    }
}
