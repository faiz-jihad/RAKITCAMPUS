<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompetitionSource extends Model
{
    protected $fillable = ['label', 'url', 'notes'];

    protected function casts(): array
    {
        return ['verified_at' => 'datetime'];
    }

    public function competition(): BelongsTo
    {
        return $this->belongsTo(Competition::class);
    }
}
