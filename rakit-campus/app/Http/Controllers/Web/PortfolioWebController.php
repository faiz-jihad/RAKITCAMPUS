<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\CompetitionResult;
use App\Models\ContributionRecord;
use App\Models\PortfolioItem;
use App\Models\StudentProfile;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioWebController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $achievements = Achievement::where('user_id', $user->id)
            ->with(['project:id,title,slug', 'participation.competition:id,name,slug'])
            ->latest('achieved_on')
            ->get();

        $competitionResults = CompetitionResult::whereHas('participation.team.members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['participation.competition:id,name,slug,level,category,cover_image,organizer', 'participation.team:id,name', 'verifier:id,name'])
            ->latest()
            ->get();

        $portfolioItems = PortfolioItem::where('user_id', $user->id)
            ->latest()
            ->get();

        $completedProjects = TeamMember::where('user_id', $user->id)
            ->whereHas('team.project', fn ($q) => $q->where('status', 'completed'))
            ->with('team.project')
            ->get();

        $profile = $user->profile()->with('skills')->first();

        return Inertia::render('portfolio/index', [
            'achievements' => $achievements,
            'competitionResults' => $competitionResults,
            'portfolioItems' => $portfolioItems,
            'completedProjects' => $completedProjects,
            'profile' => $profile,
        ]);
    }

    public function publicView(string $slug): Response
    {
        $profile = StudentProfile::with(['user', 'skills', 'experiences', 'campus'])
            ->where('slug', $slug)
            ->firstOrFail();

        if (!$profile->portfolio_public) {
            abort(403, 'Portfolio ini belum disetel publik oleh mahasiswa terkait.');
        }

        $userId = $profile->user_id;

        $achievements = Achievement::where('user_id', $userId)
            ->where('is_public', true)
            ->with(['project:id,title,slug', 'participation.competition:id,name,slug'])
            ->latest('achieved_on')
            ->get();

        $items = PortfolioItem::where('user_id', $userId)
            ->where('is_public', true)
            ->latest()
            ->get();

        return Inertia::render('portfolio/public', [
            'profile' => $profile,
            'achievements' => $achievements,
            'items' => $items,
        ]);
    }
}
