<?php

namespace App\Services\Matchmaking;

use App\Enums\ProjectStatus;
use App\Models\AcademicClass;
use App\Models\Application;
use App\Models\Project;
use App\Models\RecruitmentRole;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;

class EligibilityService
{
    /**
     * Check if a student is eligible to join an active project.
     *
     * @return array{eligible: bool, reason: string|null}
     */
    public function checkStudentEligibility(User $student, ?Project $project = null, ?AcademicClass $class = null): array
    {
        if ($project) {
            $project->loadMissing(['team.recruitment']);

            if ($project->academic_class_id && $class && $project->academic_class_id !== $class->id) {
                return [
                    'eligible' => false,
                    'reason' => 'Proyek ini terdaftar untuk kelas yang berbeda.',
                ];
            }

            // 1. Must not be the project leader or existing team member
            if ($project->isLeader($student) || ($project->team && $project->team->hasMember($student))) {
                return [
                    'eligible' => false,
                    'reason' => 'Mahasiswa sudah menjadi ketua atau anggota pada proyek ini.',
                ];
            }

            // 2. Prevent duplicate active application to the same project recruitment
            $recruitment = $project->team?->recruitment;
            if ($recruitment) {
                $hasActiveApplication = Application::where('recruitment_id', $recruitment->id)
                    ->where('user_id', $student->id)
                    ->whereIn('status', ['pending', 'under_review', 'submitted', 'accepted'])
                    ->exists();

                if ($hasActiveApplication) {
                    return [
                        'eligible' => false,
                        'reason' => 'Anda sudah mengirimkan pengajuan aktif pada proyek ini dan sedang menunggu peninjauan.',
                    ];
                }
            }

            // 3. Project recruitment status is strictly separated from Workspace approval:
            //    Recruitment stays allowed whenever project is recruiting and recruitment is open,
            //    as long as formation has not been locked/workspace activated.
            $projStatus = $project->status instanceof ProjectStatus ? $project->status : ProjectStatus::tryFrom((string) $project->status);
            if ($projStatus !== ProjectStatus::Recruiting || ! $recruitment || ! $recruitment->isOpen()) {
                return [
                    'eligible' => false,
                    'reason' => 'Rekrutmen anggota tim pada proyek ini sedang ditutup.',
                ];
            }

            if (in_array($project->formation_status, ['team_locked', 'workspace_activated'], true)) {
                return [
                    'eligible' => false,
                    'reason' => 'Susunan tim proyek ini telah dikunci (team formation locked).',
                ];
            }

            // 4. Project Capacity
            if (! $this->hasProjectCapacity($project)) {
                return [
                    'eligible' => false,
                    'reason' => 'Kapasitas tim proyek sudah penuh.',
                ];
            }

            // 5. Class Boundary Check
            if ($project->academic_class_id && ! $this->isStudentInClass($student, $project->academic_class_id)) {
                return [
                    'eligible' => false,
                    'reason' => 'Mahasiswa belum terdaftar dalam kelas proyek ini (Batas Kelas Ketat).',
                ];
            }
        }

        // Class-based eligibility if class is specified independently
        if ($class && ! $this->isStudentInClass($student, $class->id)) {
            return [
                'eligible' => false,
                'reason' => "Mahasiswa bukan anggota dari kelas {$class->code}.",
            ];
        }

        // 6. Rule 1: One Student, One Active Project per Class (or globally if non-class project)
        $targetClassId = $project?->academic_class_id ?? $class?->id;
        if ($this->hasActiveProjectMembership($student, $targetClassId)) {
            return [
                'eligible' => false,
                'reason' => $targetClassId
                    ? 'Mahasiswa sudah tergabung dalam proyek aktif lain di kelas ini (Aturan 1 Mahasiswa 1 Proyek Aktif).'
                    : 'Mahasiswa sudah tergabung dalam proyek aktif lain (Aturan 1 Mahasiswa 1 Proyek Aktif).',
            ];
        }

        if (config('matchmaking.membership_mode', 'strict') === 'strict' && $this->hasActiveCompetitionMembership($student)) {
            return [
                'eligible' => false,
                'reason' => 'Mahasiswa sudah memiliki tim kompetisi aktif (Aturan Mode Ketat: 1 Proyek/Kompetisi Aktif).',
            ];
        }

        return [
            'eligible' => true,
            'reason' => null,
        ];
    }

    /**
     * Check if student currently holds an active project membership.
     * When $academicClassId is specified, scopes the check to that academic class.
     * Checks in-memory eager loaded relation if present (Zero N+1 query).
     */
    public function hasActiveProjectMembership(User $student, ?int $academicClassId = null): bool
    {
        if ($student->relationLoaded('teamMemberships')) {
            return $student->teamMemberships->contains(function ($m) use ($academicClassId) {
                if ($m->status !== 'active') {
                    return false;
                }
                $project = $m->team?->project;
                if (!$project) {
                    return false;
                }
                if ($academicClassId !== null && (int) $project->academic_class_id !== $academicClassId) {
                    return false;
                }
                $status = $project->status?->value ?? $project->status;
                return !in_array($status, [
                    ProjectStatus::Archived->value,
                    ProjectStatus::Completed->value,
                ], true);
            });
        }

        return TeamMember::where('user_id', $student->id)
            ->where('status', 'active')
            ->whereHas('team.project', function ($query) use ($academicClassId) {
                $query->whereNotIn('status', [
                    ProjectStatus::Archived->value,
                    ProjectStatus::Completed->value,
                ]);
                if ($academicClassId !== null) {
                    $query->where('academic_class_id', $academicClassId);
                }
            })
            ->exists();
    }

