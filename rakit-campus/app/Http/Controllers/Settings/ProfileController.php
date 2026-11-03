<?php

namespace App\Http\Controllers\Settings;

use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Models\Skill;
use App\Models\StudentProfile;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $profile = $user->profile()->with(['skills', 'experiences', 'campus'])->first();

        if (!$profile && $membership) {
            $profile = StudentProfile::create([
                'user_id' => $user->id,
                'campus_id' => $membership->campus_id,
                'slug' => Str::slug($user->name) . '-' . substr(uniqid(), -4),
                'visibility' => Visibility::Campus,
            ]);
            $profile->load(['skills', 'experiences', 'campus']);
        }

        $allSkills = Skill::orderBy('name')->get(['id', 'name', 'type']);

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'profile' => $profile ? [
                'id' => $profile->id,
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
                'portfolio_public' => (bool) $profile->portfolio_public,
                'open_to_invites' => (bool) $profile->open_to_invites,
                'skills' => $profile->skills->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->name,
                    'type' => $s->type?->value ?? 'technical',
                    'proficiency' => $s->pivot->proficiency,
                ]),
                'completion' => $profile->completion(),
            ] : null,
            'allSkills' => $allSkills,
            'campus' => $membership?->campus?->name,
            'nim' => $membership?->student_number,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        DB::transaction(function () use ($user, $validated) {
            // Update User name & email
            $user->name = $validated['name'];
            if ($user->email !== $validated['email']) {
                $user->email = $validated['email'];
                $user->email_verified_at = null;
            }
            $user->save();

            // Update Student Profile
            $membership = $user->activeMembership();
            $profile = $user->profile()->first();
            if (!$profile && $membership) {
                $profile = StudentProfile::create([
                    'user_id' => $user->id,
                    'campus_id' => $membership->campus_id,
                    'slug' => Str::slug($user->name) . '-' . substr(uniqid(), -4),
                    'visibility' => Visibility::Campus,
                ]);
            }

            if ($profile) {
                $profile->department = $validated['department'] ?? $profile->department;
                $profile->study_program = $validated['study_program'] ?? $profile->study_program;
                $profile->semester = isset($validated['semester']) ? (int) $validated['semester'] : $profile->semester;
                $profile->bio = $validated['bio'] ?? $profile->bio;
                $profile->github_url = $validated['github_url'] ?? $profile->github_url;
                $profile->linkedin_url = $validated['linkedin_url'] ?? $profile->linkedin_url;
                $profile->portfolio_url = $validated['portfolio_url'] ?? $profile->portfolio_url;
                $profile->availability_hours = isset($validated['availability_hours']) ? (int) $validated['availability_hours'] : $profile->availability_hours;
                $profile->availability_note = $validated['availability_note'] ?? $profile->availability_note;
                $profile->portfolio_public = (bool) ($validated['portfolio_public'] ?? false);
                $profile->open_to_invites = (bool) ($validated['open_to_invites'] ?? true);

                if (isset($validated['interests'])) {
                    $profile->interests = is_array($validated['interests']) ? $validated['interests'] : [];
                }

                if (isset($validated['preferred_roles'])) {
                    $profile->preferred_roles = is_array($validated['preferred_roles']) ? $validated['preferred_roles'] : [];
                }

                $profile->save();

                // Sync skills if provided
                if (isset($validated['skills']) && is_array($validated['skills'])) {
                    $syncData = [];
                    foreach ($validated['skills'] as $s) {
                        $skillId = $s['id'] ?? null;
                        if (!$skillId && !empty($s['name'])) {
                            $resolved = Skill::resolve($s['name']);
                            $skillId = $resolved->id;
                        }
                        if ($skillId) {
                            $syncData[$skillId] = ['proficiency' => (int) ($s['proficiency'] ?? 3)];
                        }
                    }
                    $profile->skills()->sync($syncData);
                }
            }
        });

        return to_route('profile.edit')->with('status', 'Profil dan keahlian berhasil diperbarui.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
