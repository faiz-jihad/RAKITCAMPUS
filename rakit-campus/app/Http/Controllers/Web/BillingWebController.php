<?php

namespace App\Http\Controllers\Web;

use App\Exceptions\KaseraPayException;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PricingPlan;
use App\Models\Team;
use App\Models\UserSubscription;
use App\Services\Payment\KaseraPayService;
use App\Services\Payment\PaymentSettlementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BillingWebController extends Controller
{
    public function __construct(
        protected KaseraPayService $kaseraPayService,
        protected PaymentSettlementService $settlementService
    ) {}

    /**
     * Display the pricing & subscription page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $activeSubscription = null;
        $myOrders = [];
        $myTeams = [];

        if ($user) {
            $activeSubscription = UserSubscription::where('user_id', $user->id)
                ->where('status', 'active')
                ->where(function ($q) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->latest()
                ->first();

            $myOrders = Order::where('user_id', $user->id)
                ->latest()
                ->take(10)
                ->get()
                ->map(fn ($o) => [
                    'id' => $o->id,
                    'order_number' => $o->order_number,
                    'plan_type' => $o->plan_type,
                    'plan_label' => $o->plan_label,
                    'amount' => $o->amount,
                    'status' => $o->status,
                    'provider' => $o->provider ?? 'kasera',
                    'provider_transaction_id' => $o->provider_transaction_id,
                    'checkout_url' => $o->checkout_url,
                    'payment_method' => $o->payment_method ?? 'qris',
                    'paid_at' => $o->paid_at?->translatedFormat('d M Y, H:i'),
                    'expires_at' => $o->expires_at?->translatedFormat('d M Y, H:i'),
                    'created_at' => $o->created_at?->translatedFormat('d M Y, H:i'),
                ]);

            $myTeams = Team::where('leader_id', $user->id)
                ->select(['id', 'name', 'type', 'capacity'])
                ->get();
        }

        $plans = PricingPlan::getForDisplay();

        return Inertia::render('pricing', [
            'plans' => $plans,
            'activeSubscription' => $activeSubscription,
            'myOrders' => $myOrders,
            'myTeams' => $myTeams,
            'gatewayConfigured' => $this->kaseraPayService->isConfigured(),
            'gatewayEnvironment' => $this->kaseraPayService->getEnvironment(),
        ]);
    }

    /**
     * Create a real Kasera Pay checkout order.
     */
    public function checkout(Request $request): JsonResponse
    {
        Log::info('CHECKOUT_HIT_START', [
            'user' => $request->user()?->id,
            'payload' => $request->all(),
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Silakan masuk terlebih dahulu.'], 401);
        }

        $validated = $request->validate([
            'plan_type' => ['required', 'string', 'in:ai_pass,pro_monthly,semester_pass,team_pass'],
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
        ]);

        $planType = $validated['plan_type'];
        $teamId = $validated['team_id'] ?? null;

        if ($planType === 'team_pass' && !$teamId) {
            return response()->json(['message' => 'Silakan pilih tim untuk mengaktifkan Paket Tim.'], 422);
        }

        // 1. Resolve Plan & Price Server-Side (NEVER trust client input)
        $dbPlan = PricingPlan::where('slug', $planType)->where('is_active', true)->first();
        $fallbackPriceMap = [
            'ai_pass' => 15000,
            'pro_monthly' => 29000,
            'semester_pass' => 49000,
            'team_pass' => 99000,
        ];

        $amount = $dbPlan ? (int) $dbPlan->price : ($fallbackPriceMap[$planType] ?? 0);
        $planName = $dbPlan ? $dbPlan->name : match ($planType) {
            'ai_pass' => 'AI Pass',
            'pro_monthly' => 'RAKIT Pro Bulanan',
            'semester_pass' => 'RAKIT Semester (6 Bulan)',
            'team_pass' => 'RAKIT Team Pass',
            default => 'Paket Berlangganan',
        };

        if ($amount <= 0) {
            return response()->json(['message' => 'Paket ini tidak memerlukan transaksi pembayaran berbayar.'], 400);
        }

        // 2. Prevent Duplicate Order Flood: Reuse active pending order created in the last 15 minutes
        $existingPendingOrder = Order::where('user_id', $user->id)
            ->where('plan_type', $planType)
            ->where('status', Order::STATUS_PENDING)
            ->where('created_at', '>=', now()->subMinutes(15))
            ->latest()
            ->first();

        if ($existingPendingOrder && !$existingPendingOrder->isExpired()) {
            // Self-heal: If checkout_url is missing, attempt to retrieve transaction from Kasera Pay
            if (empty($existingPendingOrder->checkout_url) && $this->kaseraPayService->isConfigured()) {
                try {
                    $tx = $this->kaseraPayService->getTransactionByExternalId($existingPendingOrder->order_number);
                    if ($tx && !empty($tx['checkout_url'])) {
                        $expiresAt = isset($tx['expires_at']) ? new \DateTime($tx['expires_at']) : now()->addHours(24);
                        $existingPendingOrder->update([
                            'provider_transaction_id' => $tx['id'] ?? null,
                            'checkout_url' => $tx['checkout_url'] ?? null,
                            'expires_at' => $expiresAt,
                            'payment_reference' => $tx['id'] ?? null,
                            'metadata' => array_merge($existingPendingOrder->metadata ?? [], [
                                'kasera_response' => [
                                    'id' => $tx['id'] ?? null,
                                    'status' => $tx['status'] ?? null,
                                    'payment' => $tx['payment'] ?? null,
                                    'fee' => $tx['fee'] ?? null,
                                ],
                            ]),
                        ]);
                        $existingPendingOrder->refresh();
                    }
                } catch (\Throwable) {
                    $existingPendingOrder->update(['status' => Order::STATUS_FAILED]);
                    $existingPendingOrder = null;
                }
            }

            if ($existingPendingOrder && !empty($existingPendingOrder->checkout_url) && !$existingPendingOrder->isExpired()) {
                return response()->json([
                    'success' => true,
                    'order' => $existingPendingOrder,
                    'checkout_url' => $existingPendingOrder->checkout_url,
                    'qr_string' => $existingPendingOrder->qr_string,
                    'reused' => true,
                ]);
            }
        }

        // 3. Generate New Order
        $orderNumber = 'RKT-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        $order = Order::create([
            'order_number' => $orderNumber,
            'user_id' => $user->id,
            'team_id' => $teamId,
            'plan_type' => $planType,
            'amount' => $amount,
            'payment_method' => 'qris',
            'provider' => 'kasera',
            'status' => Order::STATUS_PENDING,
            'metadata' => [
                'user_name' => $user->name,
                'user_email' => $user->email,
                'plan_name' => $planName,
                'environment' => $this->kaseraPayService->getEnvironment(),
            ],
        ]);

        // 4. Request Kasera Pay Hosted Checkout
        try {
            $returnUrl = route('billing.finish', ['order_number' => $orderNumber]);

            $tx = $this->kaseraPayService->createTransaction([
                'amount' => $amount,
                'description' => "Langganan RAKIT: {$planName}",
                'external_id' => $orderNumber,
                'payment_methods' => ['qris'],
                'return_url' => $returnUrl,
                'order_items' => [
                    [
                        'name' => $planName,
                        'price' => $amount,
                        'quantity' => 1,
                    ],
                ],
                'customer' => [
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ]);

            $checkoutUrl = $tx['checkout_url'] ?? null;
            $providerTransactionId = $tx['id'] ?? null;
            $expiresAt = isset($tx['expires_at']) ? new \DateTime($tx['expires_at']) : now()->addHours(24);

            $order->update([
                'provider_transaction_id' => $providerTransactionId,
                'checkout_url' => $checkoutUrl,
                'expires_at' => $expiresAt,
                'payment_reference' => $providerTransactionId,
                'metadata' => array_merge($order->metadata ?? [], [
                    'kasera_response' => [
                        'id' => $providerTransactionId,
                        'status' => $tx['status'] ?? null,
                        'payment' => $tx['payment'] ?? null,
                        'fee' => $tx['fee'] ?? null,
                    ],
                ]),
            ]);

            return response()->json([
                'success' => true,
                'order' => $order->fresh(),
                'checkout_url' => $checkoutUrl,
                'qr_string' => $tx['payment']['qr_string'] ?? null,
                'expires_at' => $expiresAt->format('c'),
            ]);
        } catch (KaseraPayException $e) {
            $order->update(['status' => Order::STATUS_FAILED]);

            Log::error('Kasera Pay transaction creation exception', [
                'order_number' => $orderNumber,
                'message' => $e->getMessage(),
                'provider_error' => $e->getProviderError(),
            ]);

            if (!$this->kaseraPayService->isConfigured()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment Gateway Kasera Pay sedang dalam tahap aktivasi kredensial merchant oleh Administrator.',
                    'needs_credentials' => true,
                ], 503);
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Throwable $e) {
            $order->update(['status' => Order::STATUS_FAILED]);

            Log::error('Unexpected checkout exception', [
                'order_number' => $orderNumber,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan sistem saat memproses transaksi pembayaran.',
            ], 500);
        }
    }

    /**
     * Hosted Checkout return URL & payment status verification.
     */
    public function finish(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $orderNumber = $request->query('order_number') ?? $request->route('orderNumber');

        if (!$orderNumber) {
            return redirect()->route('pricing');
        }

        $order = Order::where('order_number', $orderNumber)->first();
        if (!$order) {
            return redirect()->route('pricing')->with('error', 'Transaksi tidak ditemukan.');
        }

        if ($user && $order->user_id !== $user->id && !$user->isPlatformAdmin()) {
            abort(403, 'Anda tidak berhak melihat transaksi ini.');
        }

        // If order is still pending, perform real server-to-server inquiry against Kasera Pay API
        if ($order->isPending() && $this->kaseraPayService->isConfigured()) {
            try {
                $tx = null;
                if ($order->provider_transaction_id) {
                    $tx = $this->kaseraPayService->getTransaction($order->provider_transaction_id);
                } elseif ($order->order_number) {
                    $tx = $this->kaseraPayService->getTransactionByExternalId($order->order_number);
                }

                if ($tx) {
                    // Sync missing fields
                    if (empty($order->checkout_url) || empty($order->provider_transaction_id) || empty($order->metadata['kasera_response'])) {
                        $order->update([
                            'provider_transaction_id' => $tx['id'] ?? $order->provider_transaction_id,
                            'checkout_url' => $tx['checkout_url'] ?? $order->checkout_url,
                            'expires_at' => isset($tx['expires_at']) ? new \DateTime($tx['expires_at']) : $order->expires_at,
                            'metadata' => array_merge($order->metadata ?? [], [
                                'kasera_response' => [
                                    'id' => $tx['id'] ?? null,
                                    'status' => $tx['status'] ?? null,
                                    'payment' => $tx['payment'] ?? null,
                                    'fee' => $tx['fee'] ?? null,
                                ],
                            ]),
                        ]);
                        $order->refresh();
                    }

                    $remoteStatus = strtolower((string) ($tx['status'] ?? ''));

                    if (in_array($remoteStatus, ['succeeded', 'paid', 'settlement'], true)) {
                        $this->settlementService->settle(
                            $order,
                            $tx['id'] ?? $order->provider_transaction_id,
                            $tx['payment_method'] ?? 'qris',
                            ['verified_via' => 'return_url_server_inquiry', 'raw_kasera' => $tx]
                        );
                        $order->refresh();
                    } elseif ($remoteStatus === 'expired') {
                        $order->update(['status' => Order::STATUS_EXPIRED]);
                    } elseif (in_array($remoteStatus, ['failed', 'cancelled'], true)) {
                        $order->update(['status' => Order::STATUS_FAILED]);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Server-to-server Kasera verification failed on finish page', [
                    'order_number' => $order->order_number,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return Inertia::render('billing/status', [
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'plan_type' => $order->plan_type,
                'plan_label' => $order->plan_label,
                'amount' => $order->amount,
                'status' => $order->status,
                'provider' => $order->provider ?? 'kasera',
                'provider_transaction_id' => $order->provider_transaction_id,
                'checkout_url' => $order->checkout_url,
                'payment_method' => $order->payment_method ?? 'qris',
                'paid_at' => $order->paid_at?->translatedFormat('d M Y, H:i'),
                'expires_at' => $order->expires_at?->translatedFormat('d M Y, H:i'),
                'created_at' => $order->created_at?->translatedFormat('d M Y, H:i'),
                'qr_string' => $order->metadata['kasera_response']['payment']['qr_string'] ?? null,
            ],
            'bonusCredits' => match ($order->plan_type) {
                'ai_pass' => 25,
                'pro_monthly' => 100,
                'semester_pass' => 300,
                'team_pass' => 200,
                default => 0,
            },
        ]);
    }

    /**
     * API endpoint to check payment status in real-time from the frontend.
     */
    public function checkStatus(Request $request, string $orderNumber): JsonResponse
    {
        $user = $request->user();
        $order = Order::where('order_number', $orderNumber)->first();

        if (!$order) {
            return response()->json(['message' => 'Transaksi tidak ditemukan.'], 404);
        }

        if ($user && $order->user_id !== $user->id && !$user->isPlatformAdmin()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // If pending, perform real-time verification with Kasera Pay
        if ($order->isPending() && $this->kaseraPayService->isConfigured()) {
            try {
                $tx = null;
                if ($order->provider_transaction_id) {
                    $tx = $this->kaseraPayService->getTransaction($order->provider_transaction_id);
                } elseif ($order->order_number) {
                    $tx = $this->kaseraPayService->getTransactionByExternalId($order->order_number);
                }

                if ($tx) {
                    if (empty($order->checkout_url) || empty($order->provider_transaction_id) || empty($order->metadata['kasera_response'])) {
                        $order->update([
                            'provider_transaction_id' => $tx['id'] ?? $order->provider_transaction_id,
                            'checkout_url' => $tx['checkout_url'] ?? $order->checkout_url,
                            'expires_at' => isset($tx['expires_at']) ? new \DateTime($tx['expires_at']) : $order->expires_at,
                            'metadata' => array_merge($order->metadata ?? [], [
                                'kasera_response' => [
                                    'id' => $tx['id'] ?? null,
                                    'status' => $tx['status'] ?? null,
                                    'payment' => $tx['payment'] ?? null,
                                    'fee' => $tx['fee'] ?? null,
                                ],
                            ]),
                        ]);
                        $order->refresh();
                    }

                    $remoteStatus = strtolower((string) ($tx['status'] ?? ''));

                    if (in_array($remoteStatus, ['succeeded', 'paid', 'settlement'], true)) {
                        $this->settlementService->settle(
                            $order,
                            $tx['id'] ?? $order->provider_transaction_id,
                            $tx['payment_method'] ?? 'qris',
                            ['verified_via' => 'realtime_ajax_poll']
                        );
                        $order->refresh();
                    } elseif ($remoteStatus === 'expired') {
                        $order->update(['status' => Order::STATUS_EXPIRED]);
                    } elseif (in_array($remoteStatus, ['failed', 'cancelled'], true)) {
                        $order->update(['status' => Order::STATUS_FAILED]);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Ajax check-status Kasera inquiry failed', [
                    'order_number' => $order->order_number,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'status' => $order->status,
            'is_paid' => $order->isPaid(),
            'paid_at' => $order->paid_at?->translatedFormat('d M Y, H:i'),
            'expires_at' => $order->expires_at?->translatedFormat('d M Y, H:i'),
        ]);
    }
}
