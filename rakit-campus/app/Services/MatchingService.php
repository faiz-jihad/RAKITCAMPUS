<?php

namespace App\Services;

use App\Models\Competition;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Transparent, rule-based matching engine.
 * No black-box AI claims — every score is mathematically derived and explainable.
 */
class MatchingService
{
    /**
     * Compute match score and breakdown between a student profile and a project.
     *
     * @return array{
     *   match_score: int,
     *   matched_skills: list<string>,
     *   missing_skills: list<string>,
     *   role_compatibility: string,
     *   interest_match: bool,
     *   availability_compatible: bool,
     *   explanation: string,
     *   breakdown: array<string, int>
     * }
     */
    public function matchStudentToProject(StudentProfile $profile, Project $project): array
    {
        $profile->loadMissing(['skills', 'experiences', 'user']);
        $project->loadMissing(['skills', 'team.recruitment.roles', 'campus']);

        // Factor 1: Campus eligibility check
        $campusEligible = ($project->campus_id === $profile->campus_id)
            || ($project->visibility->value === 'public');

        if (!$campusEligible) {
            return [
                'match_score' => 0,
                'matched_skills' => [],
                'missing_skills' => $project->skills->pluck('name')->all(),
                'role_compatibility' => 'Different campus, project not public',
                'interest_match' => false,
                'availability_compatible' => false,
                'explanation' => 'Proyek ini memiliki cakupan internal kampus yang berbeda.',
                'breakdown' => ['skills' => 0, 'roles' => 0, 'interests' => 0, 'experience' => 0, 'availability' => 0]
            ];
        }

        // Factor 2: Skill Compatibility (Max 40 points)
        $studentSkills = $profile->skills->keyBy('id');
        $projectSkills = $project->skills;

        $matchedSkillNames = [];
        $missingSkillNames = [];
        $skillScore = 0;

        if ($projectSkills->isNotEmpty()) {
            $totalWeight = $projectSkills->count();
            $accumulated = 0;

            foreach ($projectSkills as $reqSkill) {
                if ($studentSkills->has($reqSkill->id)) {
                    $matchedSkillNames[] = $reqSkill->name;
                    $studentProf = $studentSkills->get($reqSkill->id)->pivot->proficiency ?? 1;
                    $minProf = $reqSkill->pivot->min_proficiency ?? 1;
                    $ratio = min(1.0, $studentProf / max(1, $minProf));
                    $accumulated += $ratio;
                } else {
                    $missingSkillNames[] = $reqSkill->name;
                }
            }

            $skillScore = (int) round(($accumulated / $totalWeight) * 40);
        } else {
            // If project didn't specify skills, grant baseline
            $skillScore = 25;
        }

        // Factor 3: Role Compatibility (Max 25 points)
        $preferredRoles = array_map('strtolower', (array) ($profile->preferred_roles ?? []));
        $openRoles = $project->team?->recruitment?->roles?->pluck('name')->map(fn ($r) => strtolower($r))->all() ?? [];
        $roleMatch = false;
        $roleScore = 0;
        $matchedRoleName = null;

        foreach ($preferredRoles as $pref) {
            foreach ($openRoles as $open) {
                if (str_contains($open, $pref) || str_contains($pref, $open)) {
                    $roleMatch = true;
                    $matchedRoleName = ucwords($open);
                    break 2;
                }
            }
        }

        if ($roleMatch) {
            $roleScore = 25;
            $roleStatus = "Cocok dengan posisi open recruitment: {$matchedRoleName}";
        } elseif (!empty($openRoles)) {
            $roleScore = 5;
            $roleStatus = "Posisi yang dibutuhkan belum sepenuhnya sesuai peran minat";
        } else {
            $roleScore = 15;
            $roleStatus = "Tidak ada open recruitment spesifik saat ini";
        }

        // Factor 4: Interest Similarity (Max 15 points)
        $interests = array_map('strtolower', (array) ($profile->interests ?? []));
        $category = strtolower($project->category->value);
        $projectText = strtolower($project->title . ' ' . $project->short_description . ' ' . implode(' ', (array) ($project->tech_stack ?? [])));

        $interestMatch = false;
        foreach ($interests as $interest) {
            if (str_contains($projectText, $interest) || str_contains($category, $interest)) {
                $interestMatch = true;
                break;
            }
        }
        $interestScore = $interestMatch ? 15 : 5;

        // Factor 5: Experience Relevance (Max 10 points)
        $experienceScore = 0;
        $relevantExperience = [];
        foreach ($profile->experiences as $exp) {
            $expText = strtolower($exp->title . ' ' . $exp->description);
            foreach ($project->skills as $s) {
                if (str_contains($expText, strtolower($s->name))) {
                    $experienceScore = 10;
                    $relevantExperience[] = $exp->title;
                    break 2;
                }
            }
        }
        if ($experienceScore === 0 && $profile->experiences->isNotEmpty()) {
            $experienceScore = 4;
        }

        // Factor 6: Availability Compatibility (Max 10 points)
        $hours = $profile->availability_hours ?? 0;
        $availabilityCompatible = $hours >= 10;
        $availabilityScore = $hours >= 15 ? 10 : ($hours >= 8 ? 6 : 2);

        $totalScore = min(100, $skillScore + $roleScore + $interestScore + $experienceScore + $availabilityScore);

        $explanationParts = [];
        if (!empty($matchedSkillNames)) {
            $explanationParts[] = 'Memiliki keahlian yang dibutuhkan (' . implode(', ', array_slice($matchedSkillNames, 0, 3)) . ')';
        }
        if ($roleMatch) {
            $explanationParts[] = 'Peran yang diminati cocok dengan posisi tim';
        }
        if ($interestMatch) {
            $explanationParts[] = 'Minat selaras dengan topik proyek';
        }
        if ($availabilityCompatible) {
            $explanationParts[] = 'Ketersediaan waktu memadai (' . $hours . ' jam/minggu)';
        }

        $explanation = !empty($explanationParts)
            ? implode('. ', $explanationParts) . '.'
            : 'Kecocokan dasar berdasarkan profil mahasiswa.';

        return [
            'match_score' => $totalScore,
            'matched_skills' => $matchedSkillNames,
            'missing_skills' => $missingSkillNames,
            'role_compatibility' => $roleStatus,
            'interest_match' => $interestMatch,
            'availability_compatible' => $availabilityCompatible,
            'explanation' => $explanation,
            'breakdown' => [
                'skills' => $skillScore,
                'roles' => $roleScore,
                'interests' => $interestScore,
                'experience' => $experienceScore,
                'availability' => $availabilityScore,
            ],
        ];
    }

