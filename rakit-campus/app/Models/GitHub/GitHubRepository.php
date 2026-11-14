<?php

namespace App\Models\GitHub;

use App\Models\Project;
use App\Models\Team;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class GitHubRepository extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'github_repositories';

    protected $fillable = [
        'team_id',
        'project_id',
        'installation_id',
        'github_id',
        'owner',
        'name',
        'full_name',
        'html_url',
        'clone_url',
        'default_branch',
        'description',
        'is_private',
        'is_fork',
        'stars_count',
        'forks_count',
        'open_issues_count',
        'status',
        'sync_status',
        'sync_error',
        'last_synced_at',
        'webhook_secret',
        'metadata',
    ];

    protected $hidden = [
        'webhook_secret',
    ];

    protected function casts(): array
    {
        return [
            'is_private' => 'boolean',
            'is_fork' => 'boolean',
            'stars_count' => 'integer',
            'forks_count' => 'integer',
            'open_issues_count' => 'integer',
            'last_synced_at' => 'datetime',
            'metadata' => 'array',
            'webhook_secret' => 'encrypted',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function branches(): HasMany
    {
        return $this->hasMany(GitHubBranch::class);
    }

    public function activeBranches(): HasMany
    {
        return $this->hasMany(GitHubBranch::class)->where('is_deleted', false);
    }

    public function contributors(): HasMany
    {
        return $this->hasMany(GitHubContributor::class);
    }

    public function memberMappings(): HasMany
    {
        return $this->hasMany(GitHubMemberMapping::class);
    }

    public function commits(): HasMany
    {
        return $this->hasMany(GitHubCommit::class);
    }

    public function pullRequests(): HasMany
    {
        return $this->hasMany(GitHubPullRequest::class);
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(GitHubSyncLog::class);
    }

    public function isConnected(): bool
    {
        return in_array($this->status, ['active', 'connected'], true);
    }

    public function isSyncing(): bool
    {
        return $this->sync_status === 'syncing';
    }
}
