<?php

namespace App\Services\Matchmaking;

use App\Models\CompetitionParticipation;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Collection;

class CompetitionMatchmakingService
{
    public function __construct(
        protected EligibilityService $eligibilityService,
        protected FairnessScoringService $fairnessService
    ) {}

    /**
     * Get ranked student candidate recommendations for a competition participation.
     *
     * @return Collection<int, array{
     *     user: User,
     *     final_score: int,
     *     breakdown: array{
     *         skill: int,
     *         role: int,
     *         availability: int,
     *         fairness: int
     *     },
     *     matched_skills: string[],
     *     missing_skills: string[],
     *     eligible: bool,
     *     ineligibility_reason: ?string,
     *     explanation: string
     * }>
     */
    public function getRecommendedCandidates(CompetitionParticipation $participation, ?User $viewer = null, int $limit = 15): Collection
    {
        $competition = $participation->competition;
        $team = $participation->team;
        $campusId = $competition->campus_id ?? ($viewer?->campusId() ?? $team?->campus_id);

        // Fetch students from same campus with eager loaded skills & counts (Zero N+1)
        $query = User::query()
            ->whereHas('memberships', function ($q) use ($campusId) {
                $q->where('role', \App\Enums\CampusRole::Student->value)
                  ->where('status', \App\Enums\MembershipStatus::Active->value);
                if ($campusId) {
                    $q->where('campus_id', $campusId);
                }
            })
            ->with(['profile.skills'])
            ->withCount([
                'achievements',
                'teamMemberships as completed_projects_count' => fn ($q) => $q->where('status', 'completed'),
                'applications as rejected_applications_count' => fn ($q) => $q->where('status', 'rejected'),
            ]);

        // Exclude members already in this team
        if ($team) {
            $existingMemberIds = $team->members()->pluck('user_id')->toArray();
            if (!empty($existingMemberIds)) {
                $query->whereNotIn('id', $existingMemberIds);
            }
        }

        $students = $query->take(100)->get();

        // Batch pre-fetch active competition memberships for these students (Zero N+1)
        $activeInCompIds = \App\Models\TeamMember::where('status', 'active')
            ->whereIn('user_id', $students->pluck('id'))
            ->whereHas('team.participations', fn ($q) => $q->where('competition_id', $participation->competition_id))
            ->pluck('user_id')
            ->flip()
            ->toArray();

        // Extract skills required by competition
        $requiredSkillNames = $this->extractRequiredSkills($participation);

        // Extract team open roles
        $openRoles = $team?->recruitment?->roles()
            ->where('filled_slots', '<', \Illuminate\Support\Facades\DB::raw('total_slots'))
            ->pluck('name')
            ->toArray() ?? [];

        $evaluated = $students->map(function (User $student) use ($participation, $requiredSkillNames, $openRoles, $activeInCompIds) {
            return $this->evaluateStudent($student, $participation, $requiredSkillNames, $openRoles, $activeInCompIds);
        });

        // Filter and sort: Prioritize eligible students with highest final_score
        return $evaluated->sortByDesc(function ($item) {
            $eligibilityBonus = $item['eligible'] ? 1000 : 0;
            return $eligibilityBonus + $item['final_score'];
        })->values()->take($limit);
    }

