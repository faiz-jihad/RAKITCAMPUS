<?php

namespace App\Services\Matchmaking;

use App\Models\Project;
use App\Models\User;

class CompatibilityScoringService
{
    public function __construct(
        protected TeamCompositionService $compositionService,
        protected FairnessScoringService $fairnessService
    ) {}

    /**
     * Calculate comprehensive compatibility score and transparent explanation.
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
    public function evaluate(User $student, Project $project): array
    {
        // 1. Skill Compatibility (30%)
        $skillData = $this->computeSkillScore($student, $project);

        // 2. Role Compatibility (20%)
        $roleData = $this->computeRoleScore($student, $project);

        // 3. Interest Compatibility (15%)
        $interestData = $this->computeInterestScore($student, $project);

        // 4. Availability Compatibility (10%)
        $availabilityData = $this->computeAvailabilityScore($student, $project);

        // 5. Team Diversity (15%)
        $diversityData = $this->compositionService->computeDiversityScore($student, $project);

        // 6. Opportunity Fairness (10%)
        $fairnessData = $this->fairnessService->computeFairnessScore($student);

        // Weighted formula as mandated in Section 6.B:
        // Final Score = (0.30 × Skill) + (0.20 × Role) + (0.15 × Interest) + (0.10 × Availability) + (0.15 × Diversity) + (0.10 × Fairness)
        $weightedScore = (
            (0.30 * $skillData['score']) +
            (0.20 * $roleData['score']) +
            (0.15 * $interestData['score']) +
            (0.10 * $availabilityData['score']) +
            (0.15 * $diversityData['score']) +
            (0.10 * $fairnessData['score'])
        );

        $finalScore = (int) round(min(100, max(0, $weightedScore)));

        // Generate transparent human-readable explanation
        $explanation = $this->generateExplanation(
            $finalScore,
            $skillData,
            $roleData,
            $interestData,
            $diversityData,
            $fairnessData
        );

        return [
            'final_score' => $finalScore,
            'breakdown' => [
                'skill' => $skillData['score'],
                'role' => $roleData['score'],
                'interest' => $interestData['score'],
                'availability' => $availabilityData['score'],
                'diversity' => $diversityData['score'],
                'fairness' => $fairnessData['score'],
            ],
            'matched_skills' => $skillData['matched_skills'],
            'missing_skills' => $skillData['missing_skills'],
            'complementary_skills' => $diversityData['complementary_skills'],
            'matched_roles' => $roleData['matched_roles'],
            'explanation' => $explanation,
        ];
    }

    /**
     * Skill compatibility score (0-100).
     */
    public function computeSkillScore(User $student, Project $project): array
    {
        $studentProfile = $student->relationLoaded('profile') ? $student->profile : $student->profile()->with('skills')->first();
        $studentSkills = collect();
        if ($studentProfile) {
            $studentSkills = $studentProfile->skills->keyBy(fn ($s) => strtolower($s->name));
        }

        // Project required skills
        $projectSkills = $project->relationLoaded('skills') ? $project->skills : $project->skills()->get();

        if ($projectSkills->isEmpty()) {
            // If project has no explicit skills required, base on general tech stack or neutral score
            return [
                'score' => 70,
                'matched_skills' => [],
                'missing_skills' => [],
            ];
        }

        $matched = [];
        $missing = [];
        $totalProficiencyScore = 0;

        foreach ($projectSkills as $reqSkill) {
            $lowerName = strtolower($reqSkill->name);
            if ($studentSkills->has($lowerName)) {
                $matched[] = $reqSkill->name;
                $studentSkill = $studentSkills->get($lowerName);
                $proficiency = $studentSkill->pivot->proficiency ?? 1;
                $minProf = $reqSkill->pivot->min_proficiency ?? 1;

                if ($proficiency >= $minProf) {
                    $totalProficiencyScore += 100;
                } else {
                    // Partial proficiency credit for beginners
                    $totalProficiencyScore += max(40, (int) round(($proficiency / max(1, $minProf)) * 100));
                }
            } else {
                $missing[] = $reqSkill->name;
            }
        }

        $coverageRatio = count($matched) / max(1, $projectSkills->count());
        $avgProficiency = count($matched) > 0 ? ($totalProficiencyScore / count($matched)) : 0;

        // Beginner project friendly adjustment
        if ($project->difficulty === 'beginner') {
            $coverageWeight = 0.5;
            $baseLearningBonus = 20;
        } else {
            $coverageWeight = 0.7;
            $baseLearningBonus = 0;
        }

        $score = ($coverageRatio * 100 * $coverageWeight) + ($avgProficiency * (1 - $coverageWeight)) + $baseLearningBonus;

        return [
            'score' => (int) round(min(100, max(15, $score))),
            'matched_skills' => $matched,
            'missing_skills' => $missing,
        ];
    }

