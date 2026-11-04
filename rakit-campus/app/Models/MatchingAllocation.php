<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchingAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'matching_session_id',
        'user_id',
        'project_id',
        'recruitment_role_id',
        'score',
        'compatibility_breakdown',
        'explanation',
        'status', // proposed|approved|activated|rejected
    ];

    protected function casts(): array
    {
        return [
            'compatibility_breakdown' => 'array',
            'score' => 'integer',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(MatchingSession::class, 'matching_session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function recruitmentRole(): BelongsTo
    {
        return $this->belongsTo(RecruitmentRole::class);
    }
}
