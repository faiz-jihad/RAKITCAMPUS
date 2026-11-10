<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class AcademicClass extends Model
{
    use HasFactory;

    protected $fillable = [
        'campus_id',
        'lecturer_id',
        'name',
        'code',
        'join_code',
        'study_program',
        'academic_year',
        'semester',
        'description',
        'target_team_size',
        'status',
    ];

    protected $casts = [
        'target_team_size' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $class) {
            if (empty($class->join_code)) {
                $class->join_code = self::generateUniqueJoinCode();
            }
        });
    }

    public static function generateUniqueJoinCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (self::where('join_code', $code)->exists());

        return $code;
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    public function lecturer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lecturer_id');
    }

    public function coLecturers(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'academic_class_lecturers',
            'academic_class_id',
            'lecturer_id'
        )
            ->withPivot(['id', 'role'])
            ->withTimestamps();
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'academic_class_students',
            'academic_class_id',
            'user_id'
        )
            ->withPivot(['id', 'student_number', 'status', 'enrolled_at'])
            ->withTimestamps();
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class, 'academic_class_id');
    }

    public function guidances(): HasMany
    {
        return $this->hasMany(AcademicClassGuidance::class, 'academic_class_id')->latest();
    }

    public function assessmentPeriods(): HasMany
    {
        return $this->hasMany(AssessmentPeriod::class)->orderBy('opens_at', 'asc');
    }

    public function isLecturer(User $user): bool
    {
        if ($this->lecturer_id === $user->id) {
            return true;
        }

        if ($this->relationLoaded('coLecturers')) {
            return $this->coLecturers->contains('id', $user->id);
        }

        return $this->coLecturers()->where('users.id', $user->id)->exists();
    }

    public function hasStudent(User $user): bool
    {
        if ($this->relationLoaded('students')) {
            return $this->students->contains('id', $user->id);
        }

        return $this->students()->where('user_id', $user->id)->exists();
    }
}
