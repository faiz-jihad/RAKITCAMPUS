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
    public function index(Request $request): Response
    {
        $user = $request->user();
        $teams = Team::where(function ($q) use ($user) {
            $q->where('leader_id', $user->id)
              ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
        })->with([
            'project:id,title,slug,status,category,progress,short_description',
            'participations.competition:id,name,slug,status,category',
            'members.user:id,name,email',
            'milestones',
            'tasks:id,team_id,status,title,priority',
        ])->latest()->get()->map(function ($team) use ($user) {
            $totalTasks = $team->tasks->count();
            $doneTasks = $team->tasks->where('status', TaskStatus::Completed)->count();
            return [
                'id' => $team->id,
                'name' => $team->name,
                'description' => $team->description,
                'type' => $team->type?->value ?? 'project',
                'is_leader' => $team->leader_id === $user->id || $team->isLeader($user),
                'project' => $team->project,
                'competition' => $team->participations->first()?->competition,
                'members' => $team->members->map(fn ($m) => [
                    'id' => $m->user_id,
                    'name' => $m->user->name,
                    'role' => $m->role_name ?? ($m->permission === 'leader' ? 'Leader' : 'Anggota'),
                ]),
                'total_tasks' => $totalTasks,
                'done_tasks' => $doneTasks,
                'progress_percent' => $totalTasks > 0 ? (int) round(($doneTasks / $totalTasks) * 100) : ($team->project?->progress ?? 0),
                'active_tasks' => $team->tasks->whereIn('status', [TaskStatus::Todo, TaskStatus::InProgress, TaskStatus::InReview])->values(),
            ];
        });

        return Inertia::render('workspace/index', [
            'teams' => $teams,
        ]);
    }

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
