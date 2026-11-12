<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Team AI Quota (shared per team, rolling 5-day window)
        Schema::create('team_ai_quotas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('team_id')->unique();
            $table->foreign('team_id')->references('id')->on('teams')->cascadeOnDelete();
            $table->timestamp('period_started_at')->nullable();
            $table->timestamp('period_expires_at')->nullable();
            $table->unsignedSmallInteger('quota_limit')->default(10);
            $table->unsignedSmallInteger('quota_used')->default(0);
            $table->json('idempotency_keys')->nullable(); // array of used keys
            $table->timestamps();
        });

        // AI Sessions (conversations)
        Schema::create('ai_sessions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('team_id');
            $table->foreign('team_id')->references('id')->on('teams')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('competition_id')->nullable();
            $table->enum('assistant_type', ['project', 'competition', 'team', 'document'])->default('project');
            $table->enum('session_type', ['private', 'shared', 'project_linked'])->default('private');
            $table->string('title')->nullable();
            $table->json('context_data')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['team_id', 'user_id']);
            $table->index(['team_id', 'assistant_type']);
        });

        // AI Messages
        Schema::create('ai_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->foreign('session_id')->references('id')->on('ai_sessions')->cascadeOnDelete();
            $table->enum('role', ['user', 'assistant', 'system'])->default('user');
            $table->longText('content');
            $table->unsignedInteger('token_count')->default(0);
            $table->string('model_used')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['session_id', 'created_at']);
        });

        // AI Artifacts (saved outputs: docs, checklists, reviews)
        Schema::create('ai_artifacts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('session_id');
            $table->foreign('session_id')->references('id')->on('ai_sessions')->cascadeOnDelete();
            $table->unsignedBigInteger('message_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('title');
            $table->longText('content');
            $table->enum('artifact_type', ['document', 'checklist', 'roadmap', 'review', 'summary'])->default('document');
            $table->boolean('is_saved_to_project')->default(false);
            $table->unsignedBigInteger('project_id')->nullable();
            $table->timestamps();
        });

        // AI Usage Logs (for analytics)
        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('team_id');
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('session_id')->nullable();
            $table->string('action_type')->default('message'); // message|session_create|document_review
            $table->unsignedInteger('tokens_used')->default(0);
            $table->string('model')->nullable();
            $table->string('provider')->default('gemini');
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['team_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_logs');
        Schema::dropIfExists('ai_artifacts');
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_sessions');
        Schema::dropIfExists('team_ai_quotas');
    }
};
