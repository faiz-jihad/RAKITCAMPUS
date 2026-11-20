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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'provider')) {
                $table->string('provider', 30)->default('kasera')->after('payment_method');
            }
            if (!Schema::hasColumn('orders', 'provider_transaction_id')) {
                $table->string('provider_transaction_id', 100)->nullable()->after('provider');
            }
            if (!Schema::hasColumn('orders', 'checkout_url')) {
                $table->text('checkout_url')->nullable()->after('provider_transaction_id');
            }
            if (!Schema::hasColumn('orders', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('paid_at');
            }
            if (!Schema::hasColumn('orders', 'webhook_event_id')) {
                $table->string('webhook_event_id', 100)->nullable()->after('expires_at');
            }

            $table->index('provider_transaction_id');
            $table->index(['provider', 'provider_transaction_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['provider', 'provider_transaction_id']);
            $table->dropIndex(['provider_transaction_id']);
            $table->dropColumn([
                'provider',
                'provider_transaction_id',
                'checkout_url',
                'expires_at',
                'webhook_event_id',
            ]);
        });
    }
};
