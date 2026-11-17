<?php

namespace App\Services\Workspace;

use App\Contracts\Workspace\TaskServiceInterface;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TaskService implements TaskServiceInterface
{
    /**
     * Create a task atomically and recalculate project/team progress under lock.
     */
    public function createTask(Team $team, User $user, array $data): Task
    {
        return DB::transaction(function () use ($team, $user, $data) {
            $lockedTeam = Team::where('id', $team->id)->lockForUpdate()->firstOrFail();

            $status = $data['status'] ?? TaskStatus::Todo->value;
            if ($status instanceof TaskStatus) {
                $status = $status->value;
            }

            $maxPos = Task::where('team_id', $lockedTeam->id)
                ->where('status', $status)
                ->lockForUpdate()
                ->max('position') ?? 0;

            $priority = $data['priority'] ?? TaskPriority::Medium->value;
            if ($priority instanceof TaskPriority) {
                $priority = $priority->value;
            }

            $campusId = $lockedTeam->campus_id ?? $lockedTeam->project?->campus_id ?? $user->campusId() ?? 1;

            $task = Task::create([
                'campus_id' => $campusId,
                'team_id' => $lockedTeam->id,
                'created_by' => $user->id,
                'assignee_id' => $data['assignee_id'] ?? null,
                'milestone_id' => $data['milestone_id'] ?? null,
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'status' => $status,
                'priority' => $priority,
                'due_on' => $data['due_on'] ?? null,
                'position' => $maxPos + 1,
                'completed_at' => $status === TaskStatus::Completed->value ? now() : null,
            ]);

            $this->recalculateProgress($lockedTeam);

            return $task;
        });
    }

    /**
     * Update task status or details atomically and recalculate progress under lock.
     */
    public function updateTask(Task $task, array $data, ?User $user = null): Task
    {
        return DB::transaction(function () use ($task, $data) {
            $lockedTask = Task::where('id', $task->id)->lockForUpdate()->firstOrFail();
            $lockedTeam = Team::where('id', $lockedTask->team_id)->lockForUpdate()->firstOrFail();

            if (isset($data['status'])) {
                $newStatus = $data['status'] instanceof TaskStatus ? $data['status']->value : $data['status'];
                $oldStatus = $lockedTask->status instanceof TaskStatus ? $lockedTask->status->value : $lockedTask->status;

                if ($newStatus === TaskStatus::Completed->value && $oldStatus !== TaskStatus::Completed->value) {
                    $data['completed_at'] = now();
                } elseif ($newStatus !== TaskStatus::Completed->value) {
                    $data['completed_at'] = null;
                }
                $data['status'] = $newStatus;
            }

            if (isset($data['priority']) && $data['priority'] instanceof TaskPriority) {
                $data['priority'] = $data['priority']->value;
            }

            $lockedTask->update($data);
            $this->recalculateProgress($lockedTeam);

            return $lockedTask;
        });
    }

    /**
     * Delete task atomically and recalculate progress under lock.
     */
    public function deleteTask(Task $task, ?User $user = null): bool
    {
        return DB::transaction(function () use ($task) {
            $lockedTask = Task::where('id', $task->id)->lockForUpdate()->firstOrFail();
            $lockedTeam = Team::where('id', $lockedTask->team_id)->lockForUpdate()->firstOrFail();

            $deleted = (bool) $lockedTask->delete();
            $this->recalculateProgress($lockedTeam);

            return $deleted;
        });
    }

    /**
     * Recalculate project progress atomically based on task completion.
     */
    protected function recalculateProgress(Team $team): void
    {
        $total = Task::where('team_id', $team->id)->count();
        $done = Task::where('team_id', $team->id)
            ->where('status', TaskStatus::Completed->value)
            ->count();

        $percent = $total > 0 ? (int) round(($done / $total) * 100) : 0;

        if ($team->project) {
            $team->project()->update(['progress' => $percent]);
        }
    }
}
