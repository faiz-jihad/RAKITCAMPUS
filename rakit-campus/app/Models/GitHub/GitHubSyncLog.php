<?php

namespace App\Models\GitHub;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GitHubSyncLog extends Model
{
    use HasFactory;

    protected $table = 'github_sync_logs';

    protected $fillable = [
        'github_repository_id',
        'sync_type',
        'status',
        'items_synced',
        'duration_ms',
        'error_message',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'items_synced' => 'array',
            'duration_ms' => 'integer',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function repository(): BelongsTo
    {
        return $this->belongsTo(GitHubRepository::class, 'github_repository_id');
    }
}
