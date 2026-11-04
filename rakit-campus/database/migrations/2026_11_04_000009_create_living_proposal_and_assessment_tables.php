<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. project_proposals (Single main living proposal per project)
        Schema::create('project_proposals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('current_version_id')->nullable();
            $table->string('status', 30)->default('draft'); // draft|submitted|revision_requested|approved
            $table->unsignedSmallInteger('latest_version_number')->default(1);
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['campus_id', 'status']);
        });

        // 2. project_proposal_versions (Immutable versions of the living proposal)
        Schema::create('project_proposal_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposal_id')->constrained('project_proposals')->cascadeOnDelete();
            $table->unsignedSmallInteger('version_number')->default(1);
            $table->string('title', 255);
            $table->text('abstract')->nullable();
            $table->text('problem_statement')->nullable();
            $table->text('objectives')->nullable();
            $table->text('target_users')->nullable();
            $table->text('proposed_solution')->nullable();
            $table->text('needs_analysis')->nullable(); // Functional & Non-functional requirements
            $table->text('system_architecture')->nullable(); // Architecture, Database, APIs
            $table->text('methodology')->nullable(); // SDLC, Scrum/Agile, Testing methods
            $table->text('timeline_plan')->nullable(); // Work Breakdown & Schedule
            $table->text('budget_estimate')->nullable();
            $table->json('tech_stack')->nullable();
            $table->text('change_summary')->nullable(); // Changelog & reasons for modification
            $table->string('status', 30)->default('draft'); // draft|submitted|revision_requested|approved
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('review_notes')->nullable();
            $table->boolean('is_locked')->default(false); // Immutable once reviewed or superseded
            $table->timestamps();

            $table->unique(['proposal_id', 'version_number']);
            $table->index(['proposal_id', 'status']);
        });

        // 3. assessment_periods (Configurable assessment periods: UTS, UAS, etc.)
        Schema::create('assessment_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('academic_class_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('name', 150); // e.g. "Evaluasi Tengah Semester (UTS)"
            $table->string('type', 30); // uts|uas|milestone_review|custom
            $table->string('academic_period', 50)->default('2026/2027 Ganjil');
            $table->text('description')->nullable();
            $table->dateTime('opens_at');
            $table->dateTime('deadline');
            $table->unsignedSmallInteger('weight')->default(50); // percentage weight (e.g. 40% UTS, 60% UAS)
            $table->unsignedSmallInteger('max_score')->default(100);
            $table->json('required_documents')->nullable(); // ['report_pdf', 'presentation_ppt', 'repo_link', 'demo_link']
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['academic_class_id', 'type', 'is_active']);
        });

        // 4. assessment_rubrics (Grading criteria & rubric weights)
        Schema::create('assessment_rubrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_period_id')->constrained()->cascadeOnDelete();
            $table->string('criteria', 255);
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('weight')->default(25); // percentage out of 100
            $table->unsignedSmallInteger('max_points')->default(100);
            $table->unsignedSmallInteger('order')->default(0);
            $table->timestamps();

            $table->index(['assessment_period_id', 'order']);
        });

        // 5. project_submissions (Submission entry per project & assessment period)
        Schema::create('project_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('assessment_period_id')->constrained()->cascadeOnDelete();
            $table->string('status', 30)->default('not_started'); // not_started|draft|submitted|under_review|revision_required|resubmitted|accepted|rejected
            $table->unsignedSmallInteger('current_version')->default(1);
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('repository_url', 255)->nullable();
            $table->string('demo_url', 255)->nullable();
            $table->text('submission_notes')->nullable();
            $table->text('challenges_and_solutions')->nullable();
            $table->text('next_steps')->nullable();
            $table->decimal('total_score', 5, 2)->nullable();
            $table->string('final_grade', 10)->nullable(); // A|AB|B|BC|C|D|E
            $table->timestamp('evaluated_at')->nullable();
            $table->foreignId('evaluated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['project_id', 'assessment_period_id']);
            $table->index(['project_id', 'status']);
        });

        // 6. submission_snapshots (IMMUTABLE frozen state of project, proposal, tasks & progress at submission time)
        Schema::create('submission_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_submission_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('version_number')->default(1);
            $table->foreignId('proposal_version_id')->nullable()->constrained('project_proposal_versions')->nullOnDelete();
            $table->json('proposal_snapshot_data'); // Complete freeze of proposal version title, abstract, problem, objectives, system_architecture, etc.
            $table->unsignedTinyInteger('progress_percentage')->default(0); // Exact progress at time of submission (e.g. 45%)
            $table->json('tasks_summary')->nullable(); // Total tasks, done, in-progress, breakdown
            $table->json('milestones_summary')->nullable(); // Milestones statuses
            $table->json('team_members_snapshot')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('submitted_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('submitted_at')->useCurrent();
            $table->timestamps();

            $table->index(['project_submission_id', 'version_number']);
        });

        // 7. submission_documents (Uploaded reports, slide presentations, supporting docs)
        Schema::create('submission_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('submission_snapshot_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('type', 40); // report_pdf|presentation_ppt|supporting_doc|screenshot
            $table->string('title', 255);
            $table->string('file_path', 255);
            $table->string('original_name', 255);
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size');
            $table->foreignId('uploaded_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['project_submission_id', 'type']);
        });

        // 8. lecturer_reviews (Lecturer reviews, rubric scoring, and feedback)
        Schema::create('lecturer_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_submission_id')->constrained()->cascadeOnDelete();
            $table->foreignId('submission_snapshot_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->json('rubric_scores')->nullable(); // Array of scored rubrics with points & comments
            $table->decimal('total_score', 5, 2)->nullable();
            $table->text('feedback')->nullable();
            $table->text('revision_notes')->nullable();
            $table->string('decision', 30)->default('accepted'); // accepted|revision_required|rejected
            $table->timestamp('reviewed_at')->useCurrent();
            $table->timestamps();

            $table->index(['project_submission_id', 'reviewer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lecturer_reviews');
        Schema::dropIfExists('submission_documents');
        Schema::dropIfExists('submission_snapshots');
        Schema::dropIfExists('project_submissions');
        Schema::dropIfExists('assessment_rubrics');
        Schema::dropIfExists('assessment_periods');
        Schema::dropIfExists('project_proposal_versions');
        Schema::dropIfExists('project_proposals');
    }
};
