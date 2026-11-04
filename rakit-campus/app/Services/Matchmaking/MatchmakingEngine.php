<?php

namespace App\Services\Matchmaking;

use App\Enums\ProjectStatus;
use App\Models\AcademicClass;
use App\Models\MatchingAuditLog;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class MatchmakingEngine
{
    public function __construct(
        protected EligibilityService $eligibilityService,
        protected CompatibilityScoringService $scoringService,
        protected AllocationService $allocationService
    ) {}

    /**
     * Mode B: Recommend projects for a student.
     * Eagerly loads all relationships to prevent N+1 queries.
     *
     * @return array<array{
     *     project: Project,
     *     match_score: number,
     *     breakdown: array,
     *     matched_skills: string[],
     *     missing_skills: string[],
     *     complementary_skills: string[],
     *     matched_roles: string[],
     *     explanation: string
     * }>
     */
    public function recommendProjectsForStudent(User $student, ?AcademicClass $class = null, int $limit = 20): array
    {
        // 1. Hard Eligibility Check
        $eligibility = $this->eligibilityService->checkStudentEligibility($student, null, $class);
        if (! $eligibility['eligible']) {
            return [];
        }

        // 2. Query eligible projects with strict eager loading to eliminate N+1 queries
        $query = Project::query()
            ->with([
                'campus',
                'leader.profile',
                'skills',
                'team.members.user.profile.skills',
                'team.recruitment.roles.members',
            ])
            ->whereNotIn('status', [ProjectStatus::Draft->value, ProjectStatus::Archived->value, ProjectStatus::Completed->value]);

        if ($class) {
            $query->where('academic_class_id', $class->id);
        } elseif ($student->campusId()) {
            $query->where('campus_id', $student->campusId());
        }

        $projects = $query->get();

        // Ensure student profile & skills are loaded
        if (! $student->relationLoaded('profile')) {
            $student->load(['profile.skills']);
        }

        $recommendations = [];

        foreach ($projects as $project) {
            // Check capacity: Don't recommend full projects
            if (! $this->eligibilityService->hasProjectCapacity($project)) {
                continue;
            }

            // Exclude project if student is already in it or leader of it
            if ($project->leader_id === $student->id) {
                continue;
            }

            $evaluation = $this->scoringService->evaluate($student, $project);

            $recommendations[] = [
                'project' => $project,
                'match_score' => $evaluation['final_score'],
                'breakdown' => $evaluation['breakdown'],
                'matched_skills' => $evaluation['matched_skills'],
                'missing_skills' => $evaluation['missing_skills'],
                'complementary_skills' => $evaluation['complementary_skills'],
                'matched_roles' => $evaluation['matched_roles'],
                'explanation' => $evaluation['explanation'],
            ];
        }

        // Sort descending by match score
        usort($recommendations, fn ($a, $b) => $b['match_score'] <=> $a['match_score']);

        MatchingAuditLog::log(
            'recommendation_generated',
            ['student_id' => $student->id, 'class_id' => $class?->id, 'count' => count($recommendations)],
            $class?->id,
            null,
            $student->id
        );

        return array_slice($recommendations, 0, $limit);
    }

    /**
     * Mode B: Recommend student candidates for a project leader.
     * Eager loads all candidates to prevent N+1 queries.
     */
    public function recommendCandidatesForProject(Project $project, int $limit = 20): array
    {
        if (! $this->eligibilityService->hasProjectCapacity($project)) {
            return [];
        }

        // Eager load project with its team, members, roles, and skills
        $project->loadMissing([
            'skills',
            'team.members.user.profile.skills',
            'team.recruitment.roles.members',
        ]);

        // Find candidate students from the project's class or campus
        $candidateQuery = User::query()
            ->with([
                'profile.skills',
                'teamMemberships' => fn ($q) => $q->where('status', 'active'),
            ])
            ->where('id', '!=', $project->leader_id);

        if ($project->academic_class_id) {
            // Scope to class enrolled students
            $candidateQuery->whereHas('enrolledClasses', function ($q) use ($project) {
                $q->where('academic_class_id', $project->academic_class_id)
                    ->where('status', 'enrolled');
            });
        } elseif ($project->campus_id) {
            $candidateQuery->whereHas('memberships', function ($q) use ($project) {
                $q->where('campus_id', $project->campus_id)
                    ->where('status', 'active');
            });
        }

        $candidates = $candidateQuery->get();

        $ranked = [];

        foreach ($candidates as $cand) {
            // Hard rule: Filter out students who already have an active project
            if ($this->eligibilityService->hasActiveProjectMembership($cand)) {
                continue;
            }

            $evaluation = $this->scoringService->evaluate($cand, $project);

            $ranked[] = [
                'user' => $cand,
                'match_score' => $evaluation['final_score'],
                'breakdown' => $evaluation['breakdown'],
                'matched_skills' => $evaluation['matched_skills'],
                'missing_skills' => $evaluation['missing_skills'],
                'complementary_skills' => $evaluation['complementary_skills'],
                'matched_roles' => $evaluation['matched_roles'],
                'explanation' => $evaluation['explanation'],
            ];
        }

        usort($ranked, fn ($a, $b) => $b['match_score'] <=> $a['match_score']);

        return array_slice($ranked, 0, $limit);
    }

    /**
     * Mode A: Validate manual match candidate.
     */
    public function validateManualMatch(User $student, Project $project): array
    {
        return $this->eligibilityService->checkStudentEligibility($student, $project);
    }
}
