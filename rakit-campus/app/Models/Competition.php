<?php

namespace App\Models;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionScope;
use App\Enums\CompetitionStatus;
use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Competition extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'campus_id', 'scope', 'created_by', 'slug', 'status', 'status_locked',
        'verification_status', 'last_verified_at', 'verified_by', 'moderation_status',
        'name', 'organizer', 'description', 'category', 'level', 'competition_type',
        'official_url', 'registration_url',
        'registration_opens_at', 'registration_deadline', 'starts_at', 'ends_at',
        'eligibility', 'min_team_size', 'max_team_size',
        'required_documents', 'prize_info', 'cover_image', 'category_tracks',
    ];

    protected function casts(): array
    {
        return [
            'category' => CompetitionCategory::class,
            'scope' => CompetitionScope::class,
            'status' => CompetitionStatus::class,
            'verification_status' => VerificationStatus::class,
            'required_documents' => 'array',
            'category_tracks' => 'array',
            'registration_opens_at' => 'datetime',
            'registration_deadline' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'last_verified_at' => 'datetime',
            'status_locked' => 'boolean',
            'min_team_size' => 'integer',
            'max_team_size' => 'integer',
        ];
    }

    public function getCoverImageAttribute($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        return \App\Services\Storage\ObjectStorageService::url($value);
    }

    public function getCoverImageUrlAttribute(): ?string
    {
        return $this->getCoverImageAttribute($this->attributes['cover_image'] ?? null);
    }

    public function isRegistrationClosed(): bool
    {
        if ($this->status === CompetitionStatus::Closed ||
            $this->status === CompetitionStatus::Completed ||
            $this->status === CompetitionStatus::Cancelled) {
            return true;
        }

        if ($this->registration_deadline && $this->registration_deadline->isPast()) {
            return true;
        }

        return false;
    }

    public function scopeRegistrationOpen(Builder $query): Builder
    {
        return $query->whereNotIn('competitions.status', [
                CompetitionStatus::Closed->value,
                CompetitionStatus::Completed->value,
                CompetitionStatus::Cancelled->value,
            ])
            ->where(function ($q) {
                $q->whereNull('competitions.registration_deadline')
                  ->orWhere('competitions.registration_deadline', '>=', now());
            });
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function skills(): BelongsToMany
    {
        return $this->belongsToMany(Skill::class, 'competition_skills')->withTimestamps();
    }

    public function sources(): HasMany
    {
        return $this->hasMany(CompetitionSource::class);
    }

    public function participations(): HasMany
    {
        return $this->hasMany(CompetitionParticipation::class);
    }

    public function rounds(): HasMany
    {
        return $this->hasMany(CompetitionRound::class)->orderBy('round_number', 'asc');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(CompetitionAllocation::class);
    }

    public function bookmarks(): MorphMany
    {
        return $this->morphMany(Bookmark::class, 'bookmarkable');
    }

    /** Global competitions are visible everywhere; campus ones only to that campus (and admins). */
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        if (! $user) {
            return $query->where('competitions.moderation_status', 'visible')
                ->where('competitions.scope', CompetitionScope::Global->value);
        }

        if ($user->isPlatformAdmin()) {
            return $query;
        }

        $campusIds = $user->memberships()->where('status', 'active')->pluck('campus_id');
        $adminCampusIds = $user->memberships()->where('status', 'active')
            ->where('role', 'campus_admin')->pluck('campus_id');

        return $query->where(function (Builder $q) use ($campusIds, $adminCampusIds) {
            $q->whereIn('competitions.campus_id', $adminCampusIds)
                ->orWhere(function (Builder $q) use ($campusIds) {
                    $q->where('competitions.moderation_status', 'visible')
                        ->where(function (Builder $s) use ($campusIds) {
                            $s->where('competitions.scope', CompetitionScope::Global->value)
                                ->orWhereIn('competitions.campus_id', $campusIds);
                        });
                });
        });
    }
}
