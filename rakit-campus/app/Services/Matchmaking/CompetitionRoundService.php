<?php

namespace App\Services\Matchmaking;

use App\Enums\RoundStatus;
use App\Models\Competition;
use App\Models\CompetitionRound;
use App\Models\MatchingAuditLog;
use App\Models\User;
use Illuminate\Validation\ValidationException;

class CompetitionRoundService
{
    /**
     * Create a new round for a competition.
     */
    public function createRound(Competition $competition, array $data, User $actor): CompetitionRound
    {
        $roundNumber = $data['round_number'] ?? ($competition->rounds()->max('round_number') + 1);

        $round = CompetitionRound::create([
            'competition_id' => $competition->id,
            'round_number' => $roundNumber,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
            'status' => $data['status'] ?? RoundStatus::Upcoming->value,
            'is_final_round' => $data['is_final_round'] ?? false,
        ]);

        MatchingAuditLog::log(
            'competition_round_created',
            [
                'round_id' => $round->id,
                'round_name' => $round->name,
                'round_number' => $round->round_number,
            ],
            null,
            null,
            $actor->id
        );

        return $round;
    }

    /**
     * Update round data.
     */
    public function updateRound(CompetitionRound $round, array $data, User $actor): CompetitionRound
    {
        $round->update($data);

        return $round;
    }

    /**
     * Advance round status.
     */
    public function updateRoundStatus(CompetitionRound $round, string $status, User $actor): void
    {
        $round->update(['status' => $status]);

        MatchingAuditLog::log(
            'competition_round_status_updated',
            [
                'round_id' => $round->id,
                'new_status' => $status,
            ],
            null,
            null,
            $actor->id
        );
    }
}
