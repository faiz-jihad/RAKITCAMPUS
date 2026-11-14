<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function view(User $user, Team $team): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        if ($user->isCampusAdminOf($team->campus_id)) {
            return true;
        }

        return $team->hasMember($user);
    }

    public function manageWorkspace(User $user, Team $team): bool
    {
        // Any member of the team can participate in workspace
        return $this->view($user, $team);
    }

    public function manageRecruitment(User $user, Team $team): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        if ($user->isCampusAdminOf($team->campus_id)) {
            return true;
        }

        return $team->isLeader($user);
    }

    public function update(User $user, Team $team): bool
    {
        return $this->manageRecruitment($user, $team);
    }

    /**
     * Determine whether the user can connect, disconnect, trigger sync, or manage contributor mappings.
     * Allowed: Team Owner, Team Admin, Campus Admin, Platform Admin.
     */
    public function manageGitHub(User $user, Team $team): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        if ($user->isCampusAdminOf($team->campus_id)) {
            return true;
        }

        return $team->isLeader($user);
    }

    /**
     * Determine whether the user can view GitHub analytics and repository status.
     * Allowed: Team members, leaders, class lecturers, supervisors, admins.
     */
    public function viewGitHub(User $user, Team $team): bool
    {
        if ($this->manageGitHub($user, $team)) {
            return true;
        }

        if ($team->hasMember($user)) {
            return true;
        }

        // Project leader or class lecturer
        if ($team->project?->leader_id === $user->id) {
            return true;
        }

        if ($team->project?->academicClass && $team->project->academicClass->isLecturer($user)) {
            return true;
        }

        return false;
    }
}
