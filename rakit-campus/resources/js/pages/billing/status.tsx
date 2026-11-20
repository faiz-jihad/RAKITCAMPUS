import SeoHead from '@/components/seo/SeoHead';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    CreditCard,
    ExternalLink,
    HelpCircle,
    PartyPopper,
    QrCode,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Wallet,
    Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface OrderData {
    id: number;
    order_number: string;
    plan_type: string;
    plan_label: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled';
    provider: string;
    provider_transaction_id: string | null;
    checkout_url: string | null;
    payment_method: string;
    paid_at: string | null;
    expires_at: string | null;
    created_at: string | null;
    qr_string: string | null;
}

interface Props {
    order: OrderData;
    bonusCredits: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Harga & Langganan', href: '/pricing' },
    { title: 'Status Transaksi', href: '#' },
];

export default function BillingStatusPage({ order, bonusCredits }: Props) {
    const [currentStatus, setCurrentStatus] = useState<OrderData['status']>(order.status);
    const [isChecking, setIsChecking] = useState(false);
    const [checkMessage, setCheckMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const formatRupiah = (num: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(num);
    };

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const checkOrderStatus = async (showFeedback = true) => {
        if (isChecking) return;
        setIsChecking(true);
        if (showFeedback) setCheckMessage('Memeriksa status pembayaran ke Kasera Pay...');

        try {
            const res = await fetch(`/billing/orders/${order.order_number}/check-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });

            const data = await res.json();
            if (data.status) {
                setCurrentStatus(data.status);
                if (data.status === 'paid') {
                    setCheckMessage('Pembayaran berhasil dikonfirmasi! Paket Anda telah aktif.');
                } else if (data.status === 'expired') {
                    setCheckMessage('Transaksi telah kedaluwarsa.');
                } else if (data.status === 'failed') {
                    setCheckMessage('Pembayaran gagal atau dibatalkan.');
                } else if (showFeedback) {
                    setCheckMessage('Pembayaran belum diterima. Menunggu transfer via QRIS...');
                }
            }
        } catch {
            if (showFeedback) setCheckMessage('Gagal menghubungi server status. Coba beberapa saat lagi.');
        } finally {
            setIsChecking(false);
        }
    };

    // Auto-polling every 5 seconds if status is pending
    useEffect(() => {
        if (currentStatus !== 'pending') return;

        let attempts = 0;
        const maxAttempts = 36; // 3 minutes of background polling

        const interval = setInterval(() => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(interval);
                return;
            }
            checkOrderStatus(false);
        }, 5000);

        return () => clearInterval(interval);
    }, [currentStatus]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const qrImageUrl = order.qr_string
        ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(order.qr_string)}&size=260x260&margin=8`
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SeoHead
                title={`Status Pembayaran ${order.order_number} — RAKIT Campus`}
                description="Status verifikasi pembayaran resmi paket RAKIT Campus via Kasera Pay Gateway."
            />

            <div className="min-h-[85vh] bg-[#F5F5F7] py-8 sm:py-12 px-4 sm:px-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Back Button */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors py-1 px-3 rounded-full hover:bg-slate-200/60"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Paket Harga</span>
                        </Link>
                        <span className="text-[11px] font-mono text-slate-400">
                            Ref: {order.order_number}
                        </span>
                    </div>

                    {/* MAIN APPLE WALLET CARD */}
                    <div className="bg-white rounded-[36px] border border-slate-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300">
                        {/* 1. STATE: PAID (SUCCESS) */}
                        {currentStatus === 'paid' && (
                            <div className="p-8 sm:p-12 text-center space-y-6 bg-gradient-to-b from-emerald-50/50 via-white to-white">
                                <div className="size-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-500/10 animate-in zoom-in-95 duration-500">
                                    <CheckCircle2 className="size-12 stroke-[2.5]" />
                                </div>

                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-[11px] font-bold tracking-wider uppercase">
                                        <Sparkles className="size-3" />
                                        Pembayaran Terkonfirmasi
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                                        {order.plan_label} Telah Aktif!
                                    </h1>
                                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                                        Transaksi Anda berhasil diproses resmi oleh Kasera Pay. Hak akses premium akun Anda telah otomatis terbuka.
                                    </p>
                                </div>

                                {/* Bonus Badge Bento */}
                                {bonusCredits > 0 && (
                                    <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-bold shadow-xs">
                                        <Zap className="size-4 text-emerald-600 fill-emerald-600" />
                                        <span>+{bonusCredits} Kredit AI Ekstra Telah Masuk ke Saldo Akun</span>
                                    </div>
                                )}

                                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <Link
                                        href="/ai-workspace"
                                        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold tracking-wide shadow-lg shadow-black/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <span>Buka AI Workspace Sekarang</span>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-all active:scale-[0.98]"
                                    >
                                        Ke Dashboard Utama
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 2. STATE: PENDING (QRIS SCAN) */}
                        {currentStatus === 'pending' && (
                            <div>
                                {/* Header Capsule */}
                                <div className="p-8 sm:p-10 pb-6 text-center space-y-3 bg-gradient-to-b from-blue-50/40 to-transparent">
                                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-bold tracking-wide">
                                        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                        <span>Menunggu Pembayaran QRIS</span>
                                    </div>

                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                        Selesaikan Pembayaran {order.plan_label}
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                        Scan kode QRIS di bawah menggunakan GoPay, DANA, OVO, ShopeePay, BCA, atau aplikasi perbankan apa saja.
                                    </p>
                                </div>

                                <div className="px-6 sm:px-10 pb-8 space-y-6">
                                    {/* Real-time Status Alert */}
                                    <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/70 text-blue-900 text-xs font-medium flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <span className="relative flex size-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full size-2.5 bg-blue-600" />
                                            </span>
                                            <span>{checkMessage || 'Sistem otomatis mendeteksi transfer QRIS setiap 5 detik...'}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => checkOrderStatus(true)}
                                            disabled={isChecking}
                                            className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer shrink-0"
                                        >
                                            <RefreshCw className={`size-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                                            <span>Cek Manual</span>
                                        </button>
                                    </div>

                                    {/* APPLE BENTO: QRIS & Checkout Actions */}
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-[#F9F9FB] rounded-[30px] p-6 sm:p-8 border border-slate-200/70">
                                        {/* Left Column: QR Card */}
                                        <div className="md:col-span-5 flex flex-col items-center text-center space-y-3">
                                            {qrImageUrl ? (
                                                <div className="bg-white rounded-[26px] p-4 border border-slate-200/90 shadow-[0_8px_25px_rgba(0,0,0,0.05)] w-full max-w-[240px]">
                                                    <img
                                                        src={qrImageUrl}
                                                        alt="QRIS Kasera Pay"
                                                        className="w-full aspect-square object-contain rounded-xl"
                                                    />
                                                    <div className="pt-2 flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        <span>QRIS</span>
                                                        <span>•</span>
                                                        <span>NMID Resmi</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-[26px] p-6 border border-slate-200 shadow-xs flex flex-col items-center justify-center w-full max-w-[240px] aspect-square">
                                                    <QrCode className="size-16 text-[#0071E3] mb-2" />
                                                    <span className="text-xs font-bold text-slate-800">QRIS Kasera Pay</span>
                                                    <span className="text-[10px] text-slate-400">Siap Ditautkan</span>
                                                </div>
                                            )}

                                            <span className="text-[11px] text-slate-500 font-medium">
                                                Scan langsung dari layar ini
                                            </span>
                                        </div>

                                        {/* Right Column: Amount & Actions */}
                                        <div className="md:col-span-7 space-y-5 text-center md:text-left">
                                            <div className="space-y-1">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                    Total Pembayaran
                                                </span>
                                                <div className="text-3xl sm:text-4xl font-black text-[#0071E3] tracking-tight">
                                                    {formatRupiah(order.amount)}
                                                </div>
                                                {order.expires_at && (
                                                    <p className="text-xs text-amber-700 font-semibold flex items-center justify-center md:justify-start gap-1 pt-0.5">
                                                        <Clock className="size-3.5" />
                                                        <span>Batas Waktu: {order.expires_at}</span>
                                                    </p>
                                                )}
                                            </div>

                                            {/* Primary Actions */}
                                            <div className="space-y-2.5">
                                                {order.checkout_url && (
                                                    <a
                                                        href={order.checkout_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full py-3.5 px-6 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                                    >
                                                        <span>Buka Halaman Checkout Kasera Pay</span>
                                                        <ExternalLink className="size-4" />
                                                    </a>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => checkOrderStatus(true)}
                                                    disabled={isChecking}
                                                    className="w-full py-3 px-5 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 text-xs font-bold shadow-2xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                                                >
                                                    <RefreshCw className={`size-3.5 ${isChecking ? 'animate-spin text-blue-600' : ''}`} />
                                                    <span>{isChecking ? 'Memeriksa...' : 'Cek Status Sekarang'}</span>
                                                </button>
                                            </div>

                                            {/* Supported Payment Logos / Text */}
                                            <div className="pt-2 border-t border-slate-200/60">
                                                <span className="text-[10px] text-slate-400 font-medium block">
                                                    Mendukung: GoPay, DANA, OVO, ShopeePay, BCA, Mandiri, BRI, BNI & QRIS Nasional
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 3. STATE: EXPIRED */}
                        {currentStatus === 'expired' && (
                            <div className="p-8 sm:p-12 text-center space-y-5 bg-gradient-to-b from-slate-100/60 via-white to-white">
                                <div className="size-20 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mx-auto">
                                    <Clock className="size-10" />
                                </div>
                                <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-[11px] font-bold uppercase">
                                        Kedaluwarsa
                                    </span>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                                        Waktu Pembayaran Habis
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                        Sesi pembayaran untuk pesanan ini telah habis. Saldo atau kuota Anda tidak terpotong. Silakan buat pesanan baru.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <Link
                                        href="/pricing"
                                        className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all active:scale-[0.98]"
                                    >
                                        <span>Pesan Ulang Paket</span>
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 4. STATE: FAILED */}
                        {(currentStatus === 'failed' || currentStatus === 'cancelled') && (
                            <div className="p-8 sm:p-12 text-center space-y-5 bg-gradient-to-b from-rose-50/60 via-white to-white">
                                <div className="size-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                                    <AlertCircle className="size-10" />
                                </div>
                                <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold uppercase">
                                        Gagal / Dibatalkan
                                    </span>
                                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                                        Transaksi Tidak Dapat Dilanjutkan
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                        Pembayaran dibatalkan atau gagal diotorisasi oleh gateway Kasera Pay.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <Link
                                        href="/pricing"
                                        className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold transition-all active:scale-[0.98]"
                                    >
                                        <span>Coba Paket Lain</span>
                                        <ArrowRight className="size-3.5" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* APPLE GROUPED LIST: RECEIPT DETAILS */}
                        <div className="border-t border-slate-100 px-6 sm:px-10 py-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                    Rincian Transaksi Resmi
                                </h3>
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                                    <ShieldCheck className="size-3 text-emerald-600" />
                                    <span>Kasera Pay Terverifikasi</span>
                                </span>
                            </div>

                            <div className="bg-[#F9F9FB] rounded-[24px] border border-slate-200/70 divide-y divide-slate-200/60 text-xs overflow-hidden">
                                <div className="px-5 py-3.5 flex justify-between items-center">
                                    <span className="text-slate-500">Nomor Pesanan</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-900">{order.order_number}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(order.order_number)}
                                            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1"
                                            title="Salin Nomor Pesanan"
                                        >
                                            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="px-5 py-3.5 flex justify-between items-center">
                                    <span className="text-slate-500">Paket</span>
                                    <span className="font-bold text-slate-900">{order.plan_label}</span>
                                </div>

                                <div className="px-5 py-3.5 flex justify-between items-center">
                                    <span className="text-slate-500">Metode Pembayaran</span>
                                    <span className="font-semibold text-slate-800 uppercase">
                                        {order.payment_method || 'QRIS Instan'}
                                    </span>
                                </div>

                                <div className="px-5 py-3.5 flex justify-between items-center">
                                    <span className="text-slate-500">Penyedia Gateway</span>
                                    <span className="font-bold text-[#0071E3]">Kasera Pay (Official)</span>
                                </div>

                                {order.provider_transaction_id && (
                                    <div className="px-5 py-3.5 flex justify-between items-center">
                                        <span className="text-slate-500">ID Gateway Kasera</span>
                                        <span className="font-mono text-slate-700">{order.provider_transaction_id}</span>
                                    </div>
                                )}

                                <div className="px-5 py-3.5 flex justify-between items-center">
                                    <span className="text-slate-500">Waktu Dibuat</span>
                                    <span className="text-slate-700">{order.created_at || '-'}</span>
                                </div>

                                {order.paid_at && (
                                    <div className="px-5 py-3.5 flex justify-between items-center bg-emerald-50/50">
                                        <span className="text-emerald-800 font-semibold">Waktu Terverifikasi</span>
                                        <span className="font-bold text-emerald-800">{order.paid_at}</span>
                                    </div>
                                )}

                                <div className="px-5 py-4 flex justify-between items-center bg-white font-bold">
                                    <span className="text-slate-900 text-sm">Total Tagihan</span>
                                    <span className="text-base font-black text-slate-900">{formatRupiah(order.amount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
