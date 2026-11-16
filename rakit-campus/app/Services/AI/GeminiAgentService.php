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
    public static function generateKanbanTasks(
        CompetitionParticipation $participation,
        ?string $additionalFocus = null,
        ?string $categoryTrack = null
    ): array {
        $competition = $participation->competition;
        $team = $participation->team;

        $competitionName = $competition?->name ?? 'Kompetisi Mahasiswa';
        $category = $competition?->category;
        $category = $category instanceof \BackedEnum ? $category->value : (string) ($category ?? 'Technology / Hackathon');
        
        $level = $competition?->level;
        $level = $level instanceof \BackedEnum ? $level->value : (string) ($level ?? 'Nasional');

        $track = $categoryTrack ?: ($participation->category_track ?: $category);

        $deadline = $competition?->registration_deadline ? $competition->registration_deadline->format('d M Y') : 'Mendatang';
        $requiredDocs = is_array($competition?->required_documents) ? implode(', ', $competition->required_documents) : 'Proposal, Pitch Deck';
        
        $stage = $participation->stage;
        $stage = $stage instanceof \BackedEnum ? $stage->value : (string) ($stage ?? 'recruiting');
        
        $teamSize = $team?->members?->count() ?? 1;

        $existingTaskTitles = $team ? $team->tasks()->pluck('title')->take(10)->implode('; ') : '';

        $systemPrompt = "Anda adalah Lead Technical Mentor & Project Orchestrator untuk tim mahasiswa peserta kompetisi (PKM, Gemastik, Hackathon, KTI, Business Plan) tingkat nasional dan global. 
Tugas Anda adalah merumuskan rencana aksi konkret (Kanban tasks) yang tajam, terstruktur, realistis, dan berorientasi juara.
WAJIB DAN PRIORITAS TERTINGGI:
Sesuaikan setiap tugas secara spesifik dan mendalam dengan INSTRUKSI KHUSUS / FOKUS PROYEK yang diberikan pengguna. Jangan pernah memberikan tugas umum/generik atau template standar jika pengguna memberikan topik/arahan spesifik. Setiap judul dan deskripsi tugas harus secara eksplisit menyebutkan topik, teknologi, metodologi, fitur, atau kebutuhan deliverable yang diminta pengguna.
Output WAJIB berupa JSON murni dengan format:
{
  \"summary\": \"Ringkasan strategi persiapan 1-2 kalimat yang secara spesifik menyebut fokus tim\",
  \"recommended_roles\": [\"Peran 1\", \"Peran 2\", \"Peran 3\"],
  \"tasks\": [
    {
      \"title\": \"Judul tugas pendek dan spesifik sesuai instruksi pengguna\",
      \"description\": \"Deskripsi detail apa yang harus diselesaikan dan kriteria selesai berdasarkan fokus proyek\",
      \"priority\": \"urgent|high|medium|low\",
      \"stage\": \"todo|in_progress|in_review|completed\",
      \"estimated_days\": 3,
      \"recommended_role\": \"Contoh: UI/UX Designer | Video Editor | Peneliti | Hustler\"
    }
  ]
}";

        $userPrompt = "Kompetisi: {$competitionName}
Kategori / Jalur Bidang: {$track}
Level: {$level}
Batas Akhir: {$deadline}
Tahap Tim Saat Ini: {$stage}
Berkas Wajib: {$requiredDocs}
Jumlah Anggota Saat Ini: {$teamSize}
Tugas Yang Sudah Ada: " . ($existingTaskTitles ?: 'Belum ada tugas') . "

INSTRUKSI KHUSUS / FOKUS PEKERJAAN DARI PENGGUNA:
" . ($additionalFocus ?: 'Optimalkan karya terbaik sesuai panduan resmi lomba untuk lolos ke babak final.') . "

