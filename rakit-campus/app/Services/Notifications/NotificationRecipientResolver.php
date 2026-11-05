<?php

namespace App\Services\Notifications;

use App\Contracts\Notifications\NotificationRecipientResolverInterface;
use App\Models\AcademicClass;
use App\Models\Campus;
use App\Models\Competition;
use App\Models\CompetitionParticipation;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationRecipientResolver implements NotificationRecipientResolverInterface
{
    /**
     * Resolve all active students enrolled in a class.
     */
    public function resolveClassStudents(AcademicClass $class, ?int $exceptUserId = null): Collection
    {
        $enrolledUserIds = \App\Models\AcademicClassStudent::where('academic_class_id', $class->id)
            ->pluck('user_id')
            ->toArray();

        return User::whereIn('id', $enrolledUserIds)
            ->where('status', 'active')
            ->when($exceptUserId, fn ($q) => $q->where('id', '!=', $exceptUserId))
            ->get();
    }

    /**
     * Resolve the lecturer(s) for a class.
     */
    public function resolveClassLecturers(AcademicClass $class, ?int $exceptUserId = null): Collection
    {
        $lecturerIds = array_filter([$class->lecturer_id]);

        return User::whereIn('id', $lecturerIds)
            ->where('status', 'active')
            ->when($exceptUserId, fn ($q) => $q->where('id', '!=', $exceptUserId))
            ->get();
    }

    /**
     * Resolve active members of a team.
     */
    public function resolveTeamMembers(Team $team, ?int $exceptUserId = null): Collection
    {
        return User::whereHas('teamMemberships', function ($q) use ($team) {
            $q->where('team_id', $team->id);
        })
        ->where('status', 'active')
        ->when($exceptUserId, fn ($q) => $q->where('id', '!=', $exceptUserId))
        ->get();
    }

    /**
     * Resolve leader of a team.
     */
    public function resolveTeamLeader(Team $team): ?User
    {
        return User::where('id', $team->leader_id)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Resolve members of a competition team.
     */
    public function resolveCompetitionTeamMembers(CompetitionParticipation $participation, ?int $exceptUserId = null): Collection
    {
        if (!$participation->team) {
            return collect();
        }

        return $this->resolveTeamMembers($participation->team, $exceptUserId);
    }

    /**
     * Resolve mentors of a competition team.
     */
    public function resolveCompetitionMentors(CompetitionParticipation $participation, ?int $exceptUserId = null): Collection
    {
        $mentorIds = [];
        if ($participation->mentor_id) {
            $mentorIds[] = $participation->mentor_id;
        }

        $relMentors = $participation->mentors()->pluck('user_id')->toArray();
        $allMentorIds = array_unique(array_merge($mentorIds, $relMentors));

        return User::whereIn('id', $allMentorIds)
            ->where('status', 'active')
            ->when($exceptUserId, fn ($q) => $q->where('id', '!=', $exceptUserId))
            ->get();
    }

    /**
     * Resolve project supervisors/lecturers.
     */
    public function resolveProjectSupervisors(Project $project, ?int $exceptUserId = null): Collection
    {
        $supervisorIds = $project->supervisors()->pluck('lecturer_id')->toArray();

        // Also fallback to class lecturer if assigned to class
        if ($project->academic_class_id && $project->academicClass?->lecturer_id) {
            $supervisorIds[] = $project->academicClass->lecturer_id;
        }

        return User::whereIn('id', array_unique($supervisorIds))
            ->where('status', 'active')
            ->when($exceptUserId, fn ($q) => $q->where('id', '!=', $exceptUserId))
            ->get();
    }

    /**
     * Resolve Campus Admins for a specific campus.
     */
    public function resolveCampusAdmins(?int $campusId = null): Collection
    {
        return User::whereHas('memberships', function ($q) use ($campusId) {
            $q->where('role', \App\Enums\CampusRole::CampusAdmin->value)
              ->where('status', \App\Enums\MembershipStatus::Active->value);
            if ($campusId) {
                $q->where('campus_id', $campusId);
            }
        })
        ->where('status', 'active')
        ->get();
    }

    /**
     * Get active student IDs with minimal memory overhead for high-concurrency bulk processing.
     *
     * @return array<int>
     */
    public function getActiveStudentIds(): array
    {
        return User::where('status', 'active')
            ->whereHas('studentProfile')
            ->pluck('id')
            ->toArray();
    }
}
