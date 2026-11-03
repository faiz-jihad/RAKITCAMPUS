<?php

namespace App\Enums;

enum ParticipationProgress: string
{
    case Preparing = 'preparing';
    case InCompetition = 'in_competition';
    case Finished = 'finished';

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

