<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pricing_plans', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 50)->unique();
            $table->string('name', 100);
            $table->unsignedInteger('price')->default(0);
            $table->string('period', 60)->default('per bulan');
            $table->text('tagline')->nullable();
            $table->string('badge', 60)->nullable();
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('features')->nullable();
            $table->string('cta_text', 60)->default('Pilih Paket');
            $table->unsignedInteger('ai_credits_bonus')->default(0);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });

        // Seed default 5 packages (Clean Apple iOS less-text copy)
        $defaultPlans = [
            [
                'slug' => 'free',
                'name' => 'Free',
                'price' => 0,
                'period' => 'selamanya',
                'tagline' => 'Eksplorasi & kolaborasi dasar',
                'badge' => null,
                'is_featured' => false,
                'is_active' => true,
                'features' => json_encode([
                    'Eksplorasi kompetisi & proyek',
                    'Buat & gabung tim kolaborasi',
                    'Workspace & task kanban',
                    'Leaderboard kampus',
                ]),
                'cta_text' => 'Mulai Gratis',
                'ai_credits_bonus' => 0,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'ai_pass',
                'name' => 'AI Pass',
                'price' => 15000,
                'period' => 'sekali bayar',
                'tagline' => 'Booster instan saat lomba',
                'badge' => 'Populer',
                'is_featured' => false,
                'is_active' => true,
                'features' => json_encode([
                    'AI Reviewer Proposal & Rubrik',
                    'Evaluasi pitch deck & ide',
                    '+25 Kredit AI ekstra (30 hari)',
                    'Solusi & perbaikan bab proposal',
                ]),
                'cta_text' => 'Beli AI Pass',
                'ai_credits_bonus' => 25,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'pro_monthly',
                'name' => 'RAKIT Pro',
                'price' => 29000,
                'period' => 'bulan',
                'tagline' => 'Untuk mahasiswa aktif lomba',
                'badge' => 'Pilihan Aktif',
                'is_featured' => false,
                'is_active' => true,
                'features' => json_encode([
                    '100 kuota AI Workspace /bln',
                    'Badge Verified Pro di profil',
                    'Ekspor portofolio PDF ATS',
                    'GitHub sync & template juara',
                ]),
                'cta_text' => 'Langganan Pro',
                'ai_credits_bonus' => 100,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'semester_pass',
                'name' => 'RAKIT Semester',
                'price' => 49000,
                'period' => '6 bulan',
                'tagline' => 'Paling hemat 1 semester',
                'badge' => 'Hemat 72%',
                'is_featured' => true,
                'is_active' => true,
                'features' => json_encode([
                    'Semua fitur Pro 6 bulan penuh',
                    'Hanya Rp 8.100 /bulan',
                    '+300 Kredit AI semester',
                    'Prioritas matchmaking tim',
                ]),
                'cta_text' => 'Ambil Pass Semester',
                'ai_credits_bonus' => 300,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slug' => 'team_pass',
                'name' => 'RAKIT Team',
                'price' => 99000,
                'period' => 'tim (3 bln)',
                'tagline' => 'Kolaborasi intensif 1 tim lomba',
                'badge' => '1 Tim',
                'is_featured' => false,
                'is_active' => true,
                'features' => json_encode([
                    'Shared 200 Kredit AI bersama',
                    'Living Proposal AI terintegrasi',
                    'Prioritas kompetisi kampus',
                    'Workspace tim & GitHub sync',
                ]),
                'cta_text' => 'Beli untuk Tim',
                'ai_credits_bonus' => 200,
                'sort_order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('pricing_plans')->insert($defaultPlans);
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_plans');
    }
};
