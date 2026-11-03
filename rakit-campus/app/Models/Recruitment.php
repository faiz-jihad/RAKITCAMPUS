<?php

namespace App\Models;

use App\Enums\RecruitmentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recruitment extends Model
{
    protected $fillable = ['campus_id', 'team_id', 'title', 'description', 'status', 'closes_at'];

    protected function casts(): array
    {
        return [
            'status' => RecruitmentStatus::class,
            'closes_at' => 'datetime',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function roles(): HasMany
    {
        return $this->hasMany(RecruitmentRole::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function isOpen(): bool
    {
        return $this->status === RecruitmentStatus::Open
            && ($this->closes_at === null || $this->closes_at->isFuture());
    }
}
