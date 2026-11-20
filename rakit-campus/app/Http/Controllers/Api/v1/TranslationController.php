<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Services\Translation\TranslationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TranslationController extends Controller
{
    public function __construct(
        protected TranslationService $translationService
    ) {}

    /**
     * Translate single or batch text requests.
     */
    public function translate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['nullable', 'string', 'max:5000'],
            'texts' => ['nullable', 'array', 'max:50'],
            'texts.*' => ['string', 'max:3000'],
            'target' => ['nullable', 'string', 'in:en,id'],
            'source' => ['nullable', 'string', 'in:en,id,auto'],
        ]);

        $target = $validated['target'] ?? 'en';
        $source = $validated['source'] ?? 'id';

        if (!empty($validated['texts'])) {
            $translated = $this->translationService->translateBatch($validated['texts'], $target, $source);

            return response()->json([
                'success' => true,
                'data' => $translated,
                'target' => $target,
            ]);
        }

        $text = $validated['text'] ?? '';
        $translated = $this->translationService->translateText($text, $target, $source);

        return response()->json([
            'success' => true,
            'data' => $translated,
            'target' => $target,
        ]);
    }
}
