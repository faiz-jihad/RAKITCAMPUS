<?php

namespace App\Models;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampusMembership extends Model
{
    protected $fillable = ['campus_id', 'user_id', 'role', 'status', 'verification_status', 'student_number', 'verified_at', 'verified_by'];

    /** Never serialised to the client by default. */
    protected $hidden = ['student_number'];

    protected function casts(): array
    {
        return [
            'role' => CampusRole::class,
            'status' => MembershipStatus::class,
            'verification_status' => VerificationStatus::class,
            'verified_at' => 'datetime',
        ];
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
