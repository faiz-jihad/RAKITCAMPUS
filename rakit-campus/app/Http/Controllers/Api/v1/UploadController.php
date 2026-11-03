<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Upload a file to the server storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:15360'], // max 15MB
            'type' => ['nullable', 'string', 'in:avatar,document,attachment,portfolio,project,general'],
        ]);

        $file = $request->file('file');
        $type = $validated['type'] ?? 'general';

        // Target directory: storage/app/public/uploads/{type}
        $targetDirectory = 'uploads/' . $type;

        // Generate sanitized unique filename
        $extension = $file->getClientOriginalExtension();
        $safeName = Str::random(24) . '.' . $extension;

        $path = $file->storeAs($targetDirectory, $safeName, 'public');

        // Publicly accessible URL via storage link
        $url = asset('storage/' . $path);

        return response()->json([
            'success' => true,
            'data' => [
                'url' => $url,
                'path' => $path,
                'filename' => $safeName,
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime_type' => $file->getMimeType(),
                'type' => $type,
            ],
            'message' => 'File berhasil diunggah ke server.',
        ], 201);
    }
}
