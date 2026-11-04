<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubmissionSnapshot extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_submission_id',
        'version_number',
        'proposal_version_id',
        'proposal_snapshot_data',
        'progress_percentage',
        'tasks_summary',
        'milestones_summary',
        'team_members_snapshot',
        'notes',
        'submitted_by',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'version_number' => 'integer',
            'progress_percentage' => 'integer',
            'proposal_snapshot_data' => 'array',
            'tasks_summary' => 'array',
            'milestones_summary' => 'array',
            'team_members_snapshot' => 'array',
            'submitted_at' => 'datetime',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(ProjectSubmission::class, 'project_submission_id');
    }

    public function proposalVersion(): BelongsTo
    {
        return $this->belongsTo(ProjectProposalVersion::class, 'proposal_version_id');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(SubmissionDocument::class, 'submission_snapshot_id');
    }
}
