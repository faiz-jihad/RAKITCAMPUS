<?php

namespace App\Services\Matchmaking;

use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Collection;

class TeamOptimizationService
{
    public function __construct(
        protected EligibilityService $eligibilityService,
        protected CandidateScoringService $candidateScoringService,
        protected TeamCompositionService $compositionService
    ) {}

    /**
     * Identify the optimal combination of candidates from the project's class
     * that maximizes skill coverage, maximizes role coverage, and rewards complementary synergy.
     *
     * @return array{
     *     optimal_candidates: array<array{
     *         user: User,
     *         assigned_role: string,
     *         marginal_contribution: string,
     *         individual_score: int
     *     }>,
     *     team_balance_score: int,
     *     skill_coverage_percent: int,
     *     role_coverage_percent: int,
     *     covered_skills: string[],
     *     unmet_skills: string[],
     *     filled_roles: string[],
     *     unfilled_roles: string[],
     *     explanation: string,
     *     is_fully_covered: bool
     * }
     */
    public function optimizeTeam(Project $project, ?int $targetSize = null): array
    {
        $project->loadMissing([
            'skills',
            'academicClass.students.profile.skills',
            'team.members.user.profile.skills',
            'team.recruitment.roles.members',
        ]);

        $team = $project->team;
        $maxCapacity = $targetSize ?: ($project->max_team_size ?: ($team?->capacity ?: 4));
        $existingMembers = $team ? $team->members()->where('status', 'active')->with('user.profile.skills')->get() : collect();
        $currentCount = $existingMembers->count();
        $slotsToFill = max(0, $maxCapacity - $currentCount);

        // Required skills and open roles
        $projectSkills = $project->skills->pluck('name')->map(fn ($n) => strtolower($n))->unique()->values();
        $recruitmentRoles = $team?->recruitment ? $team->recruitment->roles : collect();

        // Already covered skills and roles by existing members
        $currentCoveredSkills = collect();
        $currentRoles = collect();

        foreach ($existingMembers as $member) {
            if ($member->role_name) {
                $currentRoles->push(strtolower($member->role_name));
            }
            if ($member->user && $member->user->profile) {
                foreach ($member->user->profile->skills as $s) {
                    $currentCoveredSkills->push(strtolower($s->name));
                }
            }
        }
        $currentCoveredSkills = $currentCoveredSkills->unique();

        if ($slotsToFill <= 0) {
            return $this->buildResult(
                collect(),
                $currentCoveredSkills,
                $projectSkills,
                $currentRoles,
                $recruitmentRoles,
                "Tim sudah mencapai kapasitas target ({$currentCount}/{$maxCapacity} anggota)."
            );
        }

        // 1. Strictly retrieve candidates enrolled in the same class without active projects
        $eligibleCandidates = collect();
        if ($project->academicClass) {
            $classStudents = $project->academicClass->students;
            foreach ($classStudents as $student) {
                // Exclude existing members or leader
                if ($project->leader_id === $student->id || $existingMembers->contains('user_id', $student->id)) {
                    continue;
                }

                // Strictly enforce Rule 1
                if ($this->eligibilityService->hasActiveProjectMembership($student)) {
                    continue;
                }

                $eval = $this->candidateScoringService->scoreCandidate($student, $project);
                $eligibleCandidates->push([
                    'user' => $student,
                    'eval' => $eval,
                    'score' => $eval['final_score'],
                ]);
            }
        }

        if ($eligibleCandidates->isEmpty()) {
            return $this->buildResult(
                collect(),
                $currentCoveredSkills,
                $projectSkills,
                $currentRoles,
                $recruitmentRoles,
                "Tidak ada kandidat sekelas yang memenuhi syarat dan belum memiliki kelompok."
            );
        }

        // 2. Deterministic Bounded Combinatorial Selection (Greedy Synergy with Lookahead)
        // Sort candidates primarily by individual score descending
        $candidatePool = $eligibleCandidates->sortByDesc('score')->values();

        $selectedCombination = collect();
        $simulatedCoveredSkills = clone $currentCoveredSkills;
        $simulatedRoles = clone $currentRoles;

        for ($step = 0; $step < $slotsToFill && $candidatePool->isNotEmpty(); $step++) {
            $bestCandidateIdx = null;
            $bestMarginalValue = -9999;
            $bestRoleAssigned = 'Anggota Kolaborator';
            $bestContribution = '';

            foreach ($candidatePool as $idx => $candidateData) {
                $candUser = $candidateData['user'];
                $candProfile = $candUser->profile;
                $candSkills = $candProfile ? $candProfile->skills->pluck('name')->map(fn ($n) => strtolower($n)) : collect();
                $candRoles = collect($candProfile?->preferred_roles ?? [])->map(fn ($r) => strtolower($r));

                // Marginal skills this candidate adds to unmet project requirements
                $newProjectSkills = $candSkills->intersect($projectSkills)->diff($simulatedCoveredSkills);
                $skillGain = $newProjectSkills->count() * 30;

                // Unique complementary skills (any skills not in team yet)
                $complementaryGain = $candSkills->diff($simulatedCoveredSkills)->count() * 8;

                // Role fit
                $roleGain = 0;
                $assignedRole = 'Anggota Pengembang';
                foreach ($recruitmentRoles as $rr) {
                    $rrLower = strtolower($rr->name);
                    $occupied = $simulatedRoles->filter(fn ($r) => str_contains($r, $rrLower) || str_contains($rrLower, $r))->count();
                    if ($occupied < $rr->slots) {
                        // Role is open
                        $matchesPreferred = $candRoles->contains(fn ($pr) => str_contains($rrLower, $pr) || str_contains($pr, $rrLower));
                        if ($matchesPreferred) {
                            $roleGain = 35;
                            $assignedRole = $rr->name;
                            break;
                        } elseif ($roleGain === 0) {
                            $roleGain = 15;
                            $assignedRole = $rr->name;
                        }
                    }
                }

                // Redundancy penalty: if candidate's main role is already saturated
                $redundancyPenalty = 0;
                foreach ($candRoles as $pr) {
                    $overlapCount = $simulatedRoles->filter(fn ($r) => str_contains($r, $pr) || str_contains($pr, $r))->count();
                    if ($overlapCount >= 2) {
                        $redundancyPenalty += 20;
                    }
                }

                // Availability & Fairness bonus
                $availabilityScore = $candidateData['eval']['breakdown']['availability'] ?? 70;
                $fairnessBonus = $candidateData['eval']['breakdown']['fairness'] ?? 70;

                $totalMarginalValue = $skillGain + $complementaryGain + $roleGain + ($availabilityScore * 0.1) + ($fairnessBonus * 0.15) - $redundancyPenalty;

                if ($totalMarginalValue > $bestMarginalValue) {
                    $bestMarginalValue = $totalMarginalValue;
                    $bestCandidateIdx = $idx;
                    $bestRoleAssigned = $assignedRole;

                    $addedList = $newProjectSkills->map(fn ($s) => ucwords($s))->implode(', ');
                    $bestContribution = $newProjectSkills->isNotEmpty()
                        ? "Mengisi keahlian krusial: {$addedList} dan posisi {$assignedRole}."
                        : "Melengkapi komposisi tim sebagai {$assignedRole} dengan ketersediaan waktu optimal.";
                }
            }

            if ($bestCandidateIdx !== null) {
                $chosen = $candidatePool->pull($bestCandidateIdx);
                $chosenUser = $chosen['user'];

                if ($chosenUser->profile) {
                    foreach ($chosenUser->profile->skills as $s) {
                        $simulatedCoveredSkills->push(strtolower($s->name));
                    }
                }
                $simulatedRoles->push(strtolower($bestRoleAssigned));

                $selectedCombination->push([
                    'user' => $chosenUser,
                    'assigned_role' => $bestRoleAssigned,
                    'marginal_contribution' => $bestContribution,
                    'individual_score' => $chosen['score'],
                ]);
            }
        }

        return $this->buildResult(
            $selectedCombination,
            $simulatedCoveredSkills->unique(),
            $projectSkills,
            $simulatedRoles,
            $recruitmentRoles,
            "Optimasi kombinasi berhasil menemukan {$selectedCombination->count()} rekan sekelas komplementer terbaik."
        );
    }

