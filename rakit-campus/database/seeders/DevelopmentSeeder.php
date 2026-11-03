<?php

namespace Database\Seeders;

use App\Enums\ApplicationStatus;
use App\Enums\CampusRole;
use App\Enums\CompetitionCategory;
use App\Enums\CompetitionScope;
use App\Enums\CompetitionStatus;
use App\Enums\MembershipStatus;
use App\Enums\MilestoneStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Enums\Visibility;
use App\Models\Application;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Competition;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionSource;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Skill;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Development-only seed data for pilot testing.
 * Strictly forbidden in production environments.
 */
class DevelopmentSeeder extends Seeder
{
    public function run(): void
    {
        if (!app()->environment('local', 'testing')) {
            $this->command?->warn('Skipping DevelopmentSeeder: Allowed only in local/testing environments.');
            return;
        }

        $polindra = Campus::where('slug', 'polindra')->firstOrFail();
        $itb = Campus::where('slug', 'itb')->firstOrFail();

        // 1. Platform Super Admin
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@rakitcampus.id'],
            [
                'name' => 'Platform Super Admin',
                'password' => Hash::make('password123'),
                'is_platform_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Campus Admin for Polindra
        $campusAdmin = User::firstOrCreate(
            ['email' => 'admin@polindra.ac.id'],
            [
                'name' => 'Budi Santoso, M.Kom',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );
        CampusMembership::firstOrCreate(
            ['campus_id' => $polindra->id, 'user_id' => $campusAdmin->id],
            [
                'role' => CampusRole::CampusAdmin,
                'status' => MembershipStatus::Active,
                'verification_status' => VerificationStatus::Verified,
                'verified_at' => now(),
                'verified_by' => $superAdmin->id,
            ]
        );

        // 3. Students in Polindra (TI, RPL, SIKC)
        $studentsData = [
            [
                'name' => 'Ahmad Fauzi',
                'email' => 'ahmad.fauzi@student.polindra.ac.id',
                'nim' => '2201001',
                'program' => 'Rekayasa Perangkat Lunak',
                'dept' => 'Teknik Informatika',
                'semester' => 5,
                'bio' => 'Fullstack developer & mobile enthusiast. Passionate in Flutter and Laravel.',
                'skills' => ['Flutter' => 5, 'Laravel' => 4, 'Dart' => 5, 'PHP' => 4, 'MySQL' => 4, 'REST API' => 5, 'Git' => 4],
                'interests' => ['Mobile App', 'Smart Agriculture', 'Fintech'],
                'preferred_roles' => ['Mobile Developer', 'Fullstack Developer', 'Team Lead'],
                'availability' => 20,
            ],
            [
                'name' => 'Siti Nurhaliza',
                'email' => 'siti.nur@student.polindra.ac.id',
                'nim' => '2201015',
                'program' => 'Teknik Informatika',
                'dept' => 'Teknik Informatika',
                'semester' => 5,
                'bio' => 'UI/UX Designer who loves building intuitive, accessible, and clean digital experiences.',
                'skills' => ['UI/UX Design' => 5, 'Figma' => 5, 'Wireframing' => 4, 'Prototyping' => 5, 'Design Thinking' => 4, 'React' => 3],
                'interests' => ['Product Design', 'Education Tech', 'Clean Tech'],
                'preferred_roles' => ['UI/UX Designer', 'Product Manager'],
                'availability' => 15,
            ],
            [
                'name' => 'Rian Pratama',
                'email' => 'rian.p@student.polindra.ac.id',
                'nim' => '2202020',
                'program' => 'Sistem Informasi Kota Cerdas',
                'dept' => 'Teknik Informatika',
                'semester' => 5,
                'bio' => 'Backend and IoT engineer focusing on smart city solutions and cloud architectures.',
                'skills' => ['Python' => 4, 'FastAPI' => 4, 'PostgreSQL' => 4, 'Docker' => 3, 'Machine Learning' => 3, 'Data Analysis' => 4],
                'interests' => ['Smart City', 'IoT', 'AI'],
                'preferred_roles' => ['Backend Developer', 'Data Analyst'],
                'availability' => 18,
            ],
            [
                'name' => 'Dewi Lestari',
                'email' => 'dewi.lestari@student.polindra.ac.id',
                'nim' => '2301044',
                'program' => 'Rekayasa Perangkat Lunak',
                'dept' => 'Teknik Informatika',
                'semester' => 3,
                'bio' => 'Frontend developer eager to learn modern web frameworks like React and Vue.',
                'skills' => ['React' => 4, 'TypeScript' => 3, 'JavaScript' => 4, 'Tailwind CSS' => 4, 'HTML' => 5, 'Git' => 3],
                'interests' => ['Web Development', 'Open Source'],
                'preferred_roles' => ['Frontend Developer'],
                'availability' => 12,
            ],
        ];

        $users = [];
        foreach ($studentsData as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                ]
            );

            CampusMembership::firstOrCreate(
                ['campus_id' => $polindra->id, 'user_id' => $user->id],
                [
                    'role' => CampusRole::Student,
                    'status' => MembershipStatus::Active,
                    'verification_status' => VerificationStatus::Verified,
                    'student_number' => $data['nim'],
                    'verified_at' => now(),
                    'verified_by' => $campusAdmin->id,
                ]
            );

            $profile = StudentProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'campus_id' => $polindra->id,
                    'slug' => Str::slug($data['name']) . '-' . substr($data['nim'], -4),
                    'department' => $data['dept'],
                    'study_program' => $data['program'],
                    'semester' => $data['semester'],
                    'bio' => $data['bio'],
                    'interests' => $data['interests'],
                    'preferred_roles' => $data['preferred_roles'],
                    'availability_hours' => $data['availability'],
                    'visibility' => Visibility::Campus,
                    'portfolio_public' => true,
                    'open_to_invites' => true,
                ]
            );

