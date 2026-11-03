<?php

namespace App\Enums;

enum CompetitionStatus: string
{
    case Upcoming = 'upcoming';
    case Open = 'open';
    case ClosingSoon = 'closing_soon';
    case Closed = 'closed';
    case Ongoing = 'ongoing';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

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

