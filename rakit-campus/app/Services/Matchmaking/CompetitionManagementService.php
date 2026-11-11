<?php

namespace App\Services\Matchmaking;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionScope;
use App\Enums\CompetitionStatus;
use App\Enums\VerificationStatus;
use App\Models\Competition;
use App\Models\CompetitionSource;
use App\Models\MatchingAuditLog;
use App\Models\User;
use App\Services\Storage\ObjectStorageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CompetitionManagementService
{
    /**
     * Create a competition proposed by student, lecturer, or admin.
     */
    public function createCompetition(array $data, User $creator, ?UploadedFile $coverImage = null): Competition
    {
        $campusId = $creator->campusId();
        $isGlobal = ($data['scope'] ?? 'campus') === 'global' && $creator->isPlatformAdmin();

        $coverImagePath = null;
        if ($coverImage) {
            $coverImagePath = ObjectStorageService::store($coverImage, 'competitions/covers')['path'];
        }

        return DB::transaction(function () use ($data, $creator, $campusId, $isGlobal, $coverImagePath) {
            $slug = Str::slug($data['name']) . '-' . Str::lower(Str::random(6));

            $isPrivileged = $creator->isCampusAdminOf($campusId) || $creator->isPlatformAdmin() || $creator->isLecturer();

            $competition = Competition::create([
                'campus_id' => $isGlobal ? null : $campusId,
                'scope' => $isGlobal ? CompetitionScope::Global : CompetitionScope::Campus,
                'created_by' => $creator->id,
                'name' => $data['name'],
                'slug' => $slug,
                'organizer' => $data['organizer'],
                'description' => $data['description'] ?? null,
                'category' => $data['category'],
                'category_tracks' => $data['category_tracks'] ?? null,
                'level' => $data['level'] ?? 'national',
                'competition_type' => $data['competition_type'] ?? 'team',
                'official_url' => $data['official_url'] ?? null,
                'registration_url' => $data['registration_url'] ?? null,
                'registration_opens_at' => $data['registration_opens_at'] ?? null,
                'registration_deadline' => $data['registration_deadline'] ?? null,
                'starts_at' => $data['starts_at'] ?? null,
                'ends_at' => $data['ends_at'] ?? null,
                'eligibility' => $data['eligibility'] ?? null,
                'min_team_size' => $data['min_team_size'] ?? 1,
                'max_team_size' => $data['max_team_size'] ?? 5,
                'prize_info' => $data['prize_info'] ?? null,
                'cover_image' => $coverImagePath,
                'status' => $isPrivileged ? CompetitionStatus::Open : CompetitionStatus::Upcoming,
                'verification_status' => $isPrivileged ? VerificationStatus::Verified : VerificationStatus::Unverified,
                'last_verified_at' => $isPrivileged ? now() : null,
                'verified_by' => $isPrivileged ? $creator->id : null,
            ]);

            if (!empty($data['source_url'])) {
                CompetitionSource::create([
                    'competition_id' => $competition->id,
                    'label' => $data['source_label'] ?? 'Sumber Informasi Resmi',
                    'url' => $data['source_url'],
                    'notes' => $data['source_notes'] ?? null,
                    'verified_at' => $isPrivileged ? now() : null,
                    'verified_by' => $isPrivileged ? $creator->id : null,
                ]);
            }

            // Sync skills if provided
            if (!empty($data['skills'])) {
                $competition->skills()->sync($data['skills']);
            }

            MatchingAuditLog::log(
                'competition_created',
                [
                    'name' => $competition->name,
                    'verification_status' => $competition->verification_status->value,
                ],
                null,
                null,
                $creator->id
            );

            return $competition;
        });
    }

    /**
     * Update existing competition record.
     */
    public function updateCompetition(Competition $competition, array $data, User $updater, ?UploadedFile $coverImage = null): Competition
    {
        if (!$updater->isCampusAdminOf($competition->campus_id) && !$updater->isPlatformAdmin() && $competition->created_by !== $updater->id) {
            throw ValidationException::withMessages(['auth' => ['Anda tidak memiliki hak akses mengubah kompetisi ini.']]);
        }

        if ($coverImage) {
            $data['cover_image'] = ObjectStorageService::store($coverImage, 'competitions/covers')['path'];
        }

        $competition->update($data);

        return $competition;
    }

    /**
     * Archive competition.
     */
    public function archiveCompetition(Competition $competition, User $user): void
    {
        $competition->update([
            'status' => CompetitionStatus::Cancelled,
            'moderation_status' => 'archived',
        ]);
    }
}
