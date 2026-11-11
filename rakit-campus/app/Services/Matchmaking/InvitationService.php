<?php

namespace App\Services\Matchmaking;

use App\Enums\InvitationStatus;
use App\Enums\ProjectStatus;
use App\Enums\TeamPermission;
use App\Models\Invitation;
use App\Models\MatchingAuditLog;
use App\Models\Project;
use App\Models\RecruitmentRole;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvitationService
{
    public function __construct(
        protected EligibilityService $eligibilityService
    ) {}

    /**
     * Send an invitation from a project team to an eligible same-class student.
     *
     * @throws ValidationException
     */
    public function sendInvitation(
        Team $team,
        User $inviter,
        User $invitee,
        ?RecruitmentRole $role = null,
        ?string $message = null,
        int $expirationDays = 7
    ): Invitation {
        $project = $team->project;
        if (! $project) {
            throw ValidationException::withMessages([
                'team' => ['Tim ini tidak terikat pada proyek yang valid.'],
            ]);
        }

        // 1. Authorization: Only team leader or authorized member can send invites
        if (! $team->isLeader($inviter) && ! $team->hasMember($inviter)) {
            throw ValidationException::withMessages([
                'inviter' => ['Hanya anggota atau ketua tim yang dapat mengirimkan undangan rekan.'],
            ]);
        }

        // 2. Strict Class Boundary: Candidate MUST be enrolled in the same class
        if ($project->academic_class_id && ! $this->eligibilityService->isStudentInClass($invitee, $project->academic_class_id)) {
            throw ValidationException::withMessages([
                'invitee' => ['Mahasiswa tersebut tidak terdaftar di kelas perkuliahan proyek ini (Batas Kelas Ketat).'],
            ]);
        }

        // 3. Rule 1: Candidate must not currently have an active project in this class
        if ($this->eligibilityService->hasActiveProjectMembership($invitee, $project->academic_class_id)) {
            throw ValidationException::withMessages([
                'invitee' => ["{$invitee->name} sudah tergabung dalam proyek aktif lain (Aturan 1 Mahasiswa 1 Proyek)."],
            ]);
        }

        // 4. Capacity check
        $maxCapacity = $this->effectiveTeamCapacity($project, $team);
        $currentCount = $team->members()->where('status', 'active')->count();
        if ($currentCount >= $maxCapacity) {
            throw ValidationException::withMessages([
                'capacity' => ['Kapasitas anggota tim proyek sudah penuh.'],
            ]);
        }

        // 5. Check if invitee is already a member
        if ($team->hasMember($invitee)) {
            throw ValidationException::withMessages([
                'invitee' => ['Mahasiswa tersebut sudah menjadi anggota tim proyek ini.'],
            ]);
        }

        return DB::transaction(function () use ($team, $project, $inviter, $invitee, $role, $message, $expirationDays) {
            // Check existing pending invitation
            $existing = Invitation::where('team_id', $team->id)
                ->where('invitee_id', $invitee->id)
                ->where('status', InvitationStatus::Pending->value)
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'invitee' => ['Undangan untuk mahasiswa ini sudah pernah dikirimkan dan masih berstatus pending.'],
                ]);
            }

            $invitation = Invitation::create([
                'campus_id' => $team->campus_id,
                'team_id' => $team->id,
                'recruitment_role_id' => $role?->id,
                'inviter_id' => $inviter->id,
                'invitee_id' => $invitee->id,
                'role_name' => $role?->name ?? 'Kolaborator Proyek',
                'message' => $message ?? 'Kami mengundang Anda untuk bergabung ke dalam tim proyek kelas kami.',
                'status' => InvitationStatus::Pending,
                'expires_at' => now()->addDays($expirationDays),
            ]);

            MatchingAuditLog::log(
                'invitation_sent',
                [
                    'invitation_id' => $invitation->id,
                    'invitee_id' => $invitee->id,
                    'role' => $invitation->role_name,
                ],
                $project->academic_class_id,
                $project->id,
                $inviter->id
            );

            return $invitation;
        });
    }

    /**
     * Accept invitation atomically with pessimistic row-locking to prevent race conditions.
     *
     * @throws ValidationException
     */
    public function acceptInvitation(Invitation $invitation, User $student): TeamMember
    {
        return DB::transaction(function () use ($invitation, $student) {
            // Lock invitation row
            $inv = Invitation::where('id', $invitation->id)
                ->where('invitee_id', $student->id)
                ->with(['team.project'])
                ->lockForUpdate()
                ->firstOrFail();

            if ($inv->status !== InvitationStatus::Pending) {
                throw ValidationException::withMessages([
                    'invitation' => ['Undangan ini sudah tidak aktif atau telah diproses sebelumnya.'],
                ]);
            }

            if ($inv->isExpired()) {
                $inv->update(['status' => InvitationStatus::Expired]);
                throw ValidationException::withMessages([
                    'invitation' => ['Masa berlaku undangan ini telah kedaluwarsa.'],
                ]);
            }

            $team = $inv->team;
            $project = $team?->project;

            if (! $project) {
                throw ValidationException::withMessages([
                    'invitation' => ['Proyek terkait undangan ini sudah tidak tersedia.'],
                ]);
            }

            // 1. Strict Class Boundary Check
            if ($project->academic_class_id && ! $this->eligibilityService->isStudentInClass($student, $project->academic_class_id)) {
                throw ValidationException::withMessages([
                    'invitation' => ['Anda tidak terdaftar di kelas perkuliahan proyek ini (Batas Kelas Ketat).'],
                ]);
            }

            // 2. Strict Rule 1 Active Membership Check with lock
            $classId = $project->academic_class_id;
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
                $inv->update([
                    'status' => InvitationStatus::Declined,
                    'declined_reason' => 'Otomatis dibatalkan: Mahasiswa telah bergabung ke proyek aktif lain.',
                    'responded_at' => now(),
                ]);

                throw ValidationException::withMessages([
                    'invitation' => ['Anda sudah terdaftar dalam proyek aktif lain (Aturan 1 Mahasiswa 1 Proyek Aktif).'],
                ]);
            }

            // 3. Strict Capacity Check with lock
            $maxCapacity = $this->effectiveTeamCapacity($project, $team);
            $currentCount = $team->members()->where('status', 'active')->lockForUpdate()->count();

            if ($currentCount >= $maxCapacity) {
                throw ValidationException::withMessages([
                    'capacity' => ['Kapasitas anggota tim proyek sudah penuh.'],
                ]);
            }

            // 4. Create active team member atomically
            $member = TeamMember::updateOrCreate(
                [
                    'team_id' => $team->id,
                    'user_id' => $student->id,
                ],
                [
                    'permission' => TeamPermission::Member,
                    'status' => 'active',
                    'role_name' => $inv->role_name ?? 'Kolaborator Proyek',
                    'recruitment_role_id' => $inv->recruitment_role_id,
                    'joined_at' => now(),
                ]
            );

            // 5. Update invitation status
            $inv->update([
                'status' => InvitationStatus::Accepted,
                'responded_at' => now(),
            ]);

            // Auto-cancel any other pending invitations for this student
            Invitation::where('invitee_id', $student->id)
                ->where('id', '!=', $inv->id)
                ->where('status', InvitationStatus::Pending->value)
                ->update([
                    'status' => InvitationStatus::Cancelled,
                    'declined_reason' => 'Otomatis dibatalkan karena mahasiswa telah menerima proyek lain.',
                    'responded_at' => now(),
                ]);

            MatchingAuditLog::log(
                'invitation_accepted',
                ['invitation_id' => $inv->id, 'member_id' => $member->id],
                $project->academic_class_id,
                $project->id,
                $student->id
            );

            return $member;
        });
    }

    /**
     * Decline invitation with optional recorded reason.
     */
    public function declineInvitation(Invitation $invitation, User $student, ?string $reason = null): void
    {
        $inv = Invitation::where('id', $invitation->id)
            ->where('invitee_id', $student->id)
            ->firstOrFail();

        $inv->update([
            'status' => InvitationStatus::Declined,
            'declined_reason' => $reason ?? 'Mahasiswa memilih opsi lain.',
            'responded_at' => now(),
        ]);

        MatchingAuditLog::log(
            'invitation_declined',
            ['invitation_id' => $inv->id, 'reason' => $reason],
            $inv->team?->project?->academic_class_id,
            $inv->team?->project?->id,
            $student->id
        );
    }

    /**
     * Cancel invitation by team leader.
     */
    public function cancelInvitation(Invitation $invitation, User $inviter): void
    {
        $team = $invitation->team;
        if (! $team || ! $team->isLeader($inviter)) {
            throw ValidationException::withMessages([
                'auth' => ['Hanya ketua tim yang dapat membatalkan undangan.'],
            ]);
        }

        $invitation->update([
            'status' => InvitationStatus::Cancelled,
            'declined_reason' => 'Dibatalkan oleh ketua tim pengundang.',
            'responded_at' => now(),
        ]);
    }

    /**
     * Resolve effective maximum team size, capped by the class's configured quota.
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
     * Expire overdue pending invitations.
     */
    public function expirePendingInvitations(): int
    {
        return Invitation::where('status', InvitationStatus::Pending->value)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->update([
                'status' => InvitationStatus::Expired->value,
                'responded_at' => now(),
            ]);
    }
}
