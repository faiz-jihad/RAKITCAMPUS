<?php

namespace App\Console\Commands;

use Database\Seeders\RealCompetitionSeeder;
use Illuminate\Console\Command;

class SeedRealCompetitionsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:seed-real-competitions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed real national and international student competitions with 2027 deadlines';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Seeding authentic competitions open until 2027...');

        $seeder = new RealCompetitionSeeder();
        $seeder->run();

        $this->info('Successfully seeded 15 real national/international competitions and MinSatu recruiting teams.');

        return Command::SUCCESS;
    }
}
