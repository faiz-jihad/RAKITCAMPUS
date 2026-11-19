<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('team_id')->nullable()->constrained('teams')->nullOnDelete();
            $table->string('plan_type', 40); // ai_pass, pro_monthly, semester_pass, team_pass
            $table->unsignedInteger('amount'); // 15000, 29000, 49000, 99000
            $table->string('payment_method', 30)->default('qris');
            $table->string('status', 30)->default('pending'); // pending, settlement, expired, failed
            $table->string('snap_token')->nullable();
            $table->string('payment_reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index('plan_type');
            $table->index('created_at');
        });

        Schema::create('user_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->string('plan_type', 40);
            $table->string('status', 30)->default('active'); // active, expired, cancelled
            $table->unsignedInteger('ai_credits_bonus')->default(0);
            $table->timestamp('starts_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status', 'expires_at']);
        });

        Schema::create('team_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignId('purchased_by')->constrained('users')->cascadeOnDelete();
            $table->string('status', 30)->default('active');
            $table->unsignedInteger('ai_credits_pooled')->default(100);
            $table->timestamp('starts_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['team_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_subscriptions');
        Schema::dropIfExists('user_subscriptions');
        Schema::dropIfExists('orders');
    }
};
