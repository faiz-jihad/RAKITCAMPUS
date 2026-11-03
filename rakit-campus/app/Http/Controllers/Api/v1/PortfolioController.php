<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\ContributionRecord;
use App\Models\PortfolioItem;
use App\Models\StudentProfile;
use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortfolioController extends Controller
{
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $achievements = Achievement::where('user_id', $user->id)
            ->with(['project:id,title,slug', 'participation.competition:id,name,slug'])
            ->latest('achieved_on')
            ->get();

        $portfolioItems = PortfolioItem::where('user_id', $user->id)
            ->latest()
            ->get();

        $completedProjects = TeamMember::where('user_id', $user->id)
            ->whereHas('team.project', fn ($q) => $q->where('status', 'completed'))
            ->with('team.project')
            ->get()
            ->map(fn ($m) => [
                'project' => $m->team?->project,
                'role' => $m->role_name,
                'joined_at' => $m->joined_at,
            ]);

        $contributions = ContributionRecord::where('user_id', $user->id)
            ->with('team.project:id,title')
            ->get();

        return response()->json([
            'data' => [
                'achievements' => $achievements,
                'portfolio_items' => $portfolioItems,
                'completed_projects' => $completedProjects,
                'contributions' => $contributions,
            ]
        ]);
    }

    public function storeItem(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'kind' => ['nullable', 'string', 'in:link,repository,document,other'],
            'description' => ['nullable', 'string', 'max:500'],
            'url' => ['required', 'url', 'max:255'],
            'is_public' => ['nullable', 'boolean'],
        ]);

        $item = PortfolioItem::create([
            'user_id' => $user->id,
            'title' => $validated['title'],
            'kind' => $validated['kind'] ?? 'link',
            'description' => $validated['description'] ?? null,
            'url' => $validated['url'],
            'is_public' => $validated['is_public'] ?? true,
        ]);

        return response()->json([
            'message' => 'Item portfolio berhasil ditambahkan.',
            'data' => $item,
        ], 201);
    }

    public function deleteItem(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $item = PortfolioItem::where('user_id', $user->id)->findOrFail($id);
        $item->delete();

        return response()->json(['message' => 'Item berhasil dihapus.']);
    }

    public function publicPortfolio(string $slug): JsonResponse
    {
        $profile = StudentProfile::with('user')->where('slug', $slug)->firstOrFail();

        if (!$profile->portfolio_public) {
            abort(403, 'Portfolio ini belum dipublikasikan oleh pemiliknya.');
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

        return response()->json([
            'data' => [
                'student' => [
                    'name' => $profile->user->name,
                    'department' => $profile->department,
                    'study_program' => $profile->study_program,
                    'bio' => $profile->bio,
                    'github_url' => $profile->github_url,
                    'linkedin_url' => $profile->linkedin_url,
                    'portfolio_url' => $profile->portfolio_url,
                ],
                'achievements' => $achievements,
                'items' => $items,
            ]
        ]);
    }
}
