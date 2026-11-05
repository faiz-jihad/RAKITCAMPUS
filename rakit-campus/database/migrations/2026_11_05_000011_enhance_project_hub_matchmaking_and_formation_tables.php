<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (! Schema::hasColumn('projects', 'formation_status')) {
                $table->string('formation_status', 40)->default('draft')->after('status');
            }
            if (! Schema::hasColumn('projects', 'formation_notes')) {
                $table->text('formation_notes')->nullable()->after('formation_status');
            }
            if (! Schema::hasColumn('projects', 'formation_approved_at')) {
                $table->timestamp('formation_approved_at')->nullable()->after('formation_notes');
            }
            if (! Schema::hasColumn('projects', 'formation_approved_by')) {
                $table->foreignId('formation_approved_by')->nullable()->after('formation_approved_at')
                    ->constrained('users')->nullOnDelete();
            }
            if (! Schema::hasColumn('projects', 'expected_weekly_hours')) {
                $table->unsignedTinyInteger('expected_weekly_hours')->default(10)->after('formation_approved_by');
            }
            if (! Schema::hasColumn('projects', 'formation_deadline')) {
                $table->date('formation_deadline')->nullable()->after('expected_weekly_hours');
            }
        });

        Schema::table('recruitment_roles', function (Blueprint $table) {
            if (! Schema::hasColumn('recruitment_roles', 'description')) {
                $table->text('description')->nullable()->after('name');
            }
            if (! Schema::hasColumn('recruitment_roles', 'priority')) {
                $table->string('priority', 20)->default('normal')->after('slots');
            }
        });

        Schema::table('invitations', function (Blueprint $table) {
            if (! Schema::hasColumn('invitations', 'declined_reason')) {
                $table->string('declined_reason', 255)->nullable()->after('message');
            }
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['formation_approved_by']);
            $table->dropColumn([
                'formation_status',
                'formation_notes',
                'formation_approved_at',
                'formation_approved_by',
                'expected_weekly_hours',
                'formation_deadline',
            ]);
        });

        Schema::table('recruitment_roles', function (Blueprint $table) {
            $table->dropColumn(['description', 'priority']);
        });

        Schema::table('invitations', function (Blueprint $table) {
            $table->dropColumn(['declined_reason']);
        });
    }
};
