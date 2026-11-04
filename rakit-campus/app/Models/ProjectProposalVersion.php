<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectProposalVersion extends Model
{
    use HasFactory;

    protected $fillable = [
        'proposal_id',
        'version_number',
        'title',
        'abstract',
        'problem_statement',
        'objectives',
        'target_users',
        'proposed_solution',
        'needs_analysis',
        'system_architecture',
        'methodology',
        'timeline_plan',
        'budget_estimate',
        'tech_stack',
        'change_summary',
        'status',
        'created_by',
        'submitted_at',
        'reviewed_at',
        'reviewed_by',
        'review_notes',
        'is_locked',
    ];

    protected function casts(): array
    {
        return [
            'version_number' => 'integer',
            'tech_stack' => 'array',
            'is_locked' => 'boolean',
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function proposal(): BelongsTo
    {
        return $this->belongsTo(ProjectProposal::class, 'proposal_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Export complete proposal content as array for immutable snapshots.
     */
    public function toSnapshotArray(): array
    {
        return [
            'version_id' => $this->id,
            'version_number' => $this->version_number,
            'title' => $this->title,
            'abstract' => $this->abstract,
            'problem_statement' => $this->problem_statement,
            'objectives' => $this->objectives,
            'target_users' => $this->target_users,
            'proposed_solution' => $this->proposed_solution,
            'needs_analysis' => $this->needs_analysis,
            'system_architecture' => $this->system_architecture,
            'methodology' => $this->methodology,
            'timeline_plan' => $this->timeline_plan,
            'budget_estimate' => $this->budget_estimate,
            'tech_stack' => $this->tech_stack,
            'change_summary' => $this->change_summary,
            'status' => $this->status,
            'created_by' => $this->creator?->name ?? 'Tim Pengembang',
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
