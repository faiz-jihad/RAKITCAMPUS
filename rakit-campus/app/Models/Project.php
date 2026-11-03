<?php

namespace App\Models;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\Visibility;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'campus_id', 'academic_class_id', 'leader_id', 'slug', 'status', 'progress',
        'title', 'short_description', 'description', 'category',
        'problem_statement', 'objectives', 'proposed_solution',
        'tech_stack', 'visibility', 'starts_on', 'target_completion_on',
        'completed_at', 'moderation_status', 'lecturer_notes', 'lecturer_evaluation',
    ];

    protected function casts(): array
    {
        return [
            'category' => ProjectCategory::class,
            'status' => ProjectStatus::class,
            'visibility' => Visibility::class,
            'tech_stack' => 'array',
            'starts_on' => 'date',
            'target_completion_on' => 'date',
            'completed_at' => 'datetime',
            'progress' => 'integer',
        ];
    }

    public function academicClass(): BelongsTo
    {
        return $this->belongsTo(AcademicClass::class);
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    public function leader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'leader_id');
    }

    public function team(): HasOne
    {
        return $this->hasOne(Team::class);
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'project_skills')
            ->withPivot('min_proficiency')
            ->withTimestamps();
    }

    public function participations(): HasMany
    {
        return $this->hasMany(CompetitionParticipation::class);
    }

    public function bookmarks(): MorphMany
    {
        return $this->morphMany(Bookmark::class, 'bookmarkable');
    }

    public function scopeInCampus(Builder $query, int $campusId): Builder
    {
        return $query->where($query->getModel()->getTable().'.campus_id', $campusId);
    }

    /**
     * Visibility + tenant policy in one place. A user only ever sees:
     *  - projects of their own campus with visibility campus|public
     *  - public projects from other campuses
     *  - anything they are a team member of
     *  - everything in their campus, if they administer it; everything, if platform admin.
     * Hidden (moderated) projects and other people's drafts are excluded for ordinary users.
     */
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        if (! $user) {
            return $query->where('projects.moderation_status', 'visible')
                ->where('projects.status', '!=', ProjectStatus::Draft->value)
                ->where('projects.visibility', Visibility::Public->value);
        }

        if ($user->isPlatformAdmin()) {
            return $query;
        }

        $campusIds = $user->memberships()->where('status', 'active')->pluck('campus_id');
        $adminCampusIds = $user->memberships()->where('status', 'active')
            ->where('role', 'campus_admin')->pluck('campus_id');

        return $query->where(function (Builder $q) use ($user, $campusIds, $adminCampusIds) {
            $q->whereIn('projects.campus_id', $adminCampusIds)
                ->orWhereHas('team.members', fn (Builder $m) => $m->where('team_members.user_id', $user->id))
                ->orWhere(function (Builder $q) use ($campusIds) {
                    $q->where('projects.moderation_status', 'visible')
                        ->where('projects.status', '!=', ProjectStatus::Draft->value)
                        ->where(function (Builder $v) use ($campusIds) {
                            $v->where('projects.visibility', Visibility::Public->value)
                                ->orWhere(function (Builder $c) use ($campusIds) {
                                    $c->where('projects.visibility', Visibility::Campus->value)
                                        ->whereIn('projects.campus_id', $campusIds);
                                });
                        });
                });
        });
    }

    public function isLeader(?User $user): bool
    {
        return $user && $this->leader_id === $user->id;
    }
}
