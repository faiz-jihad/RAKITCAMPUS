<?php

namespace App\Http\Controllers\Web;

use App\Enums\CompetitionCategory;
use App\Enums\CompetitionScope;
use App\Enums\CompetitionStatus;
use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use App\Models\Competition;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CompetitionWebController extends Controller
{
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

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('organizer', 'like', $search);
            });
        }

        $competitions = $query->paginate(12)->withQueryString();

        return Inertia::render('competitions/index', [
            'competitions' => $competitions,
            'filters' => $request->only(['search', 'category', 'status']),
            'categories' => CompetitionCategory::values(),
            'statuses' => CompetitionStatus::values(),
        ]);
    }

    public function show(Request $request, int $id): Response
    {
        $user = $request->user();
        $competition = Competition::with([
            'sources',
            'campus:id,name',
            'participations.team.members.user:id,name',
            'participations.project:id,title,slug',
        ])->findOrFail($id);

        $this->authorize('view', $competition);

        $isBookmarked = Bookmark::where('user_id', $user->id)
            ->where('bookmarkable_type', Competition::class)
            ->where('bookmarkable_id', $competition->id)
            ->exists();

        $myParticipation = $competition->participations
            ->first(fn ($p) => $p->team?->hasMember($user));

        return Inertia::render('competitions/show', [
            'competition' => $competition,
            'isBookmarked' => $isBookmarked,
            'myParticipation' => $myParticipation,
        ]);
    }
}