    /**
     * Find best matching candidates for a project.
     *
     * @return Collection<int, array{student: StudentProfile, match: array}>
     */
    public function findCandidatesForProject(Project $project, int $limit = 10): Collection
    {
        $existingMemberUserIds = $project->team?->members()->pluck('user_id')->all() ?? [];

        $students = StudentProfile::query()
            ->where('campus_id', $project->campus_id)
            ->where('open_to_invites', true)
            ->whereNotIn('user_id', $existingMemberUserIds)
            ->with(['skills', 'experiences', 'user'])
            ->get();

        $results = $students->map(function (StudentProfile $student) use ($project) {
            $match = $this->matchStudentToProject($student, $project);
            return [
                'student' => $student,
                'match' => $match,
                'score' => $match['match_score'],
            ];
        });

        return $results->sortByDesc('score')->take($limit)->values();
    }

    /**
     * Recommend projects for a student.
     *
     * @return Collection<int, array{project: Project, match: array}>
     */
    public function recommendProjectsForStudent(StudentProfile $profile, int $limit = 10): Collection
    {
        $joinedProjectIds = TeamMember::where('user_id', $profile->user_id)
            ->join('teams', 'team_members.team_id', '=', 'teams.id')
            ->whereNotNull('teams.project_id')
            ->pluck('teams.project_id')
            ->all();

        $projects = Project::query()
            ->whereIn('status', ['recruiting', 'in_progress'])
            ->where('moderation_status', 'visible')
            ->whereNotIn('id', $joinedProjectIds)
            ->where(function ($q) use ($profile) {
                $q->where('campus_id', $profile->campus_id)
                  ->orWhere('visibility', 'public');
            })
            ->with(['skills', 'team.recruitment.roles', 'leader', 'campus'])
            ->get();

        $ranked = $projects->map(function (Project $project) use ($profile) {
            $match = $this->matchStudentToProject($profile, $project);
            return [
                'project' => $project,
                'match' => $match,
                'score' => $match['match_score'],
            ];
        });

        return $ranked->sortByDesc('score')->take($limit)->values();
    }
}
