<?php

namespace App\Enums;

enum CompetitionOutcome: string
{
    case Winner = 'winner';
    case Finalist = 'finalist';
    case Participant = 'participant';
    case NotSelected = 'not_selected';

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

