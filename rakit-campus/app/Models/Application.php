<?php

namespace App\Models;

use App\Enums\ApplicationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    protected $fillable = [
        'recruitment_id',
        'recruitment_role_id',
        'user_id',
        'message',
        'status',
        'decided_by',
        'decided_at',
        'decision_note',
    ];

    protected function casts(): array
    {
        return [
            'status' => ApplicationStatus::class,
            'decided_at' => 'datetime',
        ];
    }

    public function recruitment(): BelongsTo
    {
        return $this->belongsTo(Recruitment::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(RecruitmentRole::class, 'recruitment_role_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
