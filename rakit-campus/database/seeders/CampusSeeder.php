<?php

namespace Database\Seeders;

use App\Enums\SubscriptionPlan;
use App\Enums\SubscriptionStatus;
use App\Models\Campus;
use App\Models\Subscription;
use Illuminate\Database\Seeder;

class CampusSeeder extends Seeder
{
    public function run(): void
    {
        $polindra = Campus::firstOrCreate(
            ['slug' => 'polindra'],
            [
                'name' => 'Politeknik Negeri Indramayu',
                'email_domain' => 'polindra.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => true,
                    'pilot_duration_months' => 3,
                    'programs' => [
                        'Teknik Informatika',
                        'Rekayasa Perangkat Lunak',
                        'Sistem Informasi Kota Cerdas'
                    ],
                ]
            ]
        );

        Subscription::firstOrCreate(
            ['campus_id' => $polindra->id],
            [
                'plan' => SubscriptionPlan::Trial,
                'status' => SubscriptionStatus::Trialing,
                'seat_limit' => 500,
                'trial_ends_at' => now()->addMonths(3),
            ]
        );

        // Additional campus to test SaaS tenant isolation
        $itb = Campus::firstOrCreate(
            ['slug' => 'itb'],
            [
                'name' => 'Institut Teknologi Bandung',
                'email_domain' => 'itb.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => ['Teknik Informatika', 'Sistem dan Teknologi Informasi']
                ]
            ]
        );

        Subscription::firstOrCreate(
            ['campus_id' => $itb->id],
            [
                'plan' => SubscriptionPlan::Starter,
                'status' => SubscriptionStatus::Active,
                'seat_limit' => 1000,
                'current_period_ends_at' => now()->addYear(),
            ]
        );
    }
}
