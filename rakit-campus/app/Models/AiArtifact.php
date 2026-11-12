<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiArtifact extends Model
{
    protected $fillable = [
        'session_id', 'message_id', 'user_id', 'title', 'content',
        'artifact_type', 'is_saved_to_project', 'project_id',
    ];

    protected $casts = [
        'is_saved_to_project' => 'boolean',
    ];

    public function session(): BelongsTo
    {
        return $this->belongsTo(AiSession::class, 'session_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
