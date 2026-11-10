<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('student_profiles', 'is_onboarded')) {
                $table->boolean('is_onboarded')->default(false)->after('open_to_invites');
            }
            if (!Schema::hasColumn('student_profiles', 'academic_status')) {
                $table->string('academic_status', 30)->nullable()->after('is_onboarded'); // 'tpb' or 'prodi'
            }
            if (!Schema::hasColumn('student_profiles', 'batch_year')) {
                $table->string('batch_year', 10)->nullable()->after('academic_status'); // e.g. '2024'
            }
            if (!Schema::hasColumn('student_profiles', 'headline')) {
                $table->string('headline')->nullable()->after('batch_year');
            }
        });
    }

    public function down(): void
    {
        Schema::table('student_profiles', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('student_profiles', 'is_onboarded')) $columns[] = 'is_onboarded';
            if (Schema::hasColumn('student_profiles', 'academic_status')) $columns[] = 'academic_status';
            if (Schema::hasColumn('student_profiles', 'batch_year')) $columns[] = 'batch_year';
            if (Schema::hasColumn('student_profiles', 'headline')) $columns[] = 'headline';
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
