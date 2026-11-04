<?php

namespace Tests\Feature;

use App\Enums\ProjectStatus;
use App\Models\AcademicClass;
use App\Models\Achievement;
use App\Models\Campus;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Skill;
use App\Models\StudentProfile;
use App\Models\Team;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectHubLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private Campus $campus;
    private User $leadLecturer;
    private User $coLecturer;
    private User $studentLeader;
    private User $studentMember;
    private AcademicClass $academicClass;

    protected function setUp(): void
    {
        parent::setUp();

        $this->campus = Campus::create([
            'name' => 'Politeknik Negeri Indramayu',
            'slug' => 'polindra',
        ]);

        $this->leadLecturer = User::factory()->create([
            'name' => 'Dr. Budi Santoso',
            'email' => 'budi@polindra.ac.id',
        ]);
        \App\Models\CampusMembership::create([
            'user_id' => $this->leadLecturer->id,
            'campus_id' => $this->campus->id,
            'role' => 'lecturer',
            'status' => 'active',
        ]);

        $this->coLecturer = User::factory()->create([
            'name' => 'Dewi Lestari, M.Kom',
            'email' => 'dewi@polindra.ac.id',
        ]);
        \App\Models\CampusMembership::create([
            'user_id' => $this->coLecturer->id,
            'campus_id' => $this->campus->id,
            'role' => 'lecturer',
            'status' => 'active',
        ]);

        $this->studentLeader = User::factory()->create([
            'name' => 'Ahmad Fauzi',
            'email' => 'ahmad@student.polindra.ac.id',
        ]);
        \App\Models\CampusMembership::create([
            'user_id' => $this->studentLeader->id,
            'campus_id' => $this->campus->id,
            'student_number' => '2105001',
            'role' => 'student',
            'status' => 'active',
        ]);

        $this->studentMember = User::factory()->create([
            'name' => 'Siti Nurhaliza',
            'email' => 'siti@student.polindra.ac.id',
        ]);
        \App\Models\CampusMembership::create([
            'user_id' => $this->studentMember->id,
            'campus_id' => $this->campus->id,
            'student_number' => '2105002',
            'role' => 'student',
            'status' => 'active',
        ]);

        // Student profiles
        $skill1 = Skill::create(['name' => 'Laravel', 'slug' => 'laravel']);
        $skill2 = Skill::create(['name' => 'React', 'slug' => 'react']);

        $profileLeader = StudentProfile::create([
            'user_id' => $this->studentLeader->id,
            'campus_id' => $this->campus->id,
            'slug' => 'student-leader-'.$this->studentLeader->id,
            'student_number' => '2105001',
            'department' => 'Teknik Informatika',
            'study_program' => 'Teknik Informatika',
            'semester' => 5,
            'interests' => ['Web Development', 'Artificial Intelligence'],
            'preferred_roles' => ['Backend Developer'],
            'availability_hours' => 20,
        ]);
        $profileLeader->skills()->attach([$skill1->id => ['proficiency' => 4], $skill2->id => ['proficiency' => 3]]);

        $profileMember = StudentProfile::create([
            'user_id' => $this->studentMember->id,
            'campus_id' => $this->campus->id,
            'slug' => 'student-member-'.$this->studentMember->id,
            'student_number' => '2105002',
            'department' => 'Teknik Informatika',
            'study_program' => 'Teknik Informatika',
            'semester' => 5,
            'interests' => ['Web Development', 'UI/UX Design'],
            'preferred_roles' => ['Frontend Developer'],
            'availability_hours' => 15,
        ]);
        $profileMember->skills()->attach([$skill1->id => ['proficiency' => 2], $skill2->id => ['proficiency' => 4]]);

        // Academic class setup
        $this->academicClass = AcademicClass::create([
            'campus_id' => $this->campus->id,
            'lecturer_id' => $this->leadLecturer->id,
            'name' => 'Proyek Perangkat Lunak TI-3A',
            'code' => 'TI3A-PPL',
            'target_team_size' => 3,
            'academic_year' => '2026/2027',
            'semester' => 'Ganjil',
            'status' => 'active',
        ]);

        // Enroll students
        $this->academicClass->students()->attach([
            $this->studentLeader->id => ['student_number' => '2105001', 'status' => 'enrolled'],
            $this->studentMember->id => ['student_number' => '2105002', 'status' => 'enrolled'],
        ]);
    }

    public function test_multi_lecturer_assignment_to_academic_class(): void
    {
        // 1. Lead lecturer adds co-lecturer
        $this->actingAs($this->leadLecturer)
            ->post("/classes/{$this->academicClass->id}/co-lecturers", [
                'lecturer_identifier' => $this->coLecturer->email,
                'role' => 'co_lecturer',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->academicClass->refresh();
        $this->assertTrue($this->academicClass->isLecturer($this->coLecturer));
        $this->assertCount(1, $this->academicClass->coLecturers);
    }

    public function test_complete_project_hub_lifecycle_flow(): void
    {
        // 1. Assign co-lecturer to class
        $this->academicClass->coLecturers()->attach($this->coLecturer->id, ['role' => 'co_lecturer']);

        // 2. Student Leader creates project with requirements within class
        $projectResponse = $this->actingAs($this->studentLeader)
            ->post('/projects', [
                'title' => 'Sistem Rekam Medis Kampus',
                'category' => 'academic',
                'academic_class_id' => $this->academicClass->id,
                'short_description' => 'Aplikasi pengelolaan rekam medis mahasiswa dan sivitas akademika.',
                'problem_statement' => 'Antrean panjang di klinik kampus.',
                'proposed_solution' => 'Digitalisasi rekam medis.',
                'capacity' => 3,
            ]);

        $projectResponse->assertRedirect();
        $project = Project::with(['team.recruitment.roles'])->where('title', 'Sistem Rekam Medis Kampus')->firstOrFail();
        $this->assertEquals(ProjectStatus::Recruiting, $project->status);
        $this->assertEquals($this->academicClass->id, $project->academic_class_id);
        $this->assertEquals($this->studentLeader->id, $project->leader_id);

        // 3. Project Workspace is LOCKED before team confirmation
        $teamId = $project->team->id;
        $workspaceResponse = $this->actingAs($this->studentLeader)->get("/workspace/{$teamId}");
        $workspaceResponse->assertRedirect("/projects/{$project->id}");
        $workspaceResponse->assertSessionHas('warning');

        // 4. Student Member applies and Leader accepts (Strict Rule 1)
        $role = $project->team->recruitment->roles->first();
        $this->actingAs($this->studentMember)
            ->post("/projects/{$project->id}/apply", [
                'recruitment_role_id' => $role->id,
                'message' => 'Saya mahir React dan siap berkontribusi!',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $application = $project->team->recruitment->applications()->first();
        $this->actingAs($this->studentLeader)
            ->post("/projects/{$project->id}/applications/{$application->id}/respond", [
                'action' => 'accept',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        // Verify Student Member has active project membership
        $this->assertTrue($this->studentMember->hasActiveProject());

        // 5. Team Confirmation & Activation by Leader/Lecturer
        $this->actingAs($this->studentLeader)
            ->post("/projects/{$project->id}/activate-team")
            ->assertRedirect("/workspace/{$teamId}")
            ->assertSessionHas('success');

        $project->refresh();
        $this->assertEquals(ProjectStatus::InProgress, $project->status);

        // 6. Project Workspace is now UNLOCKED
        $this->actingAs($this->studentMember)
            ->get("/workspace/{$teamId}")
            ->assertOk();

        // 7. Team submits Final Project Deliverables
        $this->actingAs($this->studentLeader)
            ->post("/projects/{$project->id}/submit-final", [
                'repository_url' => 'https://github.com/polindra/rekam-medis',
                'demo_url' => 'https://rekam-medis.polindra.ac.id',
                'submission_notes' => 'Seluruh fitur rekam medis, antrean, dan resep digital telah selesai diimplementasikan dan lolos testing.',
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $project->refresh();
        $this->assertNotNull($project->submitted_at);
        $this->assertEquals(100, $project->progress);

        // 8. Lecturer Evaluates & Formally Completes Project
        $this->actingAs($this->coLecturer)
            ->post("/projects/{$project->id}/evaluate", [
                'lecturer_evaluation' => 'A (Sangat Memuaskan)',
                'lecturer_notes' => 'Implementasi arsitektur sangat baik, dokumentasi API lengkap, dan kolaborasi tim solid.',
                'complete_project' => true,
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $project->refresh();
        $this->assertEquals(ProjectStatus::Completed, $project->status);
        $this->assertEquals('A (Sangat Memuaskan)', $project->lecturer_evaluation);

        // 9. Active project restriction is RELEASED for all members
        $this->assertFalse($this->studentLeader->fresh()->hasActiveProject());
        $this->assertFalse($this->studentMember->fresh()->hasActiveProject());

        // 10. Verified Portfolio Achievement is recorded
        $achievement = Achievement::where('user_id', $this->studentMember->id)
            ->where('project_id', $project->id)
            ->first();

        $this->assertNotNull($achievement);
        $this->assertEquals(\App\Enums\AchievementVerification::Verified, $achievement->verification_status);
        $this->assertEquals($this->coLecturer->id, $achievement->verified_by);
    }
}
