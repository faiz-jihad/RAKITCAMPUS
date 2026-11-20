<?php

namespace App\Services\AI;

use App\Services\Storage\ObjectStorageService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use ZipArchive;

class DocumentTextExtractor
{
    /**
     * Extract text content from an uploaded file or file on disk.
     */
    public static function extractFromUploadedFile(UploadedFile $file, int $maxChars = 60000): string
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $realPath = $file->getRealPath();

        return self::extractFromPath($realPath, $extension, $maxChars);
    }

    /**
     * Extract text content from object storage path (e.g. 'competitions/documents/...').
     */
    public static function extractFromStorage(string $storagePath, int $maxChars = 60000): string
    {
        $diskName = ObjectStorageService::diskName();
        $disk = Storage::disk($diskName);

        try {
            if (!$disk->exists($storagePath)) {
                if (Storage::disk('public')->exists($storagePath)) {
                    $disk = Storage::disk('public');
                } else {
                    return '';
                }
            }

            $extension = strtolower(pathinfo($storagePath, PATHINFO_EXTENSION));

            // For text formats, read directly from disk
            if (in_array($extension, ['txt', 'md', 'markdown', 'json', 'csv', 'xml', 'html', 'log', 'yaml', 'yml'])) {
                $content = $disk->get($storagePath) ?? '';
                return mb_substr($content, 0, $maxChars);
            }

            // For binary formats (DOCX, PDF), fetch temp stream
            $tempFile = tempnam(sys_get_temp_dir(), 'rc_doc_');
            if ($tempFile) {
                file_put_contents($tempFile, $disk->get($storagePath));
                $text = self::extractFromPath($tempFile, $extension, $maxChars);
                @unlink($tempFile);
                return $text;
            }
        } catch (\Throwable $e) {
            Log::warning("Failed extracting text from storage [{$storagePath}]: " . $e->getMessage());
        }

        return '';
    }

    /**
     * Extract clean text based on file extension.
     */
    public static function extractFromPath(string $filePath, string $extension, int $maxChars = 60000): string
    {
        if (!file_exists($filePath)) {
            return '';
        }

        try {
            return match ($extension) {
                'txt', 'md', 'markdown', 'json', 'csv', 'xml', 'html', 'log', 'yaml', 'yml', 'js', 'ts', 'py', 'php'
                    => self::extractPlainText($filePath, $maxChars),
                'docx' => self::extractDocx($filePath, $maxChars),
                'pdf' => self::extractPdf($filePath, $maxChars),
                default => self::extractPlainText($filePath, $maxChars),
            };
        } catch (\Throwable $e) {
            Log::warning("Error parsing document [{$filePath}]: " . $e->getMessage());
            return '';
        }
    }

    /**
     * Read plain text files.
     */
    protected static function extractPlainText(string $filePath, int $maxChars): string
    {
        $content = @file_get_contents($filePath);
        if ($content === false) {
            return '';
        }

        // Clean UTF-8
        $clean = mb_convert_encoding($content, 'UTF-8', 'UTF-8');
        return mb_substr($clean, 0, $maxChars);
    }

    /**
     * Extract text from Word DOCX via ZipArchive.
     */
    protected static function extractDocx(string $filePath, int $maxChars): string
    {
        if (!class_exists('ZipArchive')) {
            return '';
        }

        $zip = new ZipArchive();
        if ($zip->open($filePath) !== true) {
            return '';
        }

        $content = $zip->getFromName('word/document.xml');
        $zip->close();

        if (!$content) {
            return '';
        }

        // Replace paragraph and break tags with newlines
        $content = preg_replace('/<\/w:p>/', "\n", $content);
        $content = preg_replace('/<w:br\s*[^>]*>/', "\n", $content);
        $text = strip_tags($content);
        $text = preg_replace("/[ \t]+/", ' ', $text);
        $text = preg_replace("/\n{3,}/", "\n\n", $text);

        return trim(mb_substr($text, 0, $maxChars));
    }

    /**
     * Extract text streams from PDF files via pure PHP stream parsing.
     */
    protected static function extractPdf(string $filePath, int $maxChars): string
    {
        $content = @file_get_contents($filePath);
        if (!$content) {
            return '';
        }

        $extractedText = '';

        // 1. Find all stream ... endstream blocks
        if (preg_match_all('/stream[\r\n]+(.*?)[\r\n]+endstream/s', $content, $matches)) {
            foreach ($matches[1] as $stream) {
                $decompressed = '';
                // Try decompressing with gzuncompress
                try {
                    $uncompressed = @gzuncompress($stream);
                    if ($uncompressed !== false) {
                        $decompressed = $uncompressed;
                    }
                } catch (\Throwable) {}

                if (!$decompressed) {
                    $decompressed = $stream;
                }

                // Parse PDF Text Blocks (BT ... ET)
                if (preg_match_all('/BT[\s\S]*?ET/', $decompressed, $textBlocks)) {
                    foreach ($textBlocks[0] as $block) {
                        // Match (Text) Tj
                        if (preg_match_all('/\((.*?)\)\s*Tj/s', $block, $tjs)) {
                            foreach ($tjs[1] as $tj) {
                                $extractedText .= self::decodePdfString($tj) . ' ';
                            }
                            $extractedText .= "\n";
                        }
                        // Match [(Array)] TJ
                        if (preg_match_all('/\[(.*?)\]\s*TJ/s', $block, $arrays)) {
                            foreach ($arrays[1] as $arr) {
                                if (preg_match_all('/\((.*?)\)/s', $arr, $tjItems)) {
                                    foreach ($tjItems[1] as $item) {
                                        $extractedText .= self::decodePdfString($item);
                                    }
                                    $extractedText .= ' ';
                                }
                            }
                            $extractedText .= "\n";
                        }
                    }
                }

                if (mb_strlen($extractedText) >= $maxChars) {
                    break;
                }
            }
        }

        // If stream extraction produced text, clean and return
        $clean = trim(preg_replace('/[ \t]+/', ' ', $extractedText));
        $clean = preg_replace("/\n{3,}/", "\n\n", $clean);

        if (mb_strlen($clean) > 30) {
            return mb_substr($clean, 0, $maxChars);
        }

        // Fallback: search for readable text chunks in PDF object strings
        if (preg_match_all('/\(([^\(\)\\\\]{4,})\)/', $content, $stringMatches)) {
            $fallback = implode(' ', array_slice($stringMatches[1], 0, 500));
            return trim(mb_substr($fallback, 0, $maxChars));
        }

        return '';
    }

    /**
     * Decode standard PDF string escape sequences.
     */
    protected static function decodePdfString(string $str): string
    {
        $str = str_replace(
            ['\\n', '\\r', '\\t', '\\(', '\\)', '\\\\'],
            ["\n", "\r", "\t", '(', ')', '\\'],
            $str
        );

        // Octal escape sequences \ddd
        $str = preg_replace_callback('/\\\\([0-7]{1,3})/', function ($m) {
            return chr(octdec($m[1]));
        }, $str);

        return $str;
    }
}
