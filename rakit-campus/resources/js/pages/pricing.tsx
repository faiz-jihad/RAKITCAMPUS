import SeoHead from '@/components/seo/SeoHead';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    ChevronDown,
    Clock,
    Copy,
    CreditCard,
    ExternalLink,
    RefreshCw,
    ShieldAlert,
    Sparkles,
    Users,
    X,
    Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Plan {
    id: string;
    name: string;
    price: number;
    period: string;
    tagline: string;
    badge: string | null;
    is_featured: boolean;
    features: string[];
    cta: string;
    disabled?: boolean;
    ai_credits_bonus?: number;
}

interface OrderItem {
    id: number;
    order_number: string;
    plan_type: string;
    plan_label?: string;
    amount: number;
    status: string;
    provider?: string;
    provider_transaction_id?: string | null;
    checkout_url?: string | null;
    payment_method?: string;
    paid_at?: string | null;
    expires_at?: string | null;
    created_at: string;
}

interface Props {
    plans: Plan[];
    activeSubscription?: {
        plan_type: string;
        expires_at: string | null;
        ai_credits_bonus: number;
    } | null;
    myOrders: OrderItem[];
    myTeams: Array<{
        id: number;
        name: string;
        type: string;
    }>;
    gatewayConfigured?: boolean;
    gatewayEnvironment?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Harga & Akses', href: '/pricing' },
];

