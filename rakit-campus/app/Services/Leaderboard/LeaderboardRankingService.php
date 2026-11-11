<?php

namespace App\Services\Leaderboard;

use App\Models\LeaderboardSnapshot;
use App\Models\PointTransaction;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LeaderboardRankingService
{
    /**
     * Get date boundary for given period.
     */
    public static function getPeriodDates(string $period): array
    {
        $now = Carbon::now();

        return match ($period) {
            'weekly' => [
                'start' => $now->copy()->subDays(7)->startOfDay(),
                'end' => $now->copy()->endOfDay(),
                'label' => '7 Hari Terakhir',
                'key' => $now->format('Y') . '-W' . $now->weekOfYear,
            ],
            'monthly' => [
                'start' => $now->copy()->startOfMonth(),
                'end' => $now->copy()->endOfMonth(),
                'label' => 'Bulan Ini (' . $now->translatedFormat('F Y') . ')',
                'key' => $now->format('Y-m'),
            ],
            default => [
                'start' => null,
                'end' => null,
                'label' => 'Semua Waktu (All-Time)',
                'key' => 'all_time',
            ],
        };
    }

    /**
     * Get Overall Student Leaderboard.
     */
    public static function getOverallLeaderboard(string $period = 'all_time', ?User $currentUser = null, int $limit = 50): array
    {
        $dates = self::getPeriodDates($period);

        $query = PointTransaction::query()
            ->where('verification_status', 'verified')
            ->whereNotNull('user_id');

        if ($dates['start']) {
            $query->where('created_at', '>=', $dates['start']);
        }

        $scores = $query->select([
            'user_id',
            DB::raw('SUM(points) as total_points'),
            DB::raw("SUM(CASE WHEN hub = 'project' THEN points ELSE 0 END) as project_points"),
            DB::raw("SUM(CASE WHEN hub = 'competition' THEN points ELSE 0 END) as competition_points"),
            DB::raw("COUNT(DISTINCT id) as total_activities"),
            DB::raw('MAX(created_at) as last_activity_at'),
        ])
            ->groupBy('user_id')
            ->having('total_points', '>', 0)
            ->orderByDesc('total_points')
            ->orderByDesc('last_activity_at')
            ->get();

        $userIds = $scores->pluck('user_id')->all();
        $users = User::with(['profile', 'campusMemberships.campus'])
            ->whereIn('id', $userIds)
            ->get()
            ->keyBy('id');

        $rankedList = [];
        $currentUserData = null;
        $prevPoints = null;
        $currentRank = 0;
        $displayRank = 0;

        foreach ($scores as $index => $score) {
            $currentRank++;
            if ($prevPoints !== $score->total_points) {
                $displayRank = $currentRank;
                $prevPoints = $score->total_points;
            }

            $user = $users->get($score->user_id);
            if (!$user) {
                continue;
            }

            $totalPts = (int) $score->total_points;
            $projPts = (int) $score->project_points;
            $compPts = (int) $score->competition_points;

            // Generate title badge
            $badge = self::determineUserBadge($totalPts, $compPts, $projPts);

            // Previous rank & movement from snapshot
            $rankChange = self::calculateRankChange('overall_student', $period, 'user', $user->id, $displayRank);

            $entry = [
                'rank' => $displayRank,
                'rank_change' => $rankChange,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'campus_name' => $user->campusMemberships->first()?->campus?->name ?? 'Mahasiswa',
                    'major' => $user->profile?->major ?? 'Informatika',
                    'is_current_user' => $currentUser && $currentUser->id === $user->id,
                ],
                'points' => $totalPts,
                'project_points' => $projPts,
                'competition_points' => $compPts,
                'total_activities' => (int) $score->total_activities,
                'last_activity_at' => $score->last_activity_at,
                'badge' => $badge,
            ];

            if ($currentUser && $currentUser->id === $user->id) {
                $currentUserData = $entry;
            }

            if (count($rankedList) < $limit) {
                $rankedList[] = $entry;
            }
        }

        // If current user is not in top limit, calculate contextual gap
        $userContext = null;
        if ($currentUser) {
            if (!$currentUserData) {
                // User has 0 points or hasn't earned yet
                $userContext = [
                    'rank' => count($scores) + 1,
                    'points' => 0,
                    'project_points' => 0,
                    'competition_points' => 0,
                    'points_to_next' => $rankedList ? end($rankedList)['points'] : 50,
                    'next_target_rank' => count($rankedList),
                    'is_ranked' => false,
                ];
            } else {
                // Find next player above current user
                $currentRankIndex = $currentUserData['rank'];
                $playerAbove = null;
                foreach ($rankedList as $r) {
                    if ($r['rank'] < $currentRankIndex) {
                        $playerAbove = $r;
                    }
                }

                $pointsToNext = $playerAbove ? max(1, $playerAbove['points'] - $currentUserData['points']) : 0;

                $userContext = array_merge($currentUserData, [
                    'points_to_next' => $pointsToNext,
                    'next_target_rank' => $playerAbove ? $playerAbove['rank'] : 1,
                    'is_ranked' => true,
                ]);
            }
        }

        return [
            'period' => $period,
            'period_label' => $dates['label'],
            'top_three' => array_slice($rankedList, 0, 3),
            'rankings' => $rankedList,
            'total_participants' => $scores->count(),
            'current_user_context' => $userContext,
        ];
    }

    /**
     * Get Project Hub Leaderboard:
     * - 'projects': Projects ranking
     * - 'contributors': Individual contributors ranking
     */
    public static function getProjectLeaderboard(string $subType = 'projects', string $period = 'all_time', ?User $currentUser = null, int $limit = 50): array
    {
        $dates = self::getPeriodDates($period);

        if ($subType === 'contributors') {
            return self::getProjectContributorsRanking($dates, $period, $currentUser, $limit);
        }

        return self::getProjectsRanking($dates, $period, $currentUser, $limit);
    }

    /**
     * Project Ranking calculation.
     */
    protected static function getProjectsRanking(array $dates, string $period, ?User $currentUser, int $limit): array
    {
        $query = PointTransaction::query()
            ->where('verification_status', 'verified')
            ->where('hub', 'project')
            ->whereNotNull('project_id');

        if ($dates['start']) {
            $query->where('created_at', '>=', $dates['start']);
        }

        $scores = $query->select([
            'project_id',
            DB::raw('SUM(points) as total_points'),
            DB::raw('COUNT(DISTINCT id) as total_activities'),
            DB::raw('MAX(created_at) as last_activity_at'),
        ])
            ->groupBy('project_id')
            ->having('total_points', '>', 0)
            ->orderByDesc('total_points')
            ->orderByDesc('last_activity_at')
            ->get();

        $projectIds = $scores->pluck('project_id')->all();
        $projects = Project::with(['team.members.user', 'academicClass', 'campus'])
            ->whereIn('id', $projectIds)
            ->get()
            ->keyBy('id');

        $rankedList = [];
        $currentRank = 0;
        $prevPoints = null;
        $displayRank = 0;
        $currentUserProjectEntry = null;

        foreach ($scores as $score) {
            $currentRank++;
            if ($prevPoints !== $score->total_points) {
                $displayRank = $currentRank;
                $prevPoints = $score->total_points;
            }

            $project = $projects->get($score->project_id);
            if (!$project) {
                continue;
            }

            $isMember = $currentUser && $project->team && $project->team->hasMember($currentUser);
            $rankChange = self::calculateRankChange('project_team', $period, 'project', $project->id, $displayRank);

            $entry = [
                'rank' => $displayRank,
                'rank_change' => $rankChange,
                'project' => [
                    'id' => $project->id,
                    'title' => $project->title,
                    'slug' => $project->slug,
                    'category' => $project->category,
                    'status' => $project->status?->value ?? $project->status,
                    'progress' => $project->progress ?? 0,
                    'team_name' => $project->team?->name ?? 'Tim Proyek',
                    'members_count' => $project->team?->members?->count() ?? 1,
                    'campus_name' => $project->campus?->name ?? 'Politeknik Negeri Indramayu',
                    'members' => $project->team?->members?->take(4)->map(fn ($m) => [
                        'name' => $m->user?->name,
                        'avatar' => $m->user?->avatar,
                    ]) ?? [],
                ],
                'points' => (int) $score->total_points,
                'total_activities' => (int) $score->total_activities,
                'last_activity_at' => $score->last_activity_at,
                'is_my_project' => $isMember,
            ];

            if ($isMember && !$currentUserProjectEntry) {
                $currentUserProjectEntry = $entry;
            }

            if (count($rankedList) < $limit) {
                $rankedList[] = $entry;
            }
        }

        return [
            'sub_type' => 'projects',
            'period' => $period,
            'period_label' => $dates['label'],
            'top_three' => array_slice($rankedList, 0, 3),
            'rankings' => $rankedList,
            'total_participants' => $scores->count(),
            'current_user_context' => $currentUserProjectEntry,
        ];
    }

    /**
     * Individual Contributor Ranking in Project Hub.
     */
    protected static function getProjectContributorsRanking(array $dates, string $period, ?User $currentUser, int $limit): array
    {
        $query = PointTransaction::query()
            ->where('verification_status', 'verified')
            ->where('hub', 'project')
            ->whereNotNull('user_id');

        if ($dates['start']) {
            $query->where('created_at', '>=', $dates['start']);
        }

        $scores = $query->select([
            'user_id',
            DB::raw('SUM(points) as total_points'),
            DB::raw("COUNT(CASE WHEN activity_type = 'project_task_completed' THEN 1 END) as tasks_completed"),
            DB::raw("COUNT(DISTINCT project_id) as projects_count"),
            DB::raw('MAX(created_at) as last_activity_at'),
        ])
            ->groupBy('user_id')
            ->having('total_points', '>', 0)
            ->orderByDesc('total_points')
            ->orderByDesc('last_activity_at')
            ->get();

        $userIds = $scores->pluck('user_id')->all();
        $users = User::with(['profile', 'campusMemberships.campus'])
            ->whereIn('id', $userIds)
            ->get()
            ->keyBy('id');

        $rankedList = [];
        $currentRank = 0;
        $prevPoints = null;
        $displayRank = 0;
        $currentUserData = null;

        foreach ($scores as $score) {
            $currentRank++;
            if ($prevPoints !== $score->total_points) {
                $displayRank = $currentRank;
                $prevPoints = $score->total_points;
            }

            $user = $users->get($score->user_id);
            if (!$user) {
                continue;
            }

            $rankChange = self::calculateRankChange('project_contributor', $period, 'user', $user->id, $displayRank);

            $entry = [
                'rank' => $displayRank,
                'rank_change' => $rankChange,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'campus_name' => $user->campusMemberships->first()?->campus?->name ?? 'Mahasiswa',
                    'major' => $user->profile?->major ?? 'Informatika',
                    'is_current_user' => $currentUser && $currentUser->id === $user->id,
                ],
                'points' => (int) $score->total_points,
                'tasks_completed' => (int) $score->tasks_completed,
                'projects_count' => (int) $score->projects_count,
                'last_activity_at' => $score->last_activity_at,
            ];

            if ($currentUser && $currentUser->id === $user->id) {
                $currentUserData = $entry;
            }

            if (count($rankedList) < $limit) {
                $rankedList[] = $entry;
            }
        }

        return [
            'sub_type' => 'contributors',
            'period' => $period,
            'period_label' => $dates['label'],
            'top_three' => array_slice($rankedList, 0, 3),
            'rankings' => $rankedList,
            'total_participants' => $scores->count(),
            'current_user_context' => $currentUserData,
        ];
    }

    /**
     * Get Competition Hub Leaderboard:
     * - 'students': Individual student competitors
     * - 'teams': Competition teams
     */
    public static function getCompetitionLeaderboard(string $subType = 'students', string $period = 'all_time', ?User $currentUser = null, int $limit = 50): array
    {
        $dates = self::getPeriodDates($period);

        if ($subType === 'teams') {
            return self::getCompetitionTeamsRanking($dates, $period, $currentUser, $limit);
        }

        return self::getCompetitionStudentsRanking($dates, $period, $currentUser, $limit);
    }

    /**
     * Competition Student Ranking.
     */
    protected static function getCompetitionStudentsRanking(array $dates, string $period, ?User $currentUser, int $limit): array
    {
        $query = PointTransaction::query()
            ->where('verification_status', 'verified')
            ->where('hub', 'competition')
            ->whereNotNull('user_id');

        if ($dates['start']) {
            $query->where('created_at', '>=', $dates['start']);
        }

        $scores = $query->select([
            'user_id',
            DB::raw('SUM(points) as total_points'),
            DB::raw("COUNT(CASE WHEN activity_type IN ('competition_first_place', 'competition_second_place', 'competition_third_place', 'competition_special_award') THEN 1 END) as awards_count"),
            DB::raw("COUNT(CASE WHEN activity_type = 'competition_finalist' THEN 1 END) as finalist_count"),
            DB::raw("COUNT(DISTINCT competition_id) as competitions_count"),
            DB::raw('MAX(created_at) as last_activity_at'),
        ])
            ->groupBy('user_id')
            ->having('total_points', '>', 0)
            ->orderByDesc('total_points')
            ->orderByDesc('last_activity_at')
            ->get();

        $userIds = $scores->pluck('user_id')->all();
        $users = User::with(['profile', 'campusMemberships.campus'])
            ->whereIn('id', $userIds)
            ->get()
            ->keyBy('id');

        $rankedList = [];
        $currentRank = 0;
        $prevPoints = null;
        $displayRank = 0;
        $currentUserData = null;

        foreach ($scores as $score) {
            $currentRank++;
            if ($prevPoints !== $score->total_points) {
                $displayRank = $currentRank;
                $prevPoints = $score->total_points;
            }

            $user = $users->get($score->user_id);
            if (!$user) {
                continue;
            }

            $rankChange = self::calculateRankChange('competition_student', $period, 'user', $user->id, $displayRank);

            $entry = [
                'rank' => $displayRank,
                'rank_change' => $rankChange,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'avatar' => $user->avatar,
                    'campus_name' => $user->campusMemberships->first()?->campus?->name ?? 'Mahasiswa',
                    'major' => $user->profile?->major ?? 'Informatika',
                    'is_current_user' => $currentUser && $currentUser->id === $user->id,
                ],
                'points' => (int) $score->total_points,
                'awards_count' => (int) $score->awards_count,
                'finalist_count' => (int) $score->finalist_count,
                'competitions_count' => (int) $score->competitions_count,
                'last_activity_at' => $score->last_activity_at,
            ];

            if ($currentUser && $currentUser->id === $user->id) {
                $currentUserData = $entry;
            }

            if (count($rankedList) < $limit) {
                $rankedList[] = $entry;
            }
        }

        return [
            'sub_type' => 'students',
            'period' => $period,
            'period_label' => $dates['label'],
            'top_three' => array_slice($rankedList, 0, 3),
            'rankings' => $rankedList,
            'total_participants' => $scores->count(),
            'current_user_context' => $currentUserData,
        ];
    }

    /**
     * Competition Team Ranking.
     */
    protected static function getCompetitionTeamsRanking(array $dates, string $period, ?User $currentUser, int $limit): array
    {
        $query = PointTransaction::query()
            ->where('verification_status', 'verified')
            ->where('hub', 'competition')
            ->whereNotNull('team_id');

        if ($dates['start']) {
            $query->where('created_at', '>=', $dates['start']);
        }

        $scores = $query->select([
            'team_id',
            DB::raw('SUM(points) as total_points'),
            DB::raw('MAX(created_at) as last_activity_at'),
        ])
            ->groupBy('team_id')
            ->having('total_points', '>', 0)
            ->orderByDesc('total_points')
            ->orderByDesc('last_activity_at')
            ->get();

        $teamIds = $scores->pluck('team_id')->all();
        $teams = Team::with(['members.user', 'participations.competition', 'campus'])
            ->whereIn('id', $teamIds)
            ->get()
            ->keyBy('id');

        $rankedList = [];
        $currentRank = 0;
        $prevPoints = null;
        $displayRank = 0;
        $currentUserTeamEntry = null;

        foreach ($scores as $score) {
            $currentRank++;
            if ($prevPoints !== $score->total_points) {
                $displayRank = $currentRank;
                $prevPoints = $score->total_points;
            }

            $team = $teams->get($score->team_id);
            if (!$team) {
                continue;
            }

            $isMember = $currentUser && $team->hasMember($currentUser);
            $part = $team->participations->first();
            $comp = $part?->competition;
            $rankChange = self::calculateRankChange('competition_team', $period, 'team', $team->id, $displayRank);

            $entry = [
                'rank' => $displayRank,
                'rank_change' => $rankChange,
                'team' => [
                    'id' => $team->id,
                    'name' => $team->name,
                    'competition_name' => $comp?->name ?? 'Kompetisi',
                    'competition_level' => $comp?->level ?? 'Nasional',
                    'members_count' => $team->members->count(),
                    'campus_name' => $team->campus?->name ?? 'Politeknik Negeri Indramayu',
                    'members' => $team->members->take(4)->map(fn ($m) => [
                        'name' => $m->user?->name,
                        'avatar' => $m->user?->avatar,
                    ]),
                ],
                'points' => (int) $score->total_points,
                'last_activity_at' => $score->last_activity_at,
                'is_my_team' => $isMember,
            ];

            if ($isMember && !$currentUserTeamEntry) {
                $currentUserTeamEntry = $entry;
            }

            if (count($rankedList) < $limit) {
                $rankedList[] = $entry;
            }
        }

        return [
            'sub_type' => 'teams',
            'period' => $period,
            'period_label' => $dates['label'],
            'top_three' => array_slice($rankedList, 0, 3),
            'rankings' => $rankedList,
            'total_participants' => $scores->count(),
            'current_user_context' => $currentUserTeamEntry,
        ];
    }

    /**
     * Calculate rank change delta (+2, -1, 0, null for NEW).
     */
    protected static function calculateRankChange(string $scope, string $period, string $entityType, int $entityId, int $currentRank): ?int
    {
        $dates = self::getPeriodDates($period);
        $snapshot = LeaderboardSnapshot::where('scope', $scope)
            ->where('period', $period)
            ->where('period_key', $dates['key'])
            ->where('entity_type', $entityType)
            ->where('entity_id', $entityId)
            ->first();

        if (!$snapshot || $snapshot->previous_rank === null) {
            return null; // Signals "NEW"
        }

        // e.g. previous was 5, now is 3 -> +2 spots!
        return (int) ($snapshot->previous_rank - $currentRank);
    }

    /**
     * Determine prestigious badge based on points distribution.
     */
    protected static function determineUserBadge(int $totalPts, int $compPts, int $projPts): array
    {
        if ($compPts >= 1200) {
            return ['name' => '🏆 Global Competitor', 'color' => 'amber'];
        }
        if ($compPts >= 500) {
            return ['name' => '🥇 Hackathon Champion', 'color' => 'blue'];
        }
        if ($projPts >= 500) {
            return ['name' => '🚀 Master Builder', 'color' => 'indigo'];
        }
        if ($totalPts >= 300) {
            return ['name' => '⭐ Core Contributor', 'color' => 'emerald'];
        }
        return ['name' => '🌱 Rising Star', 'color' => 'slate'];
    }

    /**
     * Persist current rankings into snapshots table.
     */
    public static function syncSnapshots(): void
    {
        $periods = ['all_time', 'monthly', 'weekly'];

        foreach ($periods as $period) {
            $dates = self::getPeriodDates($period);

            // 1. Overall Student Snapshots
            $overall = self::getOverallLeaderboard($period, null, 200);
            foreach ($overall['rankings'] as $item) {
                self::persistSnapshot('overall_student', $period, $dates['key'], 'user', $item['user']['id'], $item['points'], $item['rank']);
            }

            // 2. Project Team Snapshots
            $projTeams = self::getProjectLeaderboard('projects', $period, null, 200);
            foreach ($projTeams['rankings'] as $item) {
                self::persistSnapshot('project_team', $period, $dates['key'], 'project', $item['project']['id'], $item['points'], $item['rank']);
            }

            // 3. Project Contributor Snapshots
            $projContributors = self::getProjectLeaderboard('contributors', $period, null, 200);
            foreach ($projContributors['rankings'] as $item) {
                self::persistSnapshot('project_contributor', $period, $dates['key'], 'user', $item['user']['id'], $item['points'], $item['rank']);
            }

            // 4. Competition Student Snapshots
            $compStudents = self::getCompetitionLeaderboard('students', $period, null, 200);
            foreach ($compStudents['rankings'] as $item) {
                self::persistSnapshot('competition_student', $period, $dates['key'], 'user', $item['user']['id'], $item['points'], $item['rank']);
            }

            // 5. Competition Team Snapshots
            $compTeams = self::getCompetitionLeaderboard('teams', $period, null, 200);
            foreach ($compTeams['rankings'] as $item) {
                self::persistSnapshot('competition_team', $period, $dates['key'], 'team', $item['team']['id'], $item['points'], $item['rank']);
            }
        }
    }

    /**
     * Helper to write a single snapshot record.
     */
    protected static function persistSnapshot(
        string $scope,
        string $period,
        string $periodKey,
        string $entityType,
        int $entityId,
        int $points,
        int $currentRank
    ): void {
        $existing = LeaderboardSnapshot::where([
            'scope' => $scope,
            'period' => $period,
            'period_key' => $periodKey,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
        ])->first();

        $previousRank = $existing ? ($existing->current_rank ?: $currentRank) : null;
        $rankChange = $previousRank !== null ? ($previousRank - $currentRank) : 0;

        LeaderboardSnapshot::updateOrCreate(
            [
                'scope' => $scope,
                'period' => $period,
                'period_key' => $periodKey,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
            ],
            [
                'points' => $points,
                'current_rank' => $currentRank,
                'previous_rank' => $previousRank,
                'rank_change' => $rankChange,
                'calculated_at' => now(),
            ]
        );
    }
}
