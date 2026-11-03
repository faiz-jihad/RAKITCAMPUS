<?php

namespace App\Enums;

enum ProjectCategory: string
{
    case Academic = 'academic';
    case Personal = 'personal';
    case Startup = 'startup';
    case Research = 'research';
    case OpenSource = 'open_source';
    case SocialImpact = 'social_impact';
    case FinalProject = 'final_project';

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

