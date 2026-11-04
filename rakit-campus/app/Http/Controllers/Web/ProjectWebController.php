<?php

namespace App\Http\Controllers\Web;

use App\Enums\ApplicationStatus;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\RecruitmentStatus;
use App\Enums\SkillType;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Application;
use App\Models\Bookmark;
use App\Models\Campus;
use App\Models\MatchingAuditLog;
use App\Models\Project;
use App\Models\Recruitment;
use App\Models\RecruitmentRole;
use App\Models\Skill;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Services\Matchmaking\MembershipService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectWebController extends Controller
{
    public function __construct(
        protected MembershipService $membershipService
    ) {}

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
            'academicClass.lecturer:id,name,email',
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
        $isLecturer = $user ? (
            ($project->academicClass && $project->academicClass->isLecturer($user))
            || $project->primary_supervisor_id === $user->id
            || $user->isPlatformAdmin()
        ) : false;
        $userHasActiveProject = $user ? $user->hasActiveProject() : false;

        $applications = [];
        if ($isLeader && $project->team?->recruitment) {
            $applications = Application::where('recruitment_id', $project->team->recruitment->id)
                ->with(['user:id,name,email', 'role:id,name'])
                ->latest()
                ->get();
        }

        return Inertia::render('projects/show', [
            'project' => $project,
            'isBookmarked' => $isBookmarked,
            'isLeader' => $isLeader,
            'isLecturer' => $isLecturer,
            'isMember' => $user ? ($project->team?->hasMember($user) ?? false) : false,
            'userHasActiveProject' => $userHasActiveProject,
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

        // Rule 1: One student, one active project
        if ($user->hasActiveProject()) {
            if ($request->wantsJson()) {
                return response()->json(['message' => 'Anda sudah tergabung dalam proyek aktif lain. Selesaikan proyek saat ini terlebih dahulu.'], 422);
            }
            return back()->withErrors(['title' => 'Anda sudah tergabung dalam proyek aktif lain. Selesaikan proyek sebelumnya sebelum membuat proyek baru.']);
        }

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

            // Create default recruitment & open roles for the team
            $recruitment = Recruitment::create([
                'campus_id' => $activeCampusId,
                'team_id' => $team->id,
                'title' => 'Rekrutmen Terbuka ' . $project->title,
                'description' => 'Rekrutmen anggota tim untuk proyek ' . $project->title,
                'status' => RecruitmentStatus::Open,
            ]);

            if (!empty($validated['required_skills'])) {
                foreach (array_slice($validated['required_skills'], 0, 3) as $req) {
                    RecruitmentRole::create([
                        'recruitment_id' => $recruitment->id,
                        'name' => $req['name'] . ' Specialist',
                        'slots' => 1,
                    ]);
                }
            } else {
                RecruitmentRole::create([
                    'recruitment_id' => $recruitment->id,
                    'name' => 'Frontend / UI Developer',
                    'slots' => 1,
                ]);
                RecruitmentRole::create([
                    'recruitment_id' => $recruitment->id,
                    'name' => 'Backend Developer',
                    'slots' => 1,
                ]);
            }

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

    public function apply(Request $request, int $id)
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        $project = Project::with(['team.recruitment.roles'])->findOrFail($id);

        $validated = $request->validate([
            'recruitment_role_id' => ['nullable', 'integer'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $role = !empty($validated['recruitment_role_id'])
            ? RecruitmentRole::find($validated['recruitment_role_id'])
            : $project->team?->recruitment?->roles?->first();

        try {
            $this->membershipService->applyToProject($user, $project, $role, $validated['message'] ?? null);
            return back()->with('success', 'Lamaran kamu berhasil dikirim ke ketua tim!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function respondApplication(Request $request, int $id, int $applicationId)
    {
        $user = $request->user();
        $project = Project::with(['team.members'])->findOrFail($id);

        if (!$project->isLeader($user) && !$user->isPlatformAdmin()) {
            abort(403, 'Hanya ketua tim yang dapat memproses lamaran.');
        }

        $application = Application::with(['user', 'role', 'recruitment.team.project'])->findOrFail($applicationId);
        $action = $request->input('action', 'accept'); // 'accept' or 'reject'

        try {
            if ($action === 'accept') {
                $this->membershipService->acceptApplication(
                    $application,
                    $user,
                    $request->input('note', 'Diterima oleh ketua tim.')
                );
                return back()->with('success', "Mahasiswa {$application->user->name} resmi bergabung dengan tim!");
            } else {
                $this->membershipService->rejectApplication(
                    $application,
                    $user,
                    $request->input('note', 'Mohon maaf, posisi saat ini belum sesuai.')
                );
                return back()->with('info', 'Lamaran telah ditolak.');
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors());
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function activateTeam(Request $request, int $id)
    {
        $user = $request->user();
        $project = Project::with(['team.members', 'academicClass'])->findOrFail($id);

        $isLeader = $project->isLeader($user);
        $isLecturer = ($project->academicClass && $project->academicClass->isLecturer($user))
            || $project->primary_supervisor_id === $user->id;

        if (! $isLeader && ! $isLecturer && ! $user->isPlatformAdmin()) {
            abort(403, 'Hanya ketua tim atau dosen pembimbing yang dapat mengaktifkan kelompok.');
        }

        DB::transaction(function () use ($project, $user) {
            $project->update([
                'status' => ProjectStatus::InProgress->value,
            ]);

            if ($project->team) {
                // Ensure all members are active
                $project->team->members()->update(['status' => 'active']);

                // Close recruitment
                $project->team->recruitment?->update(['is_open' => false]);

                // Create initial milestones if none exist
                if ($project->team->milestones()->count() === 0) {
                    \App\Models\Milestone::create([
                        'campus_id' => $project->campus_id,
                        'team_id' => $project->team->id,
                        'created_by' => $user->id,
                        'title' => 'Milestone 1: Perencanaan & Arsitektur',
                        'description' => 'Penyusunan backlog tugas, pembagian peran, dan perancangan skema data.',
                        'starts_on' => now(),
                        'due_on' => now()->addWeeks(2),
                        'status' => 'in_progress',
                    ]);
                    \App\Models\Milestone::create([
                        'campus_id' => $project->campus_id,
                        'team_id' => $project->team->id,
                        'created_by' => $user->id,
                        'title' => 'Milestone 2: Pengembangan & Integrasi Fitur',
                        'description' => 'Pengembangan sprint utama, implementasi komponen UI, dan integrasi backend API.',
                        'starts_on' => now()->addWeeks(2),
                        'due_on' => now()->addWeeks(6),
                        'status' => 'planned',
                    ]);
                    \App\Models\Milestone::create([
                        'campus_id' => $project->campus_id,
                        'team_id' => $project->team->id,
                        'created_by' => $user->id,
                        'title' => 'Milestone 3: Pengujian, Evaluasi & Final Submission',
                        'description' => 'Quality assurance, dokumentasi tugas akhir, dan serah terima ke Dosen Pembimbing.',
                        'starts_on' => now()->addWeeks(6),
                        'due_on' => now()->addWeeks(8),
                        'status' => 'planned',
                    ]);
                }
            }

            $teamId = $project->team?->id;

            MatchingAuditLog::log(
                'team_activated',
                ['project_id' => $project->id, 'team_id' => $teamId],
                $project->academic_class_id,
                $project->id,
                $user->id
            );
        });

        $teamId = $project->team?->id;

        return redirect()->route('workspace.show', ['teamId' => $teamId])
            ->with('success', 'Formasi kelompok berhasil dikonfirmasi dan diaktifkan! Workspace proyek telah dibuka.');
    }

    public function submitFinal(Request $request, int $id)
    {
        $user = $request->user();
        $project = Project::with(['team.members'])->findOrFail($id);

        if (! $project->team?->hasMember($user) && ! $user->isPlatformAdmin()) {
            abort(403, 'Hanya anggota kelompok yang dapat mengumpulkan tugas akhir proyek.');
        }

        $validated = $request->validate([
            'repository_url' => ['nullable', 'url', 'max:255'],
            'demo_url' => ['nullable', 'url', 'max:255'],
            'submission_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $project->update([
            'repository_url' => $validated['repository_url'] ?? $project->repository_url,
            'demo_url' => $validated['demo_url'] ?? $project->demo_url,
            'submission_notes' => $validated['submission_notes'] ?? $project->submission_notes,
            'submitted_at' => now(),
            'progress' => 100,
        ]);

        MatchingAuditLog::log(
            'final_submission_submitted',
            [
                'project_id' => $project->id,
                'repository_url' => $validated['repository_url'] ?? null,
                'demo_url' => $validated['demo_url'] ?? null,
            ],
            $project->academic_class_id,
            $project->id,
            $user->id
        );

        return back()->with('success', 'Tugas akhir proyek berhasil diserahkan untuk dievaluasi oleh Dosen Pembimbing!');
    }

    public function evaluate(Request $request, int $id)
    {
        $user = $request->user();
        $project = Project::with(['team.members', 'academicClass'])->findOrFail($id);

        $isLecturer = ($project->academicClass && $project->academicClass->isLecturer($user))
            || $project->primary_supervisor_id === $user->id
            || $user->isPlatformAdmin();

        if (! $isLecturer) {
            abort(403, 'Hanya dosen pembimbing atau pengampu kelas yang dapat memberikan evaluasi nilai.');
        }

        $validated = $request->validate([
            'lecturer_evaluation' => ['required', 'string', 'max:50'],
            'lecturer_notes' => ['required', 'string', 'max:2000'],
            'complete_project' => ['nullable', 'boolean'],
        ]);

        $project->update([
            'lecturer_evaluation' => $validated['lecturer_evaluation'],
            'lecturer_notes' => $validated['lecturer_notes'],
            'evaluated_at' => now(),
        ]);

        if (! empty($validated['complete_project'])) {
            $this->membershipService->completeProject($project, $user->id);

            return back()->with('success', "Evaluasi nilai {$validated['lecturer_evaluation']} berhasil disimpan. Proyek resmi dinyatakan Selesai (Completed) dan portofolio seluruh anggota tim telah diverifikasi!");
        }

        return back()->with('success', 'Catatan evaluasi bimbingan dosen berhasil disimpan.');
    }
}