export default function PricingPage({
    plans = [],
    activeSubscription,
    myOrders = [],
    myTeams = [],
}: Props) {
    const { auth, flash } = usePage().props as any;
    const user = auth?.user;

    // Interactive State: Pro billing cycle toggle ('monthly' vs 'semester')
    const [billingCycle, setBillingCycle] = useState<'semester' | 'monthly'>('semester');

    // Interactive State: Modal checkout, order status, and team selection
    const [selectedTeamId, setSelectedTeamId] = useState<number | string>(myTeams?.[0]?.id || '');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
    const [createdOrder, setCreatedOrder] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [modalCopied, setModalCopied] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    // Resolve plans dynamically by ID
    const freePlan = plans.find((p) => p.id === 'free') || {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'selamanya',
        tagline: 'Eksplorasi & kolaborasi dasar',
        badge: null,
        is_featured: false,
        features: [
            'Eksplorasi kompetisi & proyek',
            'Buat & gabung tim kolaborasi',
            'Workspace & task kanban',
            'Leaderboard kampus',
        ],
        cta: 'Paket Standar Aktif',
        disabled: true,
        ai_credits_bonus: 0,
    };

    const aiPassPlan = plans.find((p) => p.id === 'ai_pass') || {
        id: 'ai_pass',
        name: 'AI Pass',
        price: 15000,
        period: 'sekali bayar',
        tagline: 'Booster instan saat deadline lomba',
        badge: 'One-time',
        is_featured: false,
        features: [
            'AI Reviewer Proposal & Rubrik',
            'Evaluasi pitch deck & ide',
            '+25 Kredit AI ekstra (30 hari)',
            'Solusi & perbaikan bab proposal',
        ],
        cta: 'Beli AI Pass',
        disabled: false,
        ai_credits_bonus: 25,
    };

    const proMonthlyPlan = plans.find((p) => p.id === 'pro_monthly') || {
        id: 'pro_monthly',
        name: 'RAKIT Pro',
        price: 29000,
        period: 'bulan',
        tagline: 'Untuk mahasiswa aktif lomba',
        badge: null,
        is_featured: false,
        features: [
            '100 kuota AI Workspace /bln',
            'Badge Verified Pro di profil',
            'Ekspor portofolio PDF ATS',
            'GitHub sync & template juara',
        ],
        cta: 'Langganan Pro',
        disabled: false,
        ai_credits_bonus: 100,
    };

    const semesterPlan = plans.find((p) => p.id === 'semester_pass') || {
        id: 'semester_pass',
        name: 'RAKIT Semester',
        price: 49000,
        period: '6 bulan',
        tagline: 'Paling hemat 1 semester',
        badge: 'Hemat 72%',
        is_featured: true,
        features: [
            'Semua fitur Pro 6 bulan penuh',
            'Hanya Rp 8.100 /bulan',
            '+300 Kredit AI semester',
            'Prioritas matchmaking tim',
        ],
        cta: 'Ambil Pass Semester',
        disabled: false,
        ai_credits_bonus: 300,
    };

    const teamPlan = plans.find((p) => p.id === 'team_pass') || {
        id: 'team_pass',
        name: 'RAKIT Team',
        price: 99000,
        period: 'tim (3 bln)',
        tagline: 'Kolaborasi intensif 1 tim lomba',
        badge: '1 Tim',
        is_featured: false,
        features: [
            'Shared 200 Kredit AI bersama',
            'Living Proposal AI terintegrasi',
            'Prioritas kompetisi kampus',
            'Workspace tim & GitHub sync',
        ],
        cta: 'Beli untuk Tim',
        disabled: false,
        ai_credits_bonus: 200,
    };

    // Active activePlan depending on billing cycle toggle
    const currentProPlan = billingCycle === 'semester' ? semesterPlan : proMonthlyPlan;
    const isProActive =
        activeSubscription?.plan_type === 'pro_monthly' ||
        activeSubscription?.plan_type === 'semester_pass';

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num);
    };

    const handleSelectPlan = async (plan: Plan) => {
        if (plan.id === 'free') return;

        if (!user) {
            router.get('/login');
            return;
        }

        setCheckoutPlan(plan);
        setIsSubmitting(true);
        setCheckoutError(null);

        try {
            const res = await fetch('/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    plan_type: plan.id,
                    team_id: plan.id === 'team_pass' ? selectedTeamId : null,
                }),
            });

            const data = await res.json();
            if (data.success && data.order) {
                setCreatedOrder({
                    ...data.order,
                    checkout_url: data.checkout_url || data.order.checkout_url,
                    qr_string: data.qr_string || data.order.qr_string,
                });
                setIsCheckoutOpen(true);
            } else {
                setCheckoutError(data.message || 'Gagal memulai checkout. Silakan coba kembali.');
            }
        } catch {
            setCheckoutError('Terjadi gangguan jaringan. Silakan periksa koneksi internet Anda.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const faqItems = [
        {
            q: 'Apakah saya bisa tetap ikut kompetisi tanpa membayar?',
            a: 'Ya, tentu saja. Eksplorasi ribuan kompetisi kampus, fitur cari rekan tim (Hacker/Hipster/Hustler), dan ruang kerja task kanban tim tetap 100% gratis selamanya.',
        },
        {
            q: 'Apa perbedaan AI Pass dengan langganan RAKIT Pro?',
            a: `AI Pass adalah booster satu kali bayar (one-time) ${formatRupiah(aiPassPlan.price)} untuk 30 hari (+${aiPassPlan.ai_credits_bonus || 25} kredit AI dan reviewer proposal). RAKIT Pro adalah langganan komprehensif bulanan/semester yang membuka kuota AI Workspace, verifikasi pro badge, dan ekspor portofolio ATS.`,
        },
        {
            q: 'Bagaimana metode pembayarannya? Apakah ada autodebit?',
            a: 'Semua transaksi menggunakan QRIS resmi (GoPay, DANA, OVO, ShopeePay, BCA, Mandiri, BRI). Tidak ada perpanjangan otomatis atau tagihan tersembunyi; Anda hanya membayar ketika memutuskan untuk membeli.',
        },
        {
            q: 'Bagaimana cara kerja Paket Tim?',
            a: 'Paket Tim mengaktifkan 200 kredit AI bersama yang bisa dipakai seluruh anggota tim Anda untuk living proposal dan konsultasi lomba selama 3 bulan penuh.',
        },
    ];

    const selectedTeamName = myTeams.find((t) => String(t.id) === String(selectedTeamId))?.name;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SeoHead
                title="Paket & Biaya — Investasi Prestasi Mahasiswa RAKIT Campus"
                description="Pilihan akses dan akselerasi kompetisi mahasiswa: Gratis selamanya, AI Pass, dan RAKIT Pro via QRIS."
            />

            <div className="py-10 sm:py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full space-y-12">
                {/* 1. EDITORIAL HEADER */}
                <div className="space-y-3 max-w-2xl">
                    <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                        Paket &amp; Akses Mahasiswa
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900">
                        Investasi Prestasi
                    </h1>
                    <p className="text-sm text-zinc-500">
                        Mulai gratis untuk semua. Tingkatkan saat butuh akselerasi AI.
                    </p>

                    {/* Active Plan Pill Indicator */}
                    {activeSubscription && (
                        <div className="pt-2">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-800 text-xs font-medium">
                                <span className="size-1.5 rounded-full bg-emerald-500" />
                                <span>
                                    Paket Aktif: <strong className="font-semibold">{activeSubscription.plan_type.replace('_', ' ').toUpperCase()}</strong>
                                    {activeSubscription.expires_at &&
                                        ` • Berlaku s/d ${new Date(activeSubscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. PRIMARY INDIVIDUAL PLANS (Asymmetric Product Hierarchy) */}
                <div className="space-y-4">
                    {/* Interactive Pro Cycle Selector */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <span className="text-xs font-medium text-zinc-400">Pilihan Individu</span>
                        <div className="inline-flex items-center p-1 rounded-full bg-zinc-100 border border-zinc-200/70 text-xs">
                            <button
                                type="button"
                                onClick={() => setBillingCycle('semester')}
                                className={`px-3 py-1 rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
                                    billingCycle === 'semester'
                                        ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                                        : 'text-zinc-500 hover:text-zinc-900'
                                }`}
                            >
                                <span>1 Semester</span>
                                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full font-bold">
                                    Hemat 72%
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                                    billingCycle === 'monthly'
                                        ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                                        : 'text-zinc-500 hover:text-zinc-900'
                                }`}
                            >
                                Bulanan
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                        {/* A. FREE BASELINE (Col 1-3 on LG) */}
                        <div className="lg:col-span-3 bg-zinc-50/70 border border-zinc-200/70 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold text-zinc-900">
                                        {freePlan.name}
                                    </h3>
                                    <p className="text-xs text-zinc-400">
                                        {freePlan.tagline}
                                    </p>
                                </div>

                                <div>
                                    <div className="text-2xl font-bold tracking-tight text-zinc-900">
                                        Gratis
                                    </div>
                                    <span className="text-[11px] text-zinc-400 font-mono">tanpa batas waktu</span>
                                </div>

                                <div className="space-y-2 text-xs text-zinc-600 pt-2">
                                    {freePlan.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <Check className="size-3.5 text-zinc-400 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled
                                className="w-full py-2.5 rounded-xl bg-zinc-200/60 text-zinc-400 text-xs font-medium text-center cursor-default"
                            >
                                Paket Standar Aktif
                            </button>
                        </div>

                        {/* B. THE HERO: RAKIT PRO & SEMESTER VALUE (Col 4-8 on LG) */}
                        <div className="lg:col-span-5 bg-white border border-zinc-300 shadow-sm rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6 relative">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-semibold text-zinc-900">
                                                {currentProPlan.name}
                                            </h3>
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-medium">
                                                Flagship
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400">
                                            {currentProPlan.tagline}
                                        </p>
                                    </div>
                                </div>

                                {/* Dynamic Price Display */}
                                <div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-bold tracking-tight text-zinc-900">
                                            {billingCycle === 'semester'
                                                ? formatRupiah(49000)
                                                : formatRupiah(29000)}
                                        </span>
                                        <span className="text-xs text-zinc-400">
                                            {billingCycle === 'semester' ? '/ 6 bulan' : '/ bulan'}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 pt-0.5">
                                        {billingCycle === 'semester'
                                            ? `Setara ${formatRupiah(Math.round(semesterPlan.price / 6))} / bulan • Akses 1 semester penuh`
                                            : 'Dapat dibatalkan sewaktu-waktu tanpa komitmen'}
                                    </p>
                                </div>

                                {/* Feature list */}
                                <div className="space-y-2.5 text-xs text-zinc-700 pt-2">
                                    {currentProPlan.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-start gap-2.5">
                                            <div className="size-4 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                                                <Check className="size-2.5 stroke-[3]" />
                                            </div>
                                            <span className="font-medium text-zinc-800">{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={isSubmitting || (activeSubscription?.plan_type === currentProPlan.id)}
                                onClick={() => handleSelectPlan(currentProPlan)}
                                className={`w-full py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer text-center ${
                                    activeSubscription?.plan_type === currentProPlan.id
                                        ? 'bg-zinc-100 text-zinc-500 cursor-default'
                                        : 'bg-zinc-900 hover:bg-black text-white'
                                }`}
                            >
                                {activeSubscription?.plan_type === currentProPlan.id
                                    ? 'Paket Sedang Aktif'
                                    : `${currentProPlan.cta || 'Pilih Paket'} (${formatRupiah(currentProPlan.price)})`}
                            </button>
                        </div>

                        {/* C. AI PASS: DISTINCT ON-DEMAND BOOSTER (Col 9-12 on LG) */}
                        <div className="lg:col-span-4 bg-zinc-50/70 border border-zinc-200/80 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                                        Booster Sekali Bayar
                                    </span>
                                    <h3 className="text-base font-semibold text-zinc-900">
                                        {aiPassPlan.name}
                                    </h3>
                                    <p className="text-xs text-zinc-400">
                                        {aiPassPlan.tagline}
                                    </p>
                                </div>

                                <div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-bold tracking-tight text-zinc-900">
                                            {formatRupiah(aiPassPlan.price)}
                                        </span>
                                        <span className="text-xs text-zinc-400">sekali bayar</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-500 pt-0.5">
                                        Masa aktif 30 hari • Tanpa langganan rutin
                                    </p>
                                </div>

                                <div className="space-y-2 text-xs text-zinc-600 pt-2">
                                    {aiPassPlan.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <Check className="size-3.5 text-zinc-500 shrink-0 mt-0.5" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={isSubmitting || activeSubscription?.plan_type === 'ai_pass'}
                                onClick={() => handleSelectPlan(aiPassPlan)}
                                className={`w-full py-2.5 rounded-xl border border-zinc-300 hover:border-zinc-400 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-medium transition-colors cursor-pointer text-center ${
                                    activeSubscription?.plan_type === 'ai_pass' ? 'bg-zinc-100 text-zinc-400' : ''
                                }`}
                            >
                                {activeSubscription?.plan_type === 'ai_pass' ? 'AI Pass Aktif' : 'Beli AI Pass'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. INTEGRATED TEAM SECTION */}
                {teamPlan && (
                    <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            <div className="lg:col-span-7 space-y-3">
                                <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                                    Kolaborasi Tim Lomba
                                </span>
                                <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">
                                    {teamPlan.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-zinc-500 max-w-lg leading-relaxed">
                                    Satu paket kuota dan fitur bersama untuk seluruh anggota dalam 1 tim kompetisi.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-zinc-600">
                                    {teamPlan.features.map((feat, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <Check className="size-3.5 text-zinc-500 shrink-0" />
                                            <span>{feat}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-5 flex flex-col sm:items-end justify-center space-y-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                                <div className="sm:text-right">
                                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                                        {formatRupiah(teamPlan.price)}
                                    </div>
                                    <span className="text-xs text-zinc-400">
                                        {teamPlan.price > 0 ? `Hanya ${formatRupiah(Math.round(teamPlan.price / 3))}/bln untuk 1 tim (3 bln)` : 'Akses 1 Tim Lomba'}
                                    </span>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                    {myTeams && myTeams.length > 0 && (
                                        <select
                                            value={selectedTeamId}
                                            onChange={(e) => setSelectedTeamId(e.target.value)}
                                            className="bg-zinc-50 border border-zinc-200 text-zinc-800 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-zinc-400"
                                        >
                                            {myTeams.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => handleSelectPlan(teamPlan)}
                                        className="px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors cursor-pointer text-center"
                                    >
                                        Beli untuk {selectedTeamName || 'Tim'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. ORDER HISTORY (Clean Inset Table) */}
                {user && myOrders && myOrders.length > 0 && (
                    <div className="space-y-3 pt-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-zinc-900">
                                Riwayat Transaksi Anda
                            </h3>
                            <span className="text-xs text-zinc-400">{myOrders.length} transaksi</span>
                        </div>

                        <div className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-zinc-50/70 text-zinc-500 font-medium border-b border-zinc-100">
                                        <tr>
                                            <th className="py-2.5 px-4 font-mono">No. Pesanan</th>
                                            <th className="py-2.5 px-4">Paket</th>
                                            <th className="py-2.5 px-4">Nominal</th>
                                            <th className="py-2.5 px-4">Status</th>
                                            <th className="py-2.5 px-4">Tanggal</th>
                                            <th className="py-2.5 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {myOrders.map((ord) => (
                                            <tr key={ord.id} className="hover:bg-zinc-50/50 transition-colors">
                                                <td className="py-2.5 px-4 font-mono text-zinc-800">
                                                    {ord.order_number}
                                                </td>
                                                <td className="py-2.5 px-4 font-medium text-zinc-900">
                                                    {ord.plan_label || ord.plan_type.replace('_', ' ').toUpperCase()}
                                                </td>
                                                <td className="py-2.5 px-4 text-zinc-800">
                                                    {formatRupiah(ord.amount)}
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <span className={`inline-flex items-center gap-1 font-medium ${
                                                        ord.status === 'paid' ? 'text-emerald-600' :
                                                        ord.status === 'pending' ? 'text-amber-600' : 'text-zinc-400'
                                                    }`}>
                                                        <span className={`size-1.5 rounded-full ${
                                                            ord.status === 'paid' ? 'bg-emerald-500' :
                                                            ord.status === 'pending' ? 'bg-amber-500' : 'bg-zinc-400'
                                                        }`} />
                                                        <span>
                                                            {ord.status === 'paid' ? 'Lunas' :
                                                             ord.status === 'pending' ? 'Menunggu' :
                                                             ord.status === 'expired' ? 'Kedaluwarsa' : 'Gagal'}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-4 text-zinc-400">
                                                    {ord.created_at}
                                                </td>
                                                <td className="py-2.5 px-4 text-right">
                                                    <Link
                                                        href={`/billing/status/${ord.order_number}`}
                                                        className="text-xs text-zinc-600 hover:text-zinc-900 font-medium transition-colors"
                                                    >
                                                        {ord.status === 'pending' ? 'Bayar →' : 'Lihat →'}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. INTERACTIVE FAQ ACCORDION */}
                <div className="space-y-4 pt-4 max-w-2xl">
                    <h3 className="text-sm font-semibold text-zinc-900">
                        Pertanyaan Umum
                    </h3>

                    <div className="divide-y divide-zinc-200/70 border-t border-b border-zinc-200/70">
                        {faqItems.map((faq, idx) => {
                            const isOpen = openFaqIndex === idx;
                            return (
                                <div key={idx} className="py-3.5">
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                        className="w-full flex justify-between items-center text-left text-xs font-semibold text-zinc-800 hover:text-zinc-900 cursor-pointer gap-4"
                                    >
                                        <span>{faq.q}</span>
                                        <ChevronDown
                                            className={`size-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                                                isOpen ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <p className="text-xs text-zinc-500 mt-2 leading-relaxed animate-in fade-in duration-150">
                                            {faq.a}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* FLOATING ERROR TOAST */}
            {checkoutError && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-zinc-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="size-4 text-rose-400 shrink-0" />
                        <span>{checkoutError}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCheckoutError(null)}
                        className="text-zinc-400 hover:text-white cursor-pointer shrink-0"
                    >
                        <X className="size-3.5" />
                    </button>
                </div>
            )}

            {/* MINIMAL CHECKOUT BOTTOM SHEET MODAL */}
            {isCheckoutOpen && createdOrder && checkoutPlan && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-xl border border-zinc-200/80 relative space-y-4 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                        <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

                        <button
                            type="button"
                            onClick={() => setIsCheckoutOpen(false)}
                            className="absolute top-4 right-4 size-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition cursor-pointer"
                        >
                            <X className="size-3.5" />
                        </button>

                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-semibold text-zinc-900 tracking-tight">
                                Pembayaran {checkoutPlan.name}
                            </h3>
                            <div className="text-2xl font-bold text-zinc-900">
                                {formatRupiah(createdOrder.amount)}
                            </div>
                        </div>

                        {/* QR Code Container */}
                        <div className="space-y-2 text-center">
                            {createdOrder.qr_string ? (
                                <div className="size-48 mx-auto bg-white rounded-2xl p-2.5 border border-zinc-200/80 shadow-2xs flex items-center justify-center">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(createdOrder.qr_string)}&size=200x200&margin=4`}
                                        alt="QRIS"
                                        className="size-full object-contain rounded-lg"
                                    />
                                </div>
                            ) : (
                                <div className="size-44 mx-auto bg-zinc-50 rounded-2xl border border-zinc-200/80 flex items-center justify-center text-xs text-zinc-400">
                                    Menyiapkan QRIS...
                                </div>
                            )}

                            <p className="text-[11px] text-zinc-400">
                                Pindai QRIS dengan GoPay, OVO, DANA, BCA, atau mobile banking apa saja
                            </p>
                        </div>

                        <div className="space-y-2 pt-1">
                            {createdOrder.checkout_url && (
                                <a
                                    href={createdOrder.checkout_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <span>Buka Kasera Pay</span>
                                    <ExternalLink className="size-3.5" />
                                </a>
                            )}

                            <Link
                                href={`/billing/status/${createdOrder.order_number}`}
                                className="w-full py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                            >
                                <span>Lihat Status Transaksi</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
