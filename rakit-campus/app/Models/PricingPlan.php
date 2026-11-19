<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PricingPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'name',
        'price',
        'period',
        'tagline',
        'badge',
        'is_featured',
        'is_active',
        'features',
        'cta_text',
        'ai_credits_bonus',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'integer',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
        'features' => 'array',
        'ai_credits_bonus' => 'integer',
        'sort_order' => 'integer',
    ];

    public static function getForDisplay(): array
    {
        try {
            $plans = static::where('is_active', true)
                ->orderBy('sort_order', 'asc')
                ->get();

            if ($plans->isNotEmpty()) {
                return $plans->map(function ($plan) {
                    return [
                        'id' => $plan->slug,
                        'db_id' => $plan->id,
                        'slug' => $plan->slug,
                        'name' => $plan->name,
                        'price' => (int) $plan->price,
                        'period' => $plan->period,
                        'tagline' => $plan->tagline ?? '',
                        'badge' => $plan->badge,
                        'is_featured' => (bool) $plan->is_featured,
                        'features' => is_array($plan->features) ? $plan->features : [],
                        'cta' => $plan->cta_text ?: 'Pilih Paket',
                        'disabled' => $plan->slug === 'free',
                        'ai_credits_bonus' => (int) $plan->ai_credits_bonus,
                    ];
                })->toArray();
            }
        } catch (\Throwable $e) {
            // Fallback to static defaults if database table not yet migrated
        }

        return static::fallbackDefaults();
    }

    public static function fallbackDefaults(): array
    {
        return [
            [
                'id' => 'free',
                'name' => 'Free',
                'price' => 0,
                'period' => 'Selamanya',
                'tagline' => 'Untuk eksplorasi, bergabung tim, dan portofolio dasar.',
                'badge' => null,
                'is_featured' => false,
                'features' => [
                    'Eksplorasi kompetisi & proyek terbuka',
                    'Buat & gabung tim kolaborasi',
                    'Workspace dasar & task kanban',
                    'Profil mahasiswa & rekam jejak dasar',
                    'Akses forum & leaderboard kampus',
                ],
                'cta' => 'Mulai Gratis',
                'disabled' => true,
                'ai_credits_bonus' => 0,
            ],
            [
                'id' => 'ai_pass',
                'name' => 'AI Pass',
                'price' => 15000,
                'period' => 'Sekali Bayar',
                'tagline' => 'Booster instan saat persiapan lomba tanpa komitmen bulanan.',
                'badge' => 'Populer Saat Lomba',
                'is_featured' => false,
                'features' => [
                    'AI Proposal Reviewer & Grader Rubrik',
                    'Brainstorming ide proyek & solusi',
                    'Evaluasi pitch deck & latar belakang',
                    '25 Kredit AI ekstra (Masa aktif 30 hari)',
                    'Saran perbaikan bab-per-bab proposal',
                ],
                'cta' => 'Beli AI Pass',
                'disabled' => false,
                'ai_credits_bonus' => 25,
            ],
            [
                'id' => 'pro_monthly',
                'name' => 'RAKIT Pro',
                'price' => 29000,
                'period' => 'per bulan',
                'tagline' => 'Untuk mahasiswa aktif yang rutin ikut lomba & proyek setiap bulan.',
                'badge' => 'Pilihan Aktif',
                'is_featured' => false,
                'features' => [
                    'Semua fitur Free & AI Pass',
                    'AI Workspace kuota 100 prompt/bulan',
                    'Advanced Project Intelligence & GitHub sync',
                    'Portfolio Builder eksklusif (Custom Link)',
                    'Badge Profil "Verified Pro Hustler/Hacker"',
                    'Akses ke Template Juara & Proposal Lolos',
                ],
                'cta' => 'Langganan Pro',
                'disabled' => false,
                'ai_credits_bonus' => 100,
            ],
            [
                'id' => 'semester_pass',
                'name' => 'RAKIT Semester',
                'price' => 49000,
                'period' => 'per 6 bulan (1 Semester)',
                'tagline' => 'Paling hemat untuk 1 semester perkuliahan dan persiapan magang MSIB.',
                'badge' => 'Paling Hemat (6 Bulan)',
                'is_featured' => true,
                'features' => [
                    'Semua fitur RAKIT Pro selama 6 bulan penuh',
                    'Hanya Rp 8.100/bulan (Hemat > 70%)',
                    'Tanpa autodebit / perpanjangan paksa',
                    '300 Kredit AI ekstra untuk 1 semester',
                    'Ekspor PDF Portofolio ATS-Ready',
                    'Prioritas rekomendasi tim & matchmaking',
                ],
                'cta' => 'Ambil Pass Semester',
                'disabled' => false,
                'ai_credits_bonus' => 300,
            ],
            [
                'id' => 'team_pass',
                'name' => 'RAKIT Team',
                'price' => 99000,
                'period' => 'per tim (3 bln)',
                'tagline' => 'Kolaborasi intensif 1 tim kompetisi kampus.',
                'badge' => '1 Tim',
                'is_featured' => false,
                'features' => [
                    'Shared pool 200 Kredit AI untuk seluruh anggota',
                    'Living Proposal & Pitch Assistant bersama',
                    'Prioritas pendaftaran kompetisi kampus',
                    'Workspace tim terpusat & GitHub synchronizer',
                ],
                'cta' => 'Daftarkan Tim',
                'disabled' => false,
                'ai_credits_bonus' => 200,
            ],
        ];
    }
}
