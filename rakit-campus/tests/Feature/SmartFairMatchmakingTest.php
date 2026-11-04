<?php

namespace Tests\Feature;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\SkillType;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\Visibility;
use App\Models\AcademicClass;
use App\Models\AcademicClassStudent;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\MatchingSession;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Skill;
use App\Models\StudentProfile;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Matchmaking\AllocationService;
use App\Services\Matchmaking\EligibilityService;
use App\Services\Matchmaking\FairnessAnalyticsService;
use App\Services\Matchmaking\FairnessScoringService;
use App\Services\Matchmaking\MatchmakingEngine;
use App\Services\Matchmaking\MembershipService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class SmartFairMatchmakingTest extends TestCase
{
    use RefreshDatabase;

    protected Campus $campus;
    protected User $lecturer;
    protected AcademicClass $academicClass;
    protected Skill $laravelSkill;
    protected Skill $reactSkill;

    protected function setUp(): void
    {
        parent::setUp();

        $this->campus = Campus::create([
            'name' => 'Politeknik Negeri Indramayu',
            'slug' => 'polindra',
            'domain' => 'polindra.ac.id',
        ]);

        $this->lecturer = User::factory()->create([
            'name' => 'Dosen Pengampu',
            'email' => 'dosen@polindra.ac.id',
        ]);

        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->lecturer->id,
            'role' => CampusRole::Lecturer->value,
            'status' => MembershipStatus::Active->value,
        ]);

        $this->academicClass = AcademicClass::create([
            'campus_id' => $this->campus->id,
            'lecturer_id' => $this->lecturer->id,
            'name' => 'Pemrograman Web Lanjut (TI-3A)',
            'code' => 'TI3A-PWL',
            'join_code' => 'PWL123',
            'study_program' => 'Teknik Informatika',
            'academic_year' => '2026/2027',
            'semester' => 'Ganjil',
            'target_team_size' => 4,
            'status' => 'active',
        ]);

        $this->laravelSkill = Skill::create([
            'name' => 'Laravel',
            'slug' => 'laravel',
            'type' => SkillType::Technical->value,
        ]);

        $this->reactSkill = Skill::create([
            'name' => 'React',
            'slug' => 'react',
            'type' => SkillType::Technical->value,
        ]);
    }

    protected function createStudentUser(string $name, string $email): User
    {
        $user = User::factory()->create([
            'name' => $name,
            'email' => $email,
        ]);

        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $user->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'student_number' => '2203' . rand(1000, 9999),
        ]);

        $profile = StudentProfile::create([
            'user_id' => $user->id,
            'campus_id' => $this->campus->id,
            'slug' => 'student-' . $user->id,
            'department' => 'Teknik Informatika',
            'study_program' => 'Teknik Informatika',
            'semester' => 4,
            'interests' => ['Web Development', 'Artificial Intelligence'],
            'preferred_roles' => ['Backend Developer', 'Fullstack Developer'],
            'availability_hours' => 12,
        ]);

        $profile->skills()->attach($this->laravelSkill->id, ['proficiency' => 4]);
        $profile->skills()->attach($this->reactSkill->id, ['proficiency' => 3]);

        AcademicClassStudent::create([
            'academic_class_id' => $this->academicClass->id,
            'user_id' => $user->id,
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);

        return $user;
    }

    protected function createProjectWithTeam(string $title, User $leader): Project
    {
        $project = Project::create([
            'campus_id' => $this->campus->id,
            'academic_class_id' => $this->academicClass->id,
            'leader_id' => $leader->id,
            'title' => $title,
            'slug' => 'project-' . rand(100, 999),
            'short_description' => 'Deskripsi proyek pengujian.',
            'category' => ProjectCategory::Academic->value,
            'difficulty' => 'intermediate',
            'min_team_size' => 2,
            'max_team_size' => 4,
            'status' => ProjectStatus::InProgress->value,
            'visibility' => Visibility::Campus->value,
            'starts_on' => now(),
        ]);

        $project->skills()->attach($this->laravelSkill->id, ['min_proficiency' => 3]);
        $project->skills()->attach($this->reactSkill->id, ['min_proficiency' => 2]);

        $team = Team::create([
            'campus_id' => $this->campus->id,
            'project_id' => $project->id,
            'leader_id' => $leader->id,
            'type' => TeamType::Project->value,
            'name' => "Tim {$title}",
            'capacity' => 4,
        ]);

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $leader->id,
            'permission' => TeamPermission::Leader->value,
            'status' => 'active',
            'role_name' => 'Ketua Tim',
            'joined_at' => now(),
        ]);

        $recruitment = Recruitment::create([
            'campus_id' => $this->campus->id,
            'team_id' => $team->id,
            'title' => "Rekrutmen {$title}",
            'status' => 'open',
        ]);

        RecruitmentRole::create([
            'recruitment_id' => $recruitment->id,
            'name' => 'Backend Developer',
            'slots' => 2,
        ]);

        return $project;
    }

    public function test_rule_1_student_without_active_project_can_apply_and_be_accepted(): void
    {
        $leader = $this->createStudentUser('Ketua A', 'ketua.a@polindra.ac.id');
        $applicant = $this->createStudentUser('Pelamar B', 'pelamar.b@polindra.ac.id');
        $project = $this->createProjectWithTeam('Sistem Antigravity', $leader);

        $membershipService = app(MembershipService::class);
        $role = $project->team->recruitment->roles->first();

        // 1. Submit application
        $application = $membershipService->applyToProject($applicant, $project, $role, 'Tertarik berkontribusi.');
        $this->assertEquals('pending', $application->status->value);

        // 2. Accept application
        $member = $membershipService->acceptApplication($application, $leader);
        $this->assertEquals('active', $member->status);
        $this->assertTrue($applicant->hasActiveProject());
    }

    public function test_rule_1_student_with_active_project_cannot_join_another_active_project(): void
    {
        $leader1 = $this->createStudentUser('Ketua 1', 'ketua1@polindra.ac.id');
        $leader2 = $this->createStudentUser('Ketua 2', 'ketua2@polindra.ac.id');
        $student = $this->createStudentUser('Mahasiswa C', 'mhs.c@polindra.ac.id');

        $project1 = $this->createProjectWithTeam('Proyek Pertama', $leader1);
        $project2 = $this->createProjectWithTeam('Proyek Kedua', $leader2);

        $membershipService = app(MembershipService::class);

        // Join project 1
        $app1 = $membershipService->applyToProject($student, $project1);
        $membershipService->acceptApplication($app1, $leader1);
        $this->assertTrue($student->fresh()->hasActiveProject());

        // Attempt to apply/join project 2 while active in project 1
        $this->expectException(ValidationException::class);
        $membershipService->applyToProject($student, $project2);
    }

    public function test_rule_1_student_with_active_project_cannot_create_another_project(): void
    {
        $leader = $this->createStudentUser('Ketua X', 'ketuax@polindra.ac.id');
        $this->createProjectWithTeam('Proyek Awal', $leader);

        $this->actingAs($leader);

        // Try creating another project via HTTP
        $response = $this->post(route('projects.store'), [
            'title' => 'Proyek Ilegal Kedua',
            'short_description' => 'Mencoba bypass aturan 1 proyek.',
            'category' => ProjectCategory::Academic->value,
            'academic_class_id' => $this->academicClass->id,
        ]);

        $response->assertSessionHasErrors(['title']);
    }

    public function test_completed_membership_releases_the_active_project_restriction(): void
    {
        $leader = $this->createStudentUser('Ketua Lama', 'ketua.lama@polindra.ac.id');
        $student = $this->createStudentUser('Mahasiswa Lulus', 'mhs.lulus@polindra.ac.id');
        $project1 = $this->createProjectWithTeam('Proyek Semester 3', $leader);

        $membershipService = app(MembershipService::class);
        $app1 = $membershipService->applyToProject($student, $project1);
        $membershipService->acceptApplication($app1, $leader);
        $this->assertTrue($student->fresh()->hasActiveProject());

        // Formally complete project 1
        $membershipService->completeProject($project1);

        // Active project restriction is now released!
        $this->assertFalse($student->fresh()->hasActiveProject());

        // Can now join a new project
        $leader2 = $this->createStudentUser('Ketua Baru', 'ketua.baru@polindra.ac.id');
        $project2 = $this->createProjectWithTeam('Proyek Semester 4', $leader2);
        $app2 = $membershipService->applyToProject($student, $project2);
        $member2 = $membershipService->acceptApplication($app2, $leader2);
        $this->assertEquals('active', $member2->status);
    }

    public function test_matchmaking_engine_calculates_all_six_scoring_components(): void
    {
        $leader = $this->createStudentUser('Ketua Rekom', 'ketua.rekom@polindra.ac.id');
        $candidate = $this->createStudentUser('Kandidat Hebat', 'kandidat@polindra.ac.id');
        $project = $this->createProjectWithTeam('Smart Campus AI', $leader);

        $engine = app(MatchmakingEngine::class);
        $recommendations = $engine->recommendProjectsForStudent($candidate, $this->academicClass);

        $this->assertNotEmpty($recommendations);
        $top = $recommendations[0];

        $this->assertGreaterThanOrEqual(50, $top['match_score']);
        $this->assertArrayHasKey('skill', $top['breakdown']);
        $this->assertArrayHasKey('role', $top['breakdown']);
        $this->assertArrayHasKey('interest', $top['breakdown']);
        $this->assertArrayHasKey('availability', $top['breakdown']);
        $this->assertArrayHasKey('diversity', $top['breakdown']);
        $this->assertArrayHasKey('fairness', $top['breakdown']);
        $this->assertNotEmpty($top['explanation']);
    }

    public function test_fairness_scoring_boosts_first_timers_and_rejected_students(): void
    {
        $student = $this->createStudentUser('Mahasiswa Baru', 'mhs.baru@polindra.ac.id');
        $fairnessService = app(FairnessScoringService::class);

        $result = $fairnessService->computeFairnessScore($student);
        $this->assertTrue($result['details']['is_first_timer']);
        $this->assertGreaterThanOrEqual(65, $result['score']);
    }

    public function test_mode_c_simulation_and_lecturer_approval_flow(): void
    {
        $leader1 = $this->createStudentUser('Lead 1', 'lead1@polindra.ac.id');
        $student1 = $this->createStudentUser('Unassigned 1', 'unassigned1@polindra.ac.id');
        $student2 = $this->createStudentUser('Unassigned 2', 'unassigned2@polindra.ac.id');

        $project1 = $this->createProjectWithTeam('Proyek Kelas A', $leader1);

        $allocationService = app(AllocationService::class);

        // 1. Run simulation
        $session = $allocationService->simulateClassAllocation($this->academicClass, $this->lecturer);
        $this->assertEquals('simulation', $session->status);
        $this->assertNotEmpty($session->allocations);

        // Verify unassigned students are not yet active team members
        $this->assertFalse($student1->fresh()->hasActiveProject());

        // 2. Lecturer approves simulation
        $allocationService->approveAndActivate($session, $this->lecturer);
        $session->refresh();

        $this->assertEquals('approved', $session->status);
        $this->assertNotNull($session->approved_at);

        // Now members are formally activated!
        $this->assertTrue($student1->fresh()->hasActiveProject());
    }

    public function test_fairness_analytics_computes_accurate_metrics(): void
    {
        $leader = $this->createStudentUser('Lead Ana', 'lead.ana@polindra.ac.id');
        $this->createStudentUser('Unassigned Ana', 'unassigned.ana@polindra.ac.id');
        $this->createProjectWithTeam('Proyek Analitik', $leader);

        $analyticsService = app(FairnessAnalyticsService::class);
        $metrics = $analyticsService->computeClassFairnessMetrics($this->academicClass);

        $this->assertArrayHasKey('overview', $metrics);
        $this->assertArrayHasKey('fairness_indicators', $metrics);
        $this->assertGreaterThan(0, $metrics['overview']['total_eligible_students']);
        $this->assertGreaterThan(0, $metrics['overview']['assigned_students_count']);
        $this->assertGreaterThan(0, $metrics['overview']['unassigned_students_count']);
    }
}
