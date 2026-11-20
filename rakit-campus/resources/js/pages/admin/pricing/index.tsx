import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Check,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Edit3,
    ExternalLink,
    Plus,
    Receipt,
    RefreshCw,
    RotateCcw,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Star,
    Trash2,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface PricingPlanData {
    id: number;
    slug: string;
    name: string;
    price: number;
    period: string;
    tagline: string | null;
    badge: string | null;
    is_featured: boolean;
    is_active: boolean;
    features: string[] | null;
    cta_text: string;
    ai_credits_bonus: number;
    sort_order: number;
}

interface OrderItem {
    id: number;
    order_number: string;
    user_name: string;
    user_email?: string | null;
    plan_type: string;
    plan_label?: string;
    amount: number;
    status: string;
    provider: string;
    provider_transaction_id?: string | null;
    payment_method: string;
    paid_at?: string | null;
    created_at: string;
}

interface OrderStats {
    total_volume: number;
    paid_count: number;
    pending_count: number;
}

interface GatewayStatus {
    is_configured: boolean;
    is_live: boolean;
    environment: string;
    base_url: string;
}

interface Props {
    plans: PricingPlanData[];
    recentOrders?: OrderItem[];
    orderStats?: OrderStats;
    gatewayStatus?: GatewayStatus;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ruang Kerja Admin', href: '/admin' },
    { title: 'Kelola Paket Harga', href: '/admin/pricing' },
];

