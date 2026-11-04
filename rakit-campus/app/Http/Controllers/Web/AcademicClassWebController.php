<?php

namespace App\Http\Controllers\Web;

use App\Enums\CampusRole;
use App\Enums\ProjectCategory;
use App\Enums\ProjectStatus;
use App\Enums\TeamPermission;
use App\Enums\TeamType;
use App\Enums\Visibility;
use App\Http\Controllers\Controller;
use App\Models\AcademicClass;
use App\Models\AcademicClassGuidance;
use App\Models\AcademicClassStudent;
use App\Models\Campus;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use App\Models\MatchingAllocation;
use App\Models\MatchingSession;
use App\Services\MatchingService;
use App\Services\Matchmaking\AllocationService;
use App\Services\Matchmaking\EligibilityService;
use App\Services\Matchmaking\FairnessAnalyticsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AcademicClassWebController extends Controller
{
    public function __construct(
        protected MatchingService $matchingService,
        protected AllocationService $allocationService,
        protected FairnessAnalyticsService $fairnessAnalyticsService,
        protected EligibilityService $eligibilityService
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $activeCampusId = $user->campusId() 
            ?? Campus::where('slug', 'polindra')->value('id') 
            ?? Campus::value('id');

        $isLecturer = $user->isLecturer($activeCampusId) || $user->isPlatformAdmin() || $request->input('view_as') === 'lecturer';

        // Classes taught by this user (if lecturer or admin)
        $taughtClasses = AcademicClass::where('campus_id', $activeCampusId)
            ->where(function ($q) use ($user) {
                if (!$user->isPlatformAdmin()) {
                    $q->where('lecturer_id', $user->id);
                }
            })
            ->with(['lecturer:id,name,email'])
            ->withCount(['students', 'projects'])
            ->latest()
            ->get();

        // Classes student is enrolled in
        $enrolledClasses = $user->enrolledClasses()
            ->where('academic_classes.campus_id', $activeCampusId)
            ->with(['lecturer:id,name,email'])
            ->withCount(['students', 'projects'])
            ->latest()
            ->get();

        return Inertia::render('classes/index', [
            'taughtClasses' => $taughtClasses,
            'enrolledClasses' => $enrolledClasses,
            'isLecturer' => $isLecturer,
            'campus' => [
                'id' => $activeCampusId,
                'name' => Campus::find($activeCampusId)?->name ?? 'Politeknik Negeri Indramayu',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $activeCampusId = $user->campusId() 
            ?? Campus::where('slug', 'polindra')->value('id') 
            ?? Campus::value('id');

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'code' => ['required', 'string', 'max:50'],
            'study_program' => ['nullable', 'string', 'max:100'],
            'academic_year' => ['required', 'string', 'max:30'],
            'semester' => ['required', 'string', 'max:20'],
            'target_team_size' => ['required', 'integer', 'min:2', 'max:10'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $academicClass = AcademicClass::create([
            'campus_id' => $activeCampusId,
            'lecturer_id' => $user->id,
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'study_program' => $validated['study_program'] ?? 'Teknik Informatika',
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
            'target_team_size' => $validated['target_team_size'],
            'description' => $validated['description'] ?? null,
            'status' => 'active',
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Kelas perkuliahan berhasil dibuat.',
                'data' => $academicClass,
            ], 201);
        }

        return redirect()->route('classes.show', $academicClass->id)
            ->with('success', 'Kelas perkuliahan berhasil dibuat dengan kode gabung: ' . $academicClass->join_code);
    }

    public function show(Request $request, int $id): Response
    {
        $user = $request->user();
        $academicClass = AcademicClass::with([
            'lecturer:id,name,email',
            'campus:id,name',
            'students.profile.skills',
            'students.teamMemberships.team.project',
            'projects.leader:id,name,email',
            'projects.team.members.user.profile.skills',
            'projects.team.recruitment.roles',
            'projects.skills',
            'guidances.lecturer:id,name',
            'guidances.project:id,title',
        ])->findOrFail($id);

        $isLecturer = $academicClass->isLecturer($user) || $user->isPlatformAdmin() || $user->isCampusAdminOf($academicClass->campus_id);

        // Map active project for every student in O(1) time without extra queries
        $projectByUserId = [];
        foreach ($academicClass->projects as $p) {
            if ($p->team && $p->team->relationLoaded('members')) {
                foreach ($p->team->members as $tm) {
                    if ($tm->status === 'active') {
                        $projectByUserId[$tm->user_id] = [
                            'id' => $p->id,
                            'title' => $p->title,
                            'role_name' => $tm->role_name ?? 'Anggota',
                        ];
                    }
                }
            }
        }

        $studentsData = $academicClass->students->map(function ($s) use ($projectByUserId, $academicClass) {
            $userProject = $projectByUserId[$s->id] ?? null;
            $hasTeam = $userProject !== null;

            return [
                'id' => $s->id,
                'name' => $s->name,
                'email' => $s->email,
                'avatar' => $s->avatar,
                'student_number' => $s->pivot?->student_number ?? 'NIM-' . $s->id,
                'study_program' => $s->profile?->study_program ?? $academicClass->study_program ?? 'Teknik Informatika',
                'semester' => $s->profile?->semester ?? 4,
                'has_team' => $hasTeam,
                'project' => $userProject,
                'skills' => $s->profile?->skills?->pluck('name')->take(4)->all() ?? [],
                'enrolled_at' => $s->pivot?->enrolled_at ? \Carbon\Carbon::parse($s->pivot->enrolled_at)->format('d M Y') : 'Baru saja',
            ];
        });

        // Summary Statistics
        $totalStudents = $studentsData->count();
        $studentsWithTeam = $studentsData->where('has_team', true)->count();
        $studentsWithoutTeam = $totalStudents - $studentsWithTeam;

        // Peer Matchmaking for Student View with strict anti-ketimpangan rule checking
        $peerMatches = collect();
        $myClassProject = null;

        if ($user) {
            $myClassProject = $academicClass->projects->first(fn ($p) => $p->team?->hasMember($user));
            $userProfile = $user->profile()->with('skills')->first();
            if ($userProfile) {
                $peerMatches = $this->matchingService->rankClassmatesForStudent(
                    $userProfile,
                    $academicClass->students,
                    $classProjectUserIds,
                    $myClassProject?->team,
                    $academicClass->target_team_size
                );
            }
        }

        // Calculate class balance and anti-ketimpangan stats
        $totalProjects = $academicClass->projects->count();
        $balancedProjectsCount = 0;
        foreach ($academicClass->projects as $p) {
            if ($p->team && $p->team->members->count() >= 2) {
                $pArchetypes = [];
                foreach ($p->team->members as $tm) {
                    if ($tm->user?->profile) {
                        $pArchetypes = array_merge($pArchetypes, array_keys($this->matchingService->getStudentArchetypes($tm->user->profile)));
                    }
                }
                $pArchetypes = array_unique($pArchetypes);
                if (count($pArchetypes) >= 2) {
                    $balancedProjectsCount++;
                }
            }
        }
        $classBalanceScore = $totalProjects > 0 ? (int) round(($balancedProjectsCount / $totalProjects) * 100) : 100;

        $fairnessMetrics = $this->fairnessAnalyticsService->computeClassFairnessMetrics($academicClass);

        $latestSimulation = MatchingSession::where('academic_class_id', $academicClass->id)
            ->with(['allocations.user.profile.skills', 'allocations.project.team', 'allocations.recruitmentRole'])
            ->latest()
            ->first();

        return Inertia::render('classes/show', [
            'academicClass' => [
                'id' => $academicClass->id,
                'name' => $academicClass->name,
                'code' => $academicClass->code,
                'join_code' => $academicClass->join_code,
                'study_program' => $academicClass->study_program,
                'academic_year' => $academicClass->academic_year,
                'semester' => $academicClass->semester,
                'description' => $academicClass->description,
                'target_team_size' => $academicClass->target_team_size,
                'status' => $academicClass->status,
                'lecturer' => $academicClass->lecturer,
                'campus' => $academicClass->campus,
            ],
            'classRules' => [
                'target_team_size' => $academicClass->target_team_size,
                'max_same_role' => 2,
                'balance_score' => $classBalanceScore,
                'is_strict' => true,
                'rules' => [
                    [
                        'title' => 'Batas Kuota Anggota Ketat & Terkunci',
                        'desc' => "Maksimal {$academicClass->target_team_size} orang per kelompok. Begitu kuota tercapai, tim otomatis dikunci agar beban kerja setara.",
                    ],
                    [
                        'title' => 'Wajib Diversitas Peran (Anti-Monopoli)',
                        'desc' => 'Dilarang menumpuk keahlian sejenis (maks. 2 spesialis sejenis). Slot tim wajib diisi peran pelengkap (Backend, Frontend, UI/UX, atau QA).',
                    ],
                    [
                        'title' => 'Sistem Anti-Clique (Anti Teman Satu Geng)',
                        'desc' => 'Matchmaking memprioritaskan kecocokan sinergi teknis dan kebutuhan proyek nyata, bukan sekadar preferensi teman akrab.',
                    ],
                    [
                        'title' => 'Hak Veto & Auto-Balance Dosen',
                        'desc' => 'Dosen berhak melakukan rekonfigurasi atau auto-balancing ulang secara merata jika terdeteksi ketimpangan kemampuan antar kelompok.',
                    ],
                ],
            ],
            'students' => $studentsData->values(),
            'peerMatches' => $peerMatches,
            'fairnessMetrics' => $fairnessMetrics,
            'latestSimulation' => $latestSimulation,
            'myClassProject' => $myClassProject ? [
                'id' => $myClassProject->id,
                'title' => $myClassProject->title,
                'is_leader' => $myClassProject->isLeader($user),
                'team_id' => $myClassProject->team?->id,
                'members_count' => $myClassProject->team?->members?->count() ?? 1,
                'capacity' => $myClassProject->team?->capacity ?? $academicClass->target_team_size,
            ] : null,
            'projects' => $academicClass->projects->map(fn ($p) => [
                'id' => $p->id,
                'title' => $p->title,
                'slug' => $p->slug,
                'short_description' => $p->short_description,
                'category' => $p->category?->label() ?? 'Akademik',
                'status' => $p->status?->value ?? 'recruiting',
                'progress' => $p->progress ?? 0,
                'leader' => $p->leader,
                'members_count' => $p->team?->members?->count() ?? 1,
                'members' => $p->team?->members?->map(fn ($m) => [
                    'user_id' => $m->user_id,
                    'name' => $m->user?->name ?? 'Anggota',
                    'role_name' => $m->role_name ?? 'Member',
                ])->all() ?? [],
                'lecturer_notes' => $p->lecturer_notes,
                'lecturer_evaluation' => $p->lecturer_evaluation,
            ]),
            'guidances' => $academicClass->guidances->map(fn ($g) => [
                'id' => $g->id,
                'title' => $g->title,
                'content' => $g->content,
                'type' => $g->type,
                'lecturer_name' => $g->lecturer?->name ?? 'Dosen Pengampu',
                'project_title' => $g->project?->title,
                'created_at' => $g->created_at ? \Carbon\Carbon::parse($g->created_at)->format('d M Y, H:i') : '',
            ]),
            'stats' => [
                'total_students' => $totalStudents,
                'students_with_team' => $studentsWithTeam,
                'students_without_team' => $studentsWithoutTeam,
                'total_projects' => $academicClass->projects->count(),
            ],
            'isLecturer' => $isLecturer,
        ]);
    }

    public function join(Request $request)
    {
        $user = $request->user();
        $validated = $request->validate([
            'join_code' => ['required', 'string', 'max:10'],
        ]);

        $code = strtoupper(trim($validated['join_code']));
        $academicClass = AcademicClass::where('join_code', $code)->first();

        if (!$academicClass) {
            return back()->withErrors(['join_code' => 'Kode kelas tidak ditemukan. Periksa kembali 6 digit kode dari dosen Anda.']);
        }

        // Check if already enrolled
        if ($academicClass->hasStudent($user)) {
            return redirect()->route('classes.show', $academicClass->id)
                ->with('info', 'Anda sudah terdaftar di kelas ' . $academicClass->name);
        }

        // Enroll student
        AcademicClassStudent::create([
            'academic_class_id' => $academicClass->id,
            'user_id' => $user->id,
            'student_number' => $user->activeMembership()?->student_number ?? ('NIM-' . $user->id),
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);

        return redirect()->route('classes.show', $academicClass->id)
            ->with('success', 'Berhasil bergabung dengan kelas ' . $academicClass->name . '!');
    }

    public function addStudent(Request $request, int $id)
    {
        $user = $request->user();
        $academicClass = AcademicClass::findOrFail($id);

        if (!$academicClass->isLecturer($user) && !$user->isPlatformAdmin()) {
            abort(403, 'Hanya dosen pengampu yang dapat menambahkan mahasiswa ke kelas ini.');
        }

        $validated = $request->validate([
            'student_identifier' => ['required', 'string'],
        ]);

        $identifier = trim($validated['student_identifier']);
        $studentUser = User::where('email', $identifier)
            ->orWhereHas('memberships', fn ($m) => $m->where('student_number', $identifier))
            ->first();

        if (!$studentUser) {
            return back()->withErrors(['student_identifier' => 'Mahasiswa dengan email atau NIM "' . $identifier . '" tidak ditemukan.']);
        }

        if ($academicClass->hasStudent($studentUser)) {
            return back()->withErrors(['student_identifier' => 'Mahasiswa tersebut sudah terdaftar di kelas ini.']);
        }

        AcademicClassStudent::create([
            'academic_class_id' => $academicClass->id,
            'user_id' => $studentUser->id,
            'student_number' => $studentUser->activeMembership()?->student_number ?? ('NIM-' . $studentUser->id),
            'status' => 'enrolled',
            'enrolled_at' => now(),
        ]);

        return back()->with('success', 'Mahasiswa ' . $studentUser->name . ' berhasil ditambahkan ke kelas.');
    }

    public function removeStudent(Request $request, int $id, int $studentId)
    {
        $user = $request->user();
        $academicClass = AcademicClass::findOrFail($id);

        if (!$academicClass->isLecturer($user) && !$user->isPlatformAdmin()) {
            abort(403);
        }

        AcademicClassStudent::where('academic_class_id', $id)
            ->where('user_id', $studentId)
            ->delete();

        return back()->with('success', 'Mahasiswa berhasil dikeluarkan dari kelas.');
    }

    public function addGuidance(Request $request, int $id)
    {
        $user = $request->user();
        $academicClass = AcademicClass::findOrFail($id);

        if (!$academicClass->isLecturer($user) && !$user->isPlatformAdmin()) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'content' => ['required', 'string'],
            'type' => ['required', 'string', 'in:announcement,guidance,milestone_feedback'],
            'project_id' => ['nullable', 'integer', 'exists:projects,id'],
        ]);

        AcademicClassGuidance::create([
            'academic_class_id' => $id,
            'lecturer_id' => $user->id,
            'project_id' => $validated['project_id'] ?? null,
            'title' => $validated['title'],
            'content' => $validated['content'],
            'type' => $validated['type'],
        ]);

        // If review for specific project, also update project note
        if (!empty($validated['project_id'])) {
            Project::where('id', $validated['project_id'])->update([
                'lecturer_notes' => $validated['content'],
                'lecturer_evaluation' => 'Disetujui Dosen',
            ]);
        }

        return back()->with('success', 'Catatan bimbingan/pengumuman berhasil diterbitkan.');
    }

    public function autoFormTeams(Request $request, int $id)
    {
        $user = $request->user();
        $academicClass = AcademicClass::with(['students.profile.skills', 'projects.team.members'])->findOrFail($id);

        if (!$academicClass->isLecturer($user) && !$user->isPlatformAdmin()) {
            abort(403);
        }

        $resetAll = $request->boolean('reset_all');

        if ($resetAll) {
            // Dosen resets all teams in class to enforce fair redistribution across the whole cohort
            DB::transaction(function () use ($academicClass) {
                foreach ($academicClass->projects as $p) {
                    if ($p->team) {
                        $p->team->members()->delete();
                        $p->team->delete();
                    }
                    $p->delete();
                }
            });
            $academicClass->load('students.profile.skills');
            $studentsToDistribute = $academicClass->students;
        } else {
            // Distribute only unassigned students
            $classProjectUserIds = $academicClass->projects
                ->flatMap(fn ($p) => $p->team?->members?->pluck('user_id') ?? collect())
                ->unique()
                ->all();

            $studentsToDistribute = $academicClass->students
                ->filter(fn ($s) => !in_array($s->id, $classProjectUserIds))
                ->values();
        }

        if ($studentsToDistribute->isEmpty()) {
            return back()->with('info', 'Semua mahasiswa di kelas ini sudah memiliki kelompok proyek.');
        }

        $balancedGroups = $this->matchingService->distributeStudentsFairly(
            $studentsToDistribute,
            $academicClass->target_team_size
        );

        $teamsCreated = 0;

        DB::transaction(function () use ($balancedGroups, $academicClass, &$teamsCreated) {
            foreach ($balancedGroups as $groupData) {
                $members = $groupData['members'];
                if ($members->isEmpty()) continue;

                $leader = $members->first();
                $groupNum = $academicClass->projects()->count() + 1;
                $projectTitle = "Kelompok {$groupNum} — {$academicClass->name}";

                $project = Project::create([
                    'campus_id' => $academicClass->campus_id,
                    'academic_class_id' => $academicClass->id,
                    'leader_id' => $leader->id,
                    'title' => $projectTitle,
                    'slug' => Str::slug($projectTitle) . '-' . Str::lower(Str::random(5)),
                    'short_description' => "Proyek tim kelompok {$groupNum} untuk mata kuliah {$academicClass->name}. Komposisi disusun berimbang tanpa ketimpangan (Skor Sinergi: {$groupData['balance_score']}%).",
                    'category' => ProjectCategory::Academic,
                    'visibility' => Visibility::Campus,
                    'status' => ProjectStatus::InProgress,
                    'progress' => 10,
                    'starts_on' => now(),
                ]);

                $team = Team::create([
                    'campus_id' => $academicClass->campus_id,
                    'project_id' => $project->id,
                    'leader_id' => $leader->id,
                    'type' => TeamType::Project,
                    'name' => "Tim {$groupNum} ({$academicClass->code})",
                    'description' => "Kelompok proyek berimbang {$academicClass->name}",
                    'capacity' => $academicClass->target_team_size,
                ]);

                foreach ($members as $mIdx => $member) {
                    $assignedRole = $groupData['roles_map'][$member->id] ?? ($mIdx === 0 ? 'Ketua Kelompok & Lead' : 'Anggota Pengembang');
                    TeamMember::create([
                        'team_id' => $team->id,
                        'user_id' => $member->id,
                        'permission' => $mIdx === 0 ? TeamPermission::Leader : TeamPermission::Member,
                        'role_name' => $assignedRole,
                        'joined_at' => now(),
                    ]);
                }

                $teamsCreated++;
            }
        });

        $message = $resetAll
            ? "Anti-Clique Reset Berhasil: Seluruh mahasiswa kelas telah didistribusikan ulang ke dalam {$teamsCreated} kelompok berimbang!"
            : "Smart Team Balancing Berhasil: Membentuk {$teamsCreated} kelompok proyek baru berimbang tanpa ketimpangan keahlian!";

        return back()->with('success', $message);
    }

    public function inviteStudent(Request $request, int $id)
    {
        $user = $request->user();
        $academicClass = AcademicClass::findOrFail($id);

        $validated = $request->validate([
            'student_id' => ['required', 'integer', 'exists:users,id'],
            'project_id' => ['required', 'integer', 'exists:projects,id'],
        ]);

        $project = Project::with(['team.members.user.profile.skills'])->where('academic_class_id', $academicClass->id)->findOrFail($validated['project_id']);

        if (!$project->isLeader($user) && !$project->team?->hasMember($user)) {
            abort(403, 'Hanya anggota kelompok yang dapat mengundang rekan.');
        }

        $team = $project->team;
        if (!$team) {
            return back()->with('error', 'Kelompok proyek tidak ditemukan.');
        }

        $invitedUser = User::with('profile.skills')->findOrFail($validated['student_id']);

        // 1. Check if student already in another team in this class
        $alreadyInClassProject = Project::where('academic_class_id', $academicClass->id)
            ->whereHas('team.members', fn ($q) => $q->where('user_id', $invitedUser->id))
            ->exists();

        if ($alreadyInClassProject) {
            return back()->with('error', "Aturan Ketat Kelas: {$invitedUser->name} sudah terdaftar di kelompok proyek lain pada kelas ini.");
        }

        // 2. Validate Strict Capacity & Anti-Ketimpangan Diversity rules
        $candidateProfile = $invitedUser->profile ?? \App\Models\StudentProfile::firstOrCreate(
            ['user_id' => $invitedUser->id],
            ['campus_id' => $academicClass->campus_id, 'slug' => 'student-' . $invitedUser->id]
        );

        $validation = $this->matchingService->validateTeamSynergyAndDiversity(
            $team,
            $candidateProfile,
            $academicClass->target_team_size
        );

        if (!$validation['allowed']) {
            return back()->with('error', $validation['message']);
        }

        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $invitedUser->id,
            'permission' => TeamPermission::Member,
            'status' => 'active',
            'role_name' => 'Anggota (Matchmaking Terverifikasi)',
            'joined_at' => now(),
        ]);

        return back()->with('success', "Berhasil menambahkan {$invitedUser->name} ke dalam kelompok {$team->name}. {$validation['message']}");
    }

    /**
     * Mode C: Lecturer triggers Smart Fair Assisted Allocation Simulation
     */
    public function simulateAllocation(Request $request, int $id)
    {
        $user = $request->user();
        $academicClass = AcademicClass::findOrFail($id);

        if (!$academicClass->isLecturer($user) && !$user->isPlatformAdmin()) {
            abort(403, 'Hanya dosen pengampu yang berwenang menjalankan simulasi alokasi tim.');
        }

        $session = $this->allocationService->simulateClassAllocation($academicClass, $user);

        return back()->with('success', "Simulasi alokasi tim cerdas berhasil dibuat (#{$session->id}). Silakan tinjau metriks fairness dan klik 'Setujui & Aktifkan Kelompok' untuk meresmikan keanggotaan.");
    }

    /**
     * Mode C: Lecturer formally approves and activates proposed team allocation
     */
    public function approveAllocation(Request $request, int $id, int $sessionId)
    {
        $user = $request->user();
        $academicClass = AcademicClass::findOrFail($id);

        if (!$academicClass->isLecturer($user) && !$user->isPlatformAdmin()) {
            abort(403, 'Hanya dosen pengampu yang berwenang menyetujui alokasi tim.');
        }

        $session = MatchingSession::where('academic_class_id', $academicClass->id)->findOrFail($sessionId);

        try {
            $this->allocationService->approveAndActivate($session, $user);
            return back()->with('success', 'Alokasi tim berhasil disetujui! Seluruh mahasiswa telah dialokasikan ke kelompok proyek masing-masing secara resmi.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
