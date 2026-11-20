<?php

namespace App\Http\Controllers\Web\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PricingPlan;
use App\Services\Payment\KaseraPayService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminPricingWebController extends Controller
{
    public function __construct(
        protected KaseraPayService $kaseraPayService
    ) {}
    private function checkAdmin(Request $request)
    {
        $user = $request->user();
        if (!$user || (!$user->isPlatformAdmin() && !$user->isCampusAdmin())) {
            abort(403, 'Akses ditolak. Hanya administrator yang dapat mengelola paket harga.');
        }
    }

    public function index(Request $request)
    {
        $this->checkAdmin($request);

        // Auto-seed if table is empty
        if (PricingPlan::count() === 0) {
            foreach (PricingPlan::fallbackDefaults() as $idx => $d) {
                PricingPlan::create([
                    'slug' => $d['id'],
                    'name' => $d['name'],
                    'price' => $d['price'],
                    'period' => $d['period'],
                    'tagline' => $d['tagline'],
                    'badge' => $d['badge'],
                    'is_featured' => $d['is_featured'],
                    'is_active' => true,
                    'features' => $d['features'],
                    'cta_text' => $d['cta'],
                    'ai_credits_bonus' => $d['ai_credits_bonus'] ?? 0,
                    'sort_order' => $idx + 1,
                ]);
            }
        }

        $plans = PricingPlan::orderBy('sort_order', 'asc')->get();

        $recentOrders = Order::with('user:id,name,email')
            ->latest()
            ->take(20)
            ->get()
            ->map(fn ($o) => [
                'id' => $o->id,
                'order_number' => $o->order_number,
                'user_name' => $o->user?->name ?? 'Pengguna',
                'user_email' => $o->user?->email,
                'plan_type' => $o->plan_type,
                'plan_label' => $o->plan_label,
                'amount' => $o->amount,
                'status' => $o->status,
                'provider' => $o->provider ?? 'kasera',
                'provider_transaction_id' => $o->provider_transaction_id,
                'payment_method' => $o->payment_method ?? 'qris',
                'paid_at' => $o->paid_at?->translatedFormat('d M Y, H:i'),
                'created_at' => $o->created_at?->translatedFormat('d M Y, H:i'),
            ]);

        $orderStats = [
            'total_volume' => (int) Order::whereIn('status', [Order::STATUS_PAID, Order::STATUS_SETTLEMENT])->sum('amount'),
            'paid_count' => Order::whereIn('status', [Order::STATUS_PAID, Order::STATUS_SETTLEMENT])->count(),
            'pending_count' => Order::where('status', Order::STATUS_PENDING)->count(),
        ];

        $gatewayStatus = [
            'is_configured' => $this->kaseraPayService->isConfigured(),
            'is_live' => $this->kaseraPayService->isLive(),
            'environment' => $this->kaseraPayService->getEnvironment(),
            'base_url' => config('kaserapay.base_url', 'https://pay.kasera.id'),
        ];

        return Inertia::render('admin/pricing/index', [
            'plans' => $plans,
            'recentOrders' => $recentOrders,
            'orderStats' => $orderStats,
            'gatewayStatus' => $gatewayStatus,
        ]);
    }

    public function update(Request $request, $id)
    {
        $this->checkAdmin($request);

        $plan = PricingPlan::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'price' => 'required|integer|min:0',
            'period' => 'required|string|max:60',
            'tagline' => 'nullable|string|max:255',
            'badge' => 'nullable|string|max:60',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'features' => 'nullable',
            'cta_text' => 'nullable|string|max:60',
            'ai_credits_bonus' => 'required|integer|min:0',
            'sort_order' => 'nullable|integer',
        ]);

        if (is_string($data['features'] ?? null)) {
            $data['features'] = array_values(array_filter(
                array_map('trim', explode("\n", $data['features'])),
                fn ($line) => strlen($line) > 0
            ));
        }

        $plan->update($data);

        return redirect()->back()->with('success', "Paket '{$plan->name}' berhasil diperbarui!");
    }

    public function store(Request $request)
    {
        $this->checkAdmin($request);

        $data = $request->validate([
            'slug' => 'required|string|max:50|unique:pricing_plans,slug',
            'name' => 'required|string|max:100',
            'price' => 'required|integer|min:0',
            'period' => 'required|string|max:60',
            'tagline' => 'nullable|string|max:255',
            'badge' => 'nullable|string|max:60',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'features' => 'nullable',
            'cta_text' => 'nullable|string|max:60',
            'ai_credits_bonus' => 'required|integer|min:0',
            'sort_order' => 'nullable|integer',
        ]);

        if (is_string($data['features'] ?? null)) {
            $data['features'] = array_values(array_filter(
                array_map('trim', explode("\n", $data['features'])),
                fn ($line) => strlen($line) > 0
            ));
        }

        PricingPlan::create($data);

        return redirect()->back()->with('success', 'Paket baru berhasil ditambahkan!');
    }

    public function resetDefault(Request $request)
    {
        $this->checkAdmin($request);

        PricingPlan::truncate();

        foreach (PricingPlan::fallbackDefaults() as $idx => $d) {
            PricingPlan::create([
                'slug' => $d['id'],
                'name' => $d['name'],
                'price' => $d['price'],
                'period' => $d['period'],
                'tagline' => $d['tagline'],
                'badge' => $d['badge'],
                'is_featured' => $d['is_featured'],
                'is_active' => true,
                'features' => $d['features'],
                'cta_text' => $d['cta'],
                'ai_credits_bonus' => $d['ai_credits_bonus'] ?? 0,
                'sort_order' => $idx + 1,
            ]);
        }

        return redirect()->back()->with('success', 'Paket harga berhasil di-reset ke nilai default standar!');
    }

    public function destroy(Request $request, $id)
    {
        $this->checkAdmin($request);

        $plan = PricingPlan::findOrFail($id);
        if (in_array($plan->slug, ['free', 'ai_pass', 'pro_monthly', 'semester_pass'])) {
            return redirect()->back()->with('error', 'Paket sistem bawaan tidak dapat dihapus, hanya dapat dinonaktifkan.');
        }

        $plan->delete();
        return redirect()->back()->with('success', 'Paket berhasil dihapus.');
    }
}
