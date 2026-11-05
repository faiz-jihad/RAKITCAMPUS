<?php

namespace Tests\Feature;

use App\Enums\AchievementType;
use App\Enums\AchievementVerification;
use App\Enums\CampusRole;
use App\Enums\CompetitionCategory;
use App\Enums\CompetitionStatus;
use App\Enums\DeliverableStatus;
use App\Enums\InvitationStatus;
use App\Enums\MembershipStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\RoundStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamStatus;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Enums\Visibility;
use App\Models\AcademicClass;
use App\Models\Achievement;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Competition;
use App\Models\CompetitionAllocation;
use App\Models\CompetitionDocument;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionResult;
use App\Models\CompetitionRound;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\Skill;
use App\Models\StudentProfile;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Matchmaking\CandidateScoringService;
use App\Services\Matchmaking\CompetitionDeliverableService;
use App\Services\Matchmaking\CompetitionMatchmakingService;
use App\Services\Matchmaking\CompetitionRoundService;
use App\Services\Matchmaking\CompetitionTeamFormationService;
use App\Services\Matchmaking\EligibilityService;
use App\Services\Matchmaking\MembershipService;
use App\Services\Matchmaking\UnifiedMembershipService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CompetitionHubComprehensiveTest extends TestCase
{
    use RefreshDatabase;

    protected Campus $campus;
    protected User $admin;
    protected User $lecturer;
    protected User $studentLeader;
    protected User $studentMember1;
    protected User $studentMember2;
    protected Skill $skillAi;
    protected Skill $skillWeb;
    protected Competition $competition1;
    protected Competition $competition2;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->campus = Campus::create([
            'name' => 'Institut Teknologi Bandung',
            'slug' => 'itb',
            'domain' => 'itb.ac.id',
            'is_active' => true,
        ]);

        $this->skillAi = Skill::firstOrCreate(['slug' => 'artificial-intelligence'], ['name' => 'Artificial Intelligence', 'category' => 'ai']);
        $this->skillWeb = Skill::firstOrCreate(['slug' => 'web-development'], ['name' => 'Web Development', 'category' => 'frontend']);

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
        $this->lecturer = User::factory()->create(['name' => 'Prof. Dr. Ir. Hendra']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->lecturer->id,
            'role' => CampusRole::Lecturer->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
        ]);

        // Student Leader
        $this->studentLeader = User::factory()->create(['name' => 'Ahmad Faiz (Leader)']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentLeader->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => '13521001',
        ]);
        $spLeader = StudentProfile::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentLeader->id,
            'student_number' => '13521001',
            'department' => 'STEI',
            'study_program' => 'Informatika',
            'availability_hours' => 20,
            'slug' => 'student-' . $this->studentLeader->id,
            'semester' => 6,
            'gpa' => 3.85,
        ]);
        $spLeader->skills()->attach([$this->skillAi->id, $this->skillWeb->id]);

        // Student Member 1
        $this->studentMember1 = User::factory()->create(['name' => 'Bima Pratama (Member 1)']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentMember1->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => '13521002',
        ]);
        $spMember1 = StudentProfile::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentMember1->id,
            'student_number' => '13521002',
            'department' => 'STEI',
            'study_program' => 'Sistem Informasi',
            'availability_hours' => 20,
            'slug' => 'student-' . $this->studentMember1->id,
            'semester' => 6,
            'gpa' => 3.70,
        ]);
        $spMember1->skills()->attach([$this->skillAi->id, $this->skillWeb->id]);

        // Student Member 2
        $this->studentMember2 = User::factory()->create(['name' => 'Citra Lestari (Member 2)']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentMember2->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => '13521003',
        ]);
        $spMember2 = StudentProfile::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentMember2->id,
            'student_number' => '13521003',
            'department' => 'STEI',
            'study_program' => 'Teknik Elektro',
            'availability_hours' => 20,
            'slug' => 'student-' . $this->studentMember2->id,
            'semester' => 6,
            'gpa' => 3.90,
        ]);
        $spMember2->skills()->attach([$this->skillAi->id, $this->skillWeb->id]);

        // Competitions
        $this->competition1 = Competition::create([
            'campus_id' => $this->campus->id,
            'created_by' => $this->admin->id,
            'name' => 'Gemastik XIX 2026',
            'slug' => 'gemastik-xix-2026',
            'organizer' => 'Puspresnas Kemendikbudristek',
            'description' => 'Pagelaran Mahasiswa Nasional Bidang TIK',
            'category' => CompetitionCategory::Hackathon->value,
            'category_tracks' => ['Data Mining', 'Software Development', 'Smart City'],
            'level' => 'Nasional',
            'type' => 'team',
            'status' => CompetitionStatus::Open->value,
            'verification_status' => VerificationStatus::Verified->value,
            'moderation_status' => 'visible',
            'min_team_size' => 2,
            'max_team_size' => 4,
            'registration_opens_at' => now()->subDays(5),
            'registration_deadline' => now()->addDays(20),
        ]);
        $this->competition1->skills()->attach([$this->skillAi->id, $this->skillWeb->id]);

        $this->competition2 = Competition::create([
            'campus_id' => $this->campus->id,
            'created_by' => $this->admin->id,
            'name' => 'Imagine Cup 2026',
            'slug' => 'imagine-cup-2026',
            'organizer' => 'Microsoft',
            'description' => 'Global student technology competition',
            'category' => CompetitionCategory::Technology->value,
            'category_tracks' => ['AI Innovation', 'Earth Sustainability'],
            'level' => 'Internasional',
            'type' => 'team',
            'status' => CompetitionStatus::Open->value,
            'verification_status' => VerificationStatus::Verified->value,
            'moderation_status' => 'visible',
            'min_team_size' => 2,
            'max_team_size' => 4,
            'registration_opens_at' => now()->subDays(5),
            'registration_deadline' => now()->addDays(20),
        ]);
    }

    /**
     * 1. Test Flexible Membership Policy:
     * - A student can join teams in 2 different competitions simultaneously.
     * - A student cannot join 2 teams in the same competition.
     * - Project Hub membership does not block Competition Hub.
     */
    public function test_flexible_membership_allows_multiple_competitions_and_project_hub_coexistence(): void
    {
        $teamFormationService = app(CompetitionTeamFormationService::class);
        $unifiedMembership = app(UnifiedMembershipService::class);

        // A. StudentLeader creates team in Competition 1
        $part1 = $teamFormationService->createTeam($this->competition1, $this->studentLeader, [
            'team_name' => 'Tim Gemastik ITB',
            'category_track' => 'Software Development',
        ]);

        $this->assertNotNull($part1->id);
        $this->assertEquals('Tim Gemastik ITB', $part1->team->name);

        // B. Under flexible policy, StudentLeader CAN also create or join a team in Competition 2
        $part2 = $teamFormationService->createTeam($this->competition2, $this->studentLeader, [
            'team_name' => 'Tim Imagine Cup ITB',
            'category_track' => 'AI Innovation',
        ]);

        $this->assertNotNull($part2->id);
        $this->assertEquals('Tim Imagine Cup ITB', $part2->team->name);

        // C. But StudentLeader CANNOT create or join a second team in the same Competition 1
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        $teamFormationService->createTeam($this->competition1, $this->studentLeader, [
            'team_name' => 'Tim Gemastik Duplikat',
        ]);
    }

    /**
     * Test Project Hub membership does not block Competition Hub participation.
     */
    public function test_project_hub_membership_does_not_block_competition_hub(): void
    {
        // 1. Give studentMember1 an active project in Project Hub
        $class = AcademicClass::create([
            'campus_id' => $this->campus->id,
            'lecturer_id' => $this->lecturer->id,
            'code' => 'IF3110',
            'name' => 'Pengembangan Aplikasi Berbasis Web',
            'semester' => 'Ganjil 2026/2027',
            'academic_year' => '2026/2027',
            'is_active' => true,
        ]);

        $projectTeam = Team::create([
            'campus_id' => $this->campus->id,
            'name' => 'Tim Kuliah Web',
            'type' => TeamType::Project->value,
            'capacity' => 4,
            'leader_id' => $this->studentMember1->id,
            'status' => TeamStatus::Active->value,
        ]);

        TeamMember::create([
            'team_id' => $projectTeam->id,
            'user_id' => $this->studentMember1->id,
            'role_name' => 'Project Leader',
            'permission' => TeamPermission::Leader->value,
            'joined_at' => now(),
        ]);

        $project = Project::create([
            'campus_id' => $this->campus->id,
            'academic_class_id' => $class->id,
            'leader_id' => $this->studentMember1->id,
            'team_id' => $projectTeam->id,
            'title' => 'Sistem Rekam Medis Kampus',
            'slug' => 'sistem-rekam-medis-kampus',
            'short_description' => 'Sistem rekam medis terpadu untuk klinik kampus.',
            'category' => ProjectCategory::Academic->value,
            'status' => ProjectStatus::InProgress->value,
            'visibility' => Visibility::Campus->value,
        ]);

        $projectTeam->update(['project_id' => $project->id]);

        // Verify studentMember1 has active project
        $unifiedMembership = app(UnifiedMembershipService::class);
        $checkProject = $unifiedMembership->canJoinProject($this->studentMember1);
        $this->assertFalse($checkProject['eligible']); // Already has 1 academic project

        // Verify studentMember1 CAN STILL join competition hub!
        $checkComp = $unifiedMembership->canJoinCompetition($this->studentMember1, null, $this->competition1->id);
        $this->assertTrue($checkComp['eligible']);
    }

    /**
     * 2. Test Recommendation Formula (Matchmaking Mode B):
     * S = (0.40 * Skill) + (0.20 * Role) + (0.20 * Availability) + (0.20 * Fairness)
     */
    public function test_matchmaking_recommendation_formula_weights(): void
    {
        $teamFormationService = app(CompetitionTeamFormationService::class);
        $part = $teamFormationService->createTeam($this->competition1, $this->studentLeader, [
            'team_name' => 'Garuda AI',
            'category_track' => 'Smart City',
        ]);

        $matchmakingService = app(CompetitionMatchmakingService::class);
        $recommendations = $matchmakingService->getRecommendedCandidates($part, $this->studentLeader, 10);

        $this->assertNotEmpty($recommendations);

        foreach ($recommendations as $candidate) {
            $this->assertArrayHasKey('final_score', $candidate);
            $this->assertArrayHasKey('breakdown', $candidate);
            $breakdown = $candidate['breakdown'];

            // Check weights
            $expectedScore = round(
                (0.40 * $breakdown['skill']) +
                (0.20 * $breakdown['role']) +
                (0.20 * $breakdown['availability']) +
                (0.20 * $breakdown['fairness'])
            );

            $this->assertEquals($expectedScore, $candidate['final_score']);
            $this->assertGreaterThanOrEqual(0, $candidate['final_score']);
            $this->assertLessThanOrEqual(100, $candidate['final_score']);
        }
    }

    /**
     * 3. Test Student-Led Invitation with Row Locking and Candidate Acceptance:
     */
    public function test_student_led_invitation_lifecycle(): void
    {
        $teamFormationService = app(CompetitionTeamFormationService::class);
        $part = $teamFormationService->createTeam($this->competition1, $this->studentLeader, [
            'team_name' => 'Nusantara Tech',
            'category_track' => 'Data Mining',
        ]);

        // Leader sends formal invitation to studentMember1
        $this->actingAs($this->studentLeader);
        $response = $this->post(route('competitions.invitations.send', $part->id), [
            'student_id' => $this->studentMember1->id,
            'role_name' => 'Fullstack Developer',
            'message' => 'Yuk gabung tim kita untuk divisi Data Mining!',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $invitation = Invitation::where('team_id', $part->team_id)
            ->where('invitee_id', $this->studentMember1->id)
            ->first();

        $this->assertNotNull($invitation);
        $this->assertEquals(InvitationStatus::Pending, $invitation->status);

        // StudentMember1 accepts the invitation
        $this->actingAs($this->studentMember1);
        $acceptResponse = $this->post(route('competitions.invitations.accept', $invitation->id));
        $acceptResponse->assertSessionHasNoErrors();

        $invitation->refresh();
        $this->assertEquals(InvitationStatus::Accepted, $invitation->status);

        // Verify studentMember1 is now in the team
        $this->assertTrue($part->team->hasMember($this->studentMember1));
    }

    /**
     * 4. Test Lecturer-Led Allocation and Student Confirmation:
     */
    public function test_lecturer_led_allocation_and_student_confirmation(): void
    {
        $teamFormationService = app(CompetitionTeamFormationService::class);
        $part = $teamFormationService->createTeam($this->competition1, $this->studentLeader, [
            'team_name' => 'Inovasi Nusantara',
        ]);

        // Lecturer allocates studentMember2 to this team
        $this->actingAs($this->lecturer);
        $allocResponse = $this->post(route('competitions.allocate-student', $this->competition1->id), [
            'student_id' => $this->studentMember2->id,
            'team_id' => $part->team_id,
            'suggested_role' => 'AI Engineer',
            'notes' => 'Rekomendasi dosen pembimbing berdasarkan keunggulan di bidang machine learning.',
        ]);

        $allocResponse->assertSessionHasNoErrors();

        $allocation = CompetitionAllocation::where('competition_id', $this->competition1->id)
            ->where('student_id', $this->studentMember2->id)
            ->first();

        $this->assertNotNull($allocation);
        $this->assertEquals('proposed', $allocation->status);

        // Student confirms allocation
        $this->actingAs($this->studentMember2);
        $confirmResponse = $this->post(route('competitions.allocations.confirm', $allocation->id));
        $confirmResponse->assertSessionHasNoErrors();

        $allocation->refresh();
        $this->assertEquals('confirmed', $allocation->status);
        $this->assertTrue($part->team->hasMember($this->studentMember2));

        // Lecturer approves team formation
        $this->actingAs($this->lecturer);
        $approveResponse = $this->post(route('competitions.formation.approve', $part->id), [
            'notes' => 'Susunan tim lengkap dan siap masuk tahap persiapan karya.',
        ]);

        $approveResponse->assertSessionHasNoErrors();
        $part->refresh();
        $this->assertEquals('confirmed', $part->formation_status);
        $this->assertEquals($this->lecturer->id, $part->formation_approved_by);
    }

    /**
     * 5. Test Competition Rounds & Deliverable Versioning:
     */
    public function test_competition_rounds_and_deliverable_versioning(): void
    {
        // Lecturer creates round 1
        $this->actingAs($this->lecturer);
        $roundResponse = $this->post(route('competitions.rounds.store', $this->competition1->id), [
            'round_number' => 1,
            'name' => 'Penyusunan Proposal Karya',
            'description' => 'Tahap seleksi berkas proposal dan arsitektur produk',
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(14)->toDateString(),
            'is_final_round' => false,
        ]);

        $roundResponse->assertSessionHasNoErrors();
        $round = CompetitionRound::where('competition_id', $this->competition1->id)->first();
        $this->assertNotNull($round);
        $this->assertEquals('Penyusunan Proposal Karya', $round->name);

        // Student leader submits Deliverable version 1
        $teamFormationService = app(CompetitionTeamFormationService::class);
        $part = $teamFormationService->createTeam($this->competition1, $this->studentLeader, [
            'team_name' => 'Tim Garuda Karya',
        ]);

        $this->actingAs($this->studentLeader);
        $file1 = UploadedFile::fake()->create('proposal_v1.pdf', 1024, 'application/pdf');
        $delivResponse1 = $this->post(route('competitions.deliverables.submit', $part->id), [
            'name' => 'Proposal Gemastik - Solusi Cerdas',
            'required_document_key' => 'proposal',
            'competition_round_id' => $round->id,
            'file' => $file1,
        ]);
        $delivResponse1->assertSessionHasNoErrors();

        $doc1 = CompetitionDocument::where('participation_id', $part->id)
            ->where('required_document_key', 'proposal')
            ->first();
        $this->assertEquals(1, $doc1->version);
        $this->assertEquals($round->id, $doc1->competition_round_id);

        // Student submits revision (version 2)
        $file2 = UploadedFile::fake()->create('proposal_v2.pdf', 1200, 'application/pdf');
        $delivResponse2 = $this->post(route('competitions.deliverables.submit', $part->id), [
            'name' => 'Proposal Gemastik - Solusi Cerdas (Revisi Bab 3)',
            'required_document_key' => 'proposal',
            'competition_round_id' => $round->id,
            'file' => $file2,
        ]);
        $delivResponse2->assertSessionHasNoErrors();

        $latestDoc = CompetitionDocument::where('participation_id', $part->id)
            ->where('required_document_key', 'proposal')
            ->latest('version')
            ->first();
        $this->assertEquals(2, $latestDoc->version);

        // Mentor reviews deliverable
        $this->actingAs($this->lecturer);
        $reviewResponse = $this->post(route('competitions.deliverables.review', [$part->id, $latestDoc->id]), [
            'status' => 'approved',
            'feedback' => 'Analisis dan arsitektur sudah matang. Siap dikirim ke portal resmi.',
        ]);
        $reviewResponse->assertSessionHasNoErrors();

        $latestDoc->refresh();
        $this->assertEquals('approved', $latestDoc->status);
    }

    /**
     * 6. Test Member Withdrawal Releases Membership:
     */
    public function test_member_withdrawal_releases_membership(): void
    {
        $teamFormationService = app(CompetitionTeamFormationService::class);
        $part = $teamFormationService->createTeam($this->competition1, $this->studentLeader, [
            'team_name' => 'Tim Pengujian Undur Diri',
        ]);

        // Add member 1 directly
        app(MembershipService::class)->addMemberToCompetitionTeam($part->team, $this->studentMember1, 'Programmer');
        $this->assertTrue($part->team->hasMember($this->studentMember1));

        // Member 1 withdraws
        $this->actingAs($this->studentMember1);
        $withdrawResponse = $this->post(route('competitions.members.withdraw', [$part->id, $this->studentMember1->id]), [
            'reason' => 'Ada jadwal magang yang bentrok dengan babak final.',
        ]);
        $withdrawResponse->assertSessionHasNoErrors();

        $part->team->refresh();
        $this->assertFalse($part->team->hasMember($this->studentMember1));

        // Member 1 is now eligible again to join another team in Competition 1!
        $eligibilityService = app(EligibilityService::class);
        $hasActive = $eligibilityService->hasActiveCompetitionMembershipIn($this->studentMember1, $this->competition1->id);
        $this->assertFalse($hasActive);
    }

    /**
     * 7. Test Result Recording and Official Portfolio Achievement Publication:
     */
    public function test_result_recording_and_portfolio_achievement_verification(): void
    {
        $teamFormationService = app(CompetitionTeamFormationService::class);
        $part = $teamFormationService->createTeam($this->competition1, $this->studentLeader, [
            'team_name' => 'Tim Juara Nasional',
        ]);

        app(MembershipService::class)->addMemberToCompetitionTeam($part->team, $this->studentMember1, 'Designer');

        // Leader records outcome
        $this->actingAs($this->studentLeader);
        $cert = UploadedFile::fake()->create('sertifikat_juara_1.pdf', 800, 'application/pdf');

        $resultResponse = $this->post(route('competitions.result.record', $part->id), [
            'outcome' => '1st_place',
            'achievement_title' => 'Juara 1 Gemastik XIX Divisi Smart City',
            'rank' => 1,
            'notes' => 'Pemenang medali emas nasional setelah presentasi final di hadapan dewan juri.',
            'certificate' => $cert,
        ]);
        $resultResponse->assertSessionHasNoErrors();

        $part->refresh();
        $this->assertNotNull($part->result);
        $this->assertEquals('1st_place', $part->result->outcome->value ?? $part->result->outcome);

        // Lecturer verifies result
        $this->actingAs($this->lecturer);
        $verifyResponse = $this->post(route('competitions.result.verify', $part->id));
        $verifyResponse->assertSessionHasNoErrors();

        $part->result->refresh();
        $this->assertEquals('verified', $part->result->verification_status);

        // Verify that Portfolio Achievement was created for BOTH studentLeader and studentMember1!
        $leaderAchievement = Achievement::where('user_id', $this->studentLeader->id)
            ->where('participation_id', $part->id)
            ->first();
        $this->assertNotNull($leaderAchievement);
        $this->assertEquals(AchievementVerification::Verified->value, $leaderAchievement->verification_status->value ?? $leaderAchievement->verification_status);

        $memberAchievement = Achievement::where('user_id', $this->studentMember1->id)
            ->where('participation_id', $part->id)
            ->first();
        $this->assertNotNull($memberAchievement);
        $this->assertEquals(AchievementVerification::Verified->value, $memberAchievement->verification_status->value ?? $memberAchievement->verification_status);
    }
}
