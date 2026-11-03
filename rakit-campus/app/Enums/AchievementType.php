<?php

namespace App\Enums;

enum AchievementType: string
{
    case ProjectCompleted = 'project_completed';
    case CompetitionResult = 'competition_result';
    case Certificate = 'certificate';
    case Research = 'research';
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

