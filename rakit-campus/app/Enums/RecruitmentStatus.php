<?php

namespace App\Enums;

enum RecruitmentStatus: string
{
    case Open = 'open';
    case Closed = 'closed';

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

