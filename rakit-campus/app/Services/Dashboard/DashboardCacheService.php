<?php

namespace App\Services\Dashboard;

use App\Enums\TaskStatus;
use App\Models\ActivityLog;
use App\Models\Competition;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Collection;

/**
 * Encapsulates heavy, cacheable dashboard data fetching.
 *
 * SRP: this class owns cache-key management and data retrieval for dashboard views.
 * OCP: add new methods per view-type; don't modify existing ones.
 */
class DashboardCacheService
{
    private const TTL_GUEST    = 300;  // 5 min  — public guest data changes rarely
    private const TTL_ADMIN    = 120;  // 2 min  — admin counts can be slightly stale
    private const TTL_MONTHLY  = 3600; // 1 hour — monthly chart doesn't need realtime
    private const TTL_COMPETE  = 300;  // 5 min  — upcoming competitions

    // -------------------------------------------------------------------------
    // Guest dashboard (all unauthenticated visits share the same cache)
    // -------------------------------------------------------------------------

    /**
     * @return array{monthlyActivity: Collection, stats: array, upcomingCompetitions: Collection}
     */
    public function guestGlobalStats(): array
    {
        return Cache::remember('dashboard.guest.global_stats', self::TTL_GUEST, function () {
            $completedTasksCount = Task::where('status', TaskStatus::Completed)->count();
            $pendingTasksCount   = Task::where('status', '!=', TaskStatus::Completed)->count();

            return [
                'completed_tasks_count'     => $completedTasksCount,
                'pending_tasks_count'       => $pendingTasksCount,
                'my_teams_count'            => Team::where('type', '!=', 'competition')->count(),
                'recommended_matches_count' => \App\Models\Project::where('status', 'recruiting')->count(),
                'total_students_count'      => User::count(),
                'total_guided_projects_count' => \App\Models\Project::count(),
            ];
        });
    }

    /**
     * Monthly platform-wide activity — cached 1 hour (chart data).
     */
    public function guestMonthlyActivity(): Collection
    {
        return Cache::remember('dashboard.guest.monthly_activity', self::TTL_MONTHLY, function () {
            $result = collect();
            for ($i = 5; $i >= 0; $i--) {
                $monthDate  = now()->subMonths($i);
                $monthLabel = $monthDate->translatedFormat('M');

                $tasksDone = Task::where('status', TaskStatus::Completed)
                    ->whereYear('updated_at', $monthDate->year)
                    ->whereMonth('updated_at', $monthDate->month)
                    ->count();

                $logs = ActivityLog::whereYear('created_at', $monthDate->year)
                    ->whereMonth('created_at', $monthDate->month)
                    ->count();

                $val = max(15, min(95, ($tasksDone * 15) + ($logs * 8)));

                $result->push([
                    'month'      => $monthLabel,
                    'done_tasks' => $tasksDone,
                    'logs'       => $logs,
                    'percent'    => $val,
                ]);
            }
            return $result;
        });
    }

    /**
     * Upcoming competitions — shared across all dashboard views.
     */
    public function upcomingCompetitions(): Collection
    {
        return Cache::remember('dashboard.upcoming_competitions', self::TTL_COMPETE, function () {
            return Competition::whereIn('status', ['open', 'upcoming'])
                ->latest('registration_deadline')
                ->take(3)
                ->get()
                ->map(fn ($c) => [
                    'id'                    => $c->id,
                    'name'                  => $c->name,
                    'slug'                  => $c->slug,
                    'organizer'             => $c->organizer,
                    'registration_deadline' => $c->registration_deadline?->translatedFormat('d M Y') ?? 'Segera',
                    'status'                => is_object($c->status) ? ($c->status->value ?? 'open') : ($c->status ?? 'open'),
                    'category'              => $c->category ?? 'Umum',
                ]);
        });
    }

    // -------------------------------------------------------------------------
    // Admin dashboard — per-campus cache
    // -------------------------------------------------------------------------

    /**
     * Admin aggregate counts — keyed per campus so multi-campus setups are correct.
     *
     * @return array<string,int>
     */
    public function adminStats(int $campusId): array
    {
        return Cache::remember("dashboard.admin.stats.{$campusId}", self::TTL_ADMIN, function () use ($campusId) {
            return \App\Models\CampusMembership::selectRaw("
                COUNT(*) as total_members,
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as total_students,
                SUM(CASE WHEN role = 'student' AND verification_status = 'verified' THEN 1 ELSE 0 END) as verified_students,
                SUM(CASE WHEN role = 'student' AND verification_status = 'pending' THEN 1 ELSE 0 END) as unverified_students,
                SUM(CASE WHEN role = 'lecturer' THEN 1 ELSE 0 END) as total_lecturers
            ")
            ->where('campus_id', $campusId)
            ->first()
            ->toArray()
            + [
                'active_projects'    => \App\Models\Project::where('status', '!=', 'completed')->count(),
                'completed_projects' => \App\Models\Project::where('status', 'completed')->count(),
                'active_competitions'=> Competition::whereIn('status', ['open', 'upcoming'])->count(),
                'total_teams'        => Team::count(),
            ];
        });
    }

    // -------------------------------------------------------------------------
    // Per-student monthly activity (keyed by user id + current month)
    // -------------------------------------------------------------------------

    /**
     * Student's own 6-month activity chart — 1 hour TTL.
     * Invalidate on task completion: Cache::forget("dashboard.student.monthly.{$userId}.*")
     */
    public function studentMonthlyActivity(int $userId, \Illuminate\Support\Collection $teamIds): Collection
    {
        $cacheKey = 'dashboard.student.monthly.' . $userId . '.' . now()->format('Y-m');

        return Cache::remember($cacheKey, self::TTL_MONTHLY, function () use ($userId, $teamIds) {
            $result = collect();
            for ($i = 5; $i >= 0; $i--) {
                $monthDate  = now()->subMonths($i);
                $monthLabel = $monthDate->translatedFormat('M');

                $tasksDone = Task::where('assignee_id', $userId)
                    ->where('status', TaskStatus::Completed)
                    ->whereYear('updated_at', $monthDate->year)
                    ->whereMonth('updated_at', $monthDate->month)
                    ->count();

                $logs = ActivityLog::where(function ($q) use ($userId, $teamIds) {
                    $q->where('actor_id', $userId);
                    if ($teamIds->isNotEmpty()) {
                        $q->orWhereIn('team_id', $teamIds);
                    }
                })
                ->whereYear('created_at', $monthDate->year)
                ->whereMonth('created_at', $monthDate->month)
                ->count();

                $val = ($tasksDone === 0 && $logs === 0) ? 0 : min(100, ($tasksDone * 20) + ($logs * 10));

                $result->push([
                    'month'      => $monthLabel,
                    'done_tasks' => $tasksDone,
                    'logs'       => $logs,
                    'percent'    => $val,
                ]);
            }
            return $result;
        });
    }

    // -------------------------------------------------------------------------
    // Cache invalidation helpers
    // -------------------------------------------------------------------------

    public function invalidateGuestCache(): void
    {
        Cache::forget('dashboard.guest.global_stats');
        Cache::forget('dashboard.guest.monthly_activity');
        Cache::forget('dashboard.upcoming_competitions');
    }

    public function invalidateAdminCache(int $campusId): void
    {
        Cache::forget("dashboard.admin.stats.{$campusId}");
    }

    public function invalidateStudentMonthlyCache(int $userId): void
    {
        Cache::forget('dashboard.student.monthly.' . $userId . '.' . now()->format('Y-m'));
    }
}
