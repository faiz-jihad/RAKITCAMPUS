<?php

namespace App\Models;

use App\Enums\AchievementType;
use App\Enums\AchievementVerification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Achievement extends Model
{
    use HasFactory;

    protected $fillable = [
        'campus_id',
        'user_id',
        'team_id',
        'project_id',
        'participation_id',
        'type',
        'title',
        'description',
        'achieved_on',
        'evidence_url',
        'verification_status',
        'verified_by',
        'verified_at',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'type' => AchievementType::class,
            'verification_status' => AchievementVerification::class,
            'achieved_on' => 'date',
            'verified_at' => 'datetime',
            'is_public' => 'boolean',
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

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function participation(): BelongsTo
    {
        return $this->belongsTo(CompetitionParticipation::class, 'participation_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
