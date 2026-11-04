<?php

namespace App\Services\Matchmaking;

use App\Enums\ProjectStatus;
use App\Models\AcademicClass;
use App\Models\Application;
use App\Models\Project;
use App\Models\TeamMember;

class FairnessAnalyticsService
{
    /**
     * Compute comprehensive fairness analytics for an academic class or lecturer overview.
     */
    public function computeClassFairnessMetrics(AcademicClass $class): array
    {
        // 1. Eager load enrolled students with their profile and active team memberships (Zero N+1)
        $enrolledStudents = $class->students()
            ->with([
                'profile.skills',
                'teamMemberships' => fn ($q) => $q->where('status', 'active'),
            ])
            ->wherePivot('status', 'enrolled')
            ->get();

        $totalEligible = $enrolledStudents->count();

        // 2. Identify assigned vs unassigned students
        $assignedStudents = collect();
        $unassignedStudents = collect();

        foreach ($enrolledStudents as $student) {
            $hasActiveProject = $student->teamMemberships->contains(function ($m) {
                return $m->status === 'active';
            });

            if ($hasActiveProject) {
                $assignedStudents->push($student);
            } else {
                $unassignedStudents->push($student);
            }
        }

        // 3. Eager load projects in the class with their team and members
        $projects = Project::query()
            ->where('academic_class_id', $class->id)
            ->whereNotIn('status', [ProjectStatus::Archived->value])
            ->with([
                'team.members' => fn ($q) => $q->where('status', 'active'),
                'team.recruitment.roles',
                'skills',
            ])
            ->get();

        $totalProjects = $projects->count();
        $totalPositions = 0;
        $filledPositions = 0;

        $teamSkillsDistribution = [];

        foreach ($projects as $project) {
            $team = $project->team;
            $maxCap = $project->max_team_size ?: ($team?->capacity ?: 5);
            $totalPositions += $maxCap;

            $activeCount = $team ? $team->members->count() : 0;
            $filledPositions += $activeCount;

            // Collect skill distributions
            foreach ($project->skills as $skill) {
                $name = $skill->name;
                $teamSkillsDistribution[$name] = ($teamSkillsDistribution[$name] ?? 0) + 1;
            }
        }

        $openPositions = max(0, $totalPositions - $filledPositions);

        // 4. Fairness Indicators Calculations
        $participationRate = $totalEligible > 0
            ? round(($assignedStudents->count() / $totalEligible) * 100, 1)
            : 0;

        $positionFillRate = $totalPositions > 0
            ? round(($filledPositions / $totalPositions) * 100, 1)
            : 0;

        // First-timer analysis: Students with 0 completed historical projects
        $studentIds = $enrolledStudents->pluck('id')->all();
        $completedHistoricalStudents = TeamMember::whereIn('user_id', $studentIds)
            ->where('status', 'completed')
            ->distinct('user_id')
            ->pluck('user_id')
            ->flip();

        $firstTimersCount = 0;
        $firstTimersAssigned = 0;

        foreach ($enrolledStudents as $student) {
            $isFirstTimer = ! isset($completedHistoricalStudents[$student->id]);
            if ($isFirstTimer) {
                $firstTimersCount++;
                if ($assignedStudents->contains('id', $student->id)) {
                    $firstTimersAssigned++;
                }
            }
        }

        $firstTimeParticipationRate = $firstTimersCount > 0
            ? round(($firstTimersAssigned / $firstTimersCount) * 100, 1)
            : 0;

        // Rejection analysis: Repeated unsuccessful applications
        $repeatedRejectionCount = Application::whereIn('user_id', $studentIds)
            ->where('status', 'rejected')
            ->distinct('user_id')
            ->count();

        // Average wait time (days enrolled without a team)
        $totalWaitDays = 0;
        foreach ($unassignedStudents as $st) {
            if ($st->pivot && $st->pivot->enrolled_at) {
                $totalWaitDays += now()->diffInDays($st->pivot->enrolled_at);
            }
        }
        $avgWaitDays = $unassignedStudents->count() > 0
            ? round($totalWaitDays / $unassignedStudents->count(), 1)
            : 0;

        // Demand imbalance indicator (ratio of unassigned students to available open positions)
        $demandImbalance = $openPositions > 0
            ? round($unassignedStudents->count() / $openPositions, 2)
            : ($unassignedStudents->count() > 0 ? 999 : 1.0);

        return [
            'overview' => [
                'total_eligible_students' => $totalEligible,
                'assigned_students_count' => $assignedStudents->count(),
                'unassigned_students_count' => $unassignedStudents->count(),
                'total_projects' => $totalProjects,
                'total_positions' => $totalPositions,
                'filled_positions' => $filledPositions,
                'open_positions' => $openPositions,
            ],
            'fairness_indicators' => [
                'participation_rate' => $participationRate,
                'position_fill_rate' => $positionFillRate,
                'first_timers_count' => $firstTimersCount,
                'first_time_participation_rate' => $firstTimeParticipationRate,
                'repeated_rejection_count' => $repeatedRejectionCount,
                'average_wait_days' => $avgWaitDays,
                'demand_imbalance_ratio' => $demandImbalance,
            ],
            'skills_distribution' => $teamSkillsDistribution,
            'unassigned_students' => $unassignedStudents->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'email' => $s->email,
                    'student_number' => $s->pivot?->student_number ?? $s->profile?->slug,
                    'study_program' => $s->profile?->study_program ?? 'Informatika',
                    'skills' => $s->profile ? $s->profile->skills->pluck('name')->all() : [],
                    'preferred_roles' => $s->profile?->preferred_roles ?? [],
                    'availability_hours' => $s->profile?->availability_hours ?? 10,
                ];
            })->values()->all(),
        ];
    }
}
