<?php

namespace App\Http\Controllers\Web;

use App\Enums\ApplicationStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\SkillType;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Enums\InvitationStatus;
use App\Models\AcademicClass;
use App\Models\Invitation;
use App\Models\ActivityLog;
use App\Models\Application;
use App\Models\Bookmark;
use App\Models\Campus;
use App\Models\MatchingAuditLog;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Skill;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Matchmaking\DemoProjectAligner;
use App\Services\Matchmaking\EligibilityService;
use App\Services\Matchmaking\InvitationService;
use App\Services\Matchmaking\MatchmakingEngine;
use App\Services\Matchmaking\MembershipService;
use App\Services\Matchmaking\TeamBalanceService;
use App\Services\Matchmaking\TeamFormationService;
use App\Services\Matchmaking\TeamOptimizationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectWebController extends Controller
{
    public function __construct(
        protected MembershipService $membershipService,
        protected InvitationService $invitationService,
        protected TeamFormationService $teamFormationService,
        protected TeamOptimizationService $teamOptimizationService,
        protected TeamBalanceService $teamBalanceService,
        protected EligibilityService $eligibilityService,
        protected MatchmakingEngine $matchmakingEngine
    ) {}

    public function index(Request $request): Response
    {
        DemoProjectAligner::alignOnce();
        $user = $request->user();
        $query = Project::visibleTo($user)
            ->with([
                'leader:id,name',
                'campus:id,name',
                'academicClass:id,name,code,target_team_size,lecturer_id',
                'academicClass.coLecturers:id',
                'skills',
                'team.members.user:id,name',
                'team.recruitment.roles',
            ])
            ->latest();

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhere('short_description', 'like', $search);
            });
        }

        $projects = $query->paginate(12)->withQueryString();

        $isLecturer = $user ? ($user->isLecturer() || $user->isPlatformAdmin() || $user->isCampusAdmin()) : false;
        $enrolledClassIds = $user && !$isLecturer
            ? $user->enrolledClasses()->wherePivot('status', 'enrolled')->pluck('academic_classes.id')->flip()->all()
            : [];

        $activeProjectClassIds = [];
        $hasAnyActiveProject = false;
        if ($user && !$isLecturer) {
            $activeMemberships = TeamMember::where('user_id', $user->id)
                ->where('status', 'active')
                ->whereHas('team.project', function ($q) {
                    $q->whereNotIn('status', [
                        ProjectStatus::Archived->value,
                        ProjectStatus::Completed->value,
                    ]);
                })
                ->with('team.project:id,academic_class_id')
                ->get();

            foreach ($activeMemberships as $m) {
                $hasAnyActiveProject = true;
                if ($m->team?->project?->academic_class_id !== null) {
                    $activeProjectClassIds[(int) $m->team->project->academic_class_id] = true;
                }
            }
        }

        $hasActiveCompetition = ($user && !$isLecturer && config('matchmaking.membership_mode', 'strict') === 'strict')
            ? $this->eligibilityService->hasActiveCompetitionMembership($user)
            : false;

        $appliedRecruitmentIds = $user && !$isLecturer
            ? Application::where('user_id', $user->id)
                ->whereIn('status', ['pending', 'under_review', 'submitted', 'accepted'])
                ->pluck('recruitment_id')
                ->flip()
                ->all()
            : [];

        $projects->getCollection()->transform(function (Project $proj) use ($user, $isLecturer, $activeProjectClassIds, $hasAnyActiveProject, $hasActiveCompetition, $enrolledClassIds, $appliedRecruitmentIds) {
            $hasCapacity = $proj->hasCapacity();
            $isMember = $user ? ($proj->isLeader($user) || ($proj->team?->hasMember($user) ?? false)) : false;
            $recruitment = $proj->team?->recruitment;
            $hasOpenRecruitment = $proj->status === ProjectStatus::Recruiting
                && $recruitment !== null
                && $recruitment->isOpen()
                && !in_array($proj->formation_status, ['team_locked', 'workspace_activated'], true);
            $hasApplied = $recruitment ? isset($appliedRecruitmentIds[$recruitment->id]) : false;
            $hasActiveInScope = $proj->academic_class_id !== null
                ? isset($activeProjectClassIds[(int) $proj->academic_class_id])
                : $hasAnyActiveProject;
            $isOutsideClass = $user && !$isLecturer && $proj->academic_class_id !== null
                && !isset($enrolledClassIds[(int) $proj->academic_class_id]);
            $canAccessWorkspace = $user ? $this->teamFormationService->canAccessWorkspace($proj, $user) : false;

            $blockReason = null;
            if (!$user) {
                $blockReason = 'Masuk sebagai mahasiswa untuk bergabung ke tim.';
            } elseif ($isLecturer) {
                $blockReason = 'Khusus mahasiswa.';
            } elseif ($isMember) {
                $blockReason = 'Sudah menjadi anggota.';
            } elseif ($hasApplied) {
                $blockReason = 'Pengajuan bergabung Anda sedang ditinjau.';
            } elseif (!$hasOpenRecruitment) {
                $blockReason = 'Rekrutmen tim tidak sedang dibuka.';
            } elseif (!$hasCapacity) {
                $blockReason = 'Kapasitas anggota tim sudah penuh.';
            } elseif ($isOutsideClass) {
                $blockReason = 'Khusus mahasiswa yang terdaftar di kelas proyek ini.';
            } elseif ($hasActiveInScope) {
                $blockReason = $proj->academic_class_id
                    ? 'Sudah tergabung dalam proyek aktif lain di kelas ini (Aturan 1 Mahasiswa 1 Proyek Aktif).'
                    : 'Sudah tergabung dalam proyek aktif lain (Aturan 1 Mahasiswa 1 Proyek Aktif).';
            } elseif ($hasActiveCompetition) {
                $blockReason = 'Sudah memiliki tim kompetisi aktif (Aturan Mode Ketat).';
            }

            $proj->setAttribute('has_capacity', $hasCapacity);
            $proj->setAttribute('is_member', $isMember);
            $proj->setAttribute('has_applied', $hasApplied);
            $proj->setAttribute('has_open_recruitment', $hasOpenRecruitment);
            $proj->setAttribute('can_access_workspace', $canAccessWorkspace);
            $proj->setAttribute('has_active_in_scope', $hasActiveInScope);
            $proj->setAttribute('is_class_restricted', $isOutsideClass);
            $proj->setAttribute('can_apply', $user && !$isLecturer && !$isMember && !$hasApplied && $hasOpenRecruitment && $hasCapacity && $blockReason === null);
            $proj->setAttribute('apply_block_reason', $blockReason);

            return $proj;
        });

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'filters' => $request->only(['search', 'category', 'status']),
            'categories' => ProjectCategory::values(),
            'statuses' => ProjectStatus::values(),
            'userHasActiveProject' => $hasAnyActiveProject,
            'isLecturer' => $isLecturer,
            'isGuest' => !$user,
        ]);
    }

    private function resolveProject(string|int $idOrSlug, array $relations = []): Project
    {
        $query = Project::query();
        if (!empty($relations)) {
            $query->with($relations);
        }

        return $query->where(function ($q) use ($idOrSlug) {
            if (is_numeric($idOrSlug)) {
                $q->where('id', (int) $idOrSlug)->orWhere('slug', $idOrSlug);
            } else {
                $q->where('slug', $idOrSlug);
            }
        })->firstOrFail();
    }

    public function show(Request $request, string|int $id): Response
    {
        DemoProjectAligner::alignOnce();
        $user = $request->user();
        $project = $this->resolveProject($id, [
            'leader:id,name,email',
            'formationApprover:id,name',
            'academicClass.lecturer:id,name,email',
            'academicClass.coLecturers:id,name,email',
            'campus:id,name,slug',
            'skills',
            'team.members.user:id,name,email',
            'team.recruitment.roles',
            'participations.competition:id,name,slug',
        ]);

        // Auto-heal / synchronize accepted applicants into team_members if missing
        if ($project->team && $project->team->recruitment) {
            $acceptedApps = Application::where('recruitment_id', $project->team->recruitment->id)
                ->whereIn('status', [\App\Enums\ApplicationStatus::Accepted->value, 'accepted'])
                ->with('role')
                ->get();

            $needsReload = false;
            foreach ($acceptedApps as $acceptedApp) {
                $exists = TeamMember::where('team_id', $project->team->id)
                    ->where('user_id', $acceptedApp->user_id)
                    ->exists();

                if (!$exists) {
                    TeamMember::create([
                        'team_id' => $project->team->id,
                        'user_id' => $acceptedApp->user_id,
                        'permission' => 'member',
                        'status' => 'active',
                        'role_name' => $acceptedApp->role?->name ?? 'Kolaborator Proyek',
                        'recruitment_role_id' => $acceptedApp->recruitment_role_id,
                        'joined_at' => $acceptedApp->decided_at ?? now(),
                    ]);
                    $needsReload = true;
                }
            }

            if ($needsReload) {
                $project->load(['team.members.user:id,name,email']);
            }
        }

        if ($user) {
            $this->authorize('view', $project);
        } else {
            if ($project->status === ProjectStatus::Draft || $project->visibility !== Visibility::Public || $project->moderation_status !== 'visible') {
                abort(404);
            }
        }

        $isBookmarked = $user ? Bookmark::where('user_id', $user->id)
            ->where('bookmarkable_type', Project::class)
            ->where('bookmarkable_id', $project->id)
            ->exists() : false;

        $isLeader = $user ? $project->isLeader($user) : false;
        $isLecturer = $user ? (
            $user->isLecturer()
            || ($project->academicClass && $project->academicClass->isLecturer($user))
            || $project->primary_supervisor_id === $user->id
            || $user->isPlatformAdmin()
            || $user->isCampusAdmin()
        ) : false;
        $isLecturerAccount = $isLecturer;
        $userHasActiveProject = $user ? $user->hasActiveProject($project->academic_class_id) : false;

        $applications = [];
        if ($isLeader && $project->team?->recruitment) {
            $applications = Application::where('recruitment_id', $project->team->recruitment->id)
                ->with(['user:id,name,email', 'role:id,name'])
                ->latest()
                ->get();
        }

        // 1. Living Proposal & Version History (Continuous Development)
        $livingProposal = \App\Models\ProjectProposal::ensureForProject($project);
        $livingProposal->load([
            'currentVersion.creator:id,name',
            'currentVersion.reviewer:id,name',
            'versions.creator:id,name',
            'versions.reviewer:id,name',
            'approver:id,name',
        ]);

        // 2. Assessment Periods (UTS, UAS, and Rubrics)
        $assessmentService = app(\App\Services\Assessment\AssessmentService::class);
        $assessmentPeriods = [];
        if ($project->academicClass) {
            $assessmentPeriods = $assessmentService->ensureDefaultPeriodsForClass($project->academicClass);
        } else {
            $assessmentPeriods = \App\Models\AssessmentPeriod::where('campus_id', $project->campus_id)
                ->whereNull('academic_class_id')
                ->with('rubrics')
                ->get();
        }

        // 3. Project Submissions & Immutable Snapshots
        $submissions = \App\Models\ProjectSubmission::where('project_id', $project->id)
            ->with([
                'assessmentPeriod.rubrics',
                'submitter:id,name',
                'evaluator:id,name',
                'documents.uploader:id,name',
                'snapshots.submitter:id,name',
                'snapshots.documents',
                'reviews.reviewer:id,name',
            ])
            ->get();

        // 4. Project Implementation Management (Tasks & Kanban)
        $team = $project->team;
        $tasks = $team
            ? \App\Models\Task::where('team_id', $team->id)
                ->with(['assignee:id,name', 'milestone:id,title', 'comments.user:id,name'])
                ->orderBy('position', 'asc')
                ->get()
            : collect();

        $kanban = [
            'todo' => $tasks->where('status', \App\Enums\TaskStatus::Todo)->values(),
            'in_progress' => $tasks->where('status', \App\Enums\TaskStatus::InProgress)->values(),
            'in_review' => $tasks->where('status', \App\Enums\TaskStatus::InReview)->values(),
            'completed' => $tasks->where('status', \App\Enums\TaskStatus::Completed)->values(),
        ];

        // 5. Milestones
        $milestones = $team
            ? $team->milestones()
                ->withCount(['tasks', 'tasks as completed_tasks_count' => fn ($q) => $q->where('status', 'completed')])
                ->orderBy('starts_on')
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'title' => $m->title,
                    'description' => $m->description,
                    'status' => $m->status,
                    'starts_on' => $m->starts_on?->format('d M Y'),
                    'due_on' => $m->due_on?->format('d M Y'),
                    'tasks_count' => $m->tasks_count,
                    'completed_tasks_count' => $m->completed_tasks_count,
                    'progress' => $m->tasks_count > 0 ? (int) round(($m->completed_tasks_count / $m->tasks_count) * 100) : 0,
                ])
            : collect();

        // 6. Activities & Discussions
        $activities = $team
            ? ActivityLog::where('team_id', $team->id)->with('actor:id,name')->latest('created_at')->take(20)->get()
            : collect();

        $posts = $team
            ? \App\Models\TeamPost::where('team_id', $team->id)->with('author:id,name')->latest('created_at')->take(20)->get()
            : collect();

        // 7. Academic Guidances & Supervision Notes
        $guidances = $project->academic_class_id
            ? \App\Models\AcademicClassGuidance::where('academic_class_id', $project->academic_class_id)
                ->where(function ($q) use ($project) {
                    $q->whereNull('project_id')->orWhere('project_id', $project->id);
                })
                ->with('lecturer:id,name')
                ->latest()
                ->get()
            : collect();

        // 8. Progress Calculation
        $implementationProgress = $project->calculateImplementationProgress();

        // 9. Portfolio Achievements (If project completed)
        $achievements = \App\Models\Achievement::where('project_id', $project->id)
            ->with(['user:id,name,email', 'verifier:id,name'])
            ->get();

        // 10. Smart Matchmaking & Team Balance Analysis (Strictly Class-Based)
        $teamBalance = $this->teamBalanceService->analyzeTeamBalance($project);
        $teamOptimization = ($isLeader || $isLecturer)
            ? $this->teamOptimizationService->optimizeTeam($project)
            : null;

        $sameClassCandidates = ($isLeader || $isLecturer)
            ? $this->matchmakingEngine->recommendCandidatesForProject($project, 25)
            : [];

        // Class students list for Mode A manual teammate search
        $classStudents = collect();
        if ($project->academicClass) {
            $rawStudents = $project->academicClass->students()
                ->with(['profile.skills', 'teamMemberships' => fn ($q) => $q->where('status', 'active')])
                ->wherePivot('status', 'enrolled')
                ->get();

            $activeStudentIds = \App\Models\TeamMember::where('status', 'active')
                ->whereIn('user_id', $rawStudents->pluck('id'))
                ->whereHas('team.project', function ($query) {
                    $query->whereNotIn('status', [
                        ProjectStatus::Archived->value,
                        ProjectStatus::Completed->value,
                    ]);
                })
                ->pluck('user_id')
                ->flip();

            $teamMemberIds = $project->team && $project->team->relationLoaded('members')
                ? $project->team->members->pluck('user_id')->flip()
                : ($project->team ? $project->team->members()->pluck('user_id')->flip() : collect());

            $classStudents = $rawStudents->map(function ($s) use ($project, $activeStudentIds, $teamMemberIds) {
                $hasActive = isset($activeStudentIds[$s->id]);
                $isMember = isset($teamMemberIds[$s->id]);
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'email' => $s->email,
                    'avatar' => $s->avatar,
                    'student_number' => $s->student_number ?? $s->pivot?->student_number ?? '',
                    'study_program' => $s->profile?->study_program ?? 'Teknik Informatika',
                    'semester' => $s->profile?->semester ?? 4,
                    'availability_hours' => $s->profile?->availability_hours ?? 10,
                    'preferred_roles' => $s->profile?->preferred_roles ?? [],
                    'interests' => $s->profile?->interests ?? [],
                    'skills' => $s->profile ? $s->profile->skills->map(fn ($sk) => [
                        'name' => $sk->name,
                        'proficiency' => $sk->pivot?->proficiency ?? 1,
                    ])->all() : [],
                    'has_active_project' => $hasActive,
                    'is_member' => $isMember,
                    'is_leader' => $project->leader_id === $s->id,
                ];
            });
        }

        // Sent and Received Invitations
        $sentInvitations = $project->team
            ? Invitation::where('team_id', $project->team->id)
                ->with(['invitee.profile.skills', 'role'])
                ->latest()
                ->get()
            : collect();

        $receivedInvitations = $user
            ? Invitation::where('invitee_id', $user->id)
                ->where('status', InvitationStatus::Pending->value)
                ->with(['team.project', 'inviter'])
                ->latest()
                ->get()
            : collect();

        $canAccessWorkspace = $user ? $this->teamFormationService->canAccessWorkspace($project, $user) : false;

        $recruitment = $project->team?->recruitment;
        $hasOpenRecruitment = $project->status === ProjectStatus::Recruiting
            && $recruitment !== null
            && $recruitment->isOpen()
            && !in_array($project->formation_status, ['team_locked', 'workspace_activated'], true);

        $project->setAttribute('has_capacity', $project->hasCapacity());
        $project->setAttribute('has_open_recruitment', $hasOpenRecruitment);
        $isLecturerAccount = $isLecturer || ($user ? ($user->isLecturer() || $user->isPlatformAdmin() || $user->isCampusAdmin()) : false);
        $isMember = $user ? ($project->isLeader($user) || ($project->team?->hasMember($user) ?? false)) : false;
        $myApplication = ($user && $recruitment)
            ? Application::where('recruitment_id', $recruitment->id)
                ->where('user_id', $user->id)
                ->with('role:id,name')
                ->latest('id')
                ->first()
            : null;
        $eligibility = ($user && !$isLecturerAccount && !$isLecturer && !$isMember)
            ? $this->eligibilityService->checkStudentEligibility($user, $project)
            : ['eligible' => false, 'reason' => null];

        return Inertia::render('projects/show', [
            'project' => $project,
            'isBookmarked' => $isBookmarked,
            'isLeader' => $isLeader,
            'isLecturer' => $isLecturer,
            'isLecturerAccount' => $isLecturerAccount,
            'isMember' => $isMember,
            'userHasActiveProject' => $userHasActiveProject,
            'myApplication' => $myApplication,
            'eligibility' => $eligibility,
            'canEdit' => $user ? $user->can('update', $project) : false,
            'applications' => $applications,
            'livingProposal' => $livingProposal,
            'assessmentPeriods' => $assessmentPeriods,
            'submissions' => $submissions,
            'kanban' => $kanban,
            'milestones' => $milestones,
            'activities' => $activities,
            'discussions' => $posts,
            'guidances' => $guidances,
            'implementationProgress' => $implementationProgress,
            'achievements' => $achievements,
            'teamBalance' => $teamBalance,
            'teamOptimization' => $teamOptimization,
            'sameClassCandidates' => $sameClassCandidates,
            'classStudents' => $classStudents,
            'sentInvitations' => $sentInvitations,
            'receivedInvitations' => $receivedInvitations,
            'canAccessWorkspace' => $canAccessWorkspace,
        ]);
    }

    public function create(Request $request): Response|\Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        if (! $user->isPlatformAdmin() && ! $user->isStudent()) {
            $msg = 'Fitur Buat Proyek Perkuliahan hanya tersedia untuk akun mahasiswa.';
            if ($request->wantsJson()) {
                return response()->json(['message' => $msg], 403);
            }

            return redirect()->route('projects.index')->with('error', $msg);
        }

        $enrolledClasses = $user->enrolledClasses()
            ->wherePivot('status', 'enrolled')
            ->get([
                'academic_classes.id',
                'academic_classes.name',
                'academic_classes.code',
                'academic_classes.target_team_size',
            ]);

        return Inertia::render('projects/create', [
            'categories' => ProjectCategory::values(),
            'visibilities' => Visibility::values(),
            'enrolledClasses' => $enrolledClasses,
            'selectedClassId' => $request->integer('academic_class_id') ?: null,
            'userHasActiveProject' => $user->isPlatformAdmin() ? false : $user->hasActiveProject(),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('login');
        }

        $validated = $request->validate([
            'academic_class_id' => ['required', 'integer', 'exists:academic_classes,id'],
            'title' => ['required', 'string', 'max:255'],
            'short_description' => ['required', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'category' => ['required', Rule::enum(ProjectCategory::class)],
            'problem_statement' => ['nullable', 'string'],
            'objectives' => ['nullable', 'string'],
            'proposed_solution' => ['nullable', 'string'],
            'tech_stack' => ['nullable', 'array'],
            'tech_stack.*' => ['string', 'max:50'],
            'visibility' => ['nullable', Rule::enum(Visibility::class)],
            'capacity' => ['nullable', 'integer', 'min:2', 'max:15'],
            'expected_weekly_hours' => ['nullable', 'integer', 'min:1', 'max:40'],
            'starts_on' => ['nullable', 'date'],
            'target_completion_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'required_skills' => ['nullable', 'array'],
            'required_skills.*.name' => ['required', 'string', 'max:80'],
            'required_skills.*.min_proficiency' => ['nullable', 'integer', 'min:1', 'max:5'],
            'team_name' => ['nullable', 'string', 'max:100'],
        ]);

        $academicClass = AcademicClass::findOrFail($validated['academic_class_id']);
        $activeCampusId = $academicClass->campus_id;

        if (! $user->isPlatformAdmin() && ! $user->isStudent($academicClass->campus_id)) {
            abort(403, 'Hanya mahasiswa peserta kelas yang dapat membentuk kelompok.');
        }

        $requestedCapacity = $validated['capacity'] ?? $academicClass->target_team_size;
        if ($requestedCapacity > $academicClass->target_team_size) {
            $message = "Batas anggota kelompok untuk kelas ini adalah {$academicClass->target_team_size} orang.";
            if ($request->wantsJson()) {
                return response()->json(['message' => $message], 422);
            }

            return back()->withErrors(['capacity' => $message]);
        }

        // Class Boundary Check: Must be enrolled in this academic class
        $isEnrolled = $user->enrolledClasses()
            ->where('academic_classes.id', $academicClass->id)
            ->wherePivot('status', 'enrolled')
            ->exists();

        if (! $isEnrolled && ! $user->isPlatformAdmin()) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Anda hanya dapat membuat proyek pada kelas perkuliahan tempat Anda terdaftar sebagai mahasiswa aktif.'], 422);
            }
            return back()->withErrors(['academic_class_id' => 'Anda hanya dapat membuat proyek pada kelas perkuliahan tempat Anda terdaftar sebagai mahasiswa aktif (Batas Kelas Ketat).']);
        }

        // Rule 1: One student, one active project
        if ($user->hasActiveProject()) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Anda sudah tergabung dalam proyek aktif lain. Selesaikan proyek saat ini terlebih dahulu.'], 422);
            }
            return back()->withErrors(['title' => 'Anda sudah tergabung dalam proyek aktif lain. Selesaikan proyek sebelumnya sebelum membuat proyek baru.']);
        }

        $project = DB::transaction(function () use ($validated, $user, $activeCampusId, $academicClass, $requestedCapacity) {
            $slug = Str::slug($validated['title']) . '-' . Str::lower(Str::random(6));

            $project = Project::create([
                'campus_id' => $activeCampusId,
                'academic_class_id' => $academicClass->id,
                'max_team_size' => $requestedCapacity,
                'leader_id' => $user->id,
                'title' => $validated['title'],
                'slug' => $slug,
                'short_description' => $validated['short_description'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'],
                'problem_statement' => $validated['problem_statement'] ?? null,
                'objectives' => $validated['objectives'] ?? null,
                'proposed_solution' => $validated['proposed_solution'] ?? null,
                'tech_stack' => $validated['tech_stack'] ?? [],
                'visibility' => $validated['visibility'] ?? Visibility::Campus,
                'status' => ProjectStatus::Recruiting,
                'formation_status' => 'requirements_configured',
                'expected_weekly_hours' => $validated['expected_weekly_hours'] ?? 10,
                'progress' => 0,
                'starts_on' => $validated['starts_on'] ?? now(),
                'target_completion_on' => $validated['target_completion_on'] ?? null,
            ]);

            // Create primary Team for this project
            $team = Team::create([
                'campus_id' => $activeCampusId,
                'project_id' => $project->id,
                'leader_id' => $user->id,
                'type' => TeamType::Project,
                'name' => !empty($validated['team_name']) ? trim($validated['team_name']) : ($project->title . ' Core Team'),
                'description' => 'Tim proyek ' . $project->title,
                'capacity' => $requestedCapacity,
            ]);

            // Add creator as Team Leader
            TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $user->id,
                'permission' => TeamPermission::Leader,
                'status' => 'active',
                'role_name' => 'Project Leader',
                'joined_at' => now(),
            ]);

            // Create default recruitment & open roles for the team
            $recruitment = Recruitment::create([
                'campus_id' => $activeCampusId,
                'team_id' => $team->id,
                'title' => 'Rekrutmen Terbuka ' . $project->title,
                'description' => 'Rekrutmen anggota tim untuk proyek ' . $project->title,
                'status' => RecruitmentStatus::Open,
            ]);

            if (!empty($validated['required_skills'])) {
                foreach (array_slice($validated['required_skills'], 0, 3) as $req) {
                    RecruitmentRole::create([
                        'recruitment_id' => $recruitment->id,
                        'name' => $req['name'] . ' Specialist',
                        'slots' => 1,
                    ]);
                }
            } else {
                RecruitmentRole::create([
                    'recruitment_id' => $recruitment->id,
                    'name' => 'Frontend / UI Developer',
                    'slots' => 1,
                ]);
                RecruitmentRole::create([
                    'recruitment_id' => $recruitment->id,
                    'name' => 'Backend Developer',
                    'slots' => 1,
                ]);
            }

            // Attach required skills
            if (!empty($validated['required_skills'])) {
                $skillData = [];
                foreach ($validated['required_skills'] as $req) {
                    $skill = Skill::resolve($req['name'], SkillType::Technical);
                    $skillData[$skill->id] = ['min_proficiency' => $req['min_proficiency'] ?? 1];
                }
                $project->skills()->sync($skillData);
            }

            ActivityLog::log(
                $activeCampusId,
                $team->id,
                $user->id,
                'project_created',
                $project
            );

            // Initialize Living Proposal (v1)
            \App\Models\ProjectProposal::ensureForProject($project);

            if ($project->academicClass) {
                app(\App\Services\Assessment\AssessmentService::class)->ensureDefaultPeriodsForClass($project->academicClass);
            }

            return $project;
        });

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Proyek berhasil dibuat.',
                'data' => $project->load(['team', 'skills']),
            ], 201);
        }

        return redirect()->route('projects.show', $project->slug ?? $project->id);
    }

    public function apply(Request $request, string|int $id)
    {
        $user = $request->user();
        if (!$user) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Silakan masuk terlebih dahulu.'], 401);
            }
            return redirect()->route('login');
        }

        if ($user->isLecturer() || $user->isPlatformAdmin() || $user->isCampusAdmin()) {
            $msg = 'Hanya akun mahasiswa yang dapat melamar bergabung ke tim proyek.';
            return $request->wantsJson()
                ? response()->json(['message' => $msg], 403)
                : back()->with('error', $msg);
        }

        $project = $this->resolveProject($id, ['team.recruitment.roles']);

        $validated = $request->validate([
            'recruitment_role_id' => ['nullable', 'integer'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $roles = $project->team?->recruitment?->roles ?? collect();
        $role = null;
        if (!empty($validated['recruitment_role_id'])) {
            $role = $roles->firstWhere('id', (int) $validated['recruitment_role_id']);
            if (!$role) {
                $msg = 'Posisi yang dipilih tidak valid untuk rekrutmen proyek ini.';
                return $request->wantsJson()
                    ? response()->json(['message' => $msg, 'errors' => ['recruitment_role_id' => [$msg]]], 422)
                    : back()->withErrors(['recruitment_role_id' => $msg]);
            }
        } elseif ($roles->count() > 0) {
            $role = $roles->first();
        }

        try {
            $this->membershipService->applyToProject($user, $project, $role, $validated['message'] ?? null);
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Lamaran kamu berhasil dikirim ke ketua tim!']);
            }
            return back()->with('success', 'Lamaran kamu berhasil dikirim ke ketua tim!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => collect($e->errors())->flatten()->first() ?? 'Lamaran tidak dapat dikirim.',
                    'errors' => $e->errors(),
                ], 422);
            }
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
            return back()->with('error', $e->getMessage());
        }
    }

    public function toggleRecruitment(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team.recruitment']);

        if (!$project->isLeader($user) && !$user->isPlatformAdmin()) {
            abort(403, 'Hanya ketua tim yang dapat mengubah status rekrutmen proyek.');
        }

        if ($project->status !== ProjectStatus::Recruiting || in_array($project->formation_status, ['team_locked', 'workspace_activated'], true)) {
            $msg = 'Status rekrutmen tidak dapat diubah setelah formasi tim dikunci atau workspace aktif.';
            return $request->wantsJson()
                ? response()->json(['message' => $msg], 422)
                : back()->with('error', $msg);
        }

        $team = $project->team;
        if (!$team) {
            $msg = 'Tim proyek belum tersedia.';
            return $request->wantsJson()
                ? response()->json(['message' => $msg], 422)
                : back()->with('error', $msg);
        }

        $validated = $request->validate([
            'status' => ['nullable', 'string', 'in:open,closed'],
        ]);

        $recruitment = $team->recruitment;
        $isCurrentlyOpen = $recruitment !== null && $recruitment->isOpen();
        $targetStatus = isset($validated['status'])
            ? RecruitmentStatus::from($validated['status'])
            : ($isCurrentlyOpen ? RecruitmentStatus::Closed : RecruitmentStatus::Open);

        DB::transaction(function () use ($project, $team, $recruitment, $targetStatus, $user) {
            if (!$recruitment) {
                $recruitment = Recruitment::create([
                    'campus_id' => $team->campus_id,
                    'team_id' => $team->id,
                    'title' => 'Rekrutmen Terbuka ' . $project->title,
                    'status' => $targetStatus,
                ]);
            } else {
                $updates = ['status' => $targetStatus];
                if ($targetStatus === RecruitmentStatus::Open && $recruitment->closes_at?->isPast()) {
                    $updates['closes_at'] = null;
                }
                $recruitment->update($updates);
            }

            if ($targetStatus === RecruitmentStatus::Closed && $project->formation_status === 'matchmaking_open') {
                $project->update(['formation_status' => 'requirements_configured']);
            } elseif ($targetStatus === RecruitmentStatus::Open && in_array($project->formation_status, [null, 'draft', 'requirements_configured'], true)) {
                $project->update(['formation_status' => 'matchmaking_open']);
            }

            MatchingAuditLog::log(
                $targetStatus === RecruitmentStatus::Open ? 'recruitment_opened' : 'recruitment_closed',
                ['project_id' => $project->id, 'recruitment_id' => $recruitment->id],
                $project->academic_class_id,
                $project->id,
                $user->id
            );
        });

        $message = $targetStatus === RecruitmentStatus::Open
            ? 'Rekrutmen terbuka berhasil dibuka kembali.'
            : 'Rekrutmen anggota berhasil ditutup.';

        if ($request->wantsJson()) {
            return response()->json([
                'message' => $message,
                'status' => $targetStatus->value,
            ]);
        }

        return back()->with('success', $message);
    }

    public function respondApplication(Request $request, string|int $id, int $applicationId)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team.members']);

        if (!$project->isLeader($user) && !$user->isPlatformAdmin()) {
            abort(403, 'Hanya ketua tim yang dapat memproses lamaran.');
        }

        $application = Application::with(['user', 'role', 'recruitment.team'])->findOrFail($applicationId);

        if ((int) $application->recruitment?->team?->project_id !== (int) $project->id) {
            abort(404);
        }

        if ($application->status !== \App\Enums\ApplicationStatus::Pending) {
            $msg = 'Lamaran ini sudah diproses.';
            return $request->wantsJson()
                ? response()->json(['message' => $msg], 422)
                : back()->with('error', $msg);
        }

        $action = $request->input('action', 'accept'); // 'accept' or 'reject'

        try {
            if ($action === 'accept') {
                $this->membershipService->acceptApplication(
                    $application,
                    $user,
                    $request->input('note', 'Diterima oleh ketua tim.')
                );
                $msg = "Mahasiswa {$application->user->name} resmi bergabung dengan tim!";
                return $request->wantsJson()
                    ? response()->json(['message' => $msg])
                    : back()->with('success', $msg);
            } else {
                $this->membershipService->rejectApplication(
                    $application,
                    $user,
                    $request->input('note', 'Mohon maaf, posisi saat ini belum sesuai.')
                );
                $msg = 'Lamaran telah ditolak.';
                return $request->wantsJson()
                    ? response()->json(['message' => $msg])
                    : back()->with('info', $msg);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => collect($e->errors())->flatten()->first() ?? 'Lamaran tidak dapat diproses.',
                    'errors' => $e->errors(),
                ], 422);
            }
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
            return back()->with('error', $e->getMessage());
        }
    }

    public function activateTeam(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team.members', 'academicClass']);

        $isLeader = $project->isLeader($user);
        $isLecturer = ($project->academicClass && $project->academicClass->isLecturer($user))
            || $project->primary_supervisor_id === $user->id;

        if (! $isLeader && ! $isLecturer && ! $user->isPlatformAdmin()) {
            abort(403, 'Hanya ketua tim atau dosen pembimbing yang dapat mengaktifkan kelompok.');
        }

        DB::transaction(function () use ($project, $user) {
            $project->update([
                'status' => ProjectStatus::InProgress->value,
                'formation_status' => 'workspace_activated',
            ]);

            if ($project->team) {
                $project->team->update(['status' => 'active']);

                // Ensure all members are active
                $project->team->members()->update(['status' => 'active']);

                // Close recruitment using canonical status column
                $project->team->recruitment?->update(['status' => RecruitmentStatus::Closed]);

                // Create initial milestones if none exist
                TeamFormationService::ensureStarterMilestones($project, $user);
            }

            $teamId = $project->team?->id;

            MatchingAuditLog::log(
                'team_activated',
                ['project_id' => $project->id, 'team_id' => $teamId],
                $project->academic_class_id,
                $project->id,
                $user->id
            );
        });

        $teamId = $project->team?->id;

        return redirect()->route('workspace.show', ['teamId' => $teamId])
            ->with('success', 'Formasi kelompok berhasil dikonfirmasi dan diaktifkan! Workspace proyek telah dibuka.');
    }

    public function submitFinal(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team.members']);

        if (! $project->team?->hasMember($user) && ! $user->isPlatformAdmin()) {
            abort(403, 'Hanya anggota kelompok yang dapat mengumpulkan tugas akhir proyek.');
        }

        $validated = $request->validate([
            'repository_url' => ['nullable', 'url', 'max:255'],
            'demo_url' => ['nullable', 'url', 'max:255'],
            'submission_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $project->update([
            'repository_url' => $validated['repository_url'] ?? $project->repository_url,
            'demo_url' => $validated['demo_url'] ?? $project->demo_url,
            'submission_notes' => $validated['submission_notes'] ?? $project->submission_notes,
            'submitted_at' => now(),
            'progress' => 100,
        ]);

        MatchingAuditLog::log(
            'final_submission_submitted',
            [
                'project_id' => $project->id,
                'repository_url' => $validated['repository_url'] ?? null,
                'demo_url' => $validated['demo_url'] ?? null,
            ],
            $project->academic_class_id,
            $project->id,
            $user->id
        );

        return back()->with('success', 'Tugas akhir proyek berhasil diserahkan untuk dievaluasi oleh Dosen Pembimbing!');
    }

    public function evaluate(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team.members', 'academicClass']);

        $isLecturer = ($project->academicClass && $project->academicClass->isLecturer($user))
            || $project->primary_supervisor_id === $user->id
            || $user->isPlatformAdmin();

        if (! $isLecturer) {
            abort(403, 'Hanya dosen pembimbing atau pengampu kelas yang dapat memberikan evaluasi nilai.');
        }

        $validated = $request->validate([
            'lecturer_evaluation' => ['required', 'string', 'max:50'],
            'lecturer_notes' => ['required', 'string', 'max:2000'],
            'complete_project' => ['nullable', 'boolean'],
        ]);

        $project->update([
            'lecturer_evaluation' => $validated['lecturer_evaluation'],
            'lecturer_notes' => $validated['lecturer_notes'],
            'evaluated_at' => now(),
        ]);

        if (! empty($validated['complete_project'])) {
            $this->membershipService->completeProject($project, $user->id);

            return back()->with('success', "Evaluasi nilai {$validated['lecturer_evaluation']} berhasil disimpan. Proyek resmi dinyatakan Selesai (Completed) dan portofolio seluruh anggota tim telah diverifikasi!");
        }

        return back()->with('success', 'Catatan evaluasi bimbingan dosen berhasil disimpan.');
    }

    /**
     * Section 4: Project Team Requirements Configuration
     */
    public function updateRequirements(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['academicClass', 'team.recruitment.roles', 'team.members', 'skills']);

        $validated = $request->validate([
            'min_team_size' => ['required', 'integer', 'min:2', 'max:10'],
            'max_team_size' => ['required', 'integer', 'gte:min_team_size', 'max:10'],
            'expected_weekly_hours' => ['required', 'integer', 'min:1', 'max:40'],
            'formation_deadline' => ['nullable', 'date'],
            'roles' => ['nullable', 'array'],
            'roles.*.name' => ['required', 'string', 'max:100'],
            'roles.*.description' => ['nullable', 'string', 'max:300'],
            'roles.*.slots' => ['required', 'integer', 'min:1', 'max:5'],
            'roles.*.priority' => ['nullable', 'string', 'in:high,normal,low'],
            'roles.*.min_proficiency' => ['nullable', 'integer', 'min:1', 'max:5'],
            'skills' => ['nullable', 'array'],
            'skills.*.name' => ['required', 'string', 'max:80'],
            'skills.*.min_proficiency' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        if ($project->academicClass && $validated['max_team_size'] > $project->academicClass->target_team_size) {
            return back()->withErrors([
                'max_team_size' => "Batas maksimal anggota kelompok untuk kelas ini adalah {$project->academicClass->target_team_size} orang.",
            ]);
        }

        $activeMembersCount = $project->activeMembersCount();
        if ($validated['max_team_size'] < $activeMembersCount) {
            return back()->withErrors([
                'max_team_size' => "Kapasitas maksimal tidak boleh kurang dari jumlah anggota aktif saat ini ({$activeMembersCount} orang).",
            ]);
        }

        $this->teamFormationService->configureRequirements($project, $validated, $user);

        return back()->with('success', 'Konfigurasi kebutuhan tim dan peran proyek berhasil diperbarui.');
    }

    /**
     * Step 2: Open Matchmaking
     */
    public function openMatchmaking(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team.recruitment']);

        $this->teamFormationService->openMatchmaking($project, $user);

        return back()->with('success', 'Sesi matchmaking dan rekrutmen tim resmi dibuka!');
    }

    /**
     * Step 3: Submit Proposed Team for Lecturer Review
     */
    public function submitFormation(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team.members', 'academicClass']);

        $this->teamFormationService->submitForReview($project, $user);

        return back()->with('success', 'Susunan tim proyek berhasil diajukan untuk dievaluasi oleh Dosen Pengampu.');
    }

    /**
     * Step 4: Lecturer Reviews Team Formation (Approve, Reject, or Request Changes)
     */
    public function reviewFormation(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team.members.user', 'academicClass.coLecturers', 'academicClass.lecturer']);

        $request->merge([
            'action' => $request->input('action') ?? $request->input('decision'),
        ]);

        $validated = $request->validate([
            'action' => ['required', 'string', 'in:approve,reject,request_changes'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            if ($validated['action'] === 'approve') {
                $this->teamFormationService->approveFormation($project, $user, $validated['notes'] ?? null);
                $msg = 'Susunan tim proyek berhasil disetujui dosen! Tim kini dapat mengaktifkan workspace proyek.';
                return $request->wantsJson()
                    ? response()->json(['message' => $msg, 'formation_status' => 'lecturer_approved'])
                    : back()->with('success', $msg);
            } elseif ($validated['action'] === 'reject') {
                $reason = $validated['reason'] ?? $validated['notes'] ?? null;
                if (empty($reason)) {
                    $msg = 'Alasan penolakan susunan tim wajib diisi.';
                    return $request->wantsJson()
                        ? response()->json(['message' => $msg, 'errors' => ['reason' => [$msg]]], 422)
                        : back()->withErrors(['reason' => $msg]);
                }
                $this->teamFormationService->rejectFormation($project, $user, $reason);
                $msg = 'Susunan tim proyek ditolak. Ketua tim telah menerima status penolakan beserta alasannya.';
                return $request->wantsJson()
                    ? response()->json(['message' => $msg, 'formation_status' => 'formation_rejected'])
                    : back()->with('info', $msg);
            } elseif ($validated['action'] === 'request_changes') {
                if (empty($validated['notes'])) {
                    $msg = 'Catatan revisi susunan tim wajib diisi.';
                    return $request->wantsJson()
                        ? response()->json(['message' => $msg, 'errors' => ['notes' => [$msg]]], 422)
                        : back()->withErrors(['notes' => $msg]);
                }
                $this->teamFormationService->requestChanges($project, $user, $validated['notes']);
                $msg = 'Permintaan revisi susunan tim berhasil diteruskan ke ketua tim.';
                return $request->wantsJson()
                    ? response()->json(['message' => $msg, 'formation_status' => 'matchmaking_open'])
                    : back()->with('info', $msg);
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => collect($e->errors())->flatten()->first() ?? 'Tindakan review formasi tidak diizinkan.',
                    'errors' => $e->errors(),
                ], 422);
            }
            return back()->withErrors($e->errors());
        }

        return $request->wantsJson() ? response()->json(['message' => 'OK']) : back();
    }

    /**
     * Step 5: Activate Workspace Gatekeeper
     */
    public function activateWorkspace(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team']);

        if (! $project->isLeader($user) && ! $user->isPlatformAdmin()) {
            abort(403, 'Hanya ketua proyek yang berwenang mengaktifkan ruang kerja.');
        }

        $this->teamFormationService->activateWorkspace($project, $user);

        return redirect()->route('workspace.show', $project->team->id)
            ->with('success', 'Selamat! Ruang kerja proyek (Project Workspace) resmi aktif.');
    }

    /**
     * Demo helper: Simulate filling the team quota so user can test lecturer submission flow.
     */
    public function simulateFillTeam(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team.members', 'academicClass']);

        if (!$project->isLeader($user) && !$user->isPlatformAdmin()) {
            abort(403, 'Hanya ketua tim yang dapat melakukan simulasi pengisian tim.');
        }

        $team = $project->team;
        if (!$team) {
            return back()->with('error', 'Tim proyek belum tersedia.');
        }

        $academicClass = $project->academicClass;
        $campusId = $project->campus_id;
        $targetCapacity = $academicClass?->target_team_size ?? $project->max_team_size ?? 4;

        $currentCount = $team->members()->where('status', 'active')->count();
        $needed = $targetCapacity - $currentCount;

        if ($needed <= 0) {
            return back()->with('info', "Kapasitas tim sudah penuh ({$currentCount}/{$targetCapacity} anggota).");
        }

        $existingMemberUserIds = $team->members()->pluck('user_id')->all();
        $availableStudents = \App\Models\User::whereHas('enrolledClasses', function ($q) use ($academicClass) {
                if ($academicClass) {
                    $q->where('academic_classes.id', $academicClass->id);
                }
            })
            ->whereNotIn('id', $existingMemberUserIds)
            ->take($needed)
            ->get();

        if ($availableStudents->count() < $needed) {
            $fallbackStudents = \App\Models\User::whereHas('campusMemberships', function ($q) use ($campusId) {
                    $q->where('campus_id', $campusId)->where('role', \App\Enums\CampusRole::Student->value);
                })
                ->whereNotIn('id', array_merge($existingMemberUserIds, $availableStudents->pluck('id')->all()))
                ->take($needed - $availableStudents->count())
                ->get();
            $availableStudents = $availableStudents->merge($fallbackStudents);
        }

        $rolesToFill = ['AI / Computer Vision Specialist', 'Backend Engineer', 'Frontend Developer', 'System Analyst'];
        $roleIdx = 0;

        foreach ($availableStudents as $student) {
            \App\Models\TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $student->id,
                'permission' => \App\Enums\TeamPermission::Member,
                'role_name' => $rolesToFill[$roleIdx % count($rolesToFill)],
                'status' => 'active',
                'joined_at' => now(),
            ]);
            $roleIdx++;
        }

        return back()->with('success', "Simulasi berhasil! Formasi tim kini PENUH ({$team->members()->where('status', 'active')->count()}/{$targetCapacity} anggota). Tombol 'Ajukan ke Dosen' sekarang sudah aktif!");
    }

    /**
     * Send Project Invitation to Same-Class Student
     */
    public function sendInvitation(Request $request, string|int $id)
    {
        $user = $request->user();
        $project = $this->resolveProject($id, ['team', 'academicClass']);
        $team = $project->team;

        if (! $team) {
            abort(404, 'Tim proyek tidak ditemukan.');
        }

        $validated = $request->validate([
            'invitee_id' => ['required', 'integer', 'exists:users,id'],
            'recruitment_role_id' => ['nullable', 'integer', 'exists:recruitment_roles,id'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $invitee = User::findOrFail($validated['invitee_id']);
        $role = ! empty($validated['recruitment_role_id']) ? RecruitmentRole::find($validated['recruitment_role_id']) : null;

        $this->invitationService->sendInvitation($team, $user, $invitee, $role, $validated['message'] ?? null);

        return back()->with('success', "Undangan kolaborasi proyek berhasil dikirimkan ke {$invitee->name}!");
    }

    /**
     * Accept Project Invitation
     */
    public function acceptInvitation(Request $request, int $invitationId)
    {
        $user = $request->user();
        $invitation = Invitation::with('team.project')->findOrFail($invitationId);

        try {
            $member = $this->invitationService->acceptInvitation($invitation, $user);
            $msg = "Selamat! Anda resmi bergabung dengan tim {$invitation->team?->name}.";
            return $request->wantsJson()
                ? response()->json(['message' => $msg, 'member_id' => $member->id])
                : back()->with('success', $msg);
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => collect($e->errors())->flatten()->first() ?? 'Undangan tidak dapat diterima.',
                    'errors' => $e->errors(),
                ], 422);
            }
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Decline Project Invitation
     */
    public function declineInvitation(Request $request, int $invitationId)
    {
        $user = $request->user();
        $invitation = Invitation::findOrFail($invitationId);

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
            'declined_reason' => ['nullable', 'string', 'max:255'],
        ]);

        $reason = $validated['reason'] ?? $validated['declined_reason'] ?? null;

        try {
            $this->invitationService->declineInvitation($invitation, $user, $reason);
            $msg = 'Undangan kolaborasi tim telah ditolak.';
            return $request->wantsJson()
                ? response()->json(['message' => $msg])
                : back()->with('info', $msg);
        } catch (\Illuminate\Validation\ValidationException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'message' => collect($e->errors())->flatten()->first() ?? 'Undangan tidak dapat ditolak.',
                    'errors' => $e->errors(),
                ], 422);
            }
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json(['message' => $e->getMessage()], 422);
            }
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel Sent Project Invitation
     */
    public function cancelInvitation(Request $request, int $invitationId)
    {
        $user = $request->user();
        $invitation = Invitation::findOrFail($invitationId);

        $this->invitationService->cancelInvitation($invitation, $user);

        return back()->with('info', 'Undangan proyek berhasil dibatalkan.');
    }
}
