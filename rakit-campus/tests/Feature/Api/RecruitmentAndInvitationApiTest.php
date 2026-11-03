<?php

namespace Tests\Feature\Api;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Enums\Visibility;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\StudentProfile;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RecruitmentAndInvitationApiTest extends TestCase
{
    use RefreshDatabase;

    protected Campus $campus;
    protected User $leader;
    protected User $student;
    protected Team $team;
    protected Recruitment $recruitment;
    protected RecruitmentRole $role;

    protected function setUp(): void
    {
        parent::setUp();

        $this->campus = Campus::create(['name' => 'Polindra', 'slug' => 'polindra']);
        $this->leader = User::factory()->create();
        $this->student = User::factory()->create();

        foreach ([$this->leader, $this->student] as $u) {
            CampusMembership::create([
                'campus_id' => $this->campus->id,
                'user_id' => $u->id,
                'role' => CampusRole::Student,
                'status' => MembershipStatus::Active,
                'verification_status' => VerificationStatus::Verified,
            ]);

            StudentProfile::create([
                'user_id' => $u->id,
                'campus_id' => $this->campus->id,
                'slug' => 'user-' . $u->id,
                'department' => 'Teknik Informatika',
                'study_program' => 'Rekayasa Perangkat Lunak',
                'availability_hours' => 15,
                'visibility' => Visibility::Campus,
            ]);
        }

        $project = Project::create([
            'campus_id' => $this->campus->id,
            'leader_id' => $this->leader->id,
            'title' => 'Project IoT',
            'slug' => 'project-iot',
            'short_description' => 'IoT Smart Project',
            'category' => ProjectCategory::Startup,
            'visibility' => Visibility::Campus,
            'status' => ProjectStatus::Recruiting,
        ]);

        $this->team = Team::create([
            'campus_id' => $this->campus->id,
            'project_id' => $project->id,
            'leader_id' => $this->leader->id,
            'name' => 'IoT Devs',
            'capacity' => 2,
            'type' => TeamType::Project,
        ]);

        TeamMember::create([
            'team_id' => $this->team->id,
            'user_id' => $this->leader->id,
            'permission' => TeamPermission::Leader,
            'role_name' => 'Lead',
        ]);

        $this->recruitment = Recruitment::create([
            'campus_id' => $this->campus->id,
            'team_id' => $this->team->id,
            'title' => 'Open Recruit Mobile Dev',
            'status' => RecruitmentStatus::Open,
        ]);

        $this->role = RecruitmentRole::create([
            'recruitment_id' => $this->recruitment->id,
            'name' => 'Mobile Developer',
            'slots' => 1,
        ]);
    }

    public function test_student_applies_and_leader_accepts(): void
    {
        // 1. Student applies
        Sanctum::actingAs($this->student);

        $applyRes = $this->postJson("/api/v1/recruitments/{$this->recruitment->id}/apply", [
            'recruitment_role_id' => $this->role->id,
            'message' => 'Saya berpengalaman dalam Flutter.',
        ]);
        $applyRes->assertStatus(201);
        $appId = $applyRes->json('data.id');

        // 2. Leader views applicants
        Sanctum::actingAs($this->leader);

        $listRes = $this->getJson("/api/v1/recruitments/{$this->recruitment->id}/applications");
        $listRes->assertOk();
        $this->assertCount(1, $listRes->json('data'));

        // 3. Leader accepts application
        $decideRes = $this->patchJson("/api/v1/applications/{$appId}/decide", [
            'action' => 'accept',
            'note' => 'Portofolio sesuai.',
        ]);
        $decideRes->assertOk();

        // Verify applicant is now in team
        $this->assertDatabaseHas('team_members', [
            'team_id' => $this->team->id,
            'user_id' => $this->student->id,
            'role_name' => 'Mobile Developer',
        ]);
    }

    public function test_leader_invites_student_and_student_accepts(): void
    {
        Sanctum::actingAs($this->leader);

        $inviteRes = $this->postJson('/api/v1/invitations', [
            'team_id' => $this->team->id,
            'invitee_id' => $this->student->id,
            'recruitment_role_id' => $this->role->id,
            'message' => 'Yuk gabung tim kami.',
        ]);
        $inviteRes->assertStatus(201);
        $invitationId = $inviteRes->json('data.id');

        // Student checks invitations and accepts
        Sanctum::actingAs($this->student);

        $myInvRes = $this->getJson('/api/v1/invitations/me');
        $myInvRes->assertOk();
        $this->assertCount(1, $myInvRes->json('data'));

        $respondRes = $this->patchJson("/api/v1/invitations/{$invitationId}/respond", [
            'action' => 'accept',
        ]);
        $respondRes->assertOk();

        $this->assertDatabaseHas('team_members', [
            'team_id' => $this->team->id,
            'user_id' => $this->student->id,
        ]);
    }
}
