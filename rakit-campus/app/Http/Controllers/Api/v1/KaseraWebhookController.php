<?php

namespace App\Http\Controllers\Api\v1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Payment\KaseraPayService;
use App\Services\Payment\PaymentSettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class KaseraWebhookController extends Controller
{
    public function __construct(
        protected KaseraPayService $kaseraPayService,
        protected PaymentSettlementService $settlementService
    ) {}

    /**
     * Handle incoming webhook notifications from Kasera Pay.
     */
    public function handle(Request $request): JsonResponse
    {
        $rawBody = $request->getContent();
        $signatureHeader = $request->header('Kasera-Signature-V1');
        $eventId = $request->header('Kasera-Event-Id');

        Log::info('Kasera Pay Webhook received', [
            'ip' => $request->ip(),
            'event_id' => $eventId,
            'signature_present' => !empty($signatureHeader),
            'body_length' => strlen($rawBody),
        ]);

        // 1. Verify cryptographic signature
        if (!$this->kaseraPayService->verifyWebhookSignature($rawBody, $signatureHeader)) {
            Log::warning('Kasera Pay Webhook: Unauthorized (Invalid signature)', [
                'ip' => $request->ip(),
                'signature_header' => $signatureHeader,
            ]);
            return response()->json(['message' => 'Invalid webhook signature.'], 401);
        }

        // 2. Decode raw JSON payload
        $payload = json_decode($rawBody, true);
        if (!is_array($payload)) {
            Log::warning('Kasera Pay Webhook: Malformed JSON body');
            return response()->json(['message' => 'Malformed JSON body.'], 400);
        }

        $event = $payload['event'] ?? $payload['type'] ?? 'payment.paid';
        $data = $payload['data'] ?? $payload;

        $transactionId = $data['id'] ?? null;
        $externalId = $data['external_id'] ?? null;
        $status = strtolower((string) ($data['status'] ?? ''));
        $amount = (int) ($data['amount'] ?? 0);
        $paymentMethod = $data['payment_method'] ?? 'qris';

        if (!$externalId && !$transactionId) {
            Log::warning('Kasera Pay Webhook: Missing external_id and transaction id in payload', ['payload' => $payload]);
            return response()->json(['message' => 'Missing transaction identifier.'], 422);
        }

        // 3. Locate matching order in database
        $order = Order::query()
            ->when($externalId, fn ($q) => $q->where('order_number', $externalId))
            ->when(!$externalId && $transactionId, fn ($q) => $q->where('provider_transaction_id', $transactionId))
            ->first();

        if (!$order) {
            Log::warning('Kasera Pay Webhook: No local order matches identifier', [
                'external_id' => $externalId,
                'transaction_id' => $transactionId,
            ]);
            // Return 200 so Kasera does not endlessly retry delivering an unmatchable order
            return response()->json(['message' => 'Order not found.', 'status' => 'ignored'], 200);
        }

        // 4. Validate Amount integrity
        if ($amount > 0 && (int) $order->amount !== $amount) {
            Log::error('Kasera Pay Webhook: Amount mismatch detected!', [
                'order_number' => $order->order_number,
                'expected_amount' => $order->amount,
                'received_amount' => $amount,
            ]);
            return response()->json(['message' => 'Payment amount mismatch.'], 422);
        }

        // 5. Handle Event Types
        if ($event === 'payment.paid' || in_array($status, ['succeeded', 'paid', 'settlement'], true)) {
            $settled = $this->settlementService->settle(
                $order,
                $transactionId,
                $paymentMethod,
                [
                    'webhook_event_id' => $eventId,
                    'webhook_received_at' => now()->toIso8601String(),
                    'kasera_fee' => $data['fee'] ?? null,
                    'kasera_net' => $data['net'] ?? null,
                ]
            );

            return response()->json([
                'received' => true,
                'success' => true,
                'status' => 'processed',
                'order_status' => Order::STATUS_PAID,
                'first_time_settled' => $settled,
                'duplicate' => !$settled,
            ], 200);
        }

        if ($event === 'payment.expired' || $status === 'expired') {
            if ($order->isPending()) {
                $order->update([
                    'status' => Order::STATUS_EXPIRED,
                    'metadata' => array_merge($order->metadata ?? [], [
                        'expired_via_webhook_at' => now()->toIso8601String(),
                    ]),
                ]);
                Log::info('Order marked as expired via webhook', ['order_number' => $order->order_number]);
            }
            return response()->json(['received' => true, 'status' => 'expired_acknowledged'], 200);
        }

        if ($event === 'payment.failed' || in_array($status, ['failed', 'cancelled'], true)) {
            if ($order->isPending()) {
                $order->update([
                    'status' => Order::STATUS_FAILED,
                    'metadata' => array_merge($order->metadata ?? [], [
                        'failed_via_webhook_at' => now()->toIso8601String(),
                    ]),
                ]);
                Log::info('Order marked as failed via webhook', ['order_number' => $order->order_number]);
            }
            return response()->json(['received' => true, 'status' => 'failed_acknowledged'], 200);
        }

        return response()->json(['received' => true, 'status' => 'unhandled_event_acknowledged'], 200);
    }
}
