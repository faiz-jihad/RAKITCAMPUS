<?php

namespace App\Models;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Mass assignable attributes. Privileged columns (is_platform_admin, status) are
     * deliberately NOT listed so they can never be set through request input.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'avatar',
    ];

    /**
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_platform_admin' => 'boolean',
        ];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(CampusMembership::class);
    }

    public function campuses(): BelongsToMany
    {
        return $this->belongsToMany(Campus::class, 'campus_memberships')
            ->withPivot(['role', 'status', 'verification_status'])
            ->withTimestamps();
    }

    public function profile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function teamMemberships(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    public function isPlatformAdmin(): bool
    {
        return (bool) $this->is_platform_admin;
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * The user's primary (oldest active) campus membership. The campus a request acts on is
     * ALWAYS derived from this server-side relation, never from client-supplied input.
     */
    public function activeMembership(): ?CampusMembership
    {
        return $this->memberships()
            ->where('status', MembershipStatus::Active->value)
            ->orderBy('id')
            ->first();
    }

    public function campusId(): ?int
    {
        return $this->activeMembership()?->campus_id;
    }

    public function belongsToCampus(?int $campusId): bool
    {
        if ($campusId === null) {
            return false;
        }

        return $this->memberships()
            ->where('campus_id', $campusId)
            ->where('status', MembershipStatus::Active->value)
            ->exists();
    }

    public function isCampusAdminOf(?int $campusId): bool
    {
        if ($campusId === null) {
            return false;
        }

        return $this->memberships()
            ->where('campus_id', $campusId)
            ->where('status', MembershipStatus::Active->value)
            ->where('role', CampusRole::CampusAdmin->value)
            ->exists();
    }

    public function isLecturer(?int $campusId = null): bool
    {
        $query = $this->memberships()
            ->where('status', MembershipStatus::Active->value)
            ->where('role', CampusRole::Lecturer->value);

        if ($campusId !== null) {
            $query->where('campus_id', $campusId);
        }

        return $query->exists();
    }

    public function isStudent(?int $campusId = null): bool
    {
        $query = $this->memberships()
            ->where('status', MembershipStatus::Active->value)
            ->where('role', CampusRole::Student->value);

        if ($campusId !== null) {
            $query->where('campus_id', $campusId);
        }

        return $query->exists();
    }

    public function taughtClasses(): HasMany
    {
        return $this->hasMany(\App\Models\AcademicClass::class, 'lecturer_id');
    }

    public function enrolledClasses(): BelongsToMany
    {
        return $this->belongsToMany(
            \App\Models\AcademicClass::class,
            'academic_class_students',
            'user_id',
            'academic_class_id'
        )->withPivot(['student_number', 'status', 'enrolled_at'])->withTimestamps();
    }
}
