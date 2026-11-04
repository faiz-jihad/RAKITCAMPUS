<?php

namespace App\Services\Matchmaking;

use App\Models\Application;
use App\Models\TeamMember;
use App\Models\User;

class FairnessScoringService
{
    /**
     * Compute fairness score (0-100) based on historical participation,
     * rejection recovery, and wait time.
     *
     * @return array{score: int, details: array<string, mixed>}
     */
    public function computeFairnessScore(User $student): array
    {
        $baseScore = 50; // Neutral baseline

        // 1. First-time participant bonus: Give a fair boost to students with 0 prior completed projects
        $completedProjectsCount = TeamMember::where('user_id', $student->id)
            ->where('status', 'completed')
            ->count();

        $isFirstTimer = $completedProjectsCount === 0;
        $firstTimerBonus = $isFirstTimer ? 25 : 0;

        // 2. Rejection recovery bonus: Prevent repeated exclusion by boosting students
        // who faced recent rejections
        $recentRejectionsCount = Application::where('user_id', $student->id)
            ->where('status', 'rejected')
            ->count();

        $rejectionBonus = min(20, $recentRejectionsCount * 7);

        // 3. Waiting time boost: Days enrolled without an active team
        $enrollment = $student->enrolledClasses()
            ->orderByPivot('enrolled_at', 'asc')
            ->first();

        $waitingDays = 0;
        $waitingBonus = 0;
        if ($enrollment && $enrollment->pivot && $enrollment->pivot->enrolled_at) {
            $waitingDays = now()->diffInDays($enrollment->pivot->enrolled_at);
            $waitingBonus = min(15, (int) ($waitingDays * 1.5));
        }

        // Final score bounded between 10 and 100
        $finalScore = min(100, max(10, $baseScore + $firstTimerBonus + $rejectionBonus + $waitingBonus - ($completedProjectsCount * 5)));

        return [
            'score' => (int) round($finalScore),
            'details' => [
                'is_first_timer' => $isFirstTimer,
                'completed_projects_count' => $completedProjectsCount,
                'recent_rejections_count' => $recentRejectionsCount,
                'waiting_days' => $waitingDays,
                'first_timer_bonus' => $firstTimerBonus,
                'rejection_bonus' => $rejectionBonus,
                'waiting_bonus' => $waitingBonus,
            ],
        ];
    }
}
