<?php

namespace App\Http\Controllers\Web;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use App\Models\Project;
use App\Models\RecruitmentApplication;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectWebController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $query = Project::visibleTo($user)
            ->with(['leader:id,name', 'campus:id,name', 'skills', 'team.members'])
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

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'filters' => $request->only(['search', 'category', 'status']),
            'categories' => ProjectCategory::values(),
            'statuses' => ProjectStatus::values(),
        ]);
    }

    public function show(Request $request, int $id): Response
    {
        $user = $request->user();
        $project = Project::with([
            'leader:id,name,email',
            'campus:id,name,slug',
            'skills',
            'team.members.user:id,name',
            'team.recruitment.roles',
            'participations.competition:id,name,slug',
        ])->findOrFail($id);

        $this->authorize('view', $project);

        $isBookmarked = Bookmark::where('user_id', $user->id)
            ->where('bookmarkable_type', Project::class)
            ->where('bookmarkable_id', $project->id)
            ->exists();

        $isLeader = $project->isLeader($user);
        $applications = [];
        if ($isLeader && $project->team?->recruitment) {
            $applications = RecruitmentApplication::where('recruitment_id', $project->team->recruitment->id)
                ->with(['applicant:id,name,email', 'role:id,name'])
                ->latest()
                ->get();
        }

        return Inertia::render('projects/show', [
            'project' => $project,
            'isBookmarked' => $isBookmarked,
            'isLeader' => $isLeader,
            'isMember' => $project->team?->hasMember($user) ?? false,
            'canEdit' => $user->can('update', $project),
            'applications' => $applications,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('projects/create', [
            'categories' => ProjectCategory::values(),
            'visibilities' => Visibility::values(),
        ]);
    }
}
