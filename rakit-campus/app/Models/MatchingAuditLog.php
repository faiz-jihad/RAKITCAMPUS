<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchingAuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_class_id',
        'project_id',
        'user_id',
        'action',
        'details',
        'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
        ];
    }

    public function academicClass(): BelongsTo
    {
        return $this->belongsTo(AcademicClass::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function log(string $action, array $details = [], ?int $classId = null, ?int $projectId = null, ?int $userId = null): self
    {
        return self::create([
            'academic_class_id' => $classId,
            'project_id' => $projectId,
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'details' => $details,
            'ip_address' => request()->ip(),
        ]);
    }
}
