<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Models\UserSubscription;
use App\Services\Payment\KaseraPayService;
use App\Services\Payment\PaymentSettlementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class KaseraPayIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected string $testApiKey = 'kp_test_rakitcampus_mock_key';
    protected string $testWebhookSecret = 'whsec_rakitcampus_test_secret';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('kaserapay.environment', 'sandbox');
        Config::set('kaserapay.api_key', $this->testApiKey);
        Config::set('kaserapay.webhook_secret', $this->testWebhookSecret);
        Config::set('kaserapay.base_url', 'https://pay.kasera.id');
        Config::set('kaserapay.signature_tolerance', 300);
    }

    /**
     * Generate Kasera-Signature-V1 header string: t=<timestamp>,v1=<signature>
     */
    protected function generateSignatureHeader(string $payload, int $timestamp, ?string $secret = null): string
    {
        $sec = $secret ?? $this->testWebhookSecret;
        $signedString = "{$timestamp}.{$payload}";
        $signature = hash_hmac('sha256', $signedString, $sec);

        return "t={$timestamp},v1={$signature}";
    }

    public function test_checkout_enforces_server_side_pricing_and_calls_kasera_api(): void
    {
        $user = User::factory()->create();

        Http::fake([
            'https://pay.kasera.id/v1/transactions' => Http::response([
                'id' => 'kp_tx_test_998877',
                'status' => 'pending',
                'amount' => 29000,
                'checkout_url' => 'https://pay.kasera.id/pay/kp_tx_test_998877',
                'expires_at' => now()->addHours(24)->toIso8601String(),
                'payment' => [
                    'qr_string' => '00020101021226600016ID.CO.KASERA.WWW01189360000201100000005204581253033605802ID5913RAKIT CAMPUS6007BANDUNG61054011562070703A01630489AB',
                ],
            ], 201),
        ]);

        // Attempt price tampering (client sends price: 1000 instead of 29000)
        $response = $this->actingAs($user)->postJson('/checkout', [
            'plan_type' => 'pro_monthly',
            'amount' => 1000,
            'price' => 1000,
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'checkout_url' => 'https://pay.kasera.id/pay/kp_tx_test_998877',
            ]);

        // Assert order in database has server-authoritative price of 29,000 IDR
        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'plan_type' => 'pro_monthly',
            'amount' => 29000,
            'status' => 'pending',
            'provider' => 'kasera',
            'provider_transaction_id' => 'kp_tx_test_998877',
            'checkout_url' => 'https://pay.kasera.id/pay/kp_tx_test_998877',
        ]);

        // Verify request payload sent to Kasera Pay had correct amount & Bearer token
        Http::assertSent(function ($request) {
            return $request->url() === 'https://pay.kasera.id/v1/transactions'
                && $request->hasHeader('Authorization', 'Bearer ' . $this->testApiKey)
                && $request['amount'] === 29000
                && str_starts_with($request['external_id'], 'RKT-');
        });
    }

    public function test_checkout_reuses_active_pending_order_anti_flood(): void
    {
        $user = User::factory()->create();

        $existingOrder = Order::create([
            'order_number' => 'RKT-EXISTING-1234',
            'user_id' => $user->id,
            'plan_type' => 'pro_monthly',
            'plan_label' => 'RAKIT Pro',
            'amount' => 29000,
            'status' => Order::STATUS_PENDING,
            'provider' => 'kasera',
            'provider_transaction_id' => 'kp_tx_existing_001',
            'checkout_url' => 'https://pay.kasera.id/pay/kp_tx_existing_001',
            'expires_at' => now()->addHours(12),
        ]);

        Http::fake();

        $response = $this->actingAs($user)->postJson('/checkout', [
            'plan_type' => 'pro_monthly',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'checkout_url' => 'https://pay.kasera.id/pay/kp_tx_existing_001',
            ]);

        // No new HTTP transaction creation should have been dispatched to Kasera
        Http::assertNothingSent();

        // Database should still only have 1 order
        $this->assertEquals(1, Order::where('user_id', $user->id)->count());
    }

    public function test_webhook_rejects_missing_signature(): void
    {
        $response = $this->postJson('/api/v1/payments/kasera/webhook', [
            'event' => 'payment.paid',
        ]);

        $response->assertStatus(401)
            ->assertJson(['message' => 'Invalid webhook signature.']);
    }

    public function test_webhook_rejects_tampered_signature(): void
    {
        $payload = json_encode(['event' => 'payment.paid']);
        $timestamp = time();
        $tamperedSig = "t={$timestamp},v1=invalid_hmac_hash_value_here";

        $response = $this->call(
            'POST',
            '/api/v1/payments/kasera/webhook',
            [],
            [],
            [],
            [
                'HTTP_Kasera-Signature-V1' => $tamperedSig,
                'CONTENT_TYPE' => 'application/json',
            ],
            $payload
        );

        $response->assertStatus(401)
            ->assertJson(['message' => 'Invalid webhook signature.']);
    }

    public function test_webhook_rejects_expired_timestamp_replay_attack(): void
    {
        $payload = json_encode(['event' => 'payment.paid']);
        $oldTimestamp = time() - 600; // 10 minutes ago (exceeds 300s tolerance)
        $header = $this->generateSignatureHeader($payload, $oldTimestamp);

        $response = $this->call(
            'POST',
            '/api/v1/payments/kasera/webhook',
            [],
            [],
            [],
            [
                'HTTP_Kasera-Signature-V1' => $header,
                'CONTENT_TYPE' => 'application/json',
            ],
            $payload
        );

        $response->assertStatus(401)
            ->assertJson(['message' => 'Invalid webhook signature.']);
    }

    public function test_webhook_paid_event_activates_subscription_and_credits_idempotently(): void
    {
        $user = User::factory()->create();

        $order = Order::create([
            'order_number' => 'RKT-20261120-TEST1',
            'user_id' => $user->id,
            'plan_type' => 'pro_monthly',
            'plan_label' => 'RAKIT Pro',
            'amount' => 29000,
            'status' => Order::STATUS_PENDING,
            'provider' => 'kasera',
            'provider_transaction_id' => 'kp_tx_webhook_test',
            'expires_at' => now()->addHours(24),
        ]);

        $payloadArray = [
            'id' => 'evt_kasera_11223344',
            'event' => 'payment.paid',
            'created_at' => now()->toIso8601String(),
            'data' => [
                'id' => 'kp_tx_webhook_test',
                'external_id' => $order->order_number,
                'status' => 'paid',
                'amount' => 29000,
                'payment_method' => 'qris',
                'paid_at' => now()->toIso8601String(),
            ],
        ];

        $payload = json_encode($payloadArray);
        $timestamp = time();
        $header = $this->generateSignatureHeader($payload, $timestamp);

        // First delivery: should process payment and activate subscription
        $response1 = $this->call(
            'POST',
            '/api/v1/payments/kasera/webhook',
            [],
            [],
            [],
            [
                'HTTP_Kasera-Signature-V1' => $header,
                'HTTP_Kasera-Event-Id' => 'evt_kasera_11223344',
                'CONTENT_TYPE' => 'application/json',
            ],
            $payload
        );

        $response1->assertOk()
            ->assertJson(['success' => true]);

        $order->refresh();
        $this->assertEquals(Order::STATUS_PAID, $order->status);
        $this->assertNotNull($order->paid_at);
        $this->assertEquals('evt_kasera_11223344', $order->webhook_event_id);

        // Verify active UserSubscription created for 30 days
        $subscription = UserSubscription::where('user_id', $user->id)->first();
        $this->assertNotNull($subscription);
        $this->assertEquals('pro_monthly', $subscription->plan_type);
        $this->assertEquals(UserSubscription::STATUS_ACTIVE, $subscription->status);
        $this->assertTrue($subscription->expires_at->isFuture());

        // Second delivery (duplicate retry from Kasera Pay): must be idempotent
        $response2 = $this->call(
            'POST',
            '/api/v1/payments/kasera/webhook',
            [],
            [],
            [],
            [
                'HTTP_Kasera-Signature-V1' => $header,
                'HTTP_Kasera-Event-Id' => 'evt_kasera_11223344',
                'CONTENT_TYPE' => 'application/json',
            ],
            $payload
        );

        $response2->assertOk()
            ->assertJson(['success' => true, 'duplicate' => true]);

        // Verify no duplicate subscriptions created
        $this->assertEquals(1, UserSubscription::where('user_id', $user->id)->count());
    }

    public function test_webhook_expired_event_marks_order_as_expired(): void
    {
        $user = User::factory()->create();

        $order = Order::create([
            'order_number' => 'RKT-EXP-99001',
            'user_id' => $user->id,
            'plan_type' => 'ai_pass',
            'plan_label' => 'AI Pass',
            'amount' => 15000,
            'status' => Order::STATUS_PENDING,
            'provider' => 'kasera',
            'provider_transaction_id' => 'kp_tx_expired_01',
        ]);

        $payloadArray = [
            'id' => 'evt_kasera_expired_01',
            'event' => 'payment.expired',
            'data' => [
                'id' => 'kp_tx_expired_01',
                'external_id' => $order->order_number,
                'status' => 'expired',
            ],
        ];

        $payload = json_encode($payloadArray);
        $timestamp = time();
        $header = $this->generateSignatureHeader($payload, $timestamp);

        $response = $this->call(
            'POST',
            '/api/v1/payments/kasera/webhook',
            [],
            [],
            [],
            [
                'HTTP_Kasera-Signature-V1' => $header,
                'CONTENT_TYPE' => 'application/json',
            ],
            $payload
        );

        $response->assertOk();

        $order->refresh();
        $this->assertEquals(Order::STATUS_EXPIRED, $order->status);
    }

    public function test_finish_page_inquiry_settles_pending_order(): void
    {
        $user = User::factory()->create();

        $order = Order::create([
            'order_number' => 'RKT-FINISH-INQUIRY',
            'user_id' => $user->id,
            'plan_type' => 'pro_monthly',
            'plan_label' => 'RAKIT Pro',
            'amount' => 29000,
            'status' => Order::STATUS_PENDING,
            'provider' => 'kasera',
            'provider_transaction_id' => 'kp_tx_finish_test',
        ]);

        Http::fake([
            'https://pay.kasera.id/v1/transactions/kp_tx_finish_test' => Http::response([
                'id' => 'kp_tx_finish_test',
                'status' => 'paid',
                'amount' => 29000,
                'payment_method' => 'qris',
                'paid_at' => now()->toIso8601String(),
            ], 200),
        ]);

        $response = $this->actingAs($user)->get('/billing/finish?order_number=' . $order->order_number);

        $response->assertOk();

        $order->refresh();
        $this->assertEquals(Order::STATUS_PAID, $order->status);
        $this->assertNotNull($order->paid_at);
    }

    public function test_check_status_authorization_and_inquiry(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $order = Order::create([
            'order_number' => 'RKT-CHECK-001',
            'user_id' => $user1->id,
            'plan_type' => 'ai_pass',
            'plan_label' => 'AI Pass',
            'amount' => 15000,
            'status' => Order::STATUS_PENDING,
            'provider' => 'kasera',
            'provider_transaction_id' => 'kp_tx_poll_test',
        ]);

        // Unauthorized user attempts to probe user1's order
        $this->actingAs($user2)
            ->postJson('/billing/orders/' . $order->order_number . '/check-status')
            ->assertStatus(403);

        // Owner checks status with Kasera server inquiry
        Http::fake([
            'https://pay.kasera.id/v1/transactions/kp_tx_poll_test' => Http::response([
                'id' => 'kp_tx_poll_test',
                'status' => 'paid',
                'payment_method' => 'qris',
            ], 200),
        ]);

        $response = $this->actingAs($user1)
            ->postJson('/billing/orders/' . $order->order_number . '/check-status');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'status' => 'paid',
            ]);

        $order->refresh();
        $this->assertEquals(Order::STATUS_PAID, $order->status);
    }
}
