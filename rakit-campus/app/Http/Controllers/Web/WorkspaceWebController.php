<?php

namespace App\Http\Controllers\Web;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Task;
use App\Models\Team;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceWebController extends Controller
{
    public function show(Request $request, int $teamId): Response
    {
        $user = $request->user();
        $team = Team::with([
            'project',
            'participations.competition',
            'members.user:id,name,email',
            'milestones.tasks',
            'posts.author:id,name',
        ])->findOrFail($teamId);

        $this->authorize('view', $team);

        $tasks = Task::where('team_id', $team->id)
            ->with(['assignee:id,name', 'milestone:id,title', 'comments.user:id,name'])
            ->orderBy('position', 'asc')
            ->get();

        $kanban = [
            'todo' => $tasks->where('status', TaskStatus::Todo)->values(),
            'in_progress' => $tasks->where('status', TaskStatus::InProgress)->values(),
            'in_review' => $tasks->where('status', TaskStatus::InReview)->values(),
            'completed' => $tasks->where('status', TaskStatus::Completed)->values(),
        ];

        $activities = ActivityLog::where('team_id', $team->id)
            ->with('actor:id,name')
            ->latest('created_at')
            ->take(15)
            ->get();

        return Inertia::render('workspace/show', [
            'team' => $team,
            'kanban' => $kanban,
            'activities' => $activities,
            'isLeader' => $team->isLeader($user),
        ]);
    }
}
