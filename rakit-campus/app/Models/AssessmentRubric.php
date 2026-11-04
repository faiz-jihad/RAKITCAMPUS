<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentRubric extends Model
{
    use HasFactory;

    protected $fillable = [
        'assessment_period_id',
        'criteria',
        'description',
        'weight',
        'max_points',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'weight' => 'integer',
            'max_points' => 'integer',
            'order' => 'integer',
        ];
    }

    public function assessmentPeriod(): BelongsTo
    {
        return $this->belongsTo(AssessmentPeriod::class);
    }
}
