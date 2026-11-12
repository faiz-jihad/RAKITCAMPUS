<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamAiQuota extends Model
{
    protected $fillable = [
        'team_id', 'period_started_at', 'period_expires_at',
        'quota_limit', 'quota_used', 'idempotency_keys',
    ];

    protected $casts = [
        'period_started_at' => 'datetime',
        'period_expires_at' => 'datetime',
        'idempotency_keys' => 'array',
        'quota_limit' => 'integer',
        'quota_used' => 'integer',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function isExpired(): bool
    {
        return $this->period_expires_at && now()->isAfter($this->period_expires_at);
    }

    public function remaining(): int
    {
        if ($this->isExpired()) {
            return $this->quota_limit;
        }
        return max(0, $this->quota_limit - $this->quota_used);
    }

    public function getResetInSeconds(): ?int
    {
        if (!$this->period_expires_at || $this->isExpired()) {
            return null;
        }
        return (int) now()->diffInSeconds($this->period_expires_at, false);
    }
}
