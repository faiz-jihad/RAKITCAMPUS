<?php

namespace App\Http\Controllers\Web;

use App\Enums\TaskStatus;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Competition;
use App\Models\Task;
use App\Models\Team;
use App\Services\MatchingService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardWebController extends Controller
{
    public function __construct(
        protected MatchingService $matchingService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $profile = $user->profile()->with(['skills', 'campus'])->first();

        // 1. User's Teams & Workspaces
        $myTeams = Team::where(function ($q) use ($user) {
            $q->where('leader_id', $user->id)
              ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
        })->with([
            'project:id,title,slug,status,category,progress,short_description',
            'participations.competition:id,name,slug,status,theme',
            'members.user:id,name,email',
            'tasks:id,team_id,status',
        ])->latest()->get()->map(function ($team) use ($user) {
            $totalTasks = $team->tasks->count();
            $doneTasks = $team->tasks->where('status', TaskStatus::Completed)->count();
            $isLeader = $team->leader_id === $user->id || $team->isLeader($user);

            return [
                'id' => $team->id,
                'name' => $team->name,
                'description' => $team->description,
                'type' => $team->type?->value ?? 'project',
                'is_leader' => $isLeader,
                'project' => $team->project,
                'competition' => $team->participations->first()?->competition,
                'members_count' => $team->members->count(),
                'members' => $team->members->take(5)->map(fn ($m) => [
                    'id' => $m->user_id,
                    'name' => $m->user->name,
                    'role' => $m->role_name ?? ($m->permission === 'leader' ? 'Leader' : 'Anggota'),
                ]),
                'total_tasks' => $totalTasks,
                'done_tasks' => $doneTasks,
                'progress_percent' => $totalTasks > 0 ? (int) round(($doneTasks / $totalTasks) * 100) : ($team->project?->progress ?? 0),
            ];
        });

        // 2. User's pending tasks across all teams
        $myTasks = Task::where('assignee_id', $user->id)
            ->whereIn('status', [TaskStatus::Todo, TaskStatus::InProgress, TaskStatus::InReview])
            ->with(['team:id,name', 'milestone:id,title'])
            ->latest('updated_at')
            ->take(6)
            ->get();

        // 3. Recommended projects for this student
        $recommendedProjects = $profile
            ? $this->matchingService->recommendProjectsForStudent($profile, 3)
            : collect();

        // 4. Upcoming competitions
        $upcomingCompetitions = Competition::whereIn('status', ['open', 'upcoming'])
            ->latest('registration_deadline')
            ->take(3)
            ->get();

        // 5. Recent Activity Logs in user's teams
        $teamIds = $myTeams->pluck('id');
        $recentActivities = ActivityLog::whereIn('team_id', $teamIds)
            ->with(['actor:id,name', 'team:id,name'])
            ->latest()
            ->take(6)
            ->get();

        // 6. Summary metrics
        $stats = [
            'my_teams_count' => $myTeams->count(),
            'pending_tasks_count' => $myTasks->count(),
            'recommended_matches_count' => $recommendedProjects->count(),
            'upcoming_competitions_count' => Competition::whereIn('status', ['open', 'upcoming'])->count(),
        ];

        return Inertia::render('dashboard', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $membership?->role?->value ?? 'student',
                'campus' => $membership?->campus?->name ?? 'Politeknik Negeri Indramayu',
                'major' => $profile?->major ?? 'Teknik Informatika',
                'nim' => $profile?->nim,
                'availability' => $profile?->availability_status?->value ?? 'available_for_team',
                'skills' => $profile?->skills ?? [],
            ],
            'stats' => $stats,
            'myTeams' => $myTeams,
            'myTasks' => $myTasks,
            'recommendedProjects' => $recommendedProjects,
            'upcomingCompetitions' => $upcomingCompetitions,
            'recentActivities' => $recentActivities,
            'profileCompletion' => $profile?->completion() ?? ['percent' => 85, 'missing' => []],
        ]);
    }
}
