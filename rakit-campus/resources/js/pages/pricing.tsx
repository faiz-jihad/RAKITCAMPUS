import SeoHead from '@/components/seo/SeoHead';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    Crown,
    ExternalLink,
    HelpCircle,
    PartyPopper,
    QrCode,
    Receipt,
    RefreshCw,
    ShieldAlert,
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
    { title: 'Harga & Langganan', href: '/pricing' },
];

export default function PricingPage({
    plans,
    activeSubscription,
    myOrders = [],
    myTeams = [],
    gatewayConfigured = true,
    gatewayEnvironment = 'sandbox',
}: Props) {
    const { auth, flash } = usePage().props as any;
    const user = auth?.user;

    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [selectedTeamId, setSelectedTeamId] = useState<number | string>(myTeams?.[0]?.id || '');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [createdOrder, setCreatedOrder] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [modalCopied, setModalCopied] = useState(false);
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
                setCheckoutError(data.message || 'Gagal memulai sesi pembayaran. Silakan coba kembali.');
            }
        } catch {
            setCheckoutError('Terjadi gangguan koneksi jaringan. Silakan periksa koneksi internet Anda.');
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

                {/* RIWAYAT TRANSAKSI & PEMBAYARAN */}
                {user && myOrders && myOrders.length > 0 && (
                    <div className="max-w-4xl mx-auto space-y-4 pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                    <Receipt className="size-5 text-blue-600" />
                                    <span>Riwayat Transaksi &amp; Langganan</span>
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Daftar pesanan dan riwayat pembayaran resmi Anda melalui Kasera Pay Gateway.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th className="py-3 px-4">No. Pesanan</th>
                                            <th className="py-3 px-4">Paket</th>
                                            <th className="py-3 px-4">Nominal</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Tanggal</th>
                                            <th className="py-3 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {myOrders.map((ord) => (
                                            <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                                                <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                                    {ord.order_number}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-900">
                                                    {ord.plan_label || ord.plan_type.replace('_', ' ').toUpperCase()}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-900">
                                                    {formatRupiah(ord.amount)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {ord.status === 'paid' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                                            <CheckCircle2 className="size-3" />
                                                            Berhasil
                                                        </span>
                                                    )}
                                                    {ord.status === 'pending' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                                            <Clock className="size-3" />
                                                            Menunggu
                                                        </span>
                                                    )}
                                                    {ord.status === 'expired' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                                            Kedaluwarsa
                                                        </span>
                                                    )}
                                                    {(ord.status === 'failed' || ord.status === 'cancelled') && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                                            Gagal
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                    {ord.created_at}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <Link
                                                        href={`/billing/status/${ord.order_number}`}
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold transition shadow-2xs ${
                                                            ord.status === 'pending'
                                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                                        }`}
                                                    >
                                                        <span>{ord.status === 'pending' ? 'Bayar / Cek' : 'Rincian'}</span>
                                                        <ArrowRight className="size-3" />
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
            </div>

            {/* FLOATING IOS TOAST ERROR NOTIFICATION */}
            {checkoutError && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] bg-[#1D1D1F]/95 backdrop-blur-xl text-white px-5 py-4 rounded-[24px] shadow-2xl border border-white/10 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                            <ShieldAlert className="size-4" />
                        </div>
                        <p className="text-xs font-medium text-slate-200 leading-snug">
                            {checkoutError}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCheckoutError(null)}
                        className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer shrink-0"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {/* KASERA PAY CHECKOUT MODAL (Apple iOS Sheet Style) */}
            {isCheckoutOpen && createdOrder && selectedPlan && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-6 sm:p-7 shadow-xl border border-zinc-200/80 relative space-y-4 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
                        {/* iOS Sheet Grabber on Mobile */}
                        <div className="w-10 h-1 bg-zinc-300 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setIsCheckoutOpen(false)}
                            className="absolute top-4 right-4 size-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition cursor-pointer"
                        >
                            <X className="size-3.5" />
                        </button>

                        <div className="text-center space-y-1">
                            <h3 className="text-lg font-semibold text-zinc-900 tracking-tight">
                                Pembayaran {selectedPlan.name}
                            </h3>
                            <div className="text-2xl font-bold text-zinc-900">
                                {formatRupiah(createdOrder.amount)}
                            </div>
                        </div>

                        {/* QRIS Display */}
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
                                Pindai dengan aplikasi pembayaran apa saja
                            </p>
                        </div>

                        {/* Actions */}
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

            {/* CELEBRATION SUCCESS POP-UP */}
            {isCelebrationOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 shadow-xl border border-zinc-200/80 relative text-center space-y-5 animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setIsCelebrationOpen(false)}
                            className="absolute top-4 right-4 size-7 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-500 flex items-center justify-center transition cursor-pointer"
                        >
                            <X className="size-3.5" />
                        </button>

                        <div className="size-14 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto">
                            <Check className="size-7 stroke-[2.5]" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">
                                {activatedPlanInfo?.plan_name || 'Paket'} Aktif
                            </h3>
                            <p className="text-xs text-zinc-500">
                                +{activatedPlanInfo?.bonus_credits || 100} kredit AI telah ditambahkan ke akun Anda.
                            </p>
                        </div>

                        <div className="space-y-2 pt-1">
                            <Link
                                href="/ai-workspace"
                                className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                            >
                                <span>Buka AI Workspace</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => setIsCelebrationOpen(false)}
                                className="w-full py-2 text-zinc-500 hover:text-zinc-800 text-xs font-medium text-center transition"
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
