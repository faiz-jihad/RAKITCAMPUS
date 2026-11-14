<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Jobs\SyncGitHubRepositoryJob;
use App\Models\GitHub\GitHubBranch;
use App\Models\GitHub\GitHubCommit;
use App\Models\GitHub\GitHubContributor;
use App\Models\GitHub\GitHubMemberMapping;
use App\Models\GitHub\GitHubPullRequest;
use App\Models\GitHub\GitHubRepository;
use App\Models\Team;
use App\Services\GitHub\ContributorMappingService;
use App\Services\GitHub\GitHubAnalyticsService;
use App\Services\GitHub\GitHubAppService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use InvalidArgumentException;

class GitHubWorkspaceController extends Controller
{
    protected GitHubAppService $appService;
    protected GitHubAnalyticsService $analyticsService;
    protected ContributorMappingService $mappingService;

    public function __construct(
        GitHubAppService $appService,
        GitHubAnalyticsService $analyticsService,
        ContributorMappingService $mappingService
    ) {
        $this->appService = $appService;
        $this->analyticsService = $analyticsService;
        $this->mappingService = $mappingService;
    }

    /**
     * Resolve Workspace Team from ID.
     */
    protected function resolveTeam(int|string $workspaceId): Team
    {
        return Team::with(['project', 'members.user'])->findOrFail((int) $workspaceId);
    }

    /**
     * GET /api/v1/workspaces/{workspace}/github/repository
     * Retrieve repository connection status and info.
     */
    public function repository(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('viewGitHub', $team);

        $repo = $team->githubRepository;

        if (! $repo) {
            return response()->json([
                'data' => [
                    'connected' => false,
                    'repository' => null,
                ],
            ]);
        }

        return response()->json([
            'data' => [
                'connected' => $repo->isConnected(),
                'repository' => [
                    'id' => $repo->id,
                    'owner' => $repo->owner,
                    'name' => $repo->name,
                    'full_name' => $repo->full_name,
                    'html_url' => $repo->html_url,
                    'default_branch' => $repo->default_branch,
                    'is_private' => $repo->is_private,
                    'stars_count' => $repo->stars_count,
                    'forks_count' => $repo->forks_count,
                    'open_issues_count' => $repo->open_issues_count,
                    'status' => $repo->status,
                    'sync_status' => $repo->sync_status,
                    'sync_error' => $repo->sync_error,
                    'last_synced_at' => $repo->last_synced_at?->toIso8601String(),
                    'webhook_url' => url('/api/v1/integrations/github/webhook'),
                ],
            ],
        ]);
    }

