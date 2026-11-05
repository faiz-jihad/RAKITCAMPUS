<?php

namespace App\Console\Commands;

use App\Services\Notifications\NotificationCleanupService;
use Illuminate\Console\Command;

class CleanupNotificationsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rakit:cleanup-notifications {--days=90 : Umur hari notifikasi lama yang akan dihapus}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Bersihkan notifikasi lama yang telah dibaca dan log pengiriman yang telah usang';

    /**
     * Execute the console command.
     */
    public function handle(NotificationCleanupService $cleanupService): int
    {
        $days = (int) $this->option('days');
        $this->info("Membersihkan notifikasi lama (> {$days} hari)...");

        $results = $cleanupService->cleanup($days);

        $this->info("Notifikasi in-app dibersihkan: {$results['deleted_notifications']}");
        $this->info("Log pengiriman dibersihkan: {$results['deleted_logs']}");

        return Command::SUCCESS;
    }
}
