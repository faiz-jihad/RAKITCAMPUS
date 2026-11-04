<?php

namespace Tests\Feature;

use App\Enums\AchievementVerification;
use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Enums\Visibility;
use App\Models\AcademicClass;
use App\Models\Achievement;
use App\Models\AssessmentPeriod;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\ProjectProposal;
use App\Models\ProjectProposalVersion;
use App\Models\ProjectSubmission;
use App\Models\Skill;
use App\Models\StudentProfile;
use App\Models\SubmissionSnapshot;
use App\Models\Task;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Assessment\AssessmentService;
use App\Services\Proposal\ProposalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectHubLivingProposalAndAssessmentTest extends TestCase
{
    use RefreshDatabase;

    protected Campus $campus;
    protected User $lecturer;
    protected User $studentLeader;
    protected User $studentMember;
    protected User $otherStudent;
    protected AcademicClass $academicClass;
    protected Project $project;
    protected Team $team;
    protected AssessmentPeriod $utsPeriod;
    protected AssessmentPeriod $uasPeriod;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Campus & Users Setup
        $this->campus = Campus::create([
            'name' => 'Politeknik Negeri Indramayu',
            'slug' => 'polindra',
            'domain' => 'polindra.ac.id',
            'is_active' => true,
        ]);

        $this->lecturer = User::factory()->create(['name' => 'Dr. Budi Santoso, M.T.']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->lecturer->id,
            'role' => CampusRole::Lecturer->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => 'NIDN-0412088102',
        ]);

        $this->studentLeader = User::factory()->create(['name' => 'Ketua Tim']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentLeader->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => '2301001',
        ]);
        $s1 = Skill::firstOrCreate(['slug' => 'laravel'], ['name' => 'Laravel', 'category' => 'backend']);
        $s2 = Skill::firstOrCreate(['slug' => 'react'], ['name' => 'React', 'category' => 'frontend']);

        $spLeader = StudentProfile::create([
            'user_id' => $this->studentLeader->id,
            'campus_id' => $this->campus->id,
            'slug' => 'ketua-tim',
            'department' => 'Teknik Informatika',
            'study_program' => 'Rekayasa Perangkat Lunak',
            'availability_hours' => 25,
            'visibility' => Visibility::Campus,
            'interests' => ['Web Development', 'AI'],
            'preferred_roles' => ['Backend Developer'],
        ]);
        $spLeader->skills()->attach([$s1->id => ['proficiency' => 3], $s2->id => ['proficiency' => 2]]);

        $this->studentMember = User::factory()->create(['name' => 'Anggota Tim']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->studentMember->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => '2301002',
        ]);
        $spMember = StudentProfile::create([
            'user_id' => $this->studentMember->id,
            'campus_id' => $this->campus->id,
            'slug' => 'anggota-tim',
            'department' => 'Teknik Informatika',
            'study_program' => 'Rekayasa Perangkat Lunak',
            'availability_hours' => 20,
            'visibility' => Visibility::Campus,
            'interests' => ['Frontend Development', 'UI/UX Design'],
            'preferred_roles' => ['Frontend Developer'],
        ]);
        $spMember->skills()->attach([$s1->id => ['proficiency' => 2], $s2->id => ['proficiency' => 3]]);

        $this->otherStudent = User::factory()->create(['name' => 'Mahasiswa Luar']);
        CampusMembership::create([
            'campus_id' => $this->campus->id,
            'user_id' => $this->otherStudent->id,
            'role' => CampusRole::Student->value,
            'status' => MembershipStatus::Active->value,
            'verification_status' => VerificationStatus::Verified->value,
            'student_number' => '2301099',
        ]);
        $spOther = StudentProfile::create([
            'user_id' => $this->otherStudent->id,
            'campus_id' => $this->campus->id,
            'slug' => 'mahasiswa-luar',
            'department' => 'Teknik Informatika',
            'study_program' => 'Rekayasa Perangkat Lunak',
            'availability_hours' => 15,
            'visibility' => Visibility::Campus,
        ]);
        $spOther->skills()->attach([$s1->id => ['proficiency' => 2], $s2->id => ['proficiency' => 2]]);

        // 2. Academic Class Setup
        $this->academicClass = AcademicClass::create([
            'campus_id' => $this->campus->id,
            'lecturer_id' => $this->lecturer->id,
            'name' => 'TI-3A Capstone Project',
            'code' => 'TI3A-CAP',
            'join_code' => 'TI3ACAP',
            'study_program' => 'Teknik Informatika',
            'academic_year' => '2026/2027',
            'semester' => 'Ganjil',
            'target_team_size' => 4,
            'status' => 'active',
        ]);

        $this->academicClass->students()->attach([
            $this->studentLeader->id => ['status' => 'enrolled', 'student_number' => '2301001'],
            $this->studentMember->id => ['status' => 'enrolled', 'student_number' => '2301002'],
        ]);

        // 3. Project & Team Setup
        $this->project = Project::create([
            'campus_id' => $this->campus->id,
            'academic_class_id' => $this->academicClass->id,
            'leader_id' => $this->studentLeader->id,
            'title' => 'Sistem Informasi Rekam Medis Terintegrasi Polindra',
            'slug' => 'sistem-rekam-medis-polindra',
            'short_description' => 'Platform rekam medis berbasis web terstandar HL7/FHIR.',
            'category' => ProjectCategory::Academic->value,
            'problem_statement' => 'Antrean manual dan ketidakteraturan riwayat pasien di klinik kampus.',
            'objectives' => 'Membangun sistem antrean dan rekam medis digital responsif.',
            'proposed_solution' => 'Web application dengan backend Laravel dan frontend React.',
            'tech_stack' => ['Laravel', 'React', 'Tailwind CSS', 'PostgreSQL'],
            'difficulty' => 'intermediate',
            'min_team_size' => 2,
            'max_team_size' => 4,
            'visibility' => Visibility::Campus->value,
            'status' => ProjectStatus::InProgress->value,
            'progress' => 0,
        ]);

        $this->team = Team::create([
            'campus_id' => $this->campus->id,
            'project_id' => $this->project->id,
            'leader_id' => $this->studentLeader->id,
            'name' => 'MedTech Innovations',
            'type' => TeamType::Project->value,
            'capacity' => 4,
        ]);

        TeamMember::create([
            'team_id' => $this->team->id,
            'user_id' => $this->studentLeader->id,
            'permission' => TeamPermission::Leader->value,
            'status' => 'active',
        ]);

        TeamMember::create([
            'team_id' => $this->team->id,
            'user_id' => $this->studentMember->id,
            'permission' => TeamPermission::Member->value,
            'status' => 'active',
        ]);

        // 4. Default Assessment Periods (UTS & UAS)
        $assessmentService = app(AssessmentService::class);
        [$this->utsPeriod, $this->uasPeriod] = $assessmentService->ensureDefaultPeriodsForClass($this->academicClass);
    }

    public function test_single_living_proposal_per_project_with_version_history(): void
    {
        // 1. Living Proposal is automatically initialized
        $proposal = ProjectProposal::ensureForProject($this->project);
        $this->assertNotNull($proposal);
        $this->assertEquals(1, $proposal->latest_version_number);

        $v1 = $proposal->currentVersion;
        $this->assertNotNull($v1);
        $this->assertEquals(1, $v1->version_number);
        $this->assertEquals('draft', $v1->status);

        // 2. Student updates proposal draft
        $response = $this->actingAs($this->studentLeader)
            ->post("/projects/{$this->project->id}/proposal/draft", [
                'title' => 'Sistem Rekam Medis Polindra Modern',
                'abstract' => 'Pembaruan abstrak proposal living.',
                'problem_statement' => 'Problem statement detail v1.',
                'objectives' => 'Tujuan komprehensif sistem rekam medis.',
                'needs_analysis' => 'Kebutuhan fungsional antrean dan e-resep.',
                'system_architecture' => 'Microservices backend dengan API Gateway.',
                'methodology' => 'Scrum Framework 2-week sprint.',
            ]);

        $response->assertRedirect();
        $v1->refresh();
        $this->assertEquals('Sistem Rekam Medis Polindra Modern', $v1->title);
        $this->assertEquals('Problem statement detail v1.', $v1->problem_statement);

        // 3. Student submits proposal for lecturer review
        $this->actingAs($this->studentMember)
            ->post("/projects/{$this->project->id}/proposal/submit")
            ->assertRedirect();

        $v1->refresh();
        $this->assertEquals('submitted', $v1->status);
        $this->assertEquals('submitted', $proposal->fresh()->status);

        // 4. Lecturer reviews proposal and approves it
        $this->actingAs($this->lecturer)
            ->post("/projects/{$this->project->id}/proposal/{$v1->id}/review", [
                'decision' => 'approved',
                'review_notes' => 'Proposal sangat baik, arsitektur jelas. Lanjutkan pengerjaan sprint.',
            ])
            ->assertRedirect();

        $v1->refresh();
        $this->assertEquals('approved', $v1->status);
        $this->assertTrue($v1->is_locked);
        $this->assertEquals('approved', $proposal->fresh()->status);
        $this->assertNotNull($proposal->fresh()->approved_at);

        // 5. Revising creates version 2 (immutable v1 is preserved)
        $this->actingAs($this->studentLeader)
            ->post("/projects/{$this->project->id}/proposal/revise", [
                'change_summary' => 'Penambahan modul integrasi BPJS Kesehatan.',
            ])
            ->assertRedirect();

        $proposal->refresh();
        $this->assertEquals(2, $proposal->latest_version_number);

        $v2 = $proposal->currentVersion;
        $this->assertEquals(2, $v2->version_number);
        $this->assertEquals('draft', $v2->status);

        // Earlier version 1 remains intact in database
        $this->assertDatabaseHas('project_proposal_versions', [
            'id' => $v1->id,
            'version_number' => 1,
            'status' => 'approved',
            'is_locked' => true,
        ]);
        $this->assertEquals(2, $proposal->versions()->count());
    }

    public function test_parallel_implementation_progress_calculation(): void
    {
        // 1. Create Tasks on Kanban
        $task1 = Task::create([
            'campus_id' => $this->campus->id,
            'team_id' => $this->team->id,
            'created_by' => $this->studentLeader->id,
            'title' => 'Perancangan Skema Database Pasien',
            'status' => TaskStatus::Completed->value,
            'priority' => TaskPriority::High->value,
        ]);

        $task2 = Task::create([
            'campus_id' => $this->campus->id,
            'team_id' => $this->team->id,
            'created_by' => $this->studentLeader->id,
            'title' => 'Integrasi API Autentikasi',
            'status' => TaskStatus::InProgress->value,
            'priority' => TaskPriority::Medium->value,
        ]);

        // 2. Create Milestone
        $milestone = Milestone::create([
            'campus_id' => $this->campus->id,
            'team_id' => $this->team->id,
            'created_by' => $this->studentLeader->id,
            'title' => 'Milestone 1: Backend Architecture',
            'status' => 'in_progress',
        ]);

        // Progress: 1/2 tasks (50%) + 0/1 milestones (0%) => (0.50 * 50) + (0.50 * 0) = 25%
        $progress = $this->project->calculateImplementationProgress();
        $this->assertEquals(25, $progress);

        // Mark milestone completed
        $milestone->update(['status' => 'completed']);
        // Progress: 1/2 tasks (50%) + 1/1 milestones (100%) => (0.50 * 50) + (0.50 * 100) = 75%
        $this->assertEquals(75, $this->project->calculateImplementationProgress());
    }

    public function test_uts_submission_stores_immutable_snapshot_which_does_not_change_after_later_revisions(): void
    {
        Storage::fake('public');

        // Prepare v2 proposal and 50% implementation progress
        $proposal = ProjectProposal::ensureForProject($this->project);
        $v1 = $proposal->currentVersion;
        $v1->update(['title' => 'Proposal v1 Awal', 'is_locked' => true, 'status' => 'approved']);

        $proposalService = app(ProposalService::class);
        $v2 = $proposalService->createRevision($proposal, $this->studentLeader, [
            'title' => 'Proposal Rekam Medis v2 (Saat UTS)',
            'problem_statement' => 'Problem statement saat UTS berlangsung.',
            'change_summary' => 'Revisi UTS.',
        ]);

        Task::create([
            'campus_id' => $this->campus->id,
            'team_id' => $this->team->id,
            'created_by' => $this->studentLeader->id,
            'title' => 'Task Selesai Pra-UTS',
            'status' => TaskStatus::Completed->value,
            'priority' => TaskPriority::High->value,
        ]);
        Task::create([
            'campus_id' => $this->campus->id,
            'team_id' => $this->team->id,
            'created_by' => $this->studentLeader->id,
            'title' => 'Task Belum Selesai',
            'status' => TaskStatus::Todo->value,
            'priority' => TaskPriority::Medium->value,
        ]);

        $reportFile = UploadedFile::fake()->create('laporan_uts.pdf', 1024, 'application/pdf');
        $pptFile = UploadedFile::fake()->create('presentasi_uts.pptx', 2048, 'application/vnd.openxmlformats-officedocument.presentationml.presentation');

        // 1. Submit UTS Report
        $this->actingAs($this->studentLeader)
            ->post("/projects/{$this->project->id}/assessments/{$this->utsPeriod->id}/submit", [
                'repository_url' => 'https://github.com/polindra/rekam-medis-uts',
                'demo_url' => 'https://uts.rekam-medis.polindra.ac.id',
                'submission_notes' => 'Pengumpulan berkas dan progres UTS.',
                'challenges_and_solutions' => 'Tantangan integrasi database teratasi.',
                'next_steps' => 'Pengerjaan modul resep digital pasca-UTS.',
                'report_pdf' => $reportFile,
                'presentation_ppt' => $pptFile,
            ])
            ->assertRedirect();

        $utsSubmission = ProjectSubmission::where('project_id', $this->project->id)
            ->where('assessment_period_id', $this->utsPeriod->id)
            ->first();

        $this->assertNotNull($utsSubmission);
        $this->assertEquals('submitted', $utsSubmission->status);

        // Verify UTS Snapshot was created
        $utsSnapshot = $utsSubmission->latestSnapshot;
        $this->assertNotNull($utsSnapshot);
        $this->assertEquals($v2->id, $utsSnapshot->proposal_version_id);
        $this->assertEquals('Proposal Rekam Medis v2 (Saat UTS)', $utsSnapshot->proposal_snapshot_data['title']);
        $this->assertEquals(50, $utsSnapshot->progress_percentage); // 50% at UTS time

        // 2. Lecturer reviews UTS and assigns rubric grades
        $rubricScores = [];
        foreach ($this->utsPeriod->rubrics as $rubric) {
            $rubricScores[$rubric->id] = 85; // All rubrics 85
        }

        $this->actingAs($this->lecturer)
            ->post("/submissions/{$utsSubmission->id}/review", [
                'rubric_scores' => $rubricScores,
                'feedback' => 'Hasil UTS sangat memuaskan, presentasi lugas.',
                'decision' => 'accepted',
            ])
            ->assertRedirect();

        $utsSubmission->refresh();
        $this->assertEquals('accepted', $utsSubmission->status);
        $this->assertEquals(85, $utsSubmission->total_score);
        $this->assertEquals('A', $utsSubmission->final_grade);

        // 3. AFTER UTS: Student updates proposal to v3 and advances progress to 100%
        $v3 = $proposalService->createRevision($proposal, $this->studentLeader, [
            'title' => 'Proposal Final Rekam Medis v3 (Menjelang UAS)',
            'problem_statement' => 'Problem statement final.',
            'change_summary' => 'Revisi menyeluruh pasca-evaluasi UTS.',
        ]);

        // Complete all tasks
        Task::where('team_id', $this->team->id)->update(['status' => TaskStatus::Completed->value]);
        $this->assertEquals(100, $this->project->calculateImplementationProgress());

        // CRITICAL VERIFICATION: Historical UTS snapshot MUST NOT HAVE CHANGED!
        $utsSnapshot->refresh();
        $this->assertEquals(2, $utsSnapshot->proposal_version_id);
        $this->assertEquals('Proposal Rekam Medis v2 (Saat UTS)', $utsSnapshot->proposal_snapshot_data['title']);
        $this->assertEquals(50, $utsSnapshot->progress_percentage); // Still 50%!

        // 4. Submit UAS with new snapshot reflecting v3 and 100%
        $uasReport = UploadedFile::fake()->create('laporan_uas_final.pdf', 2048, 'application/pdf');
        $this->actingAs($this->studentMember)
            ->post("/projects/{$this->project->id}/assessments/{$this->uasPeriod->id}/submit", [
                'repository_url' => 'https://github.com/polindra/rekam-medis-final',
                'demo_url' => 'https://rekam-medis.polindra.ac.id',
                'submission_notes' => 'Pengumpulan tugas akhir capstone UAS lengkap.',
                'report_pdf' => $uasReport,
            ])
            ->assertRedirect();

        $uasSubmission = ProjectSubmission::where('project_id', $this->project->id)
            ->where('assessment_period_id', $this->uasPeriod->id)
            ->first();

        $uasSnapshot = $uasSubmission->latestSnapshot;
        $this->assertNotNull($uasSnapshot);
        $this->assertEquals($v3->id, $uasSnapshot->proposal_version_id);
        $this->assertEquals('Proposal Final Rekam Medis v3 (Menjelang UAS)', $uasSnapshot->proposal_snapshot_data['title']);
        $this->assertEquals(100, $uasSnapshot->progress_percentage); // 100% at UAS time

        // 5. Lecturer grades UAS with complete_project=true
        $uasRubricScores = [];
        foreach ($this->uasPeriod->rubrics as $rubric) {
            $uasRubricScores[$rubric->id] = 92;
        }

        $this->actingAs($this->lecturer)
            ->post("/submissions/{$uasSubmission->id}/review", [
                'rubric_scores' => $uasRubricScores,
                'feedback' => 'Karya capstone luar biasa, implementasi siap digunakan klinik Polindra.',
                'decision' => 'accepted',
                'complete_project' => true,
            ])
            ->assertRedirect();

        $uasSubmission->refresh();
        $this->assertEquals('accepted', $uasSubmission->status);
        $this->assertEquals(92, $uasSubmission->total_score);
        $this->assertEquals('A', $uasSubmission->final_grade);

        // Project completed & Rule 1 released
        $this->assertEquals(ProjectStatus::Completed->value, $this->project->fresh()->status->value);
        $this->assertFalse($this->studentLeader->fresh()->hasActiveProject());
        $this->assertFalse($this->studentMember->fresh()->hasActiveProject());

        // Verified portfolio achievement is recorded
        $achievement = Achievement::where('project_id', $this->project->id)
            ->where('user_id', $this->studentLeader->id)
            ->first();
        $this->assertNotNull($achievement);
        $this->assertEquals(AchievementVerification::Verified, $achievement->verification_status);
    }

    public function test_authorization_prevents_unauthorized_users(): void
    {
        // 1. Outsider student cannot submit proposal draft
        $this->actingAs($this->otherStudent)
            ->post("/projects/{$this->project->id}/proposal/draft", [
                'title' => 'Hacked Proposal',
            ])
            ->assertForbidden();

        // 2. Outsider student cannot submit assessment
        $this->actingAs($this->otherStudent)
            ->post("/projects/{$this->project->id}/assessments/{$this->utsPeriod->id}/submit", [
                'submission_notes' => 'Hacked submission',
            ])
            ->assertForbidden();

        // 3. Student cannot review proposal
        $proposal = ProjectProposal::ensureForProject($this->project);
        $v1 = $proposal->currentVersion;
        $this->actingAs($this->studentLeader)
            ->post("/projects/{$this->project->id}/proposal/{$v1->id}/review", [
                'decision' => 'approved',
                'review_notes' => 'Self approval',
            ])
            ->assertForbidden();
    }
}
