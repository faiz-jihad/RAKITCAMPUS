<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionScope;
use App\Enums\CompetitionStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use App\Models\Competition;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionSource;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CompetitionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Competition::visibleTo($user)
            ->with(['sources', 'campus:id,name,slug'])
            ->orderByRaw('CASE WHEN registration_deadline >= NOW() THEN 0 ELSE 1 END')
            ->orderBy('registration_deadline', 'asc');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('scope')) {
            $query->where('scope', $request->input('scope'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('organizer', 'like', $search)
                  ->orWhere('description', 'like', $search);
            });
        }

        $competitions = $query->paginate($request->input('per_page', 12));

        return response()->json($competitions);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $competition = Competition::with([
            'sources',
            'campus:id,name,slug',
            'participations.team.members.user:id,name',
            'participations.project:id,title,slug',
        ])->findOrFail($id);

        $this->authorize('view', $competition);

        $isBookmarked = Bookmark::where('user_id', $user->id)
            ->where('bookmarkable_type', Competition::class)
            ->where('bookmarkable_id', $competition->id)
            ->exists();

        // Check if user is already participating in this competition with any team
        $userParticipation = $competition->participations
            ->first(fn ($p) => $p->team?->hasMember($user));

        return response()->json([
            'data' => $competition,
            'meta' => [
                'is_bookmarked' => $isBookmarked,
                'my_participation' => $userParticipation,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->authorize('create', Competition::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'organizer' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', Rule::enum(CompetitionCategory::class)],
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
            // Provenance source
            'source_label' => ['nullable', 'string', 'max:255'],
            'source_url' => ['nullable', 'url', 'max:255'],
            'source_notes' => ['nullable', 'string'],
        ]);

        $campusId = $user->campusId();
        $isGlobal = ($validated['scope'] ?? 'campus') === 'global' && $user->isPlatformAdmin();

        $competition = DB::transaction(function () use ($validated, $user, $campusId, $isGlobal) {
            $slug = Str::slug($validated['name']) . '-' . Str::lower(Str::random(6));

            $comp = Competition::create([
                'campus_id' => $isGlobal ? null : $campusId,
                'scope' => $isGlobal ? CompetitionScope::Global : CompetitionScope::Campus,
                'created_by' => $user->id,
                'name' => $validated['name'],
                'slug' => $slug,
                'organizer' => $validated['organizer'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'],
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
                'status' => CompetitionStatus::Open,
                'verification_status' => VerificationStatus::Unverified,
            ]);

            if (!empty($validated['source_url'])) {
                CompetitionSource::create([
                    'competition_id' => $comp->id,
                    'label' => $validated['source_label'] ?? 'Link Penyelenggara',
                    'url' => $validated['source_url'],
                    'notes' => $validated['source_notes'] ?? null,
                    'verified_at' => now(),
                    'verified_by' => $user->id,
                ]);

                // If user is admin, set verified
                if ($user->isCampusAdminOf($campusId) || $user->isPlatformAdmin()) {
                    $comp->update([
                        'verification_status' => VerificationStatus::Verified,
                        'last_verified_at' => now(),
                        'verified_by' => $user->id,
                    ]);
                }
            }

            return $comp;
        });

        return response()->json([
            'message' => 'Kompetisi berhasil ditambahkan.',
            'data' => $competition->load('sources'),
        ], 201);
    }

    public function participate(Request $request, int $id): JsonResponse
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

            // If no existing project team was reused, create a dedicated competition team
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
                    'role_name' => 'Team Leader',
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

            return CompetitionParticipation::create([
                'competition_id' => $competition->id,
                'team_id' => $team->id,
                'project_id' => $projectId,
                'registration_status' => 'planning',
                'submission_status' => 'not_started',
                'progress_status' => 'preparing',
            ]);
        });

        return response()->json([
            'message' => 'Pendaftaran tim kompetisi berhasil dibuat.',
            'data' => $participation->load(['team.members', 'competition']),
        ], 201);
    }

    public function toggleBookmark(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $competition = Competition::findOrFail($id);

        $bookmark = Bookmark::where('user_id', $user->id)
            ->where('bookmarkable_type', Competition::class)
            ->where('bookmarkable_id', $competition->id)
            ->first();

        if ($bookmark) {
            $bookmark->delete();
            $bookmarked = false;
        } else {
            Bookmark::create([
                'user_id' => $user->id,
                'bookmarkable_type' => Competition::class,
                'bookmarkable_id' => $competition->id,
            ]);
            $bookmarked = true;
        }

        return response()->json([
            'bookmarked' => $bookmarked,
            'message' => $bookmarked ? 'Kompetisi ditambahkan ke bookmark.' : 'Bookmark dihapus.',
        ]);
    }
}