    /**
     * Check if student currently holds an active competition team membership in a specific competition.
     * Checks in-memory eager loaded relation if present (Zero N+1 query).
     */
    public function hasActiveCompetitionMembershipIn(User $student, int $competitionId): bool
    {
        if ($student->relationLoaded('teamMemberships')) {
            return $student->teamMemberships->contains(function ($m) use ($competitionId) {
                if ($m->status !== 'active' || !$m->team) {
                    return false;
                }
                if ($m->team->relationLoaded('participations')) {
                    return $m->team->participations->contains(function ($p) use ($competitionId) {
                        return $p->competition_id === $competitionId && !in_array($p->stage, ['winner', 'not_selected', 'withdrawn'], true);
                    });
                }
                return false;
            });
        }

        return TeamMember::where('user_id', $student->id)
            ->where('status', 'active')
            ->whereHas('team.participations', function ($query) use ($competitionId) {
                $query->where('competition_id', $competitionId)
                    ->whereNotIn('stage', [
                        'winner',
                        'not_selected',
                        'withdrawn',
                    ]);
            })
            ->exists();
    }

    /**
     * Check if student currently holds an active competition team membership (any competition).
     */
    public function hasActiveCompetitionMembership(User $student): bool
    {
        return TeamMember::where('user_id', $student->id)
            ->where('status', 'active')
            ->whereHas('team.participations', function ($query) {
                $query->whereNotIn('stage', [
                    'winner',
                    'not_selected',
                    'withdrawn',
                ]);
            })
            ->exists();
    }

    /**
     * Check if a student is eligible to join or create a competition team.
     * Enforces Flexible Membership by default:
     * - Max 1 team membership per competition
     * - Project Hub membership does not block Competition Hub
     * - Multiple concurrent competitions allowed
     *
     * @return array{eligible: bool, reason: string|null}
     */
    public function checkCompetitionEligibility(User $student, ?Team $team = null, ?int $competitionId = null): array
    {
        $mode = config('matchmaking.membership_mode', 'flexible');

        if ($mode === 'strict') {
            if ($this->hasActiveProjectMembership($student)) {
                return [
                    'eligible' => false,
                    'reason' => 'Mahasiswa sudah tergabung dalam proyek akademik aktif di Project Hub (Aturan Mode Ketat: 1 Aktivitas Aktif).',
                ];
            }
            if ($this->hasActiveCompetitionMembership($student)) {
                return [
                    'eligible' => false,
                    'reason' => 'Mahasiswa sudah tergabung dalam tim kompetisi aktif lain (Aturan Mode Ketat).',
                ];
            }
        }

        // Flexible Membership (Default): Check specific competition boundary
        $targetCompId = $competitionId;
        if (! $targetCompId && $team) {
            $targetCompId = $team->participations()->latest()->value('competition_id');
        }

        if ($targetCompId && $this->hasActiveCompetitionMembershipIn($student, $targetCompId)) {
            return [
                'eligible' => false,
                'reason' => 'Mahasiswa sudah memiliki tim aktif dalam kompetisi ini (Aturan 1 Tim per Kompetisi).',
            ];
        }

        if ($team) {
            $participation = $team->participations()->latest()->first();
            if ($participation && $participation->is_formation_locked) {
                return [
                    'eligible' => false,
                    'reason' => 'Susunan tim kompetisi ini telah dikunci (formation locked).',
                ];
            }

            $currentMembers = $team->members()->where('status', 'active')->count();
            if ($team->capacity && $currentMembers >= $team->capacity) {
                return [
                    'eligible' => false,
                    'reason' => 'Kapasitas anggota tim kompetisi sudah penuh.',
                ];
            }
        }

        return [
            'eligible' => true,
            'reason' => null,
        ];
    }

    /**
     * Check if student is enrolled in a specific academic class.
     */
    public function isStudentInClass(User $student, int $classId): bool
    {
        return $student->enrolledClasses()
            ->where('academic_class_id', $classId)
            ->wherePivot('status', 'enrolled')
            ->exists();
    }

    /**
     * Check if a project has available capacity.
     */
    public function hasProjectCapacity(Project $project): bool
    {
        $team = $project->team;
        if (! $team) {
            return true;
        }

        $maxCapacity = (int) ($project->max_team_size ?: ($team->capacity ?: 5));
        if ($project->academic_class_id) {
            $classTarget = $project->relationLoaded('academicClass')
                ? $project->academicClass?->target_team_size
                : AcademicClass::where('id', $project->academic_class_id)->value('target_team_size');

            if ($classTarget && (int) $classTarget > 0) {
                $maxCapacity = min($maxCapacity, (int) $classTarget);
            }
        }

        $currentMembers = $team->relationLoaded('members')
            ? $team->members->where('status', 'active')->count()
            : $team->members()->where('status', 'active')->count();

        return $currentMembers < $maxCapacity;
    }

    /**
     * Check if a specific recruitment role has vacancies.
     */
    public function hasRoleVacancy(RecruitmentRole $role): bool
    {
        $filled = TeamMember::where('recruitment_role_id', $role->id)
            ->where('status', 'active')
            ->count();

        return $filled < $role->slots;
    }
}
