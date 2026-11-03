<?php

namespace App\Enums;

enum SubscriptionPlan: string
{
    case Trial = 'trial';
    case Starter = 'starter';
    case Professional = 'professional';
    case Enterprise = 'enterprise';

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

