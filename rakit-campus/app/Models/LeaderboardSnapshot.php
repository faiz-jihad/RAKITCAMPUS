<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaderboardSnapshot extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'scope',
        'period',
        'period_key',
        'entity_type',
        'entity_id',
        'points',
        'current_rank',
        'previous_rank',
        'rank_change',
        'meta',
        'calculated_at',
    ];

    protected $casts = [
        'points' => 'integer',
        'current_rank' => 'integer',
        'previous_rank' => 'integer',
        'rank_change' => 'integer',
        'meta' => 'array',
        'calculated_at' => 'datetime',
    ];
}