            // Sync skills
            foreach ($data['skills'] as $skillName => $prof) {
                $skill = Skill::resolve($skillName);
                $profile->skills()->syncWithoutDetaching([$skill->id => ['proficiency' => $prof]]);
            }

            $users[$data['email']] = $user;
        }

        // Student from ITB for tenant isolation test
        $itbStudent = User::firstOrCreate(
            ['email' => 'student@itb.ac.id'],
            [
                'name' => 'Gita Wijaya',
                'password' => Hash::make('password123'),
                'email_verified_at' => now(),
            ]
        );
        CampusMembership::firstOrCreate(
            ['campus_id' => $itb->id, 'user_id' => $itbStudent->id],
            [
                'role' => CampusRole::Student,
                'status' => MembershipStatus::Active,
                'verification_status' => VerificationStatus::Verified,
                'student_number' => '13522001',
                'verified_at' => now(),
            ]
        );
        StudentProfile::firstOrCreate(
            ['user_id' => $itbStudent->id],
            [
                'campus_id' => $itb->id,
                'slug' => 'gita-wijaya-2001',
                'department' => 'Teknik Informatika',
                'study_program' => 'Teknik Informatika',
                'semester' => 5,
                'bio' => 'ITB Computer Science student.',
                'visibility' => Visibility::Campus,
            ]
        );

        // 4. Projects in Polindra
        $leader = $users['ahmad.fauzi@student.polindra.ac.id'];
        $project1 = Project::firstOrCreate(
            ['slug' => 'agritani-smart-farming-polindra'],
            [
                'campus_id' => $polindra->id,
                'leader_id' => $leader->id,
                'title' => 'AgriTani — IoT & AI Smart Farming Platform',
                'short_description' => 'Platform monitoring pertanian berbasis IoT dan rekomendasi jadwal panen otomatis untuk petani mangga Indramayu.',
                'description' => 'Proyek pengembangan sistem pemantauan kelembapan tanah, cuaca mikro, dan deteksi hama daun berbasis computer vision untuk membantu petani lokal di Kabupaten Indramayu mengoptimalkan hasil panen mangga Gedong Gincu.',
                'category' => ProjectCategory::Startup,
                'problem_statement' => 'Petani mangga sering terlambat mendeteksi serangan hama dan ketidakstabilan kelembapan tanah, menyebabkan gagal panen hingga 30%.',
                'objectives' => '1. Membuat sensor node hemat energi.\n2. Mengembangkan mobile app pemantau.\n3. Melatih model deteksi hama.',
                'proposed_solution' => 'Sensor node LoRaWAN terhubung ke backend FastAPI dan aplikasi mobile Flutter dengan model on-device TFLite.',
                'tech_stack' => ['Flutter', 'Laravel', 'FastAPI', 'Python', 'MySQL', 'Docker'],
                'visibility' => Visibility::Campus,
                'status' => ProjectStatus::Recruiting,
                'progress' => 30,
                'starts_on' => now()->subMonths(1),
                'target_completion_on' => now()->addMonths(3),
            ]
        );

        // Required skills for project
        $reqSkills = ['Flutter' => 4, 'Python' => 3, 'UI/UX Design' => 4, 'Machine Learning' => 3];
        foreach ($reqSkills as $sName => $minProf) {
            $sk = Skill::resolve($sName);
            $project1->skills()->syncWithoutDetaching([$sk->id => ['min_proficiency' => $minProf]]);
        }

        // Team for Project 1
        $team1 = Team::firstOrCreate(
            ['project_id' => $project1->id],
            [
                'campus_id' => $polindra->id,
                'type' => TeamType::Project,
                'leader_id' => $leader->id,
                'name' => 'AgriTani Core Team',
                'description' => 'Tim pengembang inti AgriTani Polindra',
                'capacity' => 5,
            ]
        );

        // Leader member
        TeamMember::firstOrCreate(
            ['team_id' => $team1->id, 'user_id' => $leader->id],
            [
                'permission' => TeamPermission::Leader,
                'role_name' => 'Project Lead & Mobile Developer',
                'joined_at' => now()->subMonth(),
            ]
        );

        // Member 2: Siti Nurhaliza
        $siti = $users['siti.nur@student.polindra.ac.id'];
        TeamMember::firstOrCreate(
            ['team_id' => $team1->id, 'user_id' => $siti->id],
            [
                'permission' => TeamPermission::Member,
                'role_name' => 'UI/UX Designer',
                'joined_at' => now()->subWeeks(2),
            ]
        );

        // 5. Recruitment for Team 1
        $recruitment = Recruitment::firstOrCreate(
            ['team_id' => $team1->id],
            [
                'campus_id' => $polindra->id,
                'title' => 'Open Recruitment AgriTani: Backend & AI Engineer',
                'description' => 'Kami mencari Backend Developer dan AI Engineer untuk membangun pipeline data sensor dan klasifikasi citra hama.',
                'status' => RecruitmentStatus::Open,
                'closes_at' => now()->addDays(14),
            ]
        );

        $roleBackend = RecruitmentRole::firstOrCreate(
            ['recruitment_id' => $recruitment->id, 'name' => 'Backend Engineer'],
            [
                'slots' => 1,
                'requirements' => 'Pengalaman dengan REST API, Python/Laravel, dan relasional database.',
            ]
        );

        $roleAI = RecruitmentRole::firstOrCreate(
            ['recruitment_id' => $recruitment->id, 'name' => 'AI / Computer Vision Specialist'],
            [
                'slots' => 1,
                'requirements' => 'Menguasai Python, PyTorch/TensorFlow, dan preprocessing citra digital.',
            ]
        );

        // Sample application: Rian Pratama applies for Backend Engineer
        $rian = $users['rian.p@student.polindra.ac.id'];
        Application::firstOrCreate(
            ['recruitment_id' => $recruitment->id, 'user_id' => $rian->id],
            [
                'recruitment_role_id' => $roleBackend->id,
                'message' => 'Halo tim AgriTani, saya memiliki pengalaman membangun REST API menggunakan Python FastAPI dan Laravel untuk sistem IoT kampus.',
                'status' => ApplicationStatus::Pending,
            ]
        );

        // 6. Workspace Tasks & Milestones for Team 1
        $m1 = Milestone::firstOrCreate(
            ['team_id' => $team1->id, 'title' => 'Sprint 1: Desain & Arsitektur API'],
            [
                'campus_id' => $polindra->id,
                'created_by' => $leader->id,
                'description' => 'Menyelesaikan UI kit di Figma dan spesifikasi endpoint OpenAPI.',
                'starts_on' => now()->subWeeks(2),
                'due_on' => now()->addDays(3),
                'status' => MilestoneStatus::InProgress,
            ]
        );

        Task::firstOrCreate(
            ['team_id' => $team1->id, 'title' => 'Wireframing User Flow Aplikasi Mobile'],
            [
                'campus_id' => $polindra->id,
                'milestone_id' => $m1->id,
                'created_by' => $leader->id,
                'assignee_id' => $siti->id,
                'description' => 'Buat high-fidelity flow untuk dashboard petak sawah dan halaman grafik sensor.',
                'status' => TaskStatus::Completed,
                'priority' => TaskPriority::High,
                'due_on' => now()->subDays(2),
                'completed_at' => now()->subDays(2),
                'position' => 1,
            ]
        );

        Task::firstOrCreate(
            ['team_id' => $team1->id, 'title' => 'Setup Flutter Clean Architecture & Riverpod'],
            [
                'campus_id' => $polindra->id,
                'milestone_id' => $m1->id,
                'created_by' => $leader->id,
                'assignee_id' => $leader->id,
                'description' => 'Inisialisasi project Flutter dengan Dio, Riverpod, dan GoRouter.',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::High,
                'due_on' => now()->addDays(2),
                'position' => 2,
            ]
        );

        Task::firstOrCreate(
            ['team_id' => $team1->id, 'title' => 'Implementasi Ingestion Endpoint LoRa Gateway'],
            [
                'campus_id' => $polindra->id,
                'milestone_id' => $m1->id,
                'created_by' => $leader->id,
                'assignee_id' => null,
                'description' => 'Menunggu onboarding Backend Engineer terpilih.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::Medium,
                'due_on' => now()->addDays(7),
                'position' => 3,
            ]
        );

        // 7. Verified Competitions with real provenance
        $compGemastik = Competition::firstOrCreate(
            ['slug' => 'gemastik-xvii-2025-pengembangan-perangkat-lunak'],
            [
                'campus_id' => null, // Global scope
                'scope' => CompetitionScope::Global,
                'created_by' => $campusAdmin->id,
                'name' => 'GEMASTIK XVII — Divisi Pengembangan Perangkat Lunak',
                'organizer' => 'Pusat Prestasi Nasional (Puspresnas) & Kemendikbudristek',
                'description' => 'Pagelaran Mahasiswa Nasional Bidang Teknologi Informasi dan Komunikasi. Divisi Pengembangan Perangkat Lunak menantang mahasiswa menciptakan solusi aplikatif untuk permasalahan nasional.',
                'category' => CompetitionCategory::Innovation,
                'official_url' => 'https://puspresnas.kemdikbud.go.id',
                'registration_url' => 'https://gemastik.kemdikbud.go.id',
                'registration_opens_at' => now()->subMonth(),
                'registration_deadline' => now()->addMonths(2),
                'starts_at' => now()->addMonths(2),
                'ends_at' => now()->addMonths(3),
                'eligibility' => 'Mahasiswa aktif D3/D4/S1 seluruh perguruan tinggi di Indonesia terdaftar di PDDIKTI.',
                'min_team_size' => 3,
                'max_team_size' => 3,
                'prize_info' => 'Medali Emas/Perak/Perunggu + Sertifikat Puspresnas + Uang Pembinaan',
                'status' => CompetitionStatus::Open,
                'verification_status' => VerificationStatus::Verified,
                'last_verified_at' => now()->subDays(3),
                'verified_by' => $campusAdmin->id,
            ]
        );

        CompetitionSource::firstOrCreate(
            ['competition_id' => $compGemastik->id, 'url' => 'https://puspresnas.kemdikbud.go.id/pedoman-gemastik'],
            [
                'label' => 'Buku Panduan Resmi GEMASTIK XVII Puspresnas',
                'notes' => 'Diverifikasi langsung dari dokumen resmi Puspresnas tahun berjalan.',
                'verified_at' => now()->subDays(3),
                'verified_by' => $campusAdmin->id,
            ]
        );

        // Link AgriTani Project & Team to GEMASTIK Participation
        CompetitionParticipation::firstOrCreate(
            ['competition_id' => $compGemastik->id, 'team_id' => $team1->id],
            [
                'project_id' => $project1->id,
                'registration_status' => 'planning',
                'submission_status' => 'in_progress',
                'progress_status' => 'preparing',
            ]
        );
    }
}
