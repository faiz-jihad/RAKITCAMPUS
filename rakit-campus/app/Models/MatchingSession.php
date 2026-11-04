<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MatchingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_class_id',
        'lecturer_id',
        'title',
        'status', // simulation|approved|rejected
        'summary_metrics',
        'lecturer_review_notes',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'summary_metrics' => 'array',
            'approved_at' => 'datetime',
        ];
    }

    public function academicClass(): BelongsTo
    {
        return $this->belongsTo(AcademicClass::class);
    }

    public function lecturer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'lecturer_id');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(MatchingAllocation::class);
    }
}
