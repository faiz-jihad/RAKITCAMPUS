<?php

namespace App\Http\Controllers\Web;

use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\SkillType;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Bookmark;
use App\Models\Campus;
use App\Models\Project;
use App\Models\RecruitmentApplication;
use App\Models\Skill;
use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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
            'isMember' => $user ? ($project->team?->hasMember($user) ?? false) : false,
            'canEdit' => $user ? $user->can('update', $project) : false,
            'applications' => $applications,
        ]);
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        $enrolledClasses = $user ? $user->enrolledClasses()->get(['academic_classes.id', 'academic_classes.name', 'academic_classes.code']) : collect();

        return Inertia::render('projects/create', [
            'categories' => ProjectCategory::values(),
            'visibilities' => Visibility::values(),
            'enrolledClasses' => $enrolledClasses,
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

        $activeCampusId = $user->campusId() 
            ?? Campus::where('slug', 'polindra')->value('id') 
            ?? Campus::value('id');

        $validated = $request->validate([
            'academic_class_id' => ['nullable', 'integer', 'exists:academic_classes,id'],
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
            'starts_on' => ['nullable', 'date'],
            'target_completion_on' => ['nullable', 'date', 'after_or_equal:starts_on'],
            'required_skills' => ['nullable', 'array'],
            'required_skills.*.name' => ['required', 'string', 'max:80'],
            'required_skills.*.min_proficiency' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);

        $project = DB::transaction(function () use ($validated, $user, $activeCampusId) {
            $slug = Str::slug($validated['title']) . '-' . Str::lower(Str::random(6));

            $project = Project::create([
                'campus_id' => $activeCampusId,
                'academic_class_id' => $validated['academic_class_id'] ?? null,
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
                'name' => $project->title . ' Core Team',
                'description' => 'Tim proyek ' . $project->title,
                'capacity' => $validated['capacity'] ?? 5,
            ]);

            // Add creator as Team Leader
            TeamMember::create([
                'team_id' => $team->id,
                'user_id' => $user->id,
                'permission' => TeamPermission::Leader,
                'role_name' => 'Project Leader',
                'joined_at' => now(),
            ]);

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

            return $project;
        });

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Proyek berhasil dibuat.',
                'data' => $project->load(['team', 'skills']),
            ], 201);
        }

        return redirect()->route('projects.show', $project->id);
    }
}
