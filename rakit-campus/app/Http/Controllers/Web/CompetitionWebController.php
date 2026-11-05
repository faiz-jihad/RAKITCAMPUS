<?php

namespace App\Http\Controllers\Web;

use App\Enums\AchievementType;
use App\Enums\AchievementVerification;
use App\Enums\CompetitionCategory;
use App\Enums\CompetitionScope;
use App\Enums\CompetitionStatus;
use App\Enums\DeliverableStatus;
use App\Enums\RoundStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamStatus;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Achievement;
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
use App\Models\Task;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Matchmaking\CompetitionDeliverableService;
use App\Services\Matchmaking\CompetitionManagementService;
use App\Services\Matchmaking\CompetitionMatchmakingService;
use App\Services\Matchmaking\CompetitionRoundService;
use App\Services\Matchmaking\CompetitionTeamFormationService;
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
            ->with(['sources', 'campus:id,name'])
            ->orderByRaw('CASE WHEN registration_deadline >= NOW() THEN 0 ELSE 1 END')
            ->orderBy('registration_deadline', 'asc');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('level')) {
            $query->where('level', $request->input('level'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('organizer', 'like', $search)
                  ->orWhere('description', 'like', $search);
            });
        }

        $competitions = $query->paginate(12)->withQueryString();

        // Calculate statistics for header cards
        $stats = [
            'total' => Competition::visibleTo($user)->count(),
            'open_registration' => Competition::visibleTo($user)->where('registration_deadline', '>=', now())->count(),
            'national_international' => Competition::visibleTo($user)->whereIn('level', ['national', 'international'])->count(),
            'my_participations' => $user ? CompetitionParticipation::whereHas('team.members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })->count() : 0,
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

        return Inertia::render('competitions/index', [
            'competitions' => $competitions,
            'filters' => $request->only(['search', 'category', 'status', 'level']),
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
            $coverImagePath = $request->file('cover_image')->store('competitions/covers', 'public');
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

        return redirect()->route('competitions.show', $competition->id)->with('success', $message);
    }

    public function verify(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);

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

    public function show(Request $request, int $id): Response
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
        ])->findOrFail($id);

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

        // Open teams looking for members in this competition
        $openTeams = $competition->participations()
            ->where('is_formation_locked', false)
            ->whereIn('stage', ['recruiting', 'team_formation'])
            ->with(['team.leader:id,name', 'team.members.user:id,name'])
            ->get();

        // Available students in same campus for Lecturer-Led allocation
        $isLecturer = $user ? ($user->isLecturer() || $user->isPlatformAdmin()) : false;
        $campusStudents = collect();
        if ($isLecturer) {
            $campusId = $competition->campus_id ?? $user->campusId();
            $campusStudents = User::whereHas('memberships', function ($q) use ($campusId) {
                $q->where('role', \App\Enums\CampusRole::Student->value)
                  ->where('status', \App\Enums\MembershipStatus::Active->value);
                if ($campusId) {
                    $q->where('campus_id', $campusId);
                }
            })
            ->with(['profile.skills'])
            ->take(60)
            ->get()
            ->map(function ($s) use ($competition) {
                $hasActiveInComp = $this->eligibilityService->hasActiveCompetitionMembershipIn($s, $competition->id);
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

        return Inertia::render('competitions/show', [
            'competition' => $competition,
            'isBookmarked' => $isBookmarked,
            'myParticipation' => $myParticipation,
            'myLedProjects' => $myLedProjects,
            'eligibilityCheck' => $eligibilityCheck,
            'openTeams' => $openTeams,
            'isLecturer' => $isLecturer,
            'campusStudents' => $campusStudents,
            'myAllocations' => $myAllocations,
        ]);
    }

    public function participate(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);

        $validated = $request->validate([
            'project_id' => ['nullable', 'exists:projects,id'],
            'team_name' => ['required', 'string', 'max:100'],
            'category_track' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $participation = $this->teamFormationService->createTeam($competition, $user, $validated);

        return redirect()->route('competitions.workspace', $participation->id)
            ->with('success', 'Tim kompetisi berhasil dibentuk! Selamat datang di Preparation Workspace.');
    }

    public function workspace(Request $request, int $participationId): Response
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with([
            'competition.sources',
            'competition.campus:id,name',
            'competition.rounds',
            'team.members.user.profile.skills',
            'team.tasks.creator:id,name',
            'team.recruitment.roles',
            'team.invitations.invitee:id,name,email',
            'mentor.lecturerProfile',
            'mentors.user.lecturerProfile',
            'documents.round',
            'documents.uploader:id,name',
            'result.verifier:id,name',
            'statusHistories.changer:id,name',
        ])->findOrFail($participationId);

        $team = $participation->team;
        $isMember = $team && $team->hasMember($user);
        $isLeader = $team && $team->isLeader($user);
        $isMentor = $participation->mentor_id === $user->id || $participation->mentors()->where('user_id', $user->id)->exists();
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

        return Inertia::render('competitions/workspace', [
            'participation' => $participation,
            'readinessScore' => $readinessScore,
            'recommendedCandidates' => $recommendedCandidates,
            'availableLecturers' => $availableLecturers,
            'selectionStages' => $selectionStages,
            'teamAllocations' => $teamAllocations,
            'rounds' => $participation->competition?->rounds ?? collect(),
            'isLeader' => $isLeader,
            'isMember' => $isMember,
            'isMentor' => $isMentor,
            'isAdmin' => $isAdmin,
        ]);
    }

    public function updateStage(Request $request, int $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with(['team', 'competition'])->findOrFail($participationId);

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

            if (!empty($validated['external_registration_proof'])) {
                $updateData['external_registration_proof'] = $validated['external_registration_proof'];
                $updateData['registration_status'] = 'registered';
            }
            if (!empty($validated['external_submission_proof'])) {
                $updateData['external_submission_proof'] = $validated['external_submission_proof'];
                $updateData['submission_status'] = 'submitted';
            }

            // If terminal stage, update progress_status
            if (in_array($newStage, ['winner', 'not_selected', 'withdrawn'])) {
                $updateData['progress_status'] = 'finished';
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

    public function lockFormation(Request $request, int $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with('team')->findOrFail($participationId);

        if (!$participation->team || !$participation->team->isLeader($user)) {
            abort(403, 'Hanya ketua tim yang dapat mengunci susunan tim kompetisi.');
        }

        $this->membershipService->lockTeamFormation($participation, $user);

        return back()->with('success', 'Susunan tim kompetisi telah berhasil dikunci.');
    }

    public function inviteCandidate(Request $request, int $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with('team')->findOrFail($participationId);

        if (!$participation->team || !$participation->team->isLeader($user)) {
            abort(403, 'Hanya ketua tim yang dapat menambahkan anggota ke tim kompetisi.');
        }

        $validated = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'role_name' => ['required', 'string', 'max:50'],
        ]);

        $student = User::findOrFail($validated['student_id']);
        $this->membershipService->addMemberToCompetitionTeam($participation->team, $student, $validated['role_name']);

        return back()->with('success', "Mahasiswa {$student->name} berhasil ditambahkan ke tim sebagai {$validated['role_name']}.");
    }

    public function uploadDocument(Request $request, int $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with('team')->findOrFail($participationId);

        if (!$participation->team || !$participation->team->hasMember($user)) {
            abort(403, 'Hanya anggota tim yang dapat mengunggah berkas persiapan.');
        }

        $validated = $request->validate([
            'required_document_key' => ['required', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:255'],
            'file' => ['nullable', 'file', 'max:15360'], // max 15MB
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
            $originalName = $file->getClientOriginalName();
            $fileSize = $file->getSize();
            $mimeType = $file->getMimeType();
            $path = $file->store('competitions/documents', 'public');
        }

        // Calculate latest version for this document key
        $lastVersion = CompetitionDocument::where('participation_id', $participation->id)
            ->where('required_document_key', $validated['required_document_key'])
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

        return back()->with('success', "Dokumen '{$validated['name']}' versi " . ($lastVersion + 1) . ' berhasil diunggah.');
    }

    public function reviewDocument(Request $request, int $participationId, int $docId): RedirectResponse
    {
        $document = CompetitionDocument::where('participation_id', $participationId)->findOrFail($docId);

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

    public function recordResult(Request $request, int $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with(['team', 'competition'])->findOrFail($participationId);

        $isLeader = $participation->team && $participation->team->isLeader($user);
        $isPrivileged = $user->isCampusAdminOf($participation->competition->campus_id) || $user->isPlatformAdmin() || $user->isLecturer();

        if (!$isLeader && !$isPrivileged) {
            abort(403, 'Hanya ketua tim atau dosen/admin yang dapat mencatat hasil kompetisi.');
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
            $certPath = $request->file('certificate')->store('competitions/certificates', 'public');
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

    public function verifyResult(Request $request, int $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with(['result', 'team.members', 'competition'])->findOrFail($participationId);

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

    public function assignMentor(Request $request, int $participationId): RedirectResponse
    {
        $participation = CompetitionParticipation::with('team')->findOrFail($participationId);

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

    public function createTask(Request $request, int $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with('team')->findOrFail($participationId);

        if (!$participation->team || !$participation->team->hasMember($user)) {
            abort(403, 'Hanya anggota tim yang dapat membuat tugas.');
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'priority' => ['required', Rule::enum(TaskPriority::class)],
            'due_on' => ['nullable', 'date'],
            'assignee_id' => ['nullable', 'exists:users,id'],
        ]);

        Task::create([
            'campus_id' => $participation->competition->campus_id ?? $user->campusId(),
            'team_id' => $participation->team->id,
            'created_by' => $user->id,
            'assignee_id' => $validated['assignee_id'] ?? null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => TaskStatus::Todo,
            'priority' => $validated['priority'],
            'due_on' => $validated['due_on'] ?? null,
        ]);

        return back()->with('success', "Tugas '{$validated['title']}' berhasil ditambahkan ke Kanban tim.");
    }

    public function updateTask(Request $request, int $participationId, int $taskId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with('team')->findOrFail($participationId);

        if (!$participation->team || !$participation->team->hasMember($user)) {
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

    public function toggleBookmark(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);

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

    public function storeRound(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);

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

    public function updateRound(Request $request, int $id, int $roundId): RedirectResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);
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

    public function sendTeamInvitation(Request $request, int $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with('team')->findOrFail($participationId);

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

    public function allocateStudent(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);

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

    public function approveFormation(Request $request, int $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with(['competition', 'team'])->findOrFail($participationId);

        if (!$user->isLecturer() && !$user->isPlatformAdmin() && !$user->isCampusAdminOf($participation->competition->campus_id)) {
            abort(403, 'Hanya dosen pembimbing atau administrator yang dapat menyetujui susunan tim.');
        }

        $this->teamFormationService->approveFormation($participation, $user, $request->input('notes'));

        return back()->with('success', 'Susunan tim kompetisi telah resmi disetujui dan diverifikasi oleh dosen pembimbing.');
    }

    public function submitDeliverable(Request $request, int $participationId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with('team')->findOrFail($participationId);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'required_document_key' => ['nullable', 'string', 'max:100'],
            'competition_round_id' => ['nullable', 'exists:competition_rounds,id'],
            'description' => ['nullable', 'string'],
            'url' => ['nullable', 'url', 'max:255'],
            'external_submission_url' => ['nullable', 'url', 'max:255'],
            'deadline' => ['nullable', 'date'],
            'file' => ['nullable', 'file', 'max:20480'], // max 20MB
        ]);

        $doc = $this->deliverableService->submitDeliverable(
            $participation,
            $user,
            $validated,
            $request->file('file')
        );

        return back()->with('success', "Berkas deliverable '{$doc->name}' versi {$doc->version} berhasil diunggah.");
    }

    public function reviewDeliverable(Request $request, int $participationId, int $docId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with('competition')->findOrFail($participationId);
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

    public function withdrawMember(Request $request, int $participationId, int $userId): RedirectResponse
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with('team.members')->findOrFail($participationId);
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
}
