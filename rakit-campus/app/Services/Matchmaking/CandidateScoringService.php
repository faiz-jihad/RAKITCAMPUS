<?php

namespace App\Services\Matchmaking;

use App\Models\Project;
use App\Models\User;

class CandidateScoringService
{
    public function __construct(
        protected CompatibilityScoringService $compatibilityScoringService
    ) {}

    /**
     * Evaluate a candidate student against project requirements using the 6-component weighted formula:
     * Final Score = (0.30 × Skill) + (0.20 × Role) + (0.15 × Interest) + (0.10 × Availability) + (0.15 × Diversity) + (0.10 × Fairness)
     *
     * @return array{
     *     final_score: int,
     *     breakdown: array{
     *         skill: int,
     *         role: int,
     *         interest: int,
     *         availability: int,
     *         diversity: int,
     *         fairness: int
     *     },
     *     matched_skills: string[],
     *     missing_skills: string[],
     *     complementary_skills: string[],
     *     matched_roles: string[],
     *     explanation: string
     * }
     */
    public function scoreCandidate(User $candidate, Project $project): array
    {
        return $this->compatibilityScoringService->evaluate($candidate, $project);
    }

    public function evaluate(User $candidate, Project $project): array
    {
        return $this->compatibilityScoringService->evaluate($candidate, $project);
    }
}
