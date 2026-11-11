<?php

namespace App\Services\Leaderboard;

use App\Enums\CompetitionOutcome;
use App\Enums\TaskStatus;
use App\Models\CompetitionParticipation;
use App\Models\CompetitionResult;
use App\Models\Milestone;
use App\Models\PointTransaction;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeaderboardSeedService
{
    /**
     * Run full initialization & recalculation.
     */
    public static function run(bool $seedRealisticIfEmpty = true): array
    {
        // 1. Seed rules
        LeaderboardScoringService::seedDefaultRules();

        $stats = [
            'comp_results_processed' => 0,
            'comp_parts_processed' => 0,
            'tasks_processed' => 0,
            'milestones_processed' => 0,
            'projects_processed' => 0,
            'total_transactions' => 0,
        ];

        // 2. Process Competition Results
        $results = CompetitionResult::with(['participation.competition', 'participation.team.members.user'])->get();
        foreach ($results as $res) {
            LeaderboardScoringService::recordCompetitionResult($res);
            $stats['comp_results_processed']++;
        }

        // 3. Process Competition Participations
        $participations = CompetitionParticipation::with(['competition', 'team.members.user'])->get();
        foreach ($participations as $part) {
            LeaderboardScoringService::recordCompetitionParticipation($part);
            $stats['comp_parts_processed']++;
        }

        // 4. Process Completed Tasks
        $completedTasks = Task::where('status', TaskStatus::Completed)
            ->with(['team.project'])
            ->get();
        foreach ($completedTasks as $task) {
            LeaderboardScoringService::recordTaskCompleted($task);
            $stats['tasks_processed']++;
        }

        // 5. Process Milestones
        $completedMilestones = Milestone::where('status', 'completed')
            ->with(['team.project'])
            ->get();
        foreach ($completedMilestones as $milestone) {
            LeaderboardScoringService::recordMilestoneCompleted($milestone);
            $stats['milestones_processed']++;
        }

        // 6. Process Projects
        $completedProjects = Project::where('status', 'completed')
            ->with(['team.members.user'])
            ->get();
        foreach ($completedProjects as $project) {
            LeaderboardScoringService::recordProjectCompleted($project);
            $stats['projects_processed']++;
        }

        // 7. Seed Realistic Competitor Results if needed
        if ($seedRealisticIfEmpty && PointTransaction::count() < 10) {
            self::seedRealisticInitialData();
        }

        // 8. Sync Snapshots
        LeaderboardRankingService::syncSnapshots();

        $stats['total_transactions'] = PointTransaction::count();
        return $stats;
    }

    /**
     * Seed realistic historical competition and project achievements.
     */
    protected static function seedRealisticInitialData(): void
    {
        $admin = User::where('is_platform_admin', 1)->first() ?: User::first();
        if (!$admin) {
            return;
        }

        // Get key students
        $faiz = User::where('email', 'faizalba74@gmail.com')->first();
        $siti = User::where('email', 'siti.nur@student.polindra.ac.id')->first();
        $rian = User::where('email', 'rian.p@student.polindra.ac.id')->first();
        $ahmad = User::where('email', 'ahmad.fauzi@student.polindra.ac.id')->first();
        $dewi = User::where('email', 'dewi.lestari@student.polindra.ac.id')->first();

        // 1. Faiz Jihad - Juara 1 Hackathon Microsoft Imagine Cup 2027 (International)
        if ($faiz) {
            $faizPart = CompetitionParticipation::whereHas('team.members', fn ($q) => $q->where('user_id', $faiz->id))->first();
            if ($faizPart) {
                // Ensure result exists
                $res = CompetitionResult::updateOrCreate(
                    ['participation_id' => $faizPart->id],
                    [
                        'outcome' => CompetitionOutcome::FirstPlace,
                        'achievement_title' => 'Juara 1 Global Track Microsoft Imagine Cup 2027',
                        'rank' => 1,
                        'verification_status' => 'verified',
                        'verified_by' => $admin->id,
                        'verified_at' => now()->subDays(2),
                        'notes' => 'Telah diverifikasi resmi melalui portal Imagine Cup Microsoft.',
                    ]
                );
                LeaderboardScoringService::recordCompetitionResult($res, $admin);
            }
        }

        // 2. Siti Nurhaliza - Juara 2 Gemastik 2026 Divisi Data & AI (Nasional)
        if ($siti) {
            $sitiPart = CompetitionParticipation::whereHas('team.members', fn ($q) => $q->where('user_id', $siti->id))->first();
            if ($sitiPart) {
                $res = CompetitionResult::updateOrCreate(
                    ['participation_id' => $sitiPart->id],
                    [
                        'outcome' => CompetitionOutcome::SecondPlace,
                        'achievement_title' => 'Juara 2 Gemastik 2026 Divisi Penambangan Data & AI',
                        'rank' => 2,
                        'verification_status' => 'verified',
                        'verified_by' => $admin->id,
                        'verified_at' => now()->subDays(5),
                    ]
                );
                LeaderboardScoringService::recordCompetitionResult($res, $admin);
            }
        }

        // 3. Rian Pratama - Finalis National IoT Challenge
        if ($rian) {
            $rianPart = CompetitionParticipation::whereHas('team.members', fn ($q) => $q->where('user_id', $rian->id))->first();
            if ($rianPart) {
                $res = CompetitionResult::updateOrCreate(
                    ['participation_id' => $rianPart->id],
                    [
                        'outcome' => CompetitionOutcome::Finalist,
                        'achievement_title' => 'Finalis Top 5 National IoT Smart Campus Challenge',
                        'rank' => 4,
                        'verification_status' => 'verified',
                        'verified_by' => $admin->id,
                        'verified_at' => now()->subDays(3),
                    ]
                );
                LeaderboardScoringService::recordCompetitionResult($res, $admin);
            }
        }

        // 4. Ahmad Fauzi - Proyek Selesai & Kontribusi Tugas
        if ($ahmad) {
            $proj = Project::first();
            if ($proj) {
                $txKey = "seed_proj:{$proj->id}:user:{$ahmad->id}";
                PointTransaction::firstOrCreate(
                    ['idempotency_key' => $txKey],
                    [
                        'campus_id' => $ahmad->campusId(),
                        'user_id' => $ahmad->id,
                        'team_id' => $proj->team_id,
                        'project_id' => $proj->id,
                        'hub' => 'project',
                        'activity_type' => 'project_completed',
                        'points' => 300,
                        'verification_status' => 'verified',
                        'verified_by' => $admin->id,
                        'verified_at' => now()->subDays(4),
                        'description' => "Kontribusi arsitektur UI/UX Proyek: {$proj->title}",
                    ]
                );

                // Add 3 task completed points
                for ($i = 1; $i <= 3; $i++) {
                    PointTransaction::firstOrCreate(
                        ['idempotency_key' => "seed_task:{$i}:user:{$ahmad->id}"],
                        [
                            'campus_id' => $ahmad->campusId(),
                            'user_id' => $ahmad->id,
                            'team_id' => $proj->team_id,
                            'project_id' => $proj->id,
                            'hub' => 'project',
                            'activity_type' => 'project_task_completed',
                            'points' => 20,
                            'verification_status' => 'verified',
                            'verified_at' => now()->subDays($i),
                            'description' => "Penyelesaian modul kanban #{$i}",
                        ]
                    );
                }
            }
        }

        // 5. Dewi Lestari - Juara 3 UI/UX Design Sprint 2026
        if ($dewi) {
            $dewiPart = CompetitionParticipation::whereHas('team.members', fn ($q) => $q->where('user_id', $dewi->id))->first();
            if ($dewiPart) {
                $res = CompetitionResult::updateOrCreate(
                    ['participation_id' => $dewiPart->id],
                    [
                        'outcome' => CompetitionOutcome::ThirdPlace,
                        'achievement_title' => 'Juara 3 Global UI/UX Design Sprint 2026',
                        'rank' => 3,
                        'verification_status' => 'verified',
                        'verified_by' => $admin->id,
                        'verified_at' => now()->subDays(6),
                    ]
                );
                LeaderboardScoringService::recordCompetitionResult($res, $admin);
            }
        }
    }
}