    /**
     * Compute summary metrics, unmet gaps, and explainability.
     */
    protected function buildResult(
        Collection $optimalCandidates,
        Collection $coveredSkills,
        Collection $requiredSkills,
        Collection $coveredRoles,
        Collection $recruitmentRoles,
        string $baseExplanation
    ): array {
        $requiredLower = $requiredSkills->map(fn ($s) => strtolower($s));
        $coveredLower = $coveredSkills->map(fn ($s) => strtolower($s));

        $unmetSkills = $requiredLower->diff($coveredLower)->values()->all();
        $coveredSkillsList = $requiredLower->intersect($coveredLower)->values()->all();

        $skillCoveragePercent = $requiredSkills->isNotEmpty()
            ? (int) round((count($coveredSkillsList) / $requiredSkills->count()) * 100)
            : 100;

        // Role coverage
        $totalRoleSlots = max(1, $recruitmentRoles->sum('slots'));
        $filledRoleCount = 0;
        $unfilledRoles = [];
        $filledRoles = [];

        foreach ($recruitmentRoles as $role) {
            $rLower = strtolower($role->name);
            $matchedCount = $coveredRoles->filter(fn ($r) => str_contains($r, $rLower) || str_contains($rLower, $r))->count();
            $effectiveFilled = min($role->slots, $matchedCount);
            $filledRoleCount += $effectiveFilled;

            if ($effectiveFilled >= $role->slots) {
                $filledRoles[] = $role->name;
            } else {
                $unfilledRoles[] = "{$role->name} (kurang " . ($role->slots - $effectiveFilled) . ' orang)';
            }
        }

        $roleCoveragePercent = min(100, (int) round(($filledRoleCount / $totalRoleSlots) * 100));

        $teamBalanceScore = (int) round(($skillCoveragePercent * 0.55) + ($roleCoveragePercent * 0.45));

        $gapsNote = '';
        if (! empty($unmetSkills)) {
            $gapsNote = ' Catatan: Masih terdapat keahlian yang belum terpenuhi: ' . implode(', ', array_map('ucwords', $unmetSkills)) . '.';
        }

        return [
            'optimal_candidates' => $optimalCandidates->all(),
            'team_balance_score' => $teamBalanceScore,
            'skill_coverage_percent' => $skillCoveragePercent,
            'role_coverage_percent' => $roleCoveragePercent,
            'covered_skills' => array_map('ucwords', $coveredSkillsList),
            'unmet_skills' => array_map('ucwords', $unmetSkills),
            'filled_roles' => $filledRoles,
            'unfilled_roles' => $unfilledRoles,
            'explanation' => $baseExplanation . $gapsNote,
            'is_fully_covered' => empty($unmetSkills) && empty($unfilledRoles),
        ];
    }
}
