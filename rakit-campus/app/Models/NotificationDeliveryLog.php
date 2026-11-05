<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationDeliveryLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'idempotency_key',
        'notification_type',
        'category',
        'priority',
        'channel',
        'recipient_id',
        'recipient_email',
        'subject',
        'status',
        'error_message',
        'retry_count',
        'last_attempted_at',
        'sent_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'retry_count' => 'integer',
            'last_attempted_at' => 'datetime',
            'sent_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function recipient(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
}
