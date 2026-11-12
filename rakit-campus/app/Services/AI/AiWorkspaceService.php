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
        $base .= "Berikan jawaban yang spesifik, actionable, dan berbasis data nyata — hindari generalisasi kosong.\n\n";

        return match ($session->assistant_type) {
            'project' => $base . "Spesialisasi: AI Project Assistant.\n" .
                "Bantu tim dalam: brainstorming ide proyek, identifikasi masalah, background research, problem statement, tujuan proyek, solusi teknis, metodologi, roadmap pengembangan, analisis kelayakan, dan saran perbaikan dokumentasi proposal.\n" .
                "Jika ada konteks proyek aktif, gunakan informasi tersebut. Jangan memodifikasi data proyek langsung — hanya berikan rekomendasi.\n" .
                "Konteks proyek saat ini: " . json_encode($session->context_data ?? []),

            'competition' => $base . "Spesialisasi: Competition Assistant.\n" .
                "Bantu tim dalam: menemukan kompetisi relevan, menganalisis persyaratan lomba, menjelaskan kriteria kelayakan, checklist pendaftaran, strategi persiapan, dan menghubungkan kebutuhan lomba dengan proyek RAKIT yang ada.\n" .
                "PENTING: Jangan pernah mengarang deadline, link pendaftaran, persyaratan eligibilitas, atau hasil lomba. Jika tidak yakin, sampaikan secara jelas keterbatasannya.\n" .
                "Data kompetisi tersedia di RAKIT Competition Hub. Gunakan data nyata dari platform.\n" .
                "Konteks kompetisi: " . json_encode($session->context_data ?? []),

            'team' => $base . "Spesialisasi: Team Assistant.\n" .
                "Bantu tim dalam: rekomendasi distribusi peran, alokasi tugas, identifikasi bottleneck, ringkasan kemajuan, saran milestone, pekerjaan yang terlambat, dan peningkatan kolaborasi.\n" .
                "PENTING: Kamu boleh merekomendasikan perubahan tugas/peran, tetapi JANGAN PERNAH memodifikasi data tugas, anggota, deadline, atau data sensitif lainnya tanpa konfirmasi eksplisit pengguna.\n" .
                "Data tim aktif: " . json_encode($session->context_data ?? []),

            'document' => $base . "Spesialisasi: Document Reviewer.\n" .
                "Tugasmu adalah meninjau dokumen: proposal, abstrak, laporan proyek, submission kompetisi, file PDF/DOCX.\n" .
                "Berikan:\n" .
                "1. Ringkasan Review\n2. Kekuatan Dokumen\n3. Kelemahan / Gap\n4. Bagian yang Hilang\n5. Rekomendasi Revisi Spesifik\n6. Evaluasi Berbasis Rubrik (jika rubrik tersedia)\n\n" .
                "Jangan memberikan skor arbitrer atau mengklaim dokumen memenuhi standar kompetisi tanpa bukti nyata.\n" .
                "Evaluasi berdasarkan kriteria aktual yang ada, bukan asumsi.\n" .
                "Konteks dokumen: " . json_encode($session->context_data ?? []),

            default => $base . "Bantu tim dengan pertanyaan seputar proyek, kompetisi, dan pengembangan akademik.",
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
     * Build context data for a session from team/project/competition.
     */
    public function buildContextData(Team $team, ?int $projectId = null, ?int $competitionId = null): array
    {
        $context = [
            'team_id' => $team->id,
            'team_name' => $team->name,
            'team_members' => $team->members()->with('user:id,name')->get()
                ->map(fn($m) => ['name' => $m->user->name, 'role' => $m->role ?? 'member'])
                ->toArray(),
        ];

        if ($projectId) {
            $project = $team->project ?? null;
            if ($project) {
                $context['project'] = [
                    'id' => $project->id,
                    'title' => $project->title,
                    'status' => $project->status?->value ?? $project->status,
                    'category' => $project->category?->value ?? $project->category,
                    'short_description' => $project->short_description,
                ];
            }
        }

        if ($competitionId) {
            $participation = $team->participations()
                ->with('competition:id,name,category,level,registration_deadline,required_documents')
                ->where('competition_id', $competitionId)
                ->first();
            if ($participation) {
                $comp = $participation->competition;
                $context['competition'] = [
                    'id' => $comp->id,
                    'name' => $comp->name,
                    'category' => $comp->category?->value ?? $comp->category,
                    'level' => $comp->level?->value ?? $comp->level ?? null,
                    'deadline' => $comp->registration_deadline?->format('d M Y'),
                    'required_docs' => $comp->required_documents,
                    'stage' => $participation->stage?->value ?? $participation->stage,
                ];
            }
        }

        return $context;
    }
}
