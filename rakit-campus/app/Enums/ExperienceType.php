<?php

namespace App\Enums;

enum ExperienceType: string
{
    case Project = 'project';
    case Competition = 'competition';
    case Research = 'research';
    case Certificate = 'certificate';
    case Other = 'other';

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

