<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Extend team_members table with membership status
        Schema::table('team_members', function (Blueprint $table) {
            if (!Schema::hasColumn('team_members', 'status')) {
                $table->string('status', 20)->default('active')->after('permission'); // active|completed|left|removed
                $table->index(['user_id', 'status']);
            }
        });

        // 2. Extend projects table with difficulty, min/max team sizes, recruitment deadlines & supervisor
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'difficulty')) {
                $table->string('difficulty', 20)->default('intermediate')->after('category'); // beginner|intermediate|advanced
            }
            if (!Schema::hasColumn('projects', 'min_team_size')) {
                $table->unsignedSmallInteger('min_team_size')->default(2)->after('difficulty');
            }
            if (!Schema::hasColumn('projects', 'max_team_size')) {
                $table->unsignedSmallInteger('max_team_size')->default(5)->after('min_team_size');
            }
            if (!Schema::hasColumn('projects', 'recruitment_deadline')) {
                $table->dateTime('recruitment_deadline')->nullable()->after('max_team_size');
            }
            if (!Schema::hasColumn('projects', 'primary_supervisor_id')) {
                $table->foreignId('primary_supervisor_id')->nullable()->after('academic_class_id')->constrained('users')->nullOnDelete();
            }
        });

        // 3. Extend recruitment_roles with required & optional skills + min_proficiency
        Schema::table('recruitment_roles', function (Blueprint $table) {
            if (!Schema::hasColumn('recruitment_roles', 'required_skills')) {
                $table->json('required_skills')->nullable()->after('requirements');
            }
            if (!Schema::hasColumn('recruitment_roles', 'optional_skills')) {
                $table->json('optional_skills')->nullable()->after('required_skills');
            }
            if (!Schema::hasColumn('recruitment_roles', 'min_proficiency')) {
                $table->unsignedTinyInteger('min_proficiency')->default(1)->after('optional_skills');
            }
        });

        // 4. Extend student_skills with category, experience description, and evidence URL
        Schema::table('student_skills', function (Blueprint $table) {
            if (!Schema::hasColumn('student_skills', 'category')) {
                $table->string('category', 50)->nullable()->after('skill_id');
            }
            if (!Schema::hasColumn('student_skills', 'experience_description')) {
                $table->text('experience_description')->nullable()->after('proficiency');
            }
            if (!Schema::hasColumn('student_skills', 'evidence_url')) {
                $table->string('evidence_url')->nullable()->after('experience_description');
            }
        });

        // 5. Create project_supervisors for multi-lecturer supervision
        if (!Schema::hasTable('project_supervisors')) {
            Schema::create('project_supervisors', function (Blueprint $table) {
                $table->id();
                $table->foreignId('project_id')->constrained()->cascadeOnDelete();
                $table->foreignId('lecturer_id')->constrained('users')->cascadeOnDelete();
                $table->string('role', 30)->default('co_supervisor'); // primary|co_supervisor
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['project_id', 'lecturer_id']);
                $table->index(['lecturer_id', 'role']);
            });
        }

        // 6. Create matching_sessions (Assisted Team Allocation simulation & approval)
        if (!Schema::hasTable('matching_sessions')) {
            Schema::create('matching_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('academic_class_id')->constrained()->cascadeOnDelete();
                $table->foreignId('lecturer_id')->constrained('users')->cascadeOnDelete();
                $table->string('title', 150);
                $table->string('status', 30)->default('simulation'); // simulation|approved|rejected
                $table->json('summary_metrics')->nullable();
                $table->text('lecturer_review_notes')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();

                $table->index(['academic_class_id', 'status']);
            });
        }

        // 7. Create matching_allocations (individual candidate assignments in a session)
        if (!Schema::hasTable('matching_allocations')) {
            Schema::create('matching_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('matching_session_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('project_id')->constrained()->cascadeOnDelete();
                $table->foreignId('recruitment_role_id')->nullable()->constrained()->nullOnDelete();
                $table->unsignedSmallInteger('score')->default(0);
                $table->json('compatibility_breakdown')->nullable();
                $table->text('explanation')->nullable();
                $table->string('status', 30)->default('proposed'); // proposed|approved|activated|rejected
                $table->timestamps();

                $table->index(['matching_session_id', 'user_id']);
                $table->index(['matching_session_id', 'project_id']);
            });
        }

        // 8. Create matching_audit_logs for fairness transparency and allocation traceability
        if (!Schema::hasTable('matching_audit_logs')) {
            Schema::create('matching_audit_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('academic_class_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('action', 80); // recommendation_generated|application_submitted|application_accepted|allocation_simulated|allocation_approved
                $table->json('details')->nullable();
                $table->string('ip_address', 45)->nullable();
                $table->timestamps();

                $table->index(['academic_class_id', 'action']);
                $table->index(['user_id', 'action']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('matching_audit_logs');
        Schema::dropIfExists('matching_allocations');
        Schema::dropIfExists('matching_sessions');
        Schema::dropIfExists('project_supervisors');

        Schema::table('student_skills', function (Blueprint $table) {
            $table->dropColumn(['category', 'experience_description', 'evidence_url']);
        });

        Schema::table('recruitment_roles', function (Blueprint $table) {
            $table->dropColumn(['required_skills', 'optional_skills', 'min_proficiency']);
        });

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'primary_supervisor_id')) {
                $table->dropForeign(['primary_supervisor_id']);
                $table->dropColumn('primary_supervisor_id');
            }
            $table->dropColumn(['difficulty', 'min_team_size', 'max_team_size', 'recruitment_deadline']);
        });

        Schema::table('team_members', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
