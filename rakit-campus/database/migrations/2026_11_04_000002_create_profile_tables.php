<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Skills are a shared, global vocabulary (technical or soft). Scoped usage lives in pivots.
        Schema::create('skills', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('slug', 100)->unique();
            $table->string('type', 20)->default('technical'); // technical|soft
            $table->timestamps();

            $table->index(['type', 'name']);
        });

        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('campus_id')->constrained()->cascadeOnDelete();
            $table->string('slug', 80)->unique(); // shareable profile URL
            $table->string('photo_path')->nullable();
            $table->string('department')->nullable();
            $table->string('study_program')->nullable();
            $table->unsignedTinyInteger('semester')->nullable();
            $table->text('bio')->nullable();
            $table->string('github_url')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->string('portfolio_url')->nullable();
            $table->json('interests')->nullable();
            $table->json('preferred_roles')->nullable();
            // Availability: weekly hours the student can commit + free text.
            $table->unsignedTinyInteger('availability_hours')->nullable();
            $table->string('availability_note')->nullable();
            $table->text('collaboration_preferences')->nullable();

            // Privacy controls. Defaults are conservative.
            $table->string('visibility', 20)->default('campus'); // private|campus|public
            $table->boolean('show_email')->default(false);
            $table->boolean('portfolio_public')->default(false);
            $table->boolean('open_to_invites')->default(true);
            $table->timestamps();

            $table->index(['campus_id', 'visibility']);
        });

        Schema::create('student_skills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('proficiency')->default(1); // 1..5
            $table->timestamps();

            $table->unique(['student_profile_id', 'skill_id']);
            $table->index('skill_id');
        });

        // Experience: previous projects, competitions, research, certificates, organisations.
        Schema::create('profile_experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_profile_id')->constrained()->cascadeOnDelete();
            $table->string('type', 30); // project|competition|research|certificate|other
            $table->string('title');
            $table->string('organization')->nullable();
            $table->text('description')->nullable();
            $table->string('url')->nullable();
            $table->date('started_on')->nullable();
            $table->date('ended_on')->nullable();
            $table->timestamps();

            $table->index(['student_profile_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profile_experiences');
        Schema::dropIfExists('student_skills');
        Schema::dropIfExists('student_profiles');
        Schema::dropIfExists('skills');
    }
};
