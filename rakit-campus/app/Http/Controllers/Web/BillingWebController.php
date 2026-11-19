<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Team;
use App\Models\TeamSubscription;
use App\Models\UserSubscription;
use App\Models\PricingPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class BillingWebController extends Controller
{
    /**
     * Display the pricing page.
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
                ->take(5)
                ->get();

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
        ]);
    }

    /**
     * Create a checkout order.
     */
    public function checkout(Request $request): JsonResponse
    {
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

        $priceMap = [
            'ai_pass' => 15000,
            'pro_monthly' => 29000,
            'semester_pass' => 49000,
            'team_pass' => 99000,
        ];

        $amount = $priceMap[$planType];
        $orderNumber = 'RKT-' . date('Ymd') . '-' . strtoupper(Str::random(6));

        $order = Order::create([
            'order_number' => $orderNumber,
            'user_id' => $user->id,
            'team_id' => $teamId,
            'plan_type' => $planType,
            'amount' => $amount,
            'payment_method' => 'qris',
            'status' => 'pending',
            'metadata' => [
                'user_name' => $user->name,
                'user_email' => $user->email,
                'plan_label' => match ($planType) {
                    'ai_pass' => 'AI Pass (One-time)',
                    'pro_monthly' => 'RAKIT Pro Bulanan',
                    'semester_pass' => 'RAKIT Semester (6 Bulan)',
                    'team_pass' => 'RAKIT Team Pass',
                },
            ],
        ]);

        return response()->json([
            'success' => true,
            'order' => $order,
            'checkout_url' => route('billing.simulate', $order->id),
        ]);
    }

    /**
     * Simulate or verify payment settlement (Instant QRIS validation).
     */
    public function simulatePayment(Request $request, int $orderId): RedirectResponse
    {
        $user = $request->user();
        $order = Order::findOrFail($orderId);

        if ($order->user_id !== $user->id && !$user->isPlatformAdmin()) {
            abort(403, 'Anda tidak memiliki hak akses ke transaksi ini.');
        }

        DB::transaction(function () use ($order, $user) {
            $order->update([
                'status' => 'settlement',
                'paid_at' => now(),
                'payment_reference' => 'QRIS-SIM-' . strtoupper(Str::random(8)),
            ]);

            // Activate Entitlements
            if ($order->plan_type === 'ai_pass') {
                UserSubscription::create([
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'plan_type' => 'ai_pass',
                    'status' => 'active',
                    'ai_credits_bonus' => 25,
                    'starts_at' => now(),
                    'expires_at' => now()->addDays(30),
                ]);
            } elseif ($order->plan_type === 'pro_monthly') {
                UserSubscription::create([
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'plan_type' => 'pro_monthly',
                    'status' => 'active',
                    'ai_credits_bonus' => 100,
                    'starts_at' => now(),
                    'expires_at' => now()->addMonth(),
                ]);
            } elseif ($order->plan_type === 'semester_pass') {
                UserSubscription::create([
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'plan_type' => 'semester_pass',
                    'status' => 'active',
                    'ai_credits_bonus' => 300,
                    'starts_at' => now(),
                    'expires_at' => now()->addMonths(6),
                ]);
            } elseif ($order->plan_type === 'team_pass' && $order->team_id) {
                TeamSubscription::create([
                    'team_id' => $order->team_id,
                    'order_id' => $order->id,
                    'purchased_by' => $user->id,
                    'status' => 'active',
                    'ai_credits_pooled' => 200,
                    'starts_at' => now(),
                    'expires_at' => now()->addMonths(3),
                ]);
            }
        });

        $planLabel = $order->metadata['plan_label'] ?? match ($order->plan_type) {
            'ai_pass' => 'AI Pass',
            'pro_monthly' => 'RAKIT Pro',
            'semester_pass' => 'RAKIT Semester',
            'team_pass' => 'RAKIT Team',
            default => 'Paket Berlangganan',
        };

        return redirect()->route('pricing')->with([
            'success' => 'Pembayaran berhasil! Paket ' . $planLabel . ' Anda telah aktif.',
            'payment_success' => true,
            'activated_order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'plan_name' => $planLabel,
                'plan_type' => $order->plan_type,
                'amount' => $order->amount,
                'bonus_credits' => match ($order->plan_type) {
                    'ai_pass' => 25,
                    'pro_monthly' => 100,
                    'semester_pass' => 300,
                    'team_pass' => 200,
                    default => 0,
                },
            ],
        ]);
    }
}
