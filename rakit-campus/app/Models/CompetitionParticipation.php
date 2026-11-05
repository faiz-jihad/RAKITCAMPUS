<?php

namespace App\Models;

use App\Enums\ParticipationProgress;
use App\Enums\RegistrationStatus;
use App\Enums\SubmissionStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Links a Team (and optionally an existing Project) to a Competition — the project is
 * referenced, never copied.
 */
class CompetitionParticipation extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'registration_status' => RegistrationStatus::class,
            'submission_status' => SubmissionStatus::class,
            'progress_status' => ParticipationProgress::class,
            'registered_at' => 'datetime',
            'submitted_at' => 'datetime',
            'formation_approved_at' => 'datetime',
            'is_formation_locked' => 'boolean',
        ];
    }

    public function formationApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'formation_approved_by');
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function mentors(): HasMany
    {
        return $this->hasMany(CompetitionMentor::class, 'participation_id');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(CompetitionStatusHistory::class, 'participation_id')->latest();
    }

    public function documents(): HasMany
    {
        return $this->hasMany(CompetitionDocument::class, 'participation_id');
    }

    public function result(): HasOne
    {
        return $this->hasOne(CompetitionResult::class, 'participation_id');
    }

    /**
     * Calculate objective competition preparation progress (0..100%).
     * 50% Tasks completed + 50% Required deliverables uploaded.
     */
    public function calculatePreparationProgress(): int
    {
        $team = $this->team;
        $taskScore = 0;
        if ($team) {
            $totalTasks = Task::where('team_id', $team->id)->count();
            $completedTasks = Task::where('team_id', $team->id)->where('status', 'completed')->count();
            $taskScore = $totalTasks > 0 ? ($completedTasks / $totalTasks) * 100 : 0;
        }

        $requiredDocs = $this->competition?->required_documents ?? ['proposal', 'pitch_deck'];
        $uploadedCount = 0;
        if (is_array($requiredDocs) && count($requiredDocs) > 0) {
            $uploadedKeys = $this->documents()
                ->where(function ($q) {
                    $q->whereNotNull('path')->orWhereNotNull('url');
                })
                ->pluck('required_document_key')
                ->filter()
                ->toArray();
            foreach ($requiredDocs as $reqKey) {
                if (in_array($reqKey, $uploadedKeys, true)) {
                    $uploadedCount++;
                }
            }
            $docScore = ($uploadedCount / count($requiredDocs)) * 100;
        } else {
            $docScore = $this->documents()->count() > 0 ? 100 : 0;
        }

        return (int) round((0.50 * $taskScore) + (0.50 * $docScore));
    }
}
