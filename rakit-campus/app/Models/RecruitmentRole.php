<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecruitmentRole extends Model
{
    protected $fillable = ['recruitment_id', 'name', 'slots', 'requirements'];

    protected function casts(): array
    {
        return ['slots' => 'integer'];
    }

    public function recruitment(): BelongsTo
    {
        return $this->belongsTo(Recruitment::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    /** Slots still open: configured slots minus members actually holding this role. */
    public function vacancies(): int
    {
        return max(0, $this->slots - $this->members()->count());
    }
}
