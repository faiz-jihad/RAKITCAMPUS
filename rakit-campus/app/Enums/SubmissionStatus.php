<?php

namespace App\Enums;

enum SubmissionStatus: string
{
    case NotStarted = 'not_started';
    case InProgress = 'in_progress';
    case Submitted = 'submitted';

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

