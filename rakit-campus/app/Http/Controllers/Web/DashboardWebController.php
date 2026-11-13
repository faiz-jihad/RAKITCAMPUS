<?php

namespace App\Http\Controllers\Web;

use App\Enums\CampusRole;
use App\Enums\InvitationStatus;
use App\Enums\MembershipStatus;
use App\Enums\ProjectStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\TaskStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\AcademicClass;
use App\Models\ActivityLog;
use App\Models\Campus;
use App\Models\CampusMembership;
use App\Models\Competition;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\StudentProfile;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use App\Services\MatchingService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardWebController extends Controller
{
    public function __construct(
        protected MatchingService $matchingService
    ) {}

    private function formationStatusLabel(?string $status): string
    {
        return match ($status) {
            'formation_review' => 'Menunggu Persetujuan Dosen',
            'lecturer_approved' => 'Disetujui Dosen',
            'team_locked' => 'Formasi Terkunci',
            'workspace_activated' => 'Workspace Aktif',
            'formation_rejected' => 'Ditolak',
            'matchmaking_open' => 'Matchmaking Terbuka',
            'requirements_configured' => 'Kebutuhan Dikonfigurasi',
            default => 'Tahap Pembentukan',
        };
    }

    private function openRecruitingProjectsPayload(?StudentProfile $profile, ?User $user, int $limit = 4): Collection
    {
        $joinedProjectIds = $user
            ? Team::where(function ($q) use ($user) {
                $q->where('leader_id', $user->id)
                    ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
            })->whereNotNull('project_id')->pluck('project_id')->all()
            : [];

        $query = Project::query()
            ->where('status', ProjectStatus::Recruiting->value)
            ->where('moderation_status', 'visible')
            ->whereNotIn('formation_status', ['team_locked', 'workspace_activated'])
            ->whereHas('team.recruitment', function ($q) {
                $q->where('status', RecruitmentStatus::Open->value)
                    ->where(function ($c) {
                        $c->whereNull('closes_at')->orWhere('closes_at', '>', now());
                    });
            });

        if (! empty($joinedProjectIds)) {
            $query->whereNotIn('id', $joinedProjectIds);
        }

        if ($user && $profile) {
            $query->where(function ($q) use ($profile) {
                $q->where('campus_id', $profile->campus_id)
                    ->orWhere('visibility', 'public');
            });
        } else {
            $query->where('visibility', 'public');
        }

        $projects = $query->with([
            'leader:id,name',
            'campus:id,name',
            'academicClass:id,name,code,target_team_size',
            'skills:id,name',
            'team.members' => fn ($m) => $m->where('status', 'active'),
            'team.recruitment.roles',
        ])->latest()->get();

        $mapped = $projects->map(function (Project $proj) use ($profile) {
            $match = $profile ? $this->matchingService->matchStudentToProject($profile, $proj) : null;
            $activeCount = $proj->activeMembersCount();
            $maxTeamSize = (int) ($proj->max_team_size ?: ($proj->team?->capacity ?: 4));
            if ($proj->academicClass?->target_team_size) {
                $maxTeamSize = min($maxTeamSize, (int) $proj->academicClass->target_team_size);
            }

            $openRoles = $proj->team?->recruitment?->roles
                ? $proj->team->recruitment->roles->map(fn ($r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                    'slots' => $r->slots ?? 1,
                ])->values()->all()
                : [];

            return [
                'id' => $proj->id,
                'slug' => $proj->slug,
                'title' => $proj->title,
                'short_description' => $proj->short_description,
                'category' => $proj->category?->label() ?? ucfirst((string) ($proj->category?->value ?? 'Akademik')),
                'status' => $proj->status?->value ?? 'recruiting',
                'formation_status' => $proj->formation_status ?? 'draft',
                'leader' => $proj->leader ? [
                    'id' => $proj->leader->id,
                    'name' => $proj->leader->name,
                ] : null,
                'academic_class' => $proj->academicClass ? [
                    'id' => $proj->academicClass->id,
                    'name' => $proj->academicClass->name,
                    'code' => $proj->academicClass->code,
                ] : null,
                'team_name' => $proj->team?->name,
                'members_count' => $activeCount,
                'max_team_size' => $maxTeamSize,
                'open_roles' => $openRoles,
                'match_score' => $match['match_score'] ?? null,
            ];
        });

        if ($profile) {
            $mapped = $mapped->sortByDesc(fn ($item) => $item['match_score'] ?? 0);
        }

        return $mapped->take($limit)->values();
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        // 1. Guest / Public Access Mode
        if (!$user) {
            $campus = Campus::where('slug', 'polindra')->first() ?? Campus::first();
            $campusName = $campus?->name ?? 'Kampus Anda';

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

            // Public recommended open recruiting projects
            $publicProjects = $this->openRecruitingProjectsPayload(null, null, 4);

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
            $publicPeers = User::with(['profile:id,user_id,study_program,bio'])
                ->take(3)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'role' => $p->profile?->headline ?? $p->profile?->study_program ?? 'Mahasiswa',
                    'team' => $campusName,
                ]);

            $stats = [
                'my_teams_count' => Team::where('type', '!=', 'competition')->count(),
                'pending_tasks_count' => $pendingTasksCount,
                'completed_tasks_count' => $completedTasksCount,
                'team_readiness_avg' => 80,
                'recommended_matches_count' => Project::where('status', 'recruiting')->count(),
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
                    'email' => 'tamu@rakitcampus.id',
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
                'recentActivities' => $recentActivities,
                'profileCompletion' => null,
                'taughtClasses' => collect(),
                'enrolledClasses' => collect(),
            ]);
        }

        $membership = $user->activeMembership();
        if (!$membership) {
            $campus = Campus::where('slug', 'polindra')->first() ?? Campus::first();
            if (!$campus) {
                $campus = Campus::create([
                    'name' => 'Kampus RAKIT',
                    'slug' => 'kampus-rakit',
                ]);
            }
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
        $membership?->loadMissing('campus');
        $isAdmin = $user->isCampusAdmin() || $user->isPlatformAdmin() || $membership?->role === CampusRole::CampusAdmin;
        $isLecturer = $user->isLecturer() || ($membership?->role === CampusRole::Lecturer);

        $upcomingCompetitions = Competition::whereIn('status', ['open', 'upcoming'])
            ->latest('registration_deadline')
            ->take(3)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'organizer' => $c->organizer,
                'registration_deadline' => $c->registration_deadline?->translatedFormat('d M Y') ?? 'Segera',
                'status' => is_object($c->status) ? ($c->status->value ?? 'open') : ($c->status ?? 'open'),
                'category' => $c->category ?? 'Umum',
            ]);

        if ($isAdmin) {
            $campus = $membership?->campus ?? Campus::where('slug', 'polindra')->first() ?? Campus::first();
            $campusId = $campus?->id;

            $totalStudents = CampusMembership::where('role', CampusRole::Student->value)
                ->when($campusId, fn ($q) => $q->where('campus_id', $campusId))
                ->count();

            $verifiedStudents = CampusMembership::where('role', CampusRole::Student->value)
                ->where('verification_status', VerificationStatus::Verified->value)
                ->when($campusId, fn ($q) => $q->where('campus_id', $campusId))
                ->count();

            $unverifiedStudents = CampusMembership::where('role', CampusRole::Student->value)
                ->where('verification_status', VerificationStatus::Pending->value)
                ->when($campusId, fn ($q) => $q->where('campus_id', $campusId))
                ->count();

            $totalLecturers = CampusMembership::where('role', CampusRole::Lecturer->value)
                ->when($campusId, fn ($q) => $q->where('campus_id', $campusId))
                ->count();

            $activeProjects = Project::where('status', '!=', 'completed')->count();
            $completedProjects = Project::where('status', 'completed')->count();
            $activeCompetitions = Competition::whereIn('status', ['open', 'upcoming'])->count();
            $totalTeams = Team::count();

            $pendingVerifications = CampusMembership::where('verification_status', VerificationStatus::Pending->value)
                ->when($campusId, fn ($q) => $q->where('campus_id', $campusId))
                ->with(['user.profile'])
                ->latest()
                ->take(8)
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'user_id' => $m->user_id,
                    'name' => $m->user?->name ?? 'Mahasiswa',
                    'email' => $m->user?->email ?? '',
                    'student_number' => $m->student_number ?? '-',
                    'study_program' => $m->user?->profile?->study_program ?? 'Teknik Informatika',
                    'created_at' => $m->created_at?->diffForHumans() ?? 'Baru saja',
                ]);

            $recentProjects = Project::with(['leader:id,name', 'academicClass:id,name,code'])
                ->latest()
                ->take(6)
                ->get()
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'status' => $p->status?->value ?? 'recruiting',
                    'leader_name' => $p->leader?->name ?? 'Mahasiswa',
                    'category' => $p->category?->label() ?? 'Umum',
                    'progress' => (int) ($p->progress ?? 0),
                    'created_at' => $p->created_at?->diffForHumans() ?? 'Baru saja',
                ]);

            $recentCompetitions = Competition::latest()
                ->take(4)
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'organizer' => $c->organizer,
                    'registration_deadline' => $c->registration_deadline?->translatedFormat('d M Y') ?? 'Segera',
                    'status' => is_object($c->status) ? ($c->status->value ?? 'open') : ($c->status ?? 'open'),
                ]);

            return Inertia::render('dashboard', [
                'isAdmin' => true,
                'adminStats' => [
                    'total_students' => $totalStudents,
                    'verified_students' => $verifiedStudents,
                    'unverified_students' => $unverifiedStudents,
                    'total_lecturers' => $totalLecturers,
                    'active_projects' => $activeProjects,
                    'completed_projects' => $completedProjects,
                    'active_competitions' => $activeCompetitions,
                    'total_teams' => $totalTeams,
                ],
                'pendingVerifications' => $pendingVerifications,
                'recentProjects' => $recentProjects,
                'recentCompetitions' => $recentCompetitions,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->isPlatformAdmin() ? 'platform_admin' : 'campus_admin',
                    'is_admin' => true,
                    'campus' => $campus?->name ?? 'Kampus Anda',
                    'major' => 'Administrator Kampus',
                    'nim' => $membership?->student_number ?? 'ADM-001',
                    'availability' => null,
                    'skills' => [],
                ],
                'stats' => [
                    'my_teams_count' => 0,
                    'pending_tasks_count' => 0,
                    'completed_tasks_count' => 0,
                    'team_readiness_avg' => 100,
                    'recommended_matches_count' => 0,
                    'upcoming_competitions_count' => $activeCompetitions,
                    'taught_classes_count' => 0,
                    'total_students_count' => $totalStudents,
                    'total_guided_projects_count' => $activeProjects,
                    'enrolled_classes_count' => 0,
                ],
                'myTeams' => [],
                'myTasks' => [],
                'teammates' => [],
                'monthlyActivity' => [],
                'recommendedProjects' => [],
                'receivedInvitations' => [],
                'upcomingCompetitions' => $upcomingCompetitions,
                'recentActivities' => [],
                'profileCompletion' => null,
                'taughtClasses' => [],
                'guidedProjects' => [],
                'pendingTeamApprovals' => [],
                'teamApprovalHistory' => [],
            ]);
        }

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
            $authorizedProjects = Project::query()
                ->where(function ($q) use ($user, $taughtClassIds) {
                    $q->where('primary_supervisor_id', $user->id);
                    if ($taughtClassIds->isNotEmpty()) {
                        $q->orWhereIn('academic_class_id', $taughtClassIds);
                    }
                })
                ->with([
                    'academicClass:id,name,code,target_team_size',
                    'leader:id,name,email',
                    'formationApprover:id,name',
                    'team.members' => fn ($m) => $m->with('user:id,name,email'),
                    'team.tasks:id,team_id,status',
                ])
                ->latest('updated_at')
                ->get();

            $formatLecturerProject = function (Project $p) {
                $totalTasks = $p->team ? $p->team->tasks->count() : 0;
                $doneTasks = $p->team ? $p->team->tasks->where('status', TaskStatus::Completed)->count() : 0;
                $activeMembers = $p->team
                    ? $p->team->members->filter(fn ($m) => ($m->status ?? 'active') === 'active')
                    : collect();
                $maxTeamSize = (int) ($p->max_team_size ?: ($p->team?->capacity ?: 4));
                if ($p->academicClass?->target_team_size) {
                    $maxTeamSize = min($maxTeamSize, (int) $p->academicClass->target_team_size);
                }

                return [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'title' => $p->title,
                    'category' => $p->category?->label() ?? 'Akademik',
                    'status' => $p->status?->value ?? 'recruiting',
                    'formation_status' => $p->formation_status ?? 'draft',
                    'formation_status_label' => $this->formationStatusLabel($p->formation_status),
                    'formation_notes' => $p->formation_notes,
                    'formation_approved_at' => $p->formation_approved_at?->translatedFormat('d M Y, H:i'),
                    'approver_name' => $p->formationApprover?->name,
                    'progress' => $totalTasks > 0 ? (int) round(($doneTasks / $totalTasks) * 100) : ($p->progress ?? 0),
                    'class_id' => $p->academic_class_id,
                    'class_name' => $p->academicClass?->name,
                    'class_code' => $p->academicClass?->code,
                    'leader_id' => $p->leader_id,
                    'leader_name' => $p->leader?->name,
                    'leader_email' => $p->leader?->email,
                    'team_id' => $p->team?->id,
                    'team_name' => $p->team?->name ?? $p->title,
                    'min_team_size' => $p->min_team_size ?: 2,
                    'max_team_size' => $maxTeamSize,
                    'members_count' => $activeMembers->count(),
                    'members' => $activeMembers->map(fn ($m) => [
                        'id' => $m->id,
                        'user_id' => $m->user_id,
                        'name' => $m->user?->name ?? 'Mahasiswa',
                        'email' => $m->user?->email ?? '',
                        'role_name' => $m->role_name ?? ($m->permission?->value === 'leader' || $m->permission === 'leader' ? 'Ketua Kelompok' : 'Anggota'),
                        'is_leader' => $m->user_id === $p->leader_id || ($m->permission?->value ?? $m->permission) === 'leader',
                    ])->values()->all(),
                    'done_tasks' => $doneTasks,
                    'total_tasks' => $totalTasks,
                    'submitted_at' => $p->updated_at?->diffForHumans(),
                ];
            };

            $pendingTeamApprovals = $authorizedProjects
                ->where('formation_status', 'formation_review')
                ->map($formatLecturerProject)
                ->values();

            $teamApprovalHistory = $authorizedProjects
                ->filter(fn ($p) => in_array($p->formation_status, ['lecturer_approved', 'team_locked', 'workspace_activated', 'formation_rejected'], true))
                ->take(10)
                ->map($formatLecturerProject)
                ->values();

            $guidedProjects = $authorizedProjects
                ->take(6)
                ->map($formatLecturerProject)
                ->values();

            $guidedTeamIds = $authorizedProjects->pluck('team.id')->filter();
            $recentActivities = $guidedTeamIds->isNotEmpty()
                ? ActivityLog::whereIn('team_id', $guidedTeamIds)
                    ->with(['actor:id,name', 'team:id,name'])
                    ->latest()
                    ->take(6)
                    ->get()
                : collect();

            return Inertia::render('dashboard', [
                'isLecturer' => true,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $membership?->role?->value ?? 'lecturer',
                    'is_lecturer' => true,
                    'campus' => $membership?->campus?->name ?? 'Kampus Anda',
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
                    'total_guided_projects_count' => max($taughtClasses->sum('projects_count'), $authorizedProjects->count()),
                    'pending_team_approvals_count' => $pendingTeamApprovals->count(),
                    'enrolled_classes_count' => 0,
                ],
                'myTeams' => [],
                'myTasks' => [],
                'teammates' => [],
                'monthlyActivity' => [],
                'recommendedProjects' => [],
                'receivedInvitations' => [],
                'upcomingCompetitions' => $upcomingCompetitions,
                'recentActivities' => $recentActivities,
                'profileCompletion' => null,
                'taughtClasses' => $taughtClasses,
                'guidedProjects' => $guidedProjects,
                'pendingTeamApprovals' => $pendingTeamApprovals,
                'teamApprovalHistory' => $teamApprovalHistory,
                'enrolledClasses' => [],
            ]);
        }

        $profile = $user->profile()->with(['skills', 'campus'])->first();
        if (!$profile) {
            $campus = $membership?->campus ?? Campus::where('slug', 'polindra')->first() ?? Campus::first();
            if (!$campus) {
                $campus = Campus::create([
                    'name' => 'Kampus RAKIT',
                    'slug' => 'kampus-rakit',
                ]);
            }
            $profile = StudentProfile::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'campus_id' => $campus->id,
                    'slug' => Str::slug($user->name) . '-' . Str::random(4),
                    'bio' => 'Mahasiswa ' . ($campus->name ?? 'Kampus'),
                ]
            );
            $profile->loadMissing(['skills', 'campus']);
        }

        // 1. User's Teams & Workspaces (strictly academic project teams)
        $myTeams = Team::where('type', '!=', 'competition')
            ->where(function ($q) use ($user) {
                $q->where('leader_id', $user->id)
                  ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id)->where('status', 'active'));
            })->with([
                'project:id,academic_class_id,title,slug,status,category,progress,short_description,formation_status,formation_notes,formation_approved_at,formation_approved_by,min_team_size,max_team_size',
                'project.academicClass:id,name,code,target_team_size',
                'project.formationApprover:id,name',
                'members' => fn ($m) => $m->where('status', 'active')->with('user:id,name,email'),
                'tasks:id,team_id,status',
            ])->latest()->get()->map(function ($team) use ($user) {
                $totalTasks = $team->tasks->count();
                $doneTasks = $team->tasks->where('status', TaskStatus::Completed)->count();
                $isLeader = $team->leader_id === $user->id || $team->isLeader($user);
                $project = $team->project;
                $formationStatus = $project?->formation_status ?? 'draft';

                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'description' => $team->description,
                    'type' => 'project',
                    'is_leader' => $isLeader,
                    'formation_status' => $formationStatus,
                    'formation_status_label' => $this->formationStatusLabel($formationStatus),
                    'formation_notes' => $project?->formation_notes,
                    'formation_approved_at' => $project?->formation_approved_at?->translatedFormat('d M Y, H:i'),
                    'formation_approver_name' => $project?->formationApprover?->name,
                    'can_access_workspace' => in_array($formationStatus, ['lecturer_approved', 'team_locked', 'workspace_activated'], true),
                    'project' => $project ? [
                        'id' => $project->id,
                        'title' => $project->title,
                        'slug' => $project->slug,
                        'status' => $project->status?->value ?? 'recruiting',
                        'category' => $project->category?->value ?? 'academic',
                        'progress' => $project->progress ?? 0,
                        'short_description' => $project->short_description,
                        'formation_status' => $formationStatus,
                        'formation_status_label' => $this->formationStatusLabel($formationStatus),
                        'formation_notes' => $project->formation_notes,
                        'class_label' => $project->academicClass ? "{$project->academicClass->name} ({$project->academicClass->code})" : null,
                    ] : null,
                    'members_count' => $team->members->count(),
                    'members' => $team->members->take(5)->map(fn ($m) => [
                        'id' => $m->user_id,
                        'name' => $m->user?->name ?? 'Mahasiswa',
                        'role' => $m->role_name ?? ($m->permission === 'leader' ? 'Leader' : 'Anggota'),
                    ]),
                    'total_tasks' => $totalTasks,
                    'done_tasks' => $doneTasks,
                    'progress_percent' => $totalTasks > 0 ? (int) round(($doneTasks / $totalTasks) * 100) : ($project?->progress ?? 0),
                ];
            });

        // 2. User's pending tasks across all teams
        $myTasks = Task::where('assignee_id', $user->id)
            ->whereIn('status', [TaskStatus::Todo, TaskStatus::InProgress, TaskStatus::InReview])
            ->with(['team:id,name', 'milestone:id,title'])
            ->latest('updated_at')
            ->take(6)
            ->get();

        // 3. Open recruiting projects eligible for discovery (flat payload, zero 404 links)
        $recommendedProjects = $this->openRecruitingProjectsPayload($profile, $user, 4);

        // 3b. Peer collaboration invitations received by this student (strictly separated from lecturer approvals)
        $receivedInvitations = Invitation::where('invitee_id', $user->id)
            ->whereIn('status', [
                InvitationStatus::Pending->value,
                InvitationStatus::Accepted->value,
                InvitationStatus::Declined->value,
            ])
            ->with([
                'team.project:id,title,slug,category,academic_class_id',
                'team.project.academicClass:id,name,code',
                'team.members' => fn ($m) => $m->where('status', 'active'),
                'inviter:id,name,email',
                'role:id,name',
            ])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest('id')
            ->take(10)
            ->get()
            ->map(function (Invitation $inv) {
                $statusValue = $inv->status instanceof InvitationStatus ? $inv->status->value : (string) $inv->status;
                $project = $inv->team?->project;
                $isExpired = $inv->isExpired();

                return [
                    'id' => $inv->id,
                    'status' => $isExpired && $statusValue === 'pending' ? 'expired' : $statusValue,
                    'team_id' => $inv->team_id,
                    'team_name' => $inv->team?->name ?? 'Tim Proyek',
                    'team_members_count' => $inv->team?->members?->count() ?? 1,
                    'team_capacity' => $inv->team?->capacity ?? 4,
                    'project_id' => $project?->id,
                    'project_title' => $project?->title ?? 'Proyek Kelas',
                    'project_slug' => $project?->slug,
                    'class_label' => $project?->academicClass ? "{$project->academicClass->name} ({$project->academicClass->code})" : null,
                    'inviter_name' => $inv->inviter?->name ?? 'Ketua Tim',
                    'role_name' => $inv->role?->name ?? $inv->role_name ?? 'Kolaborator Proyek',
                    'message' => $inv->message,
                    'declined_reason' => $inv->declined_reason,
                    'expires_at' => $inv->expires_at?->diffForHumans(),
                    'responded_at' => $inv->responded_at?->diffForHumans(),
                    'created_at' => $inv->created_at?->diffForHumans(),
                ];
            })
            ->values();

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

            $val = ($tasksDone === 0 && $logs === 0) ? 0 : min(100, ($tasksDone * 20) + ($logs * 10));

            $monthlyActivity->push([
                'month' => $monthLabel,
                'done_tasks' => $tasksDone,
                'logs' => $logs,
                'percent' => $val,
            ]);
        }

        // 8. Real Teammates (strictly from user's active project teams)
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

        // Summary metrics
        $stats = [
            'my_teams_count' => $myTeams->count(),
            'pending_tasks_count' => $totalPendingTasks,
            'completed_tasks_count' => $completedTasksCount,
            'team_readiness_avg' => $teamReadinessAvg,
            'recommended_matches_count' => $recommendedProjects->count(),
            'pending_invitations_count' => $receivedInvitations->where('status', 'pending')->count(),
            'pending_team_approvals_count' => 0,
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
                'campus' => $membership?->campus?->name ?? 'Kampus Anda',
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
            'receivedInvitations' => $receivedInvitations,
            'recentActivities' => $recentActivities,
            'profileCompletion' => $profile?->completion() ?? ['percent' => $teamReadinessAvg, 'missing' => []],
            'taughtClasses' => [],
            'guidedProjects' => [],
            'pendingTeamApprovals' => [],
            'teamApprovalHistory' => [],
            'enrolledClasses' => $enrolledClasses,
        ]);
    }
}
