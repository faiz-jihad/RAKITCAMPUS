<?php

namespace Tests\Feature;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Enums\Visibility;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WebPageRenderTest extends TestCase
{
    use RefreshDatabase;

    protected Campus $campus;
    protected User $student;
    protected User $campusAdmin;
    protected Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        $this->campus = Campus::create(['name' => 'Polindra', 'slug' => 'polindra']);

        $this->student = User::factory()->create();
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->student->id,
            'role' => CampusRole::Student,
            'status' => MembershipStatus::Active,
            'verification_status' => VerificationStatus::Verified,
            'student_number' => '2105001',
        ]);
        $studentProfile = StudentProfile::create([
            'user_id' => $this->student->id,
            'campus_id' => $this->campus->id,
            'slug' => 'student-test',
            'department' => 'Teknik Informatika',
            'study_program' => 'Rekayasa Perangkat Lunak',
            'availability_hours' => 20,
            'visibility' => Visibility::Campus,
        ]);
        $s1 = \App\Models\Skill::firstOrCreate(['slug' => 'laravel'], ['name' => 'Laravel', 'category' => 'backend']);
        $s2 = \App\Models\Skill::firstOrCreate(['slug' => 'react'], ['name' => 'React', 'category' => 'frontend']);
        $studentProfile->skills()->attach([$s1->id, $s2->id]);

        $this->campusAdmin = User::factory()->create();
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->campusAdmin->id,
            'role' => CampusRole::CampusAdmin,
            'status' => MembershipStatus::Active,
            'verification_status' => VerificationStatus::Verified,
        ]);

        $this->project = Project::create([
            'campus_id' => $this->campus->id,
            'leader_id' => $this->student->id,
            'title' => 'Project Polindra Test',
            'slug' => 'project-test',
            'short_description' => 'Test project',
            'category' => ProjectCategory::Academic,
            'visibility' => Visibility::Campus,
            'status' => ProjectStatus::Recruiting,
        ]);

        $team = Team::create([
            'campus_id' => $this->campus->id,
            'project_id' => $this->project->id,
            'leader_id' => $this->student->id,
            'name' => 'Team Test',
            'type' => TeamType::Project,
        ]);

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->student->id,
            'permission' => TeamPermission::Leader,
        ]);
    }

    public function test_student_can_visit_project_hub_pages(): void
    {
        $this->actingAs($this->student)
            ->get('/projects')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('projects/index'));

        $this->actingAs($this->student)
            ->get('/projects/create')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('projects/create'));

        $this->actingAs($this->student)
            ->get("/projects/{$this->project->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('projects/show'));
    }

    public function test_student_can_visit_competitions_and_matching(): void
    {
        $this->actingAs($this->student)
            ->get('/competitions')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('competitions/index'));

        $this->actingAs($this->student)
            ->get('/matching')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('matching/index'));
    }

    public function test_student_can_visit_portfolio_and_workspace(): void
    {
        $this->actingAs($this->student)
            ->get('/portfolio')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('portfolio/index'));

        // Workspace requires team activation (ProjectStatus::InProgress)
        $this->project->update(['status' => ProjectStatus::InProgress]);

        $team = $this->project->team;
        $this->actingAs($this->student)
            ->get("/workspace/{$team->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('workspace/show'));
    }

    public function test_campus_admin_can_access_admin_panel(): void
    {
        $this->actingAs($this->campusAdmin)
            ->get('/admin')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('admin/index'));
    }

    public function test_regular_student_cannot_access_admin_panel(): void
    {
        $this->actingAs($this->student)
            ->get('/admin')
            ->assertStatus(403);
    }
}
