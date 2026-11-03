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
                  ->orWhereHas('project.academicClass', fn ($ac) => $ac->where('lecturer_id', $user->id));
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
            $isClassLecturer = $team->project?->academicClass && $team->project->academicClass->lecturer_id === $user->id;

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

    public function show(Request $request, int $teamId): Response
    {
        $user = $request->user();
        $team = Team::with([
            'project.academicClass.lecturer:id,name,email',
            'participations.competition',
            'members.user:id,name,email',
            'milestones.tasks',
            'posts.author:id,name',
        ])->findOrFail($teamId);

        $isClassLecturer = $team->project?->academicClass && $team->project->academicClass->lecturer_id === $user->id;
        $isLecturer = $user->isLecturer() || $isClassLecturer;

        // If not a lecturer and not a member, verify authorization
        if (! $isLecturer) {
            $this->authorize('view', $team);
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
            'priority' => ['required', 'string'],
            'assignee_id' => ['nullable', 'exists:users,id'],
            'milestone_id' => ['nullable', 'exists:milestones,id'],
            'status' => ['required', 'string'],
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
            'status' => ['sometimes', 'string'],
            'priority' => ['sometimes', 'string'],
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
}