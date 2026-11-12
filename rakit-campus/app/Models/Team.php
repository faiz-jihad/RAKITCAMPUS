<?php

namespace App\Models;

use App\Enums\TeamPermission;
use App\Enums\TeamType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Team extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['campus_id', 'project_id', 'leader_id', 'type', 'name', 'description', 'capacity', 'status'];

    protected function casts(): array
    {
        return [
            'type' => TeamType::class,
            'status' => \App\Enums\TeamStatus::class,
            'capacity' => 'integer',
        ];
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    public function recruitment(): HasOne
    {
        return $this->hasOne(Recruitment::class);
    }

    public function participations(): HasMany
    {
        return $this->hasMany(CompetitionParticipation::class);
    }

    public function competitionParticipation(): HasOne
    {
        return $this->hasOne(CompetitionParticipation::class);
    }

    public function competitionParticipations(): HasMany
    {
        return $this->hasMany(CompetitionParticipation::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(Milestone::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(TeamPost::class);
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function hasMember(User|int $user): bool
    {
        $userId = $user instanceof User ? $user->id : (int) $user;

        if ((int) $this->leader_id === $userId) {
            return true;
        }

        if ($this->relationLoaded('members')) {
            return $this->members->contains(function ($m) use ($userId) {
                return (int) $m->user_id === $userId;
            });
        }

        return $this->members()->where('user_id', $userId)->exists();
    }

    public function isLeader(User|int $user): bool
    {
        $userId = $user instanceof User ? $user->id : $user;

        if ($this->leader_id === $userId) {
            return true;
        }

        if ($this->relationLoaded('members')) {
            return $this->members->contains(function ($m) use ($userId) {
                return $m->user_id === $userId && (
                    $m->permission === TeamPermission::Leader || 
                    $m->permission === TeamPermission::Leader->value || 
                    $m->permission === 'leader'
                );
            });
        }

        return $this->members()
            ->where('user_id', $userId)
            ->where('permission', TeamPermission::Leader->value)
            ->exists();
    }

    public function availableSlots(): int
    {
        $count = $this->relationLoaded('members')
            ? $this->members->where('status', 'active')->count()
            : $this->members()->where('status', 'active')->count();

        return max(0, $this->capacity - $count);
    }

    public function isFull(): bool
    {
        $count = $this->relationLoaded('members')
            ? $this->members->where('status', 'active')->count()
            : $this->members()->where('status', 'active')->count();

        return $count >= $this->capacity;
    }
}
