<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LeaderboardPointRule extends Model
{
    use HasFactory;

    protected $fillable = [
        'hub',
        'activity_type',
        'name',
        'description',
        'base_points',
        'multiplier_config',
        'is_active',
    ];

    protected $casts = [
        'base_points' => 'integer',
        'multiplier_config' => 'array',
        'is_active' => 'boolean',
    ];
}
