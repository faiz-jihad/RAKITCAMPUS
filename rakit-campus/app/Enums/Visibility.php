<?php

namespace App\Enums;

enum Visibility: string
{
    case Private = 'private';
    case Campus = 'campus';
    case Public = 'public';

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

