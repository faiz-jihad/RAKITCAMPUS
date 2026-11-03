<?php

namespace App\Http\Controllers\Api\v1;

use App\Enums\AchievementType;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\SkillType;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\ActivityLog;
use App\Models\Bookmark;
use App\Models\Project;
use App\Models\Skill;
use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProjectController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Project::visibleTo($user)
            ->with(['leader:id,name', 'campus:id,name,slug', 'skills', 'team.members'])
            ->latest();

        // Filter: Category
        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        // Filter: Status
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        // Filter: Campus
        if ($request->filled('campus_id')) {
            $query->where('campus_id', $request->input('campus_id'));
        }

        // Filter: Search
        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhere('short_description', 'like', $search);
            });
        }

        // Filter: Skill
        if ($request->filled('skill')) {
            $skillName = $request->input('skill');
            $query->whereHas('skills', fn ($s) => $s->where('name', 'like', "%{$skillName}%"));
        }

        $projects = $query->paginate($request->input('per_page', 12));

        return response()->json($projects);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $project = Project::with([
            'leader:id,name',
            'campus:id,name,slug',
            'skills',
            'team.members.user:id,name',
            'team.recruitment.roles',
            'participations.competition',
        ])->findOrFail($id);

        $this->authorize('view', $project);

        $isBookmarked = Bookmark::where('user_id', $user->id)
            ->where('bookmarkable_type', Project::class)
            ->where('bookmarkable_id', $project->id)
            ->exists();

        $isLeader = $project->isLeader($user);
        $isMember = $project->team?->hasMember($user) ?? false;

        return response()->json([
            'data' => $project,
            'meta' => [
                'is_bookmarked' => $isBookmarked,
                'is_leader' => $isLeader,
                'is_member' => $isMember,
                'can_edit' => $user->can('update', $project),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $activeCampusId = $user->campusId();

        if (!$activeCampusId) {
            throw ValidationException::withMessages([
                'campus' => ['Anda belum terdaftar aktif di institusi kampus mana pun.'],
            ]);
        }

        $validated = $request->validate([
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

        return response()->json([
            'message' => 'Proyek berhasil dibuat.',
            'data' => $project->load(['team', 'skills']),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $project = Project::findOrFail($id);
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'short_description' => ['sometimes', 'string', 'max:300'],
            'description' => ['nullable', 'string'],
            'category' => ['sometimes', Rule::enum(ProjectCategory::class)],
            'status' => ['sometimes', Rule::enum(ProjectStatus::class)],
            'progress' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'problem_statement' => ['nullable', 'string'],
            'objectives' => ['nullable', 'string'],
            'proposed_solution' => ['nullable', 'string'],
            'tech_stack' => ['nullable', 'array'],
            'visibility' => ['sometimes', Rule::enum(Visibility::class)],
            'starts_on' => ['nullable', 'date'],
            'target_completion_on' => ['nullable', 'date'],
        ]);

        // Lifecycle state validation
        if (isset($validated['status'])) {
            $nextStatus = ProjectStatus::from($validated['status']);
            if ($nextStatus !== $project->status && !$project->status->canTransitionTo($nextStatus)) {
                throw ValidationException::withMessages([
                    'status' => ["Transisi status dari '{$project->status->label()}' ke '{$nextStatus->label()}' tidak diizinkan."],
                ]);
            }
        }

        $project->update($validated);

        return response()->json([
            'message' => 'Detail proyek berhasil diperbarui.',
            'data' => $project,
        ]);
    }

    public function toggleBookmark(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $project = Project::findOrFail($id);

        $bookmark = Bookmark::where('user_id', $user->id)
            ->where('bookmarkable_type', Project::class)
            ->where('bookmarkable_id', $project->id)
            ->first();

        if ($bookmark) {
            $bookmark->delete();
            $bookmarked = false;
        } else {
            Bookmark::create([
                'user_id' => $user->id,
                'bookmarkable_type' => Project::class,
                'bookmarkable_id' => $project->id,
            ]);
            $bookmarked = true;
        }

        return response()->json([
            'bookmarked' => $bookmarked,
            'message' => $bookmarked ? 'Proyek ditambahkan ke bookmark.' : 'Bookmark dihapus.',
        ]);
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $project = Project::with('team.members.user')->findOrFail($id);
        $this->authorize('complete', $project);

        if ($project->status === ProjectStatus::Completed) {
            return response()->json(['message' => 'Proyek sudah dalam status selesai.']);
        }

        DB::transaction(function () use ($project, $request) {
            $project->update([
                'status' => ProjectStatus::Completed,
                'progress' => 100,
                'completed_at' => now(),
            ]);

            // Record achievement for all members
            if ($project->team) {
                foreach ($project->team->members as $member) {
                    Achievement::firstOrCreate(
                        [
                            'user_id' => $member->user_id,
                            'project_id' => $project->id,
                            'type' => AchievementType::ProjectCompleted,
                        ],
                        [
                            'campus_id' => $project->campus_id,
                            'team_id' => $project->team->id,
                            'title' => 'Menyelesaikan Proyek: ' . $project->title,
                            'description' => "Sebagai {$member->role_name} dalam proyek {$project->title}.",
                            'achieved_on' => now(),
                            'verification_status' => 'verified', // Verified because project leader completed it
                            'verified_by' => $project->leader_id,
                            'verified_at' => now(),
                            'is_public' => true,
                        ]
                    );
                }

                ActivityLog::log(
                    $project->campus_id,
                    $project->team->id,
                    $request->user()->id,
                    'project_completed',
                    $project
                );
            }
        });

        return response()->json([
            'message' => 'Proyek ditandai selesai dan pencapaian telah dicatat untuk seluruh anggota tim.',
        ]);
    }
}
