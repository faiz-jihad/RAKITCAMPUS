<?php

namespace App\Services\Matchmaking;

use App\Enums\DeliverableStatus;
use App\Models\CompetitionDocument;
use App\Models\CompetitionParticipation;
use App\Models\MatchingAuditLog;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class CompetitionDeliverableService
{
    /**
     * Upload or submit a deliverable version for a competition team.
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
            $originalName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $mimeType = $file->getMimeType();
            $path = $file->store('competitions/deliverables', 'public');
        }

        // Auto-increment version for this required document key
        $reqKey = $data['required_document_key'] ?? 'general_deliverable';
        $latestVersion = CompetitionDocument::where('participation_id', $participation->id)
            ->where('required_document_key', $reqKey)
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
    }

    /**
     * Review deliverable by mentor or lecturer.
     */
    public function reviewDeliverable(
        CompetitionDocument $document,
        User $reviewer,
        string $status,
        ?string $feedback = null
    ): void {
        $document->update([
            'status' => $status,
            'feedback' => $feedback,
        ]);

        MatchingAuditLog::log(
            'competition_deliverable_reviewed',
            [
                'document_id' => $document->id,
                'status' => $status,
                'reviewer_id' => $reviewer->id,
            ],
            null,
            null,
            $reviewer->id
        );
    }
}
