<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Extend competitions table with level, type & cover_image
        Schema::table('competitions', function (Blueprint $table) {
            if (!Schema::hasColumn('competitions', 'level')) {
                $table->string('level', 30)->default('national')->after('category'); // local|regional|national|international
            }
            if (!Schema::hasColumn('competitions', 'competition_type')) {
                $table->string('competition_type', 20)->default('team')->after('level'); // team|individual
            }
            if (!Schema::hasColumn('competitions', 'cover_image')) {
                $table->string('cover_image', 255)->nullable()->after('prize_info');
            }
        });

        // 2. Extend competition_participations table with selection stages & mentoring
        Schema::table('competition_participations', function (Blueprint $table) {
            if (!Schema::hasColumn('competition_participations', 'stage')) {
                $table->string('stage', 40)->default('recruiting')->after('progress_status');
                // recruiting|team_formation|preparing|registered|submitted|administrative_selection|shortlisted|finalist|final_presentation|winner|not_selected|withdrawn
            }
            if (!Schema::hasColumn('competition_participations', 'mentor_id')) {
                $table->foreignId('mentor_id')->nullable()->after('stage')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('competition_participations', 'mentor_notes')) {
                $table->text('mentor_notes')->nullable()->after('mentor_id');
            }
            if (!Schema::hasColumn('competition_participations', 'external_registration_proof')) {
                $table->string('external_registration_proof', 255)->nullable()->after('mentor_notes');
            }
            if (!Schema::hasColumn('competition_participations', 'external_submission_proof')) {
                $table->string('external_submission_proof', 255)->nullable()->after('external_registration_proof');
            }
            if (!Schema::hasColumn('competition_participations', 'is_formation_locked')) {
                $table->boolean('is_formation_locked')->default(false)->after('external_submission_proof');
            }
        });

        // 3. Extend competition_documents table
        Schema::table('competition_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('competition_documents', 'required_document_key')) {
                $table->string('required_document_key', 100)->nullable()->after('participation_id');
            }
            if (!Schema::hasColumn('competition_documents', 'original_name')) {
                $table->string('original_name', 255)->nullable()->after('name');
            }
            if (!Schema::hasColumn('competition_documents', 'file_size')) {
                $table->unsignedBigInteger('file_size')->default(0)->after('path');
            }
            if (!Schema::hasColumn('competition_documents', 'mime_type')) {
                $table->string('mime_type', 100)->nullable()->after('file_size');
            }
            if (!Schema::hasColumn('competition_documents', 'version')) {
                $table->unsignedSmallInteger('version')->default(1)->after('mime_type');
            }
            if (!Schema::hasColumn('competition_documents', 'status')) {
                $table->string('status', 20)->default('pending')->after('version'); // pending|reviewed|approved|revision_required
            }
            if (!Schema::hasColumn('competition_documents', 'feedback')) {
                $table->text('feedback')->nullable()->after('status');
            }
        });

        // 4. Extend competition_results table
        Schema::table('competition_results', function (Blueprint $table) {
            if (!Schema::hasColumn('competition_results', 'achievement_title')) {
                $table->string('achievement_title', 255)->nullable()->after('outcome');
            }
            if (!Schema::hasColumn('competition_results', 'certificate_path')) {
                $table->string('certificate_path', 255)->nullable()->after('evidence_url');
            }
            if (!Schema::hasColumn('competition_results', 'verification_status')) {
                $table->string('verification_status', 20)->default('unverified')->after('certificate_path'); // unverified|verified|rejected
            }
            if (!Schema::hasColumn('competition_results', 'verified_by')) {
                $table->foreignId('verified_by')->nullable()->after('verification_status')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('competition_results', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('verified_by');
            }
        });

        // 5. competition_status_histories (Audit trail of stage transitions)
        if (!Schema::hasTable('competition_status_histories')) {
            Schema::create('competition_status_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('participation_id')->constrained('competition_participations')->cascadeOnDelete();
                $table->string('from_stage', 40)->nullable();
                $table->string('to_stage', 40);
                $table->text('notes')->nullable();
                $table->foreignId('changed_by')->constrained('users')->restrictOnDelete();
                $table->timestamps();

                $table->index(['participation_id', 'created_at']);
            });
        }

        // 6. competition_mentors (Multi-mentors per competition team)
        if (!Schema::hasTable('competition_mentors')) {
            Schema::create('competition_mentors', function (Blueprint $table) {
                $table->id();
                $table->foreignId('participation_id')->constrained('competition_participations')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('role', 50)->default('Dosen Pembimbing');
                $table->string('status', 20)->default('accepted'); // invited|accepted|declined
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['participation_id', 'user_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('competition_mentors');
        Schema::dropIfExists('competition_status_histories');

        Schema::table('competition_results', function (Blueprint $table) {
            $table->dropColumn(['achievement_title', 'certificate_path', 'verification_status', 'verified_by', 'verified_at']);
        });

        Schema::table('competition_documents', function (Blueprint $table) {
            $table->dropColumn(['required_document_key', 'original_name', 'file_size', 'mime_type', 'version', 'status', 'feedback']);
        });

        Schema::table('competition_participations', function (Blueprint $table) {
            $table->dropColumn(['stage', 'mentor_id', 'mentor_notes', 'external_registration_proof', 'external_submission_proof', 'is_formation_locked']);
        });

        Schema::table('competitions', function (Blueprint $table) {
            $table->dropColumn(['level', 'competition_type', 'cover_image']);
        });
    }
};
