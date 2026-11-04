<?php

namespace Tests\Feature;

use App\Enums\AchievementType;
use App\Enums\AchievementVerification;
use App\Enums\CampusRole;
use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\MembershipStatus;
use App\Enums\ProjectStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Enums\Visibility;
use App\Models\AcademicClass;
use App\Models\Achievement;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Competition;
use App\Models\CompetitionDocument;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionResult;
use App\Models\CompetitionStatusHistory;
use App\Models\Project;
use App\Models\Skill;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Matchmaking\CompetitionMatchmakingService;
use App\Services\Matchmaking\MembershipService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CompetitionHubTest extends TestCase
{
    use RefreshDatabase;

    protected Campus $campus;
    protected User $admin;
    protected User $lecturer;
    protected User $studentLeader;
    protected User $studentMember;
    protected User $candidateStudent;
    protected Skill $skillLaravel;
    protected Skill $skillReact;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->campus = Campus::create([
            'name' => 'Politeknik Negeri Indramayu',
            'slug' => 'polindra',
            'domain' => 'polindra.ac.id',
            'is_active' => true,
        ]);

        $this->skillLaravel = Skill::firstOrCreate(['slug' => 'laravel'], ['name' => 'Laravel', 'category' => 'backend']);
        $this->skillReact = Skill::firstOrCreate(['slug' => 'react'], ['name' => 'React', 'category' => 'frontend']);

        // Admin
        $this->admin = User::factory()->create(['name' => 'Admin Kampus']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->admin->id,
            'role' => CampusRole::CampusAdmin->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
        ]);

        // Lecturer
        $this->lecturer = User::factory()->create(['name' => 'Dr. Budi Santoso']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->lecturer->id,
            'role' => CampusRole::Lecturer->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
        ]);

        // Student Leader
        $this->studentLeader = User::factory()->create(['name' => 'Ketua Tim Kompetisi']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentLeader->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => '230101',
        ]);
        $spLeader = StudentProfile::create([
            'user_id' => $this->studentLeader->id,
            'campus_id' => $this->campus->id,
            'slug' => 'ketua-kompetisi',
            'department' => 'Teknik Informatika',
            'study_program' => 'RPL',
            'availability_hours' => 20,
            'visibility' => Visibility::Campus,
            'interests' => ['Web Development', 'Hackathon'],
            'preferred_roles' => ['Backend Developer'],
        ]);
        $spLeader->skills()->attach([$this->skillLaravel->id => ['proficiency' => 3], $this->skillReact->id => ['proficiency' => 2]]);

        // Student Member
        $this->studentMember = User::factory()->create(['name' => 'Anggota Tim']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentMember->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => '230102',
        ]);
        $spMember = StudentProfile::create([
            'user_id' => $this->studentMember->id,
            'campus_id' => $this->campus->id,
            'slug' => 'anggota-kompetisi',
            'department' => 'Teknik Informatika',
            'study_program' => 'RPL',
            'availability_hours' => 20,
            'visibility' => Visibility::Campus,
            'interests' => ['UI/UX', 'Frontend'],
            'preferred_roles' => ['Frontend Developer'],
        ]);
        $spMember->skills()->attach([$this->skillReact->id => ['proficiency' => 3], $this->skillLaravel->id => ['proficiency' => 2]]);

        // Candidate Student (for Matchmaking)
        $this->candidateStudent = User::factory()->create(['name' => 'Kandidat Baru']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->candidateStudent->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => '230103',
        ]);
        $spCandidate = StudentProfile::create([
            'user_id' => $this->candidateStudent->id,
            'campus_id' => $this->campus->id,
            'slug' => 'kandidat-baru',
            'department' => 'Teknik Informatika',
            'study_program' => 'RPL',
            'availability_hours' => 25,
            'visibility' => Visibility::Campus,
            'interests' => ['Hackathon', 'Frontend Developer'],
            'preferred_roles' => ['Frontend Developer'],
        ]);
        $spCandidate->skills()->attach([$this->skillReact->id => ['proficiency' => 4], $this->skillLaravel->id => ['proficiency' => 3]]);
    }

    public function test_student_can_create_competition_pending_verification(): void
    {
        $response = $this->actingAs($this->studentLeader)->post(route('competitions.store'), [
            'name' => 'Hackathon Nasional 2026',
            'organizer' => 'Puspresnas',
            'description' => 'Kompetisi inovasi perangkat lunak tingkat nasional.',
            'category' => CompetitionCategory::Hackathon->value,
            'level' => 'national',
            'competition_type' => 'team',
            'min_team_size' => 2,
            'max_team_size' => 5,
            'prize_info' => 'Total hadiah Rp 50.000.000',
            'source_url' => 'https://puspresnas.kemdikbud.go.id/hackathon',
            'source_label' => 'Website Resmi Puspresnas',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('competitions', [
            'name' => 'Hackathon Nasional 2026',
            'organizer' => 'Puspresnas',
            'verification_status' => VerificationStatus::Unverified->value,
            'status' => CompetitionStatus::Open->value,
        ]);
        $this->assertDatabaseHas('competition_sources', [
            'url' => 'https://puspresnas.kemdikbud.go.id/hackathon',
        ]);
    }

    public function test_lecturer_or_admin_can_verify_competition(): void
    {
        $competition = Competition::create([
            'campus_id' => $this->campus->id,
            'created_by' => $this->studentLeader->id,
            'name' => 'Gemastik XVII',
            'slug' => 'gemastik-xvii',
            'organizer' => 'Kemendikbud',
            'category' => CompetitionCategory::Programming,
            'level' => 'national',
            'min_team_size' => 2,
            'max_team_size' => 4,
            'status' => CompetitionStatus::Open,
            'verification_status' => VerificationStatus::Unverified,
        ]);

        $response = $this->actingAs($this->lecturer)->post(route('competitions.verify', $competition->id));

        $response->assertRedirect();
        $competition->refresh();
        $this->assertEquals(VerificationStatus::Verified, $competition->verification_status);
        $this->assertEquals(CompetitionStatus::Open, $competition->status);
        $this->assertEquals($this->lecturer->id, $competition->verified_by);
    }

    public function test_student_can_form_competition_team_and_enter_workspace(): void
    {
        $competition = Competition::create([
            'campus_id' => $this->campus->id,
            'created_by' => $this->admin->id,
            'name' => 'UI/UX Design Challenge',
            'slug' => 'ui-ux-challenge',
            'organizer' => 'Design Club',
            'category' => CompetitionCategory::UiUx,
            'level' => 'national',
            'min_team_size' => 1,
            'max_team_size' => 4,
            'status' => CompetitionStatus::Open,
            'verification_status' => VerificationStatus::Verified,
        ]);

        $response = $this->actingAs($this->studentLeader)->post(route('competitions.participate', $competition->id), [
            'team_name' => 'Tim Kreatif Polindra',
            'description' => 'Fokus pada desain inklusif untuk lansia.',
        ]);

        $response->assertRedirect();
        $participation = CompetitionParticipation::where('competition_id', $competition->id)->first();
        $this->assertNotNull($participation);
        $this->assertEquals('recruiting', $participation->stage);
        $this->assertEquals('Tim Kreatif Polindra', $participation->team->name);
        $this->assertTrue($participation->team->isLeader($this->studentLeader));

        // Workspace access test
        $wsResponse = $this->actingAs($this->studentLeader)->get(route('competitions.workspace', $participation->id));
        $wsResponse->assertOk();
    }

    public function test_unified_membership_prevents_student_with_active_project_from_joining_competition_in_strict_mode(): void
    {
        config(['matchmaking.membership_mode' => 'strict']);

        // 1. Assign student leader to an active project
        $project = Project::create([
            'campus_id' => $this->campus->id,
            'leader_id' => $this->studentLeader->id,
            'title' => 'Sistem Rekam Medis',
            'slug' => 'sistem-rekam-medis',
            'short_description' => 'Aplikasi rekam medis cerdas.',
            'category' => \App\Enums\ProjectCategory::Academic,
            'status' => ProjectStatus::InProgress,
        ]);
        $team = Team::create([
            'campus_id' => $this->campus->id,
            'project_id' => $project->id,
            'leader_id' => $this->studentLeader->id,
            'type' => TeamType::Project,
            'name' => 'Proyek Capstone',
        ]);
        $project->update(['team_id' => $team->id]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->studentLeader->id,
            'permission' => TeamPermission::Leader,
            'status' => 'active',
            'joined_at' => now(),
        ]);

        $competition = Competition::create([
            'campus_id' => $this->campus->id,
            'created_by' => $this->admin->id,
            'name' => 'Hackathon 2026',
            'slug' => 'hackathon-2026',
            'organizer' => 'Tech Corp',
            'category' => CompetitionCategory::Hackathon,
            'level' => 'national',
            'min_team_size' => 1,
            'max_team_size' => 4,
            'status' => CompetitionStatus::Open,
            'verification_status' => VerificationStatus::Verified,
        ]);

        // Student tries to form a competition team while holding active project
        $response = $this->actingAs($this->studentLeader)->post(route('competitions.participate', $competition->id), [
            'team_name' => 'Tim Pelanggar Aturan',
        ]);

        $response->assertSessionHasErrors('student');
    }

    public function test_smart_fair_matchmaking_returns_scored_candidates_with_beginner_boost(): void
    {
        $competition = Competition::create([
            'campus_id' => $this->campus->id,
            'created_by' => $this->admin->id,
            'name' => 'Hackathon Inovasi',
            'slug' => 'hackathon-inovasi',
            'organizer' => 'Tech Fest',
            'category' => CompetitionCategory::Hackathon,
            'level' => 'national',
            'min_team_size' => 1,
            'max_team_size' => 4,
            'status' => CompetitionStatus::Open,
            'verification_status' => VerificationStatus::Verified,
        ]);

        $team = Team::create([
            'campus_id' => $this->campus->id,
            'leader_id' => $this->studentLeader->id,
            'type' => TeamType::Competition,
            'name' => 'Garuda Squad',
        ]);
        $participation = CompetitionParticipation::create([
            'competition_id' => $competition->id,
            'team_id' => $team->id,
            'stage' => 'recruiting',
        ]);

        /** @var CompetitionMatchmakingService $matchService */
        $matchService = app(CompetitionMatchmakingService::class);
        $candidates = $matchService->getRecommendedCandidates($participation, $this->studentLeader, 10);

        $this->assertNotEmpty($candidates);
        $top = $candidates->first();
        $this->assertArrayHasKey('final_score', $top);
        $this->assertArrayHasKey('breakdown', $top);
        $this->assertArrayHasKey('explanation', $top);
        $this->assertGreaterThan(50, $top['final_score']);
    }

    public function test_leader_can_lock_formation_and_prevent_further_additions(): void
    {
        $competition = Competition::create([
            'campus_id' => $this->campus->id,
            'created_by' => $this->admin->id,
            'name' => 'Lomba Karya Ilmiah',
            'slug' => 'lomba-karya-ilmiah',
            'organizer' => 'DIKTI',
            'category' => CompetitionCategory::ScientificWriting,
            'level' => 'national',
            'min_team_size' => 1,
            'max_team_size' => 3,
            'status' => CompetitionStatus::Open,
            'verification_status' => VerificationStatus::Verified,
        ]);

        $team = Team::create([
            'campus_id' => $this->campus->id,
            'leader_id' => $this->studentLeader->id,
            'type' => TeamType::Competition,
            'name' => 'Tim Riset',
            'capacity' => 3,
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->studentLeader->id,
            'permission' => TeamPermission::Leader,
            'status' => 'active',
        ]);

        $participation = CompetitionParticipation::create([
            'competition_id' => $competition->id,
            'team_id' => $team->id,
            'stage' => 'recruiting',
            'is_formation_locked' => false,
        ]);

        // Leader locks team formation
        $this->actingAs($this->studentLeader)->post(route('competitions.lock-formation', $participation->id));

        $participation->refresh();
        $this->assertTrue((bool) $participation->is_formation_locked);

        // Attempting to add a member now should be rejected
        $response = $this->actingAs($this->studentLeader)->post(route('competitions.invite-member', $participation->id), [
            'student_id' => $this->candidateStudent->id,
            'role_name' => 'Researcher',
        ]);

        $response->assertSessionHasErrors('team');
    }

    public function test_selection_stage_pipeline_and_audit_history(): void
    {
        $competition = Competition::create([
            'campus_id' => $this->campus->id,
            'created_by' => $this->admin->id,
            'name' => 'PKM Karsa Cipta',
            'slug' => 'pkm-kc',
            'organizer' => 'Belmawa',
            'category' => CompetitionCategory::Research,
            'status' => CompetitionStatus::Open,
            'verification_status' => VerificationStatus::Verified,
        ]);

        $team = Team::create([
            'campus_id' => $this->campus->id,
            'leader_id' => $this->studentLeader->id,
            'type' => TeamType::Competition,
            'name' => 'Tim PKM Hebat',
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->studentLeader->id,
            'permission' => TeamPermission::Leader,
            'status' => 'active',
        ]);
        $participation = CompetitionParticipation::create([
            'competition_id' => $competition->id,
            'team_id' => $team->id,
            'stage' => 'recruiting',
        ]);

        // Advance stage: recruiting -> preparing -> submitted
        $response = $this->actingAs($this->studentLeader)->post(route('competitions.stage.update', $participation->id), [
            'stage' => 'submitted',
            'notes' => 'Proposal berhasil diunggah ke portal Simbelmawa.',
            'external_submission_proof' => 'https://simbelmawa.kemdikbud.go.id/sub/12345',
        ]);

        $response->assertRedirect();
        $participation->refresh();
        $this->assertEquals('submitted', $participation->stage);
        $this->assertEquals('submitted', $participation->submission_status->value ?? $participation->submission_status);

        $this->assertDatabaseHas('competition_status_histories', [
            'participation_id' => $participation->id,
            'from_stage' => 'recruiting',
            'to_stage' => 'submitted',
            'changed_by' => $this->studentLeader->id,
        ]);
    }

    public function test_deliverables_upload_and_mentor_review(): void
    {
        $competition = Competition::create([
            'campus_id' => $this->campus->id,
            'created_by' => $this->admin->id,
            'name' => 'Hackathon Web 2026',
            'slug' => 'hackathon-web-2026',
            'organizer' => 'Web Org',
            'category' => CompetitionCategory::Hackathon,
            'status' => CompetitionStatus::Open,
            'verification_status' => VerificationStatus::Verified,
        ]);

        $team = Team::create([
            'campus_id' => $this->campus->id,
            'leader_id' => $this->studentLeader->id,
            'type' => TeamType::Competition,
            'name' => 'Dev Team',
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->studentLeader->id,
            'permission' => TeamPermission::Leader,
            'status' => 'active',
        ]);
        $participation = CompetitionParticipation::create([
            'competition_id' => $competition->id,
            'team_id' => $team->id,
            'stage' => 'preparing',
            'mentor_id' => $this->lecturer->id,
        ]);

        // Member uploads proposal v1
        $file = UploadedFile::fake()->create('proposal_karya.pdf', 1024, 'application/pdf');
        $this->actingAs($this->studentLeader)->post(route('competitions.documents.upload', $participation->id), [
            'required_document_key' => 'proposal',
            'name' => 'Proposal Inovasi V1',
            'file' => $file,
        ]);

        $doc = CompetitionDocument::where('participation_id', $participation->id)->first();
        $this->assertNotNull($doc);
        $this->assertEquals(1, $doc->version);
        $this->assertEquals('pending', $doc->status);

        // Mentor reviews document
        $this->actingAs($this->lecturer)->post(route('competitions.documents.review', [$participation->id, $doc->id]), [
            'status' => 'approved',
            'feedback' => 'Analisis kebutuhan sudah sangat komprehensif.',
        ]);

        $doc->refresh();
        $this->assertEquals('approved', $doc->status);
        $this->assertEquals('Analisis kebutuhan sudah sangat komprehensif.', $doc->feedback);
    }

    public function test_record_result_and_verification_into_student_verified_portfolio(): void
    {
        $competition = Competition::create([
            'campus_id' => $this->campus->id,
            'created_by' => $this->admin->id,
            'name' => 'Gemastik Final',
            'slug' => 'gemastik-final',
            'organizer' => 'Kemendikbud',
            'category' => CompetitionCategory::Programming,
            'status' => CompetitionStatus::Open,
            'verification_status' => VerificationStatus::Verified,
        ]);

        $team = Team::create([
            'campus_id' => $this->campus->id,
            'leader_id' => $this->studentLeader->id,
            'type' => TeamType::Competition,
            'name' => 'Polindra Juara',
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->studentLeader->id,
            'permission' => TeamPermission::Leader,
            'status' => 'active',
            'role_name' => 'Fullstack Developer',
        ]);
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $this->studentMember->id,
            'permission' => TeamPermission::Member,
            'status' => 'active',
            'role_name' => 'UI/UX Designer',
        ]);

        $participation = CompetitionParticipation::create([
            'competition_id' => $competition->id,
            'team_id' => $team->id,
            'stage' => 'finalist',
        ]);

        // Leader records outcome: 1st Place
        $cert = UploadedFile::fake()->create('sertifikat_juara.pdf', 500, 'application/pdf');
        $response = $this->actingAs($this->studentLeader)->post(route('competitions.result.record', $participation->id), [
            'outcome' => '1st_place',
            'achievement_title' => 'Juara 1 Gemastik Bidang Software Development',
            'rank' => 1,
            'notes' => 'Meraih medali emas nasional.',
            'certificate' => $cert,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $participation->refresh();
        $result = $participation->result;
        $this->assertNotNull($result);
        $this->assertEquals('1st_place', $result->outcome->value ?? $result->outcome);

        // Lecturer / Admin verifies the result
        $this->actingAs($this->lecturer)->post(route('competitions.result.verify', $participation->id));

        $result->refresh();
        $this->assertEquals('verified', $result->verification_status);

        // Assert that both team members have verified Achievement records in their portfolio!
        $this->assertDatabaseHas('achievements', [
            'user_id' => $this->studentLeader->id,
            'participation_id' => $participation->id,
            'type' => AchievementType::CompetitionResult->value,
            'verification_status' => AchievementVerification::Verified->value,
        ]);

        $this->assertDatabaseHas('achievements', [
            'user_id' => $this->studentMember->id,
            'participation_id' => $participation->id,
            'type' => AchievementType::CompetitionResult->value,
            'verification_status' => AchievementVerification::Verified->value,
        ]);
    }
}
