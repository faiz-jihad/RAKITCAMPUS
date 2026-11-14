<?php

namespace App\Models\GitHub;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class GitHubContributor extends Model
{
    use HasFactory;

    protected $table = 'github_contributors';

    protected $fillable = [
        'github_repository_id',
        'github_id',
        'login',
        'name',
        'email',
        'avatar_url',
        'html_url',
        'total_commits',
        'total_additions',
        'total_deletions',
        'first_commit_at',
        'last_commit_at',
    ];

    protected function casts(): array
    {
        return [
            'github_id' => 'integer',
            'total_commits' => 'integer',
            'total_additions' => 'integer',
            'total_deletions' => 'integer',
            'first_commit_at' => 'datetime',
            'last_commit_at' => 'datetime',
        ];
    }

    public function repository(): BelongsTo
    {
        return $this->belongsTo(GitHubRepository::class, 'github_repository_id');
    }

    public function mapping(): HasOne
    {
        return $this->hasOne(GitHubMemberMapping::class, 'github_contributor_id');
    }

    public function commits(): HasMany
    {
        return $this->hasMany(GitHubCommit::class, 'github_contributor_id');
    }

    public function pullRequests(): HasMany
    {
        return $this->hasMany(GitHubPullRequest::class, 'github_contributor_id');
    }
}
