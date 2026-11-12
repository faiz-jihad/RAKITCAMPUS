<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\Storage\ObjectStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UploadController extends Controller
{
    /**
     * Upload a file to Object Storage (supporting large files up to 250MB).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:71680'], // max 70MB per file
            'type' => ['nullable', 'string', 'in:avatar,document,attachment,portfolio,project,general,proposal,deliverable'],
            'team_id' => ['nullable', 'exists:teams,id'],
        ]);

        $file = $request->file('file');
        $type = $validated['type'] ?? 'general';

        if (!empty($validated['team_id'])) {
            ObjectStorageService::checkTeamStorageQuota((int) $validated['team_id'], $file->getSize());
        }

        $stored = ObjectStorageService::store($file, 'uploads/' . $type);

        return response()->json([
            'success' => true,
            'data' => [
                'url' => $stored['url'],
                'path' => $stored['path'],
                'filename' => $stored['filename'],
                'original_name' => $stored['original_name'],
                'size' => $stored['file_size'],
                'mime_type' => $stored['mime_type'],
                'type' => $type,
                'disk' => $stored['disk'],
            ],
            'message' => 'File berhasil diunggah ke Object Storage.',
        ], 201);
    }

    /**
     * Stream or download file from Object Storage.
     */
    public function download(Request $request, string $path): StreamedResponse
    {
        $filename = $request->query('filename');
        return ObjectStorageService::download($path, $filename);
    }
}
