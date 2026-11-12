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
        $campuses = [
            [
                'slug' => 'polindra',
                'name' => 'Politeknik Negeri Indramayu',
                'email_domain' => 'polindra.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => true,
                    'pilot_duration_months' => 3,
                    'programs' => [
                        'Teknik Informatika',
                        'Rekayasa Perangkat Lunak',
                        'Sistem Informasi Kota Cerdas',
                        'Teknologi Rekayasa Komputer',
                        'Teknik Mesin',
                        'Teknik Pendingin dan Tata Udara',
                    ],
                ],
            ],
            [
                'slug' => 'itb',
                'name' => 'Institut Teknologi Bandung',
                'email_domain' => 'itb.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'Teknik Informatika',
                        'Sistem dan Teknologi Informasi',
                        'Teknik Elektro',
                        'Desain Komunikasi Visual',
                        'Manajemen Bisnis',
                    ],
                ],
            ],
            [
                'slug' => 'ui',
                'name' => 'Universitas Indonesia',
                'email_domain' => 'ui.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'Ilmu Komputer',
                        'Sistem Informasi',
                        'Teknik Elektro',
                        'Ilmu Komunikasi',
                        'Manajemen',
                    ],
                ],
            ],
            [
                'slug' => 'ugm',
                'name' => 'Universitas Gadjah Mada',
                'email_domain' => 'ugm.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'Ilmu Komputer',
                        'Teknologi Informasi',
                        'Teknik Elektro',
                        'Manajemen',
                        'Ilmu Komunikasi',
                    ],
                ],
            ],
            [
                'slug' => 'its',
                'name' => 'Institut Teknologi Sepuluh Nopember',
                'email_domain' => 'its.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'Teknik Informatika',
                        'Sistem Informasi',
                        'Teknologi Informasi',
                        'Teknik Komputer',
                        'Desain Komunikasi Visual',
                    ],
                ],
            ],
            [
                'slug' => 'telkom',
                'name' => 'Telkom University',
                'email_domain' => 'telkomuniversity.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'S1 Informatika',
                        'S1 Rekayasa Perangkat Lunak',
                        'S1 Sistem Informasi',
                        'S1 Desain Komunikasi Visual',
                        'S1 Bisnis Digital',
                    ],
                ],
            ],
            [
                'slug' => 'binus',
                'name' => 'Bina Nusantara University (BINUS)',
                'email_domain' => 'binus.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'Computer Science',
                        'Information Systems',
                        'Software Engineering',
                        'Visual Communication Design',
                        'Business Creation',
                    ],
                ],
            ],
            [
                'slug' => 'pens',
                'name' => 'Politeknik Elektronika Negeri Surabaya (PENS)',
                'email_domain' => 'pens.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'Teknik Informatika',
                        'Teknologi Rekayasa Perangkat Lunak',
                        'Teknik Komputer',
                        'Sains Data Terapan',
                    ],
                ],
            ],
            [
                'slug' => 'polban',
                'name' => 'Politeknik Negeri Bandung (POLBAN)',
                'email_domain' => 'polban.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'D4 Teknik Informatika',
                        'D3 Teknik Informatika',
                        'D4 Rekayasa Perangkat Lunak',
                        'D4 Keuangan Syariah',
                    ],
                ],
            ],
            [
                'slug' => 'pnj',
                'name' => 'Politeknik Negeri Jakarta (PNJ)',
                'email_domain' => 'pnj.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'Teknik Informatika',
                        'Teknik Multimedia Digital',
                        'Teknik Komputer dan Jaringan',
                        'Manajemen Pemasaran',
                    ],
                ],
            ],
            [
                'slug' => 'ub',
                'name' => 'Universitas Brawijaya',
                'email_domain' => 'ub.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'Teknik Informatika',
                        'Sistem Informasi',
                        'Teknologi Informasi',
                        'Pendidikan Teknologi Informasi',
                    ],
                ],
            ],
            [
                'slug' => 'undip',
                'name' => 'Universitas Diponegoro',
                'email_domain' => 'undip.ac.id',
                'status' => 'active',
                'settings' => [
                    'pilot' => false,
                    'programs' => [
                        'Teknik Informatika',
                        'Sistem Informasi',
                        'Teknik Komputer',
                        'Ilmu Komunikasi',
                    ],
                ],
            ],
        ];

        foreach ($campuses as $campusData) {
            $campus = Campus::updateOrCreate(
                ['slug' => $campusData['slug']],
                $campusData
            );

            Subscription::firstOrCreate(
                ['campus_id' => $campus->id],
                [
                    'plan' => SubscriptionPlan::Starter,
                    'status' => SubscriptionStatus::Active,
                    'seat_limit' => 1000,
                    'current_period_ends_at' => now()->addYear(),
                ]
            );
        }
    }
}
