<?php

namespace App\Contracts\Notifications;

use App\Models\AcademicClass;
use App\Models\CompetitionParticipation;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Collection;

interface NotificationRecipientResolverInterface
{
    /**
     * Resolve all active students enrolled in a class.
     */
    public function resolveClassStudents(AcademicClass $class, ?int $exceptUserId = null): Collection;

    /**
     * Resolve the lecturer(s) for a class.
     */
    public function resolveClassLecturers(AcademicClass $class, ?int $exceptUserId = null): Collection;

    /**
     * Resolve active members of a team.
     */
    public function resolveTeamMembers(Team $team, ?int $exceptUserId = null): Collection;

    /**
     * Resolve leader of a team.
     */
    public function resolveTeamLeader(Team $team): ?User;

    /**
     * Resolve members of a competition team.
     */
    public function resolveCompetitionTeamMembers(CompetitionParticipation $participation, ?int $exceptUserId = null): Collection;

    /**
     * Resolve mentors of a competition team.
     */
    public function resolveCompetitionMentors(CompetitionParticipation $participation, ?int $exceptUserId = null): Collection;

    /**
     * Resolve project supervisors/lecturers.
     */
    public function resolveProjectSupervisors(Project $project, ?int $exceptUserId = null): Collection;

    /**
     * Resolve Campus Admins for a specific campus.
     */
    public function resolveCampusAdmins(?int $campusId = null): Collection;

    /**
     * Get active student IDs with minimal memory overhead for high-concurrency bulk processing.
     *
     * @return array<int>
     */
    public function getActiveStudentIds(): array;
}
