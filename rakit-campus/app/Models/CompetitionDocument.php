<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionDocument extends Model
{
    protected $guarded = ['id'];

    protected $appends = ['file_path', 'file_url'];

    public function getFilePathAttribute(): ?string
    {
        if ($this->url) {
            return $this->url;
        }

        if ($this->path) {
            return \App\Services\Storage\ObjectStorageService::url($this->path);
        }

        return null;
    }

    public function getFileUrlAttribute(): ?string
    {
        return $this->getFilePathAttribute();
    }

    protected function casts(): array
    {
        return [
            'version' => 'integer',
            'file_size' => 'integer',
            'deadline' => 'datetime',
            'submitted_at' => 'datetime',
        ];
    }

    public function round(): BelongsTo
    {
        return $this->belongsTo(CompetitionRound::class, 'competition_round_id');
    }

    public function participation(): BelongsTo
    {
        return $this->belongsTo(CompetitionParticipation::class, 'participation_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
