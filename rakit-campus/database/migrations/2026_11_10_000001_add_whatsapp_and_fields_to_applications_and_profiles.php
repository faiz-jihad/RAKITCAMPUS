<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('student_profiles')) {
            Schema::table('student_profiles', function (Blueprint $table) {
                if (!Schema::hasColumn('student_profiles', 'phone')) {
                    $table->string('phone', 30)->nullable()->after('photo_path');
                }
            });
        }

        if (Schema::hasTable('applications')) {
            Schema::table('applications', function (Blueprint $table) {
                if (!Schema::hasColumn('applications', 'contact_phone')) {
                    $table->string('contact_phone', 30)->nullable()->after('message');
                }
                if (!Schema::hasColumn('applications', 'portfolio_url')) {
                    $table->string('portfolio_url', 255)->nullable()->after('contact_phone');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('student_profiles')) {
            Schema::table('student_profiles', function (Blueprint $table) {
                if (Schema::hasColumn('student_profiles', 'phone')) {
                    $table->dropColumn('phone');
                }
            });
        }

        if (Schema::hasTable('applications')) {
            Schema::table('applications', function (Blueprint $table) {
                $cols = [];
                if (Schema::hasColumn('applications', 'contact_phone')) {
                    $cols[] = 'contact_phone';
                }
                if (Schema::hasColumn('applications', 'portfolio_url')) {
                    $cols[] = 'portfolio_url';
                }
                if (!empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }
    }
};
