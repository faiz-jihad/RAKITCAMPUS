<?php

namespace App\Enums;

enum RoundStatus: string
{
    case Upcoming = 'upcoming';
    case Open = 'open';
    case SubmissionClosed = 'submission_closed';
    case UnderEvaluation = 'under_evaluation';
    case Qualified = 'qualified';
    case NotQualified = 'not_qualified';
    case Completed = 'completed';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Upcoming => 'Akan Datang',
            self::Open => 'Penerimaan Karya Dibuka',
            self::SubmissionClosed => 'Batas Pengumpulan Berakhir',
            self::UnderEvaluation => 'Sedang Dinilai Dewan Juri',
            self::Qualified => 'Lolos ke Tahap Selanjutnya',
            self::NotQualified => 'Belum Lolos',
            self::Completed => 'Babak Selesai',
        };
    }
}
