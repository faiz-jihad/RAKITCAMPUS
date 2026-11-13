<?php

namespace App\Http\Controllers\Web\Admin;

use App\Enums\CampusRole;
use App\Enums\CompetitionCategory;
use App\Enums\CompetitionScope;
use App\Enums\CompetitionStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Models\Competition;
use App\Models\CompetitionSource;
use App\Services\Storage\ObjectStorageService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminCompetitionWebController extends Controller
{
    /**
     * Ensure the authenticated user has campus admin or platform admin rights.
     */
    protected function authorizeAdmin(Request $request): array
    {
        $user = $request->user();
        $membership = $user->activeMembership();
        $isCampusAdmin = ($membership && $membership->role === CampusRole::CampusAdmin) || $user->isPlatformAdmin();

        if (!$isCampusAdmin) {
            abort(403, 'Akses terbatas untuk administrator.');
        }

        $campusId = $user->isPlatformAdmin() ? null : $membership?->campus_id;

        return [$user, $campusId];
    }

    /**
     * Display a listing of all competitions with management filters.
     */
    public function index(Request $request): Response
    {
        [$user, $campusId] = $this->authorizeAdmin($request);

        $query = Competition::query()
            ->withCount('participations')
            ->with(['campus:id,name', 'creator:id,name']);

        if ($campusId) {
            $query->where(function ($q) use ($campusId) {
                $q->where('campus_id', $campusId)
                    ->orWhereNull('campus_id');
            });
        }

        if ($request->filled('search')) {
            $search = '%' . trim($request->input('search')) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                    ->orWhere('organizer', 'like', $search)
                    ->orWhere('description', 'like', $search);
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('level')) {
            $query->where('level', $request->input('level'));
        }

        // Stats summary
        $stats = [
            'total' => (clone $query)->count(),
            'open' => (clone $query)->where('status', CompetitionStatus::Open->value)->count(),
            'upcoming' => (clone $query)->where('status', CompetitionStatus::Upcoming->value)->count(),
            'closed' => (clone $query)->whereIn('status', [CompetitionStatus::Closed->value, CompetitionStatus::Completed->value])->count(),
        ];

        $competitions = $query
            ->orderByRaw('CASE WHEN registration_deadline >= NOW() THEN 0 ELSE 1 END')
            ->orderBy('registration_deadline', 'asc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($comp) {
                return [
                    'id' => $comp->id,
                    'name' => $comp->name,
                    'slug' => $comp->slug,
                    'organizer' => $comp->organizer,
                    'description' => $comp->description,
                    'category' => $comp->category?->value ?? $comp->category,
                    'category_label' => $comp->category instanceof CompetitionCategory ? $comp->category->label() : ucwords(str_replace('_', ' ', (string) $comp->category)),
                    'level' => $comp->level,
                    'competition_type' => $comp->competition_type,
                    'scope' => $comp->scope?->value ?? $comp->scope,
                    'status' => $comp->status?->value ?? $comp->status,
                    'verification_status' => $comp->verification_status?->value ?? $comp->verification_status,
                    'registration_opens_at' => $comp->registration_opens_at?->format('Y-m-d'),
                    'registration_deadline' => $comp->registration_deadline?->format('Y-m-d'),
                    'starts_at' => $comp->starts_at?->format('Y-m-d'),
                    'ends_at' => $comp->ends_at?->format('Y-m-d'),
                    'days_remaining' => $comp->registration_deadline ? (int) ceil(now()->floatDiffInDays($comp->registration_deadline, false)) : null,
                    'min_team_size' => $comp->min_team_size,
                    'max_team_size' => $comp->max_team_size,
                    'prize_info' => $comp->prize_info,
                    'official_url' => $comp->official_url,
                    'registration_url' => $comp->registration_url,
                    'participations_count' => $comp->participations_count,
                    'campus_name' => $comp->campus?->name,
                    'cover_image' => $comp->cover_image,
                    'cover_image_url' => $comp->cover_image_url ?? $comp->cover_image,
                ];
            });

        return Inertia::render('admin/competitions/index', [
            'competitions' => $competitions,
            'filters' => $request->only(['search', 'category', 'status', 'level']),
            'categories' => CompetitionCategory::values(),
            'statuses' => CompetitionStatus::values(),
            'levels' => ['local', 'regional', 'national', 'international'],
            'stats' => $stats,
        ]);
    }

    /**
     * Store a newly created competition by Admin.
     */
    public function store(Request $request): RedirectResponse
    {
        [$user, $campusId] = $this->authorizeAdmin($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'organizer' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'category' => ['required', Rule::enum(CompetitionCategory::class)],
            'level' => ['nullable', 'string', 'in:local,regional,national,international'],
            'competition_type' => ['nullable', 'string', 'in:team,individual'],
            'scope' => ['nullable', Rule::enum(CompetitionScope::class)],
            'status' => ['nullable', Rule::enum(CompetitionStatus::class)],
            'official_url' => ['nullable', 'url', 'max:255'],
            'registration_url' => ['nullable', 'url', 'max:255'],
            'registration_opens_at' => ['nullable', 'date'],
            'registration_deadline' => ['required', 'date'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'eligibility' => ['nullable', 'string', 'max:1000'],
            'min_team_size' => ['required', 'integer', 'min:1', 'max:20'],
            'max_team_size' => ['required', 'integer', 'gte:min_team_size', 'max:20'],
            'prize_info' => ['nullable', 'string', 'max:255'],
            'cover_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:4096'],
        ], [
            'name.required' => 'Nama kompetisi wajib diisi.',
            'organizer.required' => 'Nama institusi/penyelenggara wajib diisi.',
            'category.required' => 'Kategori kompetisi wajib dipilih.',
            'registration_deadline.required' => 'Batas akhir (deadline) pendaftaran wajib ditentukan.',
            'ends_at.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai pelaksanaan.',
            'max_team_size.gte' => 'Kapasitas maksimal anggota tim harus lebih besar atau sama dengan minimal.',
        ]);

        $isGlobal = ($validated['scope'] ?? 'campus') === 'global' || $user->isPlatformAdmin();
        $targetCampusId = $isGlobal ? null : ($campusId ?: $user->campusId());

        $coverImagePath = null;
        if ($request->hasFile('cover_image')) {
            $coverImagePath = ObjectStorageService::store($request->file('cover_image'), 'competitions/covers')['path'];
        }

        $slug = Str::slug($validated['name']) . '-' . Str::lower(Str::random(6));

        DB::transaction(function () use ($validated, $user, $targetCampusId, $isGlobal, $slug, $coverImagePath) {
            $comp = Competition::create([
                'campus_id' => $targetCampusId,
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
                'registration_opens_at' => $validated['registration_opens_at'] ?? now(),
                'registration_deadline' => $validated['registration_deadline'],
                'starts_at' => $validated['starts_at'] ?? null,
                'ends_at' => $validated['ends_at'] ?? null,
                'eligibility' => $validated['eligibility'] ?? 'Mahasiswa aktif D3/D4/S1',
                'min_team_size' => $validated['min_team_size'],
                'max_team_size' => $validated['max_team_size'],
                'prize_info' => $validated['prize_info'] ?? null,
                'cover_image' => $coverImagePath,
                'status' => $validated['status'] ?? CompetitionStatus::Open,
                'verification_status' => VerificationStatus::Verified,
                'last_verified_at' => now(),
                'verified_by' => $user->id,
            ]);

            if (!empty($validated['official_url']) || !empty($validated['registration_url'])) {
                CompetitionSource::create([
                    'competition_id' => $comp->id,
                    'label' => 'Portal Resmi Penyelenggara',
                    'url' => $validated['official_url'] ?: $validated['registration_url'],
                    'notes' => 'Didaftarkan langsung oleh Administrator Kampus.',
                    'verified_at' => now(),
                    'verified_by' => $user->id,
                ]);
            }
        });

        return back()->with('success', 'Kompetisi "' . $validated['name'] . '" berhasil dibuat dan dipublikasikan!');
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

    /**
     * Update an existing competition (deadlines, dates, active status, etc.).
     */
    public function update(Request $request, string|int $id): RedirectResponse
    {
        [$user, $campusId] = $this->authorizeAdmin($request);

        $competition = $this->resolveCompetition($id);

        if ($campusId && $competition->campus_id && $competition->campus_id !== $campusId) {
            abort(403, 'Anda tidak berwenang mengelola kompetisi dari kampus lain.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'organizer' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'category' => ['required', Rule::enum(CompetitionCategory::class)],
            'level' => ['nullable', 'string', 'in:local,regional,national,international'],
            'competition_type' => ['nullable', 'string', 'in:team,individual'],
            'status' => ['required', Rule::enum(CompetitionStatus::class)],
            'verification_status' => ['nullable', Rule::enum(VerificationStatus::class)],
            'official_url' => ['nullable', 'url', 'max:255'],
            'registration_url' => ['nullable', 'url', 'max:255'],
            'registration_opens_at' => ['nullable', 'date'],
            'registration_deadline' => ['required', 'date'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'eligibility' => ['nullable', 'string', 'max:1000'],
            'min_team_size' => ['required', 'integer', 'min:1', 'max:20'],
            'max_team_size' => ['required', 'integer', 'gte:min_team_size', 'max:20'],
            'prize_info' => ['nullable', 'string', 'max:255'],
            'cover_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:4096'],
        ], [
            'registration_deadline.required' => 'Batas akhir (deadline) pendaftaran wajib diisi.',
            'ends_at.after_or_equal' => 'Tanggal selesai harus sama atau setelah tanggal mulai pelaksanaan.',
            'max_team_size.gte' => 'Maksimal anggota tim harus lebih besar atau sama dengan minimal.',
        ]);

        $coverImagePath = $competition->getRawOriginal('cover_image');
        if ($request->boolean('remove_cover_image')) {
            $coverImagePath = null;
        } elseif ($request->hasFile('cover_image')) {
            $coverImagePath = ObjectStorageService::store($request->file('cover_image'), 'competitions/covers')['path'];
        }

        $competition->update([
            'name' => $validated['name'],
            'organizer' => $validated['organizer'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'level' => $validated['level'] ?? $competition->level,
            'competition_type' => $validated['competition_type'] ?? $competition->competition_type,
            'status' => $validated['status'],
            'verification_status' => $validated['verification_status'] ?? $competition->verification_status,
            'official_url' => $validated['official_url'] ?? null,
            'registration_url' => $validated['registration_url'] ?? null,
            'registration_opens_at' => $validated['registration_opens_at'] ?? $competition->registration_opens_at,
            'registration_deadline' => $validated['registration_deadline'],
            'starts_at' => $validated['starts_at'] ?? null,
            'ends_at' => $validated['ends_at'] ?? null,
            'eligibility' => $validated['eligibility'] ?? $competition->eligibility,
            'min_team_size' => $validated['min_team_size'],
            'max_team_size' => $validated['max_team_size'],
            'prize_info' => $validated['prize_info'] ?? null,
            'cover_image' => $coverImagePath,
        ]);

        return back()->with('success', 'Masa aktif dan detail kompetisi "' . $competition->name . '" berhasil diperbarui!');
    }

    /**
     * Quick status toggle or deadline extension.
     */
    public function updateStatus(Request $request, string|int $id): RedirectResponse
    {
        [$user, $campusId] = $this->authorizeAdmin($request);

        $competition = $this->resolveCompetition($id);

        if ($campusId && $competition->campus_id && $competition->campus_id !== $campusId) {
            abort(403, 'Akses tidak berwenang.');
        }

        $validated = $request->validate([
            'status' => ['nullable', Rule::enum(CompetitionStatus::class)],
            'extend_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'new_deadline' => ['nullable', 'date'],
        ]);

        if (!empty($validated['status'])) {
            $competition->status = $validated['status'];
        }

        if (!empty($validated['extend_days'])) {
            $base = $competition->registration_deadline ?: now();
            $competition->registration_deadline = Carbon::parse($base)->addDays($validated['extend_days']);
            $competition->status = CompetitionStatus::Open;
        } elseif (!empty($validated['new_deadline'])) {
            $competition->registration_deadline = $validated['new_deadline'];
            if (Carbon::parse($validated['new_deadline'])->isFuture()) {
                $competition->status = CompetitionStatus::Open;
            }
        }

        $competition->save();

        return back()->with('success', 'Status dan masa aktif kompetisi berhasil diperbarui!');
    }

    /**
     * Delete a competition.
     */
    public function destroy(Request $request, string|int $id): RedirectResponse
    {
        [$user, $campusId] = $this->authorizeAdmin($request);

        $competition = $this->resolveCompetition($id);

        if ($campusId && $competition->campus_id && $competition->campus_id !== $campusId) {
            abort(403, 'Akses tidak berwenang.');
        }

        $competitionName = $competition->name;
        $competition->delete();

        return back()->with('success', 'Kompetisi "' . $competitionName . '" berhasil dihapus dari sistem.');
    }
}
