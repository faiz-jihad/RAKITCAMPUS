<?php

namespace Tests\Feature\Api;

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
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectAndOpportunityApiTest extends TestCase
{
    use RefreshDatabase;

    protected Campus $campus;
    protected User $student;
    protected StudentProfile $profile;

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
        ]);

        $this->profile = StudentProfile::create([
            'user_id' => $this->student->id,
            'campus_id' => $this->campus->id,
            'slug' => 'student-test',
            'department' => 'Teknik Informatika',
            'study_program' => 'Rekayasa Perangkat Lunak',
            'semester' => 5,
            'availability_hours' => 20,
            'visibility' => Visibility::Campus,
        ]);
    }

    public function test_student_can_register_and_receive_sanctum_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Rifqi Pratama',
            'email' => 'rifqi@student.polindra.ac.id',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'campus_id' => $this->campus->id,
            'student_number' => '2201099',
            'study_program' => 'Teknik Informatika',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'token', 'user' => ['id', 'name', 'email']]);

        $this->assertDatabaseHas('users', ['email' => 'rifqi@student.polindra.ac.id']);
        $this->assertDatabaseHas('campus_memberships', [
            'campus_id' => $this->campus->id,
            'student_number' => '2201099',
        ]);
    }

    public function test_authenticated_student_can_create_project_and_workspace(): void
    {
        Sanctum::actingAs($this->student);

        $response = $this->postJson('/api/v1/projects', [
            'title' => 'Sistem Rekomendasi Pertanian AI',
            'short_description' => 'Sistem pemantau hama berbasis IoT dan AI',
            'category' => ProjectCategory::Startup->value,
            'tech_stack' => ['Flutter', 'Laravel', 'Python'],
            'capacity' => 4,
            'required_skills' => [
                ['name' => 'Flutter', 'min_proficiency' => 4],
                ['name' => 'Python', 'min_proficiency' => 3],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.title', 'Sistem Rekomendasi Pertanian AI');

        $projectId = $response->json('data.id');

        // Verify Project exists
        $this->assertDatabaseHas('projects', ['id' => $projectId, 'campus_id' => $this->campus->id]);

        // Verify Team created automatically with creator as Leader
        $this->assertDatabaseHas('teams', [
            'project_id' => $projectId,
            'leader_id' => $this->student->id,
            'capacity' => 4,
        ]);

        $team = Team::where('project_id', $projectId)->first();
        $this->assertDatabaseHas('team_members', [
            'team_id' => $team->id,
            'user_id' => $this->student->id,
            'permission' => TeamPermission::Leader->value,
        ]);
    }

    public function test_tenant_isolation_hides_private_campus_projects(): void
    {
        $otherCampus = Campus::create(['name' => 'Campus ITB', 'slug' => 'itb']);
        $otherLeader = User::factory()->create();

        // Project strictly scoped to Campus B
        $otherProject = Project::create([
            'campus_id' => $otherCampus->id,
            'leader_id' => $otherLeader->id,
            'title' => 'Secret Project Campus B',
            'slug' => 'secret-b',
            'short_description' => 'Not for other campuses',
            'category' => ProjectCategory::Research,
            'visibility' => Visibility::Campus, // Not public
            'status' => ProjectStatus::Recruiting,
        ]);

        Sanctum::actingAs($this->student);

        // Student from Polindra lists projects
        $response = $this->getJson('/api/v1/projects');
        $response->assertOk();

        $titles = collect($response->json('data'))->pluck('title');
        $this->assertFalse($titles->contains('Secret Project Campus B'));

        // Direct show should be forbidden
        $showResponse = $this->getJson("/api/v1/projects/{$otherProject->id}");
        $showResponse->assertStatus(403);
    }

    public function test_workspace_task_creation_and_kanban_flow(): void
    {
        Sanctum::actingAs($this->student);

        $team = Team::create([
            'campus_id' => $this->campus->id,
            'leader_id' => $this->student->id,
            'name' => 'Alpha Team',
            'type' => TeamType::Project,
            'capacity' => 3,
        ]);

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->student->id,
            'permission' => TeamPermission::Leader,
        ]);

        // 1. Create task
        $taskRes = $this->postJson("/api/v1/teams/{$team->id}/tasks", [
            'title' => 'Implement Auth Screen',
            'description' => 'Build UI using Riverpod and Dio',
            'priority' => 'high',
        ]);
        $taskRes->assertStatus(201);
        $taskId = $taskRes->json('data.id');

        // 2. Fetch kanban board
        $kanbanRes = $this->getJson("/api/v1/teams/{$team->id}/kanban");
        $kanbanRes->assertOk()
            ->assertJsonStructure(['data' => ['todo', 'in_progress', 'in_review', 'completed']]);

        $this->assertCount(1, $kanbanRes->json('data.todo'));

        // 3. Move task to completed
        $updateRes = $this->patchJson("/api/v1/tasks/{$taskId}", [
            'status' => 'completed',
        ]);
        $updateRes->assertOk();

        $this->assertDatabaseHas('tasks', [
            'id' => $taskId,
            'status' => 'completed',
        ]);
    }
}
