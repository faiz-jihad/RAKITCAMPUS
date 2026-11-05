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
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                // High-concurrency index for unread count & user notification queries
                $table->index(['notifiable_type', 'notifiable_id', 'read_at'], 'idx_notif_user_unread');
            });
        }

        if (Schema::hasTable('notification_delivery_logs')) {
            Schema::table('notification_delivery_logs', function (Blueprint $table) {
                // High-concurrency composite index for admin monitoring & recipient lookups
                $table->index(['recipient_id', 'status', 'created_at'], 'idx_delivery_recipient_status_date');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('notifications')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropIndex('idx_notif_user_unread');
            });
        }

        if (Schema::hasTable('notification_delivery_logs')) {
            Schema::table('notification_delivery_logs', function (Blueprint $table) {
                $table->dropIndex('idx_delivery_recipient_status_date');
            });
        }
    }
};
