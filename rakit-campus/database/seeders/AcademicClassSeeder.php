<?php

namespace Database\Seeders;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Enums\Visibility;
use App\Models\AcademicClass;
use App\Models\AcademicClassGuidance;
use App\Models\AcademicClassStudent;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AcademicClassSeeder extends Seeder
{
    public function run(): void
    {
        $campus = Campus::where('slug', 'polindra')->first() ?? Campus::first();
        if (!$campus) {
            return;
        }

        // 1. Create or Find Dosen Account
        $lecturer = User::firstOrCreate(
            ['email' => 'dosen.rpl@polindra.ac.id'],
            [
                'name' => 'Dr. Ir. Budi Santoso, M.T.',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );

        CampusMembership::updateOrCreate(
            [
                'campus_id' => $campus->id,
                'user_id' => $lecturer->id,
            ],
            [
                'role' => CampusRole::Lecturer->value,
                'status' => MembershipStatus::Active->value,
                'verification_status' => VerificationStatus::Verified->value,
                'student_number' => 'NIDN-0412088102',
                'verified_at' => now(),
            ]
        );

        // Also ensure Google Demo user has student membership
        $googleDemo = User::where('email', 'google.student@polindra.ac.id')->first();

        // 2. Create Sample Academic Class
        $academicClass = AcademicClass::updateOrCreate(
            ['code' => 'TI2A-RPL', 'campus_id' => $campus->id],
            [
                'lecturer_id' => $lecturer->id,
                'name' => 'TI-2A Rekayasa Perangkat Lunak',
                'join_code' => 'TI2A26',
                'study_program' => 'Teknik Informatika',
                'academic_year' => '2026/2027',
                'semester' => 'Ganjil',
                'description' => 'Mata kuliah praktikum pengembangan perangkat lunak berbasis tim capstone. Setiap kelompok wajib menyelesaikan sprint produk hingga tahap deployment.',
                'target_team_size' => 4,
                'status' => 'active',
            ]
        );

        // 3. Create Sample Students
        $studentsData = [
            ['name' => 'Ahmad Fauzan', 'nim' => '2105001', 'prodi' => 'Teknik Informatika', 'skills' => ['Laravel', 'MySQL', 'Docker']],
            ['name' => 'Siti Nurhaliza', 'nim' => '2105002', 'prodi' => 'Teknik Informatika', 'skills' => ['React', 'Tailwind CSS', 'Figma']],
            ['name' => 'Rizky Ramadhan', 'nim' => '2105003', 'prodi' => 'Teknik Informatika', 'skills' => ['Flutter', 'REST API', 'Git']],
            ['name' => 'Dewi Lestari', 'nim' => '2105004', 'prodi' => 'Teknik Informatika', 'skills' => ['UI/UX Design', 'Quality Assurance']],
            ['name' => 'Bagus Pratama', 'nim' => '2105005', 'prodi' => 'Teknik Informatika', 'skills' => ['Python', 'Machine Learning', 'FastAPI']],
            ['name' => 'Anisa Rahmawati', 'nim' => '2105006', 'prodi' => 'Teknik Informatika', 'skills' => ['Frontend Development', 'TypeScript']],
            ['name' => 'Hendra Saputra', 'nim' => '2105007', 'prodi' => 'Teknik Informatika', 'skills' => ['Backend Golang', 'PostgreSQL']],
            ['name' => 'Putri Ayu', 'nim' => '2105008', 'prodi' => 'Teknik Informatika', 'skills' => ['Product Management', 'Scrum']],
        ];

        $enrolledUsers = collect();

        foreach ($studentsData as $idx => $st) {
            $user = User::firstOrCreate(
                ['email' => "mhs_{$st['nim']}@polindra.ac.id"],
                [
                    'name' => $st['name'],
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                ]
            );

            CampusMembership::updateOrCreate(
                ['campus_id' => $campus->id, 'user_id' => $user->id],
                [
                    'role' => CampusRole::Student->value,
                    'status' => MembershipStatus::Active->value,
                    'verification_status' => VerificationStatus::Verified->value,
                    'student_number' => $st['nim'],
                ]
            );

            $profile = StudentProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'campus_id' => $campus->id,
                    'slug' => Str::slug($st['name']) . '-' . Str::random(4),
                    'bio' => 'Mahasiswa aktif ' . $st['prodi'],
                    'study_program' => $st['prodi'],
                    'department' => 'Teknik Informatika',
                    'semester' => 4,
                ]
            );

            AcademicClassStudent::updateOrCreate(
                ['academic_class_id' => $academicClass->id, 'user_id' => $user->id],
                [
                    'student_number' => $st['nim'],
                    'status' => 'enrolled',
                    'enrolled_at' => now()->subDays(10 - $idx),
                ]
            );

            $enrolledUsers->push($user);
        }

        // Also enroll Google demo user if exists
        if ($googleDemo) {
            AcademicClassStudent::updateOrCreate(
                ['academic_class_id' => $academicClass->id, 'user_id' => $googleDemo->id],
                [
                    'student_number' => '2105099',
                    'status' => 'enrolled',
                    'enrolled_at' => now(),
                ]
            );
        }

        // 4. Form 1 Sample Project for the first 4 students
        $team1Members = $enrolledUsers->slice(0, 4);
        $leader = $team1Members->first();

        $project1 = Project::updateOrCreate(
            ['slug' => 'sim-klinik-kampus-rpl'],
            [
                'campus_id' => $campus->id,
                'academic_class_id' => $academicClass->id,
                'leader_id' => $leader->id,
                'title' => 'SIM-Klinik Kampus Terpadu',
                'short_description' => 'Sistem Informasi Manajemen Pelayanan Klinik dan Rekam Medis Mahasiswa Polindra berbasis Web & Mobile.',
                'category' => ProjectCategory::Academic,
                'visibility' => Visibility::Campus,
                'status' => ProjectStatus::InProgress,
                'progress' => 45,
                'starts_on' => now()->subDays(14),
                'lecturer_notes' => 'Arsitektur basis data dan diagram alir data sudah disetujui. Lanjutkan integrasi autentikasi.',
                'lecturer_evaluation' => 'Disetujui Dosen',
            ]
        );

        $team1 = Team::updateOrCreate(
            ['project_id' => $project1->id],
            [
                'campus_id' => $campus->id,
                'leader_id' => $leader->id,
                'type' => TeamType::Project,
                'name' => 'Kelompok 1 (Klinik Polindra)',
                'description' => 'Tim pengembang SIM-Klinik Kampus Terpadu',
                'capacity' => 4,
            ]
        );

        foreach ($team1Members as $pos => $member) {
            TeamMember::updateOrCreate(
                ['team_id' => $team1->id, 'user_id' => $member->id],
                [
                    'permission' => $pos === 0 ? TeamPermission::Leader : TeamPermission::Member,
                    'role_name' => $pos === 0 ? 'Project Leader' : ($pos === 1 ? 'Frontend Engineer' : ($pos === 2 ? 'Mobile Dev' : 'UI/UX & QA')),
                    'joined_at' => now()->subDays(14),
                ]
            );
        }

        // 5. Add Guidance / Announcement Log from Dosen
        AcademicClassGuidance::updateOrCreate(
            [
                'academic_class_id' => $academicClass->id,
                'title' => 'Pengumuman Milestone 1 & Review Perancangan Sistem',
            ],
            [
                'lecturer_id' => $lecturer->id,
                'content' => "Selamat siang seluruh mahasiswa kelas TI-2A RPL.\n\nHarap dipastikan seluruh kelompok telah mengunggah Entity Relationship Diagram (ERD) dan wireframe antarmuka sebelum hari Jumat pukul 23:59 WIB.\nBagi mahasiswa yang belum memiliki kelompok, silakan segera berkoordinasi atau gunakan fitur pencocokan tim otomatis.",
                'type' => 'announcement',
            ]
        );

        AcademicClassGuidance::updateOrCreate(
            [
                'academic_class_id' => $academicClass->id,
                'project_id' => $project1->id,
                'title' => 'Catatan Bimbingan Kelompok 1: SIM Klinik',
            ],
            [
                'lecturer_id' => $lecturer->id,
                'content' => 'Tabel rekam medis pasien harap menggunakan enkripsi untuk kolom data sensitif (NIK dan riwayat diagnosa). Skema relasi dokter dan poli sudah baik.',
                'type' => 'guidance',
            ]
        );
    }
}
