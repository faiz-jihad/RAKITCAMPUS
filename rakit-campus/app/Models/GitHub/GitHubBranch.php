<?php

namespace App\Models\GitHub;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GitHubBranch extends Model
{
    use HasFactory;

    protected $table = 'github_branches';

    protected $fillable = [
        'github_repository_id',
        'name',
        'sha',
        'is_default',
        'is_protected',
        'is_deleted',
        'last_commit_at',
    ];

    protected function casts(): array
    {
        return [
            'is_default' => 'boolean',
            'is_protected' => 'boolean',
            'is_deleted' => 'boolean',
            'last_commit_at' => 'datetime',
        ];
    }

    public function repository(): BelongsTo
    {
        return $this->belongsTo(GitHubRepository::class, 'github_repository_id');
    }
}
