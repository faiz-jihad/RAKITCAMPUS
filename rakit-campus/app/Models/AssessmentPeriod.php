<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'campus_id',
        'academic_class_id',
        'name',
        'type',
        'academic_period',
        'description',
        'opens_at',
        'deadline',
        'weight',
        'max_score',
        'required_documents',
        'is_active',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'opens_at' => 'datetime',
            'deadline' => 'datetime',
            'weight' => 'integer',
            'max_score' => 'integer',
            'required_documents' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    public function academicClass(): BelongsTo
    {
        return $this->belongsTo(AcademicClass::class);
    }

    public function rubrics(): HasMany
    {
        return $this->hasMany(AssessmentRubric::class)->orderBy('order', 'asc');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(ProjectSubmission::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Check if assessment window is currently open.
     */
    public function isOpen(): bool
    {
        $now = now();
        return $this->is_active && $now->gte($this->opens_at) && $now->lte($this->deadline);
    }
}
