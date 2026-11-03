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

    /**
     * Compute matchmaking score and synergy between two student classmates.
     */
    public function matchStudentToStudent(StudentProfile $me, StudentProfile $peer, bool $peerHasTeam = false): array
    {
        $me->loadMissing(['skills', 'user']);
        $peer->loadMissing(['skills', 'user']);

        $mySkillMap = $me->skills->keyBy('name');
        $peerSkillMap = $peer->skills->keyBy('name');

        $sharedSkills = [];
        $complementarySkills = [];

        foreach ($peerSkillMap as $name => $skill) {
            if ($mySkillMap->has($name)) {
                $sharedSkills[] = $name;
            } else {
                $complementarySkills[] = $name;
            }
        }

        // 1. Skill Score (Max 50 points): Balance between complementary expansion & shared foundation
        $compCount = count($complementarySkills);
        $sharedCount = count($sharedSkills);
        $skillScore = min(50, ($compCount * 12) + ($sharedCount * 8));
        if ($skillScore === 0) {
            $skillScore = 20; // baseline for classmates
        }

        // 2. Role Synergy (Max 25 points)
        $myRoles = collect($me->preferred_roles ?? []);
        $peerRoles = collect($peer->preferred_roles ?? []);
        $roleOverlap = $myRoles->intersect($peerRoles)->count();
        $roleDiff = $peerRoles->diff($myRoles)->count();

        $roleScore = 15;
        if ($roleDiff > 0 && ($myRoles->isNotEmpty() || $peerRoles->isNotEmpty())) {
            $roleScore = 25; // Great balance of different roles
        }

        // 3. Availability Compatibility (Max 15 points)
        $myHours = $me->availability_hours ?? 10;
        $peerHours = $peer->availability_hours ?? 10;
        $hourDiff = abs($myHours - $peerHours);
        $availScore = max(5, 15 - (int) ($hourDiff / 3));

        // 4. Status synergy (Max 10 points): prioritized if peer still has no team
        $statusScore = !$peerHasTeam ? 10 : 5;

        $totalScore = min(99, max(55, $skillScore + $roleScore + $availScore + $statusScore));

        // Explanation text
        if (!empty($complementarySkills)) {
            $explanation = "Rekan ini melengkapi keahlian tim kamu di bidang " . implode(', ', array_slice($complementarySkills, 0, 3)) . ".";
        } elseif (!empty($sharedSkills)) {
            $explanation = "Memiliki keahlian yang serupa (" . implode(', ', array_slice($sharedSkills, 0, 2)) . ") sehingga mudah berkoordinasi secara teknis.";
        } else {
            $explanation = "Rekan satu kelas yang aktif dan siap berkolaborasi.";
        }

        $matchGrade = 'Cocok';
        if ($totalScore >= 90) {
            $matchGrade = 'Sangat Cocok';
        } elseif ($totalScore >= 78) {
            $matchGrade = 'Kombinasi Ideal';
        }

        return [
            'score' => $totalScore,
            'grade' => $matchGrade,
            'shared_skills' => $sharedSkills,
            'complementary_skills' => $complementarySkills,
            'explanation' => $explanation,
        ];
    }

    /**
     * Categorize a student profile into skill archetypes.
     * Archetypes: 'backend', 'frontend', 'design', 'analyst_qa'
     *
     * @return array<string>
     */
    public function getStudentArchetypes(StudentProfile $profile): array
    {
        $profile->loadMissing('skills');
        $skillNames = $profile->skills->pluck('name')->map(fn ($n) => strtolower(trim($n)))->all();
        $roles = collect($profile->preferred_roles ?? [])->map(fn ($r) => strtolower(trim($r)))->all();
        $combined = array_merge($skillNames, $roles);

        $backendKeywords = ['backend', 'api', 'laravel', 'php', 'node', 'express', 'python', 'django', 'fastapi', 'java', 'spring', 'go', 'golang', 'c++', 'c#', '.net', 'sql', 'mysql', 'postgresql', 'mongodb', 'docker', 'devops', 'cloud', 'redis', 'iot', 'embedded', 'database'];
        $frontendKeywords = ['frontend', 'web', 'react', 'next.js', 'vue', 'angular', 'svelte', 'flutter', 'dart', 'react native', 'android', 'ios', 'swift', 'kotlin', 'tailwind', 'css', 'html', 'javascript', 'typescript', 'mobile'];
        $designKeywords = ['ui', 'ux', 'ui/ux', 'design', 'figma', 'product design', 'wireframing', 'prototyping', 'user research', 'graphic'];
        $analystKeywords = ['qa', 'quality assurance', 'testing', 'cypress', 'jest', 'analyst', 'system analyst', 'scrum', 'project management', 'data', 'data science', 'ai', 'machine learning'];

        $archetypes = [];

        foreach ($combined as $term) {
            foreach ($backendKeywords as $kw) {
                if (str_contains($term, $kw)) {
                    $archetypes['backend'] = 'Backend / Database';
                    break;
                }
            }
            foreach ($frontendKeywords as $kw) {
                if (str_contains($term, $kw)) {
                    $archetypes['frontend'] = 'Frontend / Mobile';
                    break;
                }
            }
            foreach ($designKeywords as $kw) {
                if (str_contains($term, $kw)) {
                    $archetypes['design'] = 'UI/UX & Desain';
                    break;
                }
            }
            foreach ($analystKeywords as $kw) {
                if (str_contains($term, $kw)) {
                    $archetypes['analyst_qa'] = 'Analyst & QA';
                    break;
                }
            }
        }

        if (empty($archetypes)) {
            $archetypes['generalist'] = 'Pengembang Umum';
        }

        return $archetypes;
    }

    /**
     * Validate whether adding a candidate to a team violates class anti-ketimpangan / anti-monopoly rules.
     */
    public function validateTeamSynergyAndDiversity(Team $team, StudentProfile $candidateProfile, int $targetCapacity = 4): array
    {
        $team->loadMissing(['members.user.profile.skills']);
        $currentMemberCount = $team->members->count();

        // 1. Hard Capacity Cap
        if ($currentMemberCount >= $targetCapacity) {
            return [
                'allowed' => false,
                'code' => 'TEAM_FULL',
                'message' => "Kapasitas tim sudah terkunci penuh (maksimal {$targetCapacity} orang). Penambahan anggota ditolak untuk menjaga kesetaraan beban kerja kelas.",
            ];
        }

        // 2. Already member
        if ($team->members->contains('user_id', $candidateProfile->user_id)) {
            return [
                'allowed' => false,
                'code' => 'ALREADY_MEMBER',
                'message' => 'Mahasiswa ini sudah terdaftar sebagai anggota di kelompok ini.',
            ];
        }

        // 3. Count archetypes already in team
        $teamArchetypeCounts = [
            'backend' => 0,
            'frontend' => 0,
            'design' => 0,
            'analyst_qa' => 0,
            'generalist' => 0,
        ];

        foreach ($team->members as $member) {
            if ($member->user?->profile) {
                $memberArchetypes = $this->getStudentArchetypes($member->user->profile);
                foreach (array_keys($memberArchetypes) as $arch) {
                    if (isset($teamArchetypeCounts[$arch])) {
                        $teamArchetypeCounts[$arch]++;
                    }
                }
            }
        }

        $candidateArchetypes = array_keys($this->getStudentArchetypes($candidateProfile));

        // 4. Anti-Monopoly Skill Check:
        // If team already has 2 members of archetype X, and candidate ONLY has archetype X and brings NO missing core skills:
        // And if the team is missing Frontend or Backend entirely:
        $missingCore = [];
        if ($teamArchetypeCounts['backend'] === 0) $missingCore[] = 'Backend / Database';
        if ($teamArchetypeCounts['frontend'] === 0) $missingCore[] = 'Frontend / Mobile';
        if ($teamArchetypeCounts['design'] === 0) $missingCore[] = 'UI/UX & Desain';

        $isStrictMonopoly = false;
        $monopolyRoleName = '';

        foreach (['backend', 'frontend', 'design'] as $roleKey) {
            if ($teamArchetypeCounts[$roleKey] >= 2 && in_array($roleKey, $candidateArchetypes)) {
                // Check if candidate brings any of the missing core roles
                $bringsMissing = false;
                if ($teamArchetypeCounts['backend'] === 0 && in_array('backend', $candidateArchetypes)) $bringsMissing = true;
                if ($teamArchetypeCounts['frontend'] === 0 && in_array('frontend', $candidateArchetypes)) $bringsMissing = true;
                if ($teamArchetypeCounts['design'] === 0 && in_array('design', $candidateArchetypes)) $bringsMissing = true;

                if (!$bringsMissing && !empty($missingCore)) {
                    $isStrictMonopoly = true;
                    $monopolyRoleName = $roleKey === 'backend' ? 'Backend' : ($roleKey === 'frontend' ? 'Frontend/Mobile' : 'UI/UX');
                    break;
                }
            }
        }

        if ($isStrictMonopoly) {
            $missingStr = implode(' atau ', $missingCore);
            return [
                'allowed' => false,
                'code' => 'ROLE_MONOPOLY',
                'message' => "Aturan Anti-Ketimpangan: Tim Anda sudah memiliki 2 spesialis {$monopolyRoleName}. Untuk mencegah ketimpangan kelas, slot ini wajib diisi oleh rekan berkeahlian {$missingStr}!",
            ];
        }

        // 5. Allowed - check if complementary bonus applies
        $isComplementary = false;
        $benefitedRoles = [];
        foreach ($candidateArchetypes as $arch) {
            if (isset($teamArchetypeCounts[$arch]) && $teamArchetypeCounts[$arch] === 0) {
                $isComplementary = true;
                $benefitedRoles[] = $arch === 'backend' ? 'Backend' : ($arch === 'frontend' ? 'Frontend/Mobile' : ($arch === 'design' ? 'UI/UX' : 'Analyst/QA'));
            }
        }

        return [
            'allowed' => true,
            'code' => 'OK',
            'is_complementary' => $isComplementary,
            'message' => $isComplementary 
                ? 'Sangat Direkomendasikan: Rekan ini melengkapi slot peran kosong tim (' . implode(', ', $benefitedRoles) . ').'
                : 'Komposisi memenuhi standar diversitas tim kelas.',
        ];
    }

    /**
     * Distribute students across balanced teams using a multi-archetype fair allocation algorithm.
     *
     * @param Collection<User> $students
     * @param int $targetTeamSize
     * @return Collection<int, array{members: Collection<User>, balance_score: int, archetypes: array, roles_map: array}>
     */
    public function distributeStudentsFairly(Collection $students, int $targetTeamSize = 4): Collection
    {
        $targetTeamSize = max(2, min(10, $targetTeamSize));
        $totalStudents = $students->count();
        if ($totalStudents === 0) {
            return collect();
        }

        $numGroups = max(1, (int) ceil($totalStudents / $targetTeamSize));

        // Group students into archetype buckets
        $bucketBackend = [];
        $bucketFrontend = [];
        $bucketDesign = [];
        $bucketGeneral = [];

        foreach ($students as $student) {
            $profile = $student->profile ?? StudentProfile::firstOrCreate(
                ['user_id' => $student->id],
                ['campus_id' => $student->campusId() ?? 1, 'slug' => 'student-' . $student->id]
            );
            $archetypes = array_keys($this->getStudentArchetypes($profile));

            if (in_array('backend', $archetypes)) {
                $bucketBackend[] = $student;
            } elseif (in_array('frontend', $archetypes)) {
                $bucketFrontend[] = $student;
            } elseif (in_array('design', $archetypes)) {
                $bucketDesign[] = $student;
            } else {
                $bucketGeneral[] = $student;
            }
        }

        // Initialize group slots
        $groups = [];
        for ($i = 0; $i < $numGroups; $i++) {
            $groups[$i] = [
                'members' => collect(),
                'archetypes' => [],
            ];
        }

        // Pass 1: Round-robin Backend anchors
        $gIdx = 0;
        foreach ($bucketBackend as $student) {
            $groups[$gIdx % $numGroups]['members']->push($student);
            $groups[$gIdx % $numGroups]['archetypes'][] = 'backend';
            $gIdx++;
        }

        // Pass 2: Round-robin Frontend/Mobile in reverse order (to pair complementary opposites)
        $gIdx = $numGroups - 1;
        foreach ($bucketFrontend as $student) {
            $targetGroup = ($gIdx >= 0) ? ($gIdx % $numGroups) : (abs($gIdx) % $numGroups);
            $groups[$targetGroup]['members']->push($student);
            $groups[$targetGroup]['archetypes'][] = 'frontend';
            $gIdx--;
        }

        // Pass 3: Round-robin UI/UX Design & Product
        $gIdx = 0;
        foreach ($bucketDesign as $student) {
            // Pick group with fewest members or missing design
            usort($groups, fn ($a, $b) => $a['members']->count() <=> $b['members']->count());
            $groups[0]['members']->push($student);
            $groups[0]['archetypes'][] = 'design';
        }

        // Pass 4: Distribute Generalists / QA / Remaining students to equalize team sizes
        foreach ($bucketGeneral as $student) {
            usort($groups, fn ($a, $b) => $a['members']->count() <=> $b['members']->count());
            $groups[0]['members']->push($student);
            $groups[0]['archetypes'][] = 'generalist';
        }

        // Build result with balance scores and role assignments
        return collect($groups)->map(function ($group, $index) use ($targetTeamSize) {
            $members = $group['members'];
            $archetypes = array_unique($group['archetypes']);

            $hasBackend = in_array('backend', $archetypes);
            $hasFrontend = in_array('frontend', $archetypes);
            $hasDesign = in_array('design', $archetypes);

            $balanceScore = 70;
            if ($hasBackend && $hasFrontend && $hasDesign) {
                $balanceScore = 98; // Complete triangle
            } elseif ($hasBackend && $hasFrontend) {
                $balanceScore = 90; // Solid tech duo
            } elseif ($hasBackend || $hasFrontend) {
                $balanceScore = 80;
            }

            // Assign roles
            $roleTitles = [
                'Ketua Kelompok & Lead Architect',
                'Frontend & Mobile Specialist',
                'Backend & Database Engineer',
                'UI/UX & Quality Analyst',
                'Generalist & Dokumentasi Proyek',
            ];

            $rolesMap = [];
            foreach ($members as $mIdx => $m) {
                $rolesMap[$m->id] = $roleTitles[$mIdx] ?? 'Anggota Pengembang';
            }

            return [
                'index' => $index + 1,
                'members' => $members,
                'members_count' => $members->count(),
                'target_capacity' => $targetTeamSize,
                'balance_score' => $balanceScore,
                'archetypes' => $archetypes,
                'roles_map' => $rolesMap,
            ];
        });
    }

    /**
     * Rank all classmates for a student in an academic class.
     */
    public function rankClassmatesForStudent(
        StudentProfile $me, 
        Collection $classmates, 
        array $classProjectUserIds = [],
        ?Team $myTeam = null,
        int $targetCapacity = 4
    ): Collection
    {
        return $classmates
            ->filter(fn ($studentUser) => $studentUser->id !== $me->user_id)
            ->map(function ($studentUser) use ($me, $classProjectUserIds, $myTeam, $targetCapacity) {
                $peerProfile = $studentUser->profile ?? StudentProfile::firstOrCreate(
                    ['user_id' => $studentUser->id],
                    ['campus_id' => $me->campus_id, 'slug' => 'student-' . $studentUser->id]
                );
                $peerProfile->loadMissing('skills');

                $hasTeam = in_array($studentUser->id, $classProjectUserIds);
                $match = $this->matchStudentToStudent($me, $peerProfile, $hasTeam);

                // Anti-ketimpangan synergy validation against current student team
                $canInvite = true;
                $inviteBlockReason = null;
                $fillsTeamNeed = null;

                if ($myTeam) {
                    $validation = $this->validateTeamSynergyAndDiversity($myTeam, $peerProfile, $targetCapacity);
                    $canInvite = $validation['allowed'];
                    $inviteBlockReason = $validation['allowed'] ? null : $validation['message'];
                    if ($validation['is_complementary'] ?? false) {
                        $fillsTeamNeed = $validation['message'];
                    }
                } elseif ($hasTeam) {
                    $canInvite = false;
                    $inviteBlockReason = 'Sudah bergabung di kelompok lain pada kelas ini.';
                }

                return [
                    'student' => [
                        'id' => $studentUser->id,
                        'name' => $studentUser->name,
                        'email' => $studentUser->email,
                        'avatar' => $studentUser->avatar,
                        'student_number' => $studentUser->pivot?->student_number ?? 'NIM-' . $studentUser->id,
                        'study_program' => $peerProfile->study_program ?? 'Teknik Informatika',
                        'semester' => $peerProfile->semester ?? 4,
                        'has_team' => $hasTeam,
                        'availability_hours' => $peerProfile->availability_hours ?? 15,
                        'skills' => $peerProfile->skills->map(fn ($s) => [
                            'name' => $s->name,
                            'proficiency' => $s->pivot->proficiency ?? 3,
                        ])->all(),
                    ],
                    'match_score' => $match['score'],
                    'match_grade' => $match['grade'],
                    'shared_skills' => $match['shared_skills'],
                    'complementary_skills' => $match['complementary_skills'],
                    'explanation' => $match['explanation'],
                    'can_invite' => $canInvite,
                    'invite_block_reason' => $inviteBlockReason,
                    'fills_team_need' => $fillsTeamNeed,
                ];
            })
            ->sortByDesc('match_score')
            ->values();
    }
}
