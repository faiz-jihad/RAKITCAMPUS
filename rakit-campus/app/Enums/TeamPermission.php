<?php

namespace App\Enums;

enum TeamPermission: string
{
    case Leader = 'leader';
    case Member = 'member';

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

