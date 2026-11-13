<?php

namespace App\Services\Matchmaking;

use App\Contracts\Notifications\NotificationCounterInterface;
use App\Enums\ApplicationStatus;
use App\Enums\ProjectStatus;
use App\Models\AcademicClass;
use App\Models\Application;
use App\Models\Invitation;
use App\Models\MatchingAuditLog;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\ApplicationSubmittedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MembershipService
{
    public function __construct(
        protected EligibilityService $eligibilityService
    ) {}

    /**
     * Submit an application to a project team.
     * Pending applications do not count as active memberships.
     */
    public function applyToProject(User $student, Project $project, ?RecruitmentRole $role = null, ?string $message = null): Application
    {
        // 1. Eligibility Check (includes open recruitment, non-member, non-duplicate, capacity, class & Rule 1)
        $eligibility = $this->eligibilityService->checkStudentEligibility($student, $project);
        if (! $eligibility['eligible']) {
            throw ValidationException::withMessages([
                'project_id' => [$eligibility['reason']],
            ]);
        }

        $team = $project->team;
        $recruitment = $team?->recruitment;
        if (! $team || ! $recruitment || ! $recruitment->isOpen()) {
            throw ValidationException::withMessages([
                'project_id' => ['Proyek ini tidak sedang membuka rekrutmen terbuka.'],
            ]);
        }

        if ($role !== null && (int) $role->recruitment_id !== (int) $recruitment->id) {
            throw ValidationException::withMessages([
                'recruitment_role_id' => ['Posisi yang dipilih tidak valid untuk rekrutmen proyek ini.'],
            ]);
        }

        $application = DB::transaction(function () use ($student, $team, $recruitment, $role, $message, $project) {
            $lockedRecruitment = Recruitment::where('id', $recruitment->id)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $lockedRecruitment->isOpen()) {
                throw ValidationException::withMessages([
                    'project_id' => ['Rekrutmen proyek ini sedang ditutup.'],
                ]);
            }

            $isAlreadyMember = $project->isLeader($student)
                || (int) $team->leader_id === (int) $student->id
                || TeamMember::where('team_id', $team->id)
                    ->where('user_id', $student->id)
                    ->where('status', 'active')
                    ->lockForUpdate()
                    ->exists();

            if ($isAlreadyMember) {
                throw ValidationException::withMessages([
                    'project_id' => ['Kamu sudah menjadi ketua atau anggota pada proyek ini.'],
                ]);
            }

            $existingApplication = Application::where('recruitment_id', $lockedRecruitment->id)
                ->where('user_id', $student->id)
                ->lockForUpdate()
                ->first();

            if ($existingApplication) {
                $existingStatus = $existingApplication->status instanceof ApplicationStatus
                    ? $existingApplication->status->value
                    : (string) $existingApplication->status;

                if (in_array($existingStatus, [
                    ApplicationStatus::Pending->value,
                    ApplicationStatus::UnderReview->value,
                    'submitted',
                    ApplicationStatus::Accepted->value,
                ], true)) {
                    throw ValidationException::withMessages([
                        'project_id' => ['Kamu sudah memiliki pengajuan aktif pada proyek ini.'],
                    ]);
                }

                $existingApplication->update([
                    'recruitment_role_id' => $role?->id,
                    'message' => $message,
                    'status' => ApplicationStatus::Pending->value,
                    'decided_by' => null,
                    'decided_at' => null,
                    'decision_note' => null,
                ]);
                $application = $existingApplication->fresh();
            } else {
                $application = Application::create([
                    'recruitment_id' => $lockedRecruitment->id,
                    'recruitment_role_id' => $role?->id,
                    'user_id' => $student->id,
                    'message' => $message,
                    'status' => ApplicationStatus::Pending->value,
                ]);
            }

            MatchingAuditLog::log(
                'application_submitted',
                ['application_id' => $application->id, 'role' => $role?->name],
                $project->academic_class_id,
                $project->id,
                $student->id
            );

            return $application;
        });

        $leader = $project->leader()->first() ?? $team->leader()->first();
        if ($leader && (int) $leader->id !== (int) $student->id) {
            $leader->notify(new ApplicationSubmittedNotification($application));
            app(NotificationCounterInterface::class)->invalidateUnreadCountCache($leader);
        }

        return $application;
    }

    /**
     * Accept student application into project team.
     * Atomic transaction with lockForUpdate to enforce 1 Active Project rule without race conditions.
     */
    public function acceptApplication(Application $application, User $decidedBy, ?string $decisionNote = null): TeamMember
    {
        return DB::transaction(function () use ($application, $decidedBy, $decisionNote) {
            // Eager load relationships with lock
            $application = Application::where('id', $application->id)
                ->with(['recruitment.team.project', 'user', 'role'])
                ->lockForUpdate()
                ->firstOrFail();

            $team = $application->recruitment->team;
            $project = $team->project;
            $applicant = $application->user;

            if ($application->status !== ApplicationStatus::Pending) {
                throw ValidationException::withMessages([
                    'application' => ['Lamaran ini sudah diproses.'],
                ]);
            }

            $isLeader = $project->isLeader($decidedBy) || $team->isLeader($decidedBy);
            if (! $isLeader && ! $decidedBy->isPlatformAdmin()) {
                throw ValidationException::withMessages([
                    'authorization' => ['Hanya ketua kelompok yang dapat memproses lamaran.'],
                ]);
            }

            // 1. Check if applicant already joined an active project in this class (or overall if non-class project)
            $classId = $project->academic_class_id;
            $hasActive = TeamMember::where('user_id', $applicant->id)
                ->where('status', 'active')
                ->whereHas('team.project', function ($q) use ($classId) {
                    $q->whereNotIn('status', [
                        ProjectStatus::Archived->value,
                        ProjectStatus::Completed->value,
                    ]);
                    if ($classId !== null) {
                        $q->where('academic_class_id', $classId);
                    }
                })
                ->lockForUpdate()
                ->exists();

            if ($hasActive) {
                $application->update([
                    'status' => 'rejected',
                    'decided_by' => $decidedBy->id,
                    'decided_at' => now(),
                    'decision_note' => 'Otomatis ditolak: Mahasiswa telah bergabung dengan proyek aktif lain.',
                ]);

                throw ValidationException::withMessages([
                    'applicant' => ['Mahasiswa ini telah bergabung dalam proyek aktif lain (Aturan 1 Mahasiswa 1 Proyek).'],
                ]);
            }

            // 2. Check team capacity, including the lecturer's class limit
            $maxCapacity = $this->effectiveTeamCapacity($project, $team);
            $currentCount = $team->members()->where('status', 'active')->lockForUpdate()->count();

            if ($currentCount >= $maxCapacity) {
                throw ValidationException::withMessages([
                    'capacity' => ['Kapasitas anggota tim proyek sudah penuh.'],
                ]);
            }

            // 3. Create active team member
            $member = TeamMember::updateOrCreate(
                [
                    'team_id' => $team->id,
                    'user_id' => $applicant->id,
                ],
                [
                    'permission' => 'member',
                    'status' => 'active',
                    'role_name' => $application->role?->name ?? 'Kolaborator Proyek',
                    'recruitment_role_id' => $application->recruitment_role_id,
                    'joined_at' => now(),
                ]
            );

            // Automatically remove or decrement the approved recruitment position
            $recRole = null;
            if ($application->recruitment_role_id) {
                $recRole = \App\Models\RecruitmentRole::find($application->recruitment_role_id);
            }
            if (! $recRole && $team->recruitment) {
                $recRole = $team->recruitment->roles()->where('name', $application->role?->name)->first();
            }

            if ($recRole) {
                if ($recRole->slots > 1) {
                    $recRole->decrement('slots');
                } else {
                    $recRole->delete();
                }
            }

            // 4. Update application status
            $application->update([
                'status' => 'accepted',
                'decided_by' => $decidedBy->id,
                'decided_at' => now(),
                'decision_note' => $decisionNote,
            ]);

            MatchingAuditLog::log(
                'application_accepted',
                ['application_id' => $application->id, 'member_id' => $member->id],
                $project->academic_class_id,
                $project->id,
                $applicant->id
            );

            return $member;
        });
    }

    /**
     * Reject an application with optional feedback note.
     */
    public function rejectApplication(Application $application, User $decidedBy, ?string $decisionNote = null): void
    {
        $application->loadMissing('recruitment.team.project');
        $team = $application->recruitment?->team;
        $project = $team?->project;

        if (! $team || ! $project) {
            throw ValidationException::withMessages([
                'application' => ['Lamaran ini tidak terhubung ke kelompok proyek.'],
            ]);
        }

        if ($application->status !== ApplicationStatus::Pending) {
            throw ValidationException::withMessages([
                'application' => ['Lamaran ini sudah diproses.'],
            ]);
        }

        $isLeader = $project->isLeader($decidedBy) || $team->isLeader($decidedBy);
        if (! $isLeader && ! $decidedBy->isPlatformAdmin()) {
            throw ValidationException::withMessages([
                'authorization' => ['Hanya ketua kelompok yang dapat memproses lamaran.'],
            ]);
        }

        $application->update([
            'status' => 'rejected',
            'decided_by' => $decidedBy->id,
            'decided_at' => now(),
            'decision_note' => $decisionNote,
        ]);
    }

    /**
     * Accept project invitation.
     */
    public function acceptInvitation(Invitation $invitation, User $student): TeamMember
    {
        return DB::transaction(function () use ($invitation, $student) {
            $invitation = Invitation::where('id', $invitation->id)
                ->where('invitee_id', $student->id)
                ->with(['team.project'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($invitation->status !== 'pending') {
                throw new \DomainException('Undangan ini sudah tidak aktif atau telah diproses.');
            }

            $team = $invitation->team;
            $project = $team->project;
            $classId = $project?->academic_class_id;

            // 1. Enforce 1 active project rule (per class when applicable)
            $hasActive = TeamMember::where('user_id', $student->id)
                ->where('status', 'active')
                ->whereHas('team.project', function ($q) use ($classId) {
                    $q->whereNotIn('status', [
                        ProjectStatus::Archived->value,
                        ProjectStatus::Completed->value,
                    ]);
                    if ($classId !== null) {
                        $q->where('academic_class_id', $classId);
                    }
                })
                ->lockForUpdate()
                ->exists();

            if ($hasActive) {
                throw ValidationException::withMessages([
                    'invitation' => ['Anda sudah terdaftar dalam proyek aktif lain. Selesaikan proyek saat ini terlebih dahulu.'],
                ]);
            }

            // 2. Check team capacity, including the lecturer's class limit
            $maxCapacity = $this->effectiveTeamCapacity($project, $team);
            $currentCount = $team->members()->where('status', 'active')->lockForUpdate()->count();

            if ($currentCount >= $maxCapacity) {
                throw ValidationException::withMessages([
                    'capacity' => ['Maaf, kuota tim untuk proyek ini sudah terpenuhi.'],
                ]);
            }

            // 3. Create active team member
            $member = TeamMember::updateOrCreate(
                [
                    'team_id' => $team->id,
                    'user_id' => $student->id,
                ],
                [
                    'permission' => 'member',
                    'status' => 'active',
                    'role_name' => $invitation->role_name ?? 'Anggota Tim Terundang',
                    'recruitment_role_id' => $invitation->recruitment_role_id,
                    'joined_at' => now(),
                ]
            );

            $invitation->update([
                'status' => 'accepted',
                'responded_at' => now(),
                'pending_marker' => null,
            ]);

            return $member;
        });
    }

    /**
     * Formally complete a project. Releases all active student restrictions and awards verified portfolio achievements.
     */
    public function completeProject(Project $project, ?int $evaluatorId = null): void
    {
        DB::transaction(function () use ($project, $evaluatorId) {
            $project->update([
                'status' => ProjectStatus::Completed->value,
                'completed_at' => now(),
                'progress' => 100,
            ]);

            if ($project->team) {
                $members = $project->team->members;
                $project->team->members()->update([
                    'status' => 'completed',
                ]);

                foreach ($members as $member) {
                    \App\Models\Achievement::firstOrCreate(
                        [
                            'user_id' => $member->user_id,
                            'project_id' => $project->id,
                            'type' => 'project_completed',
                        ],
                        [
                            'campus_id' => $project->campus_id,
                            'team_id' => $project->team_id ?? $project->team->id,
                            'title' => 'Menyelesaikan Proyek: '.$project->title,
                            'description' => "Menyelesaikan proyek kolaborasi dengan peran {$member->role_name}.".($project->lecturer_evaluation ? " Evaluasi: {$project->lecturer_evaluation}." : ''),
                            'achieved_on' => now(),
                            'verification_status' => 'verified',
                            'verified_by' => $evaluatorId ?? $project->primary_supervisor_id ?? $project->academicClass?->lecturer_id,
                            'verified_at' => now(),
                            'is_public' => true,
                        ]
                    );
                }
            }

            MatchingAuditLog::log(
                'project_completed',
                ['project_id' => $project->id],
                $project->academic_class_id,
                $project->id,
                $project->leader_id
            );
        });
    }

    /**
     * Resolve the effective maximum team size, capped by the class's configured quota.
     */
    protected function effectiveTeamCapacity(Project $project, Team $team): int
    {
        $baseCapacity = (int) ($project->max_team_size ?: ($team->capacity ?: 5));

        if ($project->academic_class_id) {
            $classTarget = $project->relationLoaded('academicClass')
                ? $project->academicClass?->target_team_size
                : \App\Models\AcademicClass::where('id', $project->academic_class_id)->value('target_team_size');

            if ($classTarget && (int) $classTarget > 0) {
                return min($baseCapacity, (int) $classTarget);
            }
        }

        return $baseCapacity;
    }

    /**
     * Check if a student can join a competition team.
     */
    public function canJoinCompetition(User $student, ?Team $team = null, ?int $competitionId = null): array
    {
        return $this->eligibilityService->checkCompetitionEligibility($student, $team, $competitionId);
    }

    /**
     * Enforce competition eligibility or throw ValidationException.
     */
    public function assertCanJoinCompetition(User $student, ?Team $team = null, ?int $competitionId = null): void
    {
        $check = $this->canJoinCompetition($student, $team, $competitionId);
        if (!$check['eligible']) {
            throw ValidationException::withMessages([
                'student' => [$check['reason']],
            ]);
        }
    }

    /**
     * Atomically add a student member to a competition team.
     */
    public function addMemberToCompetitionTeam(Team $team, User $student, string $roleName = 'Member', ?int $recruitmentRoleId = null): TeamMember
    {
        return DB::transaction(function () use ($team, $student, $roleName, $recruitmentRoleId) {
            // Lock team
            $lockedTeam = Team::where('id', $team->id)->lockForUpdate()->firstOrFail();

            $participation = \App\Models\CompetitionParticipation::where('team_id', $lockedTeam->id)
                ->latest()
                ->lockForUpdate()
                ->first();

            if ($participation && $participation->is_formation_locked) {
                throw ValidationException::withMessages([
                    'team' => ['Susunan tim kompetisi sudah dikunci dan tidak dapat menerima anggota baru.'],
                ]);
            }

            // Check eligibility under lock
            $this->assertCanJoinCompetition($student, $lockedTeam);

            $member = TeamMember::updateOrCreate(
                [
                    'team_id' => $lockedTeam->id,
                    'user_id' => $student->id,
                ],
                [
                    'permission' => 'member',
                    'status' => 'active',
                    'role_name' => $roleName,
                    'recruitment_role_id' => $recruitmentRoleId,
                    'joined_at' => now(),
                ]
            );

            // If recruitmentRoleId provided, decrement or delete the role
            if ($recruitmentRoleId) {
                $role = \App\Models\RecruitmentRole::find($recruitmentRoleId);
                if ($role) {
                    if ($role->slots > 1) {
                        $role->decrement('slots');
                    } else {
                        $role->delete();
                    }
                }
            }

            return $member;
        });
    }

    /**
     * Lock team formation so no further additions can be made.
     */
    public function lockTeamFormation(\App\Models\CompetitionParticipation $participation, User $leader): void
    {
        DB::transaction(function () use ($participation, $leader) {
            $participation = \App\Models\CompetitionParticipation::where('id', $participation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $participation->update([
                'is_formation_locked' => true,
                'stage' => $participation->stage === 'recruiting' ? 'team_formation' : $participation->stage,
            ]);

            \App\Models\CompetitionStatusHistory::create([
                'participation_id' => $participation->id,
                'from_stage' => 'recruiting',
                'to_stage' => $participation->stage,
                'notes' => 'Susunan tim resmi dikunci oleh ketua tim.',
                'changed_by' => $leader->id,
            ]);
        });
    }

    /**
     * Complete competition participation and create verified achievements for all team members.
     */
    public function completeCompetition(
        \App\Models\CompetitionParticipation $participation,
        string $outcome,
        ?string $achievementTitle = null,
        ?string $certificatePath = null,
        ?User $verifier = null,
        ?int $rank = null,
        ?string $notes = null
    ): void {
        DB::transaction(function () use ($participation, $outcome, $achievementTitle, $certificatePath, $verifier, $rank, $notes) {
            $participation = \App\Models\CompetitionParticipation::where('id', $participation->id)
                ->with(['team.members', 'competition'])
                ->lockForUpdate()
                ->firstOrFail();

            $terminalStage = in_array($outcome, ['1st_place', '2nd_place', '3rd_place', 'finalist', 'special_award'])
                ? 'winner'
                : ($outcome === 'withdrawn' ? 'withdrawn' : 'not_selected');

            $participation->update([
                'stage' => $terminalStage,
                'progress_status' => 'finished',
            ]);

            // Record or update result
            \App\Models\CompetitionResult::updateOrCreate(
                ['participation_id' => $participation->id],
                [
                    'outcome' => $outcome,
                    'rank' => $rank,
                    'notes' => $notes,
                    'achievement_title' => $achievementTitle ?? "Hasil Kompetisi: {$participation->competition->name}",
                    'certificate_path' => $certificatePath,
                    'recorded_by' => $verifier?->id ?? $participation->team?->leader_id,
                    'verification_status' => $verifier ? 'verified' : 'unverified',
                    'verified_by' => $verifier?->id,
                    'verified_at' => $verifier ? now() : null,
                ]
            );

            // Audit history
            \App\Models\CompetitionStatusHistory::create([
                'participation_id' => $participation->id,
                'from_stage' => $participation->getOriginal('stage'),
                'to_stage' => $terminalStage,
                'notes' => "Kompetisi diselesaikan dengan hasil: {$outcome}.",
                'changed_by' => $verifier?->id ?? $participation->team?->leader_id,
            ]);

            // Release active status for team members and create achievements if verified
            if ($participation->team) {
                $participation->team->members()->update(['status' => 'completed']);

                if ($verifier) {
                    foreach ($participation->team->members as $member) {
                        \App\Models\Achievement::firstOrCreate(
                            [
                                'user_id' => $member->user_id,
                                'participation_id' => $participation->id,
                                'type' => \App\Enums\AchievementType::CompetitionResult->value,
                            ],
                            [
                                'campus_id' => $participation->competition->campus_id,
                                'team_id' => $participation->team_id,
                                'title' => $achievementTitle ?? "Prestasi: {$participation->competition->name} ({$outcome})",
                                'description' => "Berhasil menyelesaikan kompetisi {$participation->competition->name} sebagai {$member->role_name}.",
                                'achieved_on' => now(),
                                'evidence_url' => $certificatePath,
                                'verification_status' => \App\Enums\AchievementVerification::Verified->value,
                                'verified_by' => $verifier->id,
                                'verified_at' => now(),
                                'is_public' => true,
                            ]
                        );
                    }
                }
            }
        });
    }
}
