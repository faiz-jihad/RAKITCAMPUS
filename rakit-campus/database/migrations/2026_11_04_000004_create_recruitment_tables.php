<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // One recruitment drive per team; it can be opened/closed repeatedly.
        Schema::create('recruitments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status', 20)->default('closed'); // open|closed
            $table->dateTime('closes_at')->nullable();
            $table->timestamps();

            $table->index(['campus_id', 'status']);
        });

        // Roles the team is looking for. Filled slots are derived from team_members (no counter drift).
        Schema::create('recruitment_roles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruitment_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);
            $table->unsignedSmallInteger('slots')->default(1);
            $table->text('requirements')->nullable();
            $table->timestamps();

            $table->unique(['recruitment_id', 'name']);
        });

        Schema::table('team_members', function (Blueprint $table) {
            $table->foreign('recruitment_role_id')->references('id')->on('recruitment_roles')->nullOnDelete();
        });

        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recruitment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recruitment_role_id')->nullable()->constrained('recruitment_roles')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('message')->nullable();
            $table->string('status', 20)->default('pending'); // pending|under_review|accepted|rejected|withdrawn
            $table->foreignId('decided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('decided_at')->nullable();
            $table->text('decision_note')->nullable();
            $table->timestamps();

            // One application row per (recruitment, applicant): duplicates are impossible.
            // A withdrawn application may be re-submitted by reactivating the same row.
            $table->unique(['recruitment_id', 'user_id']);
            $table->index(['recruitment_id', 'status']);
            $table->index('user_id');
        });

        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('team_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recruitment_role_id')->nullable()->constrained('recruitment_roles')->nullOnDelete();
            $table->foreignId('inviter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('invitee_id')->constrained('users')->cascadeOnDelete();
            $table->string('role_name', 80)->nullable();
            $table->text('message')->nullable();
            $table->string('status', 20)->default('pending'); // pending|accepted|declined|expired|cancelled
            // 1 while pending, NULL otherwise. The unique index below therefore allows only one
            // pending invitation per (team, invitee) while keeping history rows (MySQL ignores NULLs).
            $table->unsignedTinyInteger('pending_marker')->nullable()->default(1);
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->unique(['team_id', 'invitee_id', 'pending_marker'], 'inv_one_pending_unique');
            $table->index(['invitee_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
        Schema::dropIfExists('applications');
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropForeign(['recruitment_role_id']);
        });
        Schema::dropIfExists('recruitment_roles');
        Schema::dropIfExists('recruitments');
    }
};
