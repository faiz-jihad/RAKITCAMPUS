<?php

namespace App\Services\Translation;

use App\Services\AI\GeminiAgentService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TranslationService
{
    /**
     * Cache duration in seconds (30 days).
     */
    protected const CACHE_TTL = 2592000;

    /**
     * Translate a single text string.
     */
    public function translateText(string $text, string $target = 'en', string $source = 'id'): string
    {
        $trimmed = trim($text);
        if ($trimmed === '' || $target === $source) {
            return $text;
        }

        $cacheKey = $this->getCacheKey($trimmed, $target, $source);

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($trimmed, $target, $source) {
            return $this->performTranslation($trimmed, $target, $source);
        });
    }

    /**
     * Translate an array of text strings efficiently with batch caching.
     *
     * @param array<int|string, string> $texts
     * @return array<int|string, string>
     */
    public function translateBatch(array $texts, string $target = 'en', string $source = 'id'): array
    {
        if (empty($texts) || $target === $source) {
            return $texts;
        }

        $results = [];
        $missingKeys = [];
        $missingTexts = [];

        foreach ($texts as $key => $text) {
            $trimmed = trim((string) $text);
            if ($trimmed === '') {
                $results[$key] = $text;
                continue;
            }

            $cacheKey = $this->getCacheKey($trimmed, $target, $source);
            $cached = Cache::get($cacheKey);

            if ($cached !== null) {
                $results[$key] = $cached;
            } else {
                $missingKeys[] = $key;
                $missingTexts[] = $trimmed;
            }
        }

        if (empty($missingTexts)) {
            return $results;
        }

        // Try Gemini batch translation first if configured
        if (!empty(config('services.gemini.api_key'))) {
            $batchTranslations = $this->translateWithGeminiBatch($missingTexts, $target, $source);
            if (!empty($batchTranslations) && count($batchTranslations) === count($missingTexts)) {
                foreach ($missingKeys as $idx => $key) {
                    $translated = $batchTranslations[$idx] ?? $missingTexts[$idx];
                    $results[$key] = $translated;
                    Cache::put($this->getCacheKey($missingTexts[$idx], $target, $source), $translated, self::CACHE_TTL);
                }
                return $results;
            }
        }

        // Fallback: Translate individually via Google Translate engine
        foreach ($missingKeys as $idx => $key) {
            $raw = $missingTexts[$idx];
            $translated = $this->performTranslation($raw, $target, $source);
            $results[$key] = $translated;
            Cache::put($this->getCacheKey($raw, $target, $source), $translated, self::CACHE_TTL);
        }

        return $results;
    }

    /**
     * Internal single translation execution with multi-engine fallback.
     */
    protected function performTranslation(string $text, string $target, string $source): string
    {
        // Engine 1: Google Gemini AI (Context-aware & keeps acronyms intact)
        if (!empty(config('services.gemini.api_key'))) {
            try {
                $geminiResult = $this->translateWithGemini($text, $target, $source);
                if (!empty($geminiResult)) {
                    return $geminiResult;
                }
            } catch (\Throwable $e) {
                Log::warning('Gemini translation failed: ' . $e->getMessage());
            }
        }

        // Engine 2: Google Cloud / Web Translate Endpoint
        try {
            $googleResult = $this->translateWithGoogleWeb($text, $target, $source);
            if (!empty($googleResult)) {
                return $googleResult;
            }
        } catch (\Throwable $e) {
            Log::warning('Google Web translation failed: ' . $e->getMessage());
        }

        // Engine 3: Return original as fail-safe
        return $text;
    }

    /**
     * Translate using Google Gemini API.
     */
    protected function translateWithGemini(string $text, string $target, string $source): ?string
    {
        $targetLang = $target === 'en' ? 'English' : 'Indonesian';
        $sourceLang = $source === 'id' ? 'Indonesian' : 'English';

        $systemPrompt = "You are an accurate, academic and competition translator for RAKIT Campus. "
            . "Translate the user text from {$sourceLang} to natural, modern {$targetLang}. "
            . "Retain academic acronyms and entity names as-is (e.g., Polindra, Puspresnas, GEMASTIK, PKM, Diktiristek, etc.). "
            . "Output ONLY the raw translated text without quotes or explanations.";

        $response = GeminiAgentService::call($systemPrompt, $text);

        if (!$response) {
            return null;
        }

        $clean = trim($response);
        // Strip wrapping quotes if model added them
        if ((str_starts_with($clean, '"') && str_ends_with($clean, '"')) || (str_starts_with($clean, "'") && str_ends_with($clean, "'"))) {
            $clean = substr($clean, 1, -1);
        }

        return trim($clean);
    }

    /**
     * Translate multiple texts with Google Gemini API in a single prompt.
     */
    protected function translateWithGeminiBatch(array $texts, string $target, string $source): ?array
    {
        $targetLang = $target === 'en' ? 'English' : 'Indonesian';
        $sourceLang = $source === 'id' ? 'Indonesian' : 'English';

        $systemPrompt = "You are a professional batch translator for the RAKIT Campus educational platform. "
            . "Translate the following JSON array of strings from {$sourceLang} to {$targetLang}. "
            . "Keep acronyms (Polindra, GEMASTIK, PKM, etc.) and proper names unchanged. "
            . "Return strictly a valid JSON array of strings with the exact same length and order.";

        $userPrompt = json_encode(array_values($texts), JSON_UNESCAPED_UNICODE);
        $response = GeminiAgentService::call($systemPrompt, $userPrompt);

        if (!$response) {
            return null;
        }

        // Extract JSON array
        $clean = trim($response);
        if (preg_match('/\[.*\]/s', $clean, $matches)) {
            $clean = $matches[0];
        }

        $decoded = json_decode($clean, true);
        return is_array($decoded) ? $decoded : null;
    }

    /**
     * Translate via public Google Translate endpoint.
     */
    protected function translateWithGoogleWeb(string $text, string $target, string $source): ?string
    {
        $url = 'https://translate.googleapis.com/translate_a/single';

        $response = Http::timeout(8)
            ->withHeaders([
                'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
            ])
            ->get($url, [
                'client' => 'gtx',
                'sl' => $source,
                'tl' => $target,
                'dt' => 't',
                'q' => $text,
            ]);

        if (!$response->successful()) {
            return null;
        }

        $data = $response->json();
        if (!is_array($data) || !isset($data[0]) || !is_array($data[0])) {
            return null;
        }

        $translatedParts = [];
        foreach ($data[0] as $chunk) {
            if (isset($chunk[0]) && is_string($chunk[0])) {
                $translatedParts[] = $chunk[0];
            }
        }

        return !empty($translatedParts) ? implode('', $translatedParts) : null;
    }

    /**
     * Generate unique cache key.
     */
    protected function getCacheKey(string $text, string $target, string $source): string
    {
        return 'rakit_tr_' . $target . '_' . $source . '_' . md5($text);
    }
}
