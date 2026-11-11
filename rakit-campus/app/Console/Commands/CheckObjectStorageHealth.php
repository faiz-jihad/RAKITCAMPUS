<?php

namespace App\Console\Commands;

use App\Services\Storage\ObjectStorageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class CheckObjectStorageHealth extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:check {--cleanup : Remove the test file after test}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verify Object Storage connectivity and upload/download operations';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('========================================');
        $this->info('  RakitCampus Object Storage Diagnostics ');
        $this->info('========================================');

        $diskName = ObjectStorageService::diskName();
        $this->line("Active Object Disk : <fg=cyan>{$diskName}</>");

        $config = config("filesystems.disks.{$diskName}", []);
        $bucket = $config['bucket'] ?? 'n/a';
        $endpoint = $config['endpoint'] ?? 'n/a';
        $url = $config['url'] ?? 'n/a';

        $this->line("Endpoint           : <fg=cyan>{$endpoint}</>");
        $this->line("Bucket             : <fg=cyan>{$bucket}</>");
        $this->line("Public URL Base    : <fg=cyan>{$url}</>");
        $this->newLine();

        $testPath = 'diagnostics/test_' . time() . '.txt';
        $payload = 'RakitCampus Object Storage Health Check - ' . now()->toISOString();

        $this->info('Step 1: Writing test payload to Object Storage...');
        try {
            $success = ObjectStorageService::put($testPath, $payload);
            if ($success) {
                $this->info("✓ Successfully wrote to [{$testPath}]");
            } else {
                $this->error("✗ Failed to write to [{$testPath}]");
                return Command::FAILURE;
            }
        } catch (\Throwable $e) {
            $this->error('✗ Exception during write: ' . $e->getMessage());
            return Command::FAILURE;
        }

        $this->info('Step 2: Checking existence of object...');
        $exists = ObjectStorageService::exists($testPath);
        if ($exists) {
            $this->info('✓ Object exists in bucket.');
        } else {
            $this->error('✗ Object does not exist in bucket.');
            return Command::FAILURE;
        }

        $this->info('Step 3: Checking URL resolution...');
        $resolvedUrl = ObjectStorageService::url($testPath);
        $this->info("✓ Resolved URL: {$resolvedUrl}");

        $this->info('Step 4: Reading back object content...');
        try {
            $readBack = Storage::disk($diskName)->get($testPath);
            if (trim($readBack) === trim($payload)) {
                $this->info('✓ Content matches expected payload perfectly.');
            } else {
                $this->warn('! Content mismatch.');
            }
        } catch (\Throwable $e) {
            $this->error('✗ Exception during read: ' . $e->getMessage());
        }

        if ($this->option('cleanup')) {
            $this->info('Step 5: Cleaning up test object...');
            ObjectStorageService::delete($testPath);
            $this->info('✓ Cleaned up test object.');
        }

        $this->newLine();
        $this->info('★ All Object Storage diagnostics passed successfully!');
        return Command::SUCCESS;
    }
}
