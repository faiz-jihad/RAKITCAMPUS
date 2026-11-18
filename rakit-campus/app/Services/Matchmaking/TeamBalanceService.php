<?php

namespace App\Services\Matchmaking;

use App\Models\Project;
use Illuminate\Support\Collection;

class TeamBalanceService
{
    /**
     * Compute comprehensive team balance analysis and radar data from real member data.
     *
     * @return array{
     *     overall_score: int,
     *     team_size: array{current: int, target: int, max: int, is_full: bool, vacancies: int},
     *     competencies_table: array<array{
     *         name: string,
     *         type: string,
     *         required: int,
     *         available: int,
     *         status: 'complete'|'partial'|'missing'|'overrepresented',
     *         contributors: string[]
     *     }>,
     *     radar_data: array<array{axis: string, label: string, score: int}>,
     *     member_contributions: array<array{
     *         user_id: int,
     *         name: string,
     *         role: string,
     *         skills: string[],
     *         primary_archetype: string
     *     }>,
     *     missing_competencies: string[],
     *     overrepresented_competencies: string[],
     *     analysis_summary: string
     * }
     */
    public function analyzeTeamBalance(Project $project): array
    {
        $project->loadMissing([
            'skills',
            'team.members.user.profile.skills',
            'team.recruitment.roles.members',
            'academicClass',
        ]);

        $team = $project->team;
        $members = $team ? $team->members()->whereIn('status', ['active', 'completed'])->with('user.profile.skills')->get() : collect();
        $targetSize = $project->max_team_size ?: ($project->academicClass?->target_team_size ?: ($team?->capacity ?: 4));
        $currentCount = $members->count();
        $vacancies = max(0, $targetSize - $currentCount);

        // 1. Collect all member skills & roles with contributors
        $skillDistribution = [];
        $roleDistribution = [];
        $memberContributions = [];

        foreach ($members as $member) {
            $user = $member->user;
            $userName = $user?->name ?? 'Anggota';
            $userSkills = [];

            if ($user && $user->profile) {
                foreach ($user->profile->skills as $skill) {
                    $sName = ucwords($skill->name);
                    $sLower = strtolower($skill->name);
                    $userSkills[] = $sName;

                    if (! isset($skillDistribution[$sLower])) {
                        $skillDistribution[$sLower] = [
                            'name' => $sName,
                            'count' => 0,
                            'max_proficiency' => 0,
                            'contributors' => [],
                        ];
                    }

                    $skillDistribution[$sLower]['count']++;
                    $prof = $skill->pivot->proficiency ?? 1;
                    $skillDistribution[$sLower]['max_proficiency'] = max($skillDistribution[$sLower]['max_proficiency'], $prof);
                    $skillDistribution[$sLower]['contributors'][] = "{$userName} (Lvl {$prof})";
                }
            }

            if ($member->role_name) {
                $rName = $member->role_name;
                $rLower = strtolower($rName);
                if (! isset($roleDistribution[$rLower])) {
                    $roleDistribution[$rLower] = [
                        'name' => $rName,
                        'count' => 0,
                        'contributors' => [],
                    ];
                }
                $roleDistribution[$rLower]['count']++;
                $roleDistribution[$rLower]['contributors'][] = $userName;
            }

            $isLeader = ($member->permission?->value ?? $member->permission) === 'leader' || ($user?->id && $user->id === $team?->leader_id);
            $primaryArchetype = $this->determinePrimaryArchetype($userSkills, $member->role_name, $isLeader);

            $memberContributions[] = [
                'user_id' => $user?->id ?? 0,
                'name' => $userName,
                'role' => $member->role_name ?? ($isLeader ? 'Project Leader' : 'Member'),
                'is_leader' => $isLeader,
                'skills' => array_slice($userSkills, 0, 5),
                'primary_archetype' => $primaryArchetype,
            ];
        }

        // 2. Build Competencies Table against project requirements
        $competenciesTable = [];
        $missingCompetencies = [];
        $overrepresentedCompetencies = [];

        // Required Project Skills
        foreach ($project->skills as $reqSkill) {
            $sLower = strtolower($reqSkill->name);
            $requiredProf = $reqSkill->pivot->min_proficiency ?? 1;

            $matchedContributors = [];
            $maxProf = 0;

            foreach ($members as $member) {
                $user = $member->user;
                $userName = $user?->name ?? 'Anggota';
                $roleLower = strtolower($member->role_name ?? '');

                $hasCompetency = false;
                $prof = 3; // Default proficiency when role matches

                // Check member role match
                if ($sLower === 'frontend' && (str_contains($roleLower, 'frontend') || str_contains($roleLower, 'web'))) {
                    $hasCompetency = true;
                } elseif ($sLower === 'backend' && (str_contains($roleLower, 'backend') || str_contains($roleLower, 'api'))) {
                    $hasCompetency = true;
                } elseif (($sLower === 'ui/ux' || $sLower === 'ui_ux') && (str_contains($roleLower, 'ui') || str_contains($roleLower, 'ux') || str_contains($roleLower, 'design'))) {
                    $hasCompetency = true;
                } elseif (str_contains($roleLower, $sLower)) {
                    $hasCompetency = true;
                }

                // Check member skills
                if ($user && $user->profile) {
                    foreach ($user->profile->skills as $s) {
                        $userSkillLower = strtolower($s->name);
                        $sProf = $s->pivot->proficiency ?? 1;

                        if ($sLower === 'frontend' && (str_contains($userSkillLower, 'react') || str_contains($userSkillLower, 'vue') || str_contains($userSkillLower, 'frontend') || str_contains($userSkillLower, 'html') || str_contains($userSkillLower, 'css') || str_contains($userSkillLower, 'tailwind') || str_contains($userSkillLower, 'typescript'))) {
                            $hasCompetency = true;
                            $prof = max($prof, $sProf);
                        } elseif ($sLower === 'backend' && (str_contains($userSkillLower, 'laravel') || str_contains($userSkillLower, 'php') || str_contains($userSkillLower, 'backend') || str_contains($userSkillLower, 'sql') || str_contains($userSkillLower, 'node') || str_contains($userSkillLower, 'api'))) {
                            $hasCompetency = true;
                            $prof = max($prof, $sProf);
                        } elseif (($sLower === 'ui/ux' || $sLower === 'ui_ux') && (str_contains($userSkillLower, 'figma') || str_contains($userSkillLower, 'ui') || str_contains($userSkillLower, 'ux') || str_contains($userSkillLower, 'design') || str_contains($userSkillLower, 'wirefram'))) {
                            $hasCompetency = true;
                            $prof = max($prof, $sProf);
                        } elseif (str_contains($userSkillLower, $sLower) || str_contains($sLower, $userSkillLower)) {
                            $hasCompetency = true;
                            $prof = max($prof, $sProf);
                        }
                    }
                }

                if ($hasCompetency) {
                    $entry = "{$userName} (Lvl {$prof})";
                    if (! in_array($entry, $matchedContributors)) {
                        $matchedContributors[] = $entry;
                        $maxProf = max($maxProf, $prof);
                    }
                }
            }

            $availableCount = count($matchedContributors);
            if ($availableCount === 0) {
                $status = 'missing';
                $missingCompetencies[] = $reqSkill->name;
            } elseif ($availableCount >= 4) {
                $status = 'overrepresented';
                $overrepresentedCompetencies[] = $reqSkill->name;
            } elseif ($maxProf >= $requiredProf) {
                $status = 'complete';
            } else {
                $status = 'partial';
            }

            $competenciesTable[] = [
                'name' => $reqSkill->name,
                'type' => 'Keahlian Teknis',
                'required' => $requiredProf,
                'available' => $maxProf,
                'status' => $status,
                'contributors' => $matchedContributors,
            ];
        }

        // Required Roles
        if ($team && $team->recruitment) {
            foreach ($team->recruitment->roles as $role) {
                $rLower = strtolower($role->name);
                $matchedCount = 0;
                $contributors = [];

                foreach ($roleDistribution as $candRoleLower => $candDist) {
                    if (str_contains($candRoleLower, $rLower) || str_contains($rLower, $candRoleLower)) {
                        $matchedCount += $candDist['count'];
                        $contributors = array_merge($contributors, $candDist['contributors']);
                    }
                }

                if ($matchedCount === 0) {
                    $status = 'missing';
                    $missingCompetencies[] = "Peran {$role->name}";
                } elseif ($matchedCount > $role->slots + 1) {
                    $status = 'overrepresented';
                    $overrepresentedCompetencies[] = "Peran {$role->name}";
                } elseif ($matchedCount >= $role->slots) {
                    $status = 'complete';
                } else {
                    $status = 'partial';
                }

                $competenciesTable[] = [
                    'name' => $role->name,
                    'type' => 'Posisi Peran',
                    'required' => $role->slots,
                    'available' => $matchedCount,
                    'status' => $status,
                    'contributors' => $contributors,
                ];
            }
        }

        // 3. Dynamic Team Balance Radar (6 axes computed from actual member skills)
        $radarData = $this->calculateRadarAxes($members);

        // 4. Calculate Overall Team Balance Score (0-100)
        $completeCount = collect($competenciesTable)->where('status', 'complete')->count();
        $totalRequired = max(1, count($competenciesTable));
        $coverageRatio = $completeCount / $totalRequired;

        $radarAvg = collect($radarData)->avg('score') ?? 50;
        $diversityFactor = min(1.0, collect($radarData)->where('score', '>=', 35)->count() / 4);

        $overallScore = (int) round(($coverageRatio * 50) + ($radarAvg * 0.3) + ($diversityFactor * 20));
        $overallScore = min(100, max(15, $overallScore));

        // 5. Generate human-readable analysis summary
        $summary = $this->generateSummaryText($overallScore, $currentCount, $targetSize, $missingCompetencies, $overrepresentedCompetencies);

        return [
            'overall_score' => $overallScore,
            'team_size' => [
                'current' => $currentCount,
                'target' => $targetSize,
                'max' => $targetSize,
                'is_full' => $currentCount >= $targetSize,
                'vacancies' => $vacancies,
            ],
            'competencies_table' => $competenciesTable,
            'radar_data' => $radarData,
            'member_contributions' => $memberContributions,
            'missing_competencies' => array_unique($missingCompetencies),
            'overrepresented_competencies' => array_unique($overrepresentedCompetencies),
            'analysis_summary' => $summary,
        ];
    }

