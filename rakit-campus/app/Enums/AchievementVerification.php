<?php

namespace App\Enums;

enum AchievementVerification: string
{
    case SelfReported = 'self_reported';
    case Pending = 'pending';
    case Verified = 'verified';
    case Rejected = 'rejected';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }

    public function label(): string
    {
        return ucwords(str_replace('_', ' ', $this->value));
    }
}

