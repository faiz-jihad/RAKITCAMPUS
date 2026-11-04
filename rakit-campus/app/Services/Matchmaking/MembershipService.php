<?php

namespace App\Services\Matchmaking;

use App\Enums\ProjectStatus;
use App\Models\Application;
use App\Models\Invitation;
use App\Models\MatchingAuditLog;
use App\Models\Project;
use App\Models\RecruitmentRole;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
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
        // 1. Eligibility Check
        $eligibility = $this->eligibilityService->checkStudentEligibility($student, $project);
        if (! $eligibility['eligible']) {
            throw ValidationException::withMessages([
                'project_id' => [$eligibility['reason']],
            ]);
        }

        $team = $project->team;
        if (! $team || ! $team->recruitment) {
            throw ValidationException::withMessages([
                'project_id' => ['Proyek ini tidak sedang membuka rekrutmen terbuka.'],
            ]);
        }

        return DB::transaction(function () use ($student, $team, $role, $message, $project) {
            $application = Application::updateOrCreate(
                [
                    'recruitment_id' => $team->recruitment->id,
                    'user_id' => $student->id,
                ],
                [
                    'recruitment_role_id' => $role?->id,
                    'message' => $message,
                    'status' => 'pending',
                ]
            );

            MatchingAuditLog::log(
                'application_submitted',
                ['application_id' => $application->id, 'role' => $role?->name],
                $project->academic_class_id,
                $project->id,
                $student->id
            );

            return $application;
        });
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

            // 1. Check if applicant already joined an active project in the interim
            $hasActive = TeamMember::where('user_id', $applicant->id)
                ->where('status', 'active')
                ->whereHas('team.project', function ($q) {
                    $q->whereNotIn('status', [
                        ProjectStatus::Archived->value,
                        ProjectStatus::Completed->value,
                    ]);
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

            // 2. Check team capacity
            $maxCapacity = $project->max_team_size ?: ($team->capacity ?: 5);
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

            // 1. Enforce 1 active project rule
            $hasActive = TeamMember::where('user_id', $student->id)
                ->where('status', 'active')
                ->whereHas('team.project', function ($q) {
                    $q->whereNotIn('status', [
                        ProjectStatus::Archived->value,
                        ProjectStatus::Completed->value,
                    ]);
                })
                ->lockForUpdate()
                ->exists();

            if ($hasActive) {
                throw ValidationException::withMessages([
                    'invitation' => ['Anda sudah terdaftar dalam proyek aktif lain. Selesaikan proyek saat ini terlebih dahulu.'],
                ]);
            }

            $team = $invitation->team;
            $project = $team->project;

            // 2. Check team capacity
            $maxCapacity = $project->max_team_size ?: ($team->capacity ?: 5);
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
     * Formally complete a project. Releases all active student restrictions.
     */
    public function completeProject(Project $project): void
    {
        DB::transaction(function () use ($project) {
            $project->update([
                'status' => ProjectStatus::Completed->value,
                'completed_at' => now(),
                'progress' => 100,
            ]);

            if ($project->team) {
                $project->team->members()->update([
                    'status' => 'completed',
                ]);
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
}
