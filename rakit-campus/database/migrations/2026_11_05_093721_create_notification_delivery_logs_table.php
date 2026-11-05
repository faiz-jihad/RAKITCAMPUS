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
        if (!Schema::hasTable('notification_delivery_logs')) {
            Schema::create('notification_delivery_logs', function (Blueprint $table) {
                $table->id();
                $table->string('idempotency_key', 120)->nullable()->index();
                $table->string('notification_type', 80);
                $table->string('category', 50)->default('general');
                $table->string('priority', 20)->default('medium'); // critical, high, medium, low
                $table->string('channel', 20)->default('in_app'); // in_app, email
                $table->foreignId('recipient_id')->nullable()->constrained('users')->cascadeOnDelete();
                $table->string('recipient_email', 150)->nullable();
                $table->string('subject', 255)->nullable();
                $table->string('status', 30)->default('queued'); // queued, sent, failed, skipped
                $table->text('error_message')->nullable();
                $table->unsignedSmallInteger('retry_count')->default(0);
                $table->timestamp('last_attempted_at')->nullable();
                $table->timestamp('sent_at')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['recipient_id', 'status']);
                $table->index(['category', 'status']);
                $table->index('created_at');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notification_delivery_logs');
    }
};
