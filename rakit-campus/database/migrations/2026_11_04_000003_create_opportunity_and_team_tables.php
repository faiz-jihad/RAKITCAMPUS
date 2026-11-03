<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('leader_id')->constrained('users')->restrictOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('short_description', 300);
            $table->text('description')->nullable();
            $table->string('cover_path')->nullable();
            $table->string('category', 40);
            $table->text('problem_statement')->nullable();
            $table->text('objectives')->nullable();
            $table->text('proposed_solution')->nullable();
            $table->json('tech_stack')->nullable();
            $table->string('visibility', 20)->default('campus'); // private|campus|public
            $table->string('status', 30)->default('draft');
            $table->unsignedTinyInteger('progress')->default(0); // 0..100
            $table->date('starts_on')->nullable();
            $table->date('target_completion_on')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('moderation_status', 20)->default('visible'); // visible|hidden
            $table->timestamps();
            $table->softDeletes();

            $table->index(['campus_id', 'status', 'visibility']);
            $table->index(['campus_id', 'category']);
            $table->index('leader_id');
        });

        Schema::create('project_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('min_proficiency')->default(1);
            $table->timestamps();

            $table->unique(['project_id', 'skill_id']);
            $table->index('skill_id');
        });

        Schema::create('competitions', function (Blueprint $table) {
            $table->id();
            // NULL campus_id + scope=global => visible to every campus (platform curated).
            $table->foreignId('campus_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('scope', 20)->default('campus'); // campus|global
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('organizer');
            $table->text('description')->nullable();
            $table->string('category', 40);
            $table->string('official_url')->nullable();
            $table->string('registration_url')->nullable();
            $table->dateTime('registration_opens_at')->nullable();
            $table->dateTime('registration_deadline')->nullable();
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->text('eligibility')->nullable();
            $table->unsignedSmallInteger('min_team_size')->default(1);
            $table->unsignedSmallInteger('max_team_size')->default(1);
            $table->json('required_documents')->nullable();
            $table->text('prize_info')->nullable();
            $table->string('status', 30)->default('upcoming');
            $table->boolean('status_locked')->default(false); // organiser/admin override (e.g. cancelled)
            // Honest provenance: only 'verified' when a source + verifier exist.
            $table->string('verification_status', 20)->default('unverified'); // unverified|verified|rejected
            $table->dateTime('last_verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('moderation_status', 20)->default('visible');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['scope', 'campus_id', 'status']);
            $table->index('registration_deadline');
            $table->index('category');
        });

        Schema::create('competition_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['competition_id', 'skill_id']);
            $table->index('skill_id');
        });

        // Where the competition info came from + when it was checked.
        Schema::create('competition_sources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('url');
            $table->text('notes')->nullable();
            $table->dateTime('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('competition_id');
        });

        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20); // project|competition
            // A project has exactly one primary team; competition teams leave this NULL.
            $table->foreignId('project_id')->nullable()->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('leader_id')->constrained('users')->restrictOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('capacity')->default(5);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['campus_id', 'type']);
            $table->index('leader_id');
        });

        Schema::create('team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // "leader" is a team-scoped permission, never a global account role.
            $table->string('permission', 20)->default('member'); // leader|member
            $table->string('role_name', 80)->nullable();
            $table->unsignedBigInteger('recruitment_role_id')->nullable()->index();
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            // Prevents duplicate membership at the database level.
            $table->unique(['team_id', 'user_id']);
            $table->index('user_id');
        });

        // A team may enter many competitions; a project may be linked without being copied.
        Schema::create('competition_participations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('competition_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('registration_status', 30)->default('planning'); // planning|registered|withdrawn|disqualified
            $table->string('submission_status', 30)->default('not_started'); // not_started|in_progress|submitted
            $table->string('progress_status', 30)->default('preparing'); // preparing|in_competition|finished
            $table->timestamp('registered_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['competition_id', 'team_id']);
            $table->index('project_id');
        });

        Schema::create('competition_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participation_id')->constrained('competition_participations')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->string('name');
            $table->string('url')->nullable();
            $table->string('path')->nullable();
            $table->timestamps();
        });

        Schema::create('competition_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('participation_id')->unique()->constrained('competition_participations')->cascadeOnDelete();
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->string('outcome', 30); // winner|finalist|participant|not_selected
            $table->unsignedSmallInteger('rank')->nullable();
            $table->text('notes')->nullable();
            $table->string('evidence_url')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competition_results');
        Schema::dropIfExists('competition_documents');
        Schema::dropIfExists('competition_participations');
        Schema::dropIfExists('team_members');
        Schema::dropIfExists('teams');
        Schema::dropIfExists('competition_sources');
        Schema::dropIfExists('competition_skills');
        Schema::dropIfExists('competitions');
        Schema::dropIfExists('project_skills');
        Schema::dropIfExists('projects');
    }
};
