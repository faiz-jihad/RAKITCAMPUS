<?php

namespace App\Enums;

enum SkillType: string
{
    case Technical = 'technical';
    case Soft = 'soft';

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

