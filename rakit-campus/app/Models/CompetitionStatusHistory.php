<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'participation_id',
        'from_stage',
        'to_stage',
        'notes',
        'changed_by',
    ];

    public function participation(): BelongsTo
    {
        return $this->belongsTo(CompetitionParticipation::class, 'participation_id');
    }

    public function changer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
