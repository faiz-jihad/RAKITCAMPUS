<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LecturerReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_submission_id',
        'submission_snapshot_id',
        'reviewer_id',
        'rubric_scores',
        'total_score',
        'feedback',
        'revision_notes',
        'decision',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'rubric_scores' => 'array',
            'total_score' => 'decimal:2',
            'reviewed_at' => 'datetime',
        ];
    }

    public function submission(): BelongsTo
    {
        return $this->belongsTo(ProjectSubmission::class, 'project_submission_id');
    }

    public function snapshot(): BelongsTo
    {
        return $this->belongsTo(SubmissionSnapshot::class, 'submission_snapshot_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
