<?php

namespace App\Services\Matchmaking;

use App\Enums\DeliverableStatus;
use App\Models\CompetitionDocument;
use App\Models\CompetitionParticipation;
use App\Models\MatchingAuditLog;
use App\Models\User;
use App\Services\Storage\ObjectStorageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompetitionDeliverableService
{
    /**
     * Upload or submit a deliverable version for a competition team atomically.
     */
    public function submitDeliverable(
        CompetitionParticipation $participation,
        User $uploader,
        array $data,
        ?UploadedFile $file = null
    ): CompetitionDocument {
        $team = $participation->team;
        if (!$team || !$team->hasMember($uploader)) {
            throw ValidationException::withMessages([
                'auth' => ['Hanya anggota tim yang dapat mengunggah berkas deliverable.'],
            ]);
        }

        if (!$file && empty($data['url']) && empty($data['external_submission_url'])) {
            throw ValidationException::withMessages([
                'file' => ['Silakan sertakan berkas dokumen atau tautan berkas resmi.'],
            ]);
        }

        $path = null;
        $originalName = null;
        $fileSize = 0;
        $mimeType = null;

        if ($file) {
            if ($team) {
                ObjectStorageService::checkTeamStorageQuota($team->id, $file->getSize());
            }
            $stored = ObjectStorageService::store($file, 'competitions/deliverables');
            $originalName = $stored['original_name'];
            $fileSize = $stored['file_size'];
            $mimeType = $stored['mime_type'];
            $path = $stored['path'];
        }

        return DB::transaction(function () use ($participation, $uploader, $data, $path, $originalName, $fileSize, $mimeType) {
            $reqKey = $data['required_document_key'] ?? 'general_deliverable';

            // Pessimistic lock on max version to avoid duplicate version conflicts
            $latestVersion = CompetitionDocument::where('participation_id', $participation->id)
                ->where('required_document_key', $reqKey)
                ->lockForUpdate()
                ->max('version') ?? 0;

            $doc = CompetitionDocument::create([
                'participation_id' => $participation->id,
                'competition_round_id' => $data['competition_round_id'] ?? null,
                'uploaded_by' => $uploader->id,
                'required_document_key' => $reqKey,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'original_name' => $originalName,
                'path' => $path,
                'url' => $data['url'] ?? null,
                'deadline' => $data['deadline'] ?? null,
                'submitted_at' => now(),
                'external_submission_url' => $data['external_submission_url'] ?? null,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'version' => $latestVersion + 1,
                'status' => DeliverableStatus::Draft->value,
            ]);

            MatchingAuditLog::log(
                'competition_deliverable_submitted',
                [
                    'document_id' => $doc->id,
                    'name' => $doc->name,
                    'version' => $doc->version,
                ],
                null,
                null,
                $uploader->id
            );

            return $doc;
        });
    }

    /**
     * Review deliverable by mentor or lecturer atomically.
     */
    public function reviewDeliverable(
        CompetitionDocument $document,
        User $reviewer,
        string $status,
        ?string $feedback = null
    ): void {
        DB::transaction(function () use ($document, $reviewer, $status, $feedback) {
            $lockedDoc = CompetitionDocument::where('id', $document->id)->lockForUpdate()->firstOrFail();

            $lockedDoc->update([
                'status' => $status,
                'feedback' => $feedback,
            ]);

            MatchingAuditLog::log(
                'competition_deliverable_reviewed',
                [
                    'document_id' => $lockedDoc->id,
                    'status' => $status,
                    'reviewer_id' => $reviewer->id,
                ],
                null,
                null,
                $reviewer->id
            );
        });
    }
}
