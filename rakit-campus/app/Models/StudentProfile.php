<?php

namespace App\Models;

use App\Enums\ExperienceType;
use App\Enums\Visibility;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'campus_id', 'slug', 'photo_path', 'phone',
        'department', 'study_program', 'semester', 'bio',
        'github_url', 'linkedin_url', 'portfolio_url',
        'interests', 'preferred_roles',
        'availability_hours', 'availability_note', 'collaboration_preferences',
        'visibility', 'show_email', 'portfolio_public', 'open_to_invites',
    ];

    protected function casts(): array
    {
        return [
            'interests' => 'array',
            'preferred_roles' => 'array',
            'visibility' => Visibility::class,
            'show_email' => 'boolean',
            'portfolio_public' => 'boolean',
            'open_to_invites' => 'boolean',
            'semester' => 'integer',
            'availability_hours' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'student_skills')
            ->withPivot(['proficiency', 'category', 'experience_description', 'evidence_url'])
            ->withTimestamps();
    }

    public function experiences(): HasMany
    {
        return $this->hasMany(ProfileExperience::class);
    }

    /**
     * Profile completion (0-100) computed from real fields — not a decorative number.
     *
     * @return array{percent:int, missing:list<string>}
     */
    public function completion(): array
    {
        $checks = [
            'Study program' => filled($this->study_program),
            'Department' => filled($this->department),
            'Semester' => filled($this->semester),
            'Biography' => filled($this->bio),
            'Profile photo' => filled($this->photo_path),
            'At least 3 skills' => $this->skills()->count() >= 3,
            'Interests' => ! empty($this->interests),
            'Preferred roles' => ! empty($this->preferred_roles),
            'Availability' => filled($this->availability_hours),
            'Experience' => $this->experiences()->exists(),
            'GitHub, LinkedIn or portfolio link' => filled($this->github_url) || filled($this->linkedin_url) || filled($this->portfolio_url),
        ];

        $done = count(array_filter($checks));

        return [
            'percent' => (int) round($done / count($checks) * 100),
            'missing' => array_keys(array_filter($checks, fn ($ok) => ! $ok)),
        ];
    }
}
