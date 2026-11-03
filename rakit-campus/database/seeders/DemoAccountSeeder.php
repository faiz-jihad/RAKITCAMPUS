<?php

namespace Database\Seeders;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Enums\Visibility;
use App\Models\Campus;
use App\Models\CampusMembership;
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

class DemoAccountSeeder extends Seeder
{
    public function run(): void
    {
        $polindra = Campus::firstOrCreate(
            ['slug' => 'polindra'],
            [
                'name' => 'Politeknik Negeri Indramayu',
                'domain' => 'polindra.ac.id',
                'is_active' => true,
            ]
        );

        $passwordHash = Hash::make('password123');

        // 1. Super Admin
        $superAdmin = User::updateOrCreate(
            ['email' => 'superadmin@rakitcampus.id'],
            [
                'name' => 'Platform Super Admin',
                'password' => $passwordHash,
                'is_platform_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        // 2. Campus Admin
        $campusAdmin = User::updateOrCreate(
            ['email' => 'admin@polindra.ac.id'],
            [
                'name' => 'Budi Santoso, M.Kom (Admin)',
                'password' => $passwordHash,
                'is_platform_admin' => false,
                'email_verified_at' => now(),
            ]
        );

        CampusMembership::updateOrCreate(
            ['campus_id' => $polindra->id, 'user_id' => $campusAdmin->id],
            [
                'role' => CampusRole::CampusAdmin,
                'status' => MembershipStatus::Active,
                'verification_status' => VerificationStatus::Verified,
                'verified_at' => now(),
            ]
        );

        // 3. Demo Students
        $demoStudents = [
            [
                'email' => 'budi@polindra.ac.id',
                'name' => 'Budi Santoso',
                'nim' => '2201091',
                'dept' => 'Teknik Informatika',
                'program' => 'Teknik Informatika',
                'semester' => 5,
                'bio' => 'IoT Engineer & Project Leader. Fokus pada solusi embedded system dan smart devices.',
                'skills' => ['IoT' => 5, 'Python' => 4, 'C++' => 4, 'Arduino' => 5, 'Team Leadership' => 5, 'Git' => 4],
                'interests' => ['Smart Agriculture', 'IoT', 'Hardware'],
                'preferred_roles' => ['Project Leader', 'IoT Engineer'],
                'availability' => 20,
            ],
            [
                'email' => 'siti@polindra.ac.id',
                'name' => 'Siti Rahma',
                'nim' => '2201092',
                'dept' => 'Teknik Informatika',
                'program' => 'Teknik Informatika',
                'semester' => 5,
                'bio' => 'Mobile Flutter Developer & UI/UX enthusiast. Berpengalaman membangun aplikasi cross-platform.',
                'skills' => ['Flutter' => 5, 'Dart' => 5, 'UI/UX Design' => 4, 'Figma' => 4, 'REST API' => 4, 'Git' => 4],
                'interests' => ['Mobile App', 'UI/UX Design', 'EdTech'],
                'preferred_roles' => ['Mobile Developer', 'UI/UX Designer'],
                'availability' => 18,
            ],
            [
                'email' => 'agus@polindra.ac.id',
                'name' => 'Agus Prasetyo',
                'nim' => '2202093',
                'dept' => 'Teknik Informatika',
                'program' => 'Rekayasa Perangkat Lunak',
                'semester' => 5,
                'bio' => 'Backend Architect & Cloud enthusiast. Terbiasa dengan Laravel, PostgreSQL, Docker, dan CI/CD.',
                'skills' => ['Laravel' => 5, 'PHP' => 5, 'PostgreSQL' => 4, 'MySQL' => 5, 'Docker' => 4, 'REST API' => 5],
                'interests' => ['Backend Development', 'Cloud Computing', 'Clean Architecture'],
                'preferred_roles' => ['Backend Developer', 'System Architect'],
                'availability' => 22,
            ],
            [
                'email' => 'dewi@polindra.ac.id',
                'name' => 'Dewi Lestari',
                'nim' => '2301094',
                'dept' => 'Teknik Informatika',
                'program' => 'Sistem Informasi Kota Cerdas',
                'semester' => 3,
                'bio' => 'Smart City & Data Specialist. Passionate in data visualization, React, dan IoT dashboard.',
                'skills' => ['React' => 4, 'TypeScript' => 4, 'Data Analysis' => 4, 'Tailwind CSS' => 5, 'Python' => 3],
                'interests' => ['Smart City', 'Frontend Development', 'Open Data'],
                'preferred_roles' => ['Frontend Developer', 'Data Analyst'],
                'availability' => 15,
            ],
        ];

        $users = [];
        foreach ($demoStudents as $studentData) {
            $user = User::updateOrCreate(
                ['email' => $studentData['email']],
                [
                    'name' => $studentData['name'],
                    'password' => $passwordHash,
                    'is_platform_admin' => false,
                    'email_verified_at' => now(),
                ]
            );

            CampusMembership::updateOrCreate(
                ['campus_id' => $polindra->id, 'user_id' => $user->id],
                [
                    'role' => CampusRole::Student,
                    'status' => MembershipStatus::Active,
                    'verification_status' => VerificationStatus::Verified,
                    'student_number' => $studentData['nim'],
                    'verified_at' => now(),
                ]
            );

            $profile = StudentProfile::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'campus_id' => $polindra->id,
                    'slug' => Str::slug($studentData['name']) . '-' . substr($studentData['nim'], -4),
                    'department' => $studentData['dept'],
                    'study_program' => $studentData['program'],
                    'semester' => $studentData['semester'],
                    'bio' => $studentData['bio'],
                    'interests' => $studentData['interests'],
                    'preferred_roles' => $studentData['preferred_roles'],
                    'availability_hours' => $studentData['availability'],
                    'visibility' => Visibility::Campus,
                    'portfolio_public' => true,
                    'open_to_invites' => true,
                ]
            );

            foreach ($studentData['skills'] as $skillName => $prof) {
                $skill = Skill::resolve($skillName);
                $profile->skills()->syncWithoutDetaching([$skill->id => ['proficiency' => $prof]]);
            }

            $users[$studentData['email']] = $user;
        }

        // 4. Create / Ensure Primary Demo Project: Smart Waste Management
        $leader = $users['budi@polindra.ac.id'];
        $project = Project::updateOrCreate(
            ['title' => 'Smart Waste Management IoT Polindra'],
            [
                'campus_id' => $polindra->id,
                'leader_id' => $leader->id,
                'slug' => 'smart-waste-management-iot-polindra',
                'category' => ProjectCategory::Startup,
                'status' => ProjectStatus::Recruiting,
                'visibility' => Visibility::Public,
                'short_description' => 'Sistem monitoring volume tempat sampah pintar berbasis IoT LoRaWAN untuk efisiensi kebersihan kampus Polindra.',
                'problem_statement' => "Pengelolaan sampah di area kampus Politeknik Negeri Indramayu masih dilakukan secara manual dan periodik tanpa sensor deteksi kepenuhan tempat sampah.\n\nHal ini kerap menimbulkan keterlambatan pengangkutan dan penumpukan sampah di titik-titik ramai.",
                'proposed_solution' => "Mengembangkan perangkat sensor ultrasonik terhubung mikrokontroler ESP32 dengan transmisi data LoRaWAN.\n\nDashboard web dan mobile akan memberikan peringatan real-time saat volume melebihi kapasitas 80%.",
                'tech_stack' => ['IoT', 'ESP32', 'LoRaWAN', 'Laravel', 'Flutter', 'PostgreSQL'],
                'target_completion_date' => now()->addMonths(3),
                'progress' => 45,
            ]
        );

        // Attach Project Skills
        foreach (['IoT', 'Flutter', 'Laravel', 'Python'] as $sName) {
            $s = Skill::resolve($sName);
            $project->skills()->syncWithoutDetaching([$s->id => ['min_proficiency' => 3, 'is_mandatory' => true]]);
        }

        // Create Team for Project
        $team = Team::updateOrCreate(
            ['project_id' => $project->id],
            [
                'campus_id' => $polindra->id,
                'leader_id' => $leader->id,
                'name' => 'Tim Inovasi Smart Waste Polindra',
                'description' => 'Tim pengembang perangkat cerdas dan dashboard monitoring kebersihan kampus.',
                'type' => TeamType::Project,
                'capacity' => 5,
            ]
        );

        // Leader Member
        TeamMember::updateOrCreate(
            ['team_id' => $team->id, 'user_id' => $leader->id],
            [
                'role_name' => 'Project Leader & Hardware Architect',
                'permission' => TeamPermission::Leader,
                'joined_at' => now(),
            ]
        );

        // Add Siti (Mobile) as member
        $siti = $users['siti@polindra.ac.id'];
        TeamMember::updateOrCreate(
            ['team_id' => $team->id, 'user_id' => $siti->id],
            [
                'role_name' => 'Mobile Flutter Developer',
                'permission' => TeamPermission::Member,
                'joined_at' => now(),
            ]
        );

        // Create Recruitment & Roles
        $recruitment = Recruitment::updateOrCreate(
            ['team_id' => $team->id],
            [
                'title' => 'Open Recruitment Tim Inovasi Smart Waste Polindra',
                'description' => 'Mencari rekan tim berbakat di bidang Backend Architecture dan Frontend Dashboard.',
                'status' => RecruitmentStatus::Open,
                'deadline' => now()->addWeeks(3),
            ]
        );

        $backendRole = RecruitmentRole::firstOrCreate(
            ['recruitment_id' => $recruitment->id, 'name' => 'Backend Engineer'],
            [
                'slots' => 1,
                'filled_slots' => 0,
                'requirements' => 'Menguasai Laravel/PHP, PostgreSQL, dan REST API integration.',
            ]
        );

        $frontendRole = RecruitmentRole::firstOrCreate(
            ['recruitment_id' => $recruitment->id, 'name' => 'Frontend Dashboard Specialist'],
            [
                'slots' => 1,
                'filled_slots' => 0,
                'requirements' => 'Menguasai React/TypeScript, Tailwind CSS, dan visualisasi chart.',
            ]
        );

        // Create Active Tasks on Kanban
        $tasksData = [
            [
                'title' => 'Competitive Analysis & Hackathon Pitch Deck',
                'description' => 'Riset komparasi solusi smart waste di kampus lain dan susun slide presentasi.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::High,
                'assignee_id' => $leader->id,
                'position' => 1,
            ],
            [
                'title' => 'Perancangan Skema Database Sensor & Telemetri',
                'description' => 'Desain tabel time-series PostgreSQL untuk menyimpan log pembacaan sensor.',
                'status' => TaskStatus::Todo,
                'priority' => TaskPriority::Medium,
                'assignee_id' => null,
                'position' => 2,
            ],
            [
                'title' => 'Integrasi API Flutter dengan Auth Sanctum',
                'description' => 'Implementasi modul login dan sinkronisasi token di aplikasi mobile.',
                'status' => TaskStatus::InProgress,
                'priority' => TaskPriority::High,
                'assignee_id' => $siti->id,
                'position' => 1,
            ],
            [
                'title' => 'Wiring Sensor Ultrasonik ke ESP32',
                'description' => 'Perakitan prototipe perangkat keras di laboratorium IoT Polindra.',
                'status' => TaskStatus::InReview,
                'priority' => TaskPriority::Urgent,
                'assignee_id' => $leader->id,
                'position' => 1,
            ],
            [
                'title' => 'Setup Repository & Standardisasi Design System',
                'description' => 'Inisialisasi monorepo Laravel 12 + Inertia React dengan Tailwind CSS.',
                'status' => TaskStatus::Completed,
                'priority' => TaskPriority::Medium,
                'assignee_id' => $leader->id,
                'position' => 1,
            ],
        ];

        foreach ($tasksData as $td) {
            Task::updateOrCreate(
                ['team_id' => $team->id, 'title' => $td['title']],
                [
                    'description' => $td['description'],
                    'status' => $td['status'],
                    'priority' => $td['priority'],
                    'assignee_id' => $td['assignee_id'],
                    'position' => $td['position'],
                ]
            );
        }
    }
}
