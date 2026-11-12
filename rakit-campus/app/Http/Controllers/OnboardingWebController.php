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
        $profile = $user->profile()->with(['skills', 'experiences'])->first();
        $campus = $user->campuses()->first()
            ?? Campus::where('slug', 'polindra')->first()
            ?? Campus::first();

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

        return Inertia::render('onboarding/index', [
            'currentUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'nim' => $profile->nim ?? '',
                'academic_status' => $profile->academic_status ?? 'tpb',
                'department' => $profile->department ?? '',
                'study_program' => $profile->study_program ?? '',
                'batch_year' => $profile->batch_year ?? '2024',
                'semester' => $profile->semester ?? 1,
                'bio' => $profile->bio ?? '',
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
            ],
            'popularSkills' => $popularSkills,
        ]);
    }

    /**
     * Save the completed onboarding biodata.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nim' => 'nullable|string|max:50',
            'academic_status' => 'nullable|string|in:tpb,prodi',
            'department' => 'nullable|string|max:255',
            'study_program' => 'nullable|string|max:255',
            'batch_year' => 'nullable|string|max:10',
            'semester' => 'nullable|integer|min:1|max:14',
            'preferred_roles' => 'nullable|array',
            'preferred_roles.*' => 'string|max:100',
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:80',
            'bio' => 'nullable|string|max:1000',
            'experience' => 'nullable|string|max:1000',
            'portfolio_url' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
        ]);

        // 1. Update user name
        if ($user->name !== $validated['name']) {
            $user->update(['name' => $validated['name']]);
        }

        // 2. Ensure campus membership
        $campus = $user->campuses()->first()
            ?? Campus::where('slug', 'polindra')->first()
            ?? Campus::first();

        $membership = $user->activeMembership();
        if (!$membership && $campus) {
            $studentNumber = !empty($validated['nim']) ? trim($validated['nim']) : ('MHS-' . substr(abs(crc32($user->email)), 0, 7));
            $membership = CampusMembership::create([
                'campus_id' => $campus->id,
                'user_id' => $user->id,
                'role' => CampusRole::Student,
                'status' => MembershipStatus::Active,
                'verification_status' => VerificationStatus::Verified,
                'student_number' => $studentNumber,
                'verified_at' => now(),
            ]);
        } elseif ($membership && !empty($validated['nim'])) {
            $membership->update([
                'student_number' => trim($validated['nim']),
            ]);
        } elseif ($membership && str_starts_with($membership->student_number ?? '', 'REG-')) {
            $membership->update([
                'student_number' => 'MHS-' . substr(abs(crc32($user->email)), 0, 7),
            ]);
        }

        // 3. Update or create StudentProfile
        $profile = $user->profile;
        $profileData = [
            'nim' => !empty($validated['nim']) ? trim($validated['nim']) : ($profile->nim ?? null),
            'academic_status' => $validated['academic_status'] ?? 'tpb',
            'department' => $validated['department'] ?? ($validated['academic_status'] === 'tpb' ? 'Tahap Persiapan Bersama' : 'Teknologi Informasi'),
            'study_program' => $validated['study_program'] ?? ($validated['academic_status'] === 'tpb' ? 'TPB' : 'D4 Rekayasa Perangkat Lunak'),
            'batch_year' => $validated['batch_year'] ?? '2024',
            'semester' => $validated['semester'] ?? ($validated['academic_status'] === 'tpb' ? 1 : 3),
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

        return redirect()->route('competitions.index')
            ->with('success', 'Biodata berhasil dilengkapi! Selamat mencari rekan tim di Competition Hub.');
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
        return redirect()->route('competitions.index');
    }
}
