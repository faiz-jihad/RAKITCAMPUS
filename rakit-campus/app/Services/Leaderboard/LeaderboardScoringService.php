<?php

namespace App\Services\Leaderboard;

use App\Enums\CompetitionOutcome;
use App\Enums\TaskStatus;
use App\Models\Competition;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionResult;
use App\Models\LeaderboardAuditLog;
use App\Models\LeaderboardPointRule;
use App\Models\Milestone;
use App\Models\PointTransaction;
use App\Models\Project;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeaderboardScoringService
{
    /**
     * Default rule definitions.
     */
    public static function defaultRules(): array
    {
        return [
            // Competition Activities
            [
                'hub' => 'competition',
                'activity_type' => 'competition_first_place',
                'name' => 'Juara 1 (First Place) Kompetisi',
                'description' => 'Prestasi Juara 1 terverifikasi pada kompetisi resmi.',
                'base_points' => 1000,
                'multiplier_config' => ['international' => 2.5, 'national' => 1.8, 'regional' => 1.3, 'campus' => 1.0],
            ],
            [
                'hub' => 'competition',
                'activity_type' => 'competition_second_place',
                'name' => 'Juara 2 (Second Place) Kompetisi',
                'description' => 'Prestasi Juara 2 terverifikasi pada kompetisi resmi.',
                'base_points' => 750,
                'multiplier_config' => ['international' => 2.5, 'national' => 1.8, 'regional' => 1.3, 'campus' => 1.0],
            ],
            [
                'hub' => 'competition',
                'activity_type' => 'competition_third_place',
                'name' => 'Juara 3 (Third Place) Kompetisi',
                'description' => 'Prestasi Juara 3 terverifikasi pada kompetisi resmi.',
                'base_points' => 500,
                'multiplier_config' => ['international' => 2.5, 'national' => 1.8, 'regional' => 1.3, 'campus' => 1.0],
            ],
            [
                'hub' => 'competition',
                'activity_type' => 'competition_special_award',
                'name' => 'Penghargaan Khusus / Honorable Mention',
                'description' => 'Penghargaan kategori khusus/juara favorit/harapan pada kompetisi.',
                'base_points' => 350,
                'multiplier_config' => ['international' => 2.5, 'national' => 1.8, 'regional' => 1.3, 'campus' => 1.0],
            ],
            [
                'hub' => 'competition',
                'activity_type' => 'competition_finalist',
                'name' => 'Finalis Kompetisi',
                'description' => 'Lolos ke babak final dan presentasi akhir kompetisi.',
                'base_points' => 250,
                'multiplier_config' => ['international' => 2.5, 'national' => 1.8, 'regional' => 1.3, 'campus' => 1.0],
            ],
            [
                'hub' => 'competition',
                'activity_type' => 'competition_shortlisted',
                'name' => 'Lolos Seleksi Awal / Semifinalis',
                'description' => 'Lolos kurasi tahap awal atau babak semifinal kompetisi.',
                'base_points' => 150,
                'multiplier_config' => ['international' => 2.5, 'national' => 1.8, 'regional' => 1.3, 'campus' => 1.0],
            ],
            [
                'hub' => 'competition',
                'activity_type' => 'competition_participation_verified',
                'name' => 'Partisipasi Kompetisi Terverifikasi',
                'description' => 'Pendaftaran dan pengiriman berkas karya kompetisi telah diverifikasi lengkap.',
                'base_points' => 50,
                'multiplier_config' => ['international' => 2.5, 'national' => 1.8, 'regional' => 1.3, 'campus' => 1.0],
            ],

            // Project Activities
            [
                'hub' => 'project',
                'activity_type' => 'project_completed',
                'name' => 'Penyelesaian Proyek Kelas',
                'description' => 'Proyek kelas selesai dikembangkan dan diverifikasi oleh dosen/penguji.',
                'base_points' => 300,
                'multiplier_config' => null,
            ],
            [
                'hub' => 'project',
                'activity_type' => 'project_milestone_completed',
                'name' => 'Milestone Proyek Tercapai',
                'description' => 'Tahapan penting roadmap proyek berhasil dituntaskan bersama tim.',
                'base_points' => 60,
                'multiplier_config' => null,
            ],
            [
                'hub' => 'project',
                'activity_type' => 'project_task_completed',
                'name' => 'Penyelesaian Tugas Kanban',
                'description' => 'Tugas terstruktur kanban diselesaikan oleh kontributor (anti-spam rate-limited).',
                'base_points' => 20,
                'multiplier_config' => null,
            ],
            [
                'hub' => 'project',
                'activity_type' => 'project_deliverable_verified',
                'name' => 'Dokumen Deliverable Terverifikasi',
                'description' => 'Proposal, pitch deck, atau laporan proyek telah ditinjau dan disetujui.',
                'base_points' => 50,
                'multiplier_config' => null,
            ],
            [
                'hub' => 'project',
                'activity_type' => 'project_team_formed',
                'name' => 'Formasi Tim Kolaborasi Terkunci',
                'description' => 'Formasi kelompok proyek aktif dan memenuhi kuota keahlian interdisiplin.',
                'base_points' => 30,
                'multiplier_config' => null,
            ],

            // General / Admin
            [
                'hub' => 'general',
                'activity_type' => 'admin_adjustment',
                'name' => 'Penyesuaian Manual Administrator',
                'description' => 'Penyesuaian skor oleh admin kampus dengan audit trail transparan.',
                'base_points' => 0,
                'multiplier_config' => null,
            ],
        ];
    }

    /**
     * Ensure all default rules exist in DB.
     */
    public static function seedDefaultRules(): void
    {
        foreach (self::defaultRules() as $rule) {
            LeaderboardPointRule::updateOrCreate(
                ['activity_type' => $rule['activity_type']],
                $rule
            );
        }
    }

    /**
     * Compute multiplier factor based on competition level.
     */
    public static function getLevelMultiplier(?string $level, ?array $multiplierConfig): float
    {
        if (!$multiplierConfig || empty($level)) {
            return 1.0;
        }

        $normalized = strtolower(trim($level));
        if (str_contains($normalized, 'inter') || str_contains($normalized, 'global')) {
            return (float) ($multiplierConfig['international'] ?? 2.5);
        }
        if (str_contains($normalized, 'nas') || str_contains($normalized, 'nation')) {
            return (float) ($multiplierConfig['national'] ?? 1.8);
        }
        if (str_contains($normalized, 'prov') || str_contains($normalized, 'regio')) {
            return (float) ($multiplierConfig['regional'] ?? 1.3);
        }
        return (float) ($multiplierConfig['campus'] ?? 1.0);
    }

    /**
     * Award points for a verified Competition Result.
     */
    public static function recordCompetitionResult(CompetitionResult $result, ?User $verifier = null): array
    {
        $participation = $result->participation;
        if (!$participation) {
            return [];
        }

        $competition = $participation->competition;
        $team = $participation->team;
        $outcome = $result->outcome instanceof CompetitionOutcome ? $result->outcome->value : (string) $result->outcome;

        $activityType = match ($outcome) {
            '1st_place', 'winner' => 'competition_first_place',
            '2nd_place' => 'competition_second_place',
            '3rd_place' => 'competition_third_place',
            'special_award' => 'competition_special_award',
            'finalist' => 'competition_finalist',
            'shortlisted' => 'competition_shortlisted',
            default => 'competition_participation_verified',
        };

        $rule = LeaderboardPointRule::where('activity_type', $activityType)->where('is_active', true)->first();
        $basePoints = $rule ? $rule->base_points : 100;
        $levelMultiplier = self::getLevelMultiplier($competition?->level, $rule?->multiplier_config);
        $finalPoints = (int) round($basePoints * $levelMultiplier);

        $createdTransactions = [];

        DB::transaction(function () use (
            $result, $participation, $competition, $team, $activityType, $finalPoints, $levelMultiplier, $verifier, &$createdTransactions
        ) {
            // 1. Team Transaction
            if ($team) {
                $teamKey = "comp_result:{$result->id}:team:{$team->id}";
                $tx = PointTransaction::firstOrCreate(
                    ['idempotency_key' => $teamKey],
                    [
                        'campus_id' => $competition?->campus_id,
                        'user_id' => null,
                        'team_id' => $team->id,
                        'project_id' => null,
                        'competition_id' => $competition?->id,
                        'participation_id' => $participation->id,
                        'hub' => 'competition',
                        'activity_type' => $activityType,
                        'points' => $finalPoints,
                        'source_type' => CompetitionResult::class,
                        'source_id' => $result->id,
                        'verification_status' => 'verified',
                        'verified_by' => $verifier?->id,
                        'verified_at' => now(),
                        'description' => "Penghargaan tim: {$result->achievement_title} ({$competition?->name})",
                        'metadata' => [
                            'competition_level' => $competition?->level,
                            'multiplier' => $levelMultiplier,
                            'outcome' => $result->outcome instanceof CompetitionOutcome ? $result->outcome->value : $result->outcome,
                            'rank' => $result->rank,
                        ],
                    ]
                );
                $createdTransactions[] = $tx;
            }

            // 2. Individual Member Transactions
            $members = $team ? $team->members()->with('user')->get() : collect();
            foreach ($members as $member) {
                $userKey = "comp_result:{$result->id}:user:{$member->user_id}";
                $tx = PointTransaction::firstOrCreate(
                    ['idempotency_key' => $userKey],
                    [
                        'campus_id' => $competition?->campus_id ?? $member->user?->campusId(),
                        'user_id' => $member->user_id,
                        'team_id' => $team?->id,
                        'project_id' => null,
                        'competition_id' => $competition?->id,
                        'participation_id' => $participation->id,
                        'hub' => 'competition',
                        'activity_type' => $activityType,
                        'points' => $finalPoints,
                        'source_type' => CompetitionResult::class,
                        'source_id' => $result->id,
                        'verification_status' => 'verified',
                        'verified_by' => $verifier?->id,
                        'verified_at' => now(),
                        'description' => "Prestasi kompetisi: {$result->achievement_title} ({$competition?->name})",
                        'metadata' => [
                            'role_in_team' => $member->role_name ?? 'Anggota Tim',
                            'competition_level' => $competition?->level,
                            'multiplier' => $levelMultiplier,
                            'outcome' => $result->outcome instanceof CompetitionOutcome ? $result->outcome->value : $result->outcome,
                            'rank' => $result->rank,
                        ],
                    ]
                );
                $createdTransactions[] = $tx;
            }
        });

        return $createdTransactions;
    }

    /**
     * Award points for verified competition participation.
     */
    public static function recordCompetitionParticipation(CompetitionParticipation $participation, ?User $verifier = null): array
    {
        // Only award if team has submitted documents or confirmed registration
        if (in_array($participation->stage, ['withdrawn', 'not_selected'])) {
            return [];
        }

        $competition = $participation->competition;
        $team = $participation->team;
        $rule = LeaderboardPointRule::where('activity_type', 'competition_participation_verified')->where('is_active', true)->first();
        $basePoints = $rule ? $rule->base_points : 50;
        $levelMultiplier = self::getLevelMultiplier($competition?->level, $rule?->multiplier_config);
        $finalPoints = (int) round($basePoints * $levelMultiplier);

        $created = [];

        DB::transaction(function () use ($participation, $competition, $team, $finalPoints, $levelMultiplier, $verifier, &$created) {
            if ($team) {
                $teamKey = "comp_part:{$participation->id}:team:{$team->id}";
                $created[] = PointTransaction::firstOrCreate(
                    ['idempotency_key' => $teamKey],
                    [
                        'campus_id' => $competition?->campus_id,
                        'user_id' => null,
                        'team_id' => $team->id,
                        'project_id' => null,
                        'competition_id' => $competition?->id,
                        'participation_id' => $participation->id,
                        'hub' => 'competition',
                        'activity_type' => 'competition_participation_verified',
                        'points' => $finalPoints,
                        'source_type' => CompetitionParticipation::class,
                        'source_id' => $participation->id,
                        'verification_status' => 'verified',
                        'verified_by' => $verifier?->id,
                        'verified_at' => now(),
                        'description' => "Partisipasi aktif lomba: {$competition?->name}",
                        'metadata' => [
                            'competition_level' => $competition?->level,
                            'multiplier' => $levelMultiplier,
                        ],
                    ]
                );

                $members = $team->members()->with('user')->get();
                foreach ($members as $member) {
                    $userKey = "comp_part:{$participation->id}:user:{$member->user_id}";
                    $created[] = PointTransaction::firstOrCreate(
                        ['idempotency_key' => $userKey],
                        [
                            'campus_id' => $competition?->campus_id ?? $member->user?->campusId(),
                            'user_id' => $member->user_id,
                            'team_id' => $team->id,
                            'project_id' => null,
                            'competition_id' => $competition?->id,
                            'participation_id' => $participation->id,
                            'hub' => 'competition',
                            'activity_type' => 'competition_participation_verified',
                            'points' => $finalPoints,
                            'source_type' => CompetitionParticipation::class,
                            'source_id' => $participation->id,
                            'verification_status' => 'verified',
                            'verified_by' => $verifier?->id,
                            'verified_at' => now(),
                            'description' => "Partisipasi aktif lomba: {$competition?->name}",
                            'metadata' => [
                                'competition_level' => $competition?->level,
                                'multiplier' => $levelMultiplier,
                            ],
                        ]
                    );
                }
            }
        });

        return $created;
    }

    /**
     * Award points for a completed Kanban Task (Anti-abuse rate limited to max 6 tasks/day).
     */
    public static function recordTaskCompleted(Task $task, ?User $completer = null): ?PointTransaction
    {
        $userId = $task->assignee_id ?: $task->created_by;
        if (!$userId) {
            return null;
        }

        $user = $completer ?: User::find($userId);
        $team = $task->team;
        $project = $team?->project;

        // Anti-farming check: Max 6 completed tasks awarded points per user per day
        $todayCount = PointTransaction::where('user_id', $userId)
            ->where('activity_type', 'project_task_completed')
            ->whereDate('created_at', now()->toDateString())
            ->count();

        if ($todayCount >= 6) {
            Log::info("Task completion point capped for user #{$userId} (rate limit reached).");
            return null;
        }

        $rule = LeaderboardPointRule::where('activity_type', 'project_task_completed')->where('is_active', true)->first();
        $points = $rule ? $rule->base_points : 20;

        $key = "task_done:{$task->id}:user:{$userId}";

        return PointTransaction::firstOrCreate(
            ['idempotency_key' => $key],
            [
                'campus_id' => $task->campus_id ?? $user?->campusId(),
                'user_id' => $userId,
                'team_id' => $team?->id,
                'project_id' => $project?->id,
                'competition_id' => null,
                'participation_id' => null,
                'hub' => 'project',
                'activity_type' => 'project_task_completed',
                'points' => $points,
                'source_type' => Task::class,
                'source_id' => $task->id,
                'verification_status' => 'verified',
                'verified_by' => null,
                'verified_at' => now(),
                'description' => "Penyelesaian tugas kanban: {$task->title}",
                'metadata' => [
                    'priority' => $task->priority?->value ?? $task->priority,
                    'project_title' => $project?->title,
                ],
            ]
        );
    }

    /**
     * Award points for milestone completion.
     */
    public static function recordMilestoneCompleted(Milestone $milestone, ?User $verifier = null): ?PointTransaction
    {
        $team = $milestone->team;
        $project = $team?->project;
        if (!$team) {
            return null;
        }

        $rule = LeaderboardPointRule::where('activity_type', 'project_milestone_completed')->where('is_active', true)->first();
        $points = $rule ? $rule->base_points : 60;

        $key = "milestone_done:{$milestone->id}:team:{$team->id}";

        return PointTransaction::firstOrCreate(
            ['idempotency_key' => $key],
            [
                'campus_id' => $team->campus_id,
                'user_id' => null,
                'team_id' => $team->id,
                'project_id' => $project?->id,
                'competition_id' => null,
                'participation_id' => null,
                'hub' => 'project',
                'activity_type' => 'project_milestone_completed',
                'points' => $points,
                'source_type' => Milestone::class,
                'source_id' => $milestone->id,
                'verification_status' => 'verified',
                'verified_by' => $verifier?->id,
                'verified_at' => now(),
                'description' => "Pencapaian milestone proyek: {$milestone->title}",
                'metadata' => [
                    'project_title' => $project?->title,
                ],
            ]
        );
    }

    /**
     * Award points for completed project.
     */
    public static function recordProjectCompleted(Project $project, ?User $verifier = null): array
    {
        $team = $project->team;
        $rule = LeaderboardPointRule::where('activity_type', 'project_completed')->where('is_active', true)->first();
        $points = $rule ? $rule->base_points : 300;

        $txs = [];

        DB::transaction(function () use ($project, $team, $points, $verifier, &$txs) {
            // Team transaction
            if ($team) {
                $teamKey = "proj_completed:{$project->id}:team:{$team->id}";
                $txs[] = PointTransaction::firstOrCreate(
                    ['idempotency_key' => $teamKey],
                    [
                        'campus_id' => $project->campus_id,
                        'user_id' => null,
                        'team_id' => $team->id,
                        'project_id' => $project->id,
                        'hub' => 'project',
                        'activity_type' => 'project_completed',
                        'points' => $points,
                        'source_type' => Project::class,
                        'source_id' => $project->id,
                        'verification_status' => 'verified',
                        'verified_by' => $verifier?->id,
                        'verified_at' => now(),
                        'description' => "Penyelesaian penuh proyek: {$project->title}",
                        'metadata' => [
                            'grade' => $project->lecturer_evaluation,
                        ],
                    ]
                );

                // Members transactions
                foreach ($team->members()->with('user')->get() as $m) {
                    $userKey = "proj_completed:{$project->id}:user:{$m->user_id}";
                    $txs[] = PointTransaction::firstOrCreate(
                        ['idempotency_key' => $userKey],
                        [
                            'campus_id' => $project->campus_id ?? $m->user?->campusId(),
                            'user_id' => $m->user_id,
                            'team_id' => $team->id,
                            'project_id' => $project->id,
                            'hub' => 'project',
                            'activity_type' => 'project_completed',
                            'points' => (int) round($points * 0.7), // 70% to each member
                            'source_type' => Project::class,
                            'source_id' => $project->id,
                            'verification_status' => 'verified',
                            'verified_by' => $verifier?->id,
                            'verified_at' => now(),
                            'description' => "Kontribusi penuh penyelesaian proyek: {$project->title}",
                            'metadata' => [
                                'role' => $m->role_name,
                            ],
                        ]
                    );
                }
            }
        });

        return $txs;
    }

    /**
     * Manual admin adjustment with mandatory audit log.
     */
    public static function recordAdminAdjustment(
        User $admin,
        string $targetType, // 'user' | 'team' | 'project'
        int $targetId,
        int $pointsDelta,
        string $reason,
        string $hub = 'general'
    ): PointTransaction {
        return DB::transaction(function () use ($admin, $targetType, $targetId, $pointsDelta, $reason, $hub) {
            $key = "admin_adj:" . uniqid() . ":" . time();

            $userId = $targetType === 'user' ? $targetId : null;
            $teamId = $targetType === 'team' ? $targetId : null;
            $projectId = $targetType === 'project' ? $targetId : null;

            $tx = PointTransaction::create([
                'campus_id' => $admin->campusId(),
                'user_id' => $userId,
                'team_id' => $teamId,
                'project_id' => $projectId,
                'hub' => $hub,
                'activity_type' => 'admin_adjustment',
                'points' => $pointsDelta,
                'idempotency_key' => $key,
                'source_type' => User::class,
                'source_id' => $admin->id,
                'verification_status' => 'verified',
                'verified_by' => $admin->id,
                'verified_at' => now(),
                'description' => "Penyesuaian Manual Admin ({$admin->name}): {$reason}",
                'metadata' => [
                    'admin_name' => $admin->name,
                    'admin_email' => $admin->email,
                    'reason' => $reason,
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                ],
            ]);

            LeaderboardAuditLog::create([
                'admin_id' => $admin->id,
                'action' => 'adjust_points',
                'target_type' => $targetType,
                'target_id' => $targetId,
                'points_delta' => $pointsDelta,
                'reason' => $reason,
                'details' => [
                    'transaction_id' => $tx->id,
                    'hub' => $hub,
                ],
            ]);

            return $tx;
        });
    }
}
