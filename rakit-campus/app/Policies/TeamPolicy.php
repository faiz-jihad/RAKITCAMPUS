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
}
