<?php

namespace App\Services\Payment;

use App\Models\ActivityLog;
use App\Models\Order;
use App\Models\TeamSubscription;
use App\Models\User;
use App\Models\UserSubscription;
use App\Services\Notifications\NotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentSettlementService
{
    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Settle an order and activate its corresponding entitlements idempotently.
     *
     * @param Order $order
     * @param string|null $providerTransactionId
     * @param string|null $paymentMethod
     * @param array $extraMetadata
     * @return bool True if order was settled in this call, false if already settled
     */
    public function settle(Order $order, ?string $providerTransactionId = null, ?string $paymentMethod = null, array $extraMetadata = []): bool
    {
        return DB::transaction(function () use ($order, $providerTransactionId, $paymentMethod, $extraMetadata) {
            // Lock order row to prevent concurrent race condition between webhook & finish redirect
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($lockedOrder->isPaid()) {
                Log::info('Order is already settled. Skipping duplicate entitlement activation.', [
                    'order_id' => $lockedOrder->id,
                    'order_number' => $lockedOrder->order_number,
                ]);
                return false;
            }

            $currentMetadata = $lockedOrder->metadata ?? [];
            $mergedMetadata = array_merge($currentMetadata, $extraMetadata);

            $lockedOrder->update([
                'status' => Order::STATUS_PAID,
                'paid_at' => now(),
                'provider' => 'kasera',
                'provider_transaction_id' => $providerTransactionId ?: $lockedOrder->provider_transaction_id,
                'webhook_event_id' => $extraMetadata['webhook_event_id'] ?? $lockedOrder->webhook_event_id,
                'payment_method' => $paymentMethod ?: $lockedOrder->payment_method ?: 'qris',
                'payment_reference' => $providerTransactionId ?: $lockedOrder->payment_reference ?: $lockedOrder->order_number,
                'metadata' => $mergedMetadata,
            ]);

            $user = User::find($lockedOrder->user_id);
            if (!$user) {
                Log::warning('Settling order with unknown user', ['order_id' => $lockedOrder->id]);
                return true;
            }

            // 1. Activate Subscription & Entitlements based on Plan
            $this->activatePlanEntitlements($lockedOrder, $user);

            // 2. Log Activity (if campus and team are set)
            $campusId = $user->campusId();
            if ($campusId && $lockedOrder->team_id) {
                try {
                    ActivityLog::log(
                        $campusId,
                        $lockedOrder->team_id,
                        $user->id,
                        'order_paid',
                        $lockedOrder,
                        [
                            'order_number' => $lockedOrder->order_number,
                            'plan_type' => $lockedOrder->plan_type,
                            'amount' => $lockedOrder->amount,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::warning('Failed to log activity for order payment', ['error' => $e->getMessage()]);
                }
            }

            // 3. Send Notification to User
            try {
                $planLabel = $lockedOrder->plan_label;
                $this->notificationService->notifyUser(
                    $user->id,
                    'Pembayaran Berhasil — ' . $planLabel,
                    "Pembayaran sebesar Rp" . number_format($lockedOrder->amount, 0, ',', '.') . " untuk {$planLabel} telah diverifikasi. Fitur premium Anda aktif sekarang!",
                    '/pricing'
                );
            } catch (\Throwable $e) {
                Log::warning('Failed sending payment notification', ['error' => $e->getMessage()]);
            }

            Log::info('Order successfully settled and entitlements activated', [
                'order_id' => $lockedOrder->id,
                'order_number' => $lockedOrder->order_number,
                'plan_type' => $lockedOrder->plan_type,
                'user_id' => $user->id,
            ]);

            return true;
        });
    }

    /**
     * Activate the specific benefits, duration, and bonus credits for the purchased plan.
     */
    protected function activatePlanEntitlements(Order $order, User $user): void
    {
        match ($order->plan_type) {
            'ai_pass' => UserSubscription::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'plan_type' => 'ai_pass',
                'status' => 'active',
                'ai_credits_bonus' => 25,
                'starts_at' => now(),
                'expires_at' => now()->addDays(30),
            ]),
            'pro_monthly' => UserSubscription::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'plan_type' => 'pro_monthly',
                'status' => 'active',
                'ai_credits_bonus' => 100,
                'starts_at' => now(),
                'expires_at' => now()->addMonth(),
            ]),
            'semester_pass' => UserSubscription::create([
                'user_id' => $user->id,
                'order_id' => $order->id,
                'plan_type' => 'semester_pass',
                'status' => 'active',
                'ai_credits_bonus' => 300,
                'starts_at' => now(),
                'expires_at' => now()->addMonths(6),
            ]),
            'team_pass' => $order->team_id ? TeamSubscription::create([
                'team_id' => $order->team_id,
                'order_id' => $order->id,
                'purchased_by' => $user->id,
                'status' => 'active',
                'ai_credits_pooled' => 200,
                'starts_at' => now(),
                'expires_at' => now()->addMonths(3),
            ]) : null,
            default => null,
        };
    }
}
