<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Centralized deadline reminders schedule (runs hourly to catch approaching deadlines)
Schedule::command('rakit:send-deadline-reminders --hours=48')->hourly();

// Daily cleanup of read notifications and old delivery logs (> 90 days)
Schedule::command('rakit:cleanup-notifications --days=90')->daily();
