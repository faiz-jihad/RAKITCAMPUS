<?php

namespace App\Services\Matchmaking;

use App\Enums\CompetitionStatus;
use App\Enums\VerificationStatus;
use App\Models\Competition;
use App\Models\CompetitionSource;
use App\Models\MatchingAuditLog;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CompetitionVerificationService
{
    /**
     * Verify competition source and publish official status.
     * Prevents presenting unverified competitions as officially verified.
     */
    public function verifyCompetition(Competition $competition, User $verifier, ?string $sourceNotes = null): void
    {
        if (!$verifier->isCampusAdminOf($competition->campus_id) && !$verifier->isPlatformAdmin() && !$verifier->isLecturer()) {
            throw ValidationException::withMessages([
                'auth' => ['Hanya dosen pengampu atau administrator kampus yang berwenang memverifikasi kompetisi.'],
            ]);
        }

        $competition->update([
            'verification_status' => VerificationStatus::Verified,
            'status' => CompetitionStatus::Open,
            'last_verified_at' => now(),
            'verified_by' => $verifier->id,
        ]);

        if ($competition->sources()->exists()) {
            $competition->sources()->update([
                'verified_at' => now(),
                'verified_by' => $verifier->id,
                'notes' => $sourceNotes ?: 'Sumber informasi resmi telah diverifikasi pihak akademik.',
            ]);
        }

        MatchingAuditLog::log(
            'competition_verified',
            [
                'competition_id' => $competition->id,
                'name' => $competition->name,
                'verified_by' => $verifier->name,
            ],
            null,
            null,
            $verifier->id
        );
    }

    /**
     * Reject or revoke competition verification.
     */
    public function rejectCompetition(Competition $competition, User $verifier, string $reason): void
    {
        if (!$verifier->isCampusAdminOf($competition->campus_id) && !$verifier->isPlatformAdmin() && !$verifier->isLecturer()) {
            throw ValidationException::withMessages([
                'auth' => ['Hanya dosen atau administrator yang berwenang menolak kompetisi.'],
            ]);
        }

        $competition->update([
            'verification_status' => VerificationStatus::Rejected,
            'status_locked' => true,
            'description' => $competition->description . "\n\n[Catatan Verifikator: Ditolak - {$reason}]",
        ]);

        MatchingAuditLog::log(
            'competition_verification_rejected',
            [
                'competition_id' => $competition->id,
                'reason' => $reason,
            ],
            null,
            null,
            $verifier->id
        );
    }
}
