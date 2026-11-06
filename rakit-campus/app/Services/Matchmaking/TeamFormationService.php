<?php

namespace App\Services\Matchmaking;

use App\Enums\ProjectStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\SkillType;
use App\Models\MatchingAuditLog;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Skill;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TeamFormationService
{
    /**
     * Step 1: Configure project requirements (Roles, competencies, team capacity, weekly hours, deadline).
     */
    public function configureRequirements(Project $project, array $data, User $user): Project
    {
        if (! $project->isLeader($user) && ! $user->isPlatformAdmin()) {
            throw ValidationException::withMessages([
                'auth' => ['Hanya ketua proyek yang berwenang mengonfigurasi kebutuhan tim.'],
            ]);
        }

        return DB::transaction(function () use ($project, $data, $user) {
            $project->update([
                'min_team_size' => $data['min_team_size'] ?? 2,
                'max_team_size' => $data['max_team_size'] ?? 4,
                'expected_weekly_hours' => $data['expected_weekly_hours'] ?? 10,
                'formation_deadline' => $data['formation_deadline'] ?? null,
                'formation_status' => 'requirements_configured',
            ]);

            $team = $project->team;
            if ($team) {
                $team->update(['capacity' => $project->max_team_size]);

                $recruitment = $team->recruitment ?? Recruitment::create([
                    'campus_id' => $team->campus_id,
                    'team_id' => $team->id,
                    'title' => 'Rekrutmen Terbuka ' . $project->title,
                    'status' => RecruitmentStatus::Open,
                ]);

                // Sync custom roles if provided
                if (! empty($data['roles'])) {
                    // Remove existing vacant roles
                    $recruitment->roles()->whereDoesntHave('members')->delete();

                    foreach ($data['roles'] as $roleData) {
                        RecruitmentRole::create([
                            'recruitment_id' => $recruitment->id,
                            'name' => $roleData['name'],
                            'description' => $roleData['description'] ?? null,
                            'slots' => $roleData['slots'] ?? 1,
                            'priority' => $roleData['priority'] ?? 'normal',
                            'required_skills' => $roleData['required_skills'] ?? [],
                            'optional_skills' => $roleData['optional_skills'] ?? [],
                            'min_proficiency' => $roleData['min_proficiency'] ?? 2,
                        ]);
                    }
                }
            }

            // Sync required project technical skills
            if (! empty($data['skills'])) {
                $skillData = [];
                foreach ($data['skills'] as $s) {
                    $skill = Skill::resolve($s['name'], SkillType::Technical);
                    $skillData[$skill->id] = ['min_proficiency' => $s['min_proficiency'] ?? 2];
                }
                $project->skills()->sync($skillData);
            }

            MatchingAuditLog::log(
                'requirements_configured',
                ['min' => $project->min_team_size, 'max' => $project->max_team_size],
                $project->academic_class_id,
                $project->id,
                $user->id
            );

            return $project;
        });
    }

    /**
     * Step 2: Open matchmaking for students to apply or receive invitations.
     */
    public function openMatchmaking(Project $project, User $user): void
    {
        if (! $project->isLeader($user) && ! $user->isPlatformAdmin()) {
            throw ValidationException::withMessages(['auth' => ['Hanya ketua tim yang dapat membuka sesi matchmaking.']]);
        }

        DB::transaction(function () use ($project) {
            $project->update(['formation_status' => 'matchmaking_open']);

            if ($project->team?->recruitment) {
                $project->team->recruitment->update(['status' => RecruitmentStatus::Open]);
            }
        });
    }

    /**
     * Step 3: Submit proposed team composition for lecturer review.
     */
    public function submitForReview(Project $project, User $user): void
    {
        if (! $project->isLeader($user) && ! $user->isPlatformAdmin()) {
            throw ValidationException::withMessages(['auth' => ['Hanya ketua proyek yang dapat mengajukan susunan tim untuk evaluasi dosen.']]);
        }

        $team = $project->team;
        $activeMembersCount = $team ? $team->members()->where('status', 'active')->count() : 0;
        $minRequired = $project->min_team_size ?: 2;

        if ($activeMembersCount < $minRequired) {
            throw ValidationException::withMessages([
                'team' => ["Jumlah anggota tim aktif ({$activeMembersCount}) belum memenuhi batas minimum ({$minRequired} orang)."],
            ]);
        }

        DB::transaction(function () use ($project, $user, $activeMembersCount) {
            $project->update([
                'formation_status' => 'formation_review',
                'formation_notes' => null,
            ]);

            MatchingAuditLog::log(
                'formation_submitted_review',
                ['active_members' => $activeMembersCount],
                $project->academic_class_id,
                $project->id,
                $user->id
            );
        });
    }

    /**
     * Step 4: Lecturer approves proposed team formation.
     */
    public function approveFormation(Project $project, User $lecturer, ?string $notes = null): void
    {
        $class = $project->academicClass;
        if (! $class || (! $class->isLecturer($lecturer) && ! $lecturer->isPlatformAdmin())) {
            throw ValidationException::withMessages([
                'auth' => ['Hanya dosen pengampu kelas proyek ini yang berwenang menyetujui susunan tim.'],
            ]);
        }

        DB::transaction(function () use ($project, $lecturer, $notes, $class) {
            $project->update([
                'formation_status' => 'lecturer_approved',
                'formation_approved_at' => now(),
                'formation_approved_by' => $lecturer->id,
                'formation_notes' => $notes ?? 'Susunan tim proyek telah disetujui dosen pengampu.',
                'status' => ProjectStatus::InProgress,
            ]);

            // Close recruitment
            if ($project->team?->recruitment) {
                $project->team->recruitment->update(['status' => RecruitmentStatus::Closed]);
            }

            MatchingAuditLog::log(
                'formation_approved',
                ['notes' => $notes],
                $class->id,
                $project->id,
                $lecturer->id
            );
        });
    }

    /**
     * Lecturer rejects proposed team formation.
     */
    public function rejectFormation(Project $project, User $lecturer, string $reason): void
    {
        $class = $project->academicClass;
        if (! $class || (! $class->isLecturer($lecturer) && ! $lecturer->isPlatformAdmin())) {
            throw ValidationException::withMessages(['auth' => ['Hanya dosen pengampu yang berwenang menolak susunan tim.']]);
        }

        DB::transaction(function () use ($project, $reason, $class, $lecturer) {
            $project->update([
                'formation_status' => 'requirements_configured',
                'formation_notes' => $reason,
            ]);

            MatchingAuditLog::log(
                'formation_rejected',
                ['reason' => $reason],
                $class->id,
                $project->id,
                $lecturer->id
            );
        });
    }

    /**
     * Lecturer requests adjustments to the team composition.
     */
    public function requestChanges(Project $project, User $lecturer, string $revisionNotes): void
    {
        $class = $project->academicClass;
        if (! $class || (! $class->isLecturer($lecturer) && ! $lecturer->isPlatformAdmin())) {
            throw ValidationException::withMessages(['auth' => ['Hanya dosen pengampu yang berwenang meminta revisi susunan tim.']]);
        }

        DB::transaction(function () use ($project, $revisionNotes, $class, $lecturer) {
            $project->update([
                'formation_status' => 'matchmaking_open',
                'formation_notes' => $revisionNotes,
            ]);

            MatchingAuditLog::log(
                'formation_revision_requested',
                ['revision_notes' => $revisionNotes],
                $class->id,
                $project->id,
                $lecturer->id
            );
        });
    }

    /**
     * Step 5: Lock team formation and activate Project Workspace.
     */
    public function activateWorkspace(Project $project, User $actor): void
    {
        if (! in_array($project->formation_status, ['lecturer_approved', 'team_locked'], true)) {
            throw ValidationException::withMessages([
                'workspace' => ['Ruang kerja proyek belum dapat diaktifkan sebelum susunan tim disetujui oleh dosen pengampu.'],
            ]);
        }

        DB::transaction(function () use ($project) {
            $project->update([
                'formation_status' => 'workspace_activated',
                'status' => ProjectStatus::InProgress,
            ]);

            if ($project->team) {
                $project->team->update(['status' => 'active']);
            }
        });
    }

    /**
     * Check if a user can access the active project workspace.
     */
    public function canAccessWorkspace(Project $project, User $user): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        $isLecturer = $project->academicClass && $project->academicClass->isLecturer($user);
        if ($isLecturer) {
            return true;
        }

        $isMember = $project->team && $project->team->hasMember($user);
        $isActivated = in_array($project->formation_status, ['lecturer_approved', 'team_locked', 'workspace_activated'], true);

        return $isMember && $isActivated;
    }
}
