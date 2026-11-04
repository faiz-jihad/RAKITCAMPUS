<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ProjectSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'assessment_period_id',
        'status',
        'current_version',
        'submitted_at',
        'submitted_by',
        'repository_url',
        'demo_url',
        'submission_notes',
        'challenges_and_solutions',
        'next_steps',
        'total_score',
        'final_grade',
        'evaluated_at',
        'evaluated_by',
    ];

    protected function casts(): array
    {
        return [
            'current_version' => 'integer',
            'submitted_at' => 'datetime',
            'evaluated_at' => 'datetime',
            'total_score' => 'decimal:2',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assessmentPeriod(): BelongsTo
    {
        return $this->belongsTo(AssessmentPeriod::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function evaluator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'evaluated_by');
    }

    public function snapshots(): HasMany
    {
        return $this->hasMany(SubmissionSnapshot::class)->orderBy('version_number', 'desc');
    }

    public function latestSnapshot(): HasOne
    {
        return $this->hasOne(SubmissionSnapshot::class)->latestOfMany('version_number');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(SubmissionDocument::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(LecturerReview::class)->latest('reviewed_at');
    }

    public function latestReview(): HasOne
    {
        return $this->hasOne(LecturerReview::class)->latestOfMany();
    }
}
