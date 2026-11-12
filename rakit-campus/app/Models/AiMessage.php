<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiMessage extends Model
{
    protected $fillable = [
        'session_id', 'role', 'content', 'token_count', 'model_used', 'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'token_count' => 'integer',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(AiSession::class, 'session_id');
    }
}
