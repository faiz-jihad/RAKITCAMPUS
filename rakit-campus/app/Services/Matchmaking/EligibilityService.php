<?php

namespace App\Services\Matchmaking;

use App\Enums\ProjectStatus;
use App\Models\AcademicClass;
use App\Models\Project;
use App\Models\RecruitmentRole;
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
        // Rule 1: One Student, One Active Project / Activity
        if ($this->hasActiveProjectMembership($student)) {
            return [
                'eligible' => false,
                'reason' => 'Mahasiswa sudah tergabung dalam proyek aktif lain (Aturan 1 Mahasiswa 1 Proyek Aktif).',
            ];
        }

        if (config('matchmaking.membership_mode', 'strict') === 'strict' && $this->hasActiveCompetitionMembership($student)) {
            return [
                'eligible' => false,
                'reason' => 'Mahasiswa sudah memiliki tim kompetisi aktif (Aturan Mode Ketat: 1 Proyek/Kompetisi Aktif).',
            ];
        }

        // Rule 2: Class-based eligibility if class is specified
        if ($class && ! $this->isStudentInClass($student, $class->id)) {
            return [
                'eligible' => false,
                'reason' => "Mahasiswa bukan anggota dari kelas {$class->code}.",
            ];
        }

        // Project specific checks
        if ($project) {
            if ($project->academic_class_id && $class && $project->academic_class_id !== $class->id) {
                return [
                    'eligible' => false,
                    'reason' => 'Proyek ini terdaftar untuk kelas yang berbeda.',
                ];
            }

            if ($project->academic_class_id && ! $this->isStudentInClass($student, $project->academic_class_id)) {
                return [
                    'eligible' => false,
                    'reason' => 'Mahasiswa belum terdaftar dalam kelas proyek ini.',
                ];
            }

            // Rule 3: Project Capacity
            if (! $this->hasProjectCapacity($project)) {
                return [
                    'eligible' => false,
                    'reason' => 'Kapasitas tim proyek sudah penuh.',
                ];
            }
        }

        return [
            'eligible' => true,
            'reason' => null,
        ];
    }

    /**
     * Check if student currently holds an active project membership.
     */
    public function hasActiveProjectMembership(User $student): bool
    {
        // Eager load or check via query
        return TeamMember::where('user_id', $student->id)
            ->where('status', 'active')
            ->whereHas('team.project', function ($query) {
                $query->whereNotIn('status', [
                    ProjectStatus::Archived->value,
                    ProjectStatus::Completed->value,
                ]);
            })
            ->exists();
    }

    /**
     * Check if student currently holds an active competition team membership.
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
     *
     * @return array{eligible: bool, reason: string|null}
     */
    public function checkCompetitionEligibility(User $student, ?Team $team = null): array
    {
        $mode = config('matchmaking.membership_mode', 'strict');

        if ($mode === 'strict' && $this->hasActiveProjectMembership($student)) {
            return [
                'eligible' => false,
                'reason' => 'Mahasiswa sudah tergabung dalam proyek akademik aktif di Project Hub (Aturan 1 Aktivitas Aktif).',
            ];
        }

        if ($this->hasActiveCompetitionMembership($student)) {
            return [
                'eligible' => false,
                'reason' => 'Mahasiswa sudah tergabung dalam tim kompetisi aktif lain.',
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

        $maxCapacity = $project->max_team_size ?: ($team->capacity ?: 5);
        $currentMembers = $team->members()->where('status', 'active')->count();

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
