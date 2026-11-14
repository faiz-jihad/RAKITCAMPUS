<?php

namespace App\Policies;

use App\Enums\CompetitionScope;
use App\Models\Competition;
use App\Models\User;

class CompetitionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Competition $competition): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        if ($competition->campus_id && $user->isCampusAdminOf($competition->campus_id)) {
            return true;
        }

        if ($competition->moderation_status !== 'visible') {
            return false;
        }

        if ($competition->scope === CompetitionScope::Global) {
            return true;
        }

        return $user->belongsToCampus($competition->campus_id);
    }

    public function create(User $user): bool
    {
        return $user->activeMembership() !== null || $user->memberships()->exists() || $user->profile !== null;
    }

    public function update(User $user, Competition $competition): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        if ($competition->campus_id && $user->isCampusAdminOf($competition->campus_id)) {
            return true;
        }

        return $competition->created_by === $user->id;
    }

    public function delete(User $user, Competition $competition): bool
    {
        return $this->update($user, $competition);
    }

    public function moderate(User $user, Competition $competition): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        return $competition->campus_id ? $user->isCampusAdminOf($competition->campus_id) : false;
    }
}
