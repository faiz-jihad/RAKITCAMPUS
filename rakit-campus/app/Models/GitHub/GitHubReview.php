<?php

namespace App\Models\GitHub;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GitHubReview extends Model
{
    use HasFactory;

    protected $table = 'github_reviews';

    protected $fillable = [
        'github_pull_request_id',
        'github_contributor_id',
        'github_id',
        'user_login',
        'state',
        'body',
        'submitted_at',
        'html_url',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function pullRequest(): BelongsTo
    {
        return $this->belongsTo(GitHubPullRequest::class, 'github_pull_request_id');
    }

    public function contributor(): BelongsTo
    {
        return $this->belongsTo(GitHubContributor::class, 'github_contributor_id');
    }
}
