<?php

namespace App\Models;

use App\Enums\CompetitionOutcome;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionResult extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['certificate_url'];

    public function getCertificatePathAttribute($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        return \App\Services\Storage\ObjectStorageService::url($value);
    }

    public function getCertificateUrlAttribute(): ?string
    {
        return $this->getCertificatePathAttribute($this->attributes['certificate_path'] ?? null);
    }

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
