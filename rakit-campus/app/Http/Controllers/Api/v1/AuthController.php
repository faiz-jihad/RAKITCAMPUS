<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\VerificationStatus;
use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', Password::defaults()],
            'campus_id' => ['required', 'exists:campuses,id'],
            'student_number' => ['nullable', 'string', 'max:50'],
            'study_program' => ['nullable', 'string', 'max:100'],
            'department' => ['nullable', 'string', 'max:100'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $campus = Campus::findOrFail($validated['campus_id']);

        $user = DB::transaction(function () use ($validated, $campus) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);

            CampusMembership::create([
                'campus_id' => $campus->id,
                'user_id' => $user->id,
                'role' => CampusRole::Student,
                'status' => MembershipStatus::Active,
                'verification_status' => VerificationStatus::Unverified,
                'student_number' => $validated['student_number'] ?? null,
            ]);

            StudentProfile::create([
                'user_id' => $user->id,
                'campus_id' => $campus->id,
                'slug' => Str::slug($validated['name']) . '-' . Str::lower(Str::random(5)),
                'study_program' => $validated['study_program'] ?? null,
                'department' => $validated['department'] ?? null,
                'visibility' => Visibility::Campus,
            ]);

            return $user;
        });

        $deviceName = $request->input('device_name', 'mobile-app');
        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'campus' => [
                    'id' => $campus->id,
                    'name' => $campus->name,
                ],
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password yang Anda masukkan salah.'],
            ]);
        }

        if (!$user->isActive()) {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda sedang dinonaktifkan. Silakan hubungi admin.'],
            ]);
        }

        $deviceName = $request->input('device_name', 'mobile-app');
        $token = $user->createToken($deviceName)->plainTextToken;

        $membership = $user->activeMembership();
        $membership?->loadMissing('campus');

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_admin' => $user->isPlatformAdmin(),
                'campus' => $membership ? [
                    'id' => $membership->campus->id,
                    'name' => $membership->campus->name,
                    'slug' => $membership->campus->slug,
                    'role' => $membership->role->value,
                    'verification_status' => $membership->verification_status->value,
                ] : null,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Berhasil logout.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->loadMissing(['profile.skills', 'profile.experiences', 'memberships.campus']);

        $membership = $user->activeMembership();
        $profile = $user->profile;

        return response()->json([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_platform_admin' => $user->isPlatformAdmin(),
                'membership' => $membership ? [
                    'campus_id' => $membership->campus_id,
                    'campus_name' => $membership->campus->name,
                    'campus_slug' => $membership->campus->slug,
                    'role' => $membership->role->value,
                    'verification_status' => $membership->verification_status->value,
                    'student_number' => $membership->student_number,
                ] : null,
                'profile' => $profile ? [
                    'id' => $profile->id,
                    'slug' => $profile->slug,
                    'department' => $profile->department,
                    'study_program' => $profile->study_program,
                    'semester' => $profile->semester,
                    'bio' => $profile->bio,
                    'github_url' => $profile->github_url,
                    'linkedin_url' => $profile->linkedin_url,
                    'portfolio_url' => $profile->portfolio_url,
                    'interests' => $profile->interests ?? [],
                    'preferred_roles' => $profile->preferred_roles ?? [],
                    'availability_hours' => $profile->availability_hours,
                    'visibility' => $profile->visibility->value,
                    'completion' => $profile->completion(),
                    'skills' => $profile->skills->map(fn ($s) => [
                        'id' => $s->id,
                        'name' => $s->name,
                        'type' => $s->type->value,
                        'proficiency' => $s->pivot->proficiency,
                    ]),
                    'experiences' => $profile->experiences,
                ] : null,
            ],
        ]);
    }
}
