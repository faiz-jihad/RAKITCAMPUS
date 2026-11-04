<?php

namespace App\Models;

use App\Enums\CompetitionOutcome;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionResult extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'outcome' => CompetitionOutcome::class,
            'verified_at' => 'datetime',
            'rank' => 'integer',
        ];
    }

    public function participation(): BelongsTo
    {
        return $this->belongsTo(CompetitionParticipation::class, 'participation_id');
    }

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
