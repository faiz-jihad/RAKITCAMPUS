<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. academic_class_lecturers (Multi-lecturer support per class)
        if (!Schema::hasTable('academic_class_lecturers')) {
            Schema::create('academic_class_lecturers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('academic_class_id')->constrained()->cascadeOnDelete();
                $table->foreignId('lecturer_id')->constrained('users')->cascadeOnDelete();
                $table->string('role', 30)->default('co_lecturer'); // primary|co_lecturer|evaluator
                $table->timestamps();

                $table->unique(['academic_class_id', 'lecturer_id']);
                $table->index(['lecturer_id', 'role']);
            });
        }

        // 2. Extend projects table with final submission deliverables and evaluation timestamps
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'repository_url')) {
                $table->string('repository_url', 255)->nullable()->after('lecturer_evaluation');
            }
            if (!Schema::hasColumn('projects', 'demo_url')) {
                $table->string('demo_url', 255)->nullable()->after('repository_url');
            }
            if (!Schema::hasColumn('projects', 'submission_notes')) {
                $table->text('submission_notes')->nullable()->after('demo_url');
            }
            if (!Schema::hasColumn('projects', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('submission_notes');
            }
            if (!Schema::hasColumn('projects', 'evaluated_at')) {
                $table->timestamp('evaluated_at')->nullable()->after('submitted_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['repository_url', 'demo_url', 'submission_notes', 'submitted_at', 'evaluated_at']);
        });

        Schema::dropIfExists('academic_class_lecturers');
    }
};
