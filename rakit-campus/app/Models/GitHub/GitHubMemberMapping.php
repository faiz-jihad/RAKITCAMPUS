<?php

namespace App\Models\GitHub;

use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GitHubMemberMapping extends Model
{
    use HasFactory;

    protected $table = 'github_member_mappings';

    protected $fillable = [
        'github_repository_id',
        'github_contributor_id',
        'user_id',
        'team_member_id',
        'mapping_type',
        'confidence',
        'mapped_by',
        'notes',
    ];

    public function repository(): BelongsTo
    {
        return $this->belongsTo(GitHubRepository::class, 'github_repository_id');
    }

    public function contributor(): BelongsTo
    {
        return $this->belongsTo(GitHubContributor::class, 'github_contributor_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function teamMember(): BelongsTo
    {
        return $this->belongsTo(TeamMember::class, 'team_member_id');
    }

    public function mappedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mapped_by');
    }

    public function isMapped(): bool
    {
        return ! is_null($this->user_id);
    }
}
