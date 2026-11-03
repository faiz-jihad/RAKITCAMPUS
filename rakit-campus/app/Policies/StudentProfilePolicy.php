<?php

namespace App\Policies;

use App\Models\StudentProfile;
use App\Models\User;

class StudentProfilePolicy
{
    public function view(User $user, StudentProfile $profile): bool
    {
        if ($user->id === $profile->user_id || $user->isPlatformAdmin()) {
            return true;
        }

        if ($user->isCampusAdminOf($profile->campus_id)) {
            return true;
        }

        if ($profile->visibility->value === 'public') {
            return true;
        }

        if ($profile->visibility->value === 'campus') {
            return $user->belongsToCampus($profile->campus_id);
        }

        return false;
    }

    public function update(User $user, StudentProfile $profile): bool
    {
        return $user->id === $profile->user_id || $user->isPlatformAdmin();
    }
}
