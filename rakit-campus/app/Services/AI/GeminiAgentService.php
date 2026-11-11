<?php

namespace App\Services\AI;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\CompetitionParticipation;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiAgentService
{
    /**
     * Get the Gemini API Key from configuration or environment.
     */
    protected static function apiKey(): ?string
    {
        return config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
    }

    /**
     * Get active Gemini model identifier.
     */
    protected static function model(): string
    {
        return config('services.gemini.model') ?: env('GEMINI_MODEL', 'gemini-2.5-flash');
    }

    /**
     * Call Gemini API to generate structured content.
     */
    public static function call(string $systemPrompt, string $userPrompt): ?string
    {
        $apiKey = self::apiKey();
        if (empty($apiKey)) {
            Log::warning('Gemini API key is not configured.');
            return null;
        }

        $modelsToTry = [self::model(), 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-flash-lite-latest'];
        $modelsToTry = array_unique($modelsToTry);

        foreach ($modelsToTry as $model) {
            try {
                $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

                $response = Http::timeout(25)
                    ->withHeaders(['Content-Type' => 'application/json'])
                    ->post($endpoint, [
                        'systemInstruction' => [
                            'parts' => [
                                ['text' => $systemPrompt],
                            ],
                        ],
                        'contents' => [
                            [
                                'role' => 'user',
                                'parts' => [
                                    ['text' => $userPrompt],
                                ],
                            ],
                        ],
                        'generationConfig' => [
                            'temperature' => 0.4,
                            'maxOutputTokens' => 2048,
                            'responseMimeType' => 'application/json',
                        ],
                    ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if ($text) {
                        return $text;
                    }
                } else {
                    Log::warning("Gemini API error on model [{$model}]: " . $response->body());
                }
            } catch (\Throwable $e) {
                Log::error("Gemini API invocation failed on model [{$model}]: " . $e->getMessage());
            }
        }

        return null;
    }

    /**
     * Generate structured Kanban tasks for a competition team using Gemini AI.
     */
    public static function generateKanbanTasks(CompetitionParticipation $participation, ?string $additionalFocus = null): array
    {
        $competition = $participation->competition;
        $team = $participation->team;

        $competitionName = $competition?->name ?? 'Kompetisi Mahasiswa';
        $category = $competition?->category ?? 'Technology / Hackathon';
        $level = $competition?->level ?? 'Nasional';
        $deadline = $competition?->registration_deadline ? $competition->registration_deadline->format('d M Y') : 'Mendatang';
        $requiredDocs = is_array($competition?->required_documents) ? implode(', ', $competition->required_documents) : 'Proposal, Pitch Deck';
        $stage = $participation->stage;
        $teamSize = $team?->members?->count() ?? 1;

        $existingTaskTitles = $team ? $team->tasks()->pluck('title')->take(10)->implode('; ') : '';

        $systemPrompt = "Anda adalah Lead Technical Mentor & Project Orchestrator untuk tim mahasiswa peserta kompetisi/hackathon tingkat nasional dan global. 
Tugas Anda adalah merumuskan rencana aksi konkret (Kanban tasks) yang tajam, terstruktur, realistis, dan berorientasi juara.
Output WAJIB berupa JSON dengan format:
{
  \"summary\": \"Ringkasan strategi persiapan 1-2 kalimat\",
  \"recommended_roles\": [\"Peran 1\", \"Peran 2\"],
  \"tasks\": [
    {
      \"title\": \"Judul tugas pendek dan spesifik\",
      \"description\": \"Deskripsi detail apa yang harus diselesaikan dan kriteria selesai\",
      \"priority\": \"urgent|high|medium|low\",
      \"stage\": \"todo|in_progress|in_review|completed\",
      \"estimated_days\": 3,
      \"recommended_role\": \"UI/UX Designer | Fullstack | Hustler | ML Engineer\"
    }
  ]
}";

        $userPrompt = "Kompetisi: {$competitionName}
Kategori: {$category}
Tingkat: {$level}
Batas Akhir: {$deadline}
Tahap Tim Saat Ini: {$stage}
Berkas Wajib: {$requiredDocs}
Jumlah Anggota Saat Ini: {$teamSize}
Tugas Yang Sudah Ada: " . ($existingTaskTitles ?: 'Belum ada tugas') . "
Fokus Tambahan: " . ($additionalFocus ?: 'Prioritaskan penyelesaian MVP prototype, proposal proyek, pitch deck, dan validasi riset.') . "

Buatkan antara 6 sampai 10 tugas Kanban terpenting yang harus dikerjakan tim saat ini agar siap menang.";

        $rawResponse = self::call($systemPrompt, $userPrompt);

        if ($rawResponse) {
            $parsed = json_decode($rawResponse, true);
            if (isset($parsed['tasks']) && is_array($parsed['tasks']) && count($parsed['tasks']) > 0) {
                return $parsed;
            }
        }

        // Fallback domain-specific tasks if AI service is temporarily unreachable
        return self::fallbackTasks($participation);
    }

    /**
     * Automatically populate Kanban tasks into the database under a DB transaction.
     */
    public static function applyTasksToKanban(CompetitionParticipation $participation, User $creator, ?array $tasksData = null): array
    {
        $team = $participation->team;
        if (!$team) {
            throw new \RuntimeException('Tim kompetisi tidak ditemukan.');
        }

        $data = $tasksData ?: self::generateKanbanTasks($participation);
        $tasksList = $data['tasks'] ?? [];

        $createdTasks = [];

        DB::transaction(function () use ($participation, $team, $creator, $tasksList, &$createdTasks) {
            $campusId = $participation->competition?->campus_id ?? $creator->campusId();

            foreach ($tasksList as $t) {
                $priority = match (strtolower($t['priority'] ?? 'medium')) {
                    'urgent' => TaskPriority::Urgent,
                    'high' => TaskPriority::High,
                    'low' => TaskPriority::Low,
                    default => TaskPriority::Medium,
                };

                $status = match (strtolower($t['stage'] ?? 'todo')) {
                    'in_progress' => TaskStatus::InProgress,
                    'in_review' => TaskStatus::InReview,
                    'completed' => TaskStatus::Completed,
                    default => TaskStatus::Todo,
                };

                $created = Task::create([
                    'campus_id' => $campusId,
                    'team_id' => $team->id,
                    'created_by' => $creator->id,
                    'title' => $t['title'] ?? 'Tugas Persiapan',
                    'description' => ($t['description'] ?? '') . (isset($t['recommended_role']) ? "\n\n[Rekomendasi PIC: {$t['recommended_role']}]" : ''),
                    'status' => $status,
                    'priority' => $priority,
                    'due_on' => isset($t['estimated_days']) ? now()->addDays((int)$t['estimated_days']) : null,
                ]);

                $createdTasks[] = $created;
            }
        });

        return [
            'count' => count($createdTasks),
            'tasks' => $createdTasks,
            'summary' => $data['summary'] ?? 'Tugas persiapan telah dibuat otomatis oleh AI Copilot.',
        ];
    }

    /**
     * Fallback high-quality tasks when AI is offline.
     */
    protected static function fallbackTasks(CompetitionParticipation $participation): array
    {
        $comp = $participation->competition;
        $isHackathon = str_contains(strtolower($comp?->category ?? ''), 'hackathon') || str_contains(strtolower($comp?->name ?? ''), 'hackathon');

        return [
            'summary' => 'Rencana aksi persiapan standar kompetisi untuk memastikan deliverable teknis dan dokumen tersusun tepat waktu.',
            'recommended_roles' => ['Tech Lead / Developer', 'UI/UX Designer', 'Hustler / Pitcher', 'Researcher'],
            'tasks' => [
                [
                    'title' => 'Riset Problem Statement & Validasi Kebutuhan Pengguna',
                    'description' => 'Kumpulkan data faktual, pain points pengguna sasaran, dan studi literatur yang mendukung urgensi solusi proyek.',
                    'priority' => 'high',
                    'stage' => 'todo',
                    'estimated_days' => 3,
                    'recommended_role' => 'Researcher / Hustler',
                ],
                [
                    'title' => 'Perancangan Wireframe & High-Fidelity UI/UX',
                    'description' => 'Desain arsitektur informasi, alur interaksi pengguna, dan prototipe interaktif di Figma sesuai tema lomba.',
                    'priority' => 'high',
                    'stage' => 'todo',
                    'estimated_days' => 5,
                    'recommended_role' => 'UI/UX Designer',
                ],
                [
                    'title' => 'Pengembangan Core Feature & MVP Prototype',
                    'description' => 'Implementasikan backend API dan antarmuka fungsional utama yang siap didemokan ke dewan juri.',
                    'priority' => 'urgent',
                    'stage' => 'todo',
                    'estimated_days' => 7,
                    'recommended_role' => 'Fullstack Developer',
                ],
                [
                    'title' => 'Penyusunan Executive Summary & Proposal Karya',
                    'description' => 'Tuliskan latar belakang, solusi teknologis, keunggulan kompetitif, analisis dampak, dan rencana implementasi.',
                    'priority' => 'high',
                    'stage' => 'todo',
                    'estimated_days' => 4,
                    'recommended_role' => 'Hustler / Lead',
                ],
                [
                    'title' => 'Pembuatan Slide Pitch Deck (Maks. 10-12 Slide)',
                    'description' => 'Susun presentasi singkat yang memukau: Problem, Solution, Demo, Tech Stack, Business Model, Team.',
                    'priority' => 'medium',
                    'stage' => 'todo',
                    'estimated_days' => 3,
                    'recommended_role' => 'Pitcher',
                ],
                [
                    'title' => 'Perekaman Video Demo Produk & Walkthrough',
                    'description' => 'Rekam demo live berdurasi 2-3 menit yang menunjukkan implementasi nyata solusi tanpa glitch.',
                    'priority' => 'medium',
                    'stage' => 'todo',
                    'estimated_days' => 2,
                    'recommended_role' => 'All Team',
                ],
                [
                    'title' => 'Ulasan Akhir & Validasi Kelengkapan Berkas',
                    'description' => 'Cek ulang format file, ukuran berkas, tautan repositori, dan persyaratan administrasi penyelenggara sebelum submit.',
                    'priority' => 'urgent',
                    'stage' => 'todo',
                    'estimated_days' => 1,
                    'recommended_role' => 'Team Leader',
                ],
            ],
        ];
    }
}
