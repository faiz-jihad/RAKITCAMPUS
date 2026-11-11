<?php

namespace App\Http\Controllers\Web;

use App\Enums\CampusRole;
use App\Enums\MembershipStatus;
use App\Enums\TaskStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\AcademicClass;
use App\Models\ActivityLog;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Competition;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use App\Services\MatchingService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
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

        // 1. Guest / Public Access Mode
        if (!$user) {
            $campus = Campus::where('slug', 'polindra')->first() ?? Campus::first();
            $campusName = $campus?->name ?? 'Politeknik Negeri Indramayu';

            // Public sample teams
            $publicTeams = Team::with([
                'project:id,title,slug,status,category,progress,short_description',
                'participations.competition:id,name,slug,status,category',
                'members.user:id,name,email',
                'tasks:id,team_id,status',
            ])->latest()->take(4)->get()->map(function ($team) {
                $totalTasks = $team->tasks->count();
                $doneTasks = $team->tasks->where('status', TaskStatus::Completed)->count();

                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'description' => $team->description,
                    'type' => $team->type?->value ?? 'project',
                    'is_leader' => false,
                    'project' => $team->project,
                    'competition' => $team->participations->first()?->competition,
                    'members_count' => $team->members->count(),
                    'members' => $team->members->take(5)->map(fn ($m) => [
                        'id' => $m->user_id,
                        'name' => $m->user?->name ?? 'Mahasiswa',
                        'role' => $m->role_name ?? 'Anggota',
                    ]),
                    'total_tasks' => $totalTasks,
                    'done_tasks' => $doneTasks,
                    'progress_percent' => $totalTasks > 0 ? (int) round(($doneTasks / $totalTasks) * 100) : ($team->project?->progress ?? 0),
                ];
            });

            // Public recommended projects
            $publicProjects = Project::with(['leader:id,name', 'campus:id,name', 'skills'])
                ->where('status', 'recruiting')
                ->orWhere('visibility', 'public')
                ->latest()
                ->take(4)
                ->get();

            // Upcoming competitions
            $upcomingCompetitions = Competition::whereIn('status', ['open', 'upcoming'])
                ->latest('registration_deadline')
                ->take(3)
                ->get();

            // Recent activity logs
            $recentActivities = ActivityLog::with(['actor:id,name', 'team:id,name'])
                ->latest()
                ->take(6)
                ->get();

            $completedTasksCount = Task::where('status', TaskStatus::Completed)->count();
            $pendingTasksCount = Task::where('status', '!=', TaskStatus::Completed)->count();

            // Monthly activity across platform
            $monthlyActivity = collect();
            for ($i = 5; $i >= 0; $i--) {
                $monthDate = now()->subMonths($i);
                $monthLabel = $monthDate->translatedFormat('M');

                $tasksDone = Task::where('status', TaskStatus::Completed)
                    ->whereYear('updated_at', $monthDate->year)
                    ->whereMonth('updated_at', $monthDate->month)
                    ->count();

                $logs = ActivityLog::whereYear('created_at', $monthDate->year)
                    ->whereMonth('created_at', $monthDate->month)
                    ->count();

                $val = max(15, min(95, ($tasksDone * 15) + ($logs * 8)));

                $monthlyActivity->push([
                    'month' => $monthLabel,
                    'done_tasks' => $tasksDone,
                    'logs' => $logs,
                    'percent' => $val,
                ]);
            }

            // Real campus peers
            $publicPeers = User::with(['profile:id,user_id,study_program,headline'])
                ->take(3)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'role' => $p->profile?->headline ?? $p->profile?->study_program ?? 'Mahasiswa',
                    'team' => $campusName,
                ]);

            $stats = [
                'my_teams_count' => Team::count(),
                'pending_tasks_count' => $pendingTasksCount,
                'completed_tasks_count' => $completedTasksCount,
                'team_readiness_avg' => 80,
                'recommended_matches_count' => Project::where('status', 'recruiting')->count(),
                'upcoming_competitions_count' => Competition::whereIn('status', ['open', 'upcoming'])->count(),
                'taught_classes_count' => 0,
                'total_students_count' => User::count(),
                'total_guided_projects_count' => Project::count(),
                'enrolled_classes_count' => 0,
            ];

            return Inertia::render('dashboard', [
                'isPublic' => true,
                'user' => [
                    'id' => 0,
                    'name' => 'Tamu (Eksplorasi Publik)',
                    'email' => 'tamu@polindra.ac.id',
                    'role' => 'guest',
                    'is_lecturer' => false,
                    'campus' => $campusName,
                    'major' => 'Eksplorasi Kampus',
                    'nim' => 'GUEST',
                    'availability' => 'mode_eksplorasi',
                    'skills' => [],
                ],
                'stats' => $stats,
                'myTeams' => $publicTeams,
                'myTasks' => collect(),
                'teammates' => $publicPeers,
                'monthlyActivity' => $monthlyActivity,
                'recommendedProjects' => $publicProjects,
                'upcomingCompetitions' => $upcomingCompetitions,
                'recentActivities' => $recentActivities,
                'profileCompletion' => null,
                'taughtClasses' => collect(),
                'enrolledClasses' => collect(),
            ]);
        }

        $membership = $user->activeMembership();
        if (!$membership) {
            $campus = Campus::where('slug', 'polindra')->first() ?? Campus::first();
            if ($campus) {
                $membership = CampusMembership::firstOrCreate(
                    ['campus_id' => $campus->id, 'user_id' => $user->id],
                    [
                        'role' => CampusRole::Student,
                        'status' => MembershipStatus::Active,
                        'verification_status' => VerificationStatus::Verified,
                        'student_number' => 'USR-' . substr(abs(crc32($user->email)), 0, 7),
                        'verified_at' => now(),
                    ]
                );
            }
        }
        $membership?->loadMissing('campus');
        $isLecturer = $user->isLecturer() || ($membership?->role === CampusRole::Lecturer);

        $upcomingCompetitions = Competition::whereIn('status', ['open', 'upcoming'])
            ->latest('registration_deadline')
            ->take(3)
            ->get();

        if ($isLecturer) {
            $taughtClassModels = AcademicClass::query()
                ->where(function ($q) use ($user) {
                    $q->where('lecturer_id', $user->id)
                      ->orWhereHas('coLecturers', fn ($cl) => $cl->where('users.id', $user->id));
                })
                ->withCount(['students', 'projects'])
                ->latest()
                ->get();

            $taughtClasses = $taughtClassModels->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'code' => $c->code,
                'join_code' => $c->join_code,
                'academic_year' => $c->academic_year,
                'semester' => $c->semester,
                'students_count' => $c->students_count,
                'projects_count' => $c->projects_count,
            ]);

            $taughtClassIds = $taughtClassModels->pluck('id');
            $guidedProjectModels = $taughtClassIds->isNotEmpty()
                ? Project::whereIn('academic_class_id', $taughtClassIds)
                    ->with([
                        'academicClass:id,name,code',
                        'leader:id,name',
                        'team.members.user:id,name',
                        'team.tasks:id,team_id,status',
                    ])
                    ->latest()
                    ->take(6)
                    ->get()
                : collect();

            $guidedProjects = $guidedProjectModels->map(function ($p) {
                $totalTasks = $p->team ? $p->team->tasks->count() : 0;
                $doneTasks = $p->team ? $p->team->tasks->where('status', TaskStatus::Completed)->count() : 0;

                return [
                    'id' => $p->id,
                    'title' => $p->title,
                    'status' => $p->status?->value ?? 'recruiting',
                    'progress' => $totalTasks > 0 ? (int) round(($doneTasks / $totalTasks) * 100) : ($p->progress ?? 0),
                    'class_id' => $p->academic_class_id,
                    'class_name' => $p->academicClass?->name,
                    'class_code' => $p->academicClass?->code,
                    'leader_name' => $p->leader?->name,
                    'team_id' => $p->team?->id,
                    'team_name' => $p->team?->name,
                    'members_count' => $p->team ? $p->team->members->count() : 0,
                    'done_tasks' => $doneTasks,
                    'total_tasks' => $totalTasks,
                ];
            });

            $guidedTeamIds = $guidedProjectModels->pluck('team.id')->filter();
            $recentActivities = $guidedTeamIds->isNotEmpty()
                ? ActivityLog::whereIn('team_id', $guidedTeamIds)
                    ->with(['actor:id,name', 'team:id,name'])
                    ->latest()
                    ->take(6)
                    ->get()
                : collect();

            return Inertia::render('dashboard', [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $membership?->role?->value ?? 'lecturer',
                    'is_lecturer' => true,
                    'campus' => $membership?->campus?->name ?? 'Politeknik Negeri Indramayu',
                    'major' => 'Dosen Pengampu & Pembimbing',
                    'nim' => $membership?->student_number,
                    'availability' => null,
                    'skills' => [],
                ],
                'stats' => [
                    'my_teams_count' => 0,
                    'pending_tasks_count' => 0,
                    'completed_tasks_count' => $guidedProjects->sum('done_tasks'),
                    'team_readiness_avg' => 100,
                    'recommended_matches_count' => 0,
                    'upcoming_competitions_count' => Competition::whereIn('status', ['open', 'upcoming'])->count(),
                    'taught_classes_count' => $taughtClasses->count(),
                    'total_students_count' => $taughtClasses->sum('students_count'),
                    'total_guided_projects_count' => $taughtClasses->sum('projects_count'),
                    'enrolled_classes_count' => 0,
                ],
                'myTeams' => [],
                'myTasks' => [],
                'teammates' => [],
                'monthlyActivity' => [],
                'recommendedProjects' => [],
                'upcomingCompetitions' => $upcomingCompetitions,
                'recentActivities' => $recentActivities,
                'profileCompletion' => null,
                'taughtClasses' => $taughtClasses,
                'guidedProjects' => $guidedProjects,
                'enrolledClasses' => [],
            ]);
        }

        $profile = $user->profile()->with(['skills', 'campus'])->first();
        if (!$profile) {
            $campusId = $membership?->campus_id ?? Campus::where('slug', 'polindra')->value('id') ?? Campus::value('id');
            $profile = StudentProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'campus_id' => $campusId,
                    'slug' => Str::slug($user->name) . '-' . Str::random(4),
                    'bio' => 'Mahasiswa ' . ($membership?->campus?->name ?? 'Kampus'),
                ]
            );
            $profile->loadMissing(['skills', 'campus']);
        }

        // 1. User's Teams & Workspaces
        $myTeams = Team::where(function ($q) use ($user) {
            $q->where('leader_id', $user->id)
              ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
        })->with([
            'project:id,title,slug,status,category,progress,short_description',
            'participations.competition:id,name,slug,status,category',
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

        // 4. Recent Activity Logs in user's teams
        $teamIds = $myTeams->pluck('id');
        $recentActivities = ActivityLog::whereIn('team_id', $teamIds)
            ->with(['actor:id,name', 'team:id,name'])
            ->latest()
            ->take(6)
            ->get();

        // 5. Enrolled Classes for Student
        $enrolledClasses = $user->enrolledClasses()->withCount(['students', 'projects'])->latest()->get()->map(fn ($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'code' => $c->code,
            'academic_year' => $c->academic_year,
            'semester' => $c->semester,
            'students_count' => $c->students_count,
            'projects_count' => $c->projects_count,
        ]);

        // 6. Real dynamic metrics & calculations
        $userCompletedTasksCount = Task::where('assignee_id', $user->id)
            ->where('status', TaskStatus::Completed)
            ->count();
        $teamDoneTasks = $myTeams->sum('done_tasks');
        $completedTasksCount = max($userCompletedTasksCount, $teamDoneTasks);

        $pendingTasksCount = $myTasks->count();
        $teamPendingTasks = $myTeams->sum(fn ($t) => max(0, ($t['total_tasks'] ?? 0) - ($t['done_tasks'] ?? 0)));
        $totalPendingTasks = max($pendingTasksCount, $teamPendingTasks);

        $teamReadinessAvg = $myTeams->isNotEmpty()
            ? (int) round($myTeams->avg('progress_percent'))
            : (int) ($profile?->completion()['percent'] ?? 0);

        // 7. Monthly dynamic activity
        $monthlyActivity = collect();
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $monthLabel = $monthDate->translatedFormat('M');

            $tasksDone = Task::where('assignee_id', $user->id)
                ->where('status', TaskStatus::Completed)
                ->whereYear('updated_at', $monthDate->year)
                ->whereMonth('updated_at', $monthDate->month)
                ->count();

            $logs = ActivityLog::where(function ($q) use ($user, $teamIds) {
                $q->where('actor_id', $user->id);
                if ($teamIds->isNotEmpty()) {
                    $q->orWhereIn('team_id', $teamIds);
                }
            })
            ->whereYear('created_at', $monthDate->year)
            ->whereMonth('created_at', $monthDate->month)
            ->count();

            $val = max(15, min(95, ($tasksDone * 20) + ($logs * 10)));

            $monthlyActivity->push([
                'month' => $monthLabel,
                'done_tasks' => $tasksDone,
                'logs' => $logs,
                'percent' => $val,
            ]);
        }

        // 8. Real Teammates
        $realTeammates = collect();
        foreach ($myTeams as $team) {
            foreach ($team['members'] as $m) {
                if ($m['id'] !== $user->id && !$realTeammates->contains('id', $m['id'])) {
                    $realTeammates->push([
                        'id' => $m['id'],
                        'name' => $m['name'],
                        'role' => $m['role'],
                        'team' => $team['name'],
                    ]);
                }
            }
        }

        if ($realTeammates->isEmpty()) {
            $campusId = $membership?->campus_id ?? $profile?->campus_id;
            $campusPeers = User::where('id', '!=', $user->id)
                ->whereHas('memberships', function ($q) use ($campusId) {
                    if ($campusId) {
                        $q->where('campus_id', $campusId);
                    }
                })
                ->with('profile')
                ->take(3)
                ->get()
                ->map(function ($peer) use ($membership) {
                    return [
                        'id' => $peer->id,
                        'name' => $peer->name,
                        'role' => $peer->profile?->headline ?? $peer->profile?->study_program ?? 'Mahasiswa',
                        'team' => $membership?->campus?->name ?? 'Rekan Kampus',
                    ];
                });
            $realTeammates = $campusPeers;
        }

        // Summary metrics
        $stats = [
            'my_teams_count' => $myTeams->count(),
            'pending_tasks_count' => $totalPendingTasks,
            'completed_tasks_count' => $completedTasksCount,
            'team_readiness_avg' => $teamReadinessAvg,
            'recommended_matches_count' => $recommendedProjects->count(),
            'upcoming_competitions_count' => Competition::whereIn('status', ['open', 'upcoming'])->count(),
            'taught_classes_count' => 0,
            'total_students_count' => 0,
            'total_guided_projects_count' => 0,
            'enrolled_classes_count' => $enrolledClasses->count(),
        ];

        return Inertia::render('dashboard', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $membership?->role?->value ?? 'student',
                'is_lecturer' => false,
                'campus' => $membership?->campus?->name ?? 'Politeknik Negeri Indramayu',
                'major' => $profile?->study_program ?? $profile?->department ?? $profile?->major ?? 'Teknik Informatika',
                'nim' => $membership?->student_number ?? $profile?->nim,
                'academic_status' => $profile?->academic_status ?? 'prodi',
                'batch_year' => $profile?->batch_year ?? '2024',
                'headline' => $profile?->headline ?? 'Hacker & Hustler',
                'availability' => $profile?->availability_status?->value ?? ($profile?->availability_hours ? $profile->availability_hours . ' jam/minggu' : 'available_for_team'),
                'skills' => $profile?->skills ?? [],
            ],
            'stats' => $stats,
            'myTeams' => $myTeams,
            'myTasks' => $myTasks,
            'teammates' => $realTeammates,
            'monthlyActivity' => $monthlyActivity,
            'recommendedProjects' => $recommendedProjects,
            'upcomingCompetitions' => $upcomingCompetitions,
            'recentActivities' => $recentActivities,
            'profileCompletion' => $profile?->completion() ?? ['percent' => $teamReadinessAvg, 'missing' => []],
            'taughtClasses' => [],
            'guidedProjects' => [],
            'enrolledClasses' => $enrolledClasses,
        ]);
    }
}
