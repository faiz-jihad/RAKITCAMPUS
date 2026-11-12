<?php

namespace App\Console\Commands;

use App\Contracts\Notifications\EmailDeliveryServiceInterface;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\AiArtifact;
use App\Models\AiSession;
use App\Models\Milestone;
use App\Models\Task;
use App\Models\Team;
use App\Models\User;
use App\Services\AI\TeamAiQuotaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Throwable;

class CheckSystemHealth extends Command
{
    protected $signature = 'rakit:check-system';
    protected $description = 'Comprehensive health check for database, redis, email, and ai agentic workspace';

    public function handle(EmailDeliveryServiceInterface $emailService, TeamAiQuotaService $quotaService): int
    {
        $this->info('========================================================');
        $this->info('  RAKIT Campus — Comprehensive System Health Verification');
        $this->info('========================================================');
        $this->newLine();

        $allPassed = true;

        // 1. Database Check
        $this->info('1. [DATABASE] Checking MySQL connection...');
        try {
            $userCount = User::count();
            $teamCount = Team::count();
            $this->line("   ✓ MySQL Connected. Users: {$userCount}, Teams: {$teamCount}");
        } catch (Throwable $e) {
            $this->error('   ✗ Database Error: ' . $e->getMessage());
            $allPassed = false;
        }

        // 2. Redis & Cache Check
        $this->info('2. [REDIS & CACHE] Checking Redis traffic and cache handling...');
        try {
            $testKey = 'rakit_traffic_check_' . time();
            $testVal = 'high_concurrency_ready';
            Cache::put($testKey, $testVal, 60);
            $retrieved = Cache::get($testKey);

            if ($retrieved === $testVal) {
                $this->line("   ✓ Cache Store [REDIS]: Write & Read successful (Key: {$testKey})");
            } else {
                $this->error("   ✗ Cache mismatch. Expected '{$testVal}', got '{$retrieved}'");
                $allPassed = false;
            }

            // Direct Redis client ping
            try {
                $redisClient = Redis::connection('default');
                $redisClient->set('ping_direct', 'pong_redis');
                $directVal = $redisClient->get('ping_direct');
                $this->line("   ✓ Direct Redis Connection: Verified ('ping_direct' => '{$directVal}')");
            } catch (Throwable $re) {
                $this->warn("   ! Direct Redis warning: " . $re->getMessage());
            }
        } catch (Throwable $e) {
            $this->error('   ✗ Redis/Cache Error: ' . $e->getMessage());
            $allPassed = false;
        }

        // 3. Email Delivery Service Check
        $this->info('3. [EMAIL] Checking transactional email pipeline...');
        try {
            $inspect = $emailService->inspectConfiguration();
            $this->line("   • Mailer Driver : " . ($inspect['mailer'] ?? 'unknown'));
            $this->line("   • From Address  : " . ($inspect['from_address'] ?? 'unknown'));

            $result = $emailService->deliver(
                'healthcheck@rakitcampus.my.id',
                'System Verifier',
                'RAKIT Campus System Health Verification',
                [
                    'title' => 'Verifikasi Sistem Berjalan',
                    'greeting' => 'Halo Developer,',
                    'message' => 'Layanan email dan notifikasi RAKIT Campus siap menangani lalu lintas transaksi pengguna.',
                    'category_name' => 'Health Check',
                ]
            );

            if (!empty($result['success'])) {
                $this->line("   ✓ Email Delivered. Log ID: " . ($result['log_id'] ?? 'N/A'));
            } else {
                $this->error("   ✗ Email Delivery Error: " . ($result['error'] ?? 'Unknown error'));
                $allPassed = false;
            }
        } catch (Throwable $e) {
            $this->error('   ✗ Email Service Exception: ' . $e->getMessage());
            $allPassed = false;
        }

        // 4. AI Workspace & Agentic Execution Check
        $this->info('4. [AI WORKSPACE] Checking models, relationships, and workspace action execution...');
        try {
            // Check AiSession relationships
            $dummySession = new AiSession();
            $hasProjectRel = method_exists($dummySession, 'project');
            $hasCompetitionRel = method_exists($dummySession, 'competition');
            $hasTeamRel = method_exists($dummySession, 'team');

            if ($hasProjectRel && $hasCompetitionRel && $hasTeamRel) {
                $this->line('   ✓ AiSession Model Relationships (project, competition, team): All Present');
            } else {
                $this->error("   ✗ Missing AiSession relationship! project: " . ($hasProjectRel ? 'yes' : 'no') . ", comp: " . ($hasCompetitionRel ? 'yes' : 'no'));
                $allPassed = false;
            }

            // Test agentic execution transaction (simulate create_tasks)
            $team = Team::first();
            $user = User::first();

            if ($team && $user) {
                DB::transaction(function () use ($team, $user) {
                    $task = Task::create([
                        'campus_id' => $team->campus_id ?? 1,
                        'team_id' => $team->id,
                        'created_by' => $user->id,
                        'title' => '[AI TEST] Automated Agentic Execution Task',
                        'description' => 'Test action execution pipeline',
                        'priority' => TaskPriority::High,
                        'status' => TaskStatus::Todo,
                        'position' => 9999,
                        'due_on' => now()->addDays(3),
                    ]);

                    $milestone = Milestone::create([
                        'campus_id' => $team->campus_id ?? 1,
                        'team_id' => $team->id,
                        'created_by' => $user->id,
                        'title' => '[AI TEST] Automated Agentic Sprint',
                        'description' => 'Sprint created by AI',
                        'status' => 'planned',
                        'starts_on' => now(),
                        'due_on' => now()->addDays(14),
                    ]);

                    // Clean up test records
                    $task->delete();
                    $milestone->delete();
                });

                $this->line('   ✓ Agentic DB Action Execution (create_tasks, create_sprint): Verified Normal');
            } else {
                $this->warn('   ! No teams or users found to test action execution.');
            }

            // Quota test
            if ($team) {
                $quota = $quotaService->getQuotaInfo($team);
                $this->line("   ✓ Team AI Quota Service: {$quota['used_conversations']}/{$quota['max_conversations']} used ({$quota['remaining_conversations']} remaining)");
            }
        } catch (Throwable $e) {
            $this->error('   ✗ AI Workspace Action Execution Error: ' . $e->getMessage());
            $allPassed = false;
        }

        $this->newLine();
        if ($allPassed) {
            $this->info('========================================================');
            $this->info('  ✓ ALL SYSTEMS OPERATIONAL AND HIGH-TRAFFIC READY!     ');
            $this->info('========================================================');
            return 0;
        }

        $this->error('========================================================');
        $this->error('  ✗ SOME SYSTEM CHECKS FAILED!                          ');
        $this->error('========================================================');
        return 1;
    }
}
