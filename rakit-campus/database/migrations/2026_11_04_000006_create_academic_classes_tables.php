<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. academic_classes (Kelas perkuliahan / bimbingan dosen)
        Schema::create('academic_classes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('lecturer_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 150);
            $table->string('code', 50);
            $table->string('join_code', 10)->unique();
            $table->string('study_program', 100)->nullable();
            $table->string('academic_year', 30)->default('2026/2027');
            $table->string('semester', 20)->default('Ganjil');
            $table->text('description')->nullable();
            $table->unsignedInteger('target_team_size')->default(4);
            $table->string('status', 20)->default('active');
            $table->timestamps();

            $table->index(['campus_id', 'lecturer_id', 'status']);
        });

        // 2. academic_class_students (Mahasiswa per kelas)
        Schema::create('academic_class_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_class_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('student_number', 50)->nullable();
            $table->string('status', 20)->default('enrolled');
            $table->timestamp('enrolled_at')->useCurrent();
            $table->timestamps();

            $table->unique(['academic_class_id', 'user_id']);
            $table->index(['academic_class_id', 'status']);
        });

        // 3. Add academic_class_id & lecturer fields to projects table
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'academic_class_id')) {
                $table->foreignId('academic_class_id')->nullable()->after('campus_id')->constrained('academic_classes')->nullOnDelete();
            }
            if (!Schema::hasColumn('projects', 'lecturer_notes')) {
                $table->text('lecturer_notes')->nullable()->after('progress');
            }
            if (!Schema::hasColumn('projects', 'lecturer_evaluation')) {
                $table->string('lecturer_evaluation', 50)->nullable()->after('lecturer_notes');
            }
        });

        // 4. academic_class_guidances (Catatan bimbingan & pengumuman kelas)
        Schema::create('academic_class_guidances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academic_class_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('lecturer_id')->constrained('users')->cascadeOnDelete();
            $table->string('title', 255);
            $table->text('content');
            $table->string('type', 30)->default('guidance');
            $table->timestamps();

            $table->index(['academic_class_id', 'project_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_class_guidances');

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'academic_class_id')) {
                $table->dropForeign(['academic_class_id']);
                $table->dropColumn('academic_class_id');
            }
            if (Schema::hasColumn('projects', 'lecturer_notes')) {
                $table->dropColumn('lecturer_notes');
            }
            if (Schema::hasColumn('projects', 'lecturer_evaluation')) {
                $table->dropColumn('lecturer_evaluation');
            }
        });

        Schema::dropIfExists('academic_class_students');
        Schema::dropIfExists('academic_classes');
    }
};
