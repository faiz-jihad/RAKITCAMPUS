<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiSession extends Model
{
    protected $fillable = [
        'team_id', 'user_id', 'project_id', 'competition_id',
        'assistant_type', 'session_type', 'title', 'context_data', 'is_active',
    ];

    protected $casts = [
        'context_data' => 'array',
        'is_active' => 'boolean',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(AiMessage::class, 'session_id')->orderBy('created_at');
    }

    public function artifacts(): HasMany
    {
        return $this->hasMany(AiArtifact::class, 'session_id');
    }
}
