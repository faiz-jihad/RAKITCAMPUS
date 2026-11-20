<?php

namespace App\Services\AI;

use App\Models\AiArtifact;
use App\Models\AiMessage;
use App\Models\AiSession;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiWorkspaceService
{
    protected static function apiKey(): ?string
    {
        return config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
    }

    protected static function model(): string
    {
        return config('services.gemini.model') ?: env('GEMINI_MODEL', 'gemini-2.5-flash');
    }

    /**
     * Send a message in a session. Maintains full conversation history.
     * Returns the assistant reply string or null on failure.
     */
    public function sendMessage(AiSession $session, string $userMessage, ?string $fileContent = null): ?string
    {
        $apiKey = self::apiKey();
        if (empty($apiKey)) {
            Log::warning('AI Workspace: Gemini API key not configured.');
            return null;
        }

        // Refresh live context from team workspace
        if ($session->team) {
            try {
                $liveContext = $this->buildContextData($session->team, $session->project_id, $session->competition_id);
                $session->context_data = array_merge($session->context_data ?? [], $liveContext);
                $session->save();
            } catch (\Throwable $e) {
                Log::warning('Failed refreshing AI session live context: ' . $e->getMessage());
            }
        }

        // Build conversation history
        $history = $session->messages()->get();
        $contents = [];

        foreach ($history as $msg) {
            if ($msg->role === 'system') continue;
            $contents[] = [
                'role' => $msg->role === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg->content]],
            ];
        }

        // Append new user message
        $userContent = $userMessage;
        if ($fileContent) {
            $userContent .= "\n\n--- Konten File yang Diunggah ---\n" . $fileContent;
        }
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userContent]],
        ];

        // Build system prompt based on assistant type
        $systemPrompt = $this->buildSystemPrompt($session);

        // Save user message first
        AiMessage::create([
            'session_id' => $session->id,
            'role' => 'user',
            'content' => $userContent,
        ]);

        // Call AI Provider (Llama or Gemini)
        $reply = $this->callAiProvider($systemPrompt, $contents, $session);

        if ($reply) {
            // Save assistant reply
            AiMessage::create([
                'session_id' => $session->id,
                'role' => 'assistant',
                'content' => $reply,
                'model_used' => self::model(),
            ]);

            // Auto-generate title for new sessions
            if ($session->messages()->count() <= 2 && !$session->title) {
                $session->title = $this->generateTitle($userMessage);
                $session->save();
            }
        }

        return $reply;
    }

    /**
     * Build context-aware system prompt per assistant type.
     */
    protected function buildSystemPrompt(AiSession $session): string
    {
        $teamName = $session->team->name ?? 'Tim Anda';
        $base = "Anda adalah RAKIT AI — asisten cerdas untuk platform RAKIT Campus yang membantu tim mahasiswa Indonesia dalam proyek akademik dan kompetisi.\n";
        $base .= "Tim aktif: {$teamName}.\n";
        $base .= "Selalu jawab dalam Bahasa Indonesia kecuali user menggunakan bahasa lain.\n";
        $base .= "Berikan jawaban yang spesifik, actionable, dan berbasis data nyata yang ada di ruang kerja tim — hindari generalisasi kosong.\n\n";

        $agenticInstructions = "KEMAMPUAN AGENTIC EXECUTION:
Ketika Anda menyarankan pembagian tugas, rencana aksi sprint, checklist lomba, atau draf bagian proposal, sertakan SATU blok JSON tindakan terstruktur di akhir respon Anda agar pengguna dapat langsung menerapkannya ke Workspace hanya dengan 1 klik:
```json:action
{
  \"type\": \"create_tasks\",
  \"title\": \"Terapkan Tugas ke Papan Kanban\",
  \"payload\": {
    \"tasks\": [
      { \"title\": \"Judul Tugas\", \"description\": \"Deskripsi singkat kriteria selesai\", \"priority\": \"high|medium|low\", \"recommended_role\": \"Role\" }
    ]
  }
}
```
Atau jika menyarankan Sprint baru:
```json:action
{
  \"type\": \"create_sprint\",
  \"title\": \"Buat Sprint Baru di Roadmap\",
  \"payload\": {
    \"title\": \"Sprint 1: ...\",
    \"description\": \"Fokus dan sasaran sprint\",
    \"status\": \"planned\",
    \"estimated_days\": 14
  }
}
```
Pastikan blok JSON valid dan diletakkan di akhir respon.";

        $base .= $agenticInstructions . "\n\n";

        // Build Structured Live State Report
        $ctx = $session->context_data ?? [];
        $liveReport = "==================================================\n";
        $liveReport .= "DATA NYATA WORKSPACE TIM (LIVE STATE):\n";
        $liveReport .= "==================================================\n";
        $liveReport .= "Nama Tim: " . ($ctx['team_name'] ?? $teamName) . "\n";

        if (!empty($ctx['team_members'])) {
            $liveReport .= "Anggota Tim:\n";
            foreach ($ctx['team_members'] as $m) {
                $liveReport .= "• " . ($m['name'] ?? 'Mahasiswa') . " (" . ($m['role'] ?? 'Member') . ")\n";
            }
        }

        if (!empty($ctx['competition'])) {
            $c = $ctx['competition'];
            $liveReport .= "\n--- KOMPETISI AKTIF ---\n";
            $liveReport .= "Nama: {$c['name']}\n";
            if (!empty($c['organizer'])) $liveReport .= "Penyelenggara: {$c['organizer']}\n";
            if (!empty($c['category'])) $liveReport .= "Kategori: {$c['category']}\n";
            if (!empty($c['level'])) $liveReport .= "Tingkat: {$c['level']}\n";
            if (!empty($c['deadline'])) $liveReport .= "Batas Pendaftaran: {$c['deadline']}\n";
            if (!empty($c['current_stage'])) $liveReport .= "Tahap Saat Ini: {$c['current_stage']}\n";
            if (isset($c['progress_percent'])) $liveReport .= "Kesiapan Berkas & Tugas: {$c['progress_percent']}%\n";
            if (!empty($c['required_documents'])) {
                $docs = is_array($c['required_documents']) ? implode(', ', $c['required_documents']) : $c['required_documents'];
                $liveReport .= "Dokumen/Berkas yang Wajib Disiapkan: {$docs}\n";
            }
            if (!empty($c['eligibility'])) $liveReport .= "Persyaratan Peserta: " . substr($c['eligibility'], 0, 300) . "\n";
            if (!empty($c['description'])) $liveReport .= "Deskripsi / Petunjuk Lomba: " . substr($c['description'], 0, 400) . "\n";
        }

        if (!empty($ctx['sprints']) || !empty($ctx['tasks'])) {
            $liveReport .= "\n--- SPRINT & PAPAN KANBAN (PROGRES TUGAS AKTIF) ---\n";
            if (!empty($ctx['sprints'])) {
                $liveReport .= "Milestone / Sprint Terdaftar:\n";
                foreach ($ctx['sprints'] as $s) {
                    $due = !empty($s['due_date']) ? " (Target: {$s['due_date']})" : "";
                    $liveReport .= "• [{$s['status']}] {$s['title']}{$due}\n";
                }
            }
            if (!empty($ctx['tasks'])) {
                $t = $ctx['tasks'];
                $liveReport .= "Ringkasan Beban Kanban: {$t['total']} Total | {$t['in_progress_count']} In Progress | {$t['review_count']} Review | {$t['todo_count']} Todo | {$t['completed_count']} Selesai\n";
                if (!empty($t['list'])) {
                    $liveReport .= "Daftar Tugas Terkini:\n";
                    foreach ($t['list'] as $task) {
                        $due = !empty($task['due_on']) ? ", Deadline: {$task['due_on']}" : "";
                        $liveReport .= "• [{$task['status']}] {$task['title']} (PJ: {$task['assignee']}, Prioritas: {$task['priority']}{$due})\n";
                    }
                }
            }
        }

        if (!empty($ctx['cloud_documents'])) {
            $liveReport .= "\n--- DOKUMEN & LAPORAN DI CLOUD TIM ---\n";
            foreach ($ctx['cloud_documents'] as $doc) {
                $liveReport .= "• Berkas: {$doc['name']} (Tipe: {$doc['type']}, Versi: {$doc['version']}, Diunggah oleh: {$doc['uploader']} pada {$doc['submitted_at']})\n";
            }
        }

        if (!empty($ctx['living_proposal'])) {
            $p = $ctx['living_proposal'];
            $liveReport .= "\n--- DOKUMEN LIVING PROPOSAL (DRAFT LAPORAN TIM AKTIF) ---\n";
            if (!empty($p['title'])) $liveReport .= "Judul: {$p['title']} (Status: {$p['status']}, Versi {$p['version']})\n";
            if (!empty($p['abstract'])) $liveReport .= "Abstrak / Executive Summary:\n{$p['abstract']}\n\n";
            if (!empty($p['problem_statement'])) $liveReport .= "Rumusan Masalah (Problem Statement):\n{$p['problem_statement']}\n\n";
            if (!empty($p['objectives'])) $liveReport .= "Tujuan Proyek (Objectives):\n{$p['objectives']}\n\n";
            if (!empty($p['proposed_solution'])) $liveReport .= "Solusi yang Ditawarkan:\n{$p['proposed_solution']}\n\n";
            if (!empty($p['target_users'])) $liveReport .= "Target Pengguna:\n{$p['target_users']}\n\n";
            if (!empty($p['needs_analysis'])) $liveReport .= "Analisis Kebutuhan:\n{$p['needs_analysis']}\n\n";
            if (!empty($p['system_architecture'])) $liveReport .= "Arsitektur Sistem:\n{$p['system_architecture']}\n\n";
            if (!empty($p['methodology'])) $liveReport .= "Metodologi Kerja:\n{$p['methodology']}\n\n";
            if (!empty($p['timeline_plan'])) $liveReport .= "Rencana Timeline:\n{$p['timeline_plan']}\n\n";
            if (!empty($p['tech_stack'])) $liveReport .= "Tech Stack: {$p['tech_stack']}\n";
        }
        $liveReport .= "==================================================\n\n";

        return match ($session->assistant_type) {
            'project' => $base . $liveReport . "Spesialisasi: AI Project Assistant.\n" .
                "Gunakan data di atas untuk menganalisis dan membimbing pengembangan proyek tim secara nyata. " .
                "Bantu tim menyempurnakan solusi, arsitektur, dan problem statement.",

            'competition' => $base . $liveReport . "Spesialisasi: Competition Assistant.\n" .
                "Tugasmu: Evaluasi kesiapan tim menghadapi kompetisi aktif di atas. " .
                "Periksa apakah berkas di cloud dan tugas kanban sudah memenuhi kriteria dan deadline lomba. Berikan strategi pemenangan yang konkret.",

            'team' => $base . $liveReport . "Spesialisasi: Sprint & Team Assistant.\n" .
                "Tugasmu: Analisis progres sprint dan papan kanban tim di atas. " .
                "Identifikasi tugas mana yang tertunda, anggota mana yang butuh dukungan, dan rekomendasikan tugas konkret selanjutnya.",

            'document' => $base . $liveReport . "Spesialisasi: Document Reviewer.\n" .
                "Tugasmu: Tinjau berkas yang ada di 'DOKUMEN & LAPORAN DI CLOUD TIM' dan 'DOKUMEN LIVING PROPOSAL'. " .
                "Beri masukan kritis terhadap abstrak, rumusan masalah, dan kelengkapan dokumen sesuai standar kompetisi/akademik.",

            default => $base . $liveReport . "Bantu tim dengan pertanyaan seputar proyek, kompetisi, dan pengembangan akademik berbasis data nyata di atas.",
        };
    }

    /**
     * Route request to configured AI Provider (Gemini or Llama Inference API).
     */
    protected function callAiProvider(string $systemPrompt, array $geminiContents, AiSession $session): ?string
    {
        $provider = env('AI_PROVIDER', 'gemini');
        $llamaKey = env('LLAMA_API_KEY');

        if ($provider === 'llama' || !empty($llamaKey)) {
            $llamaReply = $this->callLlama($systemPrompt, $session);
            if ($llamaReply) {
                return $llamaReply;
            }
        }

        return $this->callGemini($systemPrompt, $geminiContents);
    }

    /**
     * Call Llama API via OpenAI-compatible endpoint.
     */
    protected function callLlama(string $systemPrompt, AiSession $session): ?string
    {
        $apiKey = env('LLAMA_API_KEY');
        if (empty($apiKey)) return null;

        $baseUrl = rtrim(env('LLAMA_API_BASE_URL', 'https://api.groq.com/openai/v1'), '/');
        $model = env('LLAMA_MODEL', 'llama-3.3-70b-versatile');

        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
        ];

        foreach ($session->messages()->get() as $msg) {
            $messages[] = [
                'role' => $msg->role === 'assistant' ? 'assistant' : 'user',
                'content' => $msg->content,
            ];
        }

        try {
            $response = Http::timeout(60)
                ->withToken($apiKey)
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => $messages,
                    'temperature' => 0.5,
                    'max_tokens' => 4096,
                ]);

            if ($response->successful()) {
                $json = $response->json();
                return $json['choices'][0]['message']['content'] ?? null;
            } else {
                Log::warning("AI Workspace Llama API error: " . $response->body());
            }
        } catch (\Throwable $e) {
            Log::error("AI Workspace Llama call failed: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Call Gemini API with multi-turn conversation history.
     */
    protected function callGemini(string $systemPrompt, array $contents): ?string
    {
        $apiKey = self::apiKey();
        $modelsToTry = [self::model(), 'gemini-2.5-flash', 'gemini-flash-latest'];
        $modelsToTry = array_unique($modelsToTry);

        foreach ($modelsToTry as $model) {
            try {
                $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

                $response = Http::timeout(60)
                    ->withHeaders(['Content-Type' => 'application/json'])
                    ->post($endpoint, [
                        'systemInstruction' => [
                            'parts' => [['text' => $systemPrompt]],
                        ],
                        'contents' => $contents,
                        'generationConfig' => [
                            'temperature' => 0.5,
                            'maxOutputTokens' => 4096,
                        ],
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($text) {
                        return $text;
                    }
                } else {
                    Log::warning("AI Workspace Gemini error [{$model}]: " . $response->body());
                }
            } catch (\Throwable $e) {
                Log::error("AI Workspace Gemini call failed [{$model}]: " . $e->getMessage());
            }
        }

        return null;
    }

    /**
     * Generate a short title from user's first message.
     */
    protected function generateTitle(string $firstMessage): string
    {
        $words = explode(' ', $firstMessage);
        $short = implode(' ', array_slice($words, 0, 8));
        return strlen($short) > 60 ? substr($short, 0, 57) . '...' : $short;
    }

    /**
     * Build rich context data for a session from team/project/competition/tasks/cloud documents.
     */
    public function buildContextData(Team $team, ?int $projectId = null, ?int $competitionId = null): array
    {
        $context = [
            'team_id' => $team->id,
            'team_name' => $team->name,
            'team_members' => $team->members()->with('user:id,name')->get()
                ->map(fn($m) => [
                    'name' => $m->user?->name ?? 'Mahasiswa',
                    'role' => $m->role_name ?? (is_object($m->permission) ? $m->permission->value : (string) $m->permission),
                ])
                ->toArray(),
        ];

        // 1. Sprints & Milestones
        $context['sprints'] = $team->milestones()->get()->map(function ($m) {
            return [
                'id' => $m->id,
                'title' => $m->title,
                'status' => is_object($m->status) ? $m->status->value : (string) $m->status,
                'due_date' => $m->due_date?->format('d M Y'),
                'description' => $m->description,
            ];
        })->toArray();

        // 2. Real Kanban Tasks
        $tasks = $team->tasks()->with(['assignee:id,name', 'milestone:id,title'])->latest()->limit(50)->get();
        $context['tasks'] = [
            'total' => $tasks->count(),
            'todo_count' => $tasks->filter(fn($t) => in_array(is_object($t->status) ? $t->status->value : (string) $t->status, ['todo', 'backlog']))->count(),
            'in_progress_count' => $tasks->filter(fn($t) => (is_object($t->status) ? $t->status->value : (string) $t->status) === 'in_progress')->count(),
            'review_count' => $tasks->filter(fn($t) => (is_object($t->status) ? $t->status->value : (string) $t->status) === 'review')->count(),
            'completed_count' => $tasks->filter(fn($t) => (is_object($t->status) ? $t->status->value : (string) $t->status) === 'completed')->count(),
            'list' => $tasks->take(30)->map(function ($t) {
                return [
                    'id' => $t->id,
                    'title' => $t->title,
                    'status' => is_object($t->status) ? $t->status->value : (string) $t->status,
                    'priority' => is_object($t->priority) ? $t->priority->value : (string) $t->priority,
                    'assignee' => $t->assignee?->name ?? 'Belum Ditugaskan',
                    'milestone' => $t->milestone?->title ?? 'Umum',
                    'due_on' => $t->due_on?->format('d M Y'),
                ];
            })->toArray(),
        ];

        // 3. Competition Participation & Cloud Documents
        $participationQuery = $team->participations()->with('competition');
        if ($competitionId) {
            $participationQuery->where('competition_id', $competitionId);
        }
        $participation = $participationQuery->latest()->first();

        if ($participation && $participation->competition) {
            $comp = $participation->competition;
            $context['competition'] = [
                'id' => $comp->id,
                'name' => $comp->name,
                'organizer' => $comp->organizer,
                'category' => is_object($comp->category) ? $comp->category->value : (string) $comp->category,
                'level' => is_object($comp->level) ? $comp->level->value : (string) $comp->level,
                'description' => $comp->description,
                'deadline' => $comp->registration_deadline?->format('d M Y H:i'),
                'eligibility' => $comp->eligibility,
                'required_documents' => $comp->required_documents ?? [],
                'prize_info' => $comp->prize_info,
                'current_stage' => is_object($participation->stage) ? $participation->stage->value : (string) $participation->stage,
                'progress_percent' => $participation->calculatePreparationProgress(),
            ];

            // Real team documents uploaded to cloud
            $context['cloud_documents'] = $participation->documents()->with('uploader:id,name')->get()->map(function ($d) {
                return [
                    'id' => $d->id,
                    'name' => $d->name ?? $d->title ?? 'Berkas Lomba',
                    'type' => $d->required_document_key ?? 'general',
                    'file_url' => $d->file_url,
                    'version' => $d->version ?? 1,
                    'uploader' => $d->uploader?->name ?? 'Anggota Tim',
                    'submitted_at' => $d->submitted_at?->format('d M Y H:i') ?? $d->created_at?->format('d M Y H:i'),
                ];
            })->toArray();
        }

        // 4. Project & Living Proposal Drafts
        $project = $projectId ? ($team->project ?? null) : $team->project;
        if ($project) {
            $context['project'] = [
                'id' => $project->id,
                'title' => $project->title,
                'status' => is_object($project->status) ? $project->status->value : (string) $project->status,
                'category' => is_object($project->category) ? $project->category->value : (string) $project->category,
                'short_description' => $project->short_description,
            ];

            $proposal = \App\Models\ProjectProposal::where('project_id', $project->id)
                ->with('currentVersion')
                ->first();

            if ($proposal && $proposal->currentVersion) {
                $ver = $proposal->currentVersion;
                $context['living_proposal'] = [
                    'version' => $ver->version_number,
                    'status' => $proposal->status,
                    'title' => $ver->title,
                    'abstract' => $ver->abstract,
                    'problem_statement' => $ver->problem_statement,
                    'objectives' => $ver->objectives,
                    'proposed_solution' => $ver->proposed_solution,
                    'target_users' => $ver->target_users,
                    'needs_analysis' => $ver->needs_analysis,
                    'system_architecture' => $ver->system_architecture,
                    'methodology' => $ver->methodology,
                    'timeline_plan' => $ver->timeline_plan,
                    'tech_stack' => is_array($ver->tech_stack) ? implode(', ', $ver->tech_stack) : $ver->tech_stack,
                ];
            }
        }

        return $context;
    }
}