PERINGATAN:
Pastikan 6 sampai 8 tugas Kanban yang dihasilkan benar-benar merefleksikan instruksi khusus di atas, baik pada judul, deskripsi, maupun peran PIC yang direkomendasikan.";

        $rawResponse = self::call($systemPrompt, $userPrompt);

        if ($rawResponse) {
            $cleanJson = trim($rawResponse);
            if (preg_match('/^```(?:json)?\s*([\s\S]*?)\s*```$/i', $cleanJson, $matches)) {
                $cleanJson = trim($matches[1]);
            }
            $parsed = json_decode($cleanJson, true);
            if (isset($parsed['tasks']) && is_array($parsed['tasks']) && count($parsed['tasks']) > 0) {
                return $parsed;
            }
            Log::info("Gemini raw response could not be parsed as tasks JSON: " . substr($rawResponse, 0, 500));
        } else {
            Log::info("Gemini call returned null for Kanban task generation.");
        }

        // Fallback domain-specific tasks if AI service is temporarily unreachable
        return self::fallbackTasks($participation, $additionalFocus, $track);
    }

    /**
     * Automatically populate Kanban tasks into the database under a DB transaction.
     */
    public static function applyTasksToKanban(
        CompetitionParticipation $participation,
        User $creator,
        ?array $tasksData = null,
        ?string $additionalFocus = null,
        ?string $categoryTrack = null
    ): array {
        $team = $participation->team;
        if (!$team) {
            throw new \RuntimeException('Tim kompetisi tidak ditemukan.');
        }

        $data = $tasksData ?: self::generateKanbanTasks($participation, $additionalFocus, $categoryTrack);
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
    protected static function fallbackTasks(
        CompetitionParticipation $participation,
        ?string $additionalFocus = null,
        ?string $categoryTrack = null
    ): array {
        $focusTrimmed = trim((string) $additionalFocus);
        if (!empty($focusTrimmed)) {
            return self::buildDynamicCustomTasks($participation, $focusTrimmed, $categoryTrack);
        }

        $comp = $participation->competition;
        $compName = strtolower($comp?->name ?? '');
        $categoryStr = strtolower($comp?->category instanceof \BackedEnum ? $comp->category->value : (string) ($comp?->category ?? ''));
        $trackStr = strtolower($categoryTrack ?: ($participation->category_track ?: ''));

        $isPkm = str_contains($compName, 'pkm') || str_contains($compName, 'kreativitas mahasiswa') || str_contains($compName, 'pimnas');
        $isVgk = str_contains($trackStr, 'vgk') || str_contains($trackStr, 'video') || str_contains($compName, 'vgk');
        $isRiset = str_contains($trackStr, 're') || str_contains($trackStr, 'rsh') || str_contains($trackStr, 'riset') || str_contains($categoryStr, 'research');
        $isKewirausahaan = str_contains($trackStr, 'kewirausahaan') || str_contains($trackStr, 'pkm-k') || str_contains($categoryStr, 'business');
        $isKarsaCipta = str_contains($trackStr, 'karsa cipta') || str_contains($trackStr, 'pkm-kc') || str_contains($trackStr, 'pkm-ki');
        $isHackathon = str_contains($categoryStr, 'hackathon') || str_contains($compName, 'hackathon') || str_contains($trackStr, 'hackathon') || str_contains($compName, 'gemastik');

        // PKM-VGK (Video Gagasan Konstruktif)
        if ($isPkm && $isVgk) {
            return [
                'summary' => 'Rencana aksi persiapan PKM-VGK berfokus pada penguatan narasi isu strategis, storyboard skenario, produksi video animasi/footage berstandar PIMNAS, dan proposal Belmawa.',
                'recommended_roles' => ['Ketua Tim / Konseptor', 'Scriptwriter & Narator', 'Video Editor / Animator', 'Desainer Aset & Grafis'],
                'tasks' => [
                    [
                        'title' => 'Perumusan Isu Strategis & Gagasan Solutif Futuristik',
                        'description' => 'Tentukan topik berbasis SDGs atau isu nasional terkini' . ($additionalFocus ? " (Fokus: {$additionalFocus})" : '') . ', telaah data faktual, dan rumuskan keunikan gagasan futuristik konstruktif.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 2,
                        'recommended_role' => 'Ketua Tim / Konseptor',
                    ],
                    [
                        'title' => 'Penulisan Naskah Narasi & Skenario Cerita Video (2-4 Menit)',
                        'description' => 'Susun naskah narasi komprehensif: hook masalah di 30 detik pertama, penjelasan solusi sistemik, dan visual call-to-action sesuai panduan Simbelmawa.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 3,
                        'recommended_role' => 'Scriptwriter & Narator',
                    ],
                    [
                        'title' => 'Perancangan Storyboard & Visual Scene Direction',
                        'description' => 'Gambarkan adegan per detik (scene-by-scene), transisi, gaya visual (2D/3D/motion graphics/live footage), dan soundscape/BGM yang bebas hak cipta.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 4,
                        'recommended_role' => 'Desainer Aset & Visual',
                    ],
                    [
                        'title' => 'Produksi Animasi, Rendering Video HD, & Voiceover Narasi',
                        'description' => 'Proses pembuatan animasi, pengambilan footage video, rekaman suara narasi berartikulasi jelas, dan perakitan timeline video di software editing.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 7,
                        'recommended_role' => 'Video Editor & Animator',
                    ],
                    [
                        'title' => 'Penyusunan Living Proposal PKM Format Simbelmawa',
                        'description' => 'Tuliskan naskah proposal sesuai format baku: Pendahuluan, Gagasan, Kesimpulan, Biodata Ketua & Anggota, Justifikasi Anggaran, dan Susunan Organisasi.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 4,
                        'recommended_role' => 'Ketua Tim & Administrasi',
                    ],
                    [
                        'title' => 'Bimbingan Dosen & Validasi Lembar Pengesahan',
                        'description' => 'Konsultasikan naskah proposal dan preview video ke Dosen Pendamping untuk mendapatkan revisi dan tanda tangan lembar pengesahan resmi ber-NIDN.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 2,
                        'recommended_role' => 'Ketua Tim & Dosen Pendamping',
                    ],
                    [
                        'title' => 'Final Mastering Video, Unggah YouTube (Unlisted), & Submit Simbelmawa',
                        'description' => 'Pastikan resolusi video 1080p, sertakan subtitle Bahasa Indonesia/Inggris, unggah ke YouTube, serta periksa ukuran file proposal PDF sebelum submit ke portal.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 1,
                        'recommended_role' => 'Semua Anggota Tim',
                    ],
                ],
            ];
        }

        // PKM Riset Eksakta / Sosial Humaniora (PKM-RE / PKM-RSH)
        if ($isPkm && $isRiset) {
            return [
                'summary' => 'Rencana aksi persiapan PKM Riset difokuskan pada ketajaman tinjauan pustaka, metodologi eksperimental, validitas instrumen, dan kepatuhan format Belmawa.',
                'recommended_roles' => ['Ketua Tim / Peneliti Utama', 'Data Analyst / Laboran', 'Dokumentasi & Administrasi'],
                'tasks' => [
                    [
                        'title' => 'Studi Literatur Jurnal Terakreditasi & Gap Analisis',
                        'description' => 'Kumpulkan minimal 10 jurnal rujukan bereputasi untuk memperkuat latar belakang riset dan novelty penelitian.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 3,
                        'recommended_role' => 'Ketua Tim & Peneliti',
                    ],
                    [
                        'title' => 'Perancangan Metodologi Penelitian & Prosedur Uji',
                        'description' => 'Rumuskan tahapan penelitian, variabel kontrol, instrumen uji laboratorium/kuesioner, dan teknik analisis statistik.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 4,
                        'recommended_role' => 'Peneliti Utama',
                    ],
                    [
                        'title' => 'Penyusunan Rincian Anggaran Biaya & Jadwal Kegiatan Belmawa',
                        'description' => 'Susun justifikasi anggaran sesuai standar biaya masukan PKM (bahan habis pakai, sewa alat, perjalanan, lain-lain).',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 2,
                        'recommended_role' => 'Administrasi & Keuangan',
                    ],
                    [
                        'title' => 'Penulisan Draft Lengkap Proposal PKM Riset',
                        'description' => 'Tulis bab Pendahuluan, Tinjauan Pustaka, Metode Riset, Biaya & Jadwal, serta Daftar Pustaka format Harvard/Vancouver.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 5,
                        'recommended_role' => 'Seluruh Tim',
                    ],
                    [
                        'title' => 'Review Bersama Dosen Pendamping & Uji Kelayakan Proposal',
                        'description' => 'Lakukan asistensi intensif dengan dosen pembimbing untuk memvalidasi metodologi dan kejelasan instrumen riset.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 2,
                        'recommended_role' => 'Ketua Tim',
                    ],
                    [
                        'title' => 'Finalisasi Lembar Pengesahan & Validasi Format Simbelmawa',
                        'description' => 'Cek batas jumlah halaman (maks. 10 halaman inti), kelengkapan biodata bertanda tangan, surat pernyataan bermaterai, dan konversi ke PDF.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 1,
                        'recommended_role' => 'Semua Anggota',
                    ],
                ],
            ];
        }

        // PKM Kewirausahaan / Inovasi Produk (PKM-K / PKM-PI)
        if ($isPkm && $isKewirausahaan) {
            return [
                'summary' => 'Rencana aksi PKM Kewirausahaan berfokus pada validasi pasar sasaran, pembuatan sampel produk & kemasan, proyeksi keuangan (BEP, B/C), dan strategi komersialisasi.',
                'recommended_roles' => ['Hustler / CEO Tim', 'Product Designer / Maker', 'Finance & Operations'],
                'tasks' => [
                    [
                        'title' => 'Riset Pasar & Validasi Masalah Konsumen Sasaran',
                        'description' => 'Lakukan survei kebutuhan pasar untuk membuktikan adanya peluang nyata dan keunggulan komparatif produk dibanding kompetitor.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 3,
                        'recommended_role' => 'Hustler / Lead',
                    ],
                    [
                        'title' => 'Pembuatan Prototipe Sampel Produk & Desain Kemasan',
                        'description' => 'Rancang identitas brand, kemasan ramah lingkungan, dan prototipe fisik produk yang siap diproduksi massal.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 5,
                        'recommended_role' => 'Product Designer',
                    ],
                    [
                        'title' => 'Analisis Kelayakan Finansial & Proyeksi Laba Rugi',
                        'description' => 'Hitung Harga Pokok Produksi (HPP), Break-Even Point (BEP), rasio B/C, dan proyeksi arus kas operasional selama 4-6 bulan.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 3,
                        'recommended_role' => 'Finance Specialist',
                    ],
                    [
                        'title' => 'Penyusunan Proposal PKM-K Sesuai Pedoman Belmawa',
                        'description' => 'Susun bab Pendahuluan, Gambaran Umum Rencana Usaha, Metode Pelaksanaan, Biaya & Jadwal, dan Lampiran wajib.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 4,
                        'recommended_role' => 'Seluruh Tim',
                    ],
                    [
                        'title' => 'Asistensi Dosen Pembimbing & Kelengkapan Administrasi',
                        'description' => 'Dapatkan arahan dosen pendamping, surat pernyataan orisinalitas bermaterai, dan biodata ketua/anggota.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 2,
                        'recommended_role' => 'Ketua Tim',
                    ],
                    [
                        'title' => 'Final Review Berkas & Unggah ke Portal Simbelmawa',
                        'description' => 'Validasi format margin kertas, ukuran font, penomoran halaman Romawi & Arab, serta kelayakan dokumen PDF sebelum submit.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 1,
                        'recommended_role' => 'Ketua Tim',
                    ],
                ],
            ];
        }

        // PKM Umum Lainnya (GFT, AI, KC)
        if ($isPkm) {
            return [
                'summary' => 'Rencana aksi persiapan Program Kreativitas Mahasiswa (PKM) standar nasional menuju PIMNAS: proposal, metodologi, dan berkas administrasi.',
                'recommended_roles' => ['Ketua Tim', 'Anggota Teknis/Riset', 'Dokumentasi & Administrasi'],
                'tasks' => [
                    [
                        'title' => 'Pemantapan Topik & Novelty Gagasan PKM',
                        'description' => 'Pastikan topik memiliki kebaruan ilmiah/teknologis dan menjawab permasalahan nyata masyarakat atau industri.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 2,
                        'recommended_role' => 'Ketua Tim',
                    ],
                    [
                        'title' => 'Studi Kepustakaan & Perumusan Metode Pelaksanaan',
                        'description' => 'Susun alur metodologi atau perancangan karya secara sistematis dari awal hingga evaluasi ketercapaian program.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 3,
                        'recommended_role' => 'Anggota Riset',
                    ],
                    [
                        'title' => 'Penyusunan Naskah Proposal Format Resmi Belmawa',
                        'description' => 'Tuliskan seluruh isi naskah sesuai buku panduan PKM tahun berjalan tanpa melanggar batasan halaman.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 4,
                        'recommended_role' => 'Seluruh Tim',
                    ],
                    [
                        'title' => 'Bimbingan Proposal Bersama Dosen Pendamping',
                        'description' => 'Konsultasikan draf proposal, perbaiki masukan substansi, dan peroleh persetujuan dosen pembimbing.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 2,
                        'recommended_role' => 'Ketua Tim & Dosen',
                    ],
                    [
                        'title' => 'Pemeriksaan Kepatuhan Administrasi & Format Simbelmawa',
                        'description' => 'Verifikasi format penamaan file, kelengkapan tanda tangan, surat pernyataan, dan ukuran file PDF sebelum submit.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 1,
                        'recommended_role' => 'Semua Anggota',
                    ],
                ],
            ];
        }

        // Hackathon & Gemastik / App Development
        if ($isHackathon) {
            return [
                'summary' => 'Rencana aksi persiapan kompetisi teknologi & hackathon untuk membangun MVP fungsional, UI/UX memukau, dan pitch deck berorientasi dewan juri.',
                'recommended_roles' => ['Tech Lead / Developer', 'UI/UX Designer', 'Hustler / Pitcher'],
                'tasks' => [
                    [
                        'title' => 'Validasi Problem Statement & Arsitektur Solusi',
                        'description' => 'Definisikan pain points pengguna sasaran dan rancang arsitektur teknis sistem yang realistis dikerjakan.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 2,
                        'recommended_role' => 'Semua Anggota',
                    ],
                    [
                        'title' => 'Perancangan High-Fidelity UI/UX & Flow Interaktif',
                        'description' => 'Buat desain antarmuka modern di Figma dengan komponen interaktif yang siap diimplementasikan dan didemokan.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 3,
                        'recommended_role' => 'UI/UX Designer',
                    ],
                    [
                        'title' => 'Pengembangan Core MVP Feature & Backend Integration',
                        'description' => 'Kembangkan fitur inti aplikasi, integrasi API, dan pastikan aplikasi dapat berjalan lancar tanpa error kritis.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 6,
                        'recommended_role' => 'Fullstack Developer',
                    ],
                    [
                        'title' => 'Penyusunan Proposal Teknis / Executive Summary',
                        'description' => 'Tuliskan deskripsi solusi, keunggulan teknologi, analisis dampak, dan rencana skalabilitas sistem.',
                        'priority' => 'high',
                        'stage' => 'todo',
                        'estimated_days' => 3,
                        'recommended_role' => 'Hustler / Lead',
                    ],
                    [
                        'title' => 'Pembuatan Pitch Deck Presentasi (Maks. 10 Slide)',
                        'description' => 'Susun slide presentasi singkat yang memikat: Problem, Solution, Live Demo, Tech Stack, Business Value, Team.',
                        'priority' => 'medium',
                        'stage' => 'todo',
                        'estimated_days' => 2,
                        'recommended_role' => 'Pitcher',
                    ],
                    [
                        'title' => 'Perekaman Video Demo Produk & Walkthrough (2-3 Menit)',
                        'description' => 'Rekam demo live berdurasi singkat yang menunjukkan implementasi nyata solusi tanpa kendala teknis.',
                        'priority' => 'medium',
                        'stage' => 'todo',
                        'estimated_days' => 2,
                        'recommended_role' => 'All Team',
                    ],
                    [
                        'title' => 'Review Akhir & Validasi Kelengkapan Submission',
                        'description' => 'Cek ulang repositori GitHub, deployment live URL, format berkas proposal, dan persyaratan panitia sebelum submit.',
                        'priority' => 'urgent',
                        'stage' => 'todo',
                        'estimated_days' => 1,
                        'recommended_role' => 'Team Leader',
                    ],
                ],
            ];
        }

        // Standar / Kategori Umum
        return [
            'summary' => 'Rencana aksi persiapan standar kompetisi untuk memastikan deliverable teknis dan dokumen tersusun tepat waktu.',
            'recommended_roles' => ['Ketua Tim', 'Spesialis Konten / Teknis', 'Presenter / Pitcher', 'Administrasi'],
            'tasks' => [
                [
                    'title' => 'Riset Problem Statement & Validasi Kebutuhan Sasaran',
                    'description' => 'Kumpulkan data faktual, pain points pengguna sasaran, dan studi literatur yang mendukung urgensi solusi proyek.',
                    'priority' => 'high',
                    'stage' => 'todo',
                    'estimated_days' => 3,
                    'recommended_role' => 'Riset & Konseptor',
                ],
                [
                    'title' => 'Penyusunan Kerangka Karya & Prototipe Solusi',
                    'description' => 'Rancang kerangka karya utama, purwarupa produk/dokumen, dan langkah-langkah implementasi terukur.',
                    'priority' => 'urgent',
                    'stage' => 'todo',
                    'estimated_days' => 5,
                    'recommended_role' => 'Spesialis Teknis',
                ],
                [
                    'title' => 'Penulisan Proposal / Naskah Karya Lengkap',
                    'description' => 'Tuliskan latar belakang, solusi inovatif, keunggulan kompetitif, analisis dampak, dan rencana implementasi.',
                    'priority' => 'high',
                    'stage' => 'todo',
                    'estimated_days' => 4,
                    'recommended_role' => 'Ketua Tim',
                ],
                [
                    'title' => 'Pembuatan Slide Presentasi & Media Pendukung',
                    'description' => 'Susun presentasi visual yang memukau dan ringkas untuk kebutuhan pitching atau seleksi berkas.',
                    'priority' => 'medium',
                    'stage' => 'todo',
                    'estimated_days' => 3,
                    'recommended_role' => 'Presenter',
                ],
                [
                    'title' => 'Ulasan Bersama Dosen Pembimbing & Validasi Final',
                    'description' => 'Cek ulang format file, kelengkapan berkas pendukung, dan persyaratan administrasi penyelenggara sebelum submit.',
                    'priority' => 'urgent',
                    'stage' => 'todo',
                    'estimated_days' => 1,
                    'recommended_role' => 'Semua Anggota',
                ],
            ],
        ];
    }

    /**
     * Dynamically synthesize high-quality contextual Kanban tasks based on user's custom instructions.
     */
    protected static function buildDynamicCustomTasks(
        CompetitionParticipation $participation,
        string $focus,
        ?string $categoryTrack = null
    ): array {
        $comp = $participation->competition;
        $compName = $comp?->name ?? 'Kompetisi Mahasiswa';
        $track = $categoryTrack ?: ($participation->category_track ?: ($comp?->category instanceof \BackedEnum ? $comp->category->value : (string) ($comp?->category ?? 'Inovasi')));
        $lower = strtolower($focus);
        $shortFocus = \Illuminate\Support\Str::limit($focus, 65, '...');

        // Detect domain & roles
        if (str_contains($lower, 'smart contract') || str_contains($lower, 'blockchain') || str_contains($lower, 'web3') || str_contains($lower, 'crypto') || str_contains($lower, 'token')) {
            $roles = ['Smart Contract Engineer', 'Fullstack Web3 Developer', 'Security Auditor & Tester', 'Ketua Tim'];
            $devTask = 'Pengembangan Smart Contract & Modul Interaksi Web3';
            $devDesc = "Kembangkan kode kontrak pintar, implementasikan mekanisme keamanan, dan integrasikan wallet connect untuk: {$focus}.";
            $testTask = 'Audit Keamanan Smart Contract & Pengujian Unit Test';
            $testDesc = "Lakukan automated test suite, fuzzing, dan audit simulasi vulnerability pada modul: {$shortFocus}.";
            $rolePIC = 'Smart Contract Engineer';
        } elseif (str_contains($lower, 'video') || str_contains($lower, 'animasi') || str_contains($lower, 'film') || str_contains($lower, 'sinematik') || str_contains($lower, 'visual')) {
            $roles = ['Konseptor & Scriptwriter', 'Video Editor / Animator', 'Desainer Grafis & Audio', 'Ketua Tim'];
            $devTask = 'Produksi Aset Visual, Animasi & Rekaman Footage Utama';
            $devDesc = "Rakit visual scene-by-scene, animasi grafis, dan footage pendukung yang merefleksikan gagasan: {$focus}.";
            $testTask = 'Editing Audio-Visual, Motion Graphic, & Color Grading';
            $testDesc = "Lakukan kompilasi timeline video, mixing narasi berartikulasi jelas, soundscape, dan subtitle untuk topik: {$shortFocus}.";
            $rolePIC = 'Video Editor / Animator';
        } elseif (str_contains($lower, 'iot') || str_contains($lower, 'robot') || str_contains($lower, 'sensor') || str_contains($lower, 'hardware') || str_contains($lower, 'perangkat keras') || str_contains($lower, 'arduino') || str_contains($lower, 'esp32')) {
            $roles = ['Embedded Systems Engineer', 'Hardware Architect', 'Cloud IoT & Mobile Specialist', 'Ketua Tim'];
            $devTask = 'Perakitan Hardware, Integrasi Sensor & Firmware Programming';
            $devDesc = "Rakit modul mikrokontroler, kalibrasi sensor fisik, dan implementasikan protokol komunikasi data untuk: {$focus}.";
            $testTask = 'Pengujian Lapangan, Kalibrasi Sensor & Analisis Latensi';
            $testDesc = "Uji ketahanan alat secara continuous run, evaluasi konsumsi daya, dan pastikan pengiriman data stabil pada prototype: {$shortFocus}.";
            $rolePIC = 'Embedded Systems Engineer';
        } elseif (str_contains($lower, 'riset') || str_contains($lower, 'ekstrak') || str_contains($lower, 'uji') || str_contains($lower, 'senyawa') || str_contains($lower, 'laboratorium') || str_contains($lower, 'karya ilmiah') || str_contains($lower, 'penelitian')) {
            $roles = ['Peneliti Utama', 'Laboran & Data Analyst', 'Dokumentasi & Administrasi Ilmiah', 'Ketua Tim'];
            $devTask = 'Eksperimen Laboratorium & Pengumpulan Data Empiris';
            $devDesc = "Laksanakan prosedur uji, preparasi sampel, dan catat parameter data hasil observasi sesuai metodologi penelitian: {$focus}.";
            $testTask = 'Analisis Statistik, Pengolahan Data & Validasi Hasil Uji';
            $testDesc = "Olah data eksperimen dengan perangkat lunak statistik, bandingkan dengan literatur pembanding, dan rumuskan temuan novelty riset: {$shortFocus}.";
            $rolePIC = 'Laboran & Data Analyst';
        } elseif (str_contains($lower, 'aplikasi') || str_contains($lower, 'mobile') || str_contains($lower, 'web') || str_contains($lower, 'software') || str_contains($lower, 'flutter') || str_contains($lower, 'system') || str_contains($lower, 'sistem') || str_contains($lower, 'ai') || str_contains($lower, 'machine learning')) {
            $roles = ['Lead Developer', 'UI/UX Specialist', 'Backend/Cloud Engineer', 'Ketua Tim'];
            $devTask = 'Pengembangan Fitur Inti & Integrasi Sistem Solusi';
            $devDesc = "Tuliskan kode program, implementasikan arsitektur database/API, dan bangun logika sistem untuk: {$focus}.";
            $testTask = 'Pengujian Kualitas Software (QA), Usability & Uji Beban';
            $testDesc = "Lakukan functional testing, verifikasi alur user experience tanpa bug, dan optimasi performa modul: {$shortFocus}.";
            $rolePIC = 'Lead Developer';
        } elseif (str_contains($lower, 'bisnis') || str_contains($lower, 'umkm') || str_contains($lower, 'pasar') || str_contains($lower, 'startup') || str_contains($lower, 'produk') || str_contains($lower, 'keuangan') || str_contains($lower, 'pemasaran')) {
            $roles = ['Business Strategist / CEO', 'Product & Brand Designer', 'Finance & Operation Lead', 'Ketua Tim'];
            $devTask = 'Pembuatan Prototipe Produk & Strategi Go-To-Market';
            $devDesc = "Susun identitas produk, sample fungsional, kemasan, dan saluran distribusi pemasaran untuk: {$focus}.";
            $testTask = 'Validasi Pasar Sasaran & Proyeksi Finansial (BEP/NPV)';
            $testDesc = "Uji respon calon konsumen potensial, hitung proyeksi arus kas, margin keuntungan, dan titik impas usaha untuk: {$shortFocus}.";
            $rolePIC = 'Business Strategist / CEO';
        } else {
            $roles = ['Ketua Tim / Konseptor', 'Spesialis Teknis & Deliverable', 'Dokumentasi & Presentasi', 'Anggota Tim'];
            $devTask = "Eksekusi Teknis & Pembuatan Solusi Utama ({$shortFocus})";
            $devDesc = "Realisasikan purwarupa atau karya utama sesuai arahan instruksi spesifik: {$focus}.";
            $testTask = "Validasi Kinerja Karya & Uji Coba Ketercapaian Target";
            $testDesc = "Evaluasi hasil karya terhadap kriteria penilaian juri dan kebutuhan pengguna sasaran untuk: {$shortFocus}.";
            $rolePIC = 'Spesialis Teknis & Deliverable';
        }

        return [
            'summary' => "Rencana aksi terarah berfokus pada: {$focus} untuk memaksimalkan peluang lolos dan berprestasi pada {$compName}.",
            'recommended_roles' => $roles,
            'tasks' => [
                [
                    'title' => "Perumusan Gagasan & Spesifikasi Solusi: {$shortFocus}",
                    'description' => "Bedah latar belakang masalah, identifikasi data pendukung, dan rumuskan batasan spesifikasi solusi yang tajam untuk fokus: {$focus}.",
                    'priority' => 'urgent',
                    'stage' => 'todo',
                    'estimated_days' => 2,
                    'recommended_role' => $roles[0] ?? 'Ketua Tim',
                ],
                [
                    'title' => "Perancangan Blueprint / Desain / Metodologi Solusi",
                    'description' => "Susun rancangan detail konsep, alur kerja sistem, diagram alir/storyboard, dan kebutuhan resource untuk merealisasikan: {$shortFocus}.",
                    'priority' => 'high',
                    'stage' => 'todo',
                    'estimated_days' => 3,
                    'recommended_role' => $roles[1] ?? 'Spesialis Teknis',
                ],
                [
                    'title' => $devTask,
                    'description' => $devDesc,
                    'priority' => 'urgent',
                    'stage' => 'todo',
                    'estimated_days' => 6,
                    'recommended_role' => $rolePIC,
                ],
                [
                    'title' => $testTask,
                    'description' => $testDesc,
                    'priority' => 'high',
                    'stage' => 'todo',
                    'estimated_days' => 3,
                    'recommended_role' => $roles[2] ?? 'Quality Assurance / Tester',
                ],
                [
                    'title' => "Penyusunan Living Proposal & Berkas Resmi {$track}",
                    'description' => "Dokumentasikan seluruh deskripsi solusi, keunggulan karya, justifikasi anggaran, dan profil tim sesuai template resmi {$compName}.",
                    'priority' => 'urgent',
                    'stage' => 'todo',
                    'estimated_days' => 4,
                    'recommended_role' => 'Ketua Tim & Administrasi',
                ],
                [
                    'title' => "Bimbingan Bersama Dosen Pendamping & Validasi Substansi",
                    'description' => "Konsultasikan kemajuan karya dan proposal dengan dosen pembimbing untuk memperoleh review akademis serta pengesahan berkas.",
                    'priority' => 'urgent',
                    'stage' => 'todo',
                    'estimated_days' => 2,
                    'recommended_role' => 'Ketua Tim & Dosen Pembimbing',
                ],
                [
                    'title' => "Finalisasi Pitch Deck / Video Demo & Submit ke Portal Resmi",
                    'description' => "Sempurnakan materi presentasi, rekam video penjelasan/demo karya singkat berorientasi dewan juri, periksa syarat berkas, lalu submit sebelum tenggat.",
                    'priority' => 'urgent',
                    'stage' => 'todo',
                    'estimated_days' => 1,
                    'recommended_role' => 'Semua Anggota Tim',
                ],
            ],
        ];
    }
}