    /**
     * Role compatibility score (0-100).
     */
    public function computeRoleScore(User $student, Project $project): array
    {
        $studentProfile = $student->relationLoaded('profile') ? $student->profile : $student->profile;
        $preferredRoles = collect($studentProfile?->preferred_roles ?? [])->map(fn ($r) => strtolower($r));

        $recruitment = $project->team?->recruitment;
        if (! $recruitment) {
            return [
                'score' => 70,
                'matched_roles' => [],
            ];
        }

        $openRoles = $recruitment->roles->filter(fn ($r) => $r->vacancies() > 0);
        if ($openRoles->isEmpty()) {
            return [
                'score' => 50,
                'matched_roles' => [],
            ];
        }

        $matchedRoles = [];
        foreach ($openRoles as $or) {
            $orLower = strtolower($or->name);
            foreach ($preferredRoles as $pr) {
                if (str_contains($orLower, $pr) || str_contains($pr, $orLower)) {
                    $matchedRoles[] = $or->name;
                    break;
                }
            }
        }

        $matchedRoles = array_unique($matchedRoles);

        if (count($matchedRoles) > 0) {
            $score = 85 + min(15, count($matchedRoles) * 5);
        } elseif ($preferredRoles->isEmpty()) {
            $score = 65; // Neutral if no preference declared
        } else {
            $score = 40; // Mismatch with open positions
        }

        return [
            'score' => (int) round(min(100, max(20, $score))),
            'matched_roles' => array_values($matchedRoles),
        ];
    }

    /**
     * Interest compatibility score (0-100).
     */
    public function computeInterestScore(User $student, Project $project): array
    {
        $studentProfile = $student->relationLoaded('profile') ? $student->profile : $student->profile;
        $interests = collect($studentProfile?->interests ?? [])->map(fn ($i) => strtolower($i));

        if ($interests->isEmpty()) {
            return ['score' => 60];
        }

        $projectCategory = strtolower($project->category->value ?? (string) $project->category);
        $projectTech = collect($project->tech_stack ?? [])->map(fn ($t) => strtolower($t));

        $isCategoryMatched = $interests->contains(fn ($i) => str_contains($projectCategory, $i) || str_contains($i, $projectCategory));
        $techOverlap = $interests->intersect($projectTech)->count();

        $score = 50;
        if ($isCategoryMatched) {
            $score += 35;
        }
        $score += min(15, $techOverlap * 5);

        return [
            'score' => (int) round(min(100, max(25, $score))),
        ];
    }

    /**
     * Availability compatibility score (0-100).
     */
    public function computeAvailabilityScore(User $student, Project $project): array
    {
        $studentProfile = $student->relationLoaded('profile') ? $student->profile : $student->profile;
        $studentHours = $studentProfile?->availability_hours ?? 10;

        // Benchmark project required hours based on difficulty
        $requiredHours = match ($project->difficulty) {
            'advanced' => 15,
            'beginner' => 8,
            default => 10,
        };

        if ($studentHours >= $requiredHours) {
            $score = 90 + min(10, ($studentHours - $requiredHours) * 2);
        } else {
            // Ratio of commitment
            $ratio = $studentHours / max(1, $requiredHours);
            $score = (int) round($ratio * 80);
        }

        return [
            'score' => (int) round(min(100, max(30, $score))),
        ];
    }

    /**
     * Generate clear, honest explanation string.
     */
    protected function generateExplanation(
        int $finalScore,
        array $skillData,
        array $roleData,
        array $interestData,
        array $diversityData,
        array $fairnessData
    ): string {
        $parts = [];

        if (! empty($skillData['matched_skills'])) {
            $parts[] = 'Menguasai keahlian kunci: ' . implode(', ', array_slice($skillData['matched_skills'], 0, 3));
        }

        if (! empty($roleData['matched_roles'])) {
            $parts[] = 'Cocok untuk peran: ' . implode(', ', $roleData['matched_roles']);
        }

        if (! empty($diversityData['complementary_skills'])) {
            $parts[] = 'Membawa variasi skill baru bagi tim (' . implode(', ', array_slice($diversityData['complementary_skills'], 0, 2)) . ')';
        }

        if ($fairnessData['details']['is_first_timer']) {
            $parts[] = 'Mendapat afirmasi kesempatan adil sebagai mahasiswa baru / proyek perdana';
        } elseif ($fairnessData['details']['recent_rejections_count'] > 0) {
            $parts[] = 'Mendapat prioritas pemerataan peluang kolaborasi';
        }

        if (empty($parts)) {
            $parts[] = 'Memiliki kualifikasi dasar yang sesuai dengan kriteria proyek';
        }

        return implode('. ', $parts) . '.';
    }
}
