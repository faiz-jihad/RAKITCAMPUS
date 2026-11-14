<?php

namespace App\Services\GitHub;

use App\Models\GitHub\GitHubBranch;
use App\Models\GitHub\GitHubCommit;
use App\Models\GitHub\GitHubContributor;
use App\Models\GitHub\GitHubPullRequest;
use App\Models\GitHub\GitHubRepository;
use App\Models\GitHub\GitHubReview;
use App\Models\GitHub\GitHubSyncLog;
use App\Models\GitHub\GitHubWebhookEvent;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class GitHubSyncService
{
    protected GitHubAppService $appService;
    protected ContributorMappingService $mappingService;

    public function __construct(
        GitHubAppService $appService,
        ContributorMappingService $mappingService
    ) {
        $this->appService = $appService;
        $this->mappingService = $mappingService;
    }

    /**
     * Run a full or incremental repository synchronization.
     */
    public function sync(GitHubRepository $repo, string $syncType = 'initial'): GitHubSyncLog
    {
        $startTime = microtime(true);
        $syncLog = GitHubSyncLog::create([
            'github_repository_id' => $repo->id,
            'sync_type' => $syncType,
            'status' => 'started',
            'started_at' => now(),
        ]);

        $repo->update([
            'sync_status' => 'syncing',
            'sync_error' => null,
        ]);

        $itemsSynced = [
            'branches' => 0,
            'commits' => 0,
            'contributors' => 0,
            'pull_requests' => 0,
            'reviews' => 0,
        ];

        try {
            // 1. Sync Repository Metadata
            $metadata = $this->appService->getRepository($repo->owner, $repo->name, $repo);
            if ($metadata) {
                $repo->update([
                    'github_id' => $metadata['id'] ?? $repo->github_id,
                    'full_name' => $metadata['full_name'] ?? $repo->full_name,
                    'default_branch' => $metadata['default_branch'] ?? $repo->default_branch,
                    'description' => $metadata['description'] ?? $repo->description,
                    'is_private' => (bool) ($metadata['private'] ?? false),
                    'is_fork' => (bool) ($metadata['fork'] ?? false),
                    'stars_count' => (int) ($metadata['stargazers_count'] ?? 0),
                    'forks_count' => (int) ($metadata['forks_count'] ?? 0),
                    'open_issues_count' => (int) ($metadata['open_issues_count'] ?? 0),
                    'metadata' => array_intersect_key($metadata, array_flip([
                        'language', 'topics', 'license', 'created_at', 'updated_at', 'pushed_at', 'visibility'
                    ])),
                ]);
            }

            // 2. Sync Branches
            $branchesData = $this->appService->getBranches($repo->owner, $repo->name, $repo);
            $activeBranchNames = [];

            foreach ($branchesData as $bData) {
                $bName = $bData['name'];
                $activeBranchNames[] = $bName;

                GitHubBranch::updateOrCreate(
                    [
                        'github_repository_id' => $repo->id,
                        'name' => $bName,
                    ],
                    [
                        'sha' => $bData['commit']['sha'] ?? null,
                        'is_default' => ($bName === $repo->default_branch),
                        'is_protected' => (bool) ($bData['protected'] ?? false),
                        'is_deleted' => false,
                        'last_commit_at' => now(),
                    ]
                );
                $itemsSynced['branches']++;
            }

            // Mark branches no longer in API as deleted (preserve historical records)
            if (! empty($activeBranchNames)) {
                GitHubBranch::where('github_repository_id', $repo->id)
                    ->whereNotIn('name', $activeBranchNames)
                    ->update(['is_deleted' => true]);
            }

            // 3. Sync Commits
            // If incremental, we can fetch commits since the last commit date
            $commitParams = [];
            if ($syncType === 'incremental' && $repo->last_synced_at) {
                // Buffer by 1 hour to prevent clock drift omissions
                $commitParams['since'] = $repo->last_synced_at->subHour()->toIso8601String();
            }

            $rawCommits = $this->appService->getCommits($repo->owner, $repo->name, $commitParams, $repo);

            foreach ($rawCommits as $cData) {
                $sha = $cData['sha'] ?? null;
                if (! $sha) continue;

                // Extract author & committer information
                $authorInfo = $cData['author'] ?? null;
                $committerInfo = $cData['committer'] ?? null;
                $commitDetails = $cData['commit'] ?? [];
                $authorDetails = $commitDetails['author'] ?? [];
                $committerDetails = $commitDetails['committer'] ?? [];

                $login = $authorInfo['login'] ?? $committerInfo['login'] ?? null;
                $githubId = $authorInfo['id'] ?? $committerInfo['id'] ?? null;
                $email = $authorDetails['email'] ?? $committerDetails['email'] ?? null;
                $name = $authorDetails['name'] ?? $committerDetails['name'] ?? $login ?? 'Unknown';
                $avatarUrl = $authorInfo['avatar_url'] ?? $committerInfo['avatar_url'] ?? null;
                $htmlUrl = $authorInfo['html_url'] ?? $committerInfo['html_url'] ?? null;
                $authorDate = isset($authorDetails['date']) ? date('Y-m-d H:i:s', strtotime($authorDetails['date'])) : null;
                $committerDate = isset($committerDetails['date']) ? date('Y-m-d H:i:s', strtotime($committerDetails['date'])) : null;

                // Find or create contributor
                $contributor = null;
                if ($githubId || $login || $email) {
                    $contributor = $this->resolveContributor($repo, $githubId, $login, $email, $name, $avatarUrl, $htmlUrl, $authorDate);
                    if ($contributor) {
                        $itemsSynced['contributors']++;
                    }
                }

                // Deduplication: A commit SHA is unique per repository
                $existingCommit = GitHubCommit::where('github_repository_id', $repo->id)
                    ->where('sha', $sha)
                    ->first();

                $statsAdditions = $cData['stats']['additions'] ?? 0;
                $statsDeletions = $cData['stats']['deletions'] ?? 0;
                $statsTotal = $cData['stats']['total'] ?? ($statsAdditions + $statsDeletions);

                if ($existingCommit) {
                    // Update branches list if not present
                    $existingBranches = $existingCommit->branches ?? [];
                    if (! in_array($repo->default_branch, $existingBranches, true)) {
                        $existingBranches[] = $repo->default_branch;
                        $existingCommit->update(['branches' => array_values(array_unique($existingBranches))]);
                    }
                } else {
                    GitHubCommit::create([
                        'github_repository_id' => $repo->id,
                        'github_contributor_id' => $contributor?->id,
                        'sha' => $sha,
                        'message' => $commitDetails['message'] ?? '',
                        'author_name' => $name,
                        'author_email' => $email,
                        'author_date' => $authorDate,
                        'committer_name' => $committerDetails['name'] ?? null,
                        'committer_email' => $committerDetails['email'] ?? null,
                        'committer_date' => $committerDate,
                        'html_url' => $cData['html_url'] ?? "https://github.com/{$repo->full_name}/commit/{$sha}",
                        'stats_additions' => $statsAdditions,
                        'stats_deletions' => $statsDeletions,
                        'stats_total' => $statsTotal,
                        'branches' => [$repo->default_branch],
                    ]);
                    $itemsSynced['commits']++;
                }
            }

            // 4. Sync Pull Requests & Reviews
            $prsData = $this->appService->getPullRequests($repo->owner, $repo->name, [], $repo);

            foreach ($prsData as $prData) {
                $prNumber = (int) ($prData['number'] ?? 0);
                if (! $prNumber) continue;

                $prUser = $prData['user'] ?? [];
                $prUserLogin = $prUser['login'] ?? null;
                $prUserId = $prUser['id'] ?? null;

                $prContributor = null;
                if ($prUserId || $prUserLogin) {
                    $prContributor = $this->resolveContributor(
                        $repo,
                        $prUserId,
                        $prUserLogin,
                        null,
                        $prUserLogin,
                        $prUser['avatar_url'] ?? null,
                        $prUser['html_url'] ?? null
                    );
                }

                $state = $prData['state'] ?? 'open';
                $isMerged = ! empty($prData['merged_at']);
                if ($isMerged) {
                    $state = 'merged';
                }

                $prRecord = GitHubPullRequest::updateOrCreate(
                    [
                        'github_repository_id' => $repo->id,
                        'number' => $prNumber,
                    ],
                    [
                        'github_id' => $prData['id'] ?? null,
                        'github_contributor_id' => $prContributor?->id,
                        'title' => $prData['title'] ?? "PR #{$prNumber}",
                        'body' => $prData['body'] ?? null,
                        'state' => $state,
                        'is_merged' => $isMerged,
                        'user_login' => $prUserLogin,
                        'head_branch' => $prData['head']['ref'] ?? null,
                        'base_branch' => $prData['base']['ref'] ?? null,
                        'html_url' => $prData['html_url'] ?? null,
                        'created_at_gh' => isset($prData['created_at']) ? date('Y-m-d H:i:s', strtotime($prData['created_at'])) : null,
                        'updated_at_gh' => isset($prData['updated_at']) ? date('Y-m-d H:i:s', strtotime($prData['updated_at'])) : null,
                        'closed_at_gh' => isset($prData['closed_at']) ? date('Y-m-d H:i:s', strtotime($prData['closed_at'])) : null,
                        'merged_at' => isset($prData['merged_at']) ? date('Y-m-d H:i:s', strtotime($prData['merged_at'])) : null,
                        'comments_count' => (int) ($prData['comments'] ?? 0),
                        'review_comments_count' => (int) ($prData['review_comments'] ?? 0),
                        'additions' => (int) ($prData['additions'] ?? 0),
                        'deletions' => (int) ($prData['deletions'] ?? 0),
                        'changed_files' => (int) ($prData['changed_files'] ?? 0),
                    ]
                );
                $itemsSynced['pull_requests']++;

                // Fetch reviews for open or recently updated PRs
                try {
                    $reviews = $this->appService->getPullRequestReviews($repo->owner, $repo->name, $prNumber, $repo);
                    foreach ($reviews as $rev) {
                        $revUser = $rev['user'] ?? [];
                        $revLogin = $revUser['login'] ?? null;
                        $revContributor = null;

                        if ($revLogin) {
                            $revContributor = $this->resolveContributor(
                                $repo,
                                $revUser['id'] ?? null,
                                $revLogin,
                                null,
                                $revLogin,
                                $revUser['avatar_url'] ?? null,
                                $revUser['html_url'] ?? null
                            );
                        }

                        GitHubReview::updateOrCreate(
                            [
                                'github_pull_request_id' => $prRecord->id,
                                'github_id' => $rev['id'] ?? null,
                            ],
                            [
                                'github_contributor_id' => $revContributor?->id,
                                'user_login' => $revLogin,
                                'state' => $rev['state'] ?? 'COMMENTED',
                                'body' => $rev['body'] ?? null,
                                'submitted_at' => isset($rev['submitted_at']) ? date('Y-m-d H:i:s', strtotime($rev['submitted_at'])) : null,
                                'html_url' => $rev['html_url'] ?? null,
                            ]
                        );
                        $itemsSynced['reviews']++;
                    }
                } catch (Throwable $e) {
                    Log::info("Could not fetch reviews for PR #{$prNumber}: " . $e->getMessage());
                }
            }

            // Recalculate contributor totals
            $this->recalculateContributorTotals($repo);

            // Complete synchronization
            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            $repo->update([
                'sync_status' => 'synced',
                'status' => 'active',
                'last_synced_at' => now(),
                'sync_error' => null,
            ]);

            $syncLog->update([
                'status' => 'completed',
                'items_synced' => $itemsSynced,
                'duration_ms' => $durationMs,
                'completed_at' => now(),
            ]);

            return $syncLog;
        } catch (Throwable $e) {
            $durationMs = (int) round((microtime(true) - $startTime) * 1000);
            $errorMessage = $e->getMessage();

            Log::error("GitHub sync failed for repo #{$repo->id} ({$repo->full_name}): {$errorMessage}");

            $repo->update([
                'sync_status' => 'failed',
                'sync_error' => $errorMessage,
            ]);

            $syncLog->update([
                'status' => 'failed',
                'error_message' => $errorMessage,
                'duration_ms' => $durationMs,
                'completed_at' => now(),
            ]);

            throw $e;
        }
    }

    /**
     * Resolve and update or create a contributor record, then trigger auto-mapping.
     */
    protected function resolveContributor(
        GitHubRepository $repo,
        ?int $githubId,
        ?string $login,
        ?string $email,
        ?string $name,
        ?string $avatarUrl = null,
        ?string $htmlUrl = null,
        ?string $activityDate = null
    ): GitHubContributor {
        $query = GitHubContributor::where('github_repository_id', $repo->id);

        if ($githubId) {
            $query->where('github_id', $githubId);
        } elseif ($login) {
            $query->where('login', $login);
        } elseif ($email) {
            $query->where('email', $email);
        }

        $contributor = $query->first();

        if ($contributor) {
            $updates = [];
            if ($login && ! $contributor->login) $updates['login'] = $login;
            if ($email && ! $contributor->email) $updates['email'] = $email;
            if ($avatarUrl && ! $contributor->avatar_url) $updates['avatar_url'] = $avatarUrl;
            if ($name && (! $contributor->name || $contributor->name === $login)) $updates['name'] = $name;
            if ($activityDate) {
                if (! $contributor->first_commit_at || strtotime($activityDate) < $contributor->first_commit_at->timestamp) {
                    $updates['first_commit_at'] = $activityDate;
                }
                if (! $contributor->last_commit_at || strtotime($activityDate) > $contributor->last_commit_at->timestamp) {
                    $updates['last_commit_at'] = $activityDate;
                }
            }
            if (! empty($updates)) {
                $contributor->update($updates);
            }
        } else {
            $contributor = GitHubContributor::create([
                'github_repository_id' => $repo->id,
                'github_id' => $githubId,
                'login' => $login,
                'name' => $name ?: $login,
                'email' => $email,
                'avatar_url' => $avatarUrl ?: ($login ? "https://github.com/{$login}.png" : null),
                'html_url' => $htmlUrl ?: ($login ? "https://github.com/{$login}" : null),
                'first_commit_at' => $activityDate,
                'last_commit_at' => $activityDate,
            ]);
        }

        // Auto-map contributor to team workspace member
        if ($repo->team) {
            $this->mappingService->autoMapContributor($contributor, $repo->team);
        }

        return $contributor;
    }

    /**
     * Recalculate commit counts and additions/deletions for contributors.
     */
    protected function recalculateContributorTotals(GitHubRepository $repo): void
    {
        $contributors = GitHubContributor::where('github_repository_id', $repo->id)->get();

        foreach ($contributors as $contributor) {
            $stats = GitHubCommit::where('github_repository_id', $repo->id)
                ->where('github_contributor_id', $contributor->id)
                ->selectRaw('count(*) as total_commits, coalesce(sum(stats_additions), 0) as total_additions, coalesce(sum(stats_deletions), 0) as total_deletions, min(author_date) as first_date, max(author_date) as last_date')
                ->first();

            $contributor->update([
                'total_commits' => (int) ($stats->total_commits ?? 0),
                'total_additions' => (int) ($stats->total_additions ?? 0),
                'total_deletions' => (int) ($stats->total_deletions ?? 0),
                'first_commit_at' => $stats->first_date ?? $contributor->first_commit_at,
                'last_commit_at' => $stats->last_date ?? $contributor->last_commit_at,
            ]);
        }
    }

    /**
     * Process GitHub webhook events idempotently.
     */
    public function handleWebhook(string $deliveryId, string $event, array $payload): array
    {
        // 1. Idempotency Check: if already processed, return immediately
        $existingEvent = GitHubWebhookEvent::where('delivery_id', $deliveryId)->first();
        if ($existingEvent && $existingEvent->processed) {
            return [
                'status' => 'duplicate',
                'message' => 'Delivery ID already processed successfully.',
            ];
        }

        $repoFullName = $payload['repository']['full_name'] ?? null;
        $action = $payload['action'] ?? null;

        $eventRecord = $existingEvent ?: GitHubWebhookEvent::create([
            'delivery_id' => $deliveryId,
            'event' => $event,
            'action' => $action,
            'repository_full_name' => $repoFullName,
            'payload' => $payload,
            'processed' => false,
        ]);

        if (! $repoFullName) {
            $eventRecord->update(['processed' => true, 'processed_at' => now()]);
            return ['status' => 'ignored', 'message' => 'No repository full_name in payload.'];
        }

        // Find connected repository
        $repo = GitHubRepository::where('full_name', $repoFullName)->first();
        if (! $repo) {
            $eventRecord->update(['processed' => true, 'processed_at' => now(), 'error' => 'Repository not connected in RAKIT.']);
            return ['status' => 'ignored', 'message' => 'Repository not connected in RAKIT.'];
        }

        try {
            switch ($event) {
                case 'push':
                    $this->handlePushEvent($repo, $payload);
                    break;
                case 'pull_request':
                    $this->handlePullRequestEvent($repo, $payload);
                    break;
                case 'pull_request_review':
                    $this->handlePullRequestReviewEvent($repo, $payload);
                    break;
                case 'create':
                    $this->handleCreateEvent($repo, $payload);
                    break;
                case 'delete':
                    $this->handleDeleteEvent($repo, $payload);
                    break;
                default:
                    Log::info("Unhandled GitHub webhook event: {$event} for {$repoFullName}");
                    break;
            }

            $eventRecord->update([
                'processed' => true,
                'processed_at' => now(),
                'error' => null,
            ]);

            return ['status' => 'processed', 'event' => $event];
        } catch (Throwable $e) {
            Log::error("Error processing GitHub webhook event {$event} ({$deliveryId}): " . $e->getMessage());
            $eventRecord->update([
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    protected function handlePushEvent(GitHubRepository $repo, array $payload): void
    {
        $ref = $payload['ref'] ?? '';
        $branchName = str_replace('refs/heads/', '', $ref);
        $commits = $payload['commits'] ?? [];

        // Update branch sha
        if ($branchName) {
            GitHubBranch::updateOrCreate(
                [
                    'github_repository_id' => $repo->id,
                    'name' => $branchName,
                ],
                [
                    'sha' => $payload['after'] ?? null,
                    'is_default' => ($branchName === $repo->default_branch),
                    'is_deleted' => false,
                    'last_commit_at' => now(),
                ]
            );
        }

        // Process commits
        foreach ($commits as $cData) {
            $sha = $cData['id'] ?? null;
            if (! $sha) continue;

            $author = $cData['author'] ?? [];
            $committer = $cData['committer'] ?? [];
            $name = $author['name'] ?? 'Unknown';
            $email = $author['email'] ?? null;
            $username = $author['username'] ?? null;
            $authorDate = isset($cData['timestamp']) ? date('Y-m-d H:i:s', strtotime($cData['timestamp'])) : now();

            $contributor = $this->resolveContributor(
                $repo,
                null,
                $username,
                $email,
                $name,
                $username ? "https://github.com/{$username}.png" : null,
                $username ? "https://github.com/{$username}" : null,
                $authorDate
            );

            $existing = GitHubCommit::where('github_repository_id', $repo->id)->where('sha', $sha)->first();

            $additions = count($cData['added'] ?? []);
            $deletions = count($cData['removed'] ?? []);
            $modified = count($cData['modified'] ?? []);

            if ($existing) {
                $branches = $existing->branches ?? [];
                if ($branchName && ! in_array($branchName, $branches, true)) {
                    $branches[] = $branchName;
                    $existing->update(['branches' => array_values(array_unique($branches))]);
                }
            } else {
                GitHubCommit::create([
                    'github_repository_id' => $repo->id,
                    'github_contributor_id' => $contributor?->id,
                    'sha' => $sha,
                    'message' => $cData['message'] ?? '',
                    'author_name' => $name,
                    'author_email' => $email,
                    'author_date' => $authorDate,
                    'committer_name' => $committer['name'] ?? null,
                    'committer_email' => $committer['email'] ?? null,
                    'committer_date' => $authorDate,
                    'html_url' => $cData['url'] ?? null,
                    'stats_additions' => $additions,
                    'stats_deletions' => $deletions,
                    'stats_total' => $additions + $deletions + $modified,
                    'branches' => $branchName ? [$branchName] : [$repo->default_branch],
                ]);
            }
        }

        $this->recalculateContributorTotals($repo);
        $repo->update(['last_synced_at' => now()]);
    }

    protected function handlePullRequestEvent(GitHubRepository $repo, array $payload): void
    {
        $prData = $payload['pull_request'] ?? [];
        $prNumber = (int) ($prData['number'] ?? 0);
        if (! $prNumber) return;

        $prUser = $prData['user'] ?? [];
        $prContributor = $this->resolveContributor(
            $repo,
            $prUser['id'] ?? null,
            $prUser['login'] ?? null,
            null,
            $prUser['login'] ?? null,
            $prUser['avatar_url'] ?? null,
            $prUser['html_url'] ?? null
        );

        $state = $prData['state'] ?? 'open';
        $isMerged = ! empty($prData['merged_at']);
        if ($isMerged) $state = 'merged';

        GitHubPullRequest::updateOrCreate(
            [
                'github_repository_id' => $repo->id,
                'number' => $prNumber,
            ],
            [
                'github_id' => $prData['id'] ?? null,
                'github_contributor_id' => $prContributor?->id,
                'title' => $prData['title'] ?? "PR #{$prNumber}",
                'body' => $prData['body'] ?? null,
                'state' => $state,
                'is_merged' => $isMerged,
                'user_login' => $prUser['login'] ?? null,
                'head_branch' => $prData['head']['ref'] ?? null,
                'base_branch' => $prData['base']['ref'] ?? null,
                'html_url' => $prData['html_url'] ?? null,
                'created_at_gh' => isset($prData['created_at']) ? date('Y-m-d H:i:s', strtotime($prData['created_at'])) : null,
                'updated_at_gh' => isset($prData['updated_at']) ? date('Y-m-d H:i:s', strtotime($prData['updated_at'])) : null,
                'closed_at_gh' => isset($prData['closed_at']) ? date('Y-m-d H:i:s', strtotime($prData['closed_at'])) : null,
                'merged_at' => isset($prData['merged_at']) ? date('Y-m-d H:i:s', strtotime($prData['merged_at'])) : null,
                'comments_count' => (int) ($prData['comments'] ?? 0),
                'review_comments_count' => (int) ($prData['review_comments'] ?? 0),
                'additions' => (int) ($prData['additions'] ?? 0),
                'deletions' => (int) ($prData['deletions'] ?? 0),
                'changed_files' => (int) ($prData['changed_files'] ?? 0),
            ]
        );

        $repo->update(['last_synced_at' => now()]);
    }

    protected function handlePullRequestReviewEvent(GitHubRepository $repo, array $payload): void
    {
        $review = $payload['review'] ?? [];
        $prData = $payload['pull_request'] ?? [];
        $prNumber = (int) ($prData['number'] ?? 0);
        if (! $prNumber || empty($review)) return;

        $prRecord = GitHubPullRequest::where('github_repository_id', $repo->id)->where('number', $prNumber)->first();
        if (! $prRecord) return;

        $revUser = $review['user'] ?? [];
        $revContributor = $this->resolveContributor(
            $repo,
            $revUser['id'] ?? null,
            $revUser['login'] ?? null,
            null,
            $revUser['login'] ?? null,
            $revUser['avatar_url'] ?? null,
            $revUser['html_url'] ?? null
        );

        GitHubReview::updateOrCreate(
            [
                'github_pull_request_id' => $prRecord->id,
                'github_id' => $review['id'] ?? null,
            ],
            [
                'github_contributor_id' => $revContributor?->id,
                'user_login' => $revUser['login'] ?? null,
                'state' => $review['state'] ?? 'COMMENTED',
                'body' => $review['body'] ?? null,
                'submitted_at' => isset($review['submitted_at']) ? date('Y-m-d H:i:s', strtotime($review['submitted_at'])) : null,
                'html_url' => $review['html_url'] ?? null,
            ]
        );

        $repo->update(['last_synced_at' => now()]);
    }

    protected function handleCreateEvent(GitHubRepository $repo, array $payload): void
    {
        if (($payload['ref_type'] ?? '') === 'branch') {
            $branchName = $payload['ref'] ?? null;
            if ($branchName) {
                GitHubBranch::updateOrCreate(
                    [
                        'github_repository_id' => $repo->id,
                        'name' => $branchName,
                    ],
                    [
                        'is_default' => ($branchName === $repo->default_branch),
                        'is_deleted' => false,
                        'last_commit_at' => now(),
                    ]
                );
            }
        }
    }

    protected function handleDeleteEvent(GitHubRepository $repo, array $payload): void
    {
        if (($payload['ref_type'] ?? '') === 'branch') {
            $branchName = $payload['ref'] ?? null;
            if ($branchName) {
                GitHubBranch::where('github_repository_id', $repo->id)
                    ->where('name', $branchName)
                    ->update(['is_deleted' => true]);
            }
        }
    }
}
