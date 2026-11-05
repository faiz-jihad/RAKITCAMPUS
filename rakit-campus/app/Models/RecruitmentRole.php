<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecruitmentRole extends Model
{
    protected $fillable = [
        'recruitment_id',
        'name',
        'description',
        'slots',
        'priority',
        'requirements',
        'required_skills',
        'optional_skills',
        'min_proficiency',
    ];

    protected function casts(): array
    {
        return [
            'slots' => 'integer',
            'min_proficiency' => 'integer',
            'required_skills' => 'array',
            'optional_skills' => 'array',
        ];
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
