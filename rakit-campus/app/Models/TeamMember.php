<?php

namespace App\Models;

use App\Enums\TeamPermission;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeamMember extends Model
{
    protected $fillable = ['team_id', 'user_id', 'permission', 'status', 'role_name', 'recruitment_role_id', 'joined_at'];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    protected function casts(): array
    {
        return [
            'permission' => TeamPermission::class,
            'joined_at' => 'datetime',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function recruitmentRole(): BelongsTo
    {
        return $this->belongsTo(RecruitmentRole::class);
    }
}
