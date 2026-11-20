<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_SETTLEMENT = 'settlement';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_FAILED = 'failed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'order_number',
        'user_id',
        'team_id',
        'plan_type',
        'amount',
        'payment_method',
        'provider',
        'provider_transaction_id',
        'checkout_url',
        'status',
        'snap_token',
        'payment_reference',
        'paid_at',
        'expires_at',
        'webhook_event_id',
        'metadata',
    ];

    protected $casts = [
        'amount' => 'integer',
        'paid_at' => 'datetime',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    protected $appends = [
        'plan_label',
        'qr_string',
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
        return in_array($this->status, [self::STATUS_PAID, self::STATUS_SETTLEMENT, 'paid', 'settlement'], true);
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isExpired(): bool
    {
        if ($this->status === self::STATUS_EXPIRED) {
            return true;
        }

        if ($this->isPending() && $this->expires_at && $this->expires_at->isPast()) {
            return true;
        }

        return false;
    }

    public function isFailed(): bool
    {
        return in_array($this->status, [self::STATUS_FAILED, self::STATUS_CANCELLED], true);
    }

    public function getPlanLabelAttribute(): string
    {
        return match ($this->plan_type) {
            'ai_pass' => 'AI Pass (One-time)',
            'pro_monthly' => 'RAKIT Pro Bulanan',
            'semester_pass' => 'RAKIT Semester (6 Bulan)',
            'team_pass' => 'RAKIT Team Pass',
            default => strtoupper((string) $this->plan_type),
        };
    }

    public function getQrStringAttribute(): ?string
    {
        return $this->metadata['kasera_response']['payment']['qr_string']
            ?? $this->metadata['kasera_response']['payment']['qr_content']
            ?? $this->metadata['payment']['qr_string']
            ?? $this->metadata['qr_string']
            ?? null;
    }
}
