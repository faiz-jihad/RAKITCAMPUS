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
        ];
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

    public function documents(): HasMany
    {
        return $this->hasMany(CompetitionDocument::class, 'participation_id');
    }

    public function result(): HasOne
    {
        return $this->hasOne(CompetitionResult::class, 'participation_id');
    }
}
