<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearNonUserDataCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'data:clear-non-user {--force : Force execution without interactive prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all non-user data (competitions, projects, teams, classes, tasks, logs) while strictly preserving user accounts and profiles.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        // Tables that belong to users and foundational entities that must NEVER be deleted
        $preserveTables = [
            'users',
            'student_profiles',
            'student_skills',
            'skills',
            'campuses',
            'campus_memberships',
            'portfolio_items',
            'sessions',
            'password_reset_tokens',
            'personal_access_tokens',
            'notifications',
            'notification_preferences',
            'migrations',
        ];

        $driver = DB::getDriverName();
        $allTables = [];

        if ($driver === 'mysql') {
            $dbName = DB::getDatabaseName();
            $rows = DB::select('SHOW TABLES');
            $colName = 'Tables_in_' . $dbName;
            foreach ($rows as $row) {
                if (isset($row->$colName)) {
                    $allTables[] = $row->$colName;
                } else {
                    $arr = (array)$row;
                    $allTables[] = reset($arr);
                }
            }
        } elseif ($driver === 'sqlite') {
            $rows = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            foreach ($rows as $row) {
                $allTables[] = $row->name;
            }
        } else {
            $allTables = [
                'competition_stage_logs',
                'competition_deliverables',
                'competition_rounds',
                'competition_results',
                'competition_documents',
                'competition_participations',
                'competition_sources',
                'competition_skills',
                'competitions',
                'invitations',
                'applications',
                'recruitment_roles',
                'recruitments',
                'team_members',
                'teams',
                'academic_assessments',
                'class_final_submissions',
                'academic_class_guidances',
                'academic_class_lecturers',
                'academic_class_students',
                'matching_audit_logs',
                'matching_allocations',
                'matching_sessions',
                'project_supervisors',
                'academic_classes',
                'proposal_comments',
                'proposal_versions',
                'living_proposals',
                'task_assignees',
                'tasks',
                'project_skills',
                'contribution_records',
                'projects',
                'achievements',
                'bookmarks',
                'activity_logs',
                'notification_delivery_logs',
            ];
        }

        $tablesToClear = array_values(array_diff($allTables, $preserveTables));

        $this->info("==================================================");
        $this->info("      RAKIT CAMPUS: DATA PURGE (USER ONLY)        ");
        $this->info("==================================================");

        $this->line("<fg=green;options=bold>Preserved User Tables:</>");
        foreach ($preserveTables as $table) {
            if (Schema::hasTable($table)) {
                $count = DB::table($table)->count();
                $this->line("  ✓ <fg=cyan>{$table}</> ({$count} rows preserved)");
            }
        }

        $this->newLine();
        $this->line("<fg=yellow;options=bold>Tables To Be Wiped (" . count($tablesToClear) . " tables):</>");
        foreach ($tablesToClear as $table) {
            if (Schema::hasTable($table)) {
                $count = DB::table($table)->count();
                $this->line("  - <fg=red>{$table}</> ({$count} rows)");
            }
        }
        $this->newLine();

        if (!$this->option('force')) {
            if (!$this->confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA DATA non-user di atas?', false)) {
                $this->warn('Operasi dibatalkan.');
                return Command::SUCCESS;
            }
        }

        $this->info("Menghapus data non-user...");

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS = 0;');
            foreach ($tablesToClear as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->truncate();
                    $this->line("  [TRUNCATED] {$table}");
                }
            }
            DB::statement('SET FOREIGN_KEY_CHECKS = 1;');
        } elseif ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
            foreach ($tablesToClear as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->delete();
                    $this->line("  [CLEARED] {$table}");
                }
            }
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            foreach ($tablesToClear as $table) {
                if (Schema::hasTable($table)) {
                    DB::table($table)->delete();
                    $this->line("  [CLEARED] {$table}");
                }
            }
        }

        $userCount = DB::table('users')->count();
        $profileCount = Schema::hasTable('student_profiles') ? DB::table('student_profiles')->count() : 0;
        $campusCount = Schema::hasTable('campuses') ? DB::table('campuses')->count() : 0;

        // Seed Curated High-Quality Competitions with Images
        $firstUser = DB::table('users')->first();
        $creatorId = $firstUser ? $firstUser->id : 1;

        $curatedCompetitions = [
            [
                'created_by' => $creatorId,
                'name' => 'GEMASTIK 2026 — Divisi Penambangan Data & AI',
                'slug' => 'gemastik-2026-data-mining-ai',
                'organizer' => 'Puspresnas Kemdikbudristek RI',
                'description' => 'Kompetisi mahasiswa nasional bidang TIK untuk inovasi pemrosesan data cerdas dan implementasi model machine learning berdaya guna.',
                'category' => 'technology',
                'level' => 'national',
                'competition_type' => 'team',
                'scope' => 'global',
                'official_url' => 'https://puspresnas.kemdikbud.go.id',
                'registration_url' => 'https://gemastik.kemdikbud.go.id',
                'registration_opens_at' => now()->subDays(10),
                'registration_deadline' => now()->addDays(45),
                'starts_at' => now()->addDays(50),
                'ends_at' => now()->addDays(65),
                'min_team_size' => 2,
                'max_team_size' => 3,
                'prize_info' => 'Medali Emas/Perak/Perunggu + Sertifikat Puspresnas + Total Rp 150.000.000',
                'cover_image' => '/images/competitions/gemastik-ai.svg',
                'status' => 'open',
                'verification_status' => 'verified',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'created_by' => $creatorId,
                'name' => 'National IoT Smart Campus Challenge 2026',
                'slug' => 'national-iot-smart-campus-challenge-2026',
                'organizer' => 'Asosiasi IoT Indonesia & BRIN',
                'description' => 'Tantangan implementasi sensor node IoT, efisiensi energi kampus, dan smart waste management terintegrasi dashboard.',
                'category' => 'iot',
                'level' => 'national',
                'competition_type' => 'team',
                'scope' => 'global',
                'official_url' => 'https://iot-indonesia.org',
                'registration_url' => 'https://iot-challenge.id/register',
                'registration_opens_at' => now()->subDays(15),
                'registration_deadline' => now()->addDays(24),
                'starts_at' => now()->addDays(30),
                'ends_at' => now()->addDays(40),
                'min_team_size' => 2,
                'max_team_size' => 4,
                'prize_info' => 'Piala Bergilir BRIN + Hardware DevKit + Total Rp 75.000.000',
                'cover_image' => '/images/competitions/iot-challenge.svg',
                'status' => 'open',
                'verification_status' => 'verified',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'created_by' => $creatorId,
                'name' => 'Hackathon Innovation Camp 2026',
                'slug' => 'hackathon-innovation-camp-2026',
                'organizer' => 'Google Developer Student Clubs & RakitCampus',
                'description' => 'Membangun purwarupa produk digital berbasis AI & cloud dalam 48 jam nonstop untuk solusi tantangan sosial berkelanjutan.',
                'category' => 'hackathon',
                'level' => 'national',
                'competition_type' => 'team',
                'scope' => 'global',
                'official_url' => 'https://developers.google.com/community/gdsc',
                'registration_url' => 'https://hackathon.rakitcampus.my.id',
                'registration_opens_at' => now()->subDays(5),
                'registration_deadline' => now()->addDays(12),
                'starts_at' => now()->addDays(15),
                'ends_at' => now()->addDays(18),
                'min_team_size' => 3,
                'max_team_size' => 5,
                'prize_info' => 'Google Cloud Credits $10,000 + Golden Ticket Incubation + Rp 50.000.000',
                'cover_image' => '/images/competitions/hackathon-camp.svg',
                'status' => 'open',
                'verification_status' => 'verified',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'created_by' => $creatorId,
                'name' => 'PKM-Kewirausahaan Mahasiswa 2026',
                'slug' => 'pkm-kewirausahaan-mahasiswa-2026',
                'organizer' => 'Ditjen Diktiristek Kemendikbudristek',
                'description' => 'Program Kreativitas Mahasiswa bidang Kewirausahaan berbasis teknologi dan kearifan lokal berorientasi profit dan sustainabilitas.',
                'category' => 'business',
                'level' => 'national',
                'competition_type' => 'team',
                'scope' => 'global',
                'official_url' => 'https://simbelmawa.kemdikbud.go.id',
                'registration_url' => 'https://simbelmawa.kemdikbud.go.id/pkm',
                'registration_opens_at' => now()->subDays(20),
                'registration_deadline' => now()->addDays(60),
                'starts_at' => now()->addDays(70),
                'ends_at' => now()->addDays(120),
                'min_team_size' => 3,
                'max_team_size' => 5,
                'prize_info' => 'Pendanaan Insentif Kemendikbudristek Rp 6.000.000 - Rp 10.000.000 + Tiket PIMNAS',
                'cover_image' => '/images/competitions/pkm-k.svg',
                'status' => 'open',
                'verification_status' => 'verified',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'created_by' => $creatorId,
                'name' => 'Global UI/UX Design Sprint 2026',
                'slug' => 'global-uiux-design-sprint-2026',
                'organizer' => 'International Design Guild & Figma Community',
                'description' => 'Kompetisi perancangan pengalaman antarmuka dan studi kasus interaksi human-centered untuk platform edukasi masa depan.',
                'category' => 'design',
                'level' => 'international',
                'competition_type' => 'individual',
                'scope' => 'global',
                'official_url' => 'https://figma.com/community',
                'registration_url' => 'https://designguild.org/sprint2026',
                'registration_opens_at' => now()->subDays(10),
                'registration_deadline' => now()->addDays(30),
                'starts_at' => now()->addDays(35),
                'ends_at' => now()->addDays(45),
                'min_team_size' => 1,
                'max_team_size' => 2,
                'prize_info' => 'Figma Professional Lifetime + Apple iPad Pro + $3,000 USD',
                'cover_image' => '/images/competitions/uiux-sprint.svg',
                'status' => 'open',
                'verification_status' => 'verified',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        foreach ($curatedCompetitions as $cData) {
            DB::table('competitions')->insert($cData);
        }

        $this->newLine();
        $this->info("==================================================");
        $this->info("              PEMBERSIHAN BERHASIL!               ");
        $this->info("==================================================");
        $this->line("Semua data transaksi lama telah dibersihkan.");
        $this->line("Data user tetap aman:");
        $this->line("  • Users: <fg=green;options=bold>{$userCount}</>");
        $this->line("  • Student Profiles: <fg=green;options=bold>{$profileCount}</>");
        $this->line("  • Kampus: <fg=green;options=bold>{$campusCount}</>");
        $this->line("Kompetisi terkurasi telah disematkan:");
        $this->line("  • Kompetisi terverifikasi: <fg=green;options=bold>" . count($curatedCompetitions) . "</> lomba dengan banner visual.");

        return Command::SUCCESS;
    }
}
