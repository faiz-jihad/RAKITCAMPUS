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
        // 1. GitHub App Installations
        Schema::create('github_installations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('installation_id')->unique();
            $table->string('account_login');
            $table->string('account_type')->default('User'); // 'User', 'Organization'
            $table->string('repository_selection')->default('selected'); // 'all', 'selected'
            $table->text('access_token')->nullable(); // encrypted
            $table->timestamp('token_expires_at')->nullable();
            $table->json('permissions')->nullable();
            $table->timestamps();
        });

        // 2. Connected GitHub Repositories
        Schema::create('github_repositories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->unsignedBigInteger('installation_id')->nullable()->index();
            $table->unsignedBigInteger('github_id')->nullable();
            $table->string('owner');
            $table->string('name');
            $table->string('full_name')->index(); // 'owner/repo'
            $table->string('html_url');
            $table->string('clone_url')->nullable();
            $table->string('default_branch')->default('main');
            $table->text('description')->nullable();
            $table->boolean('is_private')->default(false);
            $table->boolean('is_fork')->default(false);
            $table->unsignedInteger('stars_count')->default(0);
            $table->unsignedInteger('forks_count')->default(0);
            $table->unsignedInteger('open_issues_count')->default(0);
            $table->string('status')->default('active'); // 'active', 'disconnected', 'syncing', 'error'
            $table->string('sync_status')->default('pending')->index(); // 'pending', 'syncing', 'synced', 'failed'
            $table->text('sync_error')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->text('webhook_secret')->nullable(); // encrypted secret
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['team_id']);
        });

        // 3. Branches
        Schema::create('github_branches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('github_repository_id')->constrained('github_repositories')->cascadeOnDelete();
            $table->string('name');
            $table->string('sha', 40)->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_protected')->default(false);
            $table->boolean('is_deleted')->default(false)->index();
            $table->timestamp('last_commit_at')->nullable();
            $table->timestamps();

            $table->unique(['github_repository_id', 'name']);
        });

        // 4. Contributors
        Schema::create('github_contributors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('github_repository_id')->constrained('github_repositories')->cascadeOnDelete();
            $table->unsignedBigInteger('github_id')->nullable();
            $table->string('login')->nullable()->index();
            $table->string('name')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('avatar_url')->nullable();
            $table->string('html_url')->nullable();
            $table->unsignedInteger('total_commits')->default(0);
            $table->unsignedBigInteger('total_additions')->default(0);
            $table->unsignedBigInteger('total_deletions')->default(0);
            $table->timestamp('first_commit_at')->nullable();
            $table->timestamp('last_commit_at')->nullable();
            $table->timestamps();

            $table->index(['github_repository_id', 'login']);
            $table->index(['github_repository_id', 'email']);
        });

        // 5. Contributor to RAKIT Member Mappings
        Schema::create('github_member_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('github_repository_id')->constrained('github_repositories')->cascadeOnDelete();
            $table->foreignId('github_contributor_id')->constrained('github_contributors')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->foreignId('team_member_id')->nullable()->constrained('team_members')->nullOnDelete();
            $table->string('mapping_type')->default('manual'); // 'github_id', 'email', 'manual'
            $table->string('confidence')->default('manual'); // 'high', 'medium', 'manual'
            $table->foreignId('mapped_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['github_repository_id', 'github_contributor_id'], 'repo_contributor_unique');
            $table->index(['github_repository_id', 'user_id']);
        });

        // 6. Commits
        Schema::create('github_commits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('github_repository_id')->constrained('github_repositories')->cascadeOnDelete();
            $table->foreignId('github_contributor_id')->nullable()->constrained('github_contributors')->nullOnDelete();
            $table->string('sha', 40);
            $table->text('message');
            $table->string('author_name')->nullable();
            $table->string('author_email')->nullable();
            $table->timestamp('author_date')->nullable()->index();
            $table->string('committer_name')->nullable();
            $table->string('committer_email')->nullable();
            $table->timestamp('committer_date')->nullable();
            $table->string('html_url')->nullable();
            $table->unsignedInteger('stats_additions')->default(0);
            $table->unsignedInteger('stats_deletions')->default(0);
            $table->unsignedInteger('stats_total')->default(0);
            $table->json('branches')->nullable(); // array of branch names reachable
            $table->json('raw_payload')->nullable();
            $table->timestamps();

            $table->unique(['github_repository_id', 'sha']);
            $table->index(['github_repository_id', 'author_date']);
        });

        // 7. Pull Requests
        Schema::create('github_pull_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('github_repository_id')->constrained('github_repositories')->cascadeOnDelete();
            $table->foreignId('github_contributor_id')->nullable()->constrained('github_contributors')->nullOnDelete();
            $table->unsignedInteger('number');
            $table->unsignedBigInteger('github_id')->nullable();
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('state')->default('open'); // 'open', 'closed', 'merged'
            $table->boolean('is_merged')->default(false)->index();
            $table->string('user_login')->nullable();
            $table->string('head_branch')->nullable();
            $table->string('base_branch')->nullable();
            $table->string('html_url')->nullable();
            $table->timestamp('created_at_gh')->nullable()->index();
            $table->timestamp('updated_at_gh')->nullable();
            $table->timestamp('closed_at_gh')->nullable();
            $table->timestamp('merged_at')->nullable();
            $table->unsignedInteger('comments_count')->default(0);
            $table->unsignedInteger('review_comments_count')->default(0);
            $table->unsignedInteger('additions')->default(0);
            $table->unsignedInteger('deletions')->default(0);
            $table->unsignedInteger('changed_files')->default(0);
            $table->timestamps();

            $table->unique(['github_repository_id', 'number']);
        });

        // 8. Pull Request Reviews
        Schema::create('github_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('github_pull_request_id')->constrained('github_pull_requests')->cascadeOnDelete();
            $table->foreignId('github_contributor_id')->nullable()->constrained('github_contributors')->nullOnDelete();
            $table->unsignedBigInteger('github_id')->nullable();
            $table->string('user_login')->nullable();
            $table->string('state')->default('COMMENTED'); // 'APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED'
            $table->text('body')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->string('html_url')->nullable();
            $table->timestamps();

            $table->index(['github_pull_request_id', 'state']);
        });

        // 9. Webhook Events (Idempotency and Audit)
        Schema::create('github_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('delivery_id', 64)->unique();
            $table->string('event', 64)->index();
            $table->string('action', 64)->nullable();
            $table->string('repository_full_name')->nullable()->index();
            $table->json('payload');
            $table->boolean('processed')->default(false)->index();
            $table->text('error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });

        // 10. Synchronization Logs
        Schema::create('github_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('github_repository_id')->constrained('github_repositories')->cascadeOnDelete();
            $table->string('sync_type')->default('initial'); // 'initial', 'incremental', 'manual', 'webhook'
            $table->string('status')->default('started'); // 'started', 'completed', 'failed'
            $table->json('items_synced')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['github_repository_id', 'started_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('github_sync_logs');
        Schema::dropIfExists('github_webhook_events');
        Schema::dropIfExists('github_reviews');
        Schema::dropIfExists('github_pull_requests');
        Schema::dropIfExists('github_commits');
        Schema::dropIfExists('github_member_mappings');
        Schema::dropIfExists('github_contributors');
        Schema::dropIfExists('github_branches');
        Schema::dropIfExists('github_repositories');
        Schema::dropIfExists('github_installations');
    }
};
