<?php

namespace App\Jobs;

use App\Models\GitHub\GitHubRepository;
use App\Services\GitHub\GitHubSyncService;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class SyncGitHubRepositoryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 30; // seconds before retry
    public int $timeout = 180; // 3 minutes timeout

    protected int $repositoryId;
    protected string $syncType;

    public function __construct(int $repositoryId, string $syncType = 'initial')
    {
        $this->repositoryId = $repositoryId;
        $this->syncType = $syncType;
    }

    public function handle(GitHubSyncService $syncService): void
    {
        $repo = GitHubRepository::find($this->repositoryId);

        if (! $repo) {
            Log::warning("SyncGitHubRepositoryJob: Repository ID {$this->repositoryId} not found.");
            return;
        }

        Log::info("Starting GitHub repository sync for #{$repo->id} ({$repo->full_name}) - Type: {$this->syncType}");

        try {
            $syncService->sync($repo, $this->syncType);
            Log::info("Successfully completed GitHub repository sync for #{$repo->id} ({$repo->full_name})");
        } catch (Throwable $e) {
            Log::error("Failed GitHub repository sync for #{$repo->id} ({$repo->full_name}): " . $e->getMessage());

            if ($this->attempts() >= $this->tries) {
                $repo->update([
                    'sync_status' => 'failed',
                    'sync_error' => $e->getMessage(),
                ]);
            }

            throw $e;
        }
    }

    public function failed(?Throwable $exception): void
    {
        Log::critical("SyncGitHubRepositoryJob definitively failed for Repo ID {$this->repositoryId}: " . $exception?->getMessage());

        if ($repo = GitHubRepository::find($this->repositoryId)) {
            $repo->update([
                'sync_status' => 'failed',
                'sync_error' => $exception?->getMessage() ?: 'Sinkronisasi gagal setelah beberapa percobaan.',
            ]);
        }
    }
}
