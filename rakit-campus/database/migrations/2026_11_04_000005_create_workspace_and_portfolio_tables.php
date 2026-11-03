<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Team workspace. A team *is* the workspace (no separate `workspaces` table needed):
 * every workspace table hangs off `team_id` and carries `campus_id` for tenant scoping.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('starts_on')->nullable();
            $table->date('due_on')->nullable();
            $table->string('status', 20)->default('planned'); // planned|in_progress|completed
            $table->timestamps();

            $table->index(['team_id', 'status']);
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('milestone_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('todo'); // todo|in_progress|in_review|completed
            $table->string('priority', 20)->default('medium'); // low|medium|high|urgent
            $table->date('due_on')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['team_id', 'status', 'position']);
            $table->index(['assignee_id', 'due_on']);
        });

        Schema::create('task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();

            $table->index('task_id');
        });

        // Team-wide discussion threads + announcements share one table (kind discriminates).
        Schema::create('team_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('team_posts')->cascadeOnDelete();
            $table->string('kind', 20)->default('discussion'); // discussion|announcement
            $table->string('title')->nullable();
            $table->text('body');
            $table->boolean('pinned')->default(false);
            $table->timestamps();

            $table->index(['team_id', 'kind', 'created_at']);
        });

        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->morphs('attachable');
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->string('disk', 20)->default('local');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');
            $table->timestamps();
        });

        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->nullableMorphs('subject');
            $table->string('action', 60);
            $table->json('properties')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['team_id', 'created_at']);
        });

        // Portfolio ---------------------------------------------------------------------------
        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('participation_id')->nullable()->constrained('competition_participations')->nullOnDelete();
            $table->string('type', 30); // project_completed|competition_result|certificate|research|other
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('achieved_on')->nullable();
            $table->string('evidence_url')->nullable();
            // Honest labelling: starts self_reported; only 'verified' after a campus admin / leader reviews.
            $table->string('verification_status', 20)->default('self_reported'); // self_reported|pending|verified|rejected
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('verified_at')->nullable();
            $table->boolean('is_public')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'type']);
            $table->index(['campus_id', 'verification_status']);
            // A system-generated achievement per user per source cannot be duplicated.
            $table->unique(['user_id', 'project_id', 'type'], 'ach_user_project_type_unique');
            $table->unique(['user_id', 'participation_id', 'type'], 'ach_user_part_type_unique');
        });

        Schema::create('portfolio_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 30)->default('link'); // link|repository|document|other
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('url');
            $table->boolean('is_public')->default(true);
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::create('contribution_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->string('role_name', 80)->nullable();
            $table->text('summary');
            $table->unsignedInteger('tasks_completed')->default(0);
            $table->timestamps();

            $table->unique(['user_id', 'team_id']);
        });

        Schema::create('bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->morphs('bookmarkable');
            $table->timestamps();

            $table->unique(['user_id', 'bookmarkable_type', 'bookmarkable_id'], 'bookmarks_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookmarks');
        Schema::dropIfExists('contribution_records');
        Schema::dropIfExists('portfolio_items');
        Schema::dropIfExists('achievements');
        Schema::dropIfExists('activity_logs');
        Schema::dropIfExists('attachments');
        Schema::dropIfExists('team_posts');
        Schema::dropIfExists('task_comments');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('milestones');
    }
};
