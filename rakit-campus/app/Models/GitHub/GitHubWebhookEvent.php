<?php

namespace App\Models\GitHub;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GitHubWebhookEvent extends Model
{
    use HasFactory;

    protected $table = 'github_webhook_events';

    protected $fillable = [
        'delivery_id',
        'event',
        'action',
        'repository_full_name',
        'payload',
        'processed',
        'error',
        'processed_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'processed' => 'boolean',
            'processed_at' => 'datetime',
        ];
    }
}
