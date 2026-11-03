<?php

namespace App\Enums;

enum CampusRole: string
{
    case Student = 'student';
    case Lecturer = 'lecturer';
    case CampusAdmin = 'campus_admin';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Student => 'Mahasiswa',
            self::Lecturer => 'Dosen / Pengajar',
            self::CampusAdmin => 'Administrator Kampus',
        };
    }
}
