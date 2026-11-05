<?php

namespace App\Enums;

enum TeamStatus: string
{
    case Forming = 'forming';
    case AwaitingMembers = 'awaiting_members';
    case Ready = 'ready';
    case Confirmed = 'confirmed';
    case Registered = 'registered';
    case Active = 'active';
    case Completed = 'completed';
    case Withdrawn = 'withdrawn';
    case Disqualified = 'disqualified';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Forming => 'Pembentukan Awal',
            self::AwaitingMembers => 'Menunggu Anggota',
            self::Ready => 'Siap Dikonfirmasi',
            self::Confirmed => 'Formasi Dikonfirmasi',
            self::Registered => 'Terdaftar Resmi di Lomba',
            self::Active => 'Aktif Berkompetisi',
            self::Completed => 'Kompetisi Selesai',
            self::Withdrawn => 'Mengundurkan Diri',
            self::Disqualified => 'Diskualifikasi',
        };
    }
}
