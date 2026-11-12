<?php

namespace App\Http\Controllers\Web;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\AiArtifact;
use App\Models\AiSession;
use App\Models\Milestone;
use App\Models\Task;
use App\Models\Team;
use App\Services\AI\AiWorkspaceService;
use App\Services\AI\TeamAiQuotaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AiWorkspaceController extends Controller
{
    public function __construct(
        protected AiWorkspaceService $aiService,
        protected TeamAiQuotaService $quotaService,
    ) {}

    /**
     * Main AI Workspace page — renders with team context.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $teamId = $request->get('team_id');
        $assistantType = $request->get('assistant', 'project');
        $sessionId = $request->get('session_id');

        // Get user's teams
        $teams = Team::where(function ($q) use ($user) {
            $q->where('leader_id', $user->id)
              ->orWhereHas('members', fn($m) => $m->where('user_id', $user->id));
        })->with([
            'project:id,title,slug,status,category',
            'participations.competition:id,name,slug',
            'members:id,team_id,user_id,role_name',
        ])->latest()->get();

        $activeTeam = null;
        if ($teamId) {
            $activeTeam = $teams->find($teamId);
        }
        if (!$activeTeam && $teams->count()) {
            $activeTeam = $teams->first();
        }

        // Get quota info
        $quotaInfo = $activeTeam ? $this->quotaService->getQuotaInfo($activeTeam) : null;

        // Get sessions for this team
        $sessions = [];
        if ($activeTeam) {
            $sessionsQuery = AiSession::where('team_id', $activeTeam->id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id) // own sessions
                      ->orWhere('session_type', 'shared'); // or shared sessions
                })
                ->orderByDesc('updated_at')
                ->limit(30);

            $sessions = $sessionsQuery->get()->map(fn($s) => [
                'id' => $s->id,
                'title' => $s->title ?? 'Percakapan Baru',
                'assistant_type' => $s->assistant_type,
                'session_type' => $s->session_type,
                'updated_at' => $s->updated_at->toIso8601String(),
                'is_own' => $s->user_id === $user->id,
            ])->toArray();
        }

        // Get active session messages
        $activeSession = null;
        $messages = [];
        if ($sessionId && $activeTeam) {
            $session = AiSession::where('id', $sessionId)
                ->where('team_id', $activeTeam->id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)->orWhere('session_type', 'shared');
                })
                ->first();

            if ($session) {
                $activeSession = [
                    'id' => $session->id,
                    'title' => $session->title ?? 'Percakapan Baru',
                    'assistant_type' => $session->assistant_type,
                    'session_type' => $session->session_type,
                    'is_own' => $session->user_id === $user->id,
                ];
                $messages = $session->messages()->get()->map(fn($m) => [
                    'id' => $m->id,
                    'role' => $m->role,
                    'content' => $m->content,
                    'created_at' => $m->created_at->toIso8601String(),
                ])->toArray();
            }
        }

        return Inertia::render('ai-workspace/index', [
            'teams' => $teams->map(fn($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'type' => $t->type?->value ?? 'project',
                'project' => $t->project ? ['id' => $t->project->id, 'title' => $t->project->title, 'slug' => $t->project->slug] : null,
                'competitions' => $t->participations->map(fn($p) => [
                    'id' => $p->competition->id,
                    'name' => $p->competition->name,
                    'slug' => $p->competition->slug,
                ])->toArray(),
            ])->toArray(),
            'activeTeam' => $activeTeam ? [
                'id' => $activeTeam->id,
                'name' => $activeTeam->name,
                'type' => $activeTeam->type?->value ?? 'project',
                'project' => $activeTeam->project ? ['id' => $activeTeam->project->id, 'title' => $activeTeam->project->title, 'slug' => $activeTeam->project->slug] : null,
                'competitions' => $activeTeam->participations->map(fn($p) => [
                    'id' => $p->competition->id,
                    'name' => $p->competition->name,
                    'slug' => $p->competition->slug,
                ])->toArray(),
                'members' => $activeTeam->members->map(fn($m) => ['id' => $m->user_id, 'role' => $m->role_name ?? 'member'])->toArray(),
            ] : null,
            'quotaInfo' => $quotaInfo,
            'sessions' => $sessions,
            'activeSession' => $activeSession,
            'messages' => $messages,
            'assistantType' => $assistantType,
        ]);
    }

    /**
     * Create a new AI session (consumes quota).
     */
    public function createSession(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'team_id' => 'required|integer',
            'assistant_type' => 'required|in:project,competition,team,document',
            'session_type' => 'in:private,shared,project_linked',
            'project_id' => 'nullable|integer',
            'competition_id' => 'nullable|integer',
        ]);

        // Verify team membership
        $team = Team::where('id', $validated['team_id'])
            ->where(function ($q) use ($user) {
                $q->where('leader_id', $user->id)
                  ->orWhereHas('members', fn($m) => $m->where('user_id', $user->id));
            })->firstOrFail();

        // Reserve quota (atomic, with idempotency key)
        $idempotencyKey = Str::uuid()->toString();
        $reserved = $this->quotaService->reserveQuota($team, $idempotencyKey);

        if (!$reserved) {
            return back()->withErrors(['quota' => 'Kuota AI tim sudah habis. Quota akan reset setelah periode berakhir.']);
        }

        try {
            // Build context data
            $contextData = $this->aiService->buildContextData(
                $team,
                $validated['project_id'] ?? null,
                $validated['competition_id'] ?? null
            );

            $session = AiSession::create([
                'team_id' => $team->id,
                'user_id' => $user->id,
                'assistant_type' => $validated['assistant_type'],
                'session_type' => $validated['session_type'] ?? 'private',
                'project_id' => $validated['project_id'] ?? null,
                'competition_id' => $validated['competition_id'] ?? null,
                'context_data' => $contextData,
                'title' => null,
                'is_active' => true,
            ]);

            return redirect()->route('ai.index', [
                'team_id' => $team->id,
                'assistant' => $validated['assistant_type'],
                'session_id' => $session->id,
            ]);
        } catch (\Throwable $e) {
            // Release quota on failure
            $this->quotaService->releaseQuota($team, $idempotencyKey);
            Log::error("AI Workspace: failed to create session: " . $e->getMessage());
            return back()->withErrors(['error' => 'Gagal membuat sesi AI. Silakan coba lagi.']);
        }
    }

    /**
     * Send a message in an existing session.
     */
    public function sendMessage(Request $request, int $sessionId)
    {
        $user = $request->user();
        $validated = $request->validate([
            'message' => 'required|string|max:8000',
            'file_content' => 'nullable|string|max:200000',
        ]);

        $session = AiSession::where('id', $sessionId)
            ->whereHas('team', function ($q) use ($user) {
                $q->where('leader_id', $user->id)
                  ->orWhereHas('members', fn($m) => $m->where('user_id', $user->id));
            })
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)->orWhere('session_type', 'shared');
            })
            ->firstOrFail();

        $reply = $this->aiService->sendMessage($session, $validated['message'], $validated['file_content'] ?? null);

        if (!$reply) {
            return response()->json(['error' => 'AI tidak dapat merespons saat ini. Pastikan API key Gemini sudah dikonfigurasi.'], 503);
        }

        $session->touch(); // Update updated_at

        return response()->json([
            'reply' => $reply,
            'session_title' => $session->fresh()->title,
        ]);
    }

    /**
     * Delete a session (owner only).
     */
    public function deleteSession(Request $request, int $sessionId)
    {
        $user = $request->user();
        $session = AiSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $session->delete();

        return redirect()->route('ai.index', ['team_id' => $session->team_id]);
    }

    /**
     * Share a session with the team.
     */
    public function shareSession(Request $request, int $sessionId)
    {
        $user = $request->user();
        $session = AiSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $session->update(['session_type' => 'shared']);

        return response()->json(['success' => true, 'session_type' => 'shared']);
    }

    /**
     * Save an AI artifact (output) explicitly.
     */
    public function saveArtifact(Request $request, int $sessionId)
    {
        $user = $request->user();
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'artifact_type' => 'in:document,checklist,roadmap,review,summary',
            'save_to_project' => 'boolean',
        ]);

        $session = AiSession::where('id', $sessionId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $artifact = AiArtifact::create([
            'session_id' => $session->id,
            'user_id' => $user->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'artifact_type' => $validated['artifact_type'] ?? 'document',
            'is_saved_to_project' => $validated['save_to_project'] ?? false,
            'project_id' => $session->project_id,
        ]);

        return response()->json(['success' => true, 'artifact_id' => $artifact->id]);
    }

    /**
     * Execute an agentic action on behalf of user into active workspace.
     */
    public function executeAction(Request $request, int $sessionId)
    {
        $user = $request->user();
        $validated = $request->validate([
            'action_type' => 'required|string|in:create_tasks,create_sprint,save_to_proposal,create_checklist',
            'payload' => 'required|array',
        ]);

        $session = AiSession::with(['team', 'project'])->where('id', $sessionId)
            ->whereHas('team', function ($q) use ($user) {
                $q->where('leader_id', $user->id)
                  ->orWhereHas('members', fn($m) => $m->where('user_id', $user->id));
            })->firstOrFail();

        $team = $session->team;
        $campusId = $team->campus_id ?? $user->campusId() ?? 1;

        return DB::transaction(function () use ($session, $team, $user, $campusId, $validated) {
            $type = $validated['action_type'];
            $payload = $validated['payload'];

            if ($type === 'create_tasks') {
                $tasksData = $payload['tasks'] ?? [];
                if (empty($tasksData) && !empty($payload['title'])) {
                    $tasksData = [$payload];
                }

                $created = [];
                $maxPos = Task::where('team_id', $team->id)->where('status', 'todo')->max('position') ?? 0;

                foreach ($tasksData as $idx => $t) {
                    $priority = match (strtolower($t['priority'] ?? 'medium')) {
                        'urgent' => TaskPriority::Urgent,
                        'high' => TaskPriority::High,
                        'low' => TaskPriority::Low,
                        default => TaskPriority::Medium,
                    };

                    $roleSuffix = !empty($t['recommended_role']) ? "\n\n[Rekomendasi PIC: {$t['recommended_role']}]" : '';

                    $created[] = Task::create([
                        'campus_id' => $campusId,
                        'team_id' => $team->id,
                        'created_by' => $user->id,
                        'title' => $t['title'] ?? 'Tugas Baru dari AI',
                        'description' => ($t['description'] ?? '') . $roleSuffix,
                        'priority' => $priority,
                        'status' => TaskStatus::Todo,
                        'position' => $maxPos + $idx + 1,
                        'due_on' => !empty($t['estimated_days']) ? now()->addDays((int) $t['estimated_days']) : null,
                    ]);
                }

                // Recalculate project progress
                $total = Task::where('team_id', $team->id)->count();
                $done = Task::where('team_id', $team->id)->where('status', TaskStatus::Completed->value)->count();
                $percent = $total > 0 ? (int) round(($done / $total) * 100) : 0;
                $team->project?->update(['progress' => $percent]);

                return response()->json([
                    'success' => true,
                    'message' => count($created) . ' tugas berhasil diterapkan ke Kanban Tim!',
                    'count' => count($created),
                    'action_type' => 'create_tasks',
                ]);
            }

            if ($type === 'create_sprint') {
                $title = $payload['title'] ?? 'Sprint Baru dari AI';
                $desc = $payload['description'] ?? null;
                $days = (int) ($payload['estimated_days'] ?? 14);

                $milestone = Milestone::create([
                    'campus_id' => $campusId,
                    'team_id' => $team->id,
                    'created_by' => $user->id,
                    'title' => $title,
                    'description' => $desc,
                    'status' => 'planned',
                    'starts_on' => now(),
                    'due_on' => now()->addDays($days),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "Sprint '{$milestone->title}' berhasil dibuat di Workspace Tim!",
                    'milestone_id' => $milestone->id,
                    'action_type' => 'create_sprint',
                ]);
            }

            if ($type === 'save_to_proposal' || $type === 'create_checklist') {
                $title = $payload['title'] ?? ($type === 'create_checklist' ? 'Checklist Persiapan AI' : 'Draf Bagian Proposal AI');
                $content = $payload['content'] ?? json_encode($payload);

                $artifact = AiArtifact::create([
                    'session_id' => $session->id,
                    'user_id' => $user->id,
                    'title' => $title,
                    'content' => is_string($content) ? $content : json_encode($content, JSON_PRETTY_PRINT),
                    'artifact_type' => $type === 'create_checklist' ? 'checklist' : 'document',
                    'is_saved_to_project' => true,
                    'project_id' => $session->project_id,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => "Berhasil disimpan sebagai artefak proyek!",
                    'artifact_id' => $artifact->id,
                    'action_type' => $type,
                ]);
            }

            return response()->json(['error' => 'Jenis aksi tidak didukung.'], 422);
        });
    }

    /**
     * Get quota info for a team.
     */
    public function getQuota(Request $request, int $teamId)
    {
        $user = $request->user();
        $team = Team::where('id', $teamId)
            ->where(function ($q) use ($user) {
                $q->where('leader_id', $user->id)
                  ->orWhereHas('members', fn($m) => $m->where('user_id', $user->id));
            })->firstOrFail();

        return response()->json($this->quotaService->getQuotaInfo($team));
    }

    /**
     * AI History page — all sessions for user.
     */
    public function history(Request $request): Response
    {
        $user = $request->user();

        $sessions = AiSession::where('user_id', $user->id)
            ->with('team:id,name')
            ->orderByDesc('updated_at')
            ->paginate(20);

        return Inertia::render('ai-workspace/history', [
            'sessions' => $sessions->map(fn($s) => [
                'id' => $s->id,
                'title' => $s->title ?? 'Percakapan Baru',
                'assistant_type' => $s->assistant_type,
                'session_type' => $s->session_type,
                'team_name' => $s->team->name ?? '-',
                'team_id' => $s->team_id,
                'updated_at' => $s->updated_at->toIso8601String(),
            ])->toArray(),
        ]);
    }
}
