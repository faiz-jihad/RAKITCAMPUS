<?php

namespace App\Models;

use App\Enums\ExperienceType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfileExperience extends Model
{
    protected $fillable = ['type', 'title', 'organization', 'description', 'url', 'started_on', 'ended_on'];

    protected function casts(): array
    {
        return [
            'type' => ExperienceType::class,
            'started_on' => 'date',
            'ended_on' => 'date',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class, 'student_profile_id');
    }
}
