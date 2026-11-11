<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Configurable Scoring Rules
        Schema::create('leaderboard_point_rules', function (Blueprint $table) {
            $table->id();
            $table->string('hub', 30); // project|competition|general
            $table->string('activity_type', 60)->unique();
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->integer('base_points')->default(10);
            $table->json('multiplier_config')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['hub', 'is_active']);
        });

        // 2. Traceable Point Transaction Ledger
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('competition_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('participation_id')->nullable()->constrained('competition_participations')->nullOnDelete();
            $table->string('hub', 30)->default('general'); // project|competition|general
            $table->string('activity_type', 60);
            $table->integer('points');
            $table->string('idempotency_key', 191)->unique();
            $table->string('source_type', 100)->nullable();
            $table->unsignedBigInteger('source_id')->nullable();
            $table->string('verification_status', 30)->default('verified'); // verified|pending|rejected
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'verification_status', 'created_at'], 'pt_user_ver_idx');
            $table->index(['team_id', 'verification_status', 'created_at'], 'pt_team_ver_idx');
            $table->index(['project_id', 'verification_status', 'created_at'], 'pt_proj_ver_idx');
            $table->index(['hub', 'verification_status', 'created_at'], 'pt_hub_ver_idx');
            $table->index(['source_type', 'source_id'], 'pt_source_idx');
        });

        // 3. Leaderboard Snapshots (for fast retrieval & ranking movement tracking)
        Schema::create('leaderboard_snapshots', function (Blueprint $table) {
            $table->id();
            $table->string('scope', 40); // overall_student|project_team|project_contributor|competition_student|competition_team
            $table->string('period', 20); // weekly|monthly|all_time
            $table->string('period_key', 30); // 2026-W46|2026-11|all_time
            $table->string('entity_type', 30); // user|team|project
            $table->unsignedBigInteger('entity_id');
            $table->integer('points')->default(0);
            $table->integer('current_rank')->default(0);
            $table->integer('previous_rank')->nullable();
            $table->integer('rank_change')->default(0); // +N, -N, 0, or null
            $table->json('meta')->nullable();
            $table->timestamp('calculated_at')->useCurrent();

            $table->unique(
                ['scope', 'period', 'period_key', 'entity_type', 'entity_id'],
                'lb_snapshot_unique'
            );
            $table->index(['scope', 'period', 'period_key', 'current_rank'], 'lb_snapshot_rank_idx');
        });

        // 4. Leaderboard Audit Logs
        Schema::create('leaderboard_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->cascadeOnDelete();
            $table->string('action', 60); // adjust_points|recalculate_all|toggle_rule|update_rule
            $table->string('target_type', 60)->nullable();
            $table->unsignedBigInteger('target_id')->nullable();
            $table->integer('points_delta')->nullable();
            $table->text('reason');
            $table->json('details')->nullable();
            $table->timestamps();

            $table->index(['admin_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leaderboard_audit_logs');
        Schema::dropIfExists('leaderboard_snapshots');
        Schema::dropIfExists('point_transactions');
        Schema::dropIfExists('leaderboard_point_rules');
    }
};
