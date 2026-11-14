<?php

namespace App\Services\Matchmaking;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamStatus;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Enums\Visibility;
use App\Models\AcademicClass;
use App\Models\AcademicClassStudent;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\StudentProfile;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoProjectAligner
{
    protected static bool $aligned = false;

    public static function alignOnce(): void
    {
        if (static::$aligned) {
            return;
        }

        static::align();
        static::$aligned = true;
    }

    public static function align(): void
    {
        $campus = Campus::where('slug', 'polindra')->first();
        if (!$campus) {
            return;
        }

        $passwordHash = Hash::make('password123');

        // 1. Ensure Demo Lecturer (Budi Santoso, M.Kom.)
        $budi = User::firstOrCreate(
            ['email' => 'budi@polindra.ac.id'],
            [
                'name' => 'Budi Santoso, M.Kom.',
                'password' => $passwordHash,
                'is_platform_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        CampusMembership::updateOrCreate(
            ['campus_id' => $campus->id, 'user_id' => $budi->id],
            [
                'role' => CampusRole::Lecturer->value,
                'status' => MembershipStatus::Active->value,
                'verification_status' => VerificationStatus::Verified->value,
                'student_number' => 'NIDN-0412088101',
                'verified_at' => now(),
            ]
        );

        // 2. Ensure Academic Class TI2A-RPL has Budi as primary lecturer
        $academicClass = AcademicClass::updateOrCreate(
            ['code' => 'TI2A-RPL', 'campus_id' => $campus->id],
            [
                'lecturer_id' => $budi->id,
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

        $academicClass->coLecturers()->syncWithoutDetaching([
            $budi->id => ['role' => 'lecturer'],
        ]);

        // 3. Ensure Students exist with verified membership & class enrollment
        // Ahmad Fauzi (Ketua Proyek 1)
        $ahmad = User::where('email', 'ahmad.fauzi@student.polindra.ac.id')->first()
            ?? User::where('email', 'like', '%ahmad.fauzi%')->first();
        if (!$ahmad) {
            $ahmad = User::create([
                'name' => 'Ahmad Fauzi',
                'email' => 'ahmad.fauzi@student.polindra.ac.id',
                'password' => $passwordHash,
                'email_verified_at' => now(),
            ]);
        }
        static::safeSyncStudentMembership($campus, $ahmad, '2201001');
        StudentProfile::firstOrCreate(
            ['user_id' => $ahmad->id],
            [
                'campus_id' => $campus->id,
                'slug' => 'ahmad-fauzi-001',
                'department' => 'Teknik Informatika',
                'study_program' => 'Teknik Informatika',
                'semester' => 5,
                'bio' => 'Fullstack mobile developer & team lead.',
                'is_onboarded' => true,
            ]
        );
        AcademicClassStudent::updateOrCreate(
            ['academic_class_id' => $academicClass->id, 'user_id' => $ahmad->id],
            ['student_number' => '2201001', 'status' => 'enrolled', 'enrolled_at' => now()->subDays(14)]
        );

        // Siti Rahma (Anggota Proyek 1)
        $siti = User::where('email', 'siti@polindra.ac.id')->first();
        if (!$siti) {
            $siti = User::create([
                'name' => 'Siti Rahma',
                'email' => 'siti@polindra.ac.id',
                'password' => $passwordHash,
                'email_verified_at' => now(),
            ]);
        }
        static::safeSyncStudentMembership($campus, $siti, '2201092');
        StudentProfile::updateOrCreate(
            ['user_id' => $siti->id],
            [
                'campus_id' => $campus->id,
                'slug' => 'siti-rahma-1092',
                'department' => 'Teknik Informatika',
                'study_program' => 'Teknik Informatika',
                'semester' => 5,
                'bio' => 'Mobile Flutter Developer & UI/UX enthusiast.',
                'is_onboarded' => true,
            ]
        );
        AcademicClassStudent::updateOrCreate(
            ['academic_class_id' => $academicClass->id, 'user_id' => $siti->id],
            ['student_number' => '2201092', 'status' => 'enrolled', 'enrolled_at' => now()->subDays(14)]
        );

        // Agus Prasetyo (Ketua Proyek 2)
        $agus = User::where('email', 'agus@polindra.ac.id')->first();
        if (!$agus) {
            $agus = User::create([
                'name' => 'Agus Prasetyo',
                'email' => 'agus@polindra.ac.id',
                'password' => $passwordHash,
                'email_verified_at' => now(),
            ]);
        }
        static::safeSyncStudentMembership($campus, $agus, '2202093');
        StudentProfile::firstOrCreate(
            ['user_id' => $agus->id],
            [
                'campus_id' => $campus->id,
                'slug' => 'agus-prasetyo-2093',
                'department' => 'Teknik Informatika',
                'study_program' => 'Rekayasa Perangkat Lunak',
                'semester' => 5,
                'bio' => 'Backend Architect & IoT Specialist.',
                'is_onboarded' => true,
            ]
        );
        AcademicClassStudent::updateOrCreate(
            ['academic_class_id' => $academicClass->id, 'user_id' => $agus->id],
            ['student_number' => '2202093', 'status' => 'enrolled', 'enrolled_at' => now()->subDays(14)]
        );

        // Dewi Lestari (Ketua Proyek 3)
        $dewi = User::where('email', 'dewi@polindra.ac.id')->first()
            ?? User::where('email', 'dewi.lestari@student.polindra.ac.id')->first();
        if (!$dewi) {
            $dewi = User::create([
                'name' => 'Dewi Lestari',
                'email' => 'dewi@polindra.ac.id',
                'password' => $passwordHash,
                'email_verified_at' => now(),
            ]);
        }
        static::safeSyncStudentMembership($campus, $dewi, '2301094');
        StudentProfile::firstOrCreate(
            ['user_id' => $dewi->id],
            [
                'campus_id' => $campus->id,
                'slug' => 'dewi-lestari-1094',
                'department' => 'Teknik Informatika',
                'study_program' => 'Sistem Informasi Kota Cerdas',
                'semester' => 4,
                'bio' => 'Frontend UI/UX Specialist.',
                'is_onboarded' => true,
            ]
        );
        AcademicClassStudent::updateOrCreate(
            ['academic_class_id' => $academicClass->id, 'user_id' => $dewi->id],
            ['student_number' => '2301094', 'status' => 'enrolled', 'enrolled_at' => now()->subDays(14)]
        );

        // Supporting students for project 2 & 3
        $resolveSupportingStudent = function (string $primaryEmail, array $alternativeEmails, string $name, string $nim) use ($campus, $passwordHash, $academicClass) {
            $user = User::where('email', $primaryEmail)
                ->orWhereIn('email', $alternativeEmails)
                ->first();

            if (!$user) {
                $nimMembership = CampusMembership::where('campus_id', $campus->id)
                    ->where('student_number', $nim)
                    ->first();
                if ($nimMembership) {
                    $user = User::find($nimMembership->user_id);
                }
            }

            if (!$user) {
                $user = User::create([
                    'name' => $name,
                    'email' => $primaryEmail,
                    'password' => $passwordHash,
                    'email_verified_at' => now(),
                ]);
            }

            static::safeSyncStudentMembership($campus, $user, $nim);

            AcademicClassStudent::updateOrCreate(
                ['academic_class_id' => $academicClass->id, 'user_id' => $user->id],
                ['student_number' => $nim, 'status' => 'enrolled', 'enrolled_at' => now()->subDays(14)]
            );

            return $user;
        };

        $bagus = $resolveSupportingStudent('bagus@polindra.ac.id', ['mhs_2105005@polindra.ac.id'], 'Bagus Pratama', '2105005');
        $hendra = $resolveSupportingStudent('hendra@polindra.ac.id', ['mhs_2105007@polindra.ac.id'], 'Hendra Saputra', '2105007');
        $rizky = $resolveSupportingStudent('rizky@polindra.ac.id', ['mhs_2105003@polindra.ac.id'], 'Rizky Ramadhan', '2105003');
        $putri = $resolveSupportingStudent('putri@polindra.ac.id', ['mhs_2105008@polindra.ac.id'], 'Putri Ayu', '2105008');

        // ==============================================================
        // 4. PROYEK 1: AgriTani — IoT & AI Smart Farming Platform
        // Ketua: Ahmad Fauzi | Anggota: Siti Rahma
        // Status: Open Recruitment & BELUM diajukan ke dosen ('draft')
        // ==============================================================
        $project1 = Project::where('slug', 'agritani-smart-farming-polindra')->first();
        if (!$project1) {
            $project1 = Project::create([
                'slug' => 'agritani-smart-farming-polindra',
                'campus_id' => $campus->id,
                'academic_class_id' => $academicClass->id,
                'leader_id' => $ahmad->id,
                'title' => 'AgriTani — IoT & AI Smart Farming Platform',
                'short_description' => 'Platform monitoring pertanian berbasis IoT dan rekomendasi jadwal panen otomatis untuk petani mangga Indramayu.',
                'description' => 'Proyek pengembangan sistem pemantauan kelembapan tanah, cuaca mikro, dan deteksi hama daun berbasis computer vision untuk membantu petani lokal di Kabupaten Indramayu.',
                'category' => ProjectCategory::Startup,
                'problem_statement' => "Petani mangga sering terlambat mendeteksi serangan hama dan ketidakstabilan kelembapan tanah, menyebabkan gagal panen hingga 30%.\n\nPerlu platform IoT yang mudah digunakan dan memberikan rekomendasi tindakan terotomasi.",
                'objectives' => "1. Membangun sensor node IoT LoRaWAN hemat daya di perkebunan.\n2. Mengembangkan mobile app Flutter real-time telemetry.\n3. Melatih model computer vision deteksi hama daun on-device.",
                'proposed_solution' => "Integrasi sensor node LoRaWAN dengan gateway cerdas, diteruskan ke backend API dan dashboard mobile.",
                'tech_stack' => ['Flutter', 'Laravel', 'FastAPI', 'Python', 'MySQL', 'Docker'],
                'visibility' => Visibility::Campus,
                'status' => ProjectStatus::Recruiting,
                'formation_status' => 'draft',
                'formation_notes' => null,
                'formation_approved_at' => null,
                'formation_approved_by' => null,
                'min_team_size' => 2,
                'max_team_size' => 4,
                'progress' => 17,
                'starts_on' => now()->subMonths(1),
                'target_completion_on' => now()->addMonths(3),
            ]);
        }

        $team1 = Team::where('project_id', $project1->id)->first();
        if (!$team1) {
            $team1 = Team::create([
                'project_id' => $project1->id,
                'campus_id' => $campus->id,
                'type' => TeamType::Project,
                'leader_id' => $ahmad->id,
                'name' => 'AgriTani Core Team',
                'description' => 'Tim pengembang platform IoT dan mobile AgriTani Polindra.',
                'capacity' => 4,
                'status' => TeamStatus::AwaitingMembers,
            ]);
        }

        // Pastikan default awal ketua Ahmad Fauzi & anggota Siti Rahma ada tanpa menghapus anggota lain yang diterima
        TeamMember::firstOrCreate(
            ['team_id' => $team1->id, 'user_id' => $ahmad->id],
            [
                'permission' => TeamPermission::Leader,
                'role_name' => 'Project Lead & Mobile Developer',
                'status' => 'active',
                'joined_at' => now()->subWeeks(3),
            ]
        );

        TeamMember::firstOrCreate(
            ['team_id' => $team1->id, 'user_id' => $siti->id],
            [
                'permission' => TeamPermission::Member,
                'role_name' => 'Mobile Flutter Developer',
                'status' => 'active',
                'joined_at' => now()->subWeeks(2),
            ]
        );

        $rec1 = Recruitment::firstOrCreate(
            ['team_id' => $team1->id],
            [
                'campus_id' => $campus->id,
                'title' => 'Open Recruitment AgriTani: Backend & AI Specialist',
                'description' => 'Mencari Backend Developer dan AI Specialist untuk melengkapi komposisi 4 anggota.',
                'status' => RecruitmentStatus::Open,
                'closes_at' => now()->addDays(14),
            ]
        );

        RecruitmentRole::updateOrCreate(
            ['recruitment_id' => $rec1->id, 'name' => 'AI / Computer Vision Specialist'],
            ['slots' => 1, 'requirements' => 'Menguasai Python, PyTorch/TensorFlow, dan klasifikasi citra daun mangga.']
        );
        RecruitmentRole::updateOrCreate(
            ['recruitment_id' => $rec1->id, 'name' => 'Backend Engineer'],
            ['slots' => 1, 'requirements' => 'Menguasai Laravel/FastAPI, PostgreSQL, dan arsitektur LoRa gateway ingestion.']
        );

        // ==============================================================
        // 5. PROYEK 2: Smart Waste Management IoT Polindra
        // Ketua: Agus Prasetyo | Anggota: Bagus Pratama, Hendra Saputra
        // Pastikan Siti Rahma & Ahmad Fauzi BUKAN anggota di proyek ini
        // ==============================================================
        $project2 = Project::updateOrCreate(
            ['slug' => 'smart-waste-management-iot-polindra'],
            [
                'campus_id' => $campus->id,
                'academic_class_id' => $academicClass->id,
                'leader_id' => $agus->id,
                'title' => 'Smart Waste Management IoT Polindra',
                'short_description' => 'Sistem monitoring volume tempat sampah pintar berbasis IoT LoRaWAN untuk efisiensi kebersihan kampus Polindra.',
                'description' => 'Pengembangan sensor ultrasonik mikrokontroler ESP32 terhubung LoRaWAN untuk pemantauan tempat sampah terpusat.',
                'category' => ProjectCategory::Startup,
                'tech_stack' => ['IoT', 'ESP32', 'LoRaWAN', 'Laravel', 'Flutter', 'PostgreSQL'],
                'visibility' => Visibility::Campus,
                'status' => ProjectStatus::InProgress,
                'formation_status' => 'workspace_activated',
                'formation_notes' => 'Formasi tim disetujui dosen pembimbing.',
                'formation_approved_at' => now()->subDays(10),
                'formation_approved_by' => $budi->id,
                'min_team_size' => 2,
                'max_team_size' => 4,
                'progress' => 45,
            ]
        );

        $team2 = Team::updateOrCreate(
            ['project_id' => $project2->id],
            [
                'campus_id' => $campus->id,
                'type' => TeamType::Project,
                'leader_id' => $agus->id,
                'name' => 'Tim Smart Waste Polindra',
                'description' => 'Tim pengembang IoT smart waste.',
                'capacity' => 4,
                'status' => TeamStatus::Active,
            ]
        );

        TeamMember::where('team_id', $team2->id)
            ->whereIn('user_id', [$siti->id, $ahmad->id])
            ->delete();

        TeamMember::updateOrCreate(
            ['team_id' => $team2->id, 'user_id' => $agus->id],
            ['permission' => TeamPermission::Leader, 'role_name' => 'Project Lead & Hardware Architect', 'status' => 'active', 'joined_at' => now()->subDays(14)]
        );
        TeamMember::updateOrCreate(
            ['team_id' => $team2->id, 'user_id' => $bagus->id],
            ['permission' => TeamPermission::Member, 'role_name' => 'Firmware Engineer', 'status' => 'active', 'joined_at' => now()->subDays(14)]
        );
        TeamMember::updateOrCreate(
            ['team_id' => $team2->id, 'user_id' => $hendra->id],
            ['permission' => TeamPermission::Member, 'role_name' => 'Backend Cloud Engineer', 'status' => 'active', 'joined_at' => now()->subDays(14)]
        );

        // ==============================================================
        // 6. PROYEK 3: SIM-Klinik Kampus Terpadu
        // Ketua: Dewi Lestari | Anggota: Rizky Ramadhan, Putri Ayu
        // Pastikan Ahmad Fauzi & Agus & Siti BUKAN anggota di proyek ini
        // ==============================================================
        $project3 = Project::updateOrCreate(
            ['slug' => 'sim-klinik-kampus-rpl'],
            [
                'campus_id' => $campus->id,
                'academic_class_id' => $academicClass->id,
                'leader_id' => $dewi->id,
                'title' => 'SIM-Klinik Kampus Terpadu',
                'short_description' => 'Sistem Informasi Manajemen Pelayanan Klinik dan Rekam Medis Mahasiswa Polindra berbasis Web & Mobile.',
                'description' => 'Aplikasi pelayanan kesehatan kampus yang terintegrasi dengan modul reservasi jadwal dokter, rekam medis elektronik, dan notifikasi resep.',
                'category' => ProjectCategory::Academic,
                'tech_stack' => ['Laravel', 'React', 'Tailwind CSS', 'PostgreSQL'],
                'visibility' => Visibility::Campus,
                'status' => ProjectStatus::InProgress,
                'formation_status' => 'workspace_activated',
                'formation_notes' => 'Rancangan arsitektur basis data dan tim disetujui dosen pengampu.',
                'formation_approved_at' => now()->subDays(12),
                'formation_approved_by' => $budi->id,
                'min_team_size' => 2,
                'max_team_size' => 4,
                'progress' => 50,
            ]
        );

        $team3 = Team::updateOrCreate(
            ['project_id' => $project3->id],
            [
                'campus_id' => $campus->id,
                'type' => TeamType::Project,
                'leader_id' => $dewi->id,
                'name' => 'Kelompok 1 (Klinik Polindra)',
                'description' => 'Tim pengembang SIM-Klinik Kampus Terpadu',
                'capacity' => 4,
                'status' => TeamStatus::Active,
            ]
        );

        TeamMember::where('team_id', $team3->id)
            ->whereIn('user_id', [$ahmad->id, $agus->id, $siti->id])
            ->delete();

        TeamMember::updateOrCreate(
            ['team_id' => $team3->id, 'user_id' => $dewi->id],
            ['permission' => TeamPermission::Leader, 'role_name' => 'Project Lead & UI/UX Specialist', 'status' => 'active', 'joined_at' => now()->subDays(14)]
        );
        TeamMember::updateOrCreate(
            ['team_id' => $team3->id, 'user_id' => $rizky->id],
            ['permission' => TeamPermission::Member, 'role_name' => 'Frontend Developer', 'status' => 'active', 'joined_at' => now()->subDays(14)]
        );
        TeamMember::updateOrCreate(
            ['team_id' => $team3->id, 'user_id' => $putri->id],
            ['permission' => TeamPermission::Member, 'role_name' => 'QA & System Analyst', 'status' => 'active', 'joined_at' => now()->subDays(14)]
        );
    }

    /**
     * Safely synchronizes a student's campus membership without triggering unique key constraints on (campus_id, student_number).
     */
    protected static function safeSyncStudentMembership(Campus $campus, User $user, string $nim): CampusMembership
    {
        $existingNimMembership = CampusMembership::where('campus_id', $campus->id)
            ->where('student_number', $nim)
            ->first();

        $existingUserMembership = CampusMembership::where('campus_id', $campus->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingNimMembership && $existingUserMembership && $existingNimMembership->id !== $existingUserMembership->id) {
            $existingNimMembership->delete();
        }

        if ($existingNimMembership && !$existingUserMembership) {
            $existingNimMembership->update([
                'user_id' => $user->id,
                'role' => CampusRole::Student->value,
                'status' => MembershipStatus::Active->value,
                'verification_status' => VerificationStatus::Verified->value,
                'verified_at' => $existingNimMembership->verified_at ?? now(),
            ]);
            return $existingNimMembership;
        }

        if ($existingUserMembership) {
            $existingUserMembership->update([
                'role' => CampusRole::Student->value,
                'status' => MembershipStatus::Active->value,
                'verification_status' => VerificationStatus::Verified->value,
                'student_number' => $nim,
                'verified_at' => $existingUserMembership->verified_at ?? now(),
            ]);
            return $existingUserMembership;
        }

        return CampusMembership::create([
            'campus_id' => $campus->id,
            'user_id' => $user->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => $nim,
            'verified_at' => now(),
        ]);
    }
}

