<?php

namespace App\Enums;

enum DeliverableStatus: string
{
    case Draft = 'draft';
    case InReview = 'in_review';
    case Ready = 'ready';
    case Submitted = 'submitted';
    case Accepted = 'accepted';
    case RevisionRequired = 'revision_required';
    case Rejected = 'rejected';

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $c) => $c->value, self::cases());
    }

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draf Berkas',
            self::InReview => 'Sedang Direviu',
            self::Ready => 'Siap Kirim',
            self::Submitted => 'Terkirim',
            self::Accepted => 'Disetujui',
            self::RevisionRequired => 'Perlu Revisi',
            self::Rejected => 'Ditolak',
        };
    }
}
