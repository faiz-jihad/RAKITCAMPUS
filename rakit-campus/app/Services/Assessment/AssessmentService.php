<?php

namespace App\Services\Assessment;

use App\Models\AcademicClass;
use App\Models\ActivityLog;
use App\Models\AssessmentPeriod;
use App\Models\AssessmentRubric;
use App\Models\LecturerReview;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\ProjectProposal;
use App\Models\ProjectSubmission;
use App\Models\SubmissionDocument;
use App\Models\SubmissionSnapshot;
use App\Models\Task;
use App\Models\User;
use App\Services\Matchmaking\MembershipService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AssessmentService
{
    public function __construct(
        protected MembershipService $membershipService
    ) {}

    /**
     * Ensure default UTS and UAS assessment periods exist with rubrics for a class.
     */
    public function ensureDefaultPeriodsForClass(AcademicClass $class): array
    {
        $campusId = $class->campus_id;
        $classId = $class->id;
        $academicYear = $class->academic_year . ' ' . $class->semester;

        // 1. UTS Period
        $uts = AssessmentPeriod::firstOrCreate(
            [
                'academic_class_id' => $classId,
                'type' => 'uts',
            ],
            [
                'campus_id' => $campusId,
                'name' => 'Evaluasi Tengah Semester (UTS)',
                'academic_period' => $academicYear,
                'description' => 'Evaluasi progres tengah semester: Pengujian arsitektur, living proposal, implementasi sprint awal, dan presentasi milestone UTS.',
                'opens_at' => now()->subDays(14),
                'deadline' => now()->addWeeks(6),
                'weight' => 40,
                'max_score' => 100,
                'required_documents' => ['report_pdf', 'presentation_ppt', 'repo_link'],
                'is_active' => true,
                'created_by' => $class->lecturer_id,
            ]
        );

        if ($uts->rubrics()->count() === 0) {
            AssessmentRubric::create([
                'assessment_period_id' => $uts->id,
                'criteria' => 'Identifikasi Masalah & Solusi Arsitektur Sistem',
                'description' => 'Ketajaman rumusan masalah, relevansi solusi, dan ketepatan rancangan arsitektur teknologi.',
                'weight' => 25,
                'max_points' => 100,
                'order' => 1,
            ]);
            AssessmentRubric::create([
                'assessment_period_id' => $uts->id,
                'criteria' => 'Progress Implementasi Fitur Pra-UTS',
                'description' => 'Pencapaian backlog tugas, manajemen Kanban board, dan fungsi fitur modul awal.',
                'weight' => 35,
                'max_points' => 100,
                'order' => 2,
            ]);
            AssessmentRubric::create([
                'assessment_period_id' => $uts->id,
                'criteria' => 'Kualitas Living Proposal & Metodologi',
                'description' => 'Kerapihan dokumentasi proposal teknis, analisis kebutuhan, dan jadwal pengerjaan.',
                'weight' => 20,
                'max_points' => 100,
                'order' => 3,
            ]);
            AssessmentRubric::create([
                'assessment_period_id' => $uts->id,
                'criteria' => 'Presentasi & Penguasaan Materi Anggota Tim',
                'description' => 'Kesesuaian slide presentasi PPT, kekompakan tim, dan penguasaan teknis pembagian peran.',
                'weight' => 20,
                'max_points' => 100,
                'order' => 4,
            ]);
        }

        // 2. UAS Period
        $uas = AssessmentPeriod::firstOrCreate(
            [
                'academic_class_id' => $classId,
                'type' => 'uas',
            ],
            [
                'campus_id' => $campusId,
                'name' => 'Evaluasi Akhir Semester (UAS)',
                'academic_period' => $academicYear,
                'description' => 'Evaluasi akhir capaian proyek capstone: Produk siap pakai, living proposal final, laporan komprehensif, dan verifikasi portofolio.',
                'opens_at' => now()->addWeeks(6),
                'deadline' => now()->addWeeks(16),
                'weight' => 60,
                'max_score' => 100,
                'required_documents' => ['report_pdf', 'presentation_ppt', 'repo_link', 'demo_link'],
                'is_active' => true,
                'created_by' => $class->lecturer_id,
            ]
        );

        if ($uas->rubrics()->count() === 0) {
            AssessmentRubric::create([
                'assessment_period_id' => $uas->id,
                'criteria' => 'Kelengkapan Fitur & Keselarasan Solusi Produk Final',
                'description' => 'Produk fungsional 100%, seluruh kebutuhan fungsional terpenuhi, dan sistem berjalan stabil tanpa fatal crash.',
                'weight' => 35,
                'max_points' => 100,
                'order' => 1,
            ]);
            AssessmentRubric::create([
                'assessment_period_id' => $uas->id,
                'criteria' => 'Kualitas Kode, Arsitektur & Pengujian (QA)',
                'description' => 'Clean code, keamanan otorisasi, dokumentasi API, dan bukti uji fungsionalitas.',
                'weight' => 25,
                'max_points' => 100,
                'order' => 2,
            ]);
            AssessmentRubric::create([
                'assessment_period_id' => $uas->id,
                'criteria' => 'Living Proposal Final & Laporan Komprehensif',
                'description' => 'Kelengkapan evolusi proposal dari v1 hingga versi final, kesimpulan, dan evaluasi hasil proyek.',
                'weight' => 20,
                'max_points' => 100,
                'order' => 3,
            ]);
            AssessmentRubric::create([
                'assessment_period_id' => $uas->id,
                'criteria' => 'Presentasi Akhir, Demo Produk & Portofolio',
                'description' => 'Live demo aplikasi, kejelasan paparan produk, dan kesiapan publikasi hasil karya.',
                'weight' => 20,
                'max_points' => 100,
                'order' => 4,
            ]);
        }

        return [$uts->load('rubrics'), $uas->load('rubrics')];
    }

    /**
     * Submit an assessment (UTS or UAS) with an IMMUTABLE snapshot of the project.
     */
    public function submitAssessment(
        Project $project,
        AssessmentPeriod $period,
        User $user,
        array $data,
        array $files = []
    ): ProjectSubmission {
        return DB::transaction(function () use ($project, $period, $user, $data, $files) {
            // Ensure living proposal is initialized
            $proposal = ProjectProposal::ensureForProject($project);
            $proposalVersion = $proposal->currentVersion;

            // Fetch or create the project submission
            $submission = ProjectSubmission::firstOrCreate(
                [
                    'project_id' => $project->id,
                    'assessment_period_id' => $period->id,
                ],
                [
                    'status' => 'draft',
                    'current_version' => 1,
                ]
            );

            $newSnapshotVersion = ($submission->snapshots()->max('version_number') ?? 0) + 1;

            // 1. Gather exact snapshot metrics at this time
            $implementationProgress = $project->calculateImplementationProgress();

            $team = $project->team;
            $tasksSummary = [
                'total' => $team ? Task::where('team_id', $team->id)->count() : 0,
                'completed' => $team ? Task::where('team_id', $team->id)->where('status', 'completed')->count() : 0,
                'in_progress' => $team ? Task::where('team_id', $team->id)->where('status', 'in_progress')->count() : 0,
                'in_review' => $team ? Task::where('team_id', $team->id)->where('status', 'in_review')->count() : 0,
                'todo' => $team ? Task::where('team_id', $team->id)->where('status', 'todo')->count() : 0,
            ];

            $milestonesSummary = $team ? Milestone::where('team_id', $team->id)->get()->map(fn ($m) => [
                'id' => $m->id,
                'title' => $m->title,
                'status' => $m->status,
                'starts_on' => $m->starts_on?->format('d M Y'),
                'due_on' => $m->due_on?->format('d M Y'),
            ])->toArray() : [];

            $teamMembersSnapshot = $team ? $team->members()->with('user:id,name,email')->get()->map(fn ($m) => [
                'user_id' => $m->user_id,
                'name' => $m->user?->name,
                'role' => $m->role_name ?? ($m->permission === 'leader' ? 'Leader' : 'Anggota'),
            ])->toArray() : [];

            // 2. CREATE THE IMMUTABLE SUBMISSION SNAPSHOT
            $snapshot = SubmissionSnapshot::create([
                'project_submission_id' => $submission->id,
                'version_number' => $newSnapshotVersion,
                'proposal_version_id' => $proposalVersion?->id,
                'proposal_snapshot_data' => $proposalVersion ? $proposalVersion->toSnapshotArray() : [
                    'title' => $project->title,
                    'abstract' => $project->short_description,
                    'problem_statement' => $project->problem_statement,
                    'objectives' => $project->objectives,
                    'proposed_solution' => $project->proposed_solution,
                    'tech_stack' => $project->tech_stack,
                ],
                'progress_percentage' => $implementationProgress,
                'tasks_summary' => $tasksSummary,
                'milestones_summary' => $milestonesSummary,
                'team_members_snapshot' => $teamMembersSnapshot,
                'notes' => $data['submission_notes'] ?? null,
                'submitted_by' => $user->id,
                'submitted_at' => now(),
            ]);

            // 3. Process uploaded files
            foreach ($files as $type => $uploadedFile) {
                if ($uploadedFile instanceof UploadedFile) {
                    $path = $uploadedFile->store("submissions/{$project->id}/{$period->id}", 'public');

                    SubmissionDocument::create([
                        'project_submission_id' => $submission->id,
                        'submission_snapshot_id' => $snapshot->id,
                        'type' => $type,
                        'title' => ucwords(str_replace('_', ' ', $type)),
                        'file_path' => $path,
                        'original_name' => $uploadedFile->getClientOriginalName(),
                        'mime_type' => $uploadedFile->getMimeType() ?: 'application/octet-stream',
                        'file_size' => $uploadedFile->getSize() ?: 0,
                        'uploaded_by' => $user->id,
                    ]);
                }
            }

            // 4. Update the Submission record
            $submission->update([
                'status' => 'submitted',
                'current_version' => $newSnapshotVersion,
                'submitted_at' => now(),
                'submitted_by' => $user->id,
                'repository_url' => $data['repository_url'] ?? $submission->repository_url ?? $project->repository_url,
                'demo_url' => $data['demo_url'] ?? $submission->demo_url ?? $project->demo_url,
                'submission_notes' => $data['submission_notes'] ?? $submission->submission_notes,
                'challenges_and_solutions' => $data['challenges_and_solutions'] ?? $submission->challenges_and_solutions,
                'next_steps' => $data['next_steps'] ?? $submission->next_steps,
            ]);

            if ($team) {
                ActivityLog::log(
                    $project->campus_id,
                    $team->id,
                    $user->id,
                    'assessment_submitted',
                    $submission,
                    [
                        'assessment_name' => $period->name,
                        'assessment_type' => $period->type,
                        'progress_snapshot' => $implementationProgress,
                        'proposal_version' => $proposalVersion?->version_number ?? 1,
                    ]
                );
            }

            return $submission->fresh(['snapshots', 'documents']);
        });
    }

    /**
     * Lecturer reviews an assessment submission, scores rubrics, and optionally finalizes project.
     */
    public function reviewSubmission(
        ProjectSubmission $submission,
        User $lecturer,
        array $data
    ): LecturerReview {
        return DB::transaction(function () use ($submission, $lecturer, $data) {
            $period = $submission->assessmentPeriod;
            $rubrics = $period->rubrics;

            $rubricScoresInput = $data['rubric_scores'] ?? [];
            $scoredRubrics = [];
            $computedScore = 0.0;
            $totalWeight = 0;

            foreach ($rubrics as $rubric) {
                $points = (float) ($rubricScoresInput[$rubric->id] ?? $rubricScoresInput[(string) $rubric->id] ?? 80);
                $weight = $rubric->weight ?: 25;
                $weightedPoints = ($points * ($weight / 100));
                $computedScore += $weightedPoints;
                $totalWeight += $weight;

                $scoredRubrics[] = [
                    'rubric_id' => $rubric->id,
                    'criteria' => $rubric->criteria,
                    'weight' => $weight,
                    'points' => $points,
                    'weighted_points' => round($weightedPoints, 2),
                ];
            }

            if ($totalWeight > 0 && $totalWeight !== 100) {
                $computedScore = ($computedScore / $totalWeight) * 100;
            }

            $computedScore = round($computedScore, 2);

            // Compute Grade
            $grade = match (true) {
                $computedScore >= 85 => 'A',
                $computedScore >= 78 => 'AB',
                $computedScore >= 70 => 'B',
                $computedScore >= 63 => 'BC',
                $computedScore >= 55 => 'C',
                $computedScore >= 45 => 'D',
                default => 'E',
            };

            $decision = $data['decision'] ?? 'accepted';

            $review = LecturerReview::create([
                'project_submission_id' => $submission->id,
                'submission_snapshot_id' => $submission->latestSnapshot?->id,
                'reviewer_id' => $lecturer->id,
                'rubric_scores' => $scoredRubrics,
                'total_score' => $computedScore,
                'feedback' => $data['feedback'] ?? null,
                'revision_notes' => $data['revision_notes'] ?? null,
                'decision' => $decision,
                'reviewed_at' => now(),
            ]);

            $submission->update([
                'status' => $decision === 'revision_required' ? 'revision_required' : 'accepted',
                'total_score' => $computedScore,
                'final_grade' => $grade,
                'evaluated_at' => now(),
                'evaluated_by' => $lecturer->id,
            ]);

            // If UAS accepted and complete_project is requested, complete the project & release Rule 1
            if ($period->type === 'uas' && $decision === 'accepted' && ! empty($data['complete_project'])) {
                $project = $submission->project;
                $this->membershipService->completeProject($project, $lecturer->id);
            }

            if ($submission->project?->team) {
                ActivityLog::log(
                    $submission->project->campus_id,
                    $submission->project->team->id,
                    $lecturer->id,
                    'assessment_evaluated',
                    $review,
                    [
                        'assessment_name' => $period->name,
                        'total_score' => $computedScore,
                        'grade' => $grade,
                        'decision' => $decision,
                    ]
                );
            }

            return $review;
        });
    }
}
