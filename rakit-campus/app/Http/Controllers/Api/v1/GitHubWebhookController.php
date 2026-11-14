<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\GitHub\GitHubRepository;
use App\Services\GitHub\GitHubAppService;
use App\Services\GitHub\GitHubSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class GitHubWebhookController extends Controller
{
    protected GitHubAppService $appService;
    protected GitHubSyncService $syncService;

    public function __construct(
        GitHubAppService $appService,
        GitHubSyncService $syncService
    ) {
        $this->appService = $appService;
        $this->syncService = $syncService;
    }

    /**
     * Handle incoming GitHub Webhook delivery.
     * POST /api/v1/integrations/github/webhook
     */
    public function handle(Request $request): JsonResponse
    {
        $signature = $request->header('X-Hub-Signature-256');
        $event = $request->header('X-GitHub-Event');
        $deliveryId = $request->header('X-GitHub-Delivery');
        $rawPayload = $request->getContent();

        if (empty($event) || empty($deliveryId)) {
            return response()->json(['message' => 'Missing GitHub webhook headers.'], 400);
        }

        $payload = json_decode($rawPayload, true) ?: [];
        $repoFullName = $payload['repository']['full_name'] ?? null;

        // Signature verification:
        // Try global webhook secret first; if failed, check repo-specific webhook secret
        $customSecret = null;
        if ($repoFullName) {
            $repo = GitHubRepository::where('full_name', $repoFullName)->first();
            if ($repo && $repo->webhook_secret) {
                $customSecret = $repo->webhook_secret;
            }
        }

        $isValid = $this->appService->verifyWebhookSignature($rawPayload, $signature)
            || ($customSecret && $this->appService->verifyWebhookSignature($rawPayload, $signature, $customSecret));

        $hasSecret = ! empty(config('github.webhook_secret')) || ! empty($customSecret);
        if ($hasSecret && ! $isValid) {
            Log::warning("GitHub webhook signature verification failed for event '{$event}' (Delivery: {$deliveryId})");
            return response()->json(['message' => 'Invalid webhook signature.'], 401);
        }

        // Handle ping event
        if ($event === 'ping') {
            return response()->json([
                'status' => 'pong',
                'zen' => $payload['zen'] ?? 'Keep it logically awesome.',
            ]);
        }

        try {
            $result = $this->syncService->handleWebhook($deliveryId, $event, $payload);
            return response()->json($result);
        } catch (Throwable $e) {
            Log::error("Failed to process GitHub webhook: " . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
