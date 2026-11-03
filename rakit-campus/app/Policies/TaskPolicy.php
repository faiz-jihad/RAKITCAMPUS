<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function view(User $user, Task $task): bool
    {
        return $task->team->hasMember($user)
            || $user->isCampusAdminOf($task->campus_id)
            || $user->isPlatformAdmin();
    }

    public function create(User $user, Task $task): bool
    {
        return $this->view($user, $task);
    }

    public function update(User $user, Task $task): bool
    {
        return $this->view($user, $task);
    }

    public function delete(User $user, Task $task): bool
    {
        if ($user->isPlatformAdmin()) {
            return true;
        }

        if ($user->isCampusAdminOf($task->campus_id)) {
            return true;
        }

        return $task->created_by === $user->id || $task->team->isLeader($user);
    }
}
