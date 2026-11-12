<?php

namespace App\Console\Commands;

use App\Models\CompetitionParticipation;
use App\Services\AI\GeminiAgentService;
use Illuminate\Console\Command;

class CheckGeminiAiHealth extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'gemini:check {--participation= : ID of competition participation to generate tasks for} {--apply : Apply generated tasks to database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Google Gemini AI agent integration for task and roadmap generation';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('====================================');
        $this->info('  RakitCampus Gemini AI Agent Test  ');
        $this->info('====================================');

        $apiKey = config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        $model = config('services.gemini.model') ?: env('GEMINI_MODEL', 'gemini-2.0-flash');

        if (empty($apiKey)) {
            $this->error('✗ GEMINI_API_KEY is missing in .env or config/services.php');
            return 1;
        }

        $maskedKey = substr($apiKey, 0, 8) . '...' . substr($apiKey, -6);
        $this->line("API Key Configured : <fg=cyan>{$maskedKey}</>");
        $this->line("Active Model       : <fg=cyan>{$model}</>");
        $this->newLine();

        // 1. Direct Ping Test
        $this->info('Step 1: Testing direct Gemini API call...');
        $systemPrompt = 'You are a test assistant. Always respond with pure valid JSON.';
        $userPrompt = 'Generate a JSON object with keys "status" (string: "ok"), "model" (string), and "echo" (string: "Gemini agent connection verified").';

        $rawResponse = GeminiAgentService::call($systemPrompt, $userPrompt);
        if (!$rawResponse) {
            $this->error('✗ Gemini API request failed. Check API key validity or network connectivity.');
            return 1;
        }

        $this->line('✓ Gemini response received:');
        $this->line("<fg=yellow>{$rawResponse}</>");
        $this->newLine();

        // 2. Kanban Task Generation Test
        $partId = $this->option('participation') ?: 5;
        $participation = CompetitionParticipation::with(['competition', 'team'])->find($partId);

        if (!$participation) {
            $participation = CompetitionParticipation::with(['competition', 'team'])->first();
        }

        if ($participation) {
            $this->info("Step 2: Generating agentic Kanban tasks for Participation #{$participation->id} ({$participation->team?->name})...");
            $tasksResult = GeminiAgentService::generateKanbanTasks($participation);
            $tasksList = $tasksResult['tasks'] ?? [];
            $summary = $tasksResult['summary'] ?? '';

            $this->info("✓ Generated " . count($tasksList) . " structured tasks:");
            if (!empty($summary)) {
                $this->line("  <fg=gray>Ringkasan: {$summary}</>");
            }

            foreach ($tasksList as $i => $task) {
                $num = $i + 1;
                $priorityColor = match ($task['priority'] ?? 'medium') {
                    'urgent' => 'red',
                    'high' => 'magenta',
                    'medium' => 'yellow',
                    default => 'green',
                };
                $this->line("  [{$num}] <fg=white;options=bold>{$task['title']}</> (<fg={$priorityColor}>{$task['priority']}</> | {$task['estimated_days']} hari | {$task['stage']})");
                $this->line("      Role: <fg=cyan>{$task['recommended_role']}</> — {$task['description']}");
            }

            if ($this->option('apply')) {
                $this->newLine();
                $this->info('Step 3: Applying generated tasks to team Kanban board via DB transaction...');
                $leader = $participation->team?->leader ?? \App\Models\User::first();
                $res = GeminiAgentService::applyTasksToKanban($participation, $leader, $tasksResult);
                $this->info("✓ Successfully persisted {$res['count']} tasks to database.");
            }
        } else {
            $this->warn('No CompetitionParticipation record found to test task generation.');
        }

        $this->newLine();
        $this->info('[OK] Gemini AI agent integration is healthy and operational!');
        return 0;
    }
}
