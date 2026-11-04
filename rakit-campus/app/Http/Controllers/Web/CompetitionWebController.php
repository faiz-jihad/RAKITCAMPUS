<?php

namespace App\Http\Controllers\Web;

use App\Enums\AchievementType;
use App\Enums\AchievementVerification;
use App\Enums\CompetitionCategory;
use App\Enums\CompetitionScope;
use App\Enums\CompetitionStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\Bookmark;
use App\Models\Competition;
use App\Models\CompetitionDocument;
use App\Models\CompetitionMentor;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionResult;
use App\Models\CompetitionSource;
use App\Models\CompetitionStatusHistory;
use App\Models\Project;
use App\Models\Task;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Matchmaking\CompetitionMatchmakingService;
use App\Services\Matchmaking\MembershipService;
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
        protected CompetitionMatchmakingService $matchmakingService
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

        // Check if user is eligible to participate
        $eligibilityCheck = $user ? $this->membershipService->canJoinCompetition($user) : ['eligible' => false, 'reason' => 'Silakan login terlebih dahulu.'];

        return Inertia::render('competitions/show', [
            'competition' => $competition,
            'isBookmarked' => $isBookmarked,
            'myParticipation' => $myParticipation,
            'myLedProjects' => $myLedProjects,
            'eligibilityCheck' => $eligibilityCheck,
        ]);
    }

    public function participate(Request $request, int $id): RedirectResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);

        $validated = $request->validate([
            'project_id' => ['nullable', 'exists:projects,id'],
            'team_name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $campusId = $user->campusId();
        if (!$campusId) {
            throw ValidationException::withMessages(['user' => ['Anda belum terafiliasi dengan kampus.']]);
        }

        // Rule 1: Unified membership validation
        $this->membershipService->assertCanJoinCompetition($user);

        $participation = DB::transaction(function () use ($validated, $user, $competition, $campusId) {
            $projectId = $validated['project_id'] ?? null;
            $team = null;

            if ($projectId) {
                $project = Project::with('team')->findOrFail($projectId);
                if (!$project->isLeader($user)) {
                    throw ValidationException::withMessages([
                        'project_id' => ['Hanya ketua proyek yang dapat mendaftarkan proyek ke kompetisi.'],
                    ]);
                }
                $team = $project->team;
            }

            // Create dedicated competition team if not reusing project team
            if (!$team) {
                $team = Team::create([
                    'campus_id' => $campusId,
                    'leader_id' => $user->id,
                    'type' => TeamType::Competition,
                    'name' => $validated['team_name'],
                    'description' => $validated['description'] ?? null,
                    'capacity' => $competition->max_team_size,
                ]);

                TeamMember::create([
                    'team_id' => $team->id,
                    'user_id' => $user->id,
                    'permission' => TeamPermission::Leader,
                    'role_name' => 'Ketua Tim',
                    'joined_at' => now(),
                ]);
            }

            // Check if already registered
            $existing = CompetitionParticipation::where('competition_id', $competition->id)
                ->where('team_id', $team->id)
                ->first();

            if ($existing) {
                throw ValidationException::withMessages([
                    'team' => ['Tim ini sudah terdaftar dalam kompetisi tersebut.'],
                ]);
            }

            $part = CompetitionParticipation::create([
                'competition_id' => $competition->id,
                'team_id' => $team->id,
                'project_id' => $projectId,
                'registration_status' => 'planning',
                'submission_status' => 'not_started',
                'progress_status' => 'preparing',
                'stage' => 'recruiting',
            ]);

            CompetitionStatusHistory::create([
                'participation_id' => $part->id,
                'from_stage' => null,
                'to_stage' => 'recruiting',
                'notes' => "Tim '{$team->name}' resmi dibentuk dan mendaftar ke kompetisi {$competition->name}.",
                'changed_by' => $user->id,
            ]);

            return $part;
        });

        return redirect()->route('competitions.workspace', $participation->id)
            ->with('success', 'Tim kompetisi berhasil dibentuk! Selamat datang di Preparation Workspace.');
    }

    public function workspace(Request $request, int $participationId): Response
    {
        $user = $request->user();
        $participation = CompetitionParticipation::with([
            'competition.sources',
            'competition.campus:id,name',
            'team.members.user.profile.skills',
            'team.tasks.creator:id,name',
            'team.recruitment.roles',
            'mentor.lecturerProfile',
            'mentors.lecturerProfile',
            'documents.uploader:id,name',
            'result.verifier:id,name',
            'statusHistories.changer:id,name',
        ])->findOrFail($participationId);

        $team = $participation->team;
        $isMember = $team && $team->hasMember($user);
        $isLeader = $team && $team->isLeader($user);
        $isMentor = $participation->mentor_id === $user->id || $participation->mentors()->where('lecturer_id', $user->id)->exists();
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

        return Inertia::render('competitions/workspace', [
            'participation' => $participation,
            'readinessScore' => $readinessScore,
            'recommendedCandidates' => $recommendedCandidates,
            'availableLecturers' => $availableLecturers,
            'selectionStages' => $selectionStages,
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
                    Achievement::firstOrCreate(
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
}
