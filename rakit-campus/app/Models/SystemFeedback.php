<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemFeedback extends Model
{
    use HasFactory;

    protected $table = 'system_feedbacks';

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'category',
        'message',
        'rating',
        'status',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'rating' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
