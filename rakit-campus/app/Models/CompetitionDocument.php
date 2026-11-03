<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionDocument extends Model
{
    protected $fillable = ['name', 'url'];

    public function participation(): BelongsTo
    {
        return $this->belongsTo(CompetitionParticipation::class, 'participation_id');
    }
}
