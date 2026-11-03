<?php

namespace App\Enums;

enum RegistrationStatus: string
{
    case Planning = 'planning';
    case Registered = 'registered';
    case Withdrawn = 'withdrawn';
    case Disqualified = 'disqualified';

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