    /**
     * POST /api/v1/workspaces/{workspace}/github/repository
     * Connect a GitHub repository via repository URL.
     */
    public function connect(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('manageGitHub', $team);

        $validated = $request->validate([
            'repository_url' => ['required', 'string', 'max:500'],
        ], [
            'repository_url.required' => 'URL repositori GitHub wajib diisi.',
        ]);

        try {
            $parsed = $this->appService->parseRepositoryUrl($validated['repository_url']);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => ['repository_url' => [$e->getMessage()]],
            ], 422);
        }

        // Check if this repository is already connected to another team
        $existingOther = GitHubRepository::where('full_name', $parsed['full_name'])
            ->where('team_id', '!=', $team->id)
            ->where('status', 'active')
            ->first();

        if ($existingOther) {
            return response()->json([
                'message' => "Repositori '{$parsed['full_name']}' sudah terhubung ke Workspace tim lain.",
                'errors' => ['repository_url' => ["Repositori '{$parsed['full_name']}' sudah terhubung ke Workspace tim lain."]],
            ], 422);
        }

        // Discover installation ID if available
        $installationId = $this->appService->findRepositoryInstallationId($parsed['owner'], $parsed['repo']);

        // Verify repository accessibility
        try {
            $metadata = $this->appService->getRepository($parsed['owner'], $parsed['repo']);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => ['repository_url' => [$e->getMessage()]],
            ], 422);
        }

        // Create or update repository record
        $repo = GitHubRepository::updateOrCreate(
            ['team_id' => $team->id],
            [
                'project_id' => $team->project_id,
                'installation_id' => $installationId,
                'github_id' => $metadata['id'] ?? null,
                'owner' => $parsed['owner'],
                'name' => $parsed['repo'],
                'full_name' => $parsed['full_name'],
                'html_url' => $parsed['html_url'],
                'clone_url' => $metadata['clone_url'] ?? "https://github.com/{$parsed['full_name']}.git",
                'default_branch' => $metadata['default_branch'] ?? 'main',
                'description' => $metadata['description'] ?? null,
                'is_private' => (bool) ($metadata['private'] ?? false),
                'is_fork' => (bool) ($metadata['fork'] ?? false),
                'stars_count' => (int) ($metadata['stargazers_count'] ?? 0),
                'forks_count' => (int) ($metadata['forks_count'] ?? 0),
                'open_issues_count' => (int) ($metadata['open_issues_count'] ?? 0),
                'status' => 'active',
                'sync_status' => 'pending',
                'sync_error' => null,
                'webhook_secret' => Str::random(32),
            ]
        );

        // Update project repository_url if not set
        if ($team->project && ! $team->project->repository_url) {
            $team->project->update(['repository_url' => $parsed['html_url']]);
        }

        // Dispatch background synchronization
        SyncGitHubRepositoryJob::dispatch($repo->id, 'initial');

        return response()->json([
            'message' => "Repositori '{$repo->full_name}' berhasil dihubungkan. Proses analisis dan sinkronisasi kontribusi sedang berjalan di latar belakang.",
            'data' => [
                'repository' => [
                    'id' => $repo->id,
                    'full_name' => $repo->full_name,
                    'html_url' => $repo->html_url,
                    'status' => $repo->status,
                    'sync_status' => 'syncing',
                ],
            ],
        ], 201);
    }

    /**
     * DELETE /api/v1/workspaces/{workspace}/github/repository
     * Disconnect repository from workspace.
     */
    public function disconnect(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('manageGitHub', $team);

        $repo = $team->githubRepository;

        if (! $repo) {
            return response()->json(['message' => 'Tidak ada repositori GitHub yang terhubung.'], 404);
        }

        $fullName = $repo->full_name;
        $repo->update(['status' => 'disconnected']);
        $repo->delete();

        return response()->json([
            'message' => "Integrasi repositori '{$fullName}' berhasil diputuskan dari Workspace.",
        ]);
    }

    /**
     * POST /api/v1/workspaces/{workspace}/github/repository/sync
     * Trigger manual repository synchronization.
     */
    public function triggerSync(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('manageGitHub', $team);

        $repo = $team->githubRepository;

        if (! $repo || ! $repo->isConnected()) {
            return response()->json(['message' => 'Repositori belum terhubung atau berstatus tidak aktif.'], 404);
        }

        if ($repo->isSyncing()) {
            return response()->json([
                'message' => 'Sinkronisasi repositori sedang berlangsung.',
                'data' => ['sync_status' => 'syncing'],
            ], 409);
        }

        $repo->update(['sync_status' => 'syncing', 'sync_error' => null]);
        SyncGitHubRepositoryJob::dispatch($repo->id, 'manual');

        return response()->json([
            'message' => 'Proses sinkronisasi manual berhasil dipicu.',
            'data' => [
                'sync_status' => 'syncing',
            ],
        ]);
    }

    /**
     * GET /api/v1/workspaces/{workspace}/github/overview
     * High-level contribution overview, heatmap, and trends.
     */
    public function overview(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('viewGitHub', $team);

        $repo = $team->githubRepository;

        if (! $repo || ! $repo->isConnected()) {
            return response()->json([
                'message' => 'Repositori belum terhubung.',
                'data' => null,
            ], 404);
        }

        $overview = $this->analyticsService->getOverview($repo);

        return response()->json(['data' => $overview]);
    }

    /**
     * GET /api/v1/workspaces/{workspace}/github/contributors
     * List all contributors and member analytics.
     */
    public function contributors(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('viewGitHub', $team);

        $repo = $team->githubRepository;

        if (! $repo || ! $repo->isConnected()) {
            return response()->json(['data' => []]);
        }

        $analytics = $this->analyticsService->getMemberAnalytics($repo);

        return response()->json(['data' => $analytics]);
    }

    /**
     * GET /api/v1/workspaces/{workspace}/github/contributors/{id}
     * Specific contributor detail.
     */
    public function contributor(Request $request, int|string $workspaceId, int $contributorId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('viewGitHub', $team);

        $repo = $team->githubRepository;
        if (! $repo) {
            return response()->json(['message' => 'Repositori tidak ditemukan.'], 404);
        }

        $contributor = GitHubContributor::where('github_repository_id', $repo->id)
            ->with(['mapping.user', 'mapping.teamMember'])
            ->findOrFail($contributorId);

        $commits = GitHubCommit::where('github_repository_id', $repo->id)
            ->where('github_contributor_id', $contributor->id)
            ->latest('author_date')
            ->take(50)
            ->get();

        $prs = GitHubPullRequest::where('github_repository_id', $repo->id)
            ->where('github_contributor_id', $contributor->id)
            ->latest('created_at_gh')
            ->take(20)
            ->get();

        return response()->json([
            'data' => [
                'contributor' => $contributor,
                'commits' => $commits,
                'pull_requests' => $prs,
            ],
        ]);
    }

    /**
     * GET /api/v1/workspaces/{workspace}/github/branches
     * List branches and branch analytics.
     */
    public function branches(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('viewGitHub', $team);

        $repo = $team->githubRepository;

        if (! $repo || ! $repo->isConnected()) {
            return response()->json(['data' => []]);
        }

        $branches = $this->analyticsService->getBranchAnalytics($repo);

        return response()->json(['data' => $branches]);
    }

    /**
     * GET /api/v1/workspaces/{workspace}/github/commits
     * Paginated commit records with author filtering.
     */
    public function commits(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('viewGitHub', $team);

        $repo = $team->githubRepository;

        if (! $repo || ! $repo->isConnected()) {
            return response()->json(['data' => []]);
        }

        $query = GitHubCommit::where('github_repository_id', $repo->id)
            ->with(['contributor.mapping.user']);

        if ($request->filled('branch')) {
            $branch = $request->input('branch');
            $query->whereJsonContains('branches', $branch);
        }

        if ($request->filled('contributor_id')) {
            $query->where('github_contributor_id', $request->input('contributor_id'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('message', 'like', "%{$search}%")
                  ->orWhere('author_name', 'like', "%{$search}%")
                  ->orWhere('sha', 'like', "%{$search}%");
            });
        }

        $commits = $query->orderBy('author_date', 'desc')
            ->paginate($request->input('per_page', 25));

        return response()->json($commits);
    }

    /**
     * GET /api/v1/workspaces/{workspace}/github/pull-requests
     * List Pull Requests for the repository.
     */
    public function pullRequests(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('viewGitHub', $team);

        $repo = $team->githubRepository;

        if (! $repo || ! $repo->isConnected()) {
            return response()->json(['data' => []]);
        }

        $query = GitHubPullRequest::where('github_repository_id', $repo->id)
            ->with(['contributor.mapping.user', 'reviews']);

        if ($request->filled('state')) {
            $query->where('state', $request->input('state'));
        }

        $prs = $query->orderBy('created_at_gh', 'desc')
            ->paginate($request->input('per_page', 25));

        return response()->json($prs);
    }

    /**
     * GET /api/v1/workspaces/{workspace}/github/activity
     * Chronological unified development activity timeline.
     */
    public function activity(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('viewGitHub', $team);

        $repo = $team->githubRepository;

        if (! $repo || ! $repo->isConnected()) {
            return response()->json(['data' => []]);
        }

        $timeline = $this->analyticsService->getActivityTimeline(
            $repo,
            (int) $request->input('per_page', 30),
            (int) $request->input('page', 1)
        );

        return response()->json($timeline);
    }

    /**
     * GET /api/v1/workspaces/{workspace}/github/mappings
     * Contributor mappings list.
     */
    public function mappings(Request $request, int|string $workspaceId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('viewGitHub', $team);

        $repo = $team->githubRepository;

        if (! $repo || ! $repo->isConnected()) {
            return response()->json(['data' => []]);
        }

        $mappings = $this->mappingService->getMappingsForRepository($repo);

        return response()->json(['data' => $mappings]);
    }

    /**
     * PUT /api/v1/workspaces/{workspace}/github/mappings/{id}
     * Update manual contributor mapping.
     */
    public function updateMapping(Request $request, int|string $workspaceId, int $mappingId): JsonResponse
    {
        $team = $this->resolveTeam($workspaceId);
        $this->authorize('manageGitHub', $team);

        $repo = $team->githubRepository;
        if (! $repo) {
            return response()->json(['message' => 'Repositori tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'user_id' => ['nullable', 'exists:users,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $updated = $this->mappingService->updateManualMapping(
            $repo,
            $mappingId,
            $validated['user_id'] ?? null,
            $request->user(),
            $validated['notes'] ?? null
        );

        return response()->json([
            'message' => 'Pemetaan kontributor berhasil diperbarui.',
            'data' => $updated,
        ]);
    }
}
