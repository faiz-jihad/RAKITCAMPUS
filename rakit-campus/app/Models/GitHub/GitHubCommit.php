<?php

namespace App\Models\GitHub;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GitHubCommit extends Model
{
    use HasFactory;

    protected $table = 'github_commits';

    protected $fillable = [
        'github_repository_id',
        'github_contributor_id',
        'sha',
        'message',
        'author_name',
        'author_email',
        'author_date',
        'committer_name',
        'committer_email',
        'committer_date',
        'html_url',
        'stats_additions',
        'stats_deletions',
        'stats_total',
        'branches',
        'raw_payload',
    ];

    protected function casts(): array
    {
        return [
            'author_date' => 'datetime',
            'committer_date' => 'datetime',
            'stats_additions' => 'integer',
            'stats_deletions' => 'integer',
            'stats_total' => 'integer',
            'branches' => 'array',
            'raw_payload' => 'array',
        ];
    }

    public function repository(): BelongsTo
    {
        return $this->belongsTo(GitHubRepository::class, 'github_repository_id');
    }

    public function contributor(): BelongsTo
    {
        return $this->belongsTo(GitHubContributor::class, 'github_contributor_id');
    }
}
