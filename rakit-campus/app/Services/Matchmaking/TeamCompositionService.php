<?php

namespace App\Services\Matchmaking;

use App\Models\Project;
use App\Models\User;

class TeamCompositionService
{
    /**
     * Compute team diversity & complementary score (0-100).
     *
     * @return array{score: int, complementary_skills: string[], details: array<string, mixed>}
     */
    public function computeDiversityScore(User $student, Project $project): array
    {
        $team = $project->team;
        if (! $team) {
            return [
                'score' => 80,
                'complementary_skills' => [],
                'details' => ['reason' => 'Tim belum memiliki anggota awal, fleksibilitas tinggi.'],
            ];
        }

        // Eager load or re-use team members and their profile skills to avoid N+1 queries
        $members = $team->relationLoaded('members')
            ? $team->members->where('status', 'active')
            : $team->members()
                ->where('status', 'active')
                ->with(['user.profile.skills'])
                ->get();

        if ($members->isEmpty()) {
            return [
                'score' => 85,
                'complementary_skills' => [],
                'details' => ['reason' => 'Anggota pertama tim, bebas membangun pondasi.'],
            ];
        }

        // Collect existing team skills and roles
        $existingSkills = collect();
        $existingRoles = collect();

        foreach ($members as $member) {
            if ($member->role_name) {
                $existingRoles->push(strtolower($member->role_name));
            }
            if ($member->user && $member->user->profile) {
                foreach ($member->user->profile->skills as $s) {
                    $existingSkills->push(strtolower($s->name));
                }
            }
        }
        $existingSkills = $existingSkills->unique();

        // Student's skills
        $studentProfile = $student->profile;
        $studentSkills = collect();
        if ($studentProfile) {
            foreach ($studentProfile->skills as $s) {
                $studentSkills->push(strtolower($s->name));
            }
        }

        // Complementary skills: skills the student brings that the team currently lacks
        $complementarySkills = $studentSkills->diff($existingSkills)->values()->all();

        // Project required skills
        $projectRequiredSkills = collect();
        if ($project->relationLoaded('skills')) {
            $projectRequiredSkills = $project->skills->pluck('name')->map(fn ($n) => strtolower($n));
        } else {
            $projectRequiredSkills = $project->skills()->pluck('name')->map(fn ($n) => strtolower($n));
        }

        // How many missing project skills does this student cover?
        $missingProjectSkills = $projectRequiredSkills->diff($existingSkills);
        $coveredMissing = $studentSkills->intersect($missingProjectSkills)->count();

        $baseDiversity = 60;
        $skillDiversityBonus = min(25, count($complementarySkills) * 5);
        $neededGapFillBonus = min(20, $coveredMissing * 10);

        // Role balance check: Penalize if already heavily skewed to one role
        $studentPreferredRoles = collect($studentProfile?->preferred_roles ?? [])->map(fn ($r) => strtolower($r));
        $roleOverlapPenalty = 0;
        foreach ($studentPreferredRoles as $pr) {
            $count = $existingRoles->filter(fn ($er) => str_contains($er, $pr) || str_contains($pr, $er))->count();
            if ($count >= 2) {
                $roleOverlapPenalty += 15; // penalize if 2+ members already hold this role
            }
        }

        $finalScore = min(100, max(20, $baseDiversity + $skillDiversityBonus + $neededGapFillBonus - $roleOverlapPenalty));

        return [
            'score' => (int) round($finalScore),
            'complementary_skills' => $complementarySkills,
            'details' => [
                'complementary_count' => count($complementarySkills),
                'gap_skills_covered' => $coveredMissing,
                'role_overlap_penalty' => $roleOverlapPenalty,
                'existing_team_size' => $members->count(),
            ],
        ];
    }
}
