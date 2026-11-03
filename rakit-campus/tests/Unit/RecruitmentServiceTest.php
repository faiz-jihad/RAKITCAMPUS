<?php

namespace Tests\Unit;

use App\Enums\ApplicationStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\Visibility;
use App\Models\Campus;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\RecruitmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class RecruitmentServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_apply_and_leader_can_accept_within_capacity(): void
    {
        $campus = Campus::create(['name' => 'Campus Test', 'slug' => 'test-campus']);
        $leader = User::factory()->create();
        $applicant = User::factory()->create();

        $project = Project::create([
            'campus_id' => $campus->id,
            'leader_id' => $leader->id,
            'title' => 'Test Project',
            'slug' => 'test-project',
            'short_description' => 'Short desc',
            'category' => ProjectCategory::Academic,
            'visibility' => Visibility::Campus,
            'status' => ProjectStatus::Recruiting,
        ]);

        $team = Team::create([
            'campus_id' => $campus->id,
            'project_id' => $project->id,
            'leader_id' => $leader->id,
            'name' => 'Team A',
            'capacity' => 2, // Capacity is 2
            'type' => TeamType::Project,
        ]);

        // Leader is 1st member
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $leader->id,
            'permission' => TeamPermission::Leader,
        ]);

        $recruitment = Recruitment::create([
            'campus_id' => $campus->id,
            'team_id' => $team->id,
            'title' => 'Open Recruit',
            'status' => RecruitmentStatus::Open,
        ]);

        $role = RecruitmentRole::create([
            'recruitment_id' => $recruitment->id,
            'name' => 'Frontend Dev',
            'slots' => 1,
        ]);

        $service = new RecruitmentService();

        // 1. Submit application
        $app = $service->apply($applicant, $recruitment, $role->id, 'Saya tertarik.');
        $this->assertEquals(ApplicationStatus::Pending, $app->status);

        // 2. Accept application (capacity reaches 2 of 2)
        $member = $service->acceptApplication($app, $leader, 'Selamat bergabung');
        $this->assertEquals($applicant->id, $member->user_id);
        $this->assertEquals('Frontend Dev', $member->role_name);
        $this->assertEquals(2, $team->members()->count());
    }

    public function test_cannot_accept_when_team_capacity_is_exceeded(): void
    {
        $campus = Campus::create(['name' => 'Campus Test', 'slug' => 'test-campus']);
        $leader = User::factory()->create();
        $student1 = User::factory()->create();
        $student2 = User::factory()->create();

        $team = Team::create([
            'campus_id' => $campus->id,
            'leader_id' => $leader->id,
            'name' => 'Small Team',
            'capacity' => 2, // Max capacity 2
            'type' => TeamType::Project,
        ]);

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $leader->id,
            'permission' => TeamPermission::Leader,
        ]);

        // Already 1 member. Add 2nd member.
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $student1->id,
            'permission' => TeamPermission::Member,
        ]);

        $recruitment = Recruitment::create([
            'campus_id' => $campus->id,
            'team_id' => $team->id,
            'title' => 'Open Recruit',
            'status' => RecruitmentStatus::Open,
        ]);

        $service = new RecruitmentService();

        // Student 2 applied before team filled up
        $app = $service->apply($student2, $recruitment, null, 'Halo');

        // Leader attempts to accept student 2 when capacity is already 2/2
        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('Kapasitas maksimal tim (2 orang) sudah terpenuhi.');

        $service->acceptApplication($app, $leader);
    }
}
