<?php

namespace App\Models;

use App\Enums\RoundStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompetitionRound extends Model
{
    use HasFactory;

    protected $fillable = [
        'competition_id',
        'round_number',
        'name',
        'description',
        'starts_at',
        'ends_at',
        'status',
        'is_final_round',
    ];

    protected function casts(): array
    {
        return [
            'round_number' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'status' => RoundStatus::class,
            'is_final_round' => 'boolean',
        ];
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }

    public function deliverables(): HasMany
    {
        return $this->hasMany(CompetitionDocument::class, 'competition_round_id');
    }
}
