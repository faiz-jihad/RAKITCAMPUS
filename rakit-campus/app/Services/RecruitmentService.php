<?php

namespace App\Services;

use App\Enums\ApplicationStatus;
use App\Enums\InvitationStatus;
use App\Enums\TeamPermission;
use App\Models\ActivityLog;
use App\Models\Application;
use App\Models\Invitation;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\ApplicationStatusNotification;
use App\Notifications\ApplicationSubmittedNotification;
use App\Notifications\RecruitmentInvitationNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RecruitmentService
{
    /**
     * Submit an application to an open recruitment drive.
     */
    public function apply(
        User $applicant,
        Recruitment $recruitment,
        ?int $recruitmentRoleId,
        ?string $message
    ): Application {
        return DB::transaction(function () use ($applicant, $recruitment, $recruitmentRoleId, $message) {
            $recruitment->loadMissing('team');
            $team = $recruitment->team;

            // 1. Must be open
            if (!$recruitment->isOpen()) {
                throw ValidationException::withMessages([
                    'recruitment' => ['Recruitment ini sudah ditutup.'],
                ]);
            }

            // 2. Cannot apply to own team or if already a member
            if ($team->hasMember($applicant)) {
                throw ValidationException::withMessages([
                    'user' => ['Anda sudah menjadi anggota tim ini.'],
                ]);
            }

            // 3. Prevent duplicate active application
            $existing = Application::where('recruitment_id', $recruitment->id)
                ->where('user_id', $applicant->id)
                ->first();

            if ($existing && in_array($existing->status, [ApplicationStatus::Pending, ApplicationStatus::UnderReview, ApplicationStatus::Accepted])) {
                throw ValidationException::withMessages([
                    'application' => ['Anda sudah memiliki aplikasi aktif untuk recruitment ini.'],
                ]);
            }

            // 4. Validate role if specified
            if ($recruitmentRoleId) {
                $role = RecruitmentRole::where('recruitment_id', $recruitment->id)
                    ->where('id', $recruitmentRoleId)
                    ->firstOrFail();

                if ($role->vacancies() <= 0) {
                    throw ValidationException::withMessages([
                        'role' => ['Posisi yang dipilih sudah penuh.'],
                    ]);
                }
            }

            // Create or re-activate application
            $application = Application::updateOrCreate(
                [
                    'recruitment_id' => $recruitment->id,
                    'user_id' => $applicant->id,
                ],
                [
                    'recruitment_role_id' => $recruitmentRoleId,
                    'message' => $message,
                    'status' => ApplicationStatus::Pending,
                    'decided_by' => null,
                    'decided_at' => null,
                    'decision_note' => null,
                ]
            );

            // Log activity
            ActivityLog::log(
                $team->campus_id,
                $team->id,
                $applicant->id,
                'application_submitted',
                $application,
                ['role_id' => $recruitmentRoleId]
            );

            // Notify team leader
            if ($team->leader && $team->leader->id !== $applicant->id) {
                $team->leader->notify(new ApplicationSubmittedNotification($application));
            }

            return $application;
        });
    }

    /**
     * Accept an application with pessimistic locking to prevent over-capacity race conditions.
     */
    public function acceptApplication(
        Application $application,
        User $decider,
        ?string $note = null
    ): TeamMember {
        return DB::transaction(function () use ($application, $decider, $note) {
            // Lock the team row for update to serialize capacity checks
            $recruitment = $application->recruitment;
            $team = Team::where('id', $recruitment->team_id)->lockForUpdate()->firstOrFail();

            // Verify decider is team leader or campus admin
            if (!$team->isLeader($decider) && !$decider->isCampusAdminOf($team->campus_id) && !$decider->isPlatformAdmin()) {
                throw ValidationException::withMessages([
                    'authorization' => ['Hanya ketua tim atau admin yang dapat menerima anggota.'],
                ]);
            }

            if ($application->status === ApplicationStatus::Accepted) {
                throw ValidationException::withMessages([
                    'status' => ['Aplikasi ini sudah diterima sebelumnya.'],
                ]);
            }

            // Strict capacity check
            $currentMemberCount = TeamMember::where('team_id', $team->id)->count();
            if ($currentMemberCount >= $team->capacity) {
                throw ValidationException::withMessages([
                    'capacity' => ["Kapasitas maksimal tim ({$team->capacity} orang) sudah terpenuhi."],
                ]);
            }

            // Role vacancy check if applicable
            $role = null;
            if ($application->recruitment_role_id) {
                $role = RecruitmentRole::where('id', $application->recruitment_role_id)->lockForUpdate()->first();
                if ($role && $role->vacancies() <= 0) {
                    throw ValidationException::withMessages([
                        'role' => ["Posisi role {$role->name} sudah penuh."],
                    ]);
                }
            }

            // Check if user already joined somehow
            if (TeamMember::where('team_id', $team->id)->where('user_id', $application->user_id)->exists()) {
                throw ValidationException::withMessages([
                    'user' => ['Pengguna ini sudah menjadi anggota tim.'],
                ]);
            }

            // Add team member
            $member = TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $application->user_id,
                'permission' => TeamPermission::Member,
                'role_name' => $role?->name ?? 'Anggota Tim',
                'recruitment_role_id' => $role?->id,
                'joined_at' => now(),
            ]);

            // Update application status
            $application->update([
                'status' => ApplicationStatus::Accepted,
                'decided_by' => $decider->id,
                'decided_at' => now(),
                'decision_note' => $note,
            ]);

            ActivityLog::log(
                $team->campus_id,
                $team->id,
                $decider->id,
                'application_accepted',
                $member,
                ['applicant_id' => $application->user_id, 'role' => $role?->name]
            );

            // Notify applicant
            $application->user?->notify(new ApplicationStatusNotification($application, 'accepted'));

            return $member;
        });
    }

    /**
     * Reject an application.
     */
    public function rejectApplication(
        Application $application,
        User $decider,
        ?string $note = null
    ): void {
        DB::transaction(function () use ($application, $decider, $note) {
            $team = $application->recruitment->team;

            if (!$team->isLeader($decider) && !$decider->isCampusAdminOf($team->campus_id) && !$decider->isPlatformAdmin()) {
                throw ValidationException::withMessages([
                    'authorization' => ['Hanya ketua tim atau admin yang dapat menolak aplikasi.'],
                ]);
            }

            $application->update([
                'status' => ApplicationStatus::Rejected,
                'decided_by' => $decider->id,
                'decided_at' => now(),
                'decision_note' => $note,
            ]);

            ActivityLog::log(
                $team->campus_id,
                $team->id,
                $decider->id,
                'application_rejected',
                $application
            );

            // Notify applicant
            $application->user?->notify(new ApplicationStatusNotification($application, 'rejected'));
        });
    }

    /**
     * Send direct invitation from leader to student.
     */
    public function invite(
        User $inviter,
        Team $team,
        User $invitee,
        ?int $recruitmentRoleId = null,
        ?string $message = null
    ): Invitation {
        return DB::transaction(function () use ($inviter, $team, $invitee, $recruitmentRoleId, $message) {
            if (!$team->isLeader($inviter) && !$inviter->isCampusAdminOf($team->campus_id) && !$inviter->isPlatformAdmin()) {
                throw ValidationException::withMessages([
                    'authorization' => ['Hanya ketua tim yang dapat mengundang anggota.'],
                ]);
            }

            if ($team->hasMember($invitee)) {
                throw ValidationException::withMessages([
                    'invitee' => ['Pengguna ini sudah menjadi anggota tim.'],
                ]);
            }

            if ($team->availableSlots() <= 0) {
                throw ValidationException::withMessages([
                    'capacity' => ['Kapasitas tim sudah penuh.'],
                ]);
            }

            $pendingExists = Invitation::where('team_id', $team->id)
                ->where('invitee_id', $invitee->id)
                ->where('status', InvitationStatus::Pending)
                ->exists();

            if ($pendingExists) {
                throw ValidationException::withMessages([
                    'invitation' => ['Sudah ada undangan tertunda untuk mahasiswa ini.'],
                ]);
            }

            $roleName = null;
            if ($recruitmentRoleId) {
                $role = RecruitmentRole::find($recruitmentRoleId);
                $roleName = $role?->name;
            }

            $invitation = Invitation::create([
                'campus_id' => $team->campus_id,
                'team_id' => $team->id,
                'recruitment_role_id' => $recruitmentRoleId,
                'inviter_id' => $inviter->id,
                'invitee_id' => $invitee->id,
                'role_name' => $roleName,
                'message' => $message,
                'status' => InvitationStatus::Pending,
                'pending_marker' => 1,
                'expires_at' => now()->addDays(7),
            ]);

            ActivityLog::log(
                $team->campus_id,
                $team->id,
                $inviter->id,
                'invitation_sent',
                $invitation,
                ['invitee_id' => $invitee->id]
            );

            // Notify invitee via Unified Notification System
            app(\App\Services\Notifications\NotificationService::class)->sendProjectInvitation($invitation);

            return $invitation;
        });
    }

    /**
     * Accept invitation.
     */
    public function acceptInvitation(Invitation $invitation, User $invitee): TeamMember
    {
        return DB::transaction(function () use ($invitation, $invitee) {
            if ($invitation->invitee_id !== $invitee->id) {
                throw ValidationException::withMessages([
                    'authorization' => ['Undangan ini bukan untuk Anda.'],
                ]);
            }

            if ($invitation->status !== InvitationStatus::Pending || $invitation->isExpired()) {
                throw ValidationException::withMessages([
                    'invitation' => ['Undangan ini sudah tidak aktif atau kedaluwarsa.'],
                ]);
            }

            $team = Team::where('id', $invitation->team_id)->lockForUpdate()->firstOrFail();

            if ($team->availableSlots() <= 0) {
                throw ValidationException::withMessages([
                    'capacity' => ['Kapasitas tim sudah penuh saat ini.'],
                ]);
            }

            if ($team->hasMember($invitee)) {
                $invitation->update([
                    'status' => InvitationStatus::Accepted,
                    'pending_marker' => null,
                    'responded_at' => now(),
                ]);
                return $team->members()->where('user_id', $invitee->id)->first();
            }

            $member = TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $invitee->id,
                'permission' => TeamPermission::Member,
                'role_name' => $invitation->role_name ?? 'Anggota Tim',
                'recruitment_role_id' => $invitation->recruitment_role_id,
                'joined_at' => now(),
            ]);

            $invitation->update([
                'status' => InvitationStatus::Accepted,
                'pending_marker' => null,
                'responded_at' => now(),
            ]);

            ActivityLog::log(
                $team->campus_id,
                $team->id,
                $invitee->id,
                'invitation_accepted',
                $member
            );

            app(\App\Services\Notifications\NotificationService::class)->sendInvitationResponse($invitation, true);

            return $member;
        });
    }

    /**
     * Decline invitation.
     */
    public function declineInvitation(Invitation $invitation, User $invitee): void
    {
        if ($invitation->invitee_id !== $invitee->id) {
            throw ValidationException::withMessages([
                'authorization' => ['Undangan ini bukan untuk Anda.'],
            ]);
        }

        $invitation->update([
            'status' => InvitationStatus::Declined,
            'pending_marker' => null,
            'responded_at' => now(),
        ]);

        app(\App\Services\Notifications\NotificationService::class)->sendInvitationResponse($invitation, false);
    }
}
