<?php

namespace App\Services\GitHub;

use App\Models\GitHub\GitHubBranch;
use App\Models\GitHub\GitHubCommit;
use App\Models\GitHub\GitHubContributor;
use App\Models\GitHub\GitHubMemberMapping;
use App\Models\GitHub\GitHubPullRequest;
use App\Models\GitHub\GitHubRepository;
use App\Models\GitHub\GitHubReview;
use App\Models\Team;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class GitHubAnalyticsService
{
    /**
     * Compute comprehensive repository overview analytics.
     */
    public function getOverview(GitHubRepository $repo): array
    {
        $totalCommits = GitHubCommit::where('github_repository_id', $repo->id)->count();
        $totalBranches = GitHubBranch::where('github_repository_id', $repo->id)->where('is_deleted', false)->count();
        $activeContributors = GitHubContributor::where('github_repository_id', $repo->id)
            ->where('total_commits', '>', 0)
            ->count();

        $prsCreated = GitHubPullRequest::where('github_repository_id', $repo->id)->count();
        $prsMerged = GitHubPullRequest::where('github_repository_id', $repo->id)->where('is_merged', true)->count();
        $prsOpen = GitHubPullRequest::where('github_repository_id', $repo->id)->where('state', 'open')->count();

        $statsTotals = GitHubCommit::where('github_repository_id', $repo->id)
            ->selectRaw('coalesce(sum(stats_additions), 0) as additions, coalesce(sum(stats_deletions), 0) as deletions')
            ->first();

        $thirtyDaysAgo = Carbon::now()->subDays(30);
        $recentCommitsCount = GitHubCommit::where('github_repository_id', $repo->id)
            ->where('author_date', '>=', $thirtyDaysAgo)
            ->count();

        // 30-day commit trend (daily counts)
        $dailyTrends = $this->getDailyCommitTrend($repo, 30);

        // Heatmap for past 365 days
        $heatmap = $this->getContributionHeatmap($repo, 365);

        // Top contributors
        $topContributors = $this->getTopContributors($repo, 5);

        return [
            'repository' => [
                'id' => $repo->id,
                'name' => $repo->name,
                'full_name' => $repo->full_name,
                'html_url' => $repo->html_url,
                'default_branch' => $repo->default_branch,
                'is_private' => $repo->is_private,
                'status' => $repo->status,
                'sync_status' => $repo->sync_status,
                'last_synced_at' => $repo->last_synced_at?->toIso8601String(),
                'sync_error' => $repo->sync_error,
            ],
            'metrics' => [
                'total_commits' => $totalCommits,
                'total_branches' => $totalBranches,
                'active_contributors' => $activeContributors,
                'pull_requests_created' => $prsCreated,
                'pull_requests_merged' => $prsMerged,
                'pull_requests_open' => $prsOpen,
                'total_additions' => (int) ($statsTotals->additions ?? 0),
                'total_deletions' => (int) ($statsTotals->deletions ?? 0),
                'recent_commits_30d' => $recentCommitsCount,
            ],
            'daily_trends' => $dailyTrends,
            'heatmap' => $heatmap,
            'top_contributors' => $topContributors,
        ];
    }

    /**
     * Compute analytics broken down by Workspace members and unmapped contributors.
     */
    public function getMemberAnalytics(GitHubRepository $repo): array
    {
        $team = $repo->team;
        $teamMembers = $team ? $team->members()->with(['user.profile'])->get() : collect();

        // Fetch all contributors with their mappings
        $contributors = GitHubContributor::where('github_repository_id', $repo->id)
            ->with(['mapping.user', 'mapping.teamMember'])
            ->get();

        $memberAnalytics = [];
        $mappedUserIds = [];

        // 1. Process Workspace Team Members
        foreach ($teamMembers as $tm) {
            $user = $tm->user;
            if (! $user) continue;

            $mappedUserIds[] = $user->id;

            // Find all contributors mapped to this user
            $userContributors = $contributors->filter(function ($c) use ($user) {
                return $c->mapping && $c->mapping->user_id === $user->id;
            });

            $contributorIds = $userContributors->pluck('id')->toArray();

            // Total commits for this member
            $commitsQuery = GitHubCommit::where('github_repository_id', $repo->id)
                ->whereIn('github_contributor_id', $contributorIds);

            $commitsCount = count($contributorIds) > 0 ? (clone $commitsQuery)->count() : 0;
            $additions = count($contributorIds) > 0 ? (clone $commitsQuery)->sum('stats_additions') : 0;
            $deletions = count($contributorIds) > 0 ? (clone $commitsQuery)->sum('stats_deletions') : 0;

            // Active days (distinct dates where member committed)
            $activeDays = 0;
            if (count($contributorIds) > 0) {
                $activeDays = (clone $commitsQuery)
                    ->whereNotNull('author_date')
                    ->selectRaw(DB::getDriverName() === 'sqlite' ? 'substr(author_date, 1, 10) as cdate' : 'date(author_date) as cdate')
                    ->distinct()
                    ->pluck('cdate')
                    ->count();
            }

            // Branches participated in
            $branchesParticipated = [];
            if (count($contributorIds) > 0) {
                $allBranches = (clone $commitsQuery)->pluck('branches')->flatten()->filter()->unique()->values()->all();
                $branchesParticipated = $allBranches;
            }

            // PRs created & reviews
            $prsCreated = 0;
            $reviewsCount = 0;
            if (count($contributorIds) > 0) {
                $prsCreated = GitHubPullRequest::where('github_repository_id', $repo->id)
                    ->whereIn('github_contributor_id', $contributorIds)
                    ->count();

                $reviewsCount = GitHubReview::whereHas('pullRequest', fn ($q) => $q->where('github_repository_id', $repo->id))
                    ->whereIn('github_contributor_id', $contributorIds)
                    ->count();
            }

            // Last activity
            $lastCommit = count($contributorIds) > 0
                ? (clone $commitsQuery)->latest('author_date')->first()
                : null;

            $primaryContributor = $userContributors->first();

            $memberAnalytics[] = [
                'user_id' => $user->id,
                'team_member_id' => $tm->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'role' => $tm->role_name ?? ($tm->permission === 'leader' ? 'Leader' : 'Anggota'),
                'is_mapped' => ! empty($userContributors->isNotEmpty()),
                'github_login' => $primaryContributor?->login,
                'github_avatar' => $primaryContributor?->avatar_url,
                'mapping_type' => $primaryContributor?->mapping?->mapping_type ?? 'unmapped',
                'confidence' => $primaryContributor?->mapping?->confidence ?? 'none',
                'mapping_id' => $primaryContributor?->mapping?->id,
                'total_commits' => $commitsCount,
                'total_additions' => $additions,
                'total_deletions' => $deletions,
                'active_days' => $activeDays,
                'branches' => $branchesParticipated,
                'prs_created' => $prsCreated,
                'reviews_given' => $reviewsCount,
                'last_activity' => $lastCommit?->author_date?->toIso8601String(),
                'recent_timeline' => $this->getMemberCommitTimeline($repo, $contributorIds, 14),
            ];
        }

        // 2. Unmapped Contributors (Visible in analytics as required by spec)
        $unmappedContributors = $contributors->filter(function ($c) {
            return ! $c->mapping || ! $c->mapping->user_id;
        });

        $unmappedList = [];
        foreach ($unmappedContributors as $c) {
            $commitsCount = GitHubCommit::where('github_repository_id', $repo->id)
                ->where('github_contributor_id', $c->id)
                ->count();

            $activeDays = GitHubCommit::where('github_repository_id', $repo->id)
                ->where('github_contributor_id', $c->id)
                ->whereNotNull('author_date')
                ->selectRaw(DB::getDriverName() === 'sqlite' ? 'substr(author_date, 1, 10) as cdate' : 'date(author_date) as cdate')
                ->distinct()
                ->pluck('cdate')
                ->count();

            $unmappedList[] = [
                'contributor_id' => $c->id,
                'login' => $c->login,
                'name' => $c->name ?: ($c->login ?? 'Kontributor Anonim'),
                'email' => $c->email,
                'avatar' => $c->avatar_url,
                'is_mapped' => false,
                'mapping_id' => $c->mapping?->id,
                'total_commits' => $commitsCount,
                'total_additions' => $c->total_additions,
                'total_deletions' => $c->total_deletions,
                'active_days' => $activeDays,
                'last_activity' => $c->last_commit_at?->toIso8601String(),
            ];
        }

        return [
            'members' => $memberAnalytics,
            'unmapped' => $unmappedList,
            'summary' => [
                'total_members' => count($memberAnalytics),
                'mapped_members' => count(array_filter($memberAnalytics, fn ($m) => $m['is_mapped'])),
                'unmapped_contributors_count' => count($unmappedList),
            ],
        ];
    }

    /**
     * Compute branch-specific metrics.
     */
    public function getBranchAnalytics(GitHubRepository $repo): Collection
    {
        $branches = GitHubBranch::where('github_repository_id', $repo->id)
            ->orderBy('is_default', 'desc')
            ->orderBy('is_deleted', 'asc')
            ->orderBy('name', 'asc')
            ->get();

        return $branches->map(function ($branch) use ($repo) {
            // In SQLite and MySQL, JSON array search
            $commitsQuery = GitHubCommit::where('github_repository_id', $repo->id)
                ->where(function ($q) use ($branch) {
                    $q->whereJsonContains('branches', $branch->name)
                      ->orWhere('sha', $branch->sha);
                });

            $commitCount = (clone $commitsQuery)->count();
            $contributorsCount = (clone $commitsQuery)->distinct('github_contributor_id')->count('github_contributor_id');
            $latestCommit = (clone $commitsQuery)->latest('author_date')->first();

            // Associated PRs
            $relatedPrs = GitHubPullRequest::where('github_repository_id', $repo->id)
                ->where(function ($q) use ($branch) {
                    $q->where('head_branch', $branch->name)
                      ->orWhere('base_branch', $branch->name);
                })
                ->select(['id', 'number', 'title', 'state', 'is_merged'])
                ->take(3)
                ->get();

            // Status: 'default', 'active', 'merged', 'stale', 'deleted'
            $status = 'active';
            if ($branch->is_deleted) {
                $status = 'deleted';
            } elseif ($branch->is_default) {
                $status = 'default';
            } elseif ($latestCommit && $latestCommit->author_date < Carbon::now()->subDays(60)) {
                $status = 'stale';
            }

            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'sha' => $branch->sha ? substr($branch->sha, 0, 7) : null,
                'full_sha' => $branch->sha,
                'is_default' => $branch->is_default,
                'is_protected' => $branch->is_protected,
                'is_deleted' => $branch->is_deleted,
                'status' => $status,
                'commit_count' => $commitCount,
                'contributors_count' => $contributorsCount,
                'latest_commit' => $latestCommit ? [
                    'sha' => substr($latestCommit->sha, 0, 7),
                    'message' => $latestCommit->message,
                    'author_name' => $latestCommit->author_name,
                    'author_date' => $latestCommit->author_date?->toIso8601String(),
                ] : null,
                'last_activity' => $latestCommit?->author_date?->toIso8601String() ?: $branch->last_commit_at?->toIso8601String(),
                'related_prs' => $relatedPrs,
            ];
        });
    }

    /**
     * Unified chronological activity timeline across commits, PRs, and reviews.
     */
    public function getActivityTimeline(GitHubRepository $repo, int $perPage = 30, int $page = 1): array
    {
        $offset = ($page - 1) * $perPage;

        // Fetch recent commits
        $commits = GitHubCommit::where('github_repository_id', $repo->id)
            ->with('contributor.mapping.user')
            ->orderBy('author_date', 'desc')
            ->skip($offset)
            ->take($perPage)
            ->get()
            ->map(function ($c) {
                return [
                    'id' => "commit_{$c->id}",
                    'type' => 'commit',
                    'timestamp' => $c->author_date?->toIso8601String() ?: $c->created_at->toIso8601String(),
                    'sha' => substr($c->sha, 0, 7),
                    'full_sha' => $c->sha,
                    'title' => strtok($c->message, "\n"),
                    'message' => $c->message,
                    'html_url' => $c->html_url,
                    'author_name' => $c->author_name,
                    'author_email' => $c->author_email,
                    'avatar_url' => $c->contributor?->avatar_url,
                    'user' => $c->contributor?->mapping?->user ? [
                        'id' => $c->contributor->mapping->user->id,
                        'name' => $c->contributor->mapping->user->name,
                        'avatar' => $c->contributor->mapping->user->avatar,
                    ] : null,
                    'branches' => $c->branches,
                    'stats' => [
                        'additions' => $c->stats_additions,
                        'deletions' => $c->stats_deletions,
                    ],
                ];
            });

        // Fetch recent pull requests
        $prs = GitHubPullRequest::where('github_repository_id', $repo->id)
            ->with('contributor.mapping.user')
            ->orderBy('created_at_gh', 'desc')
            ->skip($offset)
            ->take($perPage)
            ->get()
            ->map(function ($pr) {
                return [
                    'id' => "pr_{$pr->id}",
                    'type' => 'pull_request',
                    'timestamp' => $pr->created_at_gh?->toIso8601String() ?: $pr->created_at->toIso8601String(),
                    'number' => $pr->number,
                    'title' => $pr->title,
                    'state' => $pr->state,
                    'is_merged' => $pr->is_merged,
                    'html_url' => $pr->html_url,
                    'author_name' => $pr->user_login,
                    'avatar_url' => $pr->contributor?->avatar_url,
                    'user' => $pr->contributor?->mapping?->user ? [
                        'id' => $pr->contributor->mapping->user->id,
                        'name' => $pr->contributor->mapping->user->name,
                        'avatar' => $pr->contributor->mapping->user->avatar,
                    ] : null,
                    'branch' => "{$pr->head_branch} -> {$pr->base_branch}",
                    'comments_count' => $pr->comments_count + $pr->review_comments_count,
                ];
            });

        // Merge, sort, and slice
        $merged = $commits->concat($prs)
            ->sortByDesc('timestamp')
            ->values()
            ->slice(0, $perPage)
            ->all();

        return [
            'data' => $merged,
            'page' => $page,
            'per_page' => $perPage,
        ];
    }

    /**
     * Generate daily commit trends for the past N days.
     */
    protected function getDailyCommitTrend(GitHubRepository $repo, int $days = 30): array
    {
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();
        $dateColumn = DB::getDriverName() === 'sqlite' ? 'substr(author_date, 1, 10)' : 'date(author_date)';

        $counts = GitHubCommit::where('github_repository_id', $repo->id)
            ->where('author_date', '>=', $startDate)
            ->selectRaw("{$dateColumn} as cdate, count(*) as count, coalesce(sum(stats_additions), 0) as additions, coalesce(sum(stats_deletions), 0) as deletions")
            ->groupBy('cdate')
            ->pluck('count', 'cdate')
            ->all();

        $trend = [];
        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::now()->subDays($days - 1 - $i)->format('Y-m-d');
            $trend[] = [
                'date' => $date,
                'label' => Carbon::parse($date)->format('d M'),
                'commits' => $counts[$date] ?? 0,
            ];
        }

        return $trend;
    }

    /**
     * Generate GitHub-style contribution heatmap matrix.
     */
    protected function getContributionHeatmap(GitHubRepository $repo, int $days = 365): array
    {
        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();
        $dateColumn = DB::getDriverName() === 'sqlite' ? 'substr(author_date, 1, 10)' : 'date(author_date)';

        $commitCounts = GitHubCommit::where('github_repository_id', $repo->id)
            ->where('author_date', '>=', $startDate)
            ->selectRaw("{$dateColumn} as cdate, count(*) as count")
            ->groupBy('cdate')
            ->pluck('count', 'cdate')
            ->all();

        $maxCommits = ! empty($commitCounts) ? max($commitCounts) : 1;

        $matrix = [];
        for ($i = 0; $i < $days; $i++) {
            $dateObj = Carbon::now()->subDays($days - 1 - $i);
            $dateStr = $dateObj->format('Y-m-d');
            $count = $commitCounts[$dateStr] ?? 0;

            // Determine level 0 to 4
            $level = 0;
            if ($count > 0) {
                if ($count >= ($maxCommits * 0.75) || $count >= 8) {
                    $level = 4;
                } elseif ($count >= ($maxCommits * 0.5) || $count >= 5) {
                    $level = 3;
                } elseif ($count >= ($maxCommits * 0.25) || $count >= 2) {
                    $level = 2;
                } else {
                    $level = 1;
                }
            }

            $matrix[] = [
                'date' => $dateStr,
                'count' => $count,
                'level' => $level,
                'day_of_week' => $dateObj->dayOfWeek,
            ];
        }

        return [
            'days' => $matrix,
            'total_active_days' => count(array_filter($matrix, fn ($d) => $d['count'] > 0)),
            'total_commits' => array_sum(array_column($matrix, 'count')),
        ];
    }

    protected function getTopContributors(GitHubRepository $repo, int $limit = 5): array
    {
        return GitHubContributor::where('github_repository_id', $repo->id)
            ->with(['mapping.user'])
            ->orderBy('total_commits', 'desc')
            ->take($limit)
            ->get()
            ->map(function ($c) {
                return [
                    'id' => $c->id,
                    'name' => $c->mapping?->user?->name ?: ($c->name ?: $c->login),
                    'login' => $c->login,
                    'avatar' => $c->mapping?->user?->avatar ?: $c->avatar_url,
                    'commits' => $c->total_commits,
                    'is_mapped' => $c->mapping && $c->mapping->user_id,
                ];
            })
            ->all();
    }

    protected function getMemberCommitTimeline(GitHubRepository $repo, array $contributorIds, int $days = 14): array
    {
        if (empty($contributorIds)) return [];

        $startDate = Carbon::now()->subDays($days - 1)->startOfDay();
        $dateColumn = DB::getDriverName() === 'sqlite' ? 'substr(author_date, 1, 10)' : 'date(author_date)';

        $counts = GitHubCommit::where('github_repository_id', $repo->id)
            ->whereIn('github_contributor_id', $contributorIds)
            ->where('author_date', '>=', $startDate)
            ->selectRaw("{$dateColumn} as cdate, count(*) as count")
            ->groupBy('cdate')
            ->pluck('count', 'cdate')
            ->all();

        $timeline = [];
        for ($i = 0; $i < $days; $i++) {
            $date = Carbon::now()->subDays($days - 1 - $i)->format('Y-m-d');
            $timeline[] = [
                'date' => $date,
                'commits' => $counts[$date] ?? 0,
            ];
        }

        return $timeline;
    }
}
