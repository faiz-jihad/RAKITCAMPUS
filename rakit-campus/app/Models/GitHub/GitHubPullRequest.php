<?php

namespace App\Models\GitHub;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GitHubPullRequest extends Model
{
    use HasFactory;

    protected $table = 'github_pull_requests';

    protected $fillable = [
        'github_repository_id',
        'github_contributor_id',
        'number',
        'github_id',
        'title',
        'body',
        'state',
        'is_merged',
        'user_login',
        'head_branch',
        'base_branch',
        'html_url',
        'created_at_gh',
        'updated_at_gh',
        'closed_at_gh',
        'merged_at',
        'comments_count',
        'review_comments_count',
        'additions',
        'deletions',
        'changed_files',
    ];

    protected function casts(): array
    {
        return [
            'number' => 'integer',
            'is_merged' => 'boolean',
            'created_at_gh' => 'datetime',
            'updated_at_gh' => 'datetime',
            'closed_at_gh' => 'datetime',
            'merged_at' => 'datetime',
            'comments_count' => 'integer',
            'review_comments_count' => 'integer',
            'additions' => 'integer',
            'deletions' => 'integer',
            'changed_files' => 'integer',
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

    public function reviews(): HasMany
    {
        return $this->hasMany(GitHubReview::class, 'github_pull_request_id');
    }
}
