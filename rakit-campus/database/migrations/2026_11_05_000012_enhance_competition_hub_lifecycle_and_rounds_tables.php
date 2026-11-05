<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Extend competitions with category_tracks and verification provenance details
        Schema::table('competitions', function (Blueprint $table) {
            if (!Schema::hasColumn('competitions', 'category_tracks')) {
                $table->json('category_tracks')->nullable()->after('category');
            }
        });

        // 2. Extend teams with status
        Schema::table('teams', function (Blueprint $table) {
            if (!Schema::hasColumn('teams', 'status')) {
                $table->string('status', 30)->default('forming')->after('capacity');
                // forming|awaiting_members|ready|confirmed|registered|active|completed|withdrawn|disqualified
            }
        });

        // 3. Extend competition_participations
        Schema::table('competition_participations', function (Blueprint $table) {
            if (!Schema::hasColumn('competition_participations', 'category_track')) {
                $table->string('category_track', 100)->nullable()->after('project_id');
            }
            if (!Schema::hasColumn('competition_participations', 'formation_status')) {
                $table->string('formation_status', 30)->default('forming')->after('is_formation_locked');
                // forming|awaiting_members|ready|confirmed|registered|active|completed|withdrawn|disqualified
            }
            if (!Schema::hasColumn('competition_participations', 'formation_approved_at')) {
                $table->timestamp('formation_approved_at')->nullable()->after('formation_status');
            }
            if (!Schema::hasColumn('competition_participations', 'formation_approved_by')) {
                $table->foreignId('formation_approved_by')->nullable()->after('formation_approved_at')->constrained('users')->nullOnDelete();
            }
        });

        // 4. Create competition_rounds table
        if (!Schema::hasTable('competition_rounds')) {
            Schema::create('competition_rounds', function (Blueprint $table) {
                $table->id();
                $table->foreignId('competition_id')->constrained('competitions')->cascadeOnDelete();
                $table->unsignedSmallInteger('round_number')->default(1);
                $table->string('name', 150);
                $table->text('description')->nullable();
                $table->dateTime('starts_at')->nullable();
                $table->dateTime('ends_at')->nullable();
                $table->string('status', 30)->default('upcoming');
                // upcoming|open|submission_closed|under_evaluation|qualified|not_qualified|completed
                $table->boolean('is_final_round')->default(false);
                $table->timestamps();

                $table->index(['competition_id', 'round_number']);
            });
        }

        // 5. Extend competition_documents with round FK and deliverable attributes
        Schema::table('competition_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('competition_documents', 'competition_round_id')) {
                $table->foreignId('competition_round_id')->nullable()->after('participation_id')->constrained('competition_rounds')->nullOnDelete();
            }
            if (!Schema::hasColumn('competition_documents', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (!Schema::hasColumn('competition_documents', 'deadline')) {
                $table->dateTime('deadline')->nullable()->after('url');
            }
            if (!Schema::hasColumn('competition_documents', 'submitted_at')) {
                $table->dateTime('submitted_at')->nullable()->after('deadline');
            }
            if (!Schema::hasColumn('competition_documents', 'external_submission_url')) {
                $table->string('external_submission_url', 255)->nullable()->after('submitted_at');
            }
        });

        // 6. Create competition_allocations table (for Lecturer-Led assisted allocations)
        if (!Schema::hasTable('competition_allocations')) {
            Schema::create('competition_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('competition_id')->constrained('competitions')->cascadeOnDelete();
                $table->foreignId('lecturer_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('team_id')->nullable()->constrained('teams')->nullOnDelete();
                $table->string('suggested_role', 80)->nullable();
                $table->string('status', 30)->default('proposed'); // proposed|confirmed|rejected|cancelled
                $table->text('notes')->nullable();
                $table->timestamp('responded_at')->nullable();
                $table->timestamps();

                $table->index(['competition_id', 'lecturer_id']);
                $table->index(['student_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('competition_allocations');

        Schema::table('competition_documents', function (Blueprint $table) {
            $table->dropForeign(['competition_round_id']);
            $table->dropColumn(['competition_round_id', 'description', 'deadline', 'submitted_at', 'external_submission_url']);
        });

        Schema::dropIfExists('competition_rounds');

        Schema::table('competition_participations', function (Blueprint $table) {
            $table->dropForeign(['formation_approved_by']);
            $table->dropColumn(['category_track', 'formation_status', 'formation_approved_at', 'formation_approved_by']);
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn('status');
        });

        Schema::table('competitions', function (Blueprint $table) {
            $table->dropColumn('category_tracks');
        });
    }
};
