<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\LeaderboardAuditLog;
use App\Models\LeaderboardPointRule;
use App\Models\PointTransaction;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use App\Services\Leaderboard\LeaderboardRankingService;
use App\Services\Leaderboard\LeaderboardScoringService;
use App\Services\Leaderboard\LeaderboardSeedService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardWebController extends Controller
{
    /**
     * Display the continuous leaderboard across RAKIT Campus.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $hub = $request->query('hub', 'overall'); // overall|project|competition
        $period = $request->query('period', 'all_time'); // all_time|monthly|weekly
        $subType = $request->query('sub_type'); // projects|contributors or students|teams
        $search = trim((string) $request->query('search', ''));

        if (!in_array($hub, ['overall', 'project', 'competition'])) {
            $hub = 'overall';
        }
        if (!in_array($period, ['all_time', 'monthly', 'weekly'])) {
            $period = 'all_time';
        }

        // Default sub-types per hub
        if ($hub === 'project' && !in_array($subType, ['projects', 'contributors'])) {
            $subType = 'projects';
        } elseif ($hub === 'competition' && !in_array($subType, ['students', 'teams'])) {
            $subType = 'students';
        }

        // Fetch leaderboard data based on active hub & sub-type
        $leaderboardData = match ($hub) {
            'project' => LeaderboardRankingService::getProjectLeaderboard($subType, $period, $user, 100),
            'competition' => LeaderboardRankingService::getCompetitionLeaderboard($subType, $period, $user, 100),
            default => LeaderboardRankingService::getOverallLeaderboard($period, $user, 100),
        };

        // Filter by search query if present
        if (!empty($search)) {
            $searchLower = strtolower($search);
            $leaderboardData['rankings'] = array_values(array_filter($leaderboardData['rankings'], function ($item) use ($searchLower, $hub, $subType) {
                if ($hub === 'project' && $subType === 'projects') {
                    return str_contains(strtolower($item['project']['title'] ?? ''), $searchLower)
                        || str_contains(strtolower($item['project']['team_name'] ?? ''), $searchLower);
                }
                if ($hub === 'competition' && $subType === 'teams') {
                    return str_contains(strtolower($item['team']['name'] ?? ''), $searchLower)
                        || str_contains(strtolower($item['team']['competition_name'] ?? ''), $searchLower);
                }
                return str_contains(strtolower($item['user']['name'] ?? ''), $searchLower)
                    || str_contains(strtolower($item['user']['campus_name'] ?? ''), $searchLower)
                    || str_contains(strtolower($item['user']['major'] ?? ''), $searchLower);
            }));
            $leaderboardData['top_three'] = array_slice($leaderboardData['rankings'], 0, 3);
        }

        $rules = LeaderboardPointRule::where('is_active', true)->get();
        $canManage = $user && ($user->isPlatformAdmin() || $user->isCampusAdmin());

        return Inertia::render('leaderboard/index', [
            'activeHub' => $hub,
            'activePeriod' => $period,
            'activeSubType' => $subType,
            'searchQuery' => $search,
            'leaderboard' => $leaderboardData,
            'rules' => $rules,
            'canManage' => $canManage,
        ]);
    }

    /**
     * Shortcut for Project Hub Leaderboard.
     */
    public function projectIndex(Request $request): RedirectResponse
    {
        return redirect()->route('leaderboard.index', array_merge($request->query(), ['hub' => 'project']));
    }

    /**
     * Shortcut for Competition Hub Leaderboard.
     */
    public function competitionIndex(Request $request): RedirectResponse
    {
        return redirect()->route('leaderboard.index', array_merge($request->query(), ['hub' => 'competition']));
    }

    /**
     * Admin Leaderboard Management view.
     */
    public function adminIndex(Request $request): Response
    {
        $user = $request->user();
        if (!$user || (!$user->isPlatformAdmin() && !$user->isCampusAdmin())) {
            abort(403, 'Akses terbatas untuk administrator platform/kampus.');
        }

        $rules = LeaderboardPointRule::orderBy('hub')->orderBy('activity_type')->get();
        $auditLogs = LeaderboardAuditLog::with('admin:id,name,email')->latest()->take(30)->get();
        $recentTransactions = PointTransaction::with(['user:id,name,email', 'team:id,name', 'project:id,title', 'competition:id,name'])
            ->latest()
            ->take(50)
            ->get();

        $students = User::select('id', 'name', 'email')->orderBy('name')->take(200)->get();
        $teams = Team::select('id', 'name')->orderBy('name')->take(100)->get();
        $projects = Project::select('id', 'title')->orderBy('title')->take(100)->get();

        return Inertia::render('leaderboard/admin', [
            'rules' => $rules,
            'auditLogs' => $auditLogs,
            'recentTransactions' => $recentTransactions,
            'students' => $students,
            'teams' => $teams,
            'projects' => $projects,
        ]);
    }

    /**
     * Admin: Update a scoring rule.
     */
    public function updateRule(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isPlatformAdmin() && !$user->isCampusAdmin())) {
            abort(403);
        }

        $rule = LeaderboardPointRule::findOrFail($id);

        $validated = $request->validate([
            'base_points' => 'required|integer|min:0|max:10000',
            'is_active' => 'required|boolean',
        ]);

        $oldPoints = $rule->base_points;
        $rule->update($validated);

        LeaderboardAuditLog::create([
            'admin_id' => $user->id,
            'action' => 'update_rule',
            'target_type' => 'rule',
            'target_id' => $rule->id,
            'reason' => "Mengubah base point dari {$oldPoints} menjadi {$rule->base_points} (Status aktif: " . ($rule->is_active ? 'Ya' : 'Tidak') . ')',
            'details' => ['rule' => $rule->activity_type, 'old' => $oldPoints, 'new' => $rule->base_points],
        ]);

        return back()->with('success', "Aturan penilaian '{$rule->name}' berhasil diperbarui.");
    }

    /**
     * Admin: Manual point adjustment with audit logging.
     */
    public function adjustPoints(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isPlatformAdmin() && !$user->isCampusAdmin())) {
            abort(403);
        }

        $validated = $request->validate([
            'target_type' => 'required|in:user,team,project',
            'target_id' => 'required|integer',
            'points_delta' => 'required|integer|not_in:0',
            'reason' => 'required|string|min:6|max:500',
            'hub' => 'required|in:project,competition,general',
        ]);

        LeaderboardScoringService::recordAdminAdjustment(
            $user,
            $validated['target_type'],
            $validated['target_id'],
            $validated['points_delta'],
            $validated['reason'],
            $validated['hub']
        );

        LeaderboardRankingService::syncSnapshots();

        return back()->with('success', 'Penyesuaian skor berhasil dicatat dan klasemen telah diperbarui.');
    }

    /**
     * Admin: Trigger full recalculation of points and snapshots.
     */
    public function recalculate(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isPlatformAdmin() && !$user->isCampusAdmin())) {
            abort(403);
        }

        LeaderboardSeedService::run(false);
        LeaderboardRankingService::syncSnapshots();

        LeaderboardAuditLog::create([
            'admin_id' => $user->id,
            'action' => 'recalculate_all',
            'reason' => 'Rekalkulasi manual seluruh ledger skor dan snapshot klasemen oleh admin.',
        ]);

        return back()->with('success', 'Seluruh ledger skor dan snapshot klasemen berhasil direkalkulasi.');
    }
}
