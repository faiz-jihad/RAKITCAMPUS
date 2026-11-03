<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\ExperienceType;
use App\Enums\SkillType;
use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Models\ProfileExperience;
use App\Models\Skill;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->profile()->with(['skills', 'experiences', 'campus'])->firstOrFail();

        return response()->json([
            'data' => [
                'id' => $profile->id,
                'name' => $user->name,
                'email' => $profile->show_email ? $user->email : null,
                'campus' => $profile->campus?->name,
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
                'availability_note' => $profile->availability_note,
                'collaboration_preferences' => $profile->collaboration_preferences,
                'visibility' => $profile->visibility->value,
                'show_email' => $profile->show_email,
                'portfolio_public' => $profile->portfolio_public,
                'open_to_invites' => $profile->open_to_invites,
                'completion' => $profile->completion(),
                'skills' => $profile->skills->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'type' => $s->type->value,
                    'proficiency' => $s->pivot->proficiency,
                ]),
                'experiences' => $profile->experiences,
            ]
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->profile()->firstOrFail();

        $validated = $request->validate([
            'department' => ['nullable', 'string', 'max:100'],
            'study_program' => ['nullable', 'string', 'max:100'],
            'semester' => ['nullable', 'integer', 'min:1', 'max:14'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'github_url' => ['nullable', 'url', 'max:255'],
            'linkedin_url' => ['nullable', 'url', 'max:255'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
            'interests' => ['nullable', 'array'],
            'interests.*' => ['string', 'max:50'],
            'preferred_roles' => ['nullable', 'array'],
            'preferred_roles.*' => ['string', 'max:50'],
            'availability_hours' => ['nullable', 'integer', 'min:0', 'max:168'],
            'availability_note' => ['nullable', 'string', 'max:255'],
            'collaboration_preferences' => ['nullable', 'string', 'max:500'],
            'visibility' => ['nullable', Rule::enum(Visibility::class)],
            'show_email' => ['nullable', 'boolean'],
            'portfolio_public' => ['nullable', 'boolean'],
            'open_to_invites' => ['nullable', 'boolean'],
        ]);

        $profile->update($validated);

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'completion' => $profile->completion(),
        ]);
    }

    public function syncSkills(Request $request): JsonResponse
    {
        $request->validate([
            'skills' => ['required', 'array'],
            'skills.*.name' => ['required', 'string', 'max:80'],
            'skills.*.type' => ['nullable', Rule::enum(SkillType::class)],
            'skills.*.proficiency' => ['required', 'integer', 'min:1', 'max:5'],
        ]);

        $profile = $request->user()->profile()->firstOrFail();
        $syncData = [];

        foreach ($request->input('skills') as $item) {
            $type = isset($item['type']) ? SkillType::from($item['type']) : SkillType::Technical;
            $skill = Skill::resolve($item['name'], $type);
            $syncData[$skill->id] = ['proficiency' => $item['proficiency']];
        }

        $profile->skills()->sync($syncData);

        return response()->json([
            'message' => 'Keahlian berhasil diperbarui.',
            'skills' => $profile->skills()->get()->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'type' => $s->type->value,
                'proficiency' => $s->pivot->proficiency,
            ]),
        ]);
    }

    public function addExperience(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::enum(ExperienceType::class)],
            'title' => ['required', 'string', 'max:255'],
            'organization' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'url' => ['nullable', 'url', 'max:255'],
            'started_on' => ['nullable', 'date'],
            'ended_on' => ['nullable', 'date', 'after_or_equal:started_on'],
        ]);

        $profile = $request->user()->profile()->firstOrFail();
        $exp = $profile->experiences()->create($validated);

        return response()->json([
            'message' => 'Pengalaman berhasil ditambahkan.',
            'data' => $exp,
        ], 201);
    }

    public function deleteExperience(Request $request, int $id): JsonResponse
    {
        $profile = $request->user()->profile()->firstOrFail();
        $exp = $profile->experiences()->where('id', $id)->firstOrFail();
        $exp->delete();

        return response()->json([
            'message' => 'Pengalaman berhasil dihapus.',
        ]);
    }

    public function publicProfile(Request $request, string $identifier): JsonResponse
    {
        $profile = StudentProfile::query()
            ->where('slug', $identifier)
            ->orWhere('id', is_numeric($identifier) ? (int)$identifier : 0)
            ->with(['skills', 'experiences', 'campus', 'user'])
            ->firstOrFail();

        $currentUser = $request->user('sanctum');

        // Check privacy
        if ($profile->visibility === Visibility::Private) {
            if (!$currentUser || ($currentUser->id !== $profile->user_id && !$currentUser->isPlatformAdmin())) {
                abort(403, 'Profil ini bersifat privat.');
            }
        } elseif ($profile->visibility === Visibility::Campus) {
            if (!$currentUser || (!$currentUser->belongsToCampus($profile->campus_id) && !$currentUser->isPlatformAdmin())) {
                abort(403, 'Profil ini hanya dapat dilihat oleh sesama civitas kampus.');
            }
        }

        return response()->json([
            'data' => [
                'id' => $profile->id,
                'name' => $profile->user->name,
                'campus' => $profile->campus?->name,
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
                'skills' => $profile->skills->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'type' => $s->type->value,
                    'proficiency' => $s->pivot->proficiency,
                ]),
                'experiences' => $profile->experiences,
            ]
        ]);
    }
}
