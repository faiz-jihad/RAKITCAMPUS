<?php

namespace Tests\Unit;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\SkillType;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\Visibility;
use App\Models\Campus;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Skill;
use App\Models\StudentProfile;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\MatchingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MatchingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_matching_calculates_high_score_for_aligned_skills_and_roles(): void
    {
        $campus = Campus::create(['name' => 'Campus Test', 'slug' => 'test-campus']);
        $leader = User::factory()->create();
        $studentUser = User::factory()->create();

        $flutter = Skill::create(['name' => 'Flutter', 'slug' => 'flutter', 'type' => SkillType::Technical]);
        $python = Skill::create(['name' => 'Python', 'slug' => 'python', 'type' => SkillType::Technical]);

        $project = Project::create([
            'campus_id' => $campus->id,
            'leader_id' => $leader->id,
            'title' => 'Flutter Mobile IoT',
            'slug' => 'flutter-mobile-iot',
            'short_description' => 'IoT system with Flutter app and Python backend',
            'category' => ProjectCategory::Startup,
            'visibility' => Visibility::Campus,
            'status' => ProjectStatus::Recruiting,
        ]);
        $project->skills()->attach($flutter->id, ['min_proficiency' => 4]);
        $project->skills()->attach($python->id, ['min_proficiency' => 3]);

        $team = Team::create([
            'campus_id' => $campus->id,
            'project_id' => $project->id,
            'leader_id' => $leader->id,
            'name' => 'IoT Core',
            'capacity' => 4,
            'type' => TeamType::Project,
        ]);
        $rec = Recruitment::create([
            'campus_id' => $campus->id,
            'team_id' => $team->id,
            'title' => 'Looking for Mobile Engineer',
            'status' => 'open',
        ]);
        RecruitmentRole::create([
            'recruitment_id' => $rec->id,
            'name' => 'Mobile Developer',
            'slots' => 1,
        ]);

        $profile = StudentProfile::create([
            'user_id' => $studentUser->id,
            'campus_id' => $campus->id,
            'slug' => 'fauzi-test',
            'interests' => ['Mobile App', 'IoT'],
            'preferred_roles' => ['Mobile Developer'],
            'availability_hours' => 20,
            'visibility' => Visibility::Campus,
        ]);
        $profile->skills()->attach($flutter->id, ['proficiency' => 5]);
        $profile->skills()->attach($python->id, ['proficiency' => 3]);

        $service = new MatchingService();
        $match = $service->matchStudentToProject($profile, $project);

        $this->assertGreaterThanOrEqual(70, $match['match_score']);
        $this->assertContains('Flutter', $match['matched_skills']);
        $this->assertContains('Python', $match['matched_skills']);
        $this->assertEmpty($match['missing_skills']);
        $this->assertTrue($match['interest_match']);
        $this->assertTrue($match['availability_compatible']);
    }

    public function test_tenant_isolation_prevents_matching_across_campuses_if_not_public(): void
    {
        $campusA = Campus::create(['name' => 'Campus A', 'slug' => 'campus-a']);
        $campusB = Campus::create(['name' => 'Campus B', 'slug' => 'campus-b']);

        $leader = User::factory()->create();
        $student = User::factory()->create();

        $project = Project::create([
            'campus_id' => $campusA->id,
            'leader_id' => $leader->id,
            'title' => 'Internal Campus A Project',
            'slug' => 'internal-a',
            'short_description' => 'Only for campus A',
            'category' => ProjectCategory::Academic,
            'visibility' => Visibility::Campus, // not public
            'status' => ProjectStatus::Recruiting,
        ]);

        $profile = StudentProfile::create([
            'user_id' => $student->id,
            'campus_id' => $campusB->id, // Student belongs to Campus B
            'slug' => 'student-b',
            'availability_hours' => 15,
        ]);

        $service = new MatchingService();
        $match = $service->matchStudentToProject($profile, $project);

        $this->assertEquals(0, $match['match_score']);
        $this->assertStringContainsString('kampus yang berbeda', $match['explanation']);
    }
}
