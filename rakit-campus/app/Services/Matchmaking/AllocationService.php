<?php

namespace App\Services\Matchmaking;

use App\Enums\ProjectStatus;
use App\Models\AcademicClass;
use App\Models\MatchingAllocation;
use App\Models\MatchingAuditLog;
use App\Models\MatchingSession;
use App\Models\Project;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AllocationService
{
    public function __construct(
        protected EligibilityService $eligibilityService,
        protected CompatibilityScoringService $scoringService
    ) {}

    /**
     * Mode C: Simulate fair allocation for an academic class.
     * Generates a proposed MatchingSession and MatchingAllocation records.
     */
    public function simulateClassAllocation(AcademicClass $class, User $lecturer): MatchingSession
    {
        // 1. Eager load class students with profile and skills (Zero N+1)
        $students = $class->students()
            ->with([
                'profile.skills',
                'teamMemberships' => fn ($q) => $q->where('status', 'active'),
            ])
            ->wherePivot('status', 'enrolled')
            ->get();

        // 2. Filter unassigned students who do not currently hold an active project
        $eligibleStudents = $students->filter(function ($student) {
            return ! $this->eligibilityService->hasActiveProjectMembership($student);
        })->values();

        // 3. Eager load all class projects with team, roles, and skills (Zero N+1)
        $projects = Project::query()
            ->where('academic_class_id', $class->id)
            ->whereNotIn('status', [ProjectStatus::Archived->value, ProjectStatus::Completed->value])
            ->with([
                'team.members.user.profile.skills',
                'team.recruitment.roles.members',
                'skills',
            ])
            ->get();

        // Create MatchingSession simulation
        $session = MatchingSession::create([
            'academic_class_id' => $class->id,
            'lecturer_id' => $lecturer->id,
            'title' => "Simulasi Distribusi Tim — {$class->name} (" . now()->format('d M Y H:i') . ')',
            'status' => 'simulation',
        ]);

        if ($eligibleStudents->isEmpty() || $projects->isEmpty()) {
            $session->update([
                'summary_metrics' => [
                    'total_eligible_students' => $eligibleStudents->count(),
                    'total_projects' => $projects->count(),
                    'allocated_count' => 0,
                    'unallocated_count' => $eligibleStudents->count(),
                    'participation_rate' => 0,
                    'message' => 'Tidak ada siswa belum berkelompok atau belum ada proyek terdaftar.',
                ],
            ]);

            return $session;
        }

        // 4. Matrix of Compatibility: Calculate scores for all (student, project) pairs
        $matrix = [];
        foreach ($eligibleStudents as $student) {
            foreach ($projects as $project) {
                // Check if project has capacity
                $team = $project->team;
                $maxCap = $project->max_team_size ?: ($team?->capacity ?: 5);
                $currCount = $team ? $team->members->where('status', 'active')->count() : 0;

                if ($currCount >= $maxCap) {
                    continue; // Skip full projects
                }

                $eval = $this->scoringService->evaluate($student, $project);

                $matrix[] = [
                    'student' => $student,
                    'project' => $project,
                    'score' => $eval['final_score'],
                    'breakdown' => $eval['breakdown'],
                    'matched_skills' => $eval['matched_skills'],
                    'missing_skills' => $eval['missing_skills'],
                    'complementary_skills' => $eval['complementary_skills'],
                    'matched_roles' => $eval['matched_roles'],
                    'explanation' => $eval['explanation'],
                ];
            }
        }

        // Sort candidates by score descending with fairness tie-breaking
        usort($matrix, function ($a, $b) {
            if ($b['score'] === $a['score']) {
                // Tie breaker: Prioritize higher fairness component
                return ($b['breakdown']['fairness'] ?? 0) <=> ($a['breakdown']['fairness'] ?? 0);
            }

            return $b['score'] <=> $a['score'];
        });

        // 5. Global Fair Assignment Algorithm
        // Track allocations to ensure: 1 student <= 1 project, project members <= max capacity
        $assignedStudents = [];
        $projectOccupancy = [];

        foreach ($projects as $p) {
            $curr = $p->team ? $p->team->members->where('status', 'active')->count() : 0;
            $maxCap = $p->max_team_size ?: ($p->team?->capacity ?: 5);
            $projectOccupancy[$p->id] = [
                'current' => $curr,
                'max' => $maxCap,
            ];
        }

        $allocatedCount = 0;

        foreach ($matrix as $item) {
            $studentId = $item['student']->id;
            $projectId = $item['project']->id;

            // If student already allocated in this simulation, skip
            if (isset($assignedStudents[$studentId])) {
                continue;
            }

            // If project capacity reached, skip
            if ($projectOccupancy[$projectId]['current'] >= $projectOccupancy[$projectId]['max']) {
                continue;
            }

            // Find best matching open role if available
            $recruitmentRole = null;
            $team = $item['project']->team;
            if ($team && $team->recruitment) {
                foreach ($team->recruitment->roles as $role) {
                    if ($role->vacancies() > 0) {
                        $recruitmentRole = $role;
                        break;
                    }
                }
            }

            // Record assignment
            $assignedStudents[$studentId] = $projectId;
            $projectOccupancy[$projectId]['current']++;
            $allocatedCount++;

            MatchingAllocation::create([
                'matching_session_id' => $session->id,
                'user_id' => $studentId,
                'project_id' => $projectId,
                'recruitment_role_id' => $recruitmentRole?->id,
                'score' => $item['score'],
                'compatibility_breakdown' => $item['breakdown'],
                'explanation' => $item['explanation'],
                'status' => 'proposed',
            ]);
        }

        $unallocatedCount = $eligibleStudents->count() - $allocatedCount;
        $participationRate = $eligibleStudents->count() > 0
            ? round(($allocatedCount / $eligibleStudents->count()) * 100, 1)
            : 0;

        $session->update([
            'summary_metrics' => [
                'total_eligible_students' => $eligibleStudents->count(),
                'total_projects' => $projects->count(),
                'allocated_count' => $allocatedCount,
                'unallocated_count' => $unallocatedCount,
                'participation_rate' => $participationRate,
            ],
        ]);

        MatchingAuditLog::log(
            'allocation_simulated',
            ['session_id' => $session->id, 'allocated' => $allocatedCount, 'unallocated' => $unallocatedCount],
            $class->id,
            null,
            $lecturer->id
        );

        return $session;
    }

    /**
     * Mode C: Lecturer approves and atomically activates proposed allocations.
     * Strictly enforces Rule 1 with pessimistic locking.
     *
     * @throws \DomainException
     */
    public function approveAndActivate(MatchingSession $session, User $lecturer): void
    {
        if ($session->status === 'approved') {
            throw new \DomainException('Sesi alokasi ini sudah disetujui sebelumnya.');
        }

        DB::transaction(function () use ($session, $lecturer) {
            // Eager load allocations with user, project and recruitmentRole (Zero N+1)
            $allocations = $session->allocations()
                ->with(['user', 'project.team', 'recruitmentRole'])
                ->lockForUpdate()
                ->get();

            foreach ($allocations as $alloc) {
                $user = $alloc->user;
                $project = $alloc->project;
                $team = $project->team;

                if (! $team) {
                    continue;
                }

                // Check active project rule with row lock
                $hasActive = TeamMember::where('user_id', $user->id)
                    ->where('status', 'active')
                    ->whereHas('team.project', function ($q) {
                        $q->whereNotIn('status', [
                            ProjectStatus::Archived->value,
                            ProjectStatus::Completed->value,
                        ]);
                    })
                    ->lockForUpdate()
                    ->exists();

                if ($hasActive) {
                    // Update allocation to conflict/rejected and continue
                    $alloc->update(['status' => 'rejected']);
                    continue;
                }

                // Create active team member atomically
                TeamMember::updateOrCreate(
                    [
                        'team_id' => $team->id,
                        'user_id' => $user->id,
                    ],
                    [
                        'permission' => 'member',
                        'status' => 'active',
                        'role_name' => $alloc->recruitmentRole?->name ?? 'Anggota Tim Terpilih',
                        'recruitment_role_id' => $alloc->recruitment_role_id,
                        'joined_at' => now(),
                    ]
                );

                $alloc->update(['status' => 'activated']);
            }

            $session->update([
                'status' => 'approved',
                'approved_at' => now(),
            ]);

            MatchingAuditLog::log(
                'allocation_approved',
                ['session_id' => $session->id, 'approved_by' => $lecturer->id],
                $session->academic_class_id,
                null,
                $lecturer->id
            );
        });
    }
}
