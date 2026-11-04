<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\AssessmentPeriod;
use App\Models\Project;
use App\Models\ProjectSubmission;
use App\Services\Assessment\AssessmentService;
use Illuminate\Http\Request;

class AssessmentWebController extends Controller
{
    public function __construct(
        protected AssessmentService $assessmentService
    ) {}

    /**
     * Submit an assessment (UTS or UAS) with files and an immutable snapshot.
     */
    public function submit(Request $request, int $projectId, int $periodId)
    {
        $user = $request->user();
        $project = Project::with(['team.members', 'academicClass'])->findOrFail($projectId);

        if (! $project->isLeader($user) && ! ($project->team?->hasMember($user)) && ! $user->isPlatformAdmin()) {
            abort(403, 'Hanya anggota kelompok proyek yang dapat mengumpulkan laporan evaluasi semester.');
        }

        $period = AssessmentPeriod::with('rubrics')->findOrFail($periodId);

        $validated = $request->validate([
            'repository_url' => ['nullable', 'url', 'max:255'],
            'demo_url' => ['nullable', 'url', 'max:255'],
            'submission_notes' => ['nullable', 'string', 'max:3000'],
            'challenges_and_solutions' => ['nullable', 'string', 'max:3000'],
            'next_steps' => ['nullable', 'string', 'max:3000'],
            'report_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:20480'], // max 20MB
            'presentation_ppt' => ['nullable', 'file', 'mimes:ppt,pptx,pdf', 'max:30720'], // max 30MB
            'supporting_doc' => ['nullable', 'file', 'mimes:pdf,zip,rar', 'max:30720'],
        ]);

        $files = [];
        if ($request->hasFile('report_pdf')) {
            $files['report_pdf'] = $request->file('report_pdf');
        }
        if ($request->hasFile('presentation_ppt')) {
            $files['presentation_ppt'] = $request->file('presentation_ppt');
        }
        if ($request->hasFile('supporting_doc')) {
            $files['supporting_doc'] = $request->file('supporting_doc');
        }

        $submission = $this->assessmentService->submitAssessment(
            $project,
            $period,
            $user,
            $validated,
            $files
        );

        if ($request->wantsJson()) {
            return response()->json([
                'message' => "Pengumpulan berkas {$period->name} berhasil disimpan beserta snapshot proyek yang tidak berubah.",
                'submission' => $submission->load(['snapshots', 'documents']),
            ]);
        }

        return back()->with('success', "Pengumpulan berkas {$period->name} berhasil diserahkan! Snapshot proposal dan kemajuan proyek telah dikunci.");
    }

    /**
     * Lecturer reviews submission, scores rubrics, and submits evaluation.
     */
    public function review(Request $request, int $submissionId)
    {
        $user = $request->user();
        $submission = ProjectSubmission::with(['project.academicClass.coLecturers', 'assessmentPeriod.rubrics'])->findOrFail($submissionId);
        $project = $submission->project;

        $isLecturer = ($project->academicClass && $project->academicClass->isLecturer($user))
            || $project->primary_supervisor_id === $user->id
            || $user->isPlatformAdmin();

        if (! $isLecturer) {
            abort(403, 'Hanya dosen pengampu atau pembimbing yang dapat memberikan nilai evaluasi rubrik.');
        }

        $validated = $request->validate([
            'rubric_scores' => ['required', 'array'],
            'rubric_scores.*' => ['numeric', 'min:0', 'max:100'],
            'feedback' => ['required', 'string', 'max:3000'],
            'revision_notes' => ['nullable', 'string', 'max:2000'],
            'decision' => ['required', 'in:accepted,revision_required'],
            'complete_project' => ['nullable', 'boolean'],
        ]);

        $review = $this->assessmentService->reviewSubmission($submission, $user, $validated);

        $grade = $submission->fresh()->final_grade;
        $totalScore = $submission->fresh()->total_score;

        if ($request->wantsJson()) {
            return response()->json([
                'message' => "Evaluasi penilaian berhasil disimpan dengan Nilai: {$totalScore} ({$grade}).",
                'review' => $review,
            ]);
        }

        $statusMsg = $validated['decision'] === 'accepted'
            ? "Evaluasi penilaian {$submission->assessmentPeriod->name} berhasil disimpan dengan Nilai: {$totalScore} (Grade {$grade})."
            : "Catatan revisi {$submission->assessmentPeriod->name} berhasil dikirimkan ke tim mahasiswa.";

        if (! empty($validated['complete_project']) && $submission->assessmentPeriod->type === 'uas') {
            $statusMsg .= ' Proyek resmi dinyatakan Selesai (Completed) dan portofolio seluruh anggota telah diverifikasi!';
        }

        return back()->with('success', $statusMsg);
    }
}
