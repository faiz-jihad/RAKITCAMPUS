<?php

use App\Models\PricingPlan;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations to seed clean Apple iOS copy for pricing plans.
     */
    public function up(): void
    {
        PricingPlan::truncate();

        foreach (PricingPlan::fallbackDefaults() as $idx => $d) {
            PricingPlan::create([
                'slug' => $d['id'],
                'name' => $d['name'],
                'price' => $d['price'],
                'period' => $d['period'],
                'tagline' => $d['tagline'],
                'badge' => $d['badge'],
                'is_featured' => $d['is_featured'],
                'is_active' => true,
                'features' => $d['features'],
                'cta_text' => $d['cta'],
                'ai_credits_bonus' => $d['ai_credits_bonus'] ?? 0,
                'sort_order' => $idx + 1,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
