<?php

namespace App\Services;

use App\Enums\MilestoneStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\ActivityLog;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ProjectOrchestratorAgent
{
    /**
     * Generate or update full sprint roadmap and delegated Kanban tasks for a team.
     * Can be invoked when a team becomes full or triggered manually by leader/lecturer.
     */
    public function orchestrateRoadmapAndTasks(Team $team, ?User $triggeredBy = null): array
    {
        return DB::transaction(function () use ($team, $triggeredBy) {
            $project = $team->project;
            $actorId = $triggeredBy?->id ?? $team->leader_id;
            $campusId = $team->campus_id;

            // Load members and their profiles with skills
            $members = $team->members()->with(['user.profile.skills'])->get();
            if ($members->isEmpty()) {
                return ['success' => false, 'message' => 'Tim belum memiliki anggota untuk didelegasikan tugas.'];
            }

            // 1. Define 4 Realistic Sprint Milestones (Roadmap Timeline)
            $sprintsDefinition = [
                [
                    'title' => 'Sprint 1: Analisis Kebutuhan & Desain Arsitektur Sistem',
                    'description' => 'Pemetaan spesifikasi kebutuhan fungsional (SRS), perancangan Entity Relationship Diagram (ERD), dan sketsa wireframe awal.',
                    'start_offset_weeks' => 0,
                    'due_offset_weeks' => 2,
                    'status' => 'in_progress',
                    'tasks' => [
                        [
                            'title' => 'Penyusunan Software Requirement Specification (SRS) & User Stories',
                            'description' => 'Dokumentasikan alur pengguna utama, batasan sistem, dan acceptance criteria per modul fungsional.',
                            'priority' => TaskPriority::High->value,
                            'skill_affinity' => ['product', 'management', 'analisis', 'scrum', 'document'],
                        ],
                        [
                            'title' => 'Perancangan Skema Basis Data Relasional (ERD) & Struktur Tabel',
                            'description' => 'Buat diagram entitas relasi, tentukan primary & foreign keys, serta lakukan normalisasi tabel 3NF.',
                            'priority' => TaskPriority::High->value,
                            'skill_affinity' => ['database', 'mysql', 'postgresql', 'backend', 'laravel', 'sql'],
                        ],
                    ],
                ],
                [
                    'title' => 'Sprint 2: Pengembangan Fondasi UI/UX & Desain Basis Data',
                    'description' => 'Slicing prototipe antarmuka pengguna, pembuatan migrasi tabel database, dan setup repositori kolaboratif.',
                    'start_offset_weeks' => 2,
                    'due_offset_weeks' => 5,
                    'status' => 'planned',
                    'tasks' => [
                        [
                            'title' => 'Desain Prototipe UI/UX High-Fidelity & Design System',
                            'description' => 'Rancang antarmuka interaktif di Figma mencakup tipografi, color palette, responsive layout, dan komponen UI utama.',
                            'priority' => TaskPriority::Medium->value,
                            'skill_affinity' => ['figma', 'ui/ux', 'design', 'frontend', 'tailwind'],
                        ],
                        [
                            'title' => 'Setup Repositori Proyek, Konvensi Git & Struktur Folder Awal',
                            'description' => 'Inisiasi version control Git, cabang development, pre-commit hooks, dan standardisasi arsitektur kode.',
                            'priority' => TaskPriority::High->value,
                            'skill_affinity' => ['git', 'docker', 'devops', 'backend', 'laravel'],
                        ],
                        [
                            'title' => 'Implementasi File Migrasi Database & Seeder Data Uji',
                            'description' => 'Tulis file migrasi skema tabel dan siapkan dummy data awal untuk pengujian lokal.',
                            'priority' => TaskPriority::Medium->value,
                            'skill_affinity' => ['laravel', 'database', 'mysql', 'postgresql', 'backend'],
                        ],
                    ],
                ],
                [
                    'title' => 'Sprint 3: Implementasi Fitur Utama, REST API & Logika Bisnis',
                    'description' => 'Pengembangan modul inti, integrasi endpoint REST API, manajemen otentikasi peran, dan pengolahan data transaksi.',
                    'start_offset_weeks' => 5,
                    'due_offset_weeks' => 8,
                    'status' => 'planned',
                    'tasks' => [
                        [
                            'title' => 'Implementasi RESTful API & Sistem Autentikasi Pengguna',
                            'description' => 'Bangun endpoint otentikasi token/sesi aman, role-based permission check, dan controller logika bisnis utama.',
                            'priority' => TaskPriority::Urgent->value,
                            'skill_affinity' => ['laravel', 'backend', 'api', 'fastapi', 'golang', 'node.js'],
                        ],
                        [
                            'title' => 'Pengembangan Antarmuka Interaktif Pengguna & Integrasi State',
                            'description' => 'Slicing halaman utama, formulir input dinamis, integrasi pemanggilan API, dan feedback penanganan error.',
                            'priority' => TaskPriority::Urgent->value,
                            'skill_affinity' => ['react', 'flutter', 'typescript', 'frontend', 'mobile'],
                        ],
                        [
                            'title' => 'Integrasi Fitur Utama & Validasi Logika Bisnis',
                            'description' => 'Hubungkan alur antar halaman, validasi formulir sisi klien & server, serta sinkronisasi data real-time.',
                            'priority' => TaskPriority::High->value,
                            'skill_affinity' => ['fullstack', 'react', 'flutter', 'laravel'],
                        ],
                    ],
                ],
                [
                    'title' => 'Sprint 4: Pengujian Komprehensif, Review Dosen & Deployment',
                    'description' => 'Audit keamanan sistem, pengujian end-to-end, presentasi progres bimbingan dosen, dan peluncuran produk ke server produksi.',
                    'start_offset_weeks' => 8,
                    'due_offset_weeks' => 10,
                    'status' => 'planned',
                    'tasks' => [
                        [
                            'title' => 'Pengujian Fungsional, Unit Test & Uji Beban Sistem',
                            'description' => 'Jalankan test cases skenario positif dan negatif, perbaiki bug kritis, dan pastikan tidak ada kebocoran memori.',
                            'priority' => TaskPriority::High->value,
                            'skill_affinity' => ['qa', 'testing', 'quality', 'tester', 'security'],
                        ],
                        [
                            'title' => 'Penyusunan Dokumentasi Proyek & Laporan Bimbingan Dosen',
                            'description' => 'Susun petunjuk instalasi, dokumentasi API, dan rekapitulasi progres untuk ditinjau dosen pengampu kelas.',
                            'priority' => TaskPriority::Medium->value,
                            'skill_affinity' => ['document', 'management', 'scrum', 'academic'],
                        ],
                        [
                            'title' => 'Konfigurasi Server Produksi, Domain & Deployment Live',
                            'description' => 'Lakukan deployment ke server VPS/Cloud, setup SSL/HTTPS, konfigurasi Nginx/Web Server, dan optimasi performa.',
                            'priority' => TaskPriority::Urgent->value,
                            'skill_affinity' => ['devops', 'docker', 'linux', 'cloud', 'backend'],
                        ],
                    ],
                ],
            ];

            $createdMilestonesCount = 0;
            $createdTasksCount = 0;
            $now = Carbon::now();

            $memberPool = $members->values();
            $memberIndex = 0;

            foreach ($sprintsDefinition as $sprintData) {
                // Find or create milestone
                $milestone = Milestone::firstOrCreate(
                    [
                        'team_id' => $team->id,
                        'title' => $sprintData['title'],
                    ],
                    [
                        'campus_id' => $campusId,
                        'created_by' => $actorId,
                        'description' => $sprintData['description'],
                        'starts_on' => $now->copy()->addWeeks($sprintData['start_offset_weeks']),
                        'due_on' => $now->copy()->addWeeks($sprintData['due_offset_weeks']),
                        'status' => $sprintData['status'],
                    ]
                );
                $createdMilestonesCount++;

                // Create Tasks for this sprint
                foreach ($sprintData['tasks'] as $taskDef) {
                    // Check if task with exact title already exists in this team
                    $existingTask = Task::where('team_id', $team->id)
                        ->where('title', $taskDef['title'])
                        ->first();

                    if (! $existingTask) {
                        // Smart Match Assignee based on Member Skills
                        $assignedMember = $this->matchBestMemberForTask($memberPool, $taskDef['skill_affinity']);
                        if (! $assignedMember) {
                            $assignedMember = $memberPool[$memberIndex % $memberPool->count()];
                            $memberIndex++;
                        }

                        $maxPos = Task::where('team_id', $team->id)
                            ->where('status', TaskStatus::Todo->value)
                            ->max('position') ?? 0;

                        Task::create([
                            'campus_id' => $campusId,
                            'team_id' => $team->id,
                            'milestone_id' => $milestone->id,
                            'created_by' => $actorId,
                            'assignee_id' => $assignedMember->user_id,
                            'title' => $taskDef['title'],
                            'description' => $taskDef['description'],
                            'priority' => $taskDef['priority'],
                            'status' => TaskStatus::Todo->value,
                            'due_on' => $milestone->due_on,
                            'position' => $maxPos + 1,
                        ]);
                        $createdTasksCount++;
                    }
                }
            }

            // Update Project Lifecycle if still in drafting/recruiting
            if ($project && in_array($project->status, [ProjectStatus::Draft, ProjectStatus::Recruiting, ProjectStatus::TeamFormation])) {
                $project->update([
                    'status' => ProjectStatus::InProgress,
                    'starts_on' => $now,
                    'target_completion_on' => $now->copy()->addWeeks(10),
                ]);
            }

            // Calculate current project progress
            $totalTasks = Task::where('team_id', $team->id)->count();
            $doneTasks = Task::where('team_id', $team->id)->where('status', TaskStatus::Completed->value)->count();
            $progress = $totalTasks > 0 ? (int) round(($doneTasks / $totalTasks) * 100) : 0;

            if ($project) {
                $project->update(['progress' => $progress]);
            }

            // Log activity
            ActivityLog::log(
                $campusId,
                $team->id,
                $actorId,
                'ai_roadmap_orchestrated',
                $team,
                [
                    'milestones_count' => $createdMilestonesCount,
                    'tasks_count' => $createdTasksCount,
                    'message' => "AI Agent telah menyusun Roadmap {$createdMilestonesCount} Sprint dan mendelegasikan {$createdTasksCount} tugas Kanban.",
                ]
            );

            return [
                'success' => true,
                'milestones_count' => $createdMilestonesCount,
                'tasks_count' => $createdTasksCount,
                'message' => "Roadmap {$createdMilestonesCount} Sprint dan {$createdTasksCount} tugas Kanban berhasil di-generate secara cerdas!",
            ];
        });
    }

    /**
     * Match the most suitable member from the team based on technical skill keywords.
     */
    protected function matchBestMemberForTask(Collection $members, array $affinityKeywords)
    {
        $bestMember = null;
        $highestMatch = -1;

        foreach ($members as $member) {
            $score = 0;
            $userSkills = $member->user?->profile?->skills ?? collect();
            $roleName = strtolower($member->role_name ?? '');

            foreach ($affinityKeywords as $keyword) {
                $kw = strtolower($keyword);
                if (str_contains($roleName, $kw)) {
                    $score += 3;
                }
                foreach ($userSkills as $sk) {
                    if (str_contains(strtolower($sk->name), $kw)) {
                        $score += 2;
                    }
                }
            }

            if ($score > $highestMatch) {
                $highestMatch = $score;
                $bestMember = $member;
            }
        }

        return $highestMatch > 0 ? $bestMember : null;
    }
}