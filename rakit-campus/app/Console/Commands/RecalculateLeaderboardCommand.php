<?php

namespace App\Console\Commands;

use App\Services\Leaderboard\LeaderboardRankingService;
use App\Services\Leaderboard\LeaderboardSeedService;
use Illuminate\Console\Command;

class RecalculateLeaderboardCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'leaderboard:recalculate {--seed : Seed realistic verified records if ledger is sparse}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate all continuous leaderboards, point ledger, and rank snapshots';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('===============================================');
        $this->info('  RakitCampus Continuous Leaderboard Engine    ');
        $this->info('===============================================');

        $this->info('Step 1: Processing point ledger & recalculating verified activities...');
        $stats = LeaderboardSeedService::run($this->option('seed') ?? true);

        $this->line("  ✓ Competition results processed       : {$stats['comp_results_processed']}");
        $this->line("  ✓ Competition participations processed: {$stats['comp_parts_processed']}");
        $this->line("  ✓ Completed tasks processed           : {$stats['tasks_processed']}");
        $this->line("  ✓ Milestones processed                : {$stats['milestones_processed']}");
        $this->line("  ✓ Projects processed                  : {$stats['projects_processed']}");
        $this->line("  ★ Total ledger transactions in DB     : <fg=cyan>{$stats['total_transactions']}</>");

        $this->newLine();
        $this->info('Step 2: Syncing rank snapshots across Weekly, Monthly, and All-Time...');
        LeaderboardRankingService::syncSnapshots();
        $this->line('  ✓ Snapshots generated and indexed.');

        $this->newLine();
        $this->info('Step 3: Generating Overall Leaderboard Preview:');
        $preview = LeaderboardRankingService::getOverallLeaderboard('all_time', null, 5);

        foreach ($preview['top_three'] as $top) {
            $medal = match ($top['rank']) {
                1 => '🥇',
                2 => '🥈',
                3 => '🥉',
                default => '#',
            };
            $this->line("  {$medal} Rank #{$top['rank']} <fg=white;options=bold>{$top['user']['name']}</> (<fg=yellow>{$top['points']} pts</>) — {$top['badge']['name']}");
            $this->line("     Comp: {$top['competition_points']} pts | Proj: {$top['project_points']} pts | {$top['user']['campus_name']}");
        }

        $this->newLine();
        $this->info('★ Continuous Leaderboard engine recalculation finished successfully!');
        return 0;
    }
}
