<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Concurrency & High Load Performance Indexes for 200+ Concurrent Users.
 *
 * Ensures all high-frequency lookups (Kanban boards, capacity checks,
 * application status filters, feedback tickets, deliverables) have
 * dedicated composite B-Tree indexes to prevent full table scans and lock contention.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. team_members: Capacity checks and active member retrieval under high concurrency
        if (Schema::hasTable('team_members') && !$this->indexExists('team_members', 'tm_team_status_idx')) {
            Schema::table('team_members', function (Blueprint $table) {
                $table->index(['team_id', 'status'], 'tm_team_status_idx');
            });
        }

        // 2. applications: Fast applicant checks and recruitment listings
        if (Schema::hasTable('applications')) {
            if (!$this->indexExists('applications', 'apps_user_status_idx')) {
                Schema::table('applications', function (Blueprint $table) {
                    $table->index(['user_id', 'status'], 'apps_user_status_idx');
                });
            }
            if (!$this->indexExists('applications', 'apps_recruitment_status_created_idx')) {
                Schema::table('applications', function (Blueprint $table) {
                    $table->index(['recruitment_id', 'status', 'created_at'], 'apps_recruitment_status_created_idx');
                });
            }
        }

        // 3. system_feedbacks: User ticket history & admin status/category queries
        if (Schema::hasTable('system_feedbacks')) {
            if (!$this->indexExists('system_feedbacks', 'sf_user_created_idx')) {
                Schema::table('system_feedbacks', function (Blueprint $table) {
                    $table->index(['user_id', 'created_at'], 'sf_user_created_idx');
                });
            }
            if (!$this->indexExists('system_feedbacks', 'sf_status_cat_created_idx')) {
                Schema::table('system_feedbacks', function (Blueprint $table) {
                    $table->index(['status', 'category', 'created_at'], 'sf_status_cat_created_idx');
                });
            }
        }

        // 4. competition_documents: Atomic version increments & deliverable queries
        if (Schema::hasTable('competition_documents') && !$this->indexExists('competition_documents', 'cd_part_key_ver_idx')) {
            Schema::table('competition_documents', function (Blueprint $table) {
                $table->index(['participation_id', 'required_document_key', 'version'], 'cd_part_key_ver_idx');
            });
        }

        // 5. academic_class_students: Class enrollments list & active student counts
        if (Schema::hasTable('academic_class_students') && !$this->indexExists('academic_class_students', 'acs_class_status_idx')) {
            Schema::table('academic_class_students', function (Blueprint $table) {
                $table->index(['academic_class_id', 'status'], 'acs_class_status_idx');
            });
        }

        // 6. tasks: Kanban boards listing and status transitions
        if (Schema::hasTable('tasks') && !$this->indexExists('tasks', 'tasks_team_status_pos_idx')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->index(['team_id', 'status', 'position'], 'tasks_team_status_pos_idx');
            });
        }
    }

    public function down(): void
    {
        $drops = [
            'team_members'            => 'tm_team_status_idx',
            'applications'            => ['apps_user_status_idx', 'apps_recruitment_status_created_idx'],
            'system_feedbacks'        => ['sf_user_created_idx', 'sf_status_cat_created_idx'],
            'competition_documents'   => 'cd_part_key_ver_idx',
            'academic_class_students' => 'acs_class_status_idx',
            'tasks'                   => 'tasks_team_status_pos_idx',
        ];

        foreach ($drops as $table => $indexes) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            $indexList = is_array($indexes) ? $indexes : [$indexes];
            foreach ($indexList as $idx) {
                if ($this->indexExists($table, $idx)) {
                    Schema::table($table, fn (Blueprint $t) => $t->dropIndex($idx));
                }
            }
        }
    }

    private function indexExists(string $table, string $indexName): bool
    {
        if (DB::getDriverName() === 'sqlite') {
            $indexes = DB::select("PRAGMA index_list('{$table}')");
            foreach ($indexes as $idx) {
                if (($idx->name ?? null) === $indexName) {
                    return true;
                }
            }
            return false;
        }

        if (DB::getDriverName() === 'mysql') {
            $indexes = DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = ?", [$indexName]);
            return count($indexes) > 0;
        }

        return false;
    }
};
