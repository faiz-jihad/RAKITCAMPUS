<?php

namespace App\Services\Matchmaking;

use App\Enums\InvitationStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamStatus;
use App\Enums\TeamType;
use App\Models\Competition;
use App\Models\CompetitionAllocation;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionStatusHistory;
use App\Models\Invitation;
use App\Models\MatchingAuditLog;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompetitionTeamFormationService
{
    public function __construct(
        protected EligibilityService $eligibilityService,
        protected MembershipService $membershipService
    ) {}

    /**
     * Student-Led: Student creates a new competition team.
     */
    public function createTeam(Competition $competition, User $leader, array $data): CompetitionParticipation
    {
        $campusId = $leader->campusId();
        if (!$campusId) {
            throw ValidationException::withMessages(['user' => ['Anda belum terafiliasi dengan kampus.']]);
        }

        // Flexible Membership validation: Student can only have 1 active team per competition
        $this->membershipService->assertCanJoinCompetition($leader, null, $competition->id);

        return DB::transaction(function () use ($competition, $leader, $data, $campusId) {
            $projectId = $data['project_id'] ?? null;
            $team = null;

            if ($projectId) {
                $project = Project::with('team')->findOrFail($projectId);
                if (!$project->isLeader($leader)) {
                    throw ValidationException::withMessages([
                        'project_id' => ['Hanya ketua proyek yang dapat mendaftarkan proyek ke kompetisi.'],
                    ]);
                }
                $team = $project->team;
            }

            if (!$team) {
                $team = Team::create([
                    'campus_id' => $campusId,
                    'leader_id' => $leader->id,
                    'type' => TeamType::Competition,
                    'name' => $data['team_name'],
                    'description' => $data['description'] ?? null,
                    'capacity' => $competition->max_team_size,
                    'status' => TeamStatus::Forming->value,
                ]);

                TeamMember::create([
                    'team_id' => $team->id,
                    'user_id' => $leader->id,
                    'permission' => TeamPermission::Leader,
                    'status' => 'active',
                    'role_name' => 'Ketua Tim',
                    'joined_at' => now(),
                ]);
            }

            // Check if already registered
            $existing = CompetitionParticipation::where('competition_id', $competition->id)
                ->where('team_id', $team->id)
                ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'team' => ['Tim ini sudah terdaftar dalam kompetisi tersebut.'],
                ]);
            }

            $participation = CompetitionParticipation::create([
                'competition_id' => $competition->id,
                'team_id' => $team->id,
                'project_id' => $projectId,
                'category_track' => $data['category_track'] ?? null,
                'registration_status' => 'planning',
                'submission_status' => 'not_started',
                'progress_status' => 'preparing',
                'stage' => 'recruiting',
                'formation_status' => TeamStatus::Forming->value,
            ]);

            CompetitionStatusHistory::create([
                'participation_id' => $participation->id,
                'from_stage' => null,
                'to_stage' => 'recruiting',
                'notes' => "Tim '{$team->name}' resmi dibentuk untuk kompetisi {$competition->name}.",
                'changed_by' => $leader->id,
            ]);

            MatchingAuditLog::log(
                'competition_team_created',
                [
                    'participation_id' => $participation->id,
                    'team_id' => $team->id,
                    'competition_id' => $competition->id,
                ],
                null,
                null,
                $leader->id
            );

            return $participation;
        });
    }

    /**
     * Student-Led: Send an invitation to a prospective team candidate.
     */
    public function sendInvitation(
        CompetitionParticipation $participation,
        User $inviter,
        User $invitee,
        ?string $roleName = null,
        ?string $message = null
    ): Invitation {
        $team = $participation->team;
        if (!$team || !$team->isLeader($inviter)) {
            throw ValidationException::withMessages([
                'auth' => ['Hanya ketua tim yang berwenang mengirimkan undangan kompetisi.'],
            ]);
        }

        if ($participation->is_formation_locked) {
            throw ValidationException::withMessages([
                'team' => ['Susunan tim kompetisi ini telah dikunci (formation locked).'],
            ]);
        }

        // Validate invitee eligibility
        $check = $this->eligibilityService->checkCompetitionEligibility($invitee, $team, $participation->competition_id);
        if (!$check['eligible']) {
            throw ValidationException::withMessages([
                'invitee' => [$check['reason']],
            ]);
        }

        return DB::transaction(function () use ($team, $participation, $inviter, $invitee, $roleName, $message) {
            // Check existing pending invitation
            $existing = Invitation::where('team_id', $team->id)
                ->where('invitee_id', $invitee->id)
                ->where('status', InvitationStatus::Pending->value)
                ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'invitee' => ['Undangan untuk mahasiswa ini sudah pernah dikirimkan dan masih berstatus pending.'],
                ]);
            }

            $invitation = Invitation::create([
                'campus_id' => $team->campus_id,
                'team_id' => $team->id,
                'inviter_id' => $inviter->id,
                'invitee_id' => $invitee->id,
                'role_name' => $roleName ?: 'Anggota Tim Kompetisi',
                'message' => $message ?: "Mari berkolaborasi bersama dalam tim kompetisi {$participation->competition->name}.",
                'status' => InvitationStatus::Pending,
                'expires_at' => now()->addDays(5),
            ]);

            MatchingAuditLog::log(
                'competition_invitation_sent',
                [
                    'invitation_id' => $invitation->id,
                    'team_id' => $team->id,
                    'invitee_id' => $invitee->id,
                ],
                null,
                null,
                $inviter->id
            );

            return $invitation;
        });
    }

    /**
     * Accept invitation to join competition team with row-level locking.
     */
    public function acceptInvitation(Invitation $invitation, User $invitee): TeamMember
    {
        return DB::transaction(function () use ($invitation, $invitee) {
            $inv = Invitation::where('id', $invitation->id)
                ->with(['team.participations.competition'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($inv->invitee_id !== $invitee->id) {
                throw ValidationException::withMessages(['auth' => ['Anda tidak berwenang merespons undangan ini.']]);
            }

            if ($inv->status !== InvitationStatus::Pending) {
                throw ValidationException::withMessages(['invitation' => ['Undangan ini sudah tidak aktif atau telah diproses.']]);
            }

            $team = $inv->team;
            $participation = $team?->participations()->latest()->first();

            if (!$participation) {
                throw ValidationException::withMessages(['team' => ['Data partisipasi kompetisi tim ini tidak ditemukan.']]);
            }

            if ($participation->is_formation_locked) {
                throw ValidationException::withMessages(['team' => ['Susunan tim ini telah dikunci.']]);
            }

            // Re-validate flexible membership under lock
            $check = $this->eligibilityService->checkCompetitionEligibility($invitee, $team, $participation->competition_id);
            if (!$check['eligible']) {
                $inv->update([
                    'status' => InvitationStatus::Declined,
                    'declined_reason' => $check['reason'],
                    'responded_at' => now(),
                ]);

                throw ValidationException::withMessages(['invitation' => [$check['reason']]]);
            }

            // Create active member
            $member = TeamMember::updateOrCreate(
                [
                    'team_id' => $team->id,
                    'user_id' => $invitee->id,
                ],
                [
                    'permission' => TeamPermission::Member,
                    'status' => 'active',
                    'role_name' => $inv->role_name ?? 'Anggota Tim',
                    'joined_at' => now(),
                ]
            );

            $inv->update([
                'status' => InvitationStatus::Accepted,
                'responded_at' => now(),
            ]);

            // Auto-cancel any other pending invitations for this student in the SAME competition
            Invitation::where('invitee_id', $invitee->id)
                ->where('id', '!=', $inv->id)
                ->where('status', InvitationStatus::Pending->value)
                ->whereHas('team.participations', function ($q) use ($participation) {
                    $q->where('competition_id', $participation->competition_id);
                })
                ->update([
                    'status' => InvitationStatus::Cancelled,
                    'declined_reason' => 'Otomatis dibatalkan: Mahasiswa telah menerima tim lain pada kompetisi yang sama.',
                    'responded_at' => now(),
                ]);

            MatchingAuditLog::log(
                'competition_invitation_accepted',
                [
                    'invitation_id' => $inv->id,
                    'team_id' => $team->id,
                    'user_id' => $invitee->id,
                ],
                null,
                null,
                $invitee->id
            );

            return $member;
        });
    }

    /**
     * Decline an invitation.
     */
    public function declineInvitation(Invitation $invitation, User $invitee, ?string $reason = null): void
    {
        if ($invitation->invitee_id !== $invitee->id) {
            throw ValidationException::withMessages(['auth' => ['Anda tidak berwenang merespons undangan ini.']]);
        }

        $invitation->update([
            'status' => InvitationStatus::Declined,
            'declined_reason' => $reason,
            'responded_at' => now(),
        ]);

        MatchingAuditLog::log(
            'competition_invitation_declined',
            [
                'invitation_id' => $invitation->id,
                'reason' => $reason,
            ],
            null,
            null,
            $invitee->id
        );
    }

    /**
     * Lecturer-Led: Lecturer proposes allocating a student to a team or creates an assisted allocation.
     */
    public function allocateStudent(
        Competition $competition,
        User $lecturer,
        User $student,
        ?Team $team = null,
        ?string $suggestedRole = null,
        ?string $notes = null
    ): CompetitionAllocation {
        if (!$lecturer->isLecturer() && !$lecturer->isPlatformAdmin()) {
            throw ValidationException::withMessages(['auth' => ['Hanya dosen pembimbing/pengampu yang berwenang melakukan alokasi tim.']]);
        }

        // Validate eligibility under flexible membership
        $check = $this->eligibilityService->checkCompetitionEligibility($student, $team, $competition->id);
        if (!$check['eligible']) {
            throw ValidationException::withMessages(['student' => [$check['reason']]]);
        }

        return DB::transaction(function () use ($competition, $lecturer, $student, $team, $suggestedRole, $notes) {
            $allocation = CompetitionAllocation::updateOrCreate(
                [
                    'competition_id' => $competition->id,
                    'student_id' => $student->id,
                ],
                [
                    'lecturer_id' => $lecturer->id,
                    'team_id' => $team?->id,
                    'suggested_role' => $suggestedRole ?: 'Anggota Tim (Alokasi Dosen)',
                    'status' => 'proposed',
                    'notes' => $notes,
                ]
            );

            MatchingAuditLog::log(
                'competition_student_allocated_by_lecturer',
                [
                    'allocation_id' => $allocation->id,
                    'student_id' => $student->id,
                    'team_id' => $team?->id,
                    'lecturer_id' => $lecturer->id,
                ],
                null,
                null,
                $lecturer->id
            );

            return $allocation;
        });
    }

    /**
     * Lecturer-Led: Student confirms participation from lecturer allocation.
     */
    public function confirmAllocation(CompetitionAllocation $allocation, User $student): TeamMember
    {
        if ($allocation->student_id !== $student->id) {
            throw ValidationException::withMessages(['auth' => ['Anda tidak berwenang mengonfirmasi alokasi ini.']]);
        }

        return DB::transaction(function () use ($allocation, $student) {
            $alloc = CompetitionAllocation::where('id', $allocation->id)
                ->with(['team', 'competition'])
                ->lockForUpdate()
                ->firstOrFail();

            if (!$alloc->team) {
                throw ValidationException::withMessages(['team' => ['Tim tujuan alokasi belum ditentukan oleh dosen.']]);
            }

            // Recheck eligibility
            $check = $this->eligibilityService->checkCompetitionEligibility($student, $alloc->team, $alloc->competition_id);
            if (!$check['eligible']) {
                $alloc->update(['status' => 'rejected', 'notes' => $check['reason']]);
                throw ValidationException::withMessages(['student' => [$check['reason']]]);
            }

            $member = TeamMember::updateOrCreate(
                [
                    'team_id' => $alloc->team->id,
                    'user_id' => $student->id,
                ],
                [
                    'permission' => TeamPermission::Member,
                    'status' => 'active',
                    'role_name' => $alloc->suggested_role ?: 'Anggota Tim',
                    'joined_at' => now(),
                ]
            );

            $alloc->update([
                'status' => 'confirmed',
                'responded_at' => now(),
            ]);

            return $member;
        });
    }

    /**
     * Lecturer approves proposed team formation.
     */
    public function approveFormation(CompetitionParticipation $participation, User $lecturer, ?string $notes = null): void
    {
        if (!$lecturer->isLecturer() && !$lecturer->isPlatformAdmin()) {
            throw ValidationException::withMessages(['auth' => ['Hanya dosen atau pembimbing yang dapat menyetujui formasi tim.']]);
        }

        $participation->update([
            'is_formation_locked' => true,
            'formation_status' => TeamStatus::Confirmed->value,
            'formation_approved_at' => now(),
            'formation_approved_by' => $lecturer->id,
            'stage' => $participation->stage === 'recruiting' ? 'team_formation' : $participation->stage,
        ]);

        if ($participation->team) {
            $participation->team->update(['status' => TeamStatus::Confirmed->value]);
        }

        CompetitionStatusHistory::create([
            'participation_id' => $participation->id,
            'from_stage' => 'recruiting',
            'to_stage' => $participation->stage,
            'notes' => $notes ?: 'Susunan tim resmi disetujui oleh dosen pembimbing.',
            'changed_by' => $lecturer->id,
        ]);

        MatchingAuditLog::log(
            'competition_formation_approved',
            [
                'participation_id' => $participation->id,
                'lecturer_id' => $lecturer->id,
            ],
            null,
            null,
            $lecturer->id
        );
    }
}
