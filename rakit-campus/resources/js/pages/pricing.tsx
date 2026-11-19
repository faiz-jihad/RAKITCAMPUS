import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    CheckCircle2,
    Crown,
    ExternalLink,
    HelpCircle,
    QrCode,
    Sparkles,
    Trophy,
    Users,
    X,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';

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
}

interface OrderItem {
    id: number;
    order_number: string;
    plan_type: string;
    amount: number;
    status: string;
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
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Harga & Langganan', href: '/pricing' },
];

export default function PricingPage({ plans, activeSubscription, myOrders, myTeams }: Props) {
    const { auth } = usePage().props as any;
    const user = auth?.user;

    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<number | string>(myTeams?.[0]?.id || '');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [createdOrder, setCreatedOrder] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const handleSelectPlan = async (plan: Plan) => {
        if (plan.id === 'free') return;

        if (!user) {
            router.get('/login');
            return;
        }

        setSelectedPlan(plan);
        setIsSubmitting(true);

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
                setCreatedOrder(data.order);
                setIsCheckoutOpen(true);
            } else {
                alert(data.message || 'Gagal memulai checkout.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paket & Biaya Mahasiswa — RAKIT Campus" />

            <div className="py-8 sm:py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-10 sm:space-y-14">
                {/* Header Section */}
                <div className="text-center max-w-3xl mx-auto space-y-3.5">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-bold tracking-tight shadow-2xs">
                        <Sparkles className="size-3.5 text-blue-600" />
                        <span>Monetize Acceleration, Not Access</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                        Investasi Terjangkau untuk Prestasi Nyata
                    </h1>

                    <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
                        Akses eksplorasi kompetisi, pembentukan tim, dan kolaborasi dasar tetap <strong>100% gratis</strong>. Upgrade saat Anda butuh booster AI untuk proposal, review juri, dan portofolio resmi.
                    </p>

                    {/* Active Subscription Banner */}
                    {activeSubscription && (
                        <div className="mt-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                            <span>
                                Anda sedang menggunakan paket aktif: <strong>{activeSubscription.plan_type.replace('_', ' ').toUpperCase()}</strong>
                                {activeSubscription.expires_at ? ` (Aktif s/d ${new Date(activeSubscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})` : ' (Aktif)'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Plans Grid (Apple iOS Bento Style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
                    {plans.slice(0, 4).map((plan) => {
                        const isCurrentActive = activeSubscription?.plan_type === plan.id;

                        return (
                            <div
                                key={plan.id}
                                className={`rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between relative ${
                                    plan.is_featured
                                        ? 'bg-white border-2 border-blue-600 shadow-[0_8px_32px_rgba(37,99,235,0.12)] ring-4 ring-blue-500/10'
                                        : 'bg-white border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-lg hover:border-slate-300'
                                }`}
                            >
                                {/* Top Badge */}
                                {plan.badge && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-tight bg-blue-600 text-white shadow-md uppercase">
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                            {plan.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 min-h-[32px] leading-relaxed">
                                            {plan.tagline}
                                        </p>
                                    </div>

                                    {/* Price Tag */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                                {plan.price === 0 ? 'Gratis' : formatRupiah(plan.price)}
                                            </span>
                                            {plan.price > 0 && (
                                                <span className="text-xs font-semibold text-slate-400">
                                                    /{plan.period}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Features List */}
                                    <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                                        {plan.features.map((feat, idx) => (
                                            <div key={idx} className="flex items-start gap-2.5 text-slate-700">
                                                <div className="size-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Check className="size-2.5 stroke-[3]" />
                                                </div>
                                                <span className="leading-snug">{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action CTA Button */}
                                <div className="pt-6 mt-6 border-t border-slate-100">
                                    {plan.price === 0 ? (
                                        <button
                                            type="button"
                                            disabled
                                            className="w-full py-2.5 rounded-full bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed text-center"
                                        >
                                            Paket Standar Aktif
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={isSubmitting || isCurrentActive}
                                            onClick={() => handleSelectPlan(plan)}
                                            className={`w-full py-2.5 rounded-full text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                                                isCurrentActive
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                                    : plan.is_featured
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-98'
                                                    : 'bg-slate-900 hover:bg-black text-white active:scale-98'
                                            }`}
                                        >
                                            <span>{isCurrentActive ? 'Paket Sedang Aktif' : plan.cta}</span>
                                            {!isCurrentActive && <ArrowRight className="size-3" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Team Pass Highlight Banner */}
                {plans.length > 4 && (
                    <div className="rounded-[28px] sm:rounded-[32px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
                        <div className="space-y-2 max-w-xl text-center md:text-left">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-wider">
                                <Users className="size-3.5 text-amber-400" />
                                <span>Paket Bersama 1 Tim</span>
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                                RAKIT Team — Rp 99.000 / tim
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                                Shared pool 200 Kredit AI untuk seluruh anggota tim, Living Proposal AI bersama, dan fitur analitik progres proyek tim hingga masa kompetisi berakhir.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
                            {myTeams && myTeams.length > 0 && (
                                <select
                                    value={selectedTeamId}
                                    onChange={(e) => setSelectedTeamId(e.target.value)}
                                    className="bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:bg-white/20"
                                >
                                    {myTeams.map((t) => (
                                        <option key={t.id} value={t.id} className="text-slate-900">
                                            {t.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <button
                                type="button"
                                onClick={() => handleSelectPlan(plans[4])}
                                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-xs font-black shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <span>Aktifkan untuk Tim</span>
                                <ArrowRight className="size-3.5 text-slate-900" />
                            </button>
                        </div>
                    </div>
                )}

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto space-y-6 pt-6">
                    <div className="text-center">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Pertanyaan Umum (FAQ)
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Semua hal yang perlu Anda ketahui tentang sistem berlangganan di RAKIT
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <HelpCircle className="size-4 text-blue-600 shrink-0" />
                                <span>Apakah saya bisa tetap ikut lomba tanpa membayar?</span>
                            </h4>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                <strong>Ya, tentu saja!</strong> Eksplorasi ribuan kompetisi, mencari teman tim dengan role Hacker/Hipster/Hustler, serta ruang kerja task kanban tetap 100% gratis selamanya.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <HelpCircle className="size-4 text-blue-600 shrink-0" />
                                <span>Metode pembayaran apa saja yang didukung?</span>
                            </h4>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                Kami mendukung <strong>QRIS instan</strong> yang bisa discan menggunakan semua e-wallet (GoPay, DANA, OVO, ShopeePay, LinkAja) serta mobile banking (BCA, Mandiri, BRI, BNI). Tanpa perlu kartu kredit!
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
                            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <HelpCircle className="size-4 text-blue-600 shrink-0" />
                                <span>Apakah ada perpanjangan otomatis (autodebit)?</span>
                            </h4>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                <strong>Tidak ada.</strong> Semua pembayaran di RAKIT menggunakan sistem bayar di muka (*one-time charge*). Anda tidak akan pernah ditagih diam-diam tanpa persetujuan.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* QRIS CHECKOUT MODAL */}
            {isCheckoutOpen && createdOrder && selectedPlan && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setIsCheckoutOpen(false)}
                            className="absolute top-5 right-5 size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="text-center space-y-1">
                            <div className="size-12 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-600 mx-auto flex items-center justify-center mb-2 shadow-2xs">
                                <QrCode className="size-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                Pembayaran QRIS Instan
                            </h3>
                            <p className="text-xs text-slate-500">
                                Order ID: <span className="font-mono font-bold text-slate-700">{createdOrder.order_number}</span>
                            </p>
                        </div>

                        {/* Order Summary Card */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Paket Pilihan:</span>
                                <span className="font-bold text-slate-900">{selectedPlan.name}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-600">
                                <span>Periode:</span>
                                <span className="font-medium text-slate-800">{selectedPlan.period}</span>
                            </div>
                            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                                <span className="font-bold text-slate-900">Total Tagihan:</span>
                                <span className="font-black text-blue-600 text-base">{formatRupiah(createdOrder.amount)}</span>
                            </div>
                        </div>

                        {/* QRIS Display Mockup */}
                        <div className="bg-white rounded-2xl p-5 border-2 border-dashed border-slate-200 text-center space-y-3">
                            <div className="size-44 mx-auto bg-slate-100 rounded-xl p-2 border border-slate-200 flex items-center justify-center">
                                {/* Simulated QRIS Graphic */}
                                <div className="relative size-full bg-white rounded-lg p-2 flex flex-col items-center justify-center">
                                    <QrCode className="size-32 text-slate-900" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                                            R
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight">
                                Scan QRIS menggunakan GoPay, DANA, OVO, ShopeePay, atau Mobile Banking
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-1">
                            <a
                                href={`/billing/simulate/${createdOrder.id}`}
                                className="w-full py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <CheckCircle2 className="size-4" />
                                <span>Simulasikan Pembayaran Berhasil (Scan QRIS)</span>
                            </a>

                            <button
                                type="button"
                                onClick={() => setIsCheckoutOpen(false)}
                                className="w-full py-2.5 rounded-full text-slate-500 hover:text-slate-800 text-xs font-semibold text-center transition"
                            >
                                Batalkan Transaksi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
