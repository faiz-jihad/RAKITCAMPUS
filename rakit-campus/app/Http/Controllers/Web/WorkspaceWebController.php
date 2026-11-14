<?php

namespace App\Http\Controllers\Web;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\AcademicClassGuidance;
use App\Models\ActivityLog;
use App\Models\Milestone;
use App\Models\Task;
use App\Models\Team;
use App\Services\ProjectOrchestratorAgent;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceWebController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $isLecturer = $user->isLecturer();

        $teamsQuery = Team::query();

        if ($isLecturer) {
            // Lecturers can see their own teams OR teams of classes they teach
            $teamsQuery->where(function ($q) use ($user) {
                $q->where('leader_id', $user->id)
                  ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id))
                  ->orWhereHas('project.academicClass', fn ($ac) => $ac->where('lecturer_id', $user->id)->orWhereHas('coLecturers', fn ($cl) => $cl->where('users.id', $user->id)));
            });
        } else {
            $teamsQuery->where(function ($q) use ($user) {
                $q->where('leader_id', $user->id)
                  ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
            });
        }

        $teams = $teamsQuery->with([
            'project:id,title,slug,status,category,progress,short_description,academic_class_id,lecturer_notes,lecturer_evaluation',
            'project.academicClass:id,name,code',
            'participations.competition:id,name,slug,status,category',
            'members.user:id,name,email',
            'milestones',
            'tasks:id,team_id,status,title,priority',
        ])->latest()->get()->map(function ($team) use ($user, $isLecturer) {
            $totalTasks = $team->tasks->count();
            $doneTasks = $team->tasks->where('status', TaskStatus::Completed)->count();
            $isTeamLeader = $team->leader_id === $user->id || $team->isLeader($user);
            $isClassLecturer = $team->project?->academicClass && $team->project->academicClass->isLecturer($user);

            return [
                'id' => $team->id,
                'name' => $team->name,
                'description' => $team->description,
                'type' => $team->type?->value ?? 'project',
                'is_leader' => $isTeamLeader,
                'is_lecturer_reviewer' => $isLecturer || $isClassLecturer,
                'is_full' => $team->isFull(),
                'capacity' => $team->capacity,
                'members_count' => $team->members->count(),
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

    public function show(Request $request, int $teamId): \Inertia\Response|\Illuminate\Http\RedirectResponse
    {
        $user = $request->user();
        $team = Team::with([
            'project.academicClass.lecturer:id,name,email',
            'participations.competition',
            'members.user:id,name,email',
            'milestones.tasks',
            'posts.author:id,name',
        ])->findOrFail($teamId);

        $isClassLecturer = $team->project?->academicClass && $team->project->academicClass->isLecturer($user);
        $isLecturer = $user->isLecturer() || $isClassLecturer;

        // If not a lecturer and not a member, verify authorization
        if (! $isLecturer) {
            $this->authorize('view', $team);
        }

        // Project Workspace must only become available after successful team activation
        if ($team->project) {
            $allowedStatuses = [
                \App\Enums\ProjectStatus::InProgress->value,
                \App\Enums\ProjectStatus::Completed->value,
                \App\Enums\ProjectStatus::OnHold->value,
            ];
            $projStatus = is_object($team->project->status) ? $team->project->status->value : $team->project->status;

            if (! in_array($projStatus, $allowedStatuses, true) && ! $isLecturer) {
                return redirect()->route('projects.show', $team->project->id)
                    ->with('warning', 'Workspace proyek hanya dapat diakses setelah formasi kelompok dikonfirmasi dan diaktifkan (Status: Sedang Berjalan). Silakan selesaikan formasi tim terlebih dahulu.');
            }
        }

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

        $milestones = $team->milestones()
            ->withCount(['tasks', 'tasks as completed_tasks_count' => function ($q) {
                $q->where('status', TaskStatus::Completed->value);
            }])
            ->orderBy('starts_on')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'description' => $m->description,
                'status' => $m->status,
                'starts_on' => $m->starts_on?->format('d M Y'),
                'due_on' => $m->due_on?->format('d M Y'),
                'tasks_count' => $m->tasks_count,
                'completed_tasks_count' => $m->completed_tasks_count,
                'progress' => $m->tasks_count > 0 ? (int) round(($m->completed_tasks_count / $m->tasks_count) * 100) : 0,
            ]);

        $allMembers = $team->members()->with(['user.profile.skills'])->get()->map(fn ($m) => [
            'id' => $m->id,
            'user_id' => $m->user_id,
            'name' => $m->user->name,
            'email' => $m->user->email,
            'role_name' => $m->role_name ?? ($m->permission === 'leader' ? 'Leader' : 'Anggota'),
            'permission' => $m->permission,
            'skills' => $m->user->profile?->skills?->pluck('name')->toArray() ?? [],
        ]);

        $githubRepo = $team->githubRepository;
        $githubData = null;
        if ($githubRepo && $githubRepo->isConnected()) {
            try {
                $analyticsService = app(\App\Services\GitHub\GitHubAnalyticsService::class);
                $githubData = $analyticsService->getOverview($githubRepo);
            } catch (\Throwable $e) {
                // Ignore analytics error on page load so workspace renders reliably
            }
        }

        return Inertia::render('workspace/show', [
            'team' => $team,
            'kanban' => $kanban,
            'milestones' => $milestones,
            'activities' => $activities,
            'allMembers' => $allMembers,
            'isLeader' => $team->isLeader($user),
            'isLecturer' => $isLecturer,
            'isFull' => $team->isFull(),
            'project' => $team->project,
            'storageQuota' => \App\Services\Storage\ObjectStorageService::getTeamStorageQuotaInfo($team->id),
            'githubRepo' => $githubRepo ? [
                'id' => $githubRepo->id,
                'full_name' => $githubRepo->full_name,
                'html_url' => $githubRepo->html_url,
                'default_branch' => $githubRepo->default_branch,
                'is_private' => $githubRepo->is_private,
                'status' => $githubRepo->status,
                'sync_status' => $githubRepo->sync_status,
                'sync_error' => $githubRepo->sync_error,
                'last_synced_at' => $githubRepo->last_synced_at?->toIso8601String(),
                'webhook_url' => url('/api/v1/integrations/github/webhook'),
            ] : null,
            'githubData' => $githubData,
            'canManageGitHub' => $user->can('manageGitHub', $team),
        ]);
    }

    /**
     * AI Agent Trigger: Orchestrate roadmap sprints and delegated tasks
     */
    public function orchestrateRoadmap(Request $request, int $teamId)
    {
        $user = $request->user();
        $team = Team::findOrFail($teamId);

        $agent = new ProjectOrchestratorAgent();
        $result = $agent->orchestrateRoadmapAndTasks($team, $user);

        if ($request->wantsJson()) {
            return response()->json($result);
        }

        return back()->with('success', $result['message']);
    }

    /**
     * Create a new task on the team Kanban board
     */
    public function storeTask(Request $request, int $teamId)
    {
        $team = Team::findOrFail($teamId);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', Rule::enum(TaskPriority::class)],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'milestone_id' => ['nullable', 'exists:milestones,id'],
            'status' => ['required', Rule::enum(TaskStatus::class)],
        ]);

        $user = $request->user();
        $campusId = $team->campus_id ?? $team->project?->campus_id ?? $user->campusId() ?? 1;
        $maxPos = Task::where('team_id', $team->id)->where('status', $validated['status'])->max('position') ?? 0;

        $task = Task::create([
            'campus_id' => $campusId,
            'team_id' => $team->id,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'priority' => $validated['priority'],
            'assignee_id' => $validated['assignee_id'] ?? null,
            'milestone_id' => $validated['milestone_id'] ?? null,
            'status' => $validated['status'],
            'position' => $maxPos + 1,
            'completed_at' => $validated['status'] === TaskStatus::Completed->value ? now() : null,
        ]);

        // Recalculate project progress
        $total = Task::where('team_id', $team->id)->count();
        $done = Task::where('team_id', $team->id)->where('status', TaskStatus::Completed->value)->count();
        $percent = $total > 0 ? (int) round(($done / $total) * 100) : 0;
        $team->project?->update(['progress' => $percent]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Tugas baru berhasil ditambahkan.',
                'data' => $task->load(['assignee:id,name', 'milestone:id,title']),
            ]);
        }

        return back()->with('success', 'Tugas baru berhasil ditambahkan.');
    }

    /**
     * Edit / Update task details (Trello card edit)
     */
    public function updateTask(Request $request, int $teamId, int $taskId)
    {
        $user = $request->user();
        $team = Team::findOrFail($teamId);
        $task = Task::where('team_id', $team->id)->findOrFail($taskId);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::enum(TaskStatus::class)],
            'priority' => ['sometimes', Rule::enum(TaskPriority::class)],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'milestone_id' => ['nullable', 'exists:milestones,id'],
            'due_on' => ['nullable', 'date'],
        ]);

        if (isset($validated['status'])) {
            if ($validated['status'] === 'completed' && $task->status !== 'completed') {
                $validated['completed_at'] = now();
            } elseif ($validated['status'] !== 'completed') {
                $validated['completed_at'] = null;
            }
        }

        $task->update($validated);

        // Recalculate project progress
        $total = Task::where('team_id', $team->id)->count();
        $done = Task::where('team_id', $team->id)->where('status', TaskStatus::Completed->value)->count();
        $percent = $total > 0 ? (int) round(($done / $total) * 100) : 0;
        $team->project?->update(['progress' => $percent]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Tugas berhasil diperbarui.',
                'data' => $task->load(['assignee:id,name', 'milestone:id,title']),
            ]);
        }

        return back()->with('success', 'Tugas berhasil diperbarui.');
    }

    /**
     * Delete a task
     */
    public function deleteTask(Request $request, int $teamId, int $taskId)
    {
        $team = Team::findOrFail($teamId);
        $task = Task::where('team_id', $team->id)->findOrFail($taskId);
        $task->delete();

        // Recalculate project progress
        $total = Task::where('team_id', $team->id)->count();
        $done = Task::where('team_id', $team->id)->where('status', TaskStatus::Completed->value)->count();
        $percent = $total > 0 ? (int) round(($done / $total) * 100) : 0;
        $team->project?->update(['progress' => $percent]);

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Tugas berhasil dihapus.']);
        }

        return back()->with('success', 'Tugas berhasil dihapus.');
    }

    /**
     * Lecturer evaluation, grading, and improvement feedback
     */
    public function saveEvaluation(Request $request, int $teamId)
    {
        $user = $request->user();
        $team = Team::with('project.academicClass')->findOrFail($teamId);
        $project = $team->project;

        if (! $project) {
            return back()->with('error', 'Tim ini tidak terhubung dengan proyek manapun.');
        }

        $validated = $request->validate([
            'lecturer_evaluation' => ['required', 'string', 'max:100'],
            'lecturer_notes' => ['required', 'string'],
        ]);

        $project->update([
            'lecturer_evaluation' => $validated['lecturer_evaluation'],
            'lecturer_notes' => $validated['lecturer_notes'],
        ]);

        // If part of an academic class, also create guidance history record
        if ($project->academic_class_id) {
            AcademicClassGuidance::create([
                'academic_class_id' => $project->academic_class_id,
                'project_id' => $project->id,
                'lecturer_id' => $user->id,
                'title' => 'Evaluasi & Nilai Tim Proyek: ' . $team->name,
                'content' => "Status/Nilai: {$validated['lecturer_evaluation']}\n\nCatatan Arahan & Perbaikan Dosen:\n{$validated['lecturer_notes']}",
                'type' => 'evaluation',
            ]);
        }

        ActivityLog::log(
            $team->campus_id,
            $team->id,
            $user->id,
            'lecturer_evaluation_published',
            $project,
            [
                'evaluation' => $validated['lecturer_evaluation'],
                'notes' => $validated['lecturer_notes'],
            ]
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Nilai dan catatan perbaikan berhasil diterbitkan oleh Dosen.',
                'data' => $project,
            ]);
        }

        return back()->with('success', 'Nilai dan catatan perbaikan berhasil diterbitkan oleh Dosen.');
    }

    /**
     * Create a new milestone/sprint manually
     */
    public function storeMilestone(Request $request, int $teamId)
    {
        $user = $request->user();
        $team = Team::findOrFail($teamId);

        $isClassLecturer = $team->project?->academicClass && $team->project->academicClass->isLecturer($user);
        $isLecturer = $user->isLecturer() || $isClassLecturer;

        if (!$isLecturer && !$team->hasMember($user)) {
            abort(403, 'Hanya anggota tim atau dosen pembimbing yang dapat menambahkan sprint.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', Rule::in(['planned', 'in_progress', 'completed'])],
            'starts_on' => ['nullable', 'date'],
            'due_on' => ['nullable', 'date'],
        ]);

        $campusId = $team->campus_id ?? $team->project?->campus_id ?? $user->campusId() ?? 1;

        $milestone = Milestone::create([
            'campus_id' => $campusId,
            'team_id' => $team->id,
            'created_by' => $user->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'],
            'starts_on' => $validated['starts_on'] ?? null,
            'due_on' => $validated['due_on'] ?? null,
        ]);

        ActivityLog::log(
            $campusId,
            $team->id,
            $user->id,
            'milestone_created',
            $milestone,
            ['title' => $milestone->title]
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Sprint baru berhasil dibuat.',
                'data' => [
                    'id' => $milestone->id,
                    'title' => $milestone->title,
                    'description' => $milestone->description,
                    'status' => $milestone->status->value ?? $milestone->status,
                    'starts_on' => $milestone->starts_on?->format('d M Y'),
                    'due_on' => $milestone->due_on?->format('d M Y'),
                    'tasks_count' => 0,
                    'completed_tasks_count' => 0,
                    'progress' => 0,
                ],
            ]);
        }

        return back()->with('success', "Sprint '{$milestone->title}' berhasil dibuat.");
    }

    /**
     * Edit / update an existing milestone/sprint
     */
    public function updateMilestone(Request $request, int $teamId, int $milestoneId)
    {
        $user = $request->user();
        $team = Team::findOrFail($teamId);
        $milestone = Milestone::where('team_id', $team->id)->findOrFail($milestoneId);

        $isClassLecturer = $team->project?->academicClass && $team->project->academicClass->isLecturer($user);
        $isLecturer = $user->isLecturer() || $isClassLecturer;

        if (!$isLecturer && !$team->hasMember($user)) {
            abort(403, 'Hanya anggota tim atau dosen pembimbing yang dapat mengubah sprint ini.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'status' => ['required', Rule::in(['planned', 'in_progress', 'completed'])],
            'starts_on' => ['nullable', 'date'],
            'due_on' => ['nullable', 'date'],
        ]);

        $milestone->update($validated);

        // Recalculate milestone progress
        $tasksCount = $milestone->tasks()->count();
        $completedCount = $milestone->tasks()->where('status', TaskStatus::Completed->value)->count();
        $progress = $tasksCount > 0 ? (int) round(($completedCount / $tasksCount) * 100) : 0;

        ActivityLog::log(
            $team->campus_id ?? 1,
            $team->id,
            $user->id,
            'milestone_updated',
            $milestone,
            ['title' => $milestone->title, 'status' => $milestone->status]
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Sprint berhasil diperbarui.',
                'data' => [
                    'id' => $milestone->id,
                    'title' => $milestone->title,
                    'description' => $milestone->description,
                    'status' => is_object($milestone->status) ? $milestone->status->value : $milestone->status,
                    'starts_on' => $milestone->starts_on?->format('d M Y'),
                    'due_on' => $milestone->due_on?->format('d M Y'),
                    'tasks_count' => $tasksCount,
                    'completed_tasks_count' => $completedCount,
                    'progress' => $progress,
                ],
            ]);
        }

        return back()->with('success', "Sprint '{$milestone->title}' berhasil diperbarui.");
    }

    /**
     * Delete a milestone/sprint (safely unlinks associated tasks so tasks remain on the board)
     */
    public function deleteMilestone(Request $request, int $teamId, int $milestoneId)
    {
        $user = $request->user();
        $team = Team::findOrFail($teamId);
        $milestone = Milestone::where('team_id', $team->id)->findOrFail($milestoneId);

        $isClassLecturer = $team->project?->academicClass && $team->project->academicClass->isLecturer($user);
        $isLecturer = $user->isLecturer() || $isClassLecturer;
        $isLeader = $team->isLeader($user);

        if (!$isLecturer && !$isLeader) {
            abort(403, 'Hanya ketua tim atau dosen pembimbing yang dapat menghapus sprint.');
        }

        $title = $milestone->title;

        // Unlink associated tasks so tasks are preserved on the board without a milestone
        Task::where('milestone_id', $milestone->id)->update(['milestone_id' => null]);

        $milestone->delete();

        ActivityLog::log(
            $team->campus_id ?? 1,
            $team->id,
            $user->id,
            'milestone_deleted',
            null,
            ['title' => $title]
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => "Sprint '{$title}' berhasil dihapus. Tugas terkait tetap tersimpan.",
            ]);
        }

        return back()->with('success', "Sprint '{$title}' berhasil dihapus. Tugas terkait tetap tersimpan.");
    }
}