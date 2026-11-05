<?php

namespace Tests\Feature;

use App\Enums\CampusRole;
use App\Enums\InvitationStatus;
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
use App\Models\Invitation;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Skill;
use App\Models\StudentProfile;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Matchmaking\CandidateScoringService;
use App\Services\Matchmaking\EligibilityService;
use App\Services\Matchmaking\InvitationService;
use App\Services\Matchmaking\MatchmakingEngine;
use App\Services\Matchmaking\TeamBalanceService;
use App\Services\Matchmaking\TeamFormationService;
use App\Services\Matchmaking\TeamOptimizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class ProjectHubSmartMatchmakingTest extends TestCase
{
    use RefreshDatabase;

    protected Campus $campus;
    protected User $lecturer;
    protected AcademicClass $academicClass;
    protected User $leader;
    protected Project $project;
    protected Team $team;
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
            'name' => 'Dr. Dosen Pengampu',
            'email' => 'dosen@polindra.ac.id',
        ]);

        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->lecturer->id,
            'role' => CampusRole::Lecturer,
            'status' => MembershipStatus::Active,
        ]);

        $this->academicClass = AcademicClass::create([
            'campus_id' => $this->campus->id,
            'lecturer_id' => $this->lecturer->id,
            'name' => 'Proyek Perangkat Lunak 1',
            'code' => 'PPL-01',
            'academic_year' => '2026/2027',
            'semester' => 5,
            'target_team_size' => 4,
            'join_code' => 'PPL2026',
            'is_active' => true,
        ]);

        $this->leader = User::factory()->create([
            'name' => 'Ketua Tim Proyek',
            'email' => 'ketua@polindra.ac.id',
        ]);

        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->leader->id,
            'role' => CampusRole::Student,
            'status' => MembershipStatus::Active,
        ]);

        AcademicClassStudent::create([
            'academic_class_id' => $this->academicClass->id,
            'user_id' => $this->leader->id,
            'student_number' => 'NIM-LEADER',
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);

        $this->laravelSkill = Skill::resolve('Laravel', SkillType::Technical);
        $this->reactSkill = Skill::resolve('React', SkillType::Technical);

        $this->project = Project::create([
            'campus_id' => $this->campus->id,
            'academic_class_id' => $this->academicClass->id,
            'leader_id' => $this->leader->id,
            'title' => 'Sistem Rekrutmen Cerdas',
            'slug' => 'sistem-rekrutmen-cerdas',
            'short_description' => 'Platform kolaborasi mahasiswa cerdas',
            'category' => ProjectCategory::Academic,
            'visibility' => Visibility::Campus,
            'status' => ProjectStatus::Recruiting,
            'formation_status' => 'matchmaking_open',
            'min_team_size' => 2,
            'max_team_size' => 4,
            'expected_weekly_hours' => 12,
        ]);

        $this->project->skills()->attach([
            $this->laravelSkill->id => ['min_proficiency' => 3],
            $this->reactSkill->id => ['min_proficiency' => 3],
        ]);

        $this->team = Team::create([
            'campus_id' => $this->campus->id,
            'project_id' => $this->project->id,
            'leader_id' => $this->leader->id,
            'name' => 'Tim Cerdas PPL',
            'type' => TeamType::Project,
            'capacity' => 4,
        ]);

        TeamMember::create([
            'team_id' => $this->team->id,
            'user_id' => $this->leader->id,
            'permission' => TeamPermission::Leader,
            'status' => 'active',
            'role_name' => 'Project Lead & Architect',
            'joined_at' => now(),
        ]);

        $recruitment = Recruitment::create([
            'campus_id' => $this->campus->id,
            'team_id' => $this->team->id,
            'title' => 'Rekrutmen Terbuka PPL',
            'status' => 'open',
        ]);

        RecruitmentRole::create([
            'recruitment_id' => $recruitment->id,
            'name' => 'Backend Developer',
            'description' => 'Pengembangan API Laravel',
            'slots' => 1,
            'priority' => 'high',
            'min_proficiency' => 3,
        ]);
    }

    /**
     * Helper to create student in academic class with skills.
     */
    protected function createStudentInClass(string $name, string $email, array $skillsWithProf, array $preferredRoles = [], int $hours = 12): User
    {
        $user = User::factory()->create([
            'name' => $name,
            'email' => $email,
        ]);

        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $user->id,
            'role' => CampusRole::Student,
            'status' => MembershipStatus::Active,
        ]);

        AcademicClassStudent::create([
            'academic_class_id' => $this->academicClass->id,
            'user_id' => $user->id,
            'student_number' => 'NIM-' . $user->id,
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);

        $profile = StudentProfile::create([
            'user_id' => $user->id,
            'campus_id' => $this->campus->id,
            'slug' => 'student-' . $user->id,
            'study_program' => 'Teknik Informatika',
            'semester' => 5,
            'availability_hours' => $hours,
            'preferred_roles' => $preferredRoles,
            'interests' => ['Web Development', 'AI'],
        ]);

        foreach ($skillsWithProf as $skillName => $prof) {
            $skill = Skill::resolve($skillName, SkillType::Technical);
            $profile->skills()->attach($skill->id, ['proficiency' => $prof]);
        }

        return $user;
    }

    public function test_strictly_class_based_candidate_recommendations(): void
    {
        // Student in same class
        $sameClassStudent = $this->createStudentInClass('Mahasiswa Sekelas', 'sekelas@polindra.ac.id', ['Laravel' => 4], ['Backend Developer']);

        // Student outside class
        $otherClass = AcademicClass::create([
            'campus_id' => $this->campus->id,
            'lecturer_id' => $this->lecturer->id,
            'name' => 'Kelas Lain',
            'code' => 'KL-02',
            'academic_year' => '2026/2027',
            'semester' => 5,
            'join_code' => 'OTHER99',
            'is_active' => true,
        ]);

        $outsideStudent = User::factory()->create(['name' => 'Mahasiswa Luar', 'email' => 'luar@polindra.ac.id']);
        AcademicClassStudent::create([
            'academic_class_id' => $otherClass->id,
            'user_id' => $outsideStudent->id,
            'student_number' => 'NIM-OUTSIDE',
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);

        $engine = app(MatchmakingEngine::class);
        $recommendations = $engine->recommendCandidatesForProject($this->project, 10);

        $recUserIds = collect($recommendations)->pluck('user.id')->all();

        $this->assertContains($sameClassStudent->id, $recUserIds);
        $this->assertNotContains($outsideStudent->id, $recUserIds, 'Candidates outside the academic class must NOT be recommended.');
    }

    public function test_candidate_scoring_service_computes_6_component_scores(): void
    {
        $candidate = $this->createStudentInClass('Budi Backend', 'budi@polindra.ac.id', ['Laravel' => 4, 'React' => 3], ['Backend Developer'], 12);
        $candidate->load('profile.skills');

        $scoringService = app(CandidateScoringService::class);
        $scoreBreakdown = $scoringService->scoreCandidate($candidate, $this->project);

        $this->assertIsInt($scoreBreakdown['final_score']);
        $this->assertGreaterThan(50, $scoreBreakdown['final_score']);
        $this->assertArrayHasKey('breakdown', $scoreBreakdown);
        $this->assertArrayHasKey('skill', $scoreBreakdown['breakdown']);
        $this->assertArrayHasKey('role', $scoreBreakdown['breakdown']);
        $this->assertArrayHasKey('interest', $scoreBreakdown['breakdown']);
        $this->assertArrayHasKey('availability', $scoreBreakdown['breakdown']);
        $this->assertArrayHasKey('diversity', $scoreBreakdown['breakdown']);
        $this->assertArrayHasKey('fairness', $scoreBreakdown['breakdown']);
        $this->assertNotEmpty($scoreBreakdown['explanation']);
    }

    public function test_team_balance_analysis_and_radar_data(): void
    {
        $member2 = $this->createStudentInClass('Siti Frontend', 'siti@polindra.ac.id', ['React' => 4, 'Tailwind' => 4], ['Frontend Developer']);

        TeamMember::create([
            'team_id' => $this->team->id,
            'user_id' => $member2->id,
            'permission' => TeamPermission::Member,
            'status' => 'active',
            'role_name' => 'Frontend Developer',
            'joined_at' => now(),
        ]);

        $balanceService = app(TeamBalanceService::class);
        $analysis = $balanceService->analyzeTeamBalance($this->project);

        $this->assertArrayHasKey('overall_score', $analysis);
        $this->assertArrayHasKey('radar_data', $analysis);
        $this->assertCount(6, $analysis['radar_data']); // 6 axes
        $this->assertArrayHasKey('competencies_table', $analysis);
        $this->assertArrayHasKey('member_contributions', $analysis);
        $this->assertCount(2, $analysis['member_contributions']);
    }

    public function test_invitation_lifecycle_with_rule_1_unified_membership_enforcement(): void
    {
        $candidate = $this->createStudentInClass('Andi Developer', 'andi@polindra.ac.id', ['Laravel' => 3]);
        $invitationService = app(InvitationService::class);
        $role = $this->team->recruitment->roles->first();

        // 1. Send Invitation
        $invitation = $invitationService->sendInvitation($this->team, $this->leader, $candidate, $role, 'Yuk gabung!');
        $this->assertEquals(InvitationStatus::Pending, $invitation->status);

        // 2. Accept Invitation
        $member = $invitationService->acceptInvitation($invitation, $candidate);
        $this->assertEquals('active', $member->status);
        $invitation->refresh();
        $this->assertEquals(InvitationStatus::Accepted, $invitation->status);
        $this->assertTrue($this->team->hasMember($candidate));

        // 3. Candidate now has active project -> cannot accept another invitation
        $otherProject = Project::create([
            'campus_id' => $this->campus->id,
            'academic_class_id' => $this->academicClass->id,
            'leader_id' => $this->leader->id,
            'title' => 'Proyek Lain',
            'slug' => 'proyek-lain',
            'short_description' => 'Deskripsi',
            'category' => ProjectCategory::Academic,
            'visibility' => Visibility::Campus,
            'status' => ProjectStatus::Recruiting,
        ]);
        $otherTeam = Team::create([
            'campus_id' => $this->campus->id,
            'project_id' => $otherProject->id,
            'leader_id' => $this->leader->id,
            'name' => 'Tim Lain',
            'type' => TeamType::Project,
            'capacity' => 4,
        ]);

        $secondInvitation = Invitation::create([
            'campus_id' => $this->campus->id,
            'team_id' => $otherTeam->id,
            'inviter_id' => $this->leader->id,
            'invitee_id' => $candidate->id,
            'status' => InvitationStatus::Pending->value,
            'expires_at' => now()->addDays(3),
        ]);

        $this->expectException(ValidationException::class);
        $invitationService->acceptInvitation($secondInvitation, $candidate);
    }

    public function test_team_formation_lifecycle_and_lecturer_approval_gatekeeper(): void
    {
        $formationService = app(TeamFormationService::class);

        // Initially gatekeeper denies workspace access
        $this->assertFalse($formationService->canAccessWorkspace($this->project, $this->leader));

        // Add 2nd member to meet min_team_size = 2
        $member2 = $this->createStudentInClass('Anggota Dua', 'dua@polindra.ac.id', ['Laravel' => 3]);
        TeamMember::create([
            'team_id' => $this->team->id,
            'user_id' => $member2->id,
            'permission' => TeamPermission::Member,
            'status' => 'active',
            'role_name' => 'Backend Developer',
            'joined_at' => now(),
        ]);

        // Submit for review
        $formationService->submitForReview($this->project, $this->leader);
        $this->project->refresh();
        $this->assertEquals('formation_review', $this->project->formation_status);

        // Lecturer approves formation
        $formationService->approveFormation($this->project, $this->lecturer, 'Komposisi tim sudah sangat baik dan berimbang.');
        $this->project->refresh();
        $this->assertEquals('lecturer_approved', $this->project->formation_status);
        $this->assertNotNull($this->project->formation_approved_at);
        $this->assertEquals($this->lecturer->id, $this->project->formation_approved_by);

        // Gatekeeper now grants access to leader and member
        $this->assertTrue($formationService->canAccessWorkspace($this->project, $this->leader));
        $this->assertTrue($formationService->canAccessWorkspace($this->project, $member2));

        // Activate workspace
        $formationService->activateWorkspace($this->project, $this->leader);
        $this->project->refresh();
        $this->assertEquals('workspace_activated', $this->project->formation_status);
    }
}
