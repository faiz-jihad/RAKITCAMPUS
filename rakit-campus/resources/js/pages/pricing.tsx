import SeoHead from '@/components/seo/SeoHead';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    CheckCircle2,
    Crown,
    HelpCircle,
    PartyPopper,
    QrCode,
    ShieldCheck,
    Sparkles,
    Trophy,
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
    const { auth, flash } = usePage().props as any;
    const user = auth?.user;

    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<number | string>(myTeams?.[0]?.id || '');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [createdOrder, setCreatedOrder] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
    const [activatedPlanInfo, setActivatedPlanInfo] = useState<any>(null);

    useEffect(() => {
        if (
            flash?.payment_success ||
            flash?.activated_order ||
            (flash?.success && String(flash.success).includes('Pembayaran berhasil'))
        ) {
            setActivatedPlanInfo(
                flash?.activated_order || {
                    plan_name: activeSubscription?.plan_type
                        ? activeSubscription.plan_type.replace('_', ' ').toUpperCase()
                        : 'RAKIT Pro',
                    bonus_credits: activeSubscription?.ai_credits_bonus || 100,
                    order_number: myOrders?.[0]?.order_number || 'RKT-SUCCESS',
                }
            );
            setIsCelebrationOpen(true);
        }
    }, [flash, activeSubscription]);

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
            <SeoHead
                title="Paket & Biaya Mahasiswa — Investasi Terjangkau untuk Prestasi Nyata"
                description="Pilihan paket berlangganan RAKIT Campus untuk mahasiswa dan tim: Akses eksplorasi kompetisi gratis selamanya, AI Pass, RAKIT Pro, dan Paket Tim dengan QRIS instan tanpa kartu kredit."
                keywords="harga rakit campus, langganan rakit pro, kuota ai mahasiswa, paket tim kompetisi, rakit campus"
                canonicalUrl="https://rakitcampus.my.id/pricing"
            />

            <div className="py-8 sm:py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-10 sm:space-y-14">
                {/* Header Section: Clean Apple iOS & Less Text */}
                <div className="text-center max-w-xl mx-auto space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold tracking-wide">
                        <Sparkles className="size-3 text-blue-600" />
                        <span>Paket Mahasiswa</span>
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
                        Investasi Prestasi
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        Mulai gratis untuk semua. Tingkatkan saat butuh akselerasi AI.
                    </p>

                    {/* Active Subscription Banner */}
                    {activeSubscription && (
                        <div className="mt-4 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
                            <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                            <span>
                                Paket Aktif: <strong>{activeSubscription.plan_type.replace('_', ' ').toUpperCase()}</strong>
                                {activeSubscription.expires_at ? ` (s/d ${new Date(activeSubscription.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })})` : ' (Aktif)'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Plans Grid (Apple iOS Bento Style) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
                    {plans.slice(0, 4).map((plan) => {
                        const isCurrentActive = activeSubscription?.plan_type === plan.id;

                        // Clean concise period formatting
                        let periodLabel = '';
                        if (plan.price > 0) {
                            if (String(plan.period).includes('6 bulan') || plan.id === 'semester_pass') {
                                periodLabel = '/6 bln';
                            } else if (String(plan.period).includes('bulan')) {
                                periodLabel = '/bln';
                            } else if (String(plan.period).toLowerCase().includes('sekali')) {
                                periodLabel = 'sekali bayar';
                            } else {
                                periodLabel = `/${plan.period}`;
                            }
                        }

                        // Max 4 high-impact bullets for clean aesthetic
                        const featuresList = (Array.isArray(plan.features) ? plan.features : []).slice(0, 4);

                        return (
                            <div
                                key={plan.id}
                                className={`rounded-[32px] p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between relative ${
                                    plan.is_featured
                                        ? 'bg-white border-2 border-blue-600 shadow-[0_8px_32px_rgba(37,99,235,0.12)] ring-4 ring-blue-500/10'
                                        : 'bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-slate-300'
                                }`}
                            >
                                <div className="space-y-4">
                                    {/* Header Row: Title & Badge */}
                                    <div className="flex items-center justify-between gap-1.5 min-h-[26px]">
                                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                            {plan.name}
                                        </h3>
                                        {plan.badge && (
                                            <span
                                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                                    plan.is_featured
                                                        ? 'bg-blue-600 text-white shadow-2xs'
                                                        : 'bg-amber-50 text-amber-800 border border-amber-200/70'
                                                }`}
                                            >
                                                {plan.badge}
                                            </span>
                                        )}
                                    </div>

                                    {/* Micro Tagline */}
                                    {plan.tagline && (
                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                            {plan.tagline}
                                        </p>
                                    )}

                                    {/* Price Tag */}
                                    <div className="pt-2 pb-1 border-t border-slate-100">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                                {plan.price === 0 ? 'Gratis' : formatRupiah(plan.price)}
                                            </span>
                                            {periodLabel && (
                                                <span className="text-xs font-semibold text-slate-400">
                                                    {periodLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bite-sized Features List */}
                                    <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
                                        {featuresList.map((feat, idx) => (
                                            <div key={idx} className="flex items-center gap-2.5 text-slate-700">
                                                <div
                                                    className={`size-4 rounded-full flex items-center justify-center shrink-0 ${
                                                        plan.is_featured
                                                            ? 'bg-blue-50 text-blue-600'
                                                            : 'bg-emerald-50 text-emerald-600'
                                                    }`}
                                                >
                                                    <Check className="size-2.5 stroke-[3]" />
                                                </div>
                                                <span className="leading-snug text-xs font-medium text-slate-700">
                                                    {feat}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action CTA Button: iOS Capsule */}
                                <div className="pt-6 mt-4 border-t border-slate-100">
                                    {plan.price === 0 ? (
                                        <button
                                            type="button"
                                            disabled
                                            className="w-full py-3 rounded-full bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed text-center"
                                        >
                                            Paket Standar Aktif
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled={isSubmitting || isCurrentActive}
                                            onClick={() => handleSelectPlan(plan)}
                                            className={`w-full py-3 rounded-full text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
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

                {/* Team Pass Highlight Banner: Apple Pro Dark Bento */}
                {plans.length > 4 && (
                    <div className="rounded-[32px] p-6 sm:p-8 bg-slate-900 text-white border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                        <div className="space-y-2.5 max-w-xl text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                <span className="text-[10px] font-black text-slate-900 bg-amber-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    1 Tim Lomba
                                </span>
                                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                    RAKIT Team
                                </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                                Shared pool 200 Kredit AI dan Living Proposal terintegrasi untuk seluruh anggota tim lomba.
                            </p>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1 text-xs text-slate-300">
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs font-medium">
                                    <Check className="size-3 text-amber-400 shrink-0" />
                                    <span>200 Kredit AI Bersama</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs font-medium">
                                    <Check className="size-3 text-amber-400 shrink-0" />
                                    <span>Living Proposal AI</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 text-xs font-medium">
                                    <Check className="size-3 text-amber-400 shrink-0" />
                                    <span>Prioritas Lomba</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col items-center md:items-end gap-3 shrink-0 w-full md:w-auto">
                            <div className="text-center md:text-right">
                                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                    Rp 99.000 <span className="text-xs text-slate-400 font-normal">/tim (3 bln)</span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-medium">Hanya Rp 33.000/bln untuk 1 tim</span>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {myTeams && myTeams.length > 0 && (
                                    <select
                                        value={selectedTeamId}
                                        onChange={(e) => setSelectedTeamId(e.target.value)}
                                        className="bg-white/10 border border-white/20 text-white rounded-full px-3 py-2.5 text-xs font-semibold focus:outline-none focus:bg-white/20"
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
                                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                                >
                                    <span>Beli untuk Tim</span>
                                    <ArrowRight className="size-3.5 text-slate-900" />
                                </button>
                            </div>
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

            {/* CELEBRATION SUCCESS POP-UP CARD (Apple iOS Style Animation) */}
            {isCelebrationOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
                    <div className="relative max-w-md w-full">
                        {/* Confetti Particles (Floating Animation Effect) */}
                        <div className="absolute -top-12 -left-8 size-4 rounded-full bg-blue-500/80 blur-[0.5px] animate-bounce duration-700 pointer-events-none" />
                        <div className="absolute -top-8 -right-6 size-3.5 rounded-full bg-amber-400/90 blur-[0.5px] animate-pulse duration-500 pointer-events-none" />
                        <div className="absolute top-1/2 -left-10 size-3 rounded-full bg-emerald-400/80 animate-ping duration-1000 pointer-events-none" />
                        <div className="absolute top-1/3 -right-12 size-4 rounded-full bg-purple-500/80 blur-[0.5px] animate-bounce duration-1000 pointer-events-none" />
                        <div className="absolute -bottom-6 -left-6 size-3.5 rounded-full bg-rose-400/80 animate-pulse duration-700 pointer-events-none" />
                        <div className="absolute -bottom-8 -right-8 size-4 rounded-full bg-indigo-500/80 animate-bounce duration-500 pointer-events-none" />

                        {/* Pop-up Card */}
                        <div className="bg-white rounded-[36px] p-7 sm:p-8 shadow-[0_24px_70px_rgba(0,0,0,0.3)] border border-slate-200/90 relative text-center space-y-6 overflow-hidden animate-in zoom-in-95 duration-300">
                            {/* Close Button */}
                            <button
                                type="button"
                                onClick={() => setIsCelebrationOpen(false)}
                                className="absolute top-5 right-5 size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer z-10"
                            >
                                <X className="size-4" />
                            </button>

                            {/* Ambient Top Glow */}
                            <div className="absolute -top-24 left-1/2 -translate-x-1/2 size-48 bg-gradient-to-b from-blue-400/20 to-transparent rounded-full blur-2xl pointer-events-none" />

                            {/* Squircle Celebration Icon */}
                            <div className="relative pt-2">
                                <div className="size-20 sm:size-22 rounded-[28px] bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30 ring-8 ring-blue-500/10 mx-auto transition-transform hover:scale-105 duration-300">
                                    <Sparkles className="size-10 sm:size-11 text-amber-300 animate-pulse" />
                                </div>
                                <div className="absolute bottom-0 right-1/2 translate-x-10 size-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-md">
                                    <Check className="size-4 stroke-[3]" />
                                </div>
                            </div>

                            {/* Header Information */}
                            <div className="space-y-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-black tracking-wider uppercase shadow-2xs">
                                    <CheckCircle2 className="size-3 text-emerald-600" />
                                    <span>PEMBAYARAN TERKONFIRMASI</span>
                                </span>

                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                                    Selamat! {activatedPlanInfo?.plan_name || 'RAKIT Pro'} Aktif
                                </h3>

                                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                                    Hak akses prioritas dan booster AI telah aktif seketika pada akun Anda.
                                </p>
                            </div>

                            {/* Unlocked Benefits Bento */}
                            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 text-left space-y-2.5">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Manfaat yang Terbuka:
                                </div>
                                <div className="grid grid-cols-1 gap-2 text-xs">
                                    <div className="flex items-center gap-2.5 text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                                        <div className="size-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <Zap className="size-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="font-bold text-slate-900">+{activatedPlanInfo?.bonus_credits || 100} Sesi AI Ekstra</span>
                                            <p className="text-[10px] text-slate-400">Langsung aktif di AI Workspace</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                                        <div className="size-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                            <Crown className="size-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="font-bold text-slate-900">Badge PRO Resmi</span>
                                            <p className="text-[10px] text-slate-400">Terpasang di profil &amp; portofolio Anda</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                                        <div className="size-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                            <ShieldCheck className="size-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="font-bold text-slate-900">Fitur Living Proposal &amp; ATS</span>
                                            <p className="text-[10px] text-slate-400">Analisis proposal &amp; ekspor PDF terbuka</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Order Ref */}
                            {activatedPlanInfo?.order_number && (
                                <p className="text-[10px] text-slate-400 font-mono">
                                    ID Transaksi: {activatedPlanInfo.order_number}
                                </p>
                            )}

                            {/* Call to Actions */}
                            <div className="space-y-2 pt-1">
                                <Link
                                    href="/ai-workspace"
                                    className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
                                >
                                    <span>Buka AI Workspace Sekarang</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setIsCelebrationOpen(false)}
                                    className="w-full py-2.5 rounded-full text-slate-500 hover:text-slate-800 text-xs font-semibold text-center transition"
                                >
                                    Selesai &amp; Tetap di Halaman Ini
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
