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

    protected $fillable = ['campus_id', 'project_id', 'leader_id', 'type', 'name', 'description', 'capacity'];

    protected function casts(): array
    {
        return [
            'type' => TeamType::class,
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

    public function activities(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    public function isLeader(User $user): bool
    {
        return $this->members()
            ->where('user_id', $user->id)
            ->where('permission', TeamPermission::Leader->value)
            ->exists();
    }

    public function availableSlots(): int
    {
        return max(0, $this->capacity - $this->members()->count());
    }

    public function isFull(): bool
    {
        return $this->members()->count() >= $this->capacity;
    }
}
