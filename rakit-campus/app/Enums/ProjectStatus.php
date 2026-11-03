<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Draft = 'draft';
    case Recruiting = 'recruiting';
    case TeamFormation = 'team_formation';
    case InProgress = 'in_progress';
    case OnHold = 'on_hold';
    case Completed = 'completed';
    case Archived = 'archived';
    case Cancelled = 'cancelled';

    /**
     * Lifecycle rules. A status may only move to one of the returned states.
     *
     * @return list<self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Draft => [self::Recruiting, self::InProgress, self::Cancelled],
            self::Recruiting => [self::TeamFormation, self::InProgress, self::OnHold, self::Cancelled],
            self::TeamFormation => [self::Recruiting, self::InProgress, self::OnHold, self::Cancelled],
            self::InProgress => [self::OnHold, self::Completed, self::Cancelled],
            self::OnHold => [self::Recruiting, self::InProgress, self::Cancelled],
            self::Completed => [self::Archived],
            self::Cancelled => [self::Archived],
            self::Archived => [],
        };
    }

    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions(), true);
    }

    /** Statuses in which the project is considered live (shown in discovery / counted as active). */
    public function isActive(): bool
    {
        return in_array($this, [self::Recruiting, self::TeamFormation, self::InProgress, self::OnHold], true);
    }

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

