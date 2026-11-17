<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_proposal_versions', function (Blueprint $table) {
            $table->json('custom_sections')->nullable()->after('tech_stack');
        });
    }

    public function down(): void
    {
        Schema::table('project_proposal_versions', function (Blueprint $table) {
            $table->dropColumn('custom_sections');
        });
    }
};

