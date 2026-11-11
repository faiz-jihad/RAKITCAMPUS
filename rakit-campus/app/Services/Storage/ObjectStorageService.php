<?php

namespace App\Services\Storage;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ObjectStorageService
{
    /**
     * Get the active object storage disk name.
     */
    public static function diskName(): string
    {
        $preferredDisk = config('filesystems.default_object_disk', 'minio');

        // Check if preferred disk is configured
        $disks = config('filesystems.disks', []);
        if (isset($disks[$preferredDisk])) {
            return $preferredDisk;
        }

        return 'public';
    }

    /**
     * Get the active filesystem instance.
     */
    public static function disk(): Filesystem
    {
        try {
            return Storage::disk(self::diskName());
        } catch (\Throwable $e) {
            Log::warning('Failed to load primary object storage disk, falling back to public: ' . $e->getMessage());
            return Storage::disk('public');
        }
    }

    /**
     * Store an uploaded file in Object Storage.
     *
     * @param UploadedFile $file
     * @param string $directory Target directory (e.g. 'competitions/documents')
     * @param string|null $customFilename Optional custom filename
     * @param array $options Storage options (visibility, etc.)
     * @return array Metadata of stored file [path, url, disk, filename, original_name, file_size, mime_type]
     */
    public static function store(
        UploadedFile $file,
        string $directory = 'files',
        ?string $customFilename = null,
        array $options = []
    ): array {
        $diskName = self::diskName();
        $directory = trim($directory, '/');

        $originalName = $file->getClientOriginalName();
        $extension = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin';

        if ($customFilename) {
            $filename = Str::finish($customFilename, '.' . $extension);
        } else {
            $filename = Str::random(32) . '.' . $extension;
        }

        $fullPath = $directory ? "{$directory}/{$filename}" : $filename;

        // Stream file directly to object storage (memory efficient for large files)
        try {
            $stream = fopen($file->getRealPath(), 'r+');
            $stored = Storage::disk($diskName)->put($fullPath, $stream, $options);
            if (is_resource($stream)) {
                fclose($stream);
            }

            if (!$stored) {
                // Fallback to storeAs
                $fullPath = $file->storeAs($directory, $filename, $diskName);
            }
        } catch (\Throwable $e) {
            Log::error("Object storage upload failed on disk [{$diskName}], falling back to [public]: " . $e->getMessage());
            $diskName = 'public';
            $fullPath = $file->storeAs($directory, $filename, 'public');
        }

        $url = self::url($fullPath, $diskName);

        return [
            'path' => $fullPath,
            'url' => $url,
            'disk' => $diskName,
            'filename' => $filename,
            'original_name' => $originalName,
            'file_size' => $file->getSize(),
            'mime_type' => $file->getMimeType(),
        ];
    }

    /**
     * Store raw content or stream to Object Storage.
     */
    public static function put(string $path, mixed $contents, array $options = []): bool
    {
        $diskName = self::diskName();
        try {
            return Storage::disk($diskName)->put($path, $contents, $options);
        } catch (\Throwable $e) {
            Log::error("Object storage put failed on disk [{$diskName}]: " . $e->getMessage());
            return Storage::disk('public')->put($path, $contents, $options);
        }
    }

    /**
     * Resolve public or streaming URL for a given path.
     */
    public static function url(?string $path, ?string $diskName = null): ?string
    {
        if (empty($path)) {
            return null;
        }

        // Already absolute URL
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        $disk = $diskName ?? self::diskName();

        // Custom configured MinIO public URL or reverse proxy endpoint
        if ($disk === 'minio') {
            $customUrl = config('filesystems.disks.minio.url');
            if ($customUrl) {
                return rtrim($customUrl, '/') . '/' . ltrim($path, '/');
            }

            // Default S3 URL resolution
            try {
                return Storage::disk('minio')->url($path);
            } catch (\Throwable) {
                return asset('storage-obj/' . ltrim($path, '/'));
            }
        }

        if ($disk === 'public') {
            return asset('storage/' . ltrim($path, '/'));
        }

        try {
            return Storage::disk($disk)->url($path);
        } catch (\Throwable) {
            return asset('storage/' . ltrim($path, '/'));
        }
    }

    /**
     * Check if a file exists in storage.
     */
    public static function exists(string $path, ?string $diskName = null): bool
    {
        $disk = $diskName ?? self::diskName();
        try {
            return Storage::disk($disk)->exists($path);
        } catch (\Throwable) {
            return Storage::disk('public')->exists($path);
        }
    }

    /**
     * Delete a file from storage.
     */
    public static function delete(string|array $paths, ?string $diskName = null): bool
    {
        $disk = $diskName ?? self::diskName();
        try {
            return Storage::disk($disk)->delete($paths);
        } catch (\Throwable) {
            return Storage::disk('public')->delete($paths);
        }
    }

    /**
     * Stream large file download with Range request support.
     */
    public static function download(string $path, ?string $filename = null, ?string $diskName = null): StreamedResponse
    {
        $disk = $diskName ?? self::diskName();
        $fs = Storage::disk($disk);

        if (!$fs->exists($path)) {
            // Check public fallback
            if (Storage::disk('public')->exists($path)) {
                $fs = Storage::disk('public');
            } else {
                abort(404, 'Berkas tidak ditemukan pada Object Storage.');
            }
        }

        $downloadName = $filename ?: basename($path);
        $mimeType = $fs->mimeType($path) ?: 'application/octet-stream';
        $size = $fs->size($path);

        return response()->stream(
            function () use ($fs, $path) {
                $stream = $fs->readStream($path);
                if (is_resource($stream)) {
                    fpassthru($stream);
                    fclose($stream);
                }
            },
            200,
            [
                'Content-Type' => $mimeType,
                'Content-Length' => $size,
                'Content-Disposition' => 'attachment; filename="' . addslashes($downloadName) . '"',
                'Accept-Ranges' => 'bytes',
                'Cache-Control' => 'private, max-age=86400',
            ]
        );
    }
}
