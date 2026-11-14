<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Performance indexes for dashboard endpoints.
 *
 * Dashboard queries that run on every page load need fast index access.
 * All indexes are created with IF NOT EXISTS logic via raw SQL where possible,
 * or guarded with Schema::hasIndex checks to stay idempotent.
 */
return new class extends Migration
{
    public function up(): void
    {
        // --- tasks -----------------------------------------------------------
        // Query: Task::where('assignee_id', $userId)->where('status', Completed)->...
        // Existing index: (assignee_id, due_on) — missing status column
        if (Schema::hasTable('tasks') && !$this->indexExists('tasks', 'tasks_assignee_status_idx')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->index(['assignee_id', 'status', 'updated_at'], 'tasks_assignee_status_idx');
            });
        }

        // --- activity_logs ---------------------------------------------------
        // Query: ActivityLog::where('actor_id', $userId)->whereYear/Month('created_at')
        // Existing: (team_id, created_at) — actor_id not indexed
        if (Schema::hasTable('activity_logs') && !$this->indexExists('activity_logs', 'activity_logs_actor_created_idx')) {
            Schema::table('activity_logs', function (Blueprint $table) {
                $table->index(['actor_id', 'created_at'], 'activity_logs_actor_created_idx');
            });
        }

        // --- campus_memberships ----------------------------------------------
        // Query: CampusMembership::where('campus_id', $id)->where('role', ...)->where('verification_status', ...)
        // No composite (campus_id, role, verification_status) index found
        if (Schema::hasTable('campus_memberships') && !$this->indexExists('campus_memberships', 'cm_campus_role_vstatus_idx')) {
            Schema::table('campus_memberships', function (Blueprint $table) {
                $table->index(['campus_id', 'role', 'verification_status'], 'cm_campus_role_vstatus_idx');
            });
        }

        // --- projects --------------------------------------------------------
        // Query: Project::where('status', ...)->where('moderation_status', 'visible')
        if (Schema::hasTable('projects') && !$this->indexExists('projects', 'projects_status_moderation_idx')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->index(['status', 'moderation_status'], 'projects_status_moderation_idx');
            });
        }

        // --- competitions ----------------------------------------------------
        // Query: Competition::whereIn('status', ['open','upcoming'])->latest('registration_deadline')
        if (Schema::hasTable('competitions') && !$this->indexExists('competitions', 'competitions_status_deadline_idx')) {
            Schema::table('competitions', function (Blueprint $table) {
                $table->index(['status', 'registration_deadline'], 'competitions_status_deadline_idx');
            });
        }

        // --- invitations -----------------------------------------------------
        // Query: Invitation::where('invitee_id', $userId)->where('status', 'pending')
        if (Schema::hasTable('invitations') && !$this->indexExists('invitations', 'inv_invitee_status_idx')) {
            Schema::table('invitations', function (Blueprint $table) {
                $table->index(['invitee_id', 'status'], 'inv_invitee_status_idx');
            });
        }
    }

    public function down(): void
    {
        $drops = [
            'tasks'             => 'tasks_assignee_status_idx',
            'activity_logs'     => 'activity_logs_actor_created_idx',
            'campus_memberships'=> 'cm_campus_role_vstatus_idx',
            'projects'          => 'projects_status_moderation_idx',
            'competitions'      => 'competitions_status_deadline_idx',
            'invitations'       => 'inv_invitee_status_idx',
        ];

        foreach ($drops as $table => $index) {
            if (Schema::hasTable($table) && $this->indexExists($table, $index)) {
                Schema::table($table, fn (Blueprint $t) => $t->dropIndex($index));
            }
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
        return count($indexes) > 0;
    }
};
