<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('system_feedbacks', function (Blueprint $table) {
            $table->string('feedback_type', 30)->default('suggestion')->after('category');
            $table->string('urgency', 20)->default('medium')->after('feedback_type');
            $table->string('page_url', 500)->nullable()->after('urgency');
            $table->text('admin_notes')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('system_feedbacks', function (Blueprint $table) {
            $table->dropColumn(['feedback_type', 'urgency', 'page_url', 'admin_notes']);
        });
    }
};