    /**
     * Calculate 6 radar axes scores based on aggregated member skill profile data.
     */
    protected function calculateRadarAxes(Collection $members): array
    {
        $keywords = [
            'frontend' => ['react', 'vue', 'html', 'css', 'javascript', 'typescript', 'tailwind', 'next', 'frontend', 'ui developer'],
            'backend' => ['laravel', 'php', 'node', 'express', 'python', 'go', 'rest api', 'api', 'backend', 'golang', 'sql'],
            'ui_ux' => ['figma', 'prototype', 'wireframe', 'user research', 'ui/ux', 'design', 'canva', 'photoshop', 'illustrator'],
            'mobile_cloud' => ['flutter', 'react native', 'android', 'ios', 'docker', 'aws', 'cloud', 'devops', 'linux', 'ci/cd'],
            'database_qa' => ['mysql', 'postgresql', 'sqlite', 'database', 'testing', 'qa', 'unit test', 'jest', 'cypress', 'quality'],
            'management' => ['git', 'github', 'planning', 'communication', 'project management', 'agile', 'scrum', 'leadership', 'trello'],
        ];

        $scores = [
            'frontend' => 15,
            'backend' => 15,
            'ui_ux' => 15,
            'mobile_cloud' => 15,
            'database_qa' => 15,
            'management' => 20,
        ];

        foreach ($members as $member) {
            $user = $member->user;
            if (! $user || ! $user->profile) {
                continue;
            }

            foreach ($user->profile->skills as $skill) {
                $sLower = strtolower($skill->name);
                $prof = $skill->pivot->proficiency ?? 1;

                foreach ($keywords as $axis => $axisWords) {
                    foreach ($axisWords as $kw) {
                        if (str_contains($sLower, $kw) || str_contains($kw, $sLower)) {
                            $scores[$axis] = min(100, $scores[$axis] + ($prof * 9));
                            break;
                        }
                    }
                }
            }

            // Role bonuses
            $roleLower = strtolower($member->role_name ?? '');
            if (str_contains($roleLower, 'leader')) {
                $scores['management'] = min(100, $scores['management'] + 25);
            }
            if (str_contains($roleLower, 'frontend') || str_contains($roleLower, 'ui')) {
                $scores['frontend'] = min(100, $scores['frontend'] + 20);
            }
            if (str_contains($roleLower, 'backend')) {
                $scores['backend'] = min(100, $scores['backend'] + 20);
            }
        }

        return [
            ['axis' => 'frontend', 'label' => 'Frontend & Web', 'score' => min(100, (int) round($scores['frontend']))],
            ['axis' => 'backend', 'label' => 'Backend & API', 'score' => min(100, (int) round($scores['backend']))],
            ['axis' => 'ui_ux', 'label' => 'UI/UX Design', 'score' => min(100, (int) round($scores['ui_ux']))],
            ['axis' => 'mobile_cloud', 'label' => 'Mobile & Cloud', 'score' => min(100, (int) round($scores['mobile_cloud']))],
            ['axis' => 'database_qa', 'label' => 'Database & QA', 'score' => min(100, (int) round($scores['database_qa']))],
            ['axis' => 'management', 'label' => 'Project Leadership', 'score' => min(100, (int) round($scores['management']))],
        ];
    }

