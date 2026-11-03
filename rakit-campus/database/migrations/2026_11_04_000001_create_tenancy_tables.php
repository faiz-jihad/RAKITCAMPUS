<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tenancy & identity foundation.
 *
 * Every campus-scoped table in later migrations carries `campus_id`. The authoritative
 * link between a user and a campus is `campus_memberships` (never a client-sent id).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_platform_admin')->default(false)->after('password');
            $table->string('status', 20)->default('active')->after('is_platform_admin')->index();
        });

        Schema::create('campuses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            // Optional e-mail domain used to suggest a campus on registration (e.g. polindra.ac.id).
            $table->string('email_domain')->nullable()->index();
            $table->string('status', 20)->default('active')->index();
            $table->json('settings')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('campus_memberships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 30)->default('student'); // student | campus_admin
            $table->string('status', 20)->default('active'); // active | suspended
            $table->string('verification_status', 20)->default('unverified'); // unverified|pending|verified|rejected
            $table->timestamp('verified_at')->nullable();
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
            // Sensitive: never exposed in public resources.
            $table->string('student_number', 50)->nullable();
            $table->timestamps();

            $table->unique(['campus_id', 'user_id']);
            $table->unique(['campus_id', 'student_number'], 'cm_campus_student_number_unique');
            $table->index(['user_id', 'status']);
            $table->index(['campus_id', 'role', 'verification_status'], 'cm_campus_role_verif_idx');
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->string('plan', 20)->default('trial'); // trial|starter|professional|enterprise
            $table->string('status', 20)->default('trialing'); // trialing|active|past_due|cancelled|expired
            $table->unsignedInteger('seat_limit')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_ends_at')->nullable();
            $table->timestamps();

            $table->index(['campus_id', 'status']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100);
            $table->nullableMorphs('subject');
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['campus_id', 'created_at']);
            $table->index(['actor_id', 'created_at']);
            $table->index('action');
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->morphs('reportable');
            $table->string('reason', 50);
            $table->text('details')->nullable();
            $table->string('status', 20)->default('open'); // open|reviewing|resolved|dismissed
            $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('resolution_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['campus_id', 'status']);
        });

        Schema::create('notification_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 60);
            $table->boolean('in_app')->default(true);
            $table->boolean('email')->default(false);
            $table->timestamps();

            $table->unique(['user_id', 'type']);
        });

        // Standard Laravel database-notification table.
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['notifiable_type', 'notifiable_id', 'read_at'], 'notifications_unread_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('notification_preferences');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('campus_memberships');
        Schema::dropIfExists('campuses');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['is_platform_admin', 'status']);
        });
    }
};
