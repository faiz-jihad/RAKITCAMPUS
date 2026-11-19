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
                'period' => 'selamanya',
                'tagline' => 'Eksplorasi & kolaborasi dasar',
                'badge' => null,
                'is_featured' => false,
                'features' => [
                    'Eksplorasi kompetisi & proyek',
                    'Buat & gabung tim kolaborasi',
                    'Workspace & task kanban',
                    'Leaderboard kampus',
                ],
                'cta' => 'Mulai Gratis',
                'disabled' => true,
                'ai_credits_bonus' => 0,
            ],
            [
                'id' => 'ai_pass',
                'name' => 'AI Pass',
                'price' => 15000,
                'period' => 'sekali bayar',
                'tagline' => 'Booster instan saat lomba',
                'badge' => 'Populer',
                'is_featured' => false,
                'features' => [
                    'AI Reviewer Proposal & Rubrik',
                    'Evaluasi pitch deck & ide',
                    '+25 Kredit AI ekstra (30 hari)',
                    'Solusi & perbaikan bab proposal',
                ],
                'cta' => 'Beli AI Pass',
                'disabled' => false,
                'ai_credits_bonus' => 25,
            ],
            [
                'id' => 'pro_monthly',
                'name' => 'RAKIT Pro',
                'price' => 29000,
                'period' => 'bulan',
                'tagline' => 'Untuk mahasiswa aktif lomba',
                'badge' => 'Pilihan Aktif',
                'is_featured' => false,
                'features' => [
                    '100 kuota AI Workspace /bln',
                    'Badge Verified Pro di profil',
                    'Ekspor portofolio PDF ATS',
                    'GitHub sync & template juara',
                ],
                'cta' => 'Langganan Pro',
                'disabled' => false,
                'ai_credits_bonus' => 100,
            ],
            [
                'id' => 'semester_pass',
                'name' => 'RAKIT Semester',
                'price' => 49000,
                'period' => '6 bulan',
                'tagline' => 'Paling hemat 1 semester',
                'badge' => 'Hemat 72%',
                'is_featured' => true,
                'features' => [
                    'Semua fitur Pro 6 bulan penuh',
                    'Hanya Rp 8.100 /bulan',
                    '+300 Kredit AI semester',
                    'Prioritas matchmaking tim',
                ],
                'cta' => 'Ambil Pass Semester',
                'disabled' => false,
                'ai_credits_bonus' => 300,
            ],
            [
                'id' => 'team_pass',
                'name' => 'RAKIT Team',
                'price' => 99000,
                'period' => 'tim (3 bln)',
                'tagline' => 'Kolaborasi intensif 1 tim lomba',
                'badge' => '1 Tim',
                'is_featured' => false,
                'features' => [
                    'Shared 200 Kredit AI bersama',
                    'Living Proposal AI terintegrasi',
                    'Prioritas kompetisi kampus',
                    'Workspace tim & GitHub sync',
                ],
                'cta' => 'Beli untuk Tim',
                'disabled' => false,
                'ai_credits_bonus' => 200,
            ],
        ];
    }
}
