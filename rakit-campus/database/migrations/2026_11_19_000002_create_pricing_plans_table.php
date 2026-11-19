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

        // Seed default 5 packages
        $defaultPlans = [
            [
                'slug' => 'free',
                'name' => 'Free',
                'price' => 0,
                'period' => 'Selamanya',
                'tagline' => 'Untuk eksplorasi, bergabung tim, dan portofolio dasar.',
                'badge' => null,
                'is_featured' => false,
                'is_active' => true,
                'features' => json_encode([
                    'Eksplorasi kompetisi & proyek terbuka',
                    'Buat & gabung tim kolaborasi',
                    'Workspace dasar & task kanban',
                    'Profil mahasiswa & rekam jejak dasar',
                    'Akses forum & leaderboard kampus',
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
                'period' => 'Sekali Bayar',
                'tagline' => 'Booster instan saat persiapan lomba tanpa komitmen bulanan.',
                'badge' => 'Populer Saat Lomba',
                'is_featured' => false,
                'is_active' => true,
                'features' => json_encode([
                    'AI Proposal Reviewer & Grader Rubrik',
                    'Brainstorming ide proyek & solusi',
                    'Evaluasi pitch deck & latar belakang',
                    '25 Kredit AI ekstra (Masa aktif 30 hari)',
                    'Saran perbaikan bab-per-bab proposal',
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
                'period' => 'per bulan',
                'tagline' => 'Untuk mahasiswa aktif yang rutin ikut lomba & proyek setiap bulan.',
                'badge' => 'Pilihan Aktif',
                'is_featured' => false,
                'is_active' => true,
                'features' => json_encode([
                    'Semua fitur Free & AI Pass',
                    'AI Workspace kuota 100 prompt/bulan',
                    'Advanced Project Intelligence & GitHub sync',
                    'Portfolio Builder eksklusif (Custom Link)',
                    'Badge Profil "Verified Pro Hustler/Hacker"',
                    'Akses ke Template Juara & Proposal Lolos',
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
                'period' => 'per 6 bulan (1 Semester)',
                'tagline' => 'Paling hemat untuk 1 semester perkuliahan dan persiapan magang MSIB.',
                'badge' => 'Paling Hemat (6 Bulan)',
                'is_featured' => true,
                'is_active' => true,
                'features' => json_encode([
                    'Semua fitur RAKIT Pro selama 6 bulan penuh',
                    'Hanya Rp 8.100/bulan (Hemat > 70%)',
                    'Tanpa autodebit / perpanjangan paksa',
                    '300 Kredit AI ekstra untuk 1 semester',
                    'Ekspor PDF Portofolio ATS-Ready',
                    'Prioritas rekomendasi tim & matchmaking',
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
                'period' => 'per tim (3 bln)',
                'tagline' => 'Kolaborasi intensif 1 tim kompetisi kampus.',
                'badge' => '1 Tim',
                'is_featured' => false,
                'is_active' => true,
                'features' => json_encode([
                    'Shared pool 200 Kredit AI untuk seluruh anggota',
                    'Living Proposal & Pitch Assistant bersama',
                    'Prioritas pendaftaran kompetisi kampus',
                    'Workspace tim terpusat & GitHub synchronizer',
                ]),
                'cta_text' => 'Daftarkan Tim',
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