    protected function determinePrimaryArchetype(array $skills, ?string $roleName = null, bool $isLeader = false): string
    {
        $roleLower = strtolower($roleName ?? '');

        // 1. If assigned role explicitly indicates specialization or leadership, prioritize that
        if (str_contains($roleLower, 'ui') || str_contains($roleLower, 'ux') || str_contains($roleLower, 'design')) {
            return 'UI/UX Specialist';
        }
        if (str_contains($roleLower, 'frontend') || str_contains($roleLower, 'front-end')) {
            return 'Frontend Specialist';
        }
        if (str_contains($roleLower, 'backend') || str_contains($roleLower, 'back-end')) {
            return 'Backend Specialist';
        }
        if (str_contains($roleLower, 'mobile') || str_contains($roleLower, 'flutter') || str_contains($roleLower, 'android') || str_contains($roleLower, 'ios')) {
            return 'Mobile Specialist';
        }
        if (str_contains($roleLower, 'qa') || str_contains($roleLower, 'test') || str_contains($roleLower, 'quality')) {
            return 'Data & QA Engineer';
        }
        if (str_contains($roleLower, 'data') || str_contains($roleLower, 'ai') || str_contains($roleLower, 'machine learning')) {
            return 'Data & AI Specialist';
        }
        if (str_contains($roleLower, 'leader') || str_contains($roleLower, 'lead') || str_contains($roleLower, 'ketua') || $isLeader) {
            return 'Project Leader';
        }

        // 2. Otherwise determine by member skills scoring
        $scores = [
            'ui_ux' => 0,
            'frontend' => 0,
            'backend' => 0,
            'mobile' => 0,
            'database_qa' => 0,
        ];

        foreach ($skills as $s) {
            $sLower = strtolower($s);
            if (str_contains($sLower, 'figma') || str_contains($sLower, 'ui') || str_contains($sLower, 'ux') || str_contains($sLower, 'design') || str_contains($sLower, 'wirefram')) {
                $scores['ui_ux'] += 3;
            }
            if (str_contains($sLower, 'react') || str_contains($sLower, 'vue') || str_contains($sLower, 'frontend') || str_contains($sLower, 'html') || str_contains($sLower, 'css') || str_contains($sLower, 'tailwind') || str_contains($sLower, 'typescript') || str_contains($sLower, 'javascript')) {
                $scores['frontend'] += 3;
            }
            if (str_contains($sLower, 'laravel') || str_contains($sLower, 'php') || str_contains($sLower, 'backend') || str_contains($sLower, 'node') || str_contains($sLower, 'sql') || str_contains($sLower, 'express') || str_contains($sLower, 'django')) {
                $scores['backend'] += 3;
            }
            if (str_contains($sLower, 'flutter') || str_contains($sLower, 'dart') || str_contains($sLower, 'android') || str_contains($sLower, 'mobile') || str_contains($sLower, 'ios') || str_contains($sLower, 'react native')) {
                $scores['mobile'] += 3;
            }
            if (str_contains($sLower, 'database') || str_contains($sLower, 'qa') || str_contains($sLower, 'test') || str_contains($sLower, 'docker')) {
                $scores['database_qa'] += 2;
            }
            if (str_contains($sLower, 'api')) {
                $scores['backend'] += 1;
            }
        }

        arsort($scores);
        $topCategory = array_key_first($scores);
        $topScore = $scores[$topCategory] ?? 0;

        if ($topScore > 0) {
            return match ($topCategory) {
                'ui_ux' => 'UI/UX Specialist',
                'frontend' => 'Frontend Specialist',
                'backend' => 'Backend Specialist',
                'mobile' => 'Mobile Specialist',
                'database_qa' => 'Data & QA Engineer',
                default => 'Fullstack Collaborator',
            };
        }

        return 'Fullstack Collaborator';
    }

    protected function generateSummaryText(int $score, int $current, int $target, array $missing, array $overrepresented): string
    {
        $statusText = $score >= 80 ? 'Sangat Berimbang' : ($score >= 60 ? 'Cukup Berimbang' : 'Perlu Penguatan');
        $msg = "Status Keseimbangan Tim: {$statusText} ({$score}%). Kuota terisi {$current} dari {$target} orang.";

        if (! empty($missing)) {
            $msg .= ' Rekomendasi: Prioritaskan merekrut rekan untuk melengkapi ' . implode(', ', $missing) . '.';
        }

        if (! empty($overrepresented)) {
            $msg .= ' Hindari menambah anggota dengan spesialisasi ' . implode(', ', $overrepresented) . ' agar tidak terjadi ketimpangan peran.';
        }

        return $msg;
    }
}
