<?php

namespace App\Services\Matchmaking;

use App\Models\Competition;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UnifiedMembershipService
{
    public function __construct(
        protected EligibilityService $eligibilityService,
        protected MembershipService $membershipService
    ) {}

    /**
     * Check student eligibility for Project Hub.
     * Enforces strictly: 1 active academic project per student.
     */
    public function canJoinProject(User $student, ?Project $project = null): array
    {
        return $this->eligibilityService->checkStudentEligibility($student, $project);
    }

    /**
     * Check student eligibility for Competition Hub.
     * Enforces Flexible Membership by default:
     * - 1 active team per competition.
     * - Does NOT block across different competitions.
     * - Does NOT block from Project Hub participation.
     */
    public function canJoinCompetition(User $student, ?Team $team = null, ?int $competitionId = null): array
    {
        return $this->eligibilityService->checkCompetitionEligibility($student, $team, $competitionId);
    }

    /**
     * Official member withdrawal from a team (Project or Competition) with audit logging.
     */
    public function withdrawFromTeam(Team $team, User $member, string $reason): void
    {
        DB::transaction(function () use ($team, $member, $reason) {
            $membership = TeamMember::where('team_id', $team->id)
                ->where('user_id', $member->id)
                ->firstOrFail();

            if ($team->isLeader($member)) {
                throw ValidationException::withMessages([
                    'member' => ['Ketua tim tidak dapat mengundurkan diri secara sepihak. Delegasikan kepemimpinan terlebih dahulu.'],
                ]);
            }

            $membership->delete();

            \App\Models\MatchingAuditLog::log(
                'member_withdrawn',
                [
                    'team_id' => $team->id,
                    'user_id' => $member->id,
                    'reason' => $reason,
                ],
                $team->project?->academic_class_id,
                $team->project?->id,
                $member->id
            );
        });
    }
}