export default function AdminPricingIndex({
    plans,
    recentOrders = [],
    orderStats = { total_volume: 0, paid_count: 0, pending_count: 0 },
    gatewayStatus = { is_configured: false, is_live: false, environment: 'sandbox', base_url: 'https://pay.kasera.id' },
}: Props) {
    const [editingPlan, setEditingPlan] = useState<PricingPlanData | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state for editing
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        price: 0,
        period: '',
        tagline: '',
        badge: '',
        is_featured: false,
        is_active: true,
        features: '',
        cta_text: '',
        ai_credits_bonus: 0,
        sort_order: 1,
    });

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const handleOpenEdit = (plan: PricingPlanData) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            slug: plan.slug,
            price: plan.price,
            period: plan.period,
            tagline: plan.tagline || '',
            badge: plan.badge || '',
            is_featured: Boolean(plan.is_featured),
            is_active: Boolean(plan.is_active),
            features: Array.isArray(plan.features) ? plan.features.join('\n') : '',
            cta_text: plan.cta_text || 'Pilih Paket',
            ai_credits_bonus: plan.ai_credits_bonus || 0,
            sort_order: plan.sort_order || 1,
        });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPlan) return;

        setIsSubmitting(true);
        router.post(
            `/admin/pricing/${editingPlan.id}`,
            {
                ...formData,
                _method: 'PUT',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEditingPlan(null);
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const handleCreateNew = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/admin/pricing', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsCreateOpen(false);
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleResetDefaults = () => {
        if (
            window.confirm(
                'Apakah Anda yakin ingin mereset semua paket ke pengaturan awal sistem (Free, AI Pass, RAKIT Pro, RAKIT Semester, RAKIT Team)?'
            )
        ) {
            router.post(
                '/admin/pricing-reset',
                {},
                {
                    preserveScroll: true,
                }
            );
        }
    };

    const formatRupiah = (amount: number) => {
        if (amount === 0) return 'Gratis';
        return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Paket & Langganan — Admin RAKIT Campus" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                    <div className="flex items-center gap-3.5">
                        <div className="size-11 rounded-2xl bg-blue-50 border border-blue-200 shadow-2xs p-2 shrink-0 flex items-center justify-center text-blue-600">
                            <CreditCard className="size-6 stroke-[2.2]" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                                    Kelola Paket & Biaya Langganan
                                </h1>
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                                    Admin
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Atur harga, bonus AI, keunggulan fitur, dan visibilitas paket di halaman publik.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/pricing"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <ExternalLink className="size-3.5 text-blue-600" />
                            <span>Lihat Halaman Publik</span>
                        </Link>

                        <button
                            type="button"
                            onClick={handleResetDefaults}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition cursor-pointer"
                            title="Reset paket ke pengaturan awal bawaan sistem"
                        >
                            <RotateCcw className="size-3.5 text-slate-500" />
                            <span>Reset Default</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setFormData({
                                    name: '',
                                    slug: '',
                                    price: 0,
                                    period: 'per bulan',
                                    tagline: '',
                                    badge: '',
                                    is_featured: false,
                                    is_active: true,
                                    features: '',
                                    cta_text: 'Pilih Paket',
                                    ai_credits_bonus: 50,
                                    sort_order: plans.length + 1,
                                });
                                setIsCreateOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                        >
                            <Plus className="size-3.5 stroke-[2.5]" />
                            <span>Tambah Paket</span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {plans.map((plan) => {
                        const featuresList = Array.isArray(plan.features) ? plan.features : [];

                        return (
                            <div
                                key={plan.id}
                                className={`rounded-3xl p-6 bg-white border transition-all flex flex-col justify-between relative shadow-xs ${
                                    plan.is_featured
                                        ? 'border-2 border-blue-600 ring-4 ring-blue-500/10'
                                        : 'border-slate-200/90 hover:border-slate-300'
                                } ${!plan.is_active ? 'opacity-60 bg-slate-50/50' : ''}`}
                            >
                                <div className="space-y-4">
                                    {/* Top Row: Slug, Badge, & Status */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                {plan.slug}
                                            </span>
                                            {plan.is_featured && (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-black text-white bg-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                                                    <Star className="size-2.5 fill-current" />
                                                    <span>Featured</span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            {plan.badge && (
                                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-full">
                                                    {plan.badge}
                                                </span>
                                            )}
                                            <span
                                                className={`size-2.5 rounded-full ${
                                                    plan.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                                }`}
                                                title={plan.is_active ? 'Paket Aktif' : 'Paket Nonaktif'}
                                            />
                                        </div>
                                    </div>

                                    {/* Plan Title & Price */}
                                    <div>
                                        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                            {plan.name}
                                        </h3>
                                        {plan.tagline && (
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                                {plan.tagline}
                                            </p>
                                        )}
                                    </div>

                                    {/* Price & Period */}
                                    <div className="pt-2 pb-1 border-t border-slate-100">
                                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                                            {formatRupiah(plan.price)}
                                            <span className="text-xs font-normal text-slate-500 ml-1.5">
                                                /{plan.period}
                                            </span>
                                        </div>
                                        {plan.ai_credits_bonus > 0 && (
                                            <div className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
                                                <Sparkles className="size-3 text-amber-500 shrink-0" />
                                                <span>+{plan.ai_credits_bonus} Kredit AI Bonus</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Features Bullet Points */}
                                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                                        {featuresList.slice(0, 5).map((feat, fIdx) => (
                                            <div key={fIdx} className="flex items-start gap-2">
                                                <Check className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                <span className="leading-tight">{feat}</span>
                                            </div>
                                        ))}
                                        {featuresList.length > 5 && (
                                            <div className="text-[11px] text-slate-400 font-medium pl-5.5">
                                                +{featuresList.length - 5} fitur lainnya
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <div className="text-[11px] text-slate-400 font-medium">
                                        Urutan: #{plan.sort_order}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEdit(plan)}
                                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-98"
                                        >
                                            <Edit3 className="size-3.5" />
                                            <span>Edit Paket</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Gateway Status & Transaction Monitoring */}
                <div className="space-y-6 pt-4">
                    {/* Gateway Health & Stats Banner */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gateway Payment</span>
                            <div className="flex items-center gap-2 pt-1">
                                {gatewayStatus.is_configured ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                        <CheckCircle2 className="size-3.5" />
                                        Terhubung ({gatewayStatus.environment.toUpperCase()})
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                                        <Clock className="size-3.5" />
                                        Kredensial Belum Terpasang
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block pt-1">{gatewayStatus.base_url}</span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Volume Transaksi</span>
                            <div className="text-2xl font-black text-slate-900 tracking-tight pt-1">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(orderStats.total_volume)}
                            </div>
                            <span className="text-[11px] text-slate-400">Total terverifikasi lunas</span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Transaksi Sukses</span>
                            <div className="text-2xl font-black text-emerald-600 tracking-tight pt-1">
                                {orderStats.paid_count}
                            </div>
                            <span className="text-[11px] text-slate-400">Pesanan berhasil</span>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Menunggu Pembayaran</span>
                            <div className="text-2xl font-black text-amber-600 tracking-tight pt-1">
                                {orderStats.pending_count}
                            </div>
                            <span className="text-[11px] text-slate-400">Pesanan pending QRIS</span>
                        </div>
                    </div>

                    {/* Recent Transactions Table */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-3 p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Receipt className="size-4.5 text-blue-600" />
                                    <span>Monitoring Transaksi Kasera Pay (Terbaru)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Catatan transaksi pembayaran real-time mahasiswa dan tim inovasi.
                                </p>
                            </div>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-xs">
                                Belum ada riwayat transaksi pembayaran.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th className="py-3 px-4">No. Pesanan</th>
                                            <th className="py-3 px-4">Pengguna</th>
                                            <th className="py-3 px-4">Paket</th>
                                            <th className="py-3 px-4">Nominal</th>
                                            <th className="py-3 px-4">Status</th>
                                            <th className="py-3 px-4">Tanggal</th>
                                            <th className="py-3 px-4 text-right">Gateway ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentOrders.map((ord) => (
                                            <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                                                <td className="py-3 px-4 font-mono font-bold text-slate-800">
                                                    {ord.order_number}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-slate-900">{ord.user_name}</div>
                                                    {ord.user_email && <div className="text-[10px] text-slate-400">{ord.user_email}</div>}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-slate-800">
                                                    {ord.plan_label || ord.plan_type}
                                                </td>
                                                <td className="py-3 px-4 font-bold text-slate-900">
                                                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(ord.amount)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {ord.status === 'paid' || ord.status === 'settlement' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                                            <CheckCircle2 className="size-3" />
                                                            Lunas
                                                        </span>
                                                    ) : ord.status === 'pending' ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                                                            <Clock className="size-3" />
                                                            Pending
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                                                            {ord.status}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                    {ord.created_at}
                                                </td>
                                                <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-500">
                                                    {ord.provider_transaction_id || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit / Create Modal */}
            {(editingPlan || isCreateOpen) && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative space-y-5 my-8">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    {isCreateOpen ? 'Tambah Paket Baru' : `Edit Paket: ${editingPlan?.name}`}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Sesuaikan detail harga, fasilitas, dan ketentuan paket langganan.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingPlan(null);
                                    setIsCreateOpen(false);
                                }}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form onSubmit={isCreateOpen ? handleCreateNew : handleSaveEdit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Paket</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Contoh: RAKIT Pro"
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Slug Sistem {!isCreateOpen && '(Terkunci)'}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!isCreateOpen}
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        placeholder="Contoh: pro_monthly"
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm font-mono text-slate-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Harga (Rupiah)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        required
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-1 block">
                                        Tampilan: {formatRupiah(formData.price)}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Periode Durasi</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.period}
                                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                                        placeholder="Contoh: per bulan / Sekali Bayar"
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Bonus Kredit AI</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={formData.ai_credits_bonus}
                                        onChange={(e) =>
                                            setFormData({ ...formData, ai_credits_bonus: parseInt(e.target.value) || 0 })
                                        }
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Badge Promo (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.badge}
                                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                                        placeholder="Contoh: Populer Saat Lomba"
                                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Tagline Ringkas</label>
                                <input
                                    type="text"
                                    value={formData.tagline}
                                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                                    placeholder="Contoh: Untuk mahasiswa aktif yang rutin ikut lomba..."
                                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Daftar Fitur (1 baris per fitur)
                                    </label>
                                    <span className="text-[10px] text-slate-400">Tekan Enter untuk baris baru</span>
                                </div>
                                <textarea
                                    rows={6}
                                    value={formData.features}
                                    onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                                    placeholder="AI Proposal Reviewer&#10;Brainstorming ide proyek & solusi&#10;25 Kredit AI ekstra"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Teks Tombol CTA</label>
                                    <input
                                        type="text"
                                        value={formData.cta_text}
                                        onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                                        placeholder="Langganan Pro"
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Urutan (Sort)</label>
                                    <input
                                        type="number"
                                        value={formData.sort_order}
                                        onChange={(e) =>
                                            setFormData({ ...formData, sort_order: parseInt(e.target.value) || 1 })
                                        }
                                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex items-center gap-4 pt-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_featured}
                                            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                                            className="rounded text-blue-600 focus:ring-blue-500"
                                        />
                                        <span>Featured</span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_active}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="rounded text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span>Aktif</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingPlan(null);
                                        setIsCreateOpen(false);
                                    }}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="size-3.5 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <span>Simpan Perubahan</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
