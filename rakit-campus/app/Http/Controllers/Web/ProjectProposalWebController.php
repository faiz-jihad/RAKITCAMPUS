<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectProposal;
use App\Models\ProjectProposalVersion;
use App\Services\Proposal\ProposalService;
use Illuminate\Http\Request;

class ProjectProposalWebController extends Controller
{
    public function __construct(
        protected ProposalService $proposalService
    ) {}

    /**
     * Save living proposal draft.
     */
    public function saveDraft(Request $request, int $projectId)
    {
        $user = $request->user();
        $project = Project::with(['team.members', 'academicClass'])->findOrFail($projectId);

        if (! $project->isLeader($user) && ! ($project->team?->hasMember($user)) && ! $user->isPlatformAdmin()) {
            abort(403, 'Hanya anggota kelompok proyek yang dapat memperbarui draft proposal.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'abstract' => ['nullable', 'string', 'max:2000'],
            'problem_statement' => ['nullable', 'string'],
            'objectives' => ['nullable', 'string'],
            'target_users' => ['nullable', 'string', 'max:500'],
            'proposed_solution' => ['nullable', 'string'],
            'needs_analysis' => ['nullable', 'string'],
            'system_architecture' => ['nullable', 'string'],
            'methodology' => ['nullable', 'string'],
            'timeline_plan' => ['nullable', 'string'],
            'budget_estimate' => ['nullable', 'string'],
            'tech_stack' => ['nullable'],
            'change_summary' => ['nullable', 'string', 'max:1000'],
        ]);

        $version = $this->proposalService->saveDraft($project, $user, $validated);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Draft living proposal berhasil disimpan.',
                'version' => $version,
            ]);
        }

        return back()->with('success', "Draft living proposal versi {$version->version_number} berhasil disimpan!");
    }

    /**
     * Submit living proposal for lecturer review.
     */
    public function submit(Request $request, int $projectId)
    {
        $user = $request->user();
        $project = Project::with(['team.members', 'academicClass'])->findOrFail($projectId);

        if (! $project->isLeader($user) && ! ($project->team?->hasMember($user)) && ! $user->isPlatformAdmin()) {
            abort(403, 'Hanya anggota kelompok proyek yang dapat mengajukan proposal untuk review.');
        }

        $proposal = ProjectProposal::ensureForProject($project);
        $currentVersion = $proposal->currentVersion;

        if (! $currentVersion) {
            abort(400, 'Belum ada versi proposal yang dapat diajukan.');
        }

        $this->proposalService->submitForReview($currentVersion, $user);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Living proposal berhasil diajukan untuk ditinjau oleh Dosen Pembimbing.',
                'version' => $currentVersion->fresh(),
            ]);
        }

        return back()->with('success', "Living proposal (Versi {$currentVersion->version_number}) berhasil diajukan untuk ditinjau oleh Dosen Pembimbing!");
    }

    /**
     * Create a new revision version branched from current proposal.
     */
    public function revise(Request $request, int $projectId)
    {
        $user = $request->user();
        $project = Project::with(['team.members'])->findOrFail($projectId);

        if (! $project->isLeader($user) && ! ($project->team?->hasMember($user)) && ! $user->isPlatformAdmin()) {
            abort(403, 'Hanya anggota kelompok proyek yang dapat membuat revisi proposal baru.');
        }

        $validated = $request->validate([
            'change_summary' => ['required', 'string', 'max:1000'],
        ]);

        $proposal = ProjectProposal::ensureForProject($project);
        $newVersion = $this->proposalService->createRevision($proposal, $user, $validated);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => "Revisi baru versi {$newVersion->version_number} berhasil dibuat.",
                'version' => $newVersion,
            ]);
        }

        return back()->with('success', "Revisi baru versi {$newVersion->version_number} berhasil dibuat! Silakan lanjutkan penyempurnaan dokumen.");
    }

    /**
     * Lecturer reviews living proposal (Approve, Request Revision, or Reject).
     */
    public function review(Request $request, int $projectId, int $versionId)
    {
        $user = $request->user();
        $project = Project::with(['academicClass.coLecturers'])->findOrFail($projectId);

        $isLecturer = ($project->academicClass && $project->academicClass->isLecturer($user))
            || $project->primary_supervisor_id === $user->id
            || $user->isPlatformAdmin();

        if (! $isLecturer) {
            abort(403, 'Hanya dosen pengampu atau pembimbing yang dapat meninjau dan menilai proposal.');
        }

        $version = ProjectProposalVersion::where('id', $versionId)->firstOrFail();

        $validated = $request->validate([
            'decision' => ['required', 'in:approved,revision_requested,rejected'],
            'review_notes' => ['required', 'string', 'max:2000'],
        ]);

        $this->proposalService->reviewVersion($version, $user, $validated['decision'], $validated['review_notes']);

        $label = match ($validated['decision']) {
            'approved' => 'disetujui (Approved)',
            'revision_requested' => 'diminta revisi (Revision Requested)',
            default => 'ditolak (Rejected)',
        };

        if ($request->wantsJson()) {
            return response()->json([
                'message' => "Proposal versi {$version->version_number} resmi {$label}.",
                'version' => $version->fresh(),
            ]);
        }

        return back()->with('success', "Proposal versi {$version->version_number} resmi {$label}. Catatan bimbingan telah dikirimkan ke tim mahasiswa!");
    }

    /**
     * Compare differences between two proposal versions.
     */
    public function compare(Request $request, int $projectId)
    {
        $vAId = $request->input('version_a');
        $vBId = $request->input('version_b');

        $vA = ProjectProposalVersion::findOrFail($vAId);
        $vB = ProjectProposalVersion::findOrFail($vBId);

        $diff = $this->proposalService->compareVersions($vA, $vB);

        return response()->json($diff);
    }
}
