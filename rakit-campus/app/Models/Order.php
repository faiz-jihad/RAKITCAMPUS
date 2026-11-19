<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'user_id',
        'team_id',
        'plan_type',
        'amount',
        'payment_method',
        'status',
        'snap_token',
        'payment_reference',
        'paid_at',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'integer',
        'paid_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function isPaid(): bool
    {
        return $this->status === 'settlement';
    }

    public function getPlanLabelAttribute(): string
    {
        return match ($this->plan_type) {
            'ai_pass' => 'AI Pass (One-time)',
            'pro_monthly' => 'RAKIT Pro Bulanan',
            'semester_pass' => 'RAKIT Semester (6 Bulan)',
            'team_pass' => 'RAKIT Team Pass',
            default => strtoupper($this->plan_type),
        };
    }
}
