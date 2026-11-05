<?php

namespace App\Services\Proposal;

use App\Models\ActivityLog;
use App\Models\Project;
use App\Models\ProjectProposal;
use App\Models\ProjectProposalVersion;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProposalService
{
    /**
     * Save draft of living proposal. Updates current draft version or creates a new revision.
     */
    public function saveDraft(Project $project, User $user, array $data): ProjectProposalVersion
    {
        return DB::transaction(function () use ($project, $user, $data) {
            $proposal = ProjectProposal::ensureForProject($project);
            $currentVersion = $proposal->currentVersion;

            // If current version exists and is an unlocked draft, update it
            if ($currentVersion && ! $currentVersion->is_locked && $currentVersion->status === 'draft') {
                $currentVersion->update([
                    'title' => $data['title'] ?? $currentVersion->title,
                    'abstract' => $data['abstract'] ?? $currentVersion->abstract,
                    'problem_statement' => $data['problem_statement'] ?? $currentVersion->problem_statement,
                    'objectives' => $data['objectives'] ?? $currentVersion->objectives,
                    'target_users' => $data['target_users'] ?? $currentVersion->target_users,
                    'proposed_solution' => $data['proposed_solution'] ?? $currentVersion->proposed_solution,
                    'needs_analysis' => $data['needs_analysis'] ?? $currentVersion->needs_analysis,
                    'system_architecture' => $data['system_architecture'] ?? $currentVersion->system_architecture,
                    'methodology' => $data['methodology'] ?? $currentVersion->methodology,
                    'timeline_plan' => $data['timeline_plan'] ?? $currentVersion->timeline_plan,
                    'budget_estimate' => $data['budget_estimate'] ?? $currentVersion->budget_estimate,
                    'tech_stack' => isset($data['tech_stack']) ? (is_array($data['tech_stack']) ? $data['tech_stack'] : explode(',', (string) $data['tech_stack'])) : $currentVersion->tech_stack,
                    'change_summary' => $data['change_summary'] ?? $currentVersion->change_summary,
                ]);

                return $currentVersion->fresh();
            }

            // Otherwise, branch a new revision version
            return $this->createRevision($proposal, $user, $data);
        });
    }

    /**
     * Submit living proposal for lecturer review.
     */
    public function submitForReview(ProjectProposalVersion $version, User $user): ProjectProposalVersion
    {
        return DB::transaction(function () use ($version, $user) {
            $proposal = $version->proposal;

            $version->update([
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            $proposal->update([
                'status' => 'submitted',
            ]);

            if ($proposal->project?->team) {
                ActivityLog::log(
                    $proposal->campus_id,
                    $proposal->project->team->id,
                    $user->id,
                    'proposal_submitted',
                    $version,
                    ['version_number' => $version->version_number]
                );
            }

            app(\App\Services\Notifications\NotificationService::class)->sendProposalSubmission($proposal, $user);

            return $version->fresh();
        });
    }

    /**
     * Create a new immutable revision version (e.g. v2, v3) branched from previous.
     */
    public function createRevision(ProjectProposal $proposal, User $user, array $data = []): ProjectProposalVersion
    {
        return DB::transaction(function () use ($proposal, $user, $data) {
            $currentVersion = $proposal->currentVersion;
            if ($currentVersion) {
                $currentVersion->update(['is_locked' => true]);
            }

            $nextVersionNumber = ($proposal->latest_version_number ?? 1) + 1;

            $newVersion = ProjectProposalVersion::create([
                'proposal_id' => $proposal->id,
                'version_number' => $nextVersionNumber,
                'title' => $data['title'] ?? ($currentVersion?->title ?? $proposal->project?->title ?? 'Judul Proposal Proyek'),
                'abstract' => $data['abstract'] ?? ($currentVersion?->abstract ?? $proposal->project?->short_description),
                'problem_statement' => $data['problem_statement'] ?? $currentVersion?->problem_statement,
                'objectives' => $data['objectives'] ?? $currentVersion?->objectives,
                'target_users' => $data['target_users'] ?? $currentVersion?->target_users,
                'proposed_solution' => $data['proposed_solution'] ?? $currentVersion?->proposed_solution,
                'needs_analysis' => $data['needs_analysis'] ?? $currentVersion?->needs_analysis,
                'system_architecture' => $data['system_architecture'] ?? $currentVersion?->system_architecture,
                'methodology' => $data['methodology'] ?? $currentVersion?->methodology,
                'timeline_plan' => $data['timeline_plan'] ?? $currentVersion?->timeline_plan,
                'budget_estimate' => $data['budget_estimate'] ?? $currentVersion?->budget_estimate,
                'tech_stack' => isset($data['tech_stack']) ? (is_array($data['tech_stack']) ? $data['tech_stack'] : explode(',', (string) $data['tech_stack'])) : $currentVersion?->tech_stack,
                'change_summary' => $data['change_summary'] ?? "Revisi proposal versi {$nextVersionNumber} berdasarkan perkembangan implementasi proyek.",
                'status' => 'draft',
                'created_by' => $user->id,
                'is_locked' => false,
            ]);

            $proposal->update([
                'current_version_id' => $newVersion->id,
                'latest_version_number' => $nextVersionNumber,
                'status' => 'draft',
            ]);

            if ($proposal->project?->team) {
                ActivityLog::log(
                    $proposal->campus_id,
                    $proposal->project->team->id,
                    $user->id,
                    'proposal_revision_created',
                    $newVersion,
                    ['version_number' => $nextVersionNumber]
                );
            }

            return $newVersion;
        });
    }

    /**
     * Lecturer reviews living proposal (Approve, Request Revision, or Comment).
     */
    public function reviewVersion(ProjectProposalVersion $version, User $lecturer, string $decision, ?string $notes): ProjectProposalVersion
    {
        if (! in_array($decision, ['approved', 'revision_requested', 'rejected'], true)) {
            throw ValidationException::withMessages(['decision' => 'Keputusan review tidak valid.']);
        }

        return DB::transaction(function () use ($version, $lecturer, $decision, $notes) {
            $proposal = $version->proposal;

            $version->update([
                'status' => $decision,
                'reviewed_at' => now(),
                'reviewed_by' => $lecturer->id,
                'review_notes' => $notes,
                'is_locked' => true,
            ]);

            if ($decision === 'approved') {
                $proposal->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => $lecturer->id,
                ]);
            } else {
                $proposal->update([
                    'status' => $decision,
                ]);
            }

            if ($proposal->project?->team) {
                ActivityLog::log(
                    $proposal->campus_id,
                    $proposal->project->team->id,
                    $lecturer->id,
                    'proposal_reviewed',
                    $version,
                    ['decision' => $decision, 'notes' => $notes]
                );
            }

            app(\App\Services\Notifications\NotificationService::class)->sendProposalReview($proposal, $decision, $notes, $lecturer);

            return $version->fresh();
        });
    }

    /**
     * Compare differences between two proposal versions (Side-by-side comparison).
     */
    public function compareVersions(ProjectProposalVersion $vA, ProjectProposalVersion $vB): array
    {
        $fields = [
            'title' => 'Judul Proyek',
            'abstract' => 'Abstrak / Ringkasan',
            'problem_statement' => 'Identifikasi & Rumusan Masalah',
            'objectives' => 'Tujuan & Manfaat Proyek',
            'target_users' => 'Target Pengguna',
            'proposed_solution' => 'Solusi yang Ditawarkan',
            'needs_analysis' => 'Analisis Kebutuhan Sistem',
            'system_architecture' => 'Rancangan & Arsitektur Sistem',
            'methodology' => 'Metodologi Pengerjaan',
            'timeline_plan' => 'Rencana Timeline & Milestone',
            'budget_estimate' => 'Estimasi Anggaran',
            'tech_stack' => 'Teknologi & Tech Stack',
        ];

        $diffs = [];
        foreach ($fields as $key => $label) {
            $valA = $vA->{$key};
            $valB = $vB->{$key};

            if (is_array($valA)) {
                $valA = implode(', ', $valA);
            }
            if (is_array($valB)) {
                $valB = implode(', ', $valB);
            }

            $isChanged = trim((string) $valA) !== trim((string) $valB);

            $diffs[$key] = [
                'label' => $label,
                'version_a' => $valA,
                'version_b' => $valB,
                'is_changed' => $isChanged,
            ];
        }

        return [
            'version_a' => [
                'id' => $vA->id,
                'version_number' => $vA->version_number,
                'created_at' => $vA->created_at?->format('d M Y H:i'),
                'status' => $vA->status,
                'change_summary' => $vA->change_summary,
            ],
            'version_b' => [
                'id' => $vB->id,
                'version_number' => $vB->version_number,
                'created_at' => $vB->created_at?->format('d M Y H:i'),
                'status' => $vB->status,
                'change_summary' => $vB->change_summary,
            ],
            'diffs' => $diffs,
            'total_changes' => count(array_filter($diffs, fn ($d) => $d['is_changed'])),
        ];
    }
}