    /**
     * Evaluate a single student for a competition team.
     */
    public function evaluateStudent(
        User $student,
        CompetitionParticipation $participation,
        array $requiredSkills,
        array $openRoles,
        ?array $preloadedActiveInComp = null
    ): array {
        $profile = $student->profile ?? $student->studentProfile;
        $studentSkills = $profile?->skills?->pluck('name')->map(fn ($s) => strtolower(trim($s)))->toArray() ?? [];
        $studentInterests = array_map('strtolower', $profile?->interests ?? []);
        $studentPreferredRoles = array_map('strtolower', $profile?->preferred_roles ?? []);

        // 1. Skill Score (40%)
        $matchedSkills = [];
        $missingSkills = [];

        if (!empty($requiredSkills)) {
            foreach ($requiredSkills as $req) {
                $lowerReq = strtolower($req);
                $isMatched = false;
                foreach ($studentSkills as $sSkill) {
                    if (str_contains($sSkill, $lowerReq) || str_contains($lowerReq, $sSkill)) {
                        $matchedSkills[] = $req;
                        $isMatched = true;
                        break;
                    }
                }
                if (!$isMatched) {
                    $missingSkills[] = $req;
                }
            }
            $skillRatio = count($requiredSkills) > 0 ? (count($matchedSkills) / count($requiredSkills)) : 1.0;
            $skillScore = (int) round($skillRatio * 100);
        } else {
            // If competition doesn't specify exact required skills, evaluate general profile skills depth
            $skillScore = min(100, count($studentSkills) * 20);
            $matchedSkills = array_slice($studentSkills, 0, 4);
        }

        // 2. Role Fit Score (20%)
        $roleScore = 50; // base default
        $matchedRole = null;

        if (!empty($openRoles)) {
            foreach ($openRoles as $role) {
                $lowerRole = strtolower($role);
                foreach ($studentPreferredRoles as $pref) {
                    if (str_contains($pref, $lowerRole) || str_contains($lowerRole, $pref)) {
                        $roleScore = 100;
                        $matchedRole = $role;
                        break 2;
                    }
                }
                foreach ($studentInterests as $interest) {
                    if (str_contains($interest, $lowerRole) || str_contains($lowerRole, $interest)) {
                        $roleScore = max($roleScore, 85);
                        $matchedRole = $role;
                    }
                }
            }
        } else {
            // General role alignment based on competition category
            $category = strtolower($participation->competition?->category?->value ?? '');
            foreach ($studentPreferredRoles as $pref) {
                if (str_contains($pref, 'developer') || str_contains($pref, 'designer') || str_contains($pref, 'analyst')) {
                    $roleScore = 80;
                    break;
                }
            }
        }

        // 3. Availability Score (20%)
        $competitionId = $participation->competition_id;
        $hasActiveInThisComp = $preloadedActiveInComp !== null
            ? isset($preloadedActiveInComp[$student->id])
            : $this->eligibilityService->hasActiveCompetitionMembershipIn($student, $competitionId);
        $mode = config('matchmaking.membership_mode', 'flexible');

        $isAvailable = true;
        $ineligibilityReason = null;

        if ($hasActiveInThisComp) {
            $isAvailable = false;
            $ineligibilityReason = 'Sudah memiliki tim aktif dalam kompetisi ini.';
        } elseif ($mode === 'strict') {
            if ($this->eligibilityService->hasActiveProjectMembership($student)) {
                $isAvailable = false;
                $ineligibilityReason = 'Sedang memiliki proyek aktif di Project Hub (Mode Ketat).';
            } elseif ($this->eligibilityService->hasActiveCompetitionMembership($student)) {
                $isAvailable = false;
                $ineligibilityReason = 'Sedang tergabung dalam tim kompetisi aktif lain (Mode Ketat).';
            }
        }

        $availabilityScore = $isAvailable ? 100 : 15;

        // 4. Fair Opportunity / Beginner Boost (20%)
        // Use eager loaded count if present to prevent N+1 query
        $pastAchievementsCount = $student->achievements_count ?? $student->achievements()->count();
        $fairnessData = $this->fairnessService->computeFairnessScore($student);
        $fairnessScore = $fairnessData['score'];

        if ($pastAchievementsCount === 0) {
            // Beginner boost
            $fairnessScore = min(100, $fairnessScore + 20);
        }

        // Compute Weighted Final Score
        $finalScore = (int) round(
            (0.40 * $skillScore) +
            (0.20 * $roleScore) +
            (0.20 * $availabilityScore) +
            (0.20 * $fairnessScore)
        );

        // Generate Human-Readable Transparent Explanation
        $explanationParts = [];
        if (!empty($matchedSkills)) {
            $explanationParts[] = 'Menguasai ' . implode(', ', array_slice($matchedSkills, 0, 3));
        }
        if ($matchedRole) {
            $explanationParts[] = "Minat cocok dengan role {$matchedRole}";
        }
        if ($pastAchievementsCount === 0) {
            $explanationParts[] = 'Mendapat Boost Kesempatan Pemula (Fair Opportunity)';
        }
        if (!$isAvailable) {
            $explanationParts[] = "Perhatian: {$ineligibilityReason}";
        }

        $explanation = empty($explanationParts)
            ? 'Kandidat potensial dengan profil kompetensi aktif.'
            : implode('. ', $explanationParts) . '.';

        return [
            'user' => $student,
            'final_score' => $finalScore,
            'breakdown' => [
                'skill' => $skillScore,
                'role' => $roleScore,
                'availability' => $availabilityScore,
                'fairness' => $fairnessScore,
            ],
            'matched_skills' => $matchedSkills,
            'missing_skills' => $missingSkills,
            'eligible' => $isAvailable,
            'ineligibility_reason' => $ineligibilityReason,
            'explanation' => $explanation,
        ];
    }

    /**
     * Extract target skill names for the competition.
     *
     * @return string[]
     */
    protected function extractRequiredSkills(CompetitionParticipation $participation): array
    {
        $skills = [];
        $comp = $participation->competition;

        // Check if competition has required_skills field or category skills
        if ($comp && !empty($comp->eligibility)) {
            // Parse comma-separated or simple text if present
            $parts = explode(',', $comp->eligibility);
            foreach ($parts as $p) {
                $trimmed = trim($p);
                if (strlen($trimmed) >= 2 && strlen($trimmed) <= 30) {
                    $skills[] = $trimmed;
                }
            }
        }

        // Add skills from open recruitment roles if available
        if ($participation->team?->recruitment) {
            foreach ($participation->team->recruitment->roles as $role) {
                if (is_array($role->skills_required)) {
                    $skills = array_merge($skills, $role->skills_required);
                }
            }
        }

        // Category default fallback skills
        if (empty($skills) && $comp) {
            $cat = $comp->category?->value ?? '';
            $skills = match ($cat) {
                'hackathon' => ['React', 'Laravel', 'UI/UX', 'API'],
                'programming' => ['Algorithms', 'Data Structures', 'Python', 'C++'],
                'ui_ux' => ['Figma', 'User Research', 'Prototyping', 'Design System'],
                'business_plan' => ['Market Research', 'Pitch Deck', 'Financial Model', 'Business Strategy'],
                'ai_ml' => ['Machine Learning', 'Python', 'PyTorch', 'TensorFlow'],
                'cyber_security' => ['CTF', 'Network Security', 'Cryptography', 'Penetration Testing'],
                default => ['Problem Solving', 'Teamwork', 'Project Management'],
            };
        }

        return array_unique(array_filter($skills));
    }
}
