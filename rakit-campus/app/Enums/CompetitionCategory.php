<?php

namespace App\Enums;

enum CompetitionCategory: string
{
    case Hackathon = 'hackathon';
    case Programming = 'programming';
    case UiUx = 'ui_ux';
    case BusinessPlan = 'business_plan';
    case Innovation = 'innovation';
    case Research = 'research';
    case ScientificWriting = 'scientific_writing';
    case Entrepreneurship = 'entrepreneurship';
    case Technology = 'technology';
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

