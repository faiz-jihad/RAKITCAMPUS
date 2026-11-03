<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContributionRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'campus_id',
        'user_id',
        'team_id',
        'recorded_by',
        'role_name',
        'summary',
        'tasks_completed',
    ];

    protected function casts(): array
    {
        return [
            'tasks_completed' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }
}
