<?php

namespace App\Models\GitHub;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GitHubInstallation extends Model
{
    use HasFactory;

    protected $table = 'github_installations';

    protected $fillable = [
        'installation_id',
        'account_login',
        'account_type',
        'repository_selection',
        'access_token',
        'token_expires_at',
        'permissions',
    ];

    protected $hidden = [
        'access_token',
    ];

    protected function casts(): array
    {
        return [
            'installation_id' => 'integer',
            'token_expires_at' => 'datetime',
            'permissions' => 'array',
            'access_token' => 'encrypted',
        ];
    }

    public function isTokenExpired(): bool
    {
        return ! $this->token_expires_at || $this->token_expires_at->isPast();
    }
}
