<?php

namespace App\Http\Controllers\Web;

use App\Enums\AchievementType;
use App\Enums\AchievementVerification;
use App\Enums\ApplicationStatus;
use App\Enums\CompetitionCategory;
use App\Enums\CompetitionScope;
use App\Enums\CompetitionStatus;
use App\Enums\DeliverableStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\RoundStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamStatus;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Application;
use App\Models\Bookmark;
use App\Models\Competition;
use App\Models\CompetitionAllocation;
use App\Models\CompetitionDocument;
use App\Models\CompetitionMentor;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionResult;
use App\Models\CompetitionRound;
use App\Models\CompetitionSource;
use App\Models\CompetitionStatusHistory;
use App\Models\Invitation;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Task;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Matchmaking\CompetitionDeliverableService;
use App\Services\Matchmaking\CompetitionManagementService;
use App\Services\Matchmaking\CompetitionMatchmakingService;
use App\Services\Matchmaking\CompetitionRoundService;
use App\Services\Matchmaking\CompetitionTeamFormationService;
use App\Services\Storage\ObjectStorageService;
use App\Services\Matchmaking\CompetitionVerificationService;
use App\Services\Matchmaking\EligibilityService;
use App\Services\Matchmaking\MembershipService;
use App\Services\Matchmaking\UnifiedMembershipService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CompetitionWebController extends Controller
{
    public function __construct(
        protected MembershipService $membershipService,
        protected CompetitionMatchmakingService $matchmakingService,
        protected CompetitionManagementService $managementService,
        protected CompetitionVerificationService $verificationService,
        protected CompetitionTeamFormationService $teamFormationService,
        protected CompetitionRoundService $roundService,
        protected CompetitionDeliverableService $deliverableService,
        protected UnifiedMembershipService $unifiedMembershipService,
        protected EligibilityService $eligibilityService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = Competition::visibleTo($user)
            ->with(['sources', 'campus:id,name', 'rounds']);

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status')) {
            $statusVal = $request->input('status');
            if ($statusVal === 'open') {
                $query->where('registration_deadline', '>=', now());
            } elseif ($statusVal === 'closing_soon') {
                $query->where('registration_deadline', '>=', now())
                      ->where('registration_deadline', '<=', now()->addDays(7));
            } elseif ($statusVal === 'closed') {
                $query->where('registration_deadline', '<', now());
            } else {
                $query->where('status', $statusVal);
            }
        }

        if ($request->filled('level')) {
            $query->where('level', $request->input('level'));
        }

        if ($request->filled('type')) {
            $query->where('competition_type', $request->input('type'));
        }

        if ($request->filled('format')) {
            $fmt = $request->input('format');
            $query->where(function ($q) use ($fmt) {
                $q->where('competition_type', 'like', '%' . $fmt . '%')
                  ->orWhere('description', 'like', '%' . $fmt . '%');
            });
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('organizer', 'like', $search)
                  ->orWhere('description', 'like', $search);
            });
        }

        $sort = $request->input('sort', 'deadline_asc');
        if ($sort === 'deadline_desc') {
            $query->orderBy('registration_deadline', 'desc');
        } elseif ($sort === 'latest') {
            $query->latest('created_at');
        } else {
            $query->orderByRaw('CASE WHEN registration_deadline >= NOW() THEN 0 ELSE 1 END')
                  ->orderBy('registration_deadline', 'asc');
        }

        $competitions = $query->paginate(12)->withQueryString();

        // MinSatu-Style Flow: Open recruiting competition teams
        $recruitingQuery = CompetitionParticipation::where('is_formation_locked', false)
            ->whereIn('stage', ['recruiting', 'team_formation'])
            ->whereHas('competition', function ($q) use ($user) {
                $q->visibleTo($user);
            })
            ->with([
                'competition:id,name,slug,organizer,category,level,registration_deadline,min_team_size,max_team_size,cover_image,official_url,registration_url,competition_type,description',
                'team.leader.profile',
                'team.members.user:id,name,avatar',
                'team.recruitment.roles',
                'team.recruitment.applications' => function ($q) use ($user) {
                    if ($user) {
                        $q->where('user_id', $user->id);
                    }
                },
            ])
            ->latest();

        if ($request->filled('team_search')) {
            $tSearch = '%' . $request->input('team_search') . '%';
            $recruitingQuery->where(function ($q) use ($tSearch) {
                $q->whereHas('team', function ($tq) use ($tSearch) {
                    $tq->where('name', 'like', $tSearch)
                       ->orWhere('description', 'like', $tSearch);
                })->orWhereHas('competition', function ($cq) use ($tSearch) {
                    $cq->where('name', 'like', $tSearch)
                       ->orWhere('organizer', 'like', $tSearch);
                });
            });
        }

        if ($request->filled('team_category')) {
            $recruitingQuery->whereHas('competition', function ($q) use ($request) {
                $q->where('category', $request->input('team_category'));
            });
        }

        if ($request->filled('team_role')) {
            $roleSearch = '%' . $request->input('team_role') . '%';
            $recruitingQuery->whereHas('team.recruitment.roles', function ($q) use ($roleSearch) {
                $q->where('name', 'like', $roleSearch);
            });
        }

        $openRecruitingTeams = $recruitingQuery->get()->map(function ($part) use ($user) {
            $team = $part->team;
            $myApplication = null;
            if ($user && $team && $team->recruitment) {
                $myApplication = $team->recruitment->applications->first();
            }

            $isMember = $user && $team ? $team->hasMember($user) : false;
            $isLeader = $user && $team ? $team->isLeader($user) : false;

            return [
                'id' => $part->id,
                'stage' => $part->stage,
                'category_track' => $part->category_track,
                'competition' => [
                    'id' => $part->competition->id,
                    'name' => $part->competition->name,
                    'slug' => $part->competition->slug,
                    'organizer' => $part->competition->organizer,
                    'category' => $part->competition->category,
                    'level' => $part->competition->level,
                    'competition_type' => $part->competition->competition_type ?? 'Hybrid',
                    'official_url' => $part->competition->official_url,
                    'registration_url' => $part->competition->registration_url,
                    'description' => $part->competition->description,
                    'registration_deadline' => $part->competition->registration_deadline,
                    'min_team_size' => $part->competition->min_team_size,
                    'max_team_size' => $part->competition->max_team_size,
                    'cover_image' => $part->competition->cover_image,
                ],
                'team' => $team ? [
                    'id' => $team->id,
                    'name' => $team->name,
                    'description' => $team->description,
                    'capacity' => $team->capacity,
                    'leader' => $team->leader ? [
                        'id' => $team->leader->id,
                        'name' => $team->leader->name,
                        'avatar' => $team->leader->avatar,
                        'study_program' => $team->leader->profile?->study_program ?? 'Mahasiswa',
                        'phone' => $team->leader->profile?->phone,
                    ] : null,
                    'members_count' => $team->members->count(),
                    'members' => $team->members->map(fn ($m) => [
                        'id' => $m->id,
                        'user_id' => $m->user_id,
                        'name' => $m->user?->name,
                        'avatar' => $m->user?->avatar,
                        'role_name' => $m->role_name,
                    ]),
                    'recruitment' => $team->recruitment ? [
                        'id' => $team->recruitment->id,
                        'title' => $team->recruitment->title,
                        'description' => $team->recruitment->description,
                        'status' => $team->recruitment->status,
                        'roles' => $team->recruitment->roles->map(fn ($r) => [
                            'id' => $r->id,
                            'name' => $r->name,
                            'slots' => $r->slots,
                            'requirements' => $r->requirements,
                        ]),
                    ] : null,
                ] : null,
                'is_member' => $isMember,
                'is_leader' => $isLeader,
                'my_application' => $myApplication ? [
                    'id' => $myApplication->id,
                    'status' => $myApplication->status instanceof ApplicationStatus ? $myApplication->status->value : $myApplication->status,
                    'message' => $myApplication->message,
                ] : null,
            ];
        });

        // Total needed slots across all recruiting teams
        $totalNeededSlots = $openRecruitingTeams->sum(function ($part) {
            $roles = $part['team']['recruitment']['roles'] ?? [];
            if (!empty($roles)) {
                return collect($roles)->sum('slots');
            }
            $max = $part['competition']['max_team_size'] ?? 5;
            $current = $part['team']['members_count'] ?? 1;
            return max(1, $max - $current);
        });

        // User's submitted applications (for MinSatu "Pengajuan" tab)
        $myApplications = $user ? Application::where('user_id', $user->id)
            ->whereHas('recruitment.team.participations')
            ->with(['recruitment.team.participations.competition', 'recruitment.team.leader.profile'])
            ->latest()
            ->get()
            ->map(function ($app) {
                $participation = $app->recruitment?->team?->participations?->first();
                return [
                    'id' => $app->id,
                    'status' => $app->status instanceof ApplicationStatus ? $app->status->value : $app->status,
                    'role_name' => $app->role_name,
                    'message' => $app->message,
                    'contact_phone' => $app->contact_phone,
                    'created_at' => $app->created_at?->toIso8601String(),
                    'team_name' => $app->recruitment?->team?->name ?? 'Tim Kompetisi',
                    'competition_name' => $participation?->competition?->name ?? 'Kompetisi',
                    'organizer' => $participation?->competition?->organizer,
                    'leader_name' => $app->recruitment?->team?->leader?->name,
                    'participation_id' => $participation?->id,
                ];
            }) : collect();

        // User's full participations with complete 6-stage lifecycle tracking
        $myParticipations = collect();
        if ($user) {
            $rawParticipations = CompetitionParticipation::whereHas('team.members', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->with([
                    'competition.rounds',
                    'team.members.user:id,name,avatar',
                    'team.leader',
                    'result.verifier:id,name',
                    'statusHistories',
                    'documents',
                ])
                ->latest()
                ->get();

            $myParticipations = $rawParticipations->map(function ($p) use ($user) {
                $comp = $p->competition;
                $stage = $p->stage;
                $regStatus = $p->registration_status instanceof \BackedEnum ? $p->registration_status->value : (string) ($p->registration_status ?? 'planning');
                $progStatus = $p->progress_status instanceof \BackedEnum ? $p->progress_status->value : (string) ($p->progress_status ?? 'preparing');

                // Determine 6-stage lifecycle: saved | planning | registered | in_progress | completed | withdrawn
                if ($stage === 'withdrawn' || $regStatus === 'withdrawn') {
                    $lifecycle = 'withdrawn';
                } elseif ($progStatus === 'finished' || in_array($stage, ['winner', 'not_selected']) || $p->result !== null) {
                    $lifecycle = 'completed';
                } elseif (in_array($stage, ['submitted', 'administrative_selection', 'shortlisted', 'finalist', 'final_presentation']) || $progStatus === 'in_competition') {
                    $lifecycle = 'in_progress';
                } elseif ($regStatus === 'registered' || $stage === 'registered') {
                    $lifecycle = 'registered';
                } else {
                    $lifecycle = 'planning';
                }

                // Compute next milestone
                $nextMilestone = 'Belum ada agenda lanjutan';
                if ($comp) {
                    $upcomingRound = $comp->rounds ? $comp->rounds->first(function ($r) {
                        return $r->ends_at && $r->ends_at >= now();
                    }) : null;

                    if ($upcomingRound) {
                        $nextMilestone = "{$upcomingRound->name} (Batas: " . ($upcomingRound->ends_at ? $upcomingRound->ends_at->format('d M Y') : '-') . ")";
                    } elseif ($comp->registration_deadline && $comp->registration_deadline >= now()) {
                        $daysLeft = (int) now()->diffInDays($comp->registration_deadline, false);
                        $nextMilestone = "Batas Pendaftaran: " . $comp->registration_deadline->format('d M Y') . " (" . ($daysLeft >= 0 ? "{$daysLeft} hari lagi" : "Tutup") . ")";
                    } else {
                        $nextMilestone = 'Tahap Seleksi / Pengumuman';
                    }
                }

                $isLeader = $p->team && $p->team->leader_id === $user->id;
                $isAdmin = $user->isCampusAdminOf($comp?->campus_id) || $user->isPlatformAdmin();

                return [
                    'id' => $p->id,
                    'lifecycle_status' => $lifecycle,
                    'stage' => $stage,
                    'stage_label' => $this->getStageLabel($stage),
                    'registration_status' => $regStatus,
                    'progress_status' => $progStatus,
                    'category_track' => $p->category_track,
                    'external_registration_proof' => $p->external_registration_proof,
                    'external_submission_proof' => $p->external_submission_proof,
                    'registered_at' => $p->registered_at?->toIso8601String(),
                    'is_formation_locked' => (bool) $p->is_formation_locked,
                    'can_manage' => $isLeader || $isAdmin,
                    'next_milestone' => $nextMilestone,
                    'competition' => $comp ? [
                        'id' => $comp->id,
                        'name' => $comp->name,
                        'slug' => $comp->slug,
                        'organizer' => $comp->organizer,
                        'category' => $comp->category,
                        'level' => $comp->level,
                        'competition_type' => $comp->competition_type ?? 'Hybrid',
                        'official_url' => $comp->official_url,
                        'registration_url' => $comp->registration_url,
                        'registration_deadline' => $comp->registration_deadline?->toIso8601String(),
                        'cover_image' => $comp->cover_image,
                        'min_team_size' => $comp->min_team_size,
                        'max_team_size' => $comp->max_team_size,
                        'is_urgent' => $comp->registration_deadline && $comp->registration_deadline >= now() && $comp->registration_deadline <= now()->addDays(7),
                        'is_overdue' => $comp->registration_deadline && $comp->registration_deadline < now(),
                    ] : null,
                    'team' => $p->team ? [
                        'id' => $p->team->id,
                        'name' => $p->team->name,
                        'is_leader' => $isLeader,
                        'members_count' => $p->team->members->count(),
                        'members' => $p->team->members->map(fn($m) => [
                            'id' => $m->id,
                            'user_id' => $m->user_id,
                            'name' => $m->user?->name,
                            'avatar' => $m->user?->avatar,
                            'role_name' => $m->role_name,
                            'is_me' => $m->user_id === $user->id,
                        ]),
                    ] : null,
                    'result' => $p->result ? [
                        'id' => $p->result->id,
                        'outcome' => $p->result->outcome instanceof \BackedEnum ? $p->result->outcome->value : (string) $p->result->outcome,
                        'outcome_label' => $this->getOutcomeLabel($p->result->outcome),
                        'achievement_title' => $p->result->achievement_title,
                        'rank' => $p->result->rank,
                        'notes' => $p->result->notes,
                        'certificate_path' => $p->result->certificate_path,
                        'verification_status' => $p->result->verification_status,
                        'verifier_name' => $p->result->verifier?->name,
                        'verified_at' => $p->result->verified_at?->toIso8601String(),
                    ] : null,
                    'status_histories' => $p->statusHistories->take(5)->map(fn($h) => [
                        'id' => $h->id,
                        'from_stage' => $h->from_stage,
                        'to_stage' => $h->to_stage,
                        'notes' => $h->notes,
                        'created_at' => $h->created_at?->toIso8601String(),
                    ]),
                ];
            });
        }

        // Backwards compatible $myTeams
        $myTeams = $myParticipations->map(fn ($p) => [
            'id' => $p['id'],
            'stage' => $p['stage'],
            'team_name' => $p['team']['name'] ?? 'Tim Kompetisi',
            'competition_name' => $p['competition']['name'] ?? 'Kompetisi',
            'is_leader' => $p['team']['is_leader'] ?? false,
            'members_count' => $p['team']['members_count'] ?? 1,
            'max_size' => $p['competition']['max_team_size'] ?? 5,
        ]);

        // Bookmarked competitions
        $bookmarkedIds = $user ? Bookmark::where('user_id', $user->id)
            ->where('bookmarkable_type', Competition::class)
            ->pluck('bookmarkable_id')
            ->all() : [];

        $savedCompetitions = !empty($bookmarkedIds)
            ? Competition::whereIn('id', $bookmarkedIds)
                ->with(['campus:id,name', 'rounds'])
                ->orderBy('registration_deadline', 'asc')
                ->get()
                ->map(fn ($c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                    'organizer' => $c->organizer,
                    'category' => $c->category,
                    'level' => $c->level,
                    'competition_type' => $c->competition_type ?? 'Hybrid',
                    'official_url' => $c->official_url,
                    'registration_url' => $c->registration_url,
                    'registration_deadline' => $c->registration_deadline?->toIso8601String(),
                    'cover_image' => $c->cover_image,
                    'is_urgent' => $c->registration_deadline && $c->registration_deadline >= now() && $c->registration_deadline <= now()->addDays(7),
                    'is_overdue' => $c->registration_deadline && $c->registration_deadline < now(),
                ])
            : collect();

        $lifecycleCounts = [
            'all' => $myParticipations->count() + count($bookmarkedIds),
            'saved' => count($bookmarkedIds),
            'planning' => $myParticipations->where('lifecycle_status', 'planning')->count(),
            'registered' => $myParticipations->where('lifecycle_status', 'registered')->count(),
            'in_progress' => $myParticipations->where('lifecycle_status', 'in_progress')->count(),
            'completed' => $myParticipations->where('lifecycle_status', 'completed')->count(),
            'withdrawn' => $myParticipations->where('lifecycle_status', 'withdrawn')->count(),
        ];

        // Featured & Upcoming Deadlines
        $featuredCompetitions = Competition::visibleTo($user)
            ->where('registration_deadline', '>=', now())
            ->latest('created_at')
            ->take(4)
            ->get();

        $upcomingDeadlines = Competition::visibleTo($user)
            ->where('registration_deadline', '>=', now())
            ->orderBy('registration_deadline', 'asc')
            ->take(5)
            ->get();

        // Personalized recommendations based on student skills and faculty
        $userSkills = $user?->profile?->skills?->pluck('name')->toArray() ?? [];
        $recommendedQuery = Competition::visibleTo($user)
            ->where('registration_deadline', '>=', now());

        if (!empty($userSkills)) {
            $recommendedCompetitions = (clone $recommendedQuery)
                ->whereHas('skills', function ($sq) use ($userSkills) {
                    $sq->whereIn('name', $userSkills);
                })
                ->take(6)
                ->get();
        } else {
            $recommendedCompetitions = collect();
        }

        if ($recommendedCompetitions->isEmpty()) {
            $recommendedCompetitions = (clone $recommendedQuery)->latest()->take(6)->get();
        }

        // Category counts
        $categoryCounts = Competition::visibleTo($user)
            ->select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->pluck('count', 'category')
            ->all();

        // Calculate statistics for header cards
        $stats = [
            'total' => Competition::visibleTo($user)->count(),
            'open_registration' => Competition::visibleTo($user)->where('registration_deadline', '>=', now())->count(),
            'national_international' => Competition::visibleTo($user)->whereIn('level', ['national', 'international'])->count(),
            'open_teams_count' => $openRecruitingTeams->count(),
            'total_needed_slots' => $totalNeededSlots,
            'my_participations' => $myTeams->count(),
            'saved_count' => count($bookmarkedIds),
        ];

        // Active participation if user has one
        $activeParticipation = null;
        if ($user) {
            $activeParticipation = CompetitionParticipation::with(['competition', 'team'])
                ->whereHas('team.members', function ($q) use ($user) {
                    $q->where('user_id', $user->id)->where('status', 'active');
                })
                ->whereNotIn('stage', ['winner', 'not_selected', 'withdrawn'])
                ->latest()
                ->first();
        }

        // Current user contact details for pre-filling application modal
        $currentUserInfo = $user ? [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->profile?->phone,
            'portfolio_url' => $user->profile?->portfolio_url,
            'study_program' => $user->profile?->study_program,
        ] : null;

        return Inertia::render('competitions/index', [
            'competitions' => $competitions,
            'openRecruitingTeams' => $openRecruitingTeams,
            'totalNeededSlots' => $totalNeededSlots,
            'myApplications' => $myApplications,
            'myTeams' => $myTeams,
            'myParticipations' => $myParticipations,
            'lifecycleCounts' => $lifecycleCounts,
            'bookmarkedIds' => $bookmarkedIds,
            'savedCompetitions' => $savedCompetitions,
            'featuredCompetitions' => $featuredCompetitions,
            'upcomingDeadlines' => $upcomingDeadlines,
            'recommendedCompetitions' => $recommendedCompetitions,
            'categoryCounts' => $categoryCounts,
            'currentUserInfo' => $currentUserInfo,
            'filters' => (object) $request->only(['search', 'category', 'status', 'level', 'tab', 'team_search', 'team_category', 'team_role', 'type', 'format', 'sort', 'my_lifecycle_status']),
            'categories' => CompetitionCategory::values(),
            'statuses' => CompetitionStatus::values(),
            'levels' => ['local', 'regional', 'national', 'international'],
            'stats' => $stats,
            'activeParticipation' => $activeParticipation,
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('competitions/create', [
            'categories' => CompetitionCategory::values(),
            'levels' => ['local', 'regional', 'national', 'international'],
            'types' => ['team', 'individual'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $this->authorize('create', Competition::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'organizer' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', Rule::enum(CompetitionCategory::class)],
            'level' => ['nullable', 'string', 'in:local,regional,national,international'],
            'competition_type' => ['nullable', 'string', 'in:team,individual'],
            'scope' => ['nullable', Rule::enum(CompetitionScope::class)],
            'official_url' => ['nullable', 'url', 'max:255'],
            'registration_url' => ['nullable', 'url', 'max:255'],
            'registration_opens_at' => ['nullable', 'date'],
            'registration_deadline' => ['nullable', 'date'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'eligibility' => ['nullable', 'string'],
            'min_team_size' => ['required', 'integer', 'min:1', 'max:10'],
            'max_team_size' => ['required', 'integer', 'gte:min_team_size', 'max:10'],
            'prize_info' => ['nullable', 'string'],
            'cover_image' => ['nullable', 'image', 'max:4096'],
            // Provenance source
            'source_label' => ['nullable', 'string', 'max:255'],
            'source_url' => ['nullable', 'url', 'max:255'],
            'source_notes' => ['nullable', 'string'],
        ]);

        $campusId = $user->campusId();
        $isGlobal = ($validated['scope'] ?? 'campus') === 'global' && $user->isPlatformAdmin();

        $coverImagePath = null;
        if ($request->hasFile('cover_image')) {
            $coverImagePath = ObjectStorageService::store($request->file('cover_image'), 'competitions/covers')['path'];
        }

        $competition = DB::transaction(function () use ($validated, $user, $campusId, $isGlobal, $coverImagePath) {
            $slug = Str::slug($validated['name']) . '-' . Str::lower(Str::random(6));

            $isPrivileged = $user->isCampusAdminOf($campusId) || $user->isPlatformAdmin() || $user->isLecturer();

            $comp = Competition::create([
                'campus_id' => $isGlobal ? null : $campusId,
                'scope' => $isGlobal ? CompetitionScope::Global : CompetitionScope::Campus,
                'created_by' => $user->id,
                'name' => $validated['name'],
                'slug' => $slug,
                'organizer' => $validated['organizer'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'],
                'level' => $validated['level'] ?? 'national',
                'competition_type' => $validated['competition_type'] ?? 'team',
                'official_url' => $validated['official_url'] ?? null,
                'registration_url' => $validated['registration_url'] ?? null,
                'registration_opens_at' => $validated['registration_opens_at'] ?? null,
                'registration_deadline' => $validated['registration_deadline'] ?? null,
                'starts_at' => $validated['starts_at'] ?? null,
                'ends_at' => $validated['ends_at'] ?? null,
                'eligibility' => $validated['eligibility'] ?? null,
                'min_team_size' => $validated['min_team_size'],
                'max_team_size' => $validated['max_team_size'],
                'prize_info' => $validated['prize_info'] ?? null,
                'cover_image' => $coverImagePath,
                'status' => CompetitionStatus::Open,
                'verification_status' => $isPrivileged ? VerificationStatus::Verified : VerificationStatus::Unverified,
                'last_verified_at' => $isPrivileged ? now() : null,
                'verified_by' => $isPrivileged ? $user->id : null,
            ]);

            if (!empty($validated['source_url'])) {
                CompetitionSource::create([
                    'competition_id' => $comp->id,
                    'label' => $validated['source_label'] ?? 'Sumber Informasi Resmi',
                    'url' => $validated['source_url'],
                    'notes' => $validated['source_notes'] ?? null,
                    'verified_at' => $isPrivileged ? now() : null,
                    'verified_by' => $isPrivileged ? $user->id : null,
                ]);
            }

            return $comp;
        });

        $message = $competition->verification_status === VerificationStatus::Verified
            ? 'Kompetisi berhasil ditambahkan dan langsung dipublikasikan.'
            : 'Kompetisi berhasil diajukan dan sedang menunggu verifikasi oleh dosen/admin.';

        return redirect()->route('competitions.show', $competition->slug ?? $competition->id)->with('success', $message);
    }

    private function resolveCompetition(string|int $idOrSlug): Competition
    {
        return Competition::where(function ($q) use ($idOrSlug) {
            if (is_numeric($idOrSlug)) {
                $q->where('id', (int) $idOrSlug)->orWhere('slug', $idOrSlug);
            } else {
                $q->where('slug', $idOrSlug);
            }
        })->firstOrFail();
    }

    public function verify(Request $request, string|int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = $this->resolveCompetition($id);

        if (!$user->isCampusAdminOf($competition->campus_id) && !$user->isPlatformAdmin() && !$user->isLecturer()) {
            abort(403, 'Hanya dosen atau administrator yang dapat memverifikasi kompetisi.');
        }

        $competition->update([
            'verification_status' => VerificationStatus::Verified,
            'status' => CompetitionStatus::Open,
            'last_verified_at' => now(),
            'verified_by' => $user->id,
        ]);

        return back()->with('success', "Kompetisi '{$competition->name}' berhasil diverifikasi dan dipublikasikan.");
    }

    public function show(Request $request, string|int $id): Response
    {
        $user = $request->user();
        $competition = Competition::with([
            'sources',
            'campus:id,name',
            'skills',
            'rounds',
            'participations.team.members.user:id,name',
            'participations.project:id,title,slug',
            'participations.mentor:id,name',
            'participations.result',
        ])
        ->where(function ($q) use ($id) {
            if (is_numeric($id)) {
                $q->where('id', (int) $id)->orWhere('slug', $id);
            } else {
                $q->where('slug', $id);
            }
        })
        ->firstOrFail();

        if ($user) {
            $this->authorize('view', $competition);
        } else {
            if ($competition->moderation_status !== 'visible') {
                abort(404);
            }
        }

        $isBookmarked = $user ? Bookmark::where('user_id', $user->id)
            ->where('bookmarkable_type', Competition::class)
            ->where('bookmarkable_id', $competition->id)
            ->exists() : false;

        $myParticipation = $user ? $competition->participations
            ->first(fn ($p) => $p->team?->hasMember($user)) : null;

        $myLedProjects = $user ? Project::where('leader_id', $user->id)
            ->with('team')
            ->get(['id', 'title', 'category', 'status']) : collect();

        // Check if user is eligible to participate under flexible policy
        $eligibilityCheck = $user ? $this->unifiedMembershipService->canJoinCompetition($user, null, $competition->id) : ['eligible' => false, 'reason' => 'Silakan login terlebih dahulu.'];

        // Open teams looking for members in this competition (MinSatu-style)
        $openTeams = $competition->participations()
            ->where('is_formation_locked', false)
            ->whereIn('stage', ['recruiting', 'team_formation'])
            ->with([
                'team.leader.profile',
                'team.members.user:id,name,avatar',
                'team.recruitment.roles',
                'team.recruitment.applications' => function ($q) use ($user) {
                    if ($user) {
                        $q->where('user_id', $user->id);
                    }
                },
            ])
            ->get()
            ->map(function ($part) use ($user) {
                $team = $part->team;
                $myApp = null;
                if ($user && $team && $team->recruitment) {
                    $myApp = $team->recruitment->applications->first();
                }

                $isMember = $user && $team ? ($team->hasMember($user) || $team->members->contains(function ($m) use ($user) {
                    return (int) $m->user_id === (int) $user->id;
                })) : false;
                $isLeader = $user && $team ? $team->isLeader($user) : false;

                return [
                    'id' => $part->id,
                    'stage' => $part->stage,
                    'category_track' => $part->category_track,
                    'team' => $team ? [
                        'id' => $team->id,
                        'name' => $team->name,
                        'description' => $team->description,
                        'capacity' => $team->capacity,
                        'leader' => $team->leader ? [
                            'id' => $team->leader->id,
                            'name' => $team->leader->name,
                            'avatar' => $team->leader->avatar,
                            'study_program' => $team->leader->profile?->study_program ?? 'Mahasiswa',
                            'phone' => $team->leader->profile?->phone,
                        ] : null,
                        'members_count' => $team->members->count(),
                        'members' => $team->members->map(fn ($m) => [
                            'id' => $m->id,
                            'user_id' => $m->user_id,
                            'name' => $m->user?->name,
                            'avatar' => $m->user?->avatar,
                            'role_name' => $m->role_name,
                        ]),
                        'recruitment' => $team->recruitment ? [
                            'id' => $team->recruitment->id,
                            'roles' => $team->recruitment->roles->map(fn ($r) => [
                                'id' => $r->id,
                                'name' => $r->name,
                                'slots' => $r->slots,
                                'requirements' => $r->requirements,
                            ]),
                        ] : null,
                    ] : null,
                    'is_member' => $isMember,
                    'is_leader' => $isLeader,
                    'my_application' => $myApp ? [
                        'id' => $myApp->id,
                        'status' => $myApp->status instanceof ApplicationStatus ? $myApp->status->value : $myApp->status,
                        'message' => $myApp->message,
                    ] : null,
                ];
            });

        // Available students in same campus for Lecturer-Led allocation
        $isLecturer = $user ? ($user->isLecturer() || $user->isPlatformAdmin()) : false;
        $campusStudents = collect();
        if ($isLecturer) {
            $campusId = $competition->campus_id ?? $user->campusId();
            $rawStudents = User::whereHas('memberships', function ($q) use ($campusId) {
                $q->where('role', \App\Enums\CampusRole::Student->value)
                  ->where('status', \App\Enums\MembershipStatus::Active->value);
                if ($campusId) {
                    $q->where('campus_id', $campusId);
                }
            })
            ->with(['profile.skills'])
            ->take(60)
            ->get();

            $activeInCompIds = TeamMember::where('status', 'active')
                ->whereIn('user_id', $rawStudents->pluck('id'))
                ->whereHas('team.participations', fn ($q) => $q->where('competition_id', $competition->id))
                ->pluck('user_id')
                ->flip();

            $campusStudents = $rawStudents->map(function ($s) use ($activeInCompIds) {
                $hasActiveInComp = isset($activeInCompIds[$s->id]);
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'email' => $s->email,
                    'study_program' => $s->profile?->study_program ?? 'Teknik Informatika',
                    'semester' => $s->profile?->semester ?? 5,
                    'skills' => $s->profile ? $s->profile->skills->pluck('name')->all() : [],
                    'has_team_in_competition' => $hasActiveInComp,
                ];
            });
        }

        // Student's pending allocation invitations from lecturers (if any)
        $myAllocations = $user ? \App\Models\CompetitionAllocation::where('competition_id', $competition->id)
            ->where('student_id', $user->id)
            ->with(['lecturer:id,name', 'team:id,name'])
            ->latest()
            ->get() : collect();

        $currentUserInfo = $user ? [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->profile?->phone,
            'portfolio_url' => $user->profile?->portfolio_url,
            'study_program' => $user->profile?->study_program,
        ] : null;

        // Formatted myParticipation for lifecycle tracking on detail page
        $myParticipationData = null;
        if ($myParticipation) {
            $myParticipation->loadMissing(['team.members.user', 'team.leader', 'result.verifier', 'statusHistories']);
            $stage = $myParticipation->stage;
            $regStatus = $myParticipation->registration_status instanceof \BackedEnum ? $myParticipation->registration_status->value : (string) ($myParticipation->registration_status ?? 'planning');
            $progStatus = $myParticipation->progress_status instanceof \BackedEnum ? $myParticipation->progress_status->value : (string) ($myParticipation->progress_status ?? 'preparing');

            if ($stage === 'withdrawn' || $regStatus === 'withdrawn') {
                $lifecycle = 'withdrawn';
            } elseif ($progStatus === 'finished' || in_array($stage, ['winner', 'not_selected']) || $myParticipation->result !== null) {
                $lifecycle = 'completed';
            } elseif (in_array($stage, ['submitted', 'administrative_selection', 'shortlisted', 'finalist', 'final_presentation']) || $progStatus === 'in_competition') {
                $lifecycle = 'in_progress';
            } elseif ($regStatus === 'registered' || $stage === 'registered') {
                $lifecycle = 'registered';
            } else {
                $lifecycle = 'planning';
            }

            $isLeader = $myParticipation->team && $myParticipation->team->leader_id === $user->id;
            $isAdmin = $user->isCampusAdminOf($competition->campus_id) || $user->isPlatformAdmin();

            $myParticipationData = [
                'id' => $myParticipation->id,
                'lifecycle_status' => $lifecycle,
                'stage' => $stage,
                'stage_label' => $this->getStageLabel($stage),
                'registration_status' => $regStatus,
                'progress_status' => $progStatus,
                'category_track' => $myParticipation->category_track,
                'external_registration_proof' => $myParticipation->external_registration_proof,
                'external_submission_proof' => $myParticipation->external_submission_proof,
                'registered_at' => $myParticipation->registered_at?->toIso8601String(),
                'can_manage' => $isLeader || $isAdmin,
                'team' => $myParticipation->team ? [
                    'id' => $myParticipation->team->id,
                    'name' => $myParticipation->team->name,
                    'is_leader' => $isLeader,
                    'members_count' => $myParticipation->team->members->count(),
                    'members' => $myParticipation->team->members->map(fn($m) => [
                        'id' => $m->id,
                        'name' => $m->user?->name,
                        'avatar' => $m->user?->avatar,
                        'role_name' => $m->role_name,
                        'is_me' => $m->user_id === $user->id,
                    ]),
                ] : null,
                'result' => $myParticipation->result ? [
                    'id' => $myParticipation->result->id,
                    'outcome' => $myParticipation->result->outcome instanceof \BackedEnum ? $myParticipation->result->outcome->value : (string) $myParticipation->result->outcome,
                    'outcome_label' => $this->getOutcomeLabel($myParticipation->result->outcome),
                    'achievement_title' => $myParticipation->result->achievement_title,
                    'rank' => $myParticipation->result->rank,
                    'notes' => $myParticipation->result->notes,
                    'certificate_path' => $myParticipation->result->certificate_path,
                    'verification_status' => $myParticipation->result->verification_status,
                    'verifier_name' => $myParticipation->result->verifier?->name,
                    'verified_at' => $myParticipation->result->verified_at?->toIso8601String(),
                ] : null,
            ];
        }

        return Inertia::render('competitions/show', [
            'competition' => $competition,
            'isBookmarked' => $isBookmarked,
            'myParticipation' => $myParticipationData,
            'myLedProjects' => $myLedProjects,
            'eligibilityCheck' => $eligibilityCheck,
            'openTeams' => $openTeams,
            'currentUserInfo' => $currentUserInfo,
            'isLecturer' => $isLecturer,
            'campusStudents' => $campusStudents,
            'myAllocations' => $myAllocations,
        ]);
    }

    public function participate(Request $request, string|int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = $this->resolveCompetition($id);

        $validated = $request->validate([
            'project_id' => ['nullable', 'exists:projects,id'],
            'team_name' => ['nullable', 'string', 'max:100'],
            'category_track' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'roles_needed' => ['nullable', 'string', 'max:255'],
            'initial_status' => ['nullable', 'string', 'in:planning,registered'],
            'external_registration_proof' => ['nullable', 'string', 'max:255'],
            'redirect_to' => ['nullable', 'string', 'in:workspace,self,hub'],
        ]);

        if (empty($validated['team_name'])) {
            $validated['team_name'] = "Tim {$user->name}";
        }

        $participation = $this->teamFormationService->createTeam($competition, $user, $validated);

        if (($validated['initial_status'] ?? 'planning') === 'registered') {
            $participation->update([
                'registration_status' => 'registered',
                'stage' => 'registered',
                'registered_at' => now(),
                'external_registration_proof' => $validated['external_registration_proof'] ?? null,
            ]);

            CompetitionStatusHistory::create([
                'participation_id' => $participation->id,
                'from_stage' => 'recruiting',
                'to_stage' => 'registered',
                'notes' => 'Status pendaftaran resmi dikonfirmasi langsung oleh mahasiswa.',
                'changed_by' => $user->id,
            ]);
        }

        $redirectTo = $validated['redirect_to'] ?? ($request->input('redirect_to') ?? 'hub');
        if ($redirectTo === 'workspace') {
            return redirect()->route('competitions.workspace', $participation->id)
                ->with('success', 'Kompetisi berhasil ditambahkan ke Lomba Saya! Selamat datang di Preparation Workspace.');
        }

        if ($redirectTo === 'self') {
            return back()->with('success', "Kompetisi '{$competition->name}' berhasil ditambahkan ke Lomba Saya.");
        }

        return redirect()->route('competitions.index', ['tab' => 'my_competitions'])
            ->with('success', "Kompetisi '{$competition->name}' berhasil ditambahkan ke Lomba Saya.");
    }

    public function workspaceIndex(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        // 1. Prioritize active participation where user is an active team member
        $participation = CompetitionParticipation::whereHas('team.members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereNotIn('stage', ['winner', 'not_selected', 'withdrawn'])
            ->latest()
            ->first();

        // 2. Fallback to any participation where user is a team member
        if (!$participation) {
            $participation = CompetitionParticipation::whereHas('team.members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->latest()->first();
        }

        // 3. Fallback to participation where user is mentor
        if (!$participation) {
            $participation = CompetitionParticipation::where('mentor_id', $user->id)
                ->orWhereHas('mentors', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->latest()
                ->first();
        }

        if ($participation) {
            $slug = $participation->competition?->slug ?: $participation->id;
            return redirect()->route('competitions.workspace', ['participationId' => $slug]);
        }

        return redirect()->route('competitions.index', ['tab' => 'my_competitions'])
            ->with('info', 'Anda belum terdaftar dalam tim kompetisi manapun. Daftarkan tim atau cari tim untuk membuka Workspace.');
    }

    public function workspace(Request $request, string|int $participationId): Response|RedirectResponse
    {
        $user = $request->user();

        $relations = [
            'competition.sources',
            'competition.campus:id,name',
            'competition.rounds',
            'team.members.user.profile.skills',
            'team.tasks.assignee:id,name,avatar',
            'team.tasks.creator:id,name,avatar',
            'team.recruitment.roles',
            'team.recruitment.applications.user.profile.skills',
            'team.recruitment.applications.role',
            'team.invitations.invitee:id,name,email',
            'mentor.lecturerProfile',
            'mentors.user.lecturerProfile',
            'documents.round',
            'documents.uploader:id,name',
            'result.verifier:id,name',
            'statusHistories.changer:id,name',
        ];

        // If numeric ID was passed (e.g. /competition-workspace/5), redirect permanently to slug URL
        if (is_numeric($participationId)) {
            $participation = CompetitionParticipation::with($relations)->findOrFail((int) $participationId);
            $slug = $participation->competition?->slug;
            if ($slug) {
                return redirect()->route('competitions.workspace', ['participationId' => $slug]);
            }
        } else {
            $participation = $this->resolveParticipation($participationId, $relations);
        }

        $team = $participation->team;
        $isMember = $team && $team->hasMember($user);
        $isLeader = $team && $team->isLeader($user);
        $isMentor = $participation->mentor_id === $user->id || $participation->mentors->contains('user_id', $user->id);
        $isAdmin = $user->isCampusAdminOf($participation->competition?->campus_id) || $user->isPlatformAdmin();

        if (!$isMember && !$isMentor && !$isAdmin) {
            abort(403, 'Anda tidak memiliki hak akses ke Preparation Workspace tim kompetisi ini.');
        }

        // Preparation readiness score calculation
        $readinessScore = $participation->calculatePreparationProgress();

        // Get ranked matchmaking candidate recommendations
        $recommendedCandidates = $isLeader
            ? $this->matchmakingService->getRecommendedCandidates($participation, $user, 10)
            : collect();

        // Available lecturers in same campus for mentoring
        $campusId = $participation->competition?->campus_id ?? $user->campusId();
        $availableLecturers = User::whereHas('memberships', function ($q) use ($campusId) {
            $q->where('role', \App\Enums\CampusRole::Lecturer->value)
              ->where('status', \App\Enums\MembershipStatus::Active->value);
            if ($campusId) {
                $q->where('campus_id', $campusId);
            }
        })->get(['id', 'name', 'email']);

        // Selection stage sequence for tracking
        $selectionStages = [
            'recruiting' => ['label' => 'Perekrutan Tim', 'order' => 1],
            'team_formation' => ['label' => 'Susunan Tim Final', 'order' => 2],
            'preparing' => ['label' => 'Persiapan Karya', 'order' => 3],
            'registered' => ['label' => 'Terdaftar Resmi', 'order' => 4],
            'submitted' => ['label' => 'Karya Dikirim', 'order' => 5],
            'administrative_selection' => ['label' => 'Seleksi Administrasi', 'order' => 6],
            'shortlisted' => ['label' => 'Lolos Tahap Awal', 'order' => 7],
            'finalist' => ['label' => 'Finalis Kompetisi', 'order' => 8],
            'final_presentation' => ['label' => 'Presentasi Final', 'order' => 9],
            'winner' => ['label' => 'Juara / Pemenang', 'order' => 10],
            'not_selected' => ['label' => 'Belum Lolos', 'order' => 99],
            'withdrawn' => ['label' => 'Mengundurkan Diri', 'order' => 99],
        ];

        $teamAllocations = $team ? \App\Models\CompetitionAllocation::where('team_id', $team->id)
            ->with(['student:id,name,email', 'lecturer:id,name'])
            ->latest()
            ->get() : collect();

        // MinSatu Flow: Incoming applicant submissions with contact WhatsApp & portfolios
        $incomingApplications = ($team && $team->recruitment)
            ? $team->recruitment->applications->map(function ($app) {
                $u = $app->user;
                $phone = $app->contact_phone ?: ($u?->profile?->phone ?: null);
                return [
                    'id' => $app->id,
                    'user_id' => $app->user_id,
                    'user' => $u ? [
                        'id' => $u->id,
                        'name' => $u->name,
                        'email' => $u->email,
                        'avatar' => $u->avatar,
                        'study_program' => $u->profile?->study_program ?? 'Mahasiswa',
                        'semester' => $u->profile?->semester,
                        'phone' => $phone,
                        'portfolio_url' => $app->portfolio_url ?: ($u->profile?->portfolio_url ?: null),
                        'github_url' => $u->profile?->github_url ?: null,
                        'linkedin_url' => $u->profile?->linkedin_url ?: null,
                        'skills' => $u->profile ? $u->profile->skills->pluck('name')->all() : [],
                    ] : null,
                    'role_name' => $app->role?->name ?? 'Anggota Tim',
                    'recruitment_role_id' => $app->recruitment_role_id,
                    'message' => $app->message,
                    'status' => $app->status instanceof ApplicationStatus ? $app->status->value : $app->status,
                    'contact_phone' => $phone,
                    'portfolio_url' => $app->portfolio_url ?: ($u?->profile?->portfolio_url ?: null),
                    'created_at' => $app->created_at?->toISOString(),
                    'decided_at' => $app->decided_at?->toISOString(),
                    'decision_note' => $app->decision_note,
                ];
            })
            : collect();

        $recruitmentRoles = ($team && $team->recruitment)
            ? $team->recruitment->roles->map(fn ($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'slots' => $r->slots,
                'requirements' => $r->requirements,
            ])
            : collect();

        return Inertia::render('competitions/workspace', [
            'participation' => $participation,
            'readinessScore' => $readinessScore,
            'recommendedCandidates' => $recommendedCandidates,
            'availableLecturers' => $availableLecturers,
            'selectionStages' => $selectionStages,
            'teamAllocations' => $teamAllocations,
            'incomingApplications' => $incomingApplications,
            'recruitmentRoles' => $recruitmentRoles,
            'rounds' => $participation->competition?->rounds ?? collect(),
            'isLeader' => $isLeader,
            'isMember' => $isMember,
            'isMentor' => $isMentor,
            'isAdmin' => $isAdmin,
            'storageQuota' => $participation->team_id ? ObjectStorageService::getTeamStorageQuotaInfo($participation->team_id) : null,
        ]);
    }

    public function resolveParticipation(int|string $identifier, array $relations = []): CompetitionParticipation
    {
        if (is_numeric($identifier)) {
            return CompetitionParticipation::with($relations)->findOrFail((int) $identifier);
        }

        $teamId = null;
        $slug = $identifier;
        if (str_contains($identifier, '--')) {
            [$slug, $teamPart] = explode('--', $identifier, 2);
            if (is_numeric($teamPart)) {
                $teamId = (int) $teamPart;
            }
        }

        $competition = Competition::where('slug', $slug)->first();
        if ($competition) {
            $user = auth()->user();
            $query = CompetitionParticipation::with($relations)->where('competition_id', $competition->id);

            if ($teamId) {
                $query->where('team_id', $teamId);
            } elseif ($user) {
                $userPart = (clone $query)->whereHas('team.members', fn ($q) => $q->where('user_id', $user->id))->first();
                if ($userPart) {
                    return $userPart;
                }
            }

            return $query->first() ?? CompetitionParticipation::with($relations)->findOrFail($identifier);
        }

        return CompetitionParticipation::with($relations)->findOrFail($identifier);
    }

    public function updateStage(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team', 'competition']);

        $isLeader = $participation->team && $participation->team->isLeader($user);
        $isMentor = $participation->mentor_id === $user->id;
        $isAdmin = $user->isCampusAdminOf($participation->competition->campus_id) || $user->isPlatformAdmin();

        if (!$isLeader && !$isMentor && !$isAdmin) {
            abort(403, 'Hanya ketua tim, pembimbing, atau admin yang dapat memperbarui tahapan kompetisi.');
        }

        $validated = $request->validate([
            'stage' => ['required', 'string', 'in:recruiting,team_formation,preparing,registered,submitted,administrative_selection,shortlisted,finalist,final_presentation,winner,not_selected,withdrawn'],
            'notes' => ['nullable', 'string', 'max:500'],
            'external_registration_proof' => ['nullable', 'string', 'max:255'],
            'external_submission_proof' => ['nullable', 'string', 'max:255'],
        ]);

        $oldStage = $participation->stage;
        $newStage = $validated['stage'];

        DB::transaction(function () use ($participation, $oldStage, $newStage, $validated, $user) {
            $updateData = ['stage' => $newStage];

            if ($newStage === 'registered' || !empty($validated['external_registration_proof'])) {
                $updateData['registration_status'] = 'registered';
                $updateData['registered_at'] = now();
                if (!empty($validated['external_registration_proof'])) {
                    $updateData['external_registration_proof'] = $validated['external_registration_proof'];
                }
            }
            if ($newStage === 'submitted' || !empty($validated['external_submission_proof'])) {
                $updateData['submission_status'] = 'submitted';
                $updateData['submitted_at'] = now();
                if (!empty($validated['external_submission_proof'])) {
                    $updateData['external_submission_proof'] = $validated['external_submission_proof'];
                }
            }

            if (in_array($newStage, ['submitted', 'administrative_selection', 'shortlisted', 'finalist', 'final_presentation'])) {
                $updateData['progress_status'] = 'in_competition';
            }

            // If terminal stage, update progress_status
            if (in_array($newStage, ['winner', 'not_selected', 'withdrawn'])) {
                $updateData['progress_status'] = 'finished';
                if ($newStage === 'withdrawn') {
                    $updateData['registration_status'] = 'withdrawn';
                }
            }

            $participation->update($updateData);

            CompetitionStatusHistory::create([
                'participation_id' => $participation->id,
                'from_stage' => $oldStage,
                'to_stage' => $newStage,
                'notes' => $validated['notes'] ?? "Pembaruan tahapan seleksi ke {$newStage}.",
                'changed_by' => $user->id,
            ]);

            app(\App\Services\Notifications\NotificationService::class)->sendCompetitionStageChange(
                $participation->fresh(['team', 'competition']),
                $newStage,
                $validated['notes'] ?? null
            );
        });

        return back()->with('success', "Tahapan kompetisi berhasil diperbarui ke '{$newStage}'.");
    }

    public function lockFormation(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team']);

        if (!$participation->team || !$participation->team->isLeader($user)) {
            abort(403, 'Hanya ketua tim yang dapat mengunci susunan tim kompetisi.');
        }

        $this->membershipService->lockTeamFormation($participation, $user);

        return back()->with('success', 'Susunan tim kompetisi telah berhasil dikunci.');
    }

    public function inviteCandidate(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team']);

        if (!$participation->team || !$participation->team->isLeader($user)) {
            abort(403, 'Hanya ketua tim yang dapat menambahkan anggota ke tim kompetisi.');
        }

        $validated = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'role_name' => ['required', 'string', 'max:50'],
        ]);

        $student = User::findOrFail($validated['student_id']);
        if ($participation->team->hasMember($student)) {
            return back()->with('error', "Mahasiswa {$student->name} sudah bergabung dalam tim ini.");
        }

        $this->membershipService->addMemberToCompetitionTeam($participation->team, $student, $validated['role_name']);

        // Check if matching recruitment role exists and remove/decrement it
        if ($participation->team->recruitment) {
            $matchingRole = $participation->team->recruitment->roles()->where('name', $validated['role_name'])->first();
            if ($matchingRole) {
                if ($matchingRole->slots > 1) {
                    $matchingRole->decrement('slots');
                } else {
                    $matchingRole->delete();
                }
            }
        }

        return back()->with('success', "Mahasiswa {$student->name} berhasil ditambahkan ke tim sebagai {$validated['role_name']}.");
    }

    public function uploadDocument(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team']);

        if (!$participation->team || !$participation->team->hasMember($user)) {
            abort(403, 'Hanya anggota tim yang dapat mengunggah berkas persiapan.');
        }

        $validated = $request->validate([
            'required_document_key' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:255'],
            'file' => ['nullable', 'file', 'max:71680'], // max 70MB per file
            'url' => ['nullable', 'url', 'max:255'],
        ]);

        if (!$request->hasFile('file') && empty($validated['url'])) {
            throw ValidationException::withMessages([
                'file' => ['Silakan pilih berkas dokumen atau masukkan URL tautan berkas.'],
            ]);
        }

        $path = null;
        $originalName = null;
        $fileSize = 0;
        $mimeType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            if ($participation->team_id) {
                ObjectStorageService::checkTeamStorageQuota($participation->team_id, $file->getSize());
            }
            $stored = ObjectStorageService::store($file, 'competitions/documents');
            $originalName = $stored['original_name'];
            $fileSize = $stored['file_size'];
            $mimeType = $stored['mime_type'];
            $path = $stored['path'];
        }

        // Calculate latest version and record document atomically
        $lastVersion = 0;
        DB::transaction(function () use ($participation, $user, $validated, $originalName, $fileSize, $mimeType, $path, &$lastVersion) {
            $lastVersion = CompetitionDocument::where('participation_id', $participation->id)
                ->where('required_document_key', $validated['required_document_key'])
                ->lockForUpdate()
                ->max('version') ?? 0;

            CompetitionDocument::create([
                'participation_id' => $participation->id,
                'uploaded_by' => $user->id,
                'required_document_key' => $validated['required_document_key'],
                'name' => $validated['name'],
                'original_name' => $originalName,
                'path' => $path,
                'url' => $validated['url'] ?? null,
                'file_size' => $fileSize,
                'mime_type' => $mimeType,
                'version' => $lastVersion + 1,
                'status' => 'pending',
            ]);
        });

        return back()->with('success', "Dokumen '{$validated['name']}' versi " . ($lastVersion + 1) . ' berhasil diunggah.');
    }

    public function reviewDocument(Request $request, int|string $participationId, int $docId): RedirectResponse
    {
        $participation = $this->resolveParticipation($participationId);
        $document = CompetitionDocument::where('participation_id', $participation->id)->findOrFail($docId);

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:approved,revision_required,reviewed'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        $document->update([
            'status' => $validated['status'],
            'feedback' => $validated['feedback'] ?? null,
        ]);

        return back()->with('success', 'Ulasan dokumen berhasil disimpan.');
    }

    public function deleteDocument(Request $request, int|string $participationId, int $docId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team', 'competition']);
        $document = CompetitionDocument::where('participation_id', $participation->id)->findOrFail($docId);

        $isLeader = $participation->team && $participation->team->isLeader($user);
        $isUploader = (int)$document->uploaded_by === (int)$user->id;
        $isPrivileged = $user->isCampusAdminOf($participation->competition->campus_id) || $user->isPlatformAdmin();

        if (!$isLeader && !$isUploader && !$isPrivileged) {
            abort(403, 'Hanya pengunggah berkas, ketua tim, atau admin yang dapat menghapus berkas ini.');
        }

        $docName = $document->name;
        $filePath = $document->path;

        // Delete physical file from object storage if present
        if (!empty($filePath)) {
            try {
                ObjectStorageService::delete($filePath);
            } catch (\Throwable $e) {
                \Log::warning("Failed to delete physical file from storage: {$filePath}. Error: " . $e->getMessage());
            }
        }

        $document->delete();

        return back()->with('success', "Berkas '{$docName}' berhasil dihapus.");
    }

    public function replaceDocument(Request $request, int|string $participationId, int $docId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team', 'competition']);
        $document = CompetitionDocument::where('participation_id', $participation->id)->findOrFail($docId);

        $isLeader = $participation->team && $participation->team->isLeader($user);
        $isUploader = (int)$document->uploaded_by === (int)$user->id;
        $isMember = $participation->team && $participation->team->hasMember($user);
        $isPrivileged = $user->isCampusAdminOf($participation->competition->campus_id) || $user->isPlatformAdmin();

        if (!$isLeader && !$isUploader && !$isMember && !$isPrivileged) {
            abort(403, 'Hanya anggota tim yang dapat memperbarui berkas.');
        }

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'file' => ['nullable', 'file', 'max:71680'], // max 70MB per file
            'url' => ['nullable', 'url', 'max:255'],
            'mode' => ['nullable', 'string', 'in:replace,new_version'],
        ]);

        if (!$request->hasFile('file') && empty($validated['url'])) {
            throw ValidationException::withMessages([
                'file' => ['Silakan pilih berkas pengganti baru atau masukkan URL tautan berkas.'],
            ]);
        }

        $mode = $validated['mode'] ?? 'replace';
        $name = !empty($validated['name']) ? $validated['name'] : $document->name;

        $newPath = null;
        $originalName = null;
        $fileSize = 0;
        $mimeType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            if ($participation->team_id) {
                $replacingBytes = ($mode === 'replace') ? (int) $document->file_size : 0;
                ObjectStorageService::checkTeamStorageQuota($participation->team_id, $file->getSize(), $replacingBytes);
            }
            $folder = str_starts_with($document->path ?? '', 'competitions/deliverables') ? 'competitions/deliverables' : 'competitions/documents';
            $stored = ObjectStorageService::store($file, $folder);
            $originalName = $stored['original_name'];
            $fileSize = $stored['file_size'];
            $mimeType = $stored['mime_type'];
            $newPath = $stored['path'];
        }

        if ($mode === 'new_version') {
            $nextVersion = CompetitionDocument::where('participation_id', $participation->id)
                ->where('required_document_key', $document->required_document_key)
                ->max('version') ?? $document->version;

            $newDoc = CompetitionDocument::create([
                'participation_id' => $participation->id,
                'competition_round_id' => $document->competition_round_id,
                'uploaded_by' => $user->id,
                'required_document_key' => $document->required_document_key,
                'name' => $name,
                'description' => $document->description,
                'original_name' => $originalName ?: $document->original_name,
                'path' => $newPath,
                'url' => $validated['url'] ?? null,
                'file_size' => $fileSize ?: $document->file_size,
                'mime_type' => $mimeType ?: $document->mime_type,
                'version' => $nextVersion + 1,
                'status' => 'pending',
                'submitted_at' => now(),
            ]);

            return back()->with('success', "Versi baru '{$name}' (v{$newDoc->version}) berhasil diunggah.");
        } else {
            // Overwrite existing document
            if ($newPath && $document->path && $document->path !== $newPath) {
                try {
                    ObjectStorageService::delete($document->path);
                } catch (\Throwable $e) {
                    \Log::warning("Failed to delete overwritten file: {$document->path}");
                }
            }

            $updateData = [
                'name' => $name,
                'status' => 'pending',
                'feedback' => null,
            ];

            if ($newPath) {
                $updateData['path'] = $newPath;
                $updateData['original_name'] = $originalName;
                $updateData['file_size'] = $fileSize;
                $updateData['mime_type'] = $mimeType;
                $updateData['url'] = null;
            }

            if (!empty($validated['url'])) {
                $updateData['url'] = $validated['url'];
                if (!$newPath && $document->path) {
                    try {
                        ObjectStorageService::delete($document->path);
                    } catch (\Throwable $e) {}
                    $updateData['path'] = null;
                    $updateData['original_name'] = null;
                    $updateData['file_size'] = 0;
                    $updateData['mime_type'] = null;
                }
            }

            $document->update($updateData);

            return back()->with('success', "Berkas '{$name}' berhasil diperbarui / diganti.");
        }
    }

    public function recordResult(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team', 'competition']);

        $isLeader = $participation->team && $participation->team->isLeader($user);
        $isMember = $participation->team && $participation->team->hasMember($user);
        $isPrivileged = $user->isCampusAdminOf($participation->competition->campus_id) || $user->isPlatformAdmin() || $user->isLecturer();

        if (!$isLeader && !$isMember && !$isPrivileged) {
            abort(403, 'Hanya anggota/ketua tim atau dosen/admin yang dapat mencatat hasil kompetisi.');
        }

        $validated = $request->validate([
            'outcome' => ['required', 'string', 'in:1st_place,2nd_place,3rd_place,finalist,participant,special_award,not_selected,withdrawn'],
            'achievement_title' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'rank' => ['nullable', 'integer', 'min:1'],
            'evidence_url' => ['nullable', 'url', 'max:255'],
            'certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        $certPath = null;
        if ($request->hasFile('certificate')) {
            $certPath = ObjectStorageService::store($request->file('certificate'), 'competitions/certificates')['path'];
        } elseif (!empty($validated['evidence_url'])) {
            $certPath = $validated['evidence_url'];
        }

        $this->membershipService->completeCompetition(
            $participation,
            $validated['outcome'],
            $validated['achievement_title'],
            $certPath ?? ($validated['evidence_url'] ?? null),
            $isPrivileged ? $user : null,
            $validated['rank'] ?? null,
            $validated['notes'] ?? null
        );

        if ($participation->fresh()->result) {
            app(\App\Services\Notifications\NotificationService::class)->sendCompetitionResult($participation->fresh()->result);
        }

        $message = $isPrivileged
            ? 'Hasil kompetisi berhasil dicatat dan langsung diverifikasi ke portofolio mahasiswa!'
            : 'Hasil kompetisi berhasil diajukan dan menunggu verifikasi dari dosen pembimbing / admin.';

        return back()->with('success', $message);
    }

    public function verifyResult(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['result', 'team.members', 'competition']);

        if (!$user->isCampusAdminOf($participation->competition->campus_id) && !$user->isPlatformAdmin() && !$user->isLecturer()) {
            abort(403, 'Hanya dosen atau administrator yang dapat memverifikasi sertifikat prestasi.');
        }

        $result = $participation->result;
        if (!$result) {
            abort(404, 'Hasil kompetisi belum dicatat.');
        }

        DB::transaction(function () use ($result, $participation, $user) {
            $result->update([
                'verification_status' => 'verified',
                'verified_by' => $user->id,
                'verified_at' => now(),
            ]);

            // Create or update verified portfolio achievement for each team member
            if ($participation->team) {
                $outcomeStr = $result->outcome instanceof \BackedEnum ? $result->outcome->value : (string) $result->outcome;
                foreach ($participation->team->members as $member) {
                    $ach = Achievement::firstOrCreate(
                        [
                            'user_id' => $member->user_id,
                            'participation_id' => $participation->id,
                            'type' => AchievementType::CompetitionResult->value,
                        ],
                        [
                            'campus_id' => $participation->competition->campus_id,
                            'team_id' => $participation->team_id,
                            'title' => $result->achievement_title ?? "Prestasi: {$participation->competition->name} ({$outcomeStr})",
                            'description' => "Menyelesaikan kompetisi {$participation->competition->name} dengan hasil {$outcomeStr} sebagai {$member->role_name}.",
                            'achieved_on' => now(),
                            'evidence_url' => $result->certificate_path ?? $result->evidence_url,
                            'verification_status' => AchievementVerification::Verified->value,
                            'verified_by' => $user->id,
                            'verified_at' => now(),
                            'is_public' => true,
                        ]
                    );

                    app(\App\Services\Notifications\NotificationService::class)->sendAchievementVerified($ach);
                }
            }
        });

        return back()->with('success', 'Prestasi kompetisi telah resmi diverifikasi dan diterbitkan ke portofolio mahasiswa.');
    }

    public function assignMentor(Request $request, int|string $participationId): RedirectResponse
    {
        $participation = $this->resolveParticipation($participationId, ['team']);

        $validated = $request->validate([
            'lecturer_id' => ['required', 'exists:users,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $lecturer = User::findOrFail($validated['lecturer_id']);

        $participation->update([
            'mentor_id' => $lecturer->id,
            'mentor_notes' => $validated['notes'] ?? null,
        ]);

        CompetitionMentor::firstOrCreate([
            'participation_id' => $participation->id,
            'lecturer_id' => $lecturer->id,
        ], [
            'notes' => $validated['notes'] ?? null,
            'assigned_at' => now(),
        ]);

        return back()->with('success', "Dosen pembimbing {$lecturer->name} berhasil ditugaskan.");
    }

    public function createTask(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team', 'competition']);

        $isAuthorized = $participation->team && (
            $participation->team->hasMember($user) ||
            $participation->team->leader_id === $user->id ||
            $user->role === 'admin' ||
            (method_exists($user, 'isPlatformAdmin') && $user->isPlatformAdmin())
        );

        if (!$isAuthorized) {
            abort(403, 'Hanya anggota tim yang dapat membuat tugas.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', Rule::enum(TaskPriority::class)],
            'due_on' => ['nullable', 'date'],
            'assignee_id' => ['nullable', 'exists:users,id'],
        ]);

        DB::transaction(function () use ($participation, $user, $validated) {
            Task::create([
                'campus_id' => $participation->competition?->campus_id ?? $user->campusId(),
                'team_id' => $participation->team->id,
                'created_by' => $user->id,
                'assignee_id' => $validated['assignee_id'] ?? null,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'status' => TaskStatus::Todo,
                'priority' => $validated['priority'],
                'due_on' => $validated['due_on'] ?? null,
            ]);
        });

        return back()->with('success', "Tugas '{$validated['title']}' berhasil ditambahkan ke Kanban tim.");
    }

    public function updateTask(Request $request, int|string $participationId, int $taskId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team']);

        $isAuthorized = $participation->team && (
            $participation->team->hasMember($user) ||
            $participation->team->leader_id === $user->id ||
            $user->role === 'admin' ||
            (method_exists($user, 'isPlatformAdmin') && $user->isPlatformAdmin())
        );

        if (!$isAuthorized) {
            abort(403, 'Hanya anggota tim yang dapat mengubah status tugas.');
        }

        $task = Task::where('team_id', $participation->team->id)->findOrFail($taskId);

        $validated = $request->validate([
            'status' => ['required', Rule::enum(TaskStatus::class)],
        ]);

        $task->update([
            'status' => $validated['status'],
            'completed_at' => $validated['status'] === TaskStatus::Completed->value ? now() : null,
        ]);

        return back()->with('success', 'Status tugas berhasil diperbarui.');
    }

    public function deleteTask(Request $request, int|string $participationId, int $taskId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team']);

        $isAuthorized = $participation->team && (
            $participation->team->hasMember($user) ||
            $participation->team->leader_id === $user->id ||
            $user->role === 'admin' ||
            (method_exists($user, 'isPlatformAdmin') && $user->isPlatformAdmin())
        );

        if (!$isAuthorized) {
            abort(403, 'Hanya anggota tim yang dapat menghapus tugas.');
        }

        $task = Task::where('team_id', $participation->team->id)->findOrFail($taskId);
        $taskTitle = $task->title;
        $task->delete();

        return back()->with('success', "Tugas '{$taskTitle}' berhasil dihapus.");
    }

    public function generateTasksWithAi(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team.members', 'competition']);

        $isAuthorized = $participation->team && (
            $participation->team->hasMember($user) ||
            $participation->team->leader_id === $user->id ||
            $user->role === 'admin' ||
            (method_exists($user, 'isPlatformAdmin') && $user->isPlatformAdmin())
        );

        if (!$isAuthorized) {
            abort(403, 'Hanya anggota tim yang dapat membuat rekomendasi tugas.');
        }

        try {
            $result = \App\Services\AI\GeminiAgentService::applyTasksToKanban($participation, $user);
            return back()->with('success', "{$result['count']} tugas persiapan berhasil disusun otomatis oleh AI Gemini untuk tim Anda!");
        } catch (\Throwable $e) {
            return back()->with('error', 'Gagal menyusun tugas AI: ' . $e->getMessage());
        }
    }

    public function toggleBookmark(Request $request, string|int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = $this->resolveCompetition($id);

        $bookmark = Bookmark::where('user_id', $user->id)
            ->where('bookmarkable_type', Competition::class)
            ->where('bookmarkable_id', $competition->id)
            ->first();

        if ($bookmark) {
            $bookmark->delete();
            $message = 'Kompetisi dihapus dari simpanan.';
        } else {
            Bookmark::create([
                'user_id' => $user->id,
                'bookmarkable_type' => Competition::class,
                'bookmarkable_id' => $competition->id,
            ]);
            $message = 'Kompetisi berhasil disimpan ke bookmark Anda.';
        }

        return back()->with('success', $message);
    }

    public function storeRound(Request $request, string|int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = $this->resolveCompetition($id);

        if (!$user->isLecturer() && !$user->isCampusAdminOf($competition->campus_id) && !$user->isPlatformAdmin()) {
            abort(403, 'Hanya dosen atau administrator yang dapat menambahkan tahapan kompetisi.');
        }

        $validated = $request->validate([
            'round_number' => ['required', 'integer', 'min:1'],
            'name' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_final_round' => ['nullable', 'boolean'],
        ]);

        $this->roundService->createRound($competition, $validated, $user);

        return back()->with('success', "Tahapan/Babak '{$validated['name']}' berhasil ditambahkan ke jadwal kompetisi.");
    }

    public function updateRound(Request $request, string|int $id, int $roundId): RedirectResponse
    {
        $user = $request->user();
        $competition = $this->resolveCompetition($id);
        $round = CompetitionRound::where('competition_id', $competition->id)->findOrFail($roundId);

        if (!$user->isLecturer() && !$user->isCampusAdminOf($competition->campus_id) && !$user->isPlatformAdmin()) {
            abort(403, 'Hanya dosen atau administrator yang dapat memperbarui tahapan kompetisi.');
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'in:upcoming,open,submission_closed,under_evaluation,qualified,not_qualified,completed'],
            'is_final_round' => ['nullable', 'boolean'],
        ]);

        $this->roundService->updateRound($round, $validated, $user);

        return back()->with('success', "Tahapan kompetisi '{$round->name}' berhasil diperbarui.");
    }

    public function sendTeamInvitation(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team']);

        if (!$participation->team || !$participation->team->isLeader($user)) {
            abort(403, 'Hanya ketua tim yang dapat mengirim undangan anggota ke tim kompetisi.');
        }

        $validated = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'role_name' => ['required', 'string', 'max:100'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $student = User::findOrFail($validated['student_id']);

        $invitation = $this->teamFormationService->sendInvitation(
            $participation,
            $user,
            $student,
            $validated['role_name'],
            $validated['message'] ?? null
        );

        return back()->with('success', "Undangan resmi bergabung ke tim telah dikirim kepada {$student->name}.");
    }

    public function acceptInvitation(Request $request, int $invitationId): RedirectResponse
    {
        $user = $request->user();
        $invitation = Invitation::with('team')->findOrFail($invitationId);

        if ($invitation->invitee_id !== $user->id) {
            abort(403, 'Anda tidak memiliki hak untuk menerima undangan ini.');
        }

        $member = $this->teamFormationService->acceptInvitation($invitation, $user);

        return back()->with('success', "Selamat! Anda telah resmi bergabung dengan tim {$invitation->team->name} sebagai {$member->role_name}.");
    }

    public function declineInvitation(Request $request, int $invitationId): RedirectResponse
    {
        $user = $request->user();
        $invitation = Invitation::findOrFail($invitationId);

        if ($invitation->invitee_id !== $user->id) {
            abort(403, 'Anda tidak memiliki hak untuk menolak undangan ini.');
        }

        $this->teamFormationService->declineInvitation($invitation, $user, $request->input('reason'));

        return back()->with('success', 'Undangan bergabung ke tim berhasil ditolak.');
    }

    public function allocateStudent(Request $request, string|int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = $this->resolveCompetition($id);

        if (!$user->isLecturer() && !$user->isPlatformAdmin() && !$user->isCampusAdminOf($competition->campus_id)) {
            abort(403, 'Hanya dosen atau administrator yang dapat melakukan alokasi tim kompetisi.');
        }

        $validated = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'team_id' => ['required', 'exists:teams,id'],
            'suggested_role' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $student = User::findOrFail($validated['student_id']);
        $team = Team::findOrFail($validated['team_id']);

        $allocation = $this->teamFormationService->allocateStudent(
            $competition,
            $user,
            $student,
            $team,
            $validated['suggested_role'] ?? 'Anggota Tim',
            $validated['notes'] ?? null
        );

        return back()->with('success', "Mahasiswa {$student->name} berhasil dialokasikan ke tim '{$team->name}' dan notifikasi persetujuan telah dikirim.");
    }

    public function confirmAllocation(Request $request, int $allocationId): RedirectResponse
    {
        $user = $request->user();
        $allocation = CompetitionAllocation::with('team')->findOrFail($allocationId);

        if ($allocation->student_id !== $user->id) {
            abort(403, 'Anda tidak memiliki hak untuk merespon alokasi ini.');
        }

        $member = $this->teamFormationService->confirmAllocation($allocation, $user);

        return back()->with('success', "Alokasi tim berhasil diterima! Anda telah resmi menjadi anggota tim '{$allocation->team->name}' sebagai {$member->role_name}.");
    }

    public function rejectAllocation(Request $request, int $allocationId): RedirectResponse
    {
        $user = $request->user();
        $allocation = CompetitionAllocation::findOrFail($allocationId);

        if ($allocation->student_id !== $user->id) {
            abort(403, 'Anda tidak memiliki hak untuk menolak alokasi ini.');
        }

        $allocation->update([
            'status' => 'declined',
            'responded_at' => now(),
            'notes' => ($allocation->notes ? $allocation->notes . "\n" : '') . 'Ditolak mahasiswa: ' . ($request->input('reason') ?? 'Tanpa alasan spesifik'),
        ]);

        return back()->with('success', 'Rekomendasi alokasi tim berhasil ditolak.');
    }

    public function approveFormation(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['competition', 'team']);

        if (!$user->isLecturer() && !$user->isPlatformAdmin() && !$user->isCampusAdminOf($participation->competition->campus_id)) {
            abort(403, 'Hanya dosen pembimbing atau administrator yang dapat menyetujui susunan tim.');
        }

        $this->teamFormationService->approveFormation($participation, $user, $request->input('notes'));

        return back()->with('success', 'Susunan tim kompetisi telah resmi disetujui dan diverifikasi oleh dosen pembimbing.');
    }

    public function submitDeliverable(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team']);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'required_document_key' => ['nullable', 'string', 'max:100'],
            'competition_round_id' => ['nullable', 'exists:competition_rounds,id'],
            'description' => ['nullable', 'string'],
            'url' => ['nullable', 'url', 'max:255'],
            'external_submission_url' => ['nullable', 'url', 'max:255'],
            'deadline' => ['nullable', 'date'],
            'file' => ['nullable', 'file', 'max:71680'], // max 70MB per file
        ]);

        $doc = $this->deliverableService->submitDeliverable(
            $participation,
            $user,
            $validated,
            $request->file('file')
        );

        return back()->with('success', "Berkas deliverable '{$doc->name}' versi {$doc->version} berhasil diunggah.");
    }

    public function reviewDeliverable(Request $request, int|string $participationId, int $docId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['competition']);
        $document = CompetitionDocument::where('participation_id', $participation->id)->findOrFail($docId);

        $isMentor = $participation->mentor_id === $user->id || $participation->mentors()->where('user_id', $user->id)->exists();
        $isPrivileged = $user->isCampusAdminOf($participation->competition->campus_id) || $user->isPlatformAdmin() || $user->isLecturer();

        if (!$isMentor && !$isPrivileged) {
            abort(403, 'Hanya dosen pembimbing atau admin yang dapat memberikan ulasan deliverable.');
        }

        $validated = $request->validate([
            'status' => ['required', 'string', 'in:draft,in_review,ready,submitted,accepted,revision_required,rejected,approved'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        $this->deliverableService->reviewDeliverable($document, $user, $validated['status'], $validated['feedback'] ?? null);

        return back()->with('success', 'Ulasan dan status berkas deliverable berhasil disimpan.');
    }

    public function withdrawMember(Request $request, int|string $participationId, int $userId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team.members']);
        $team = $participation->team;

        if (!$team) {
            abort(404, 'Tim tidak ditemukan.');
        }

        $isLeader = $team->isLeader($user);
        $isSelf = $user->id === $userId;

        if (!$isLeader && !$isSelf) {
            abort(403, 'Hanya ketua tim atau anggota yang bersangkutan yang dapat melakukan pelepasan keanggotaan.');
        }

        $targetMember = User::findOrFail($userId);
        $reason = $request->input('reason', $isSelf ? 'Mengundurkan diri atas inisiatif sendiri.' : 'Dilepas oleh ketua tim.');

        $this->unifiedMembershipService->withdrawFromTeam($team, $targetMember, $reason);

        return back()->with('success', "Keanggotaan {$targetMember->name} dalam tim kompetisi telah berhasil dilepas.");
    }

    // MinSatu Flow: Student applies to an open recruiting team
    public function applyTeam(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        $participation = $this->resolveParticipation($participationId, ['team.members', 'team.recruitment.roles', 'competition']);
        $team = $participation->team;

        if (!$team) {
            abort(404, 'Tim kompetisi tidak ditemukan.');
        }

        if ($participation->is_formation_locked) {
            return back()->with('error', 'Formasi tim ini sudah dikunci dan tidak menerima pelamar baru.');
        }

        $isAlreadyInTeam = $team->hasMember($user)
            || $team->isLeader($user)
            || $team->members()->where('user_id', $user->id)->exists();

        if ($isAlreadyInTeam) {
            return back()->with('error', 'Anda sudah bergabung dalam tim ini. Anda tidak dapat mengajukan diri lagi ke tim ini.');
        }

        $maxCapacity = $participation->competition->max_team_size ?? 5;
        $currentMembersCount = $team->members()->where('status', 'active')->count();
        if ($currentMembersCount >= $maxCapacity) {
            return back()->with('error', 'Kapasitas maksimal tim ini sudah terpenuhi.');
        }

        $validated = $request->validate([
            'role_name' => ['nullable', 'string', 'max:80'],
            'recruitment_role_id' => ['nullable', 'exists:recruitment_roles,id'],
            'message' => ['required', 'string', 'max:1000'],
            'whatsapp_number' => ['nullable', 'string', 'max:30'],
            'portfolio_url' => ['nullable', 'url', 'max:255'],
        ]);

        $campusId = $user->campusId() ?? $team->campus_id;

        DB::transaction(function () use ($team, $campusId, $participation, $validated, $user) {
            $recruitment = $team->recruitment()->firstOrCreate(
                ['team_id' => $team->id],
                [
                    'campus_id' => $campusId,
                    'title' => 'Rekrutmen Tim ' . $team->name,
                    'description' => 'Mencari anggota tim untuk ' . $participation->competition->name,
                    'status' => RecruitmentStatus::Open,
                ]
            );

            $roleId = $validated['recruitment_role_id'] ?? null;
            if (!$roleId && !empty($validated['role_name'])) {
                $role = $recruitment->roles()->firstOrCreate(
                    ['name' => $validated['role_name']],
                    ['slots' => 1]
                );
                $roleId = $role->id;
            }

            if ($user->profile) {
                $profileUpdates = [];
                if (!empty($validated['whatsapp_number'])) {
                    $profileUpdates['phone'] = $validated['whatsapp_number'];
                }
                if (!empty($validated['portfolio_url']) && empty($user->profile->portfolio_url)) {
                    $profileUpdates['portfolio_url'] = $validated['portfolio_url'];
                }
                if (!empty($profileUpdates)) {
                    $user->profile->update($profileUpdates);
                }
            }

            Application::updateOrCreate(
                [
                    'recruitment_id' => $recruitment->id,
                    'user_id' => $user->id,
                ],
                [
                    'recruitment_role_id' => $roleId,
                    'message' => $validated['message'],
                    'contact_phone' => $validated['whatsapp_number'] ?? ($user->profile?->phone ?? null),
                    'portfolio_url' => $validated['portfolio_url'] ?? ($user->profile?->portfolio_url ?? null),
                    'status' => ApplicationStatus::Pending,
                    'decided_by' => null,
                    'decided_at' => null,
                    'decision_note' => null,
                ]
            );
        });

        return back()->with('success', "Lamaran kamu berhasil dikirim ke ketua tim {$team->name}! Ketua tim dapat menghubungi kamu langsung via WhatsApp.");
    }

    // MinSatu Flow: Team leader responds to applicant (Accept / Reject)
    public function respondApplication(Request $request, int|string $participationId, int $applicationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team.members', 'competition']);
        $team = $participation->team;

        if (!$team || (!$team->isLeader($user) && !$user->isPlatformAdmin())) {
            abort(403, 'Hanya ketua tim yang dapat memproses lamaran.');
        }

        $application = Application::with(['user.profile', 'role', 'recruitment'])->findOrFail($applicationId);

        $validated = $request->validate([
            'action' => ['required', 'in:accept,reject'],
            'decision_note' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($validated, $application, $team, $user) {
            if ($validated['action'] === 'accept') {
                $roleName = $application->role?->name ?? 'Anggota Tim';

                $this->membershipService->addMemberToCompetitionTeam(
                    $team,
                    $application->user,
                    $roleName,
                    $application->recruitment_role_id
                );

                // Automatically remove or decrement the approved recruitment position
                $recRole = null;
                if ($application->recruitment_role_id) {
                    $recRole = RecruitmentRole::find($application->recruitment_role_id);
                }
                if (!$recRole && $team->recruitment) {
                    $recRole = $team->recruitment->roles()->where('name', $roleName)->first();
                }

                if ($recRole) {
                    if ($recRole->slots > 1) {
                        $recRole->decrement('slots');
                    } else {
                        $recRole->delete();
                    }
                }

                $application->update([
                    'status' => ApplicationStatus::Accepted,
                    'decided_by' => $user->id,
                    'decided_at' => now(),
                    'decision_note' => $validated['decision_note'] ?? 'Lamaran diterima oleh ketua tim.',
                ]);
            } else {
                $application->update([
                    'status' => ApplicationStatus::Rejected,
                    'decided_by' => $user->id,
                    'decided_at' => now(),
                    'decision_note' => $validated['decision_note'] ?? 'Lamaran ditolak.',
                ]);
            }
        });

        if ($validated['action'] === 'accept') {
            return back()->with('success', "Mahasiswa {$application->user->name} resmi bergabung dengan tim {$team->name}!");
        } else {
            return back()->with('success', "Lamaran dari {$application->user->name} telah ditolak.");
        }
    }

    // MinSatu Flow: Manage recruiting roles for competition team
    public function storeRecruitmentRole(Request $request, int|string $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team', 'competition']);
        $team = $participation->team;

        if (!$team || (!$team->isLeader($user) && !$user->isPlatformAdmin())) {
            abort(403, 'Hanya ketua tim yang dapat menambah lowongan peran.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'slots' => ['required', 'integer', 'min:1', 'max:10'],
            'requirements' => ['nullable', 'string', 'max:500'],
        ]);

        $campusId = $user->campusId() ?? $team->campus_id;
        DB::transaction(function () use ($team, $campusId, $participation, $validated) {
            $recruitment = $team->recruitment()->firstOrCreate(
                ['team_id' => $team->id],
                [
                    'campus_id' => $campusId,
                    'title' => 'Rekrutmen Tim ' . $team->name,
                    'description' => 'Mencari anggota untuk ' . $participation->competition->name,
                    'status' => RecruitmentStatus::Open,
                ]
            );

            $recruitment->roles()->create([
                'name' => $validated['name'],
                'slots' => $validated['slots'],
                'requirements' => $validated['requirements'] ?? null,
            ]);
        });

        return back()->with('success', "Peran '{$validated['name']}' berhasil ditambahkan ke lowongan tim!");
    }

    public function deleteRecruitmentRole(Request $request, int|string $participationId, int $roleId): RedirectResponse
    {
        $user = $request->user();
        $participation = $this->resolveParticipation($participationId, ['team']);
        $team = $participation->team;

        if (!$team || (!$team->isLeader($user) && !$user->isPlatformAdmin())) {
            abort(403, 'Hanya ketua tim yang dapat menghapus lowongan peran.');
        }

        $role = RecruitmentRole::where('id', $roleId)
            ->whereHas('recruitment', fn ($q) => $q->where('team_id', $team->id))
            ->firstOrFail();

        $role->delete();

        return back()->with('success', 'Lowongan peran berhasil dihapus.');
    }

    protected function getStageLabel(string $stage): string
    {
        return match ($stage) {
            'recruiting' => 'Mencari Anggota Tim',
            'team_formation' => 'Pembentukan Tim',
            'preparing' => 'Persiapan Berkas & Karya',
            'registered' => 'Terdaftar Resmi',
            'submitted' => 'Karya Terkirim',
            'administrative_selection' => 'Seleksi Administrasi',
            'shortlisted' => 'Lolos Tahap Awal',
            'finalist' => 'Finalis Lomba',
            'final_presentation' => 'Presentasi Final',
            'winner' => 'Pemenang / Juara',
            'not_selected' => 'Belum Lolos',
            'withdrawn' => 'Dibatalkan / Withdrawn',
            default => ucwords(str_replace('_', ' ', $stage)),
        };
    }

    protected function getOutcomeLabel(string|CompetitionOutcome $outcome): string
    {
        $val = $outcome instanceof \BackedEnum ? $outcome->value : (string) $outcome;
        return match ($val) {
            '1st_place' => 'Juara 1 (Emas)',
            '2nd_place' => 'Juara 2 (Perak)',
            '3rd_place' => 'Juara 3 (Perunggu)',
            'finalist' => 'Finalis Resmi',
            'special_award' => 'Penghargaan Khusus / Harapan',
            'participant' => 'Peserta Resmi',
            'not_selected' => 'Partisipan (Belum Lolos)',
            'withdrawn' => 'Mengundurkan Diri',
            default => ucwords(str_replace('_', ' ', $val)),
        };
    }

    public function renameTeam(Request $request, $teamId)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100'],
        ]);

        $team = Team::findOrFail($teamId);
        $user = Auth::user();

        $isLeader = $team->leader_id === $user->id;
        $isMember = $team->members()->where('user_id', $user->id)->exists();

        if (! $isLeader && ! $isMember && ! $user->isPlatformAdmin()) {
            abort(403, 'Hanya anggota atau ketua tim yang berhak mengubah nama tim.');
        }

        $team->update([
            'name' => trim($validated['name']),
        ]);

        return back()->with('success', 'Nama tim berhasil diperbarui.');
    }
}
