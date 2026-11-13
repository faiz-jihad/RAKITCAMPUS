<?php

namespace App\Http\Controllers;

use App\Enums\CampusRole;
use App\Enums\ExperienceType;
use App\Enums\MembershipStatus;
use App\Enums\SkillType;
use App\Enums\VerificationStatus;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\ProfileExperience;
use App\Models\Skill;
use App\Models\StudentProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingWebController extends Controller
{
    /**
     * Show the 5-step MinSatu onboarding wizard.
     */
    public function show(Request $request): Response
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $profile = $user->profile()->with(['skills', 'experiences'])->first();
        $campus = $user->campuses()->first()
            ?? ($membership ? Campus::find($membership->campus_id) : null)
            ?? Campus::where('slug', 'polindra')->first()
            ?? Campus::first();

        $allCampuses = Campus::where('status', 'active')
            ->select('id', 'name', 'slug', 'settings')
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'programs' => $c->settings['programs'] ?? [],
            ]);

        $initialNim = $membership?->student_number && !str_starts_with($membership->student_number, 'REG-') && !str_starts_with($membership->student_number, 'MHS-')
            ? $membership->student_number
            : '';

        $popularSkills = [
            'UI/UX Design', 'Figma', 'React', 'Next.js', 'Laravel',
            'Python', 'Machine Learning', 'Flutter', 'Data Analysis',
            'Pitch Deck', 'Business Model Canvas', 'Paper / KTI',
            'Public Speaking', 'Tailwind CSS', 'Mobile Development',
            'REST API', 'Cybersecurity', 'Copywriting',
        ];

        $currentExperience = $profile?->experiences?->first()?->description
            ?? $profile?->experiences?->first()?->title
            ?? '';

        // If the initial bio is just placeholder/empty, don't show dummy text
        $initialBio = $profile?->bio && !str_starts_with($profile->bio, 'Mahasiswa Baru') ? $profile->bio : '';

        return Inertia::render('onboarding/index', [
            'currentUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'nim' => $initialNim,
                'academic_status' => $profile->academic_status ?? 'prodi',
                'department' => $profile->department ?? '',
                'study_program' => $profile->study_program ?? '',
                'batch_year' => $profile->batch_year ?? '2024',
                'semester' => $profile->semester ?? 1,
                'bio' => $initialBio,
                'phone' => $profile->phone ?? '',
                'portfolio_url' => $profile->portfolio_url ?? '',
                'preferred_roles' => $profile->preferred_roles ?? [],
                'skills' => $profile ? $profile->skills->pluck('name')->toArray() : [],
                'experience' => $currentExperience,
                'is_onboarded' => (bool) ($profile->is_onboarded ?? false),
            ],
            'campus' => [
                'id' => $campus?->id,
                'name' => $campus?->name ?? 'Politeknik Negeri Indramayu',
                'programs' => $campus?->settings['programs'] ?? [],
            ],
            'campuses' => $allCampuses,
            'popularSkills' => $popularSkills,
        ]);
    }

    /**
     * Real-time check if a NIM is already used by another student.
     */
    public function checkNim(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $nim = trim((string) $request->input('nim', ''));

        if (empty($nim)) {
            return response()->json(['available' => true]);
        }

        if (!preg_match('/^[0-9]+$/', $nim)) {
            return response()->json([
                'available' => false,
                'message' => 'NIM hanya boleh berisi angka.',
            ]);
        }

        $exists = CampusMembership::where('student_number', $nim)
            ->when($membership, fn ($q) => $q->where('id', '!=', $membership->id))
            ->exists();

        if ($exists) {
            return response()->json([
                'available' => false,
                'message' => 'NIM ' . $nim . ' sudah terdaftar oleh mahasiswa lain.',
            ]);
        }

        return response()->json([
            'available' => true,
            'message' => 'NIM dapat digunakan.',
        ]);
    }

    /**
     * Save the completed onboarding biodata.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $currentMembershipId = $membership?->id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'campus_id' => 'nullable',
            'custom_campus_name' => 'nullable|string|max:255',
            'student_number' => [
                'required',
                'string',
                'regex:/^[0-9]+$/',
                'min:7',
                'max:20',
                \Illuminate\Validation\Rule::unique('campus_memberships', 'student_number')
                    ->where(function ($query) use ($request) {
                        $campusId = $request->input('campus_id');
                        if (!empty($campusId) && is_numeric($campusId)) {
                            return $query->where('campus_id', $campusId);
                        }
                        return $query;
                    })
                    ->ignore($currentMembershipId),
            ],
            'academic_status' => 'nullable|string|in:tpb,prodi',
            'department' => 'nullable|string|max:255',
            'study_program' => 'required|string|max:255',
            'batch_year' => 'nullable|string|max:20',
            'semester' => 'nullable|integer|min:1|max:14',
            'preferred_roles' => 'nullable|array',
            'preferred_roles.*' => 'string|max:100',
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:80',
            'bio' => 'nullable|string|max:1000',
            'experience' => 'nullable|string|max:1000',
            'portfolio_url' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'study_program.required' => 'Program studi wajib dipilih atau diisi.',
            'student_number.required' => 'NIM wajib diisi.',
            'student_number.regex' => 'NIM hanya boleh berisi angka.',
            'student_number.min' => 'NIM minimal 7 digit angka.',
            'student_number.unique' => 'NIM ini sudah terdaftar oleh mahasiswa lain di kampus yang sama. Silakan periksa kembali NIM Anda.',
        ]);

        // 1. Update user name
        if ($user->name !== $validated['name']) {
            $user->update(['name' => $validated['name']]);
        }

        // 2. Resolve Campus (selected or custom)
        $campus = null;
        if (!empty($validated['campus_id']) && is_numeric($validated['campus_id'])) {
            $campus = Campus::find($validated['campus_id']);
        }
        if (!$campus && !empty($validated['custom_campus_name'])) {
            $customName = trim($validated['custom_campus_name']);
            $campus = Campus::firstOrCreate(
                ['name' => $customName],
                [
                    'slug' => Str::slug($customName),
                    'status' => 'active',
                    'settings' => [
                        'pilot' => false,
                        'programs' => array_filter([$validated['study_program'] ?? null]),
                    ],
                ]
            );
        }
        if (!$campus) {
            $campus = $user->campuses()->first()
                ?? Campus::where('slug', 'polindra')->first()
                ?? Campus::first();
        }

        // Dynamically append new study_program to campus settings if not present
        if ($campus && !empty($validated['study_program'])) {
            $settings = $campus->settings ?? [];
            $programs = $settings['programs'] ?? [];
            if (!in_array($validated['study_program'], $programs, true)) {
                $programs[] = $validated['study_program'];
                $settings['programs'] = array_values(array_unique($programs));
                $campus->update(['settings' => $settings]);
            }
        }

        // 3. Ensure campus membership
        $membership = $user->activeMembership() ?? $user->memberships()->first();
        $customNim = !empty($validated['student_number']) ? trim($validated['student_number']) : null;

        if (!$membership && $campus) {
            $membership = CampusMembership::updateOrCreate(
                ['campus_id' => $campus->id, 'user_id' => $user->id],
                [
                    'role' => CampusRole::Student,
                    'status' => MembershipStatus::Active,
                    'verification_status' => VerificationStatus::Verified,
                    'student_number' => $customNim ?? ('MHS-' . substr(abs(crc32($user->email)), 0, 7)),
                    'verified_at' => now(),
                ]
            );
        } elseif ($membership && $campus) {
            $updateData = [
                'campus_id' => $campus->id,
                'status' => MembershipStatus::Active,
            ];
            if ($customNim) {
                $updateData['student_number'] = $customNim;
            } elseif (str_starts_with($membership->student_number ?? '', 'REG-')) {
                $updateData['student_number'] = 'MHS-' . substr(abs(crc32($user->email)), 0, 7);
            }
            $membership->update($updateData);
        }

        // 4. Update or create StudentProfile
        $profile = $user->profile;
        $profileData = [
            'campus_id' => $campus?->id ?? 1,
            'academic_status' => $validated['academic_status'] ?? 'prodi',
            'department' => $validated['department'] ?? 'Teknologi Informasi',
            'study_program' => $validated['study_program'] ?? 'Teknik Informatika',
            'batch_year' => $validated['batch_year'] ?? '2024',
            'semester' => $validated['semester'] ?? 3,
            'bio' => $validated['bio'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'portfolio_url' => $validated['portfolio_url'] ?? null,
            'preferred_roles' => $validated['preferred_roles'] ?? ['Developer'],
            'availability_hours' => 15,
            'is_onboarded' => true,
        ];

        if (!$profile) {
            $profile = StudentProfile::create(array_merge($profileData, [
                'user_id' => $user->id,
                'campus_id' => $campus?->id ?? 1,
                'slug' => Str::slug($validated['name']) . '-' . Str::random(4),
            ]));
        } else {
            $profile->update($profileData);
        }

        // 4. Sync Skills
        if (!empty($validated['skills'])) {
            $skillIds = [];
            foreach ($validated['skills'] as $skillName) {
                $trimmed = trim($skillName);
                if (!empty($trimmed)) {
                    $skill = Skill::resolve($trimmed, SkillType::Technical);
                    $skillIds[] = $skill->id;
                }
            }
            $profile->skills()->sync($skillIds);
        }

        // 5. Save Experience
        $experienceText = trim($validated['experience'] ?? '');
        if (!empty($experienceText) && !str_contains(strtolower($experienceText), 'belum ada pengalaman')) {
            $profile->experiences()->updateOrCreate(
                ['type' => ExperienceType::Competition],
                [
                    'title' => 'Pengalaman Lomba & Proyek Mahasiswa',
                    'organization' => $campus?->name ?? 'Kampus',
                    'description' => $experienceText,
                ]
            );
        }

        return redirect()->route('projects.index')
            ->with('success', 'Biodata berhasil dilengkapi! Selamat mencari dan berkolaborasi di Project Hub.');
    }

    /**
     * Skip onboarding for now.
     */
    public function skip(Request $request): RedirectResponse
    {
        $user = $request->user();
        $profile = $user->profile;
        if ($profile) {
            $profile->update(['is_onboarded' => true]);
        }
        return redirect()->route('projects.index');
    }
}
