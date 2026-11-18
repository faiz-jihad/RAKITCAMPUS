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
        $type = $request->input('type', 'general');

        // Dynamic MIME validation based on upload category
        $allowedMimes = match ($type) {
            'avatar' => 'mimes:jpeg,jpg,png,webp',
            default => 'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,zip,rar,7z,txt,csv,jpg,jpeg,png,webp,mp4,mkv,webm',
        };

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:71680', $allowedMimes], // max 70MB per file
            'type' => ['nullable', 'string', 'in:avatar,document,attachment,portfolio,project,general,proposal,deliverable'],
            'team_id' => ['nullable', 'exists:teams,id'],
        ]);

        $file = $request->file('file');
        $ext = strtolower($file->getClientOriginalExtension());
        $dangerousExtensions = ['php', 'phtml', 'phar', 'exe', 'bat', 'sh', 'cmd', 'com', 'js', 'vbs', 'scr', 'html', 'htm', 'svg'];

        if (in_array($ext, $dangerousExtensions, true)) {
            return response()->json([
                'success' => false,
                'message' => "Tipe file .{$ext} dilarang demi keamanan sistem.",
            ], 422);
        }

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
        // Reject path traversal and null byte injections
        if (str_contains($path, '..') || str_contains($path, "\0") || str_contains($path, '\\')) {
            abort(400, 'Format path berkas tidak valid.');
        }

        $cleanPath = ltrim($path, '/');

        if (empty($cleanPath)) {
            abort(400, 'Format path berkas tidak valid.');
        }

        $filename = $request->query('filename');
        if ($filename) {
            $filename = basename(str_replace(["\0", '/', '\\'], '', $filename));
        }

        return ObjectStorageService::download($cleanPath, $filename);
    }
}
