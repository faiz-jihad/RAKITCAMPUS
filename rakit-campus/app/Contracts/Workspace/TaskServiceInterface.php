<?php

namespace App\Contracts\Workspace;

use App\Models\Task;
use App\Models\Team;
use App\Models\User;

interface TaskServiceInterface
{
    /**
     * Create a task atomically and recalculate project/team progress under lock.
     *
     * @param  array<string, mixed>  $data
     */
    public function createTask(Team $team, User $user, array $data): Task;

    /**
     * Update task status or details atomically and recalculate progress under lock.
     *
     * @param  array<string, mixed>  $data
     */
    public function updateTask(Task $task, array $data, ?User $user = null): Task;

    /**
     * Delete task atomically and recalculate progress under lock.
     */
    public function deleteTask(Task $task, ?User $user = null): bool;
}
