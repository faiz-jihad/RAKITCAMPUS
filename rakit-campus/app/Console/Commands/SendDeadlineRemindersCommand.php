<?php

namespace App\Console\Commands;

use App\Services\Notifications\DeadlineReminderService;
use Illuminate\Console\Command;

class SendDeadlineRemindersCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rakit:send-deadline-reminders {--hours=48 : Jam ke depan untuk mengecek deadline}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Kirim notifikasi pengingat tenggat waktu tugas proyek dan deliverable lomba secara otomatis';

    /**
     * Execute the console command.
     */
    public function handle(DeadlineReminderService $reminderService): int
    {
        $hours = (int) $this->option('hours');
        $this->info("Memeriksa tenggat waktu mendekati batas ({$hours} jam ke depan)...");

        $results = $reminderService->sendUpcomingDeadlineReminders($hours);

        $this->info("Pengingat tugas terkirim: {$results['task_reminders_sent']}");
        $this->info("Pengingat deliverable lomba terkirim: {$results['deliverable_reminders_sent']}");
        $this->info("Total pengingat terkirim: {$results['total_sent']}");

        return Command::SUCCESS;
    }
}
