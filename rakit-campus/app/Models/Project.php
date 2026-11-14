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
        'campus_id', 'academic_class_id', 'leader_id', 'primary_supervisor_id', 'slug', 'status', 'progress',
        'title', 'short_description', 'description', 'category', 'difficulty',
        'min_team_size', 'max_team_size', 'recruitment_deadline',
        'problem_statement', 'objectives', 'proposed_solution',
        'tech_stack', 'visibility', 'starts_on', 'target_completion_on',
        'completed_at', 'moderation_status', 'lecturer_notes', 'lecturer_evaluation',
        'repository_url', 'demo_url', 'submission_notes', 'submitted_at', 'evaluated_at',
        'formation_status', 'formation_notes', 'formation_approved_at', 'formation_approved_by',
        'expected_weekly_hours', 'formation_deadline',
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
            'recruitment_deadline' => 'datetime',
            'submitted_at' => 'datetime',
            'evaluated_at' => 'datetime',
            'progress' => 'integer',
            'min_team_size' => 'integer',
            'max_team_size' => 'integer',
            'expected_weekly_hours' => 'integer',
            'formation_approved_at' => 'datetime',
            'formation_deadline' => 'date',
        ];
    }

    public function formationApprover(): BelongsTo
    {
        return $this->belongsTo(User::class, 'formation_approved_by');
    }

    public function academicClass(): BelongsTo
    {
        return $this->belongsTo(AcademicClass::class);
    }

    public function primarySupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'primary_supervisor_id');
    }

    public function supervisors(): HasMany
    {
        return $this->hasMany(ProjectSupervisor::class);
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

    public function githubRepository(): HasOne
    {
        return $this->hasOne(\App\Models\GitHub\GitHubRepository::class);
    }

    public function proposal(): HasOne
    {
        return $this->hasOne(ProjectProposal::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(ProjectSubmission::class);
    }

    /**
     * Objective transparent calculation of Implementation Progress:
     * 50% Tasks completed + 50% Milestones completed.
     */
    public function calculateImplementationProgress(): int
    {
        $team = $this->team;
        if (! $team) {
            return $this->progress ?? 0;
        }

        $totalTasks = Task::where('team_id', $team->id)->count();
        $completedTasks = Task::where('team_id', $team->id)->where('status', \App\Enums\TaskStatus::Completed->value)->count();
        $taskScore = $totalTasks > 0 ? ($completedTasks / $totalTasks) * 100 : 0;

        $totalMilestones = Milestone::where('team_id', $team->id)->count();
        $completedMilestones = Milestone::where('team_id', $team->id)->where('status', 'completed')->count();
        $milestoneScore = $totalMilestones > 0 ? ($completedMilestones / $totalMilestones) * 100 : 0;

        if ($totalTasks === 0 && $totalMilestones === 0) {
            return $this->progress ?? 0;
        }

        if ($totalMilestones === 0) {
            return (int) round($taskScore);
        }

        if ($totalTasks === 0) {
            return (int) round($milestoneScore);
        }

        return (int) round((0.50 * $taskScore) + (0.50 * $milestoneScore));
    }

    public function activeMembersCount(): int
    {
        if ($this->relationLoaded('team') && $this->team && $this->team->relationLoaded('members')) {
            return $this->team->members->where('status', 'active')->count();
        }

        return $this->team ? $this->team->members()->where('status', 'active')->count() : 0;
    }

    public function hasCapacity(): bool
    {
        $maxCapacity = (int) ($this->max_team_size ?: ($this->team?->capacity ?: 5));
        if ($this->academic_class_id) {
            $classTarget = $this->relationLoaded('academicClass')
                ? $this->academicClass?->target_team_size
                : AcademicClass::where('id', $this->academic_class_id)->value('target_team_size');

            if ($classTarget && (int) $classTarget > 0) {
                $maxCapacity = min($maxCapacity, (int) $classTarget);
            }
        }

        return $this->activeMembersCount() < $maxCapacity;
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
                ->orWhere('projects.leader_id', $user->id)
                ->orWhere('projects.primary_supervisor_id', $user->id)
                ->orWhereHas('team.members', fn (Builder $m) => $m->where('team_members.user_id', $user->id))
                ->orWhereHas('academicClass', fn (Builder $ac) => $ac->where('lecturer_id', $user->id)
                    ->orWhereHas('coLecturers', fn (Builder $cl) => $cl->where('users.id', $user->id)))
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
