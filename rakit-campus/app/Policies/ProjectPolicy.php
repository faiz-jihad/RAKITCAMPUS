<?php

namespace App\Policies;

use App\Enums\ProjectStatus;
use App\Enums\Visibility;
use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        if ($user->isCampusAdminOf($project->campus_id)) {
            return true;
        }

        // Leader, supervisor, class lecturer, or team member can always view
        if (
            $project->leader_id === $user->id
            || $project->primary_supervisor_id === $user->id
            || $project->team?->hasMember($user)
            || ($project->academicClass && $project->academicClass->isLecturer($user))
        ) {
            return true;
        }

        // Hidden / moderated
        if ($project->moderation_status !== 'visible') {
            return false;
        }

        // Drafts only visible to team
        if ($project->status === ProjectStatus::Draft) {
            return false;
        }

        // Public visible across all campuses
        if ($project->visibility === Visibility::Public) {
            return true;
        }

        // Campus visible only to same campus
        return $user->belongsToCampus($project->campus_id);
    }

    public function create(User $user): bool
    {
        // Verified or active student in any campus
        return $user->activeMembership() !== null;
    }

    public function update(User $user, Project $project): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        if ($user->isCampusAdminOf($project->campus_id)) {
            return true;
        }

        return $project->leader_id === $user->id;
    }

    public function delete(User $user, Project $project): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        if ($user->isCampusAdminOf($project->campus_id)) {
            return true;
        }

        return $project->leader_id === $user->id;
    }

    public function complete(User $user, Project $project): bool
    {
        return $this->update($user, $project);
    }
}
