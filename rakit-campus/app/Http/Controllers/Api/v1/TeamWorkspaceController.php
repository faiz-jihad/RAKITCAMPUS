<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\MilestoneStatus;
use App\Enums\PostKind;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Milestone;
use App\Models\Task;
use App\Models\TaskComment;
use App\Models\Team;
use App\Models\TeamPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TeamWorkspaceController extends Controller
{
    public function overview(Request $request, int $teamId): JsonResponse
    {
        $user = $request->user();
        $team = Team::with([
            'project',
            'participations.competition',
            'members.user:id,name',
            'milestones' => fn ($m) => $m->latest()->take(5),
        ])->findOrFail($teamId);

        $this->authorize('view', $team);

        // Task statistics
        $taskCounts = Task::where('team_id', $team->id)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->all();

        $recentActivities = ActivityLog::where('team_id', $team->id)
            ->with('actor:id,name')
            ->latest('created_at')
            ->take(10)
            ->get();

        return response()->json([
            'data' => [
                'team' => $team,
                'task_summary' => [
                    'todo' => $taskCounts[TaskStatus::Todo->value] ?? 0,
                    'in_progress' => $taskCounts[TaskStatus::InProgress->value] ?? 0,
                    'in_review' => $taskCounts[TaskStatus::InReview->value] ?? 0,
                    'completed' => $taskCounts[TaskStatus::Completed->value] ?? 0,
                    'total' => array_sum($taskCounts),
                ],
                'recent_activities' => $recentActivities,
            ],
        ]);
    }

    public function kanban(Request $request, int $teamId): JsonResponse
    {
        $team = Team::findOrFail($teamId);
        $this->authorize('view', $team);

        $tasks = Task::where('team_id', $team->id)
            ->with(['assignee:id,name', 'milestone:id,title', 'comments'])
            ->orderBy('position', 'asc')
            ->get();

        $columns = [
            'todo' => $tasks->where('status', TaskStatus::Todo)->values(),
            'in_progress' => $tasks->where('status', TaskStatus::InProgress)->values(),
            'in_review' => $tasks->where('status', TaskStatus::InReview)->values(),
            'completed' => $tasks->where('status', TaskStatus::Completed)->values(),
        ];

        return response()->json([
            'data' => $columns,
        ]);
    }

    public function storeTask(Request $request, int $teamId): JsonResponse
    {
        $user = $request->user();
        $team = Team::findOrFail($teamId);
        $this->authorize('manageWorkspace', $team);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'milestone_id' => ['nullable', 'exists:milestones,id'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'priority' => ['nullable', Rule::enum(TaskPriority::class)],
            'due_on' => ['nullable', 'date'],
            'status' => ['nullable', Rule::enum(TaskStatus::class)],
        ]);

        $maxPos = Task::where('team_id', $team->id)
            ->where('status', $validated['status'] ?? TaskStatus::Todo->value)
            ->max('position') ?? 0;

        $task = Task::create([
            'campus_id' => $team->campus_id,
            'team_id' => $team->id,
            'created_by' => $user->id,
            'milestone_id' => $validated['milestone_id'] ?? null,
            'assignee_id' => $validated['assignee_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'] ?? TaskPriority::Medium,
            'status' => $validated['status'] ?? TaskStatus::Todo,
            'due_on' => $validated['due_on'] ?? null,
            'position' => $maxPos + 1,
        ]);

        ActivityLog::log(
            $team->campus_id,
            $team->id,
            $user->id,
            'task_created',
            $task
        );

        return response()->json([
            'message' => 'Tugas berhasil dibuat.',
            'data' => $task->load(['assignee:id,name', 'milestone:id,title']),
        ], 201);
    }

    public function updateTask(Request $request, int $taskId): JsonResponse
    {
        $user = $request->user();
        $task = Task::with('team')->findOrFail($taskId);
        $this->authorize('update', $task);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::enum(TaskStatus::class)],
            'priority' => ['sometimes', Rule::enum(TaskPriority::class)],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'milestone_id' => ['nullable', 'exists:milestones,id'],
            'due_on' => ['nullable', 'date'],
            'position' => ['nullable', 'integer'],
        ]);

        if (isset($validated['status'])) {
            $newStatus = TaskStatus::from($validated['status']);
            if ($newStatus === TaskStatus::Completed && $task->status !== TaskStatus::Completed) {
                $validated['completed_at'] = now();
            } elseif ($newStatus !== TaskStatus::Completed) {
                $validated['completed_at'] = null;
            }
        }

        $task->update($validated);

        ActivityLog::log(
            $task->campus_id,
            $task->team_id,
            $user->id,
            'task_updated',
            $task,
            ['status' => $task->status->value]
        );

        return response()->json([
            'message' => 'Tugas berhasil diperbarui.',
            'data' => $task->load(['assignee:id,name', 'milestone:id,title']),
        ]);
    }

    public function addComment(Request $request, int $taskId): JsonResponse
    {
        $user = $request->user();
        $task = Task::findOrFail($taskId);
        $this->authorize('view', $task);

        $validated = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $comment = $task->comments()->create([
            'user_id' => $user->id,
            'body' => $validated['body'],
        ]);

        return response()->json([
            'message' => 'Komentar berhasil ditambahkan.',
            'data' => $comment->load('user:id,name'),
        ], 201);
    }

    public function milestones(Request $request, int $teamId): JsonResponse
    {
        $team = Team::findOrFail($teamId);
        $this->authorize('view', $team);

        $milestones = Milestone::where('team_id', $team->id)
            ->withCount([
                'tasks',
                'tasks as completed_tasks_count' => fn ($q) => $q->where('status', TaskStatus::Completed),
            ])
            ->latest('due_on')
            ->get();

        return response()->json(['data' => $milestones]);
    }

    public function storeMilestone(Request $request, int $teamId): JsonResponse
    {
        $user = $request->user();
        $team = Team::findOrFail($teamId);
        $this->authorize('manageWorkspace', $team);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'starts_on' => ['nullable', 'date'],
            'due_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'status' => ['nullable', Rule::enum(MilestoneStatus::class)],
        ]);

        $milestone = Milestone::create([
            'campus_id' => $team->campus_id,
            'team_id' => $team->id,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'starts_on' => $validated['starts_on'] ?? now(),
            'due_on' => $validated['due_on'] ?? null,
            'status' => $validated['status'] ?? MilestoneStatus::Planned,
        ]);

        return response()->json([
            'message' => 'Milestone berhasil dibuat.',
            'data' => $milestone,
        ], 201);
    }

    public function posts(Request $request, int $teamId): JsonResponse
    {
        $team = Team::findOrFail($teamId);
        $this->authorize('view', $team);

        $posts = TeamPost::where('team_id', $team->id)
            ->whereNull('parent_id')
            ->with(['author:id,name', 'replies.author:id,name'])
            ->orderBy('pinned', 'desc')
            ->latest()
            ->paginate(15);

        return response()->json($posts);
    }

    public function storePost(Request $request, int $teamId): JsonResponse
    {
        $user = $request->user();
        $team = Team::findOrFail($teamId);
        $this->authorize('view', $team);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'kind' => ['nullable', Rule::enum(PostKind::class)],
            'parent_id' => ['nullable', 'exists:team_posts,id'],
            'pinned' => ['nullable', 'boolean'],
        ]);

        $post = TeamPost::create([
            'campus_id' => $team->campus_id,
            'team_id' => $team->id,
            'user_id' => $user->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'kind' => $validated['kind'] ?? PostKind::Discussion,
            'title' => $validated['title'] ?? null,
            'body' => $validated['body'],
            'pinned' => $validated['pinned'] ?? false,
        ]);

        return response()->json([
            'message' => 'Postingan terkirim.',
            'data' => $post->load('author:id,name'),
        ], 201);
    }
}
