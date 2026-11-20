import SeoHead from '@/components/seo/SeoHead';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    HelpCircle,
    PartyPopper,
    QrCode,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
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
        const maxAttempts = 30; // 2.5 minutes of background polling

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
        ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(order.qr_string)}&size=240x240&margin=10`
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SeoHead
                title={`Status Pembayaran ${order.order_number} — RAKIT Campus`}
                description="Status verifikasi pembayaran resmi paket RAKIT Campus via Kasera Pay Gateway."
            />

            <div className="py-8 sm:py-12 px-4 sm:px-6 max-w-4xl mx-auto w-full space-y-8">
                {/* STATUS CARD */}
                <div className="bg-white rounded-[32px] border border-slate-200/90 shadow-xl overflow-hidden">
                    {/* Top Status Header */}
                    {currentStatus === 'paid' && (
                        <div className="p-8 sm:p-10 text-center space-y-4 bg-gradient-to-b from-emerald-50/70 to-white border-b border-emerald-100">
                            <div className="size-20 rounded-[28px] bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25 ring-8 ring-emerald-500/10 animate-in zoom-in-95 duration-300">
                                <CheckCircle2 className="size-10 stroke-[2.5]" />
                            </div>
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-black tracking-wider uppercase">
                                    <Sparkles className="size-3" />
                                    Pembayaran Berhasil
                                </span>
                                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    {order.plan_label} Telah Aktif!
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                    Terima kasih! Transaksi Anda telah diverifikasi otomatis oleh sistem Kasera Pay.
                                </p>
                            </div>

                            {/* Bonus Badge */}
                            {bonusCredits > 0 && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-emerald-200 text-emerald-800 text-xs font-bold shadow-xs">
                                    <Zap className="size-4 text-emerald-600 fill-emerald-600" />
                                    <span>+{bonusCredits} Kredit AI Ekstra Telah Ditambahkan ke Akun</span>
                                </div>
                            )}
                        </div>
                    )}

                    {currentStatus === 'pending' && (
                        <div className="p-8 sm:p-10 text-center space-y-4 bg-gradient-to-b from-blue-50/60 to-white border-b border-blue-100">
                            <div className="size-20 rounded-[28px] bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25 ring-8 ring-blue-500/10 animate-pulse duration-1000">
                                <Clock className="size-10" />
                            </div>
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black tracking-wider uppercase">
                                    <Clock className="size-3" />
                                    Menunggu Pembayaran
                                </span>
                                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    Selesaikan Pembayaran {order.plan_label}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                    Scan QRIS atau buka halaman checkout resmi Kasera Pay untuk menyelesaikan transaksi.
                                </p>
                            </div>
                        </div>
                    )}

                    {currentStatus === 'expired' && (
                        <div className="p-8 sm:p-10 text-center space-y-4 bg-gradient-to-b from-slate-100/70 to-white border-b border-slate-200">
                            <div className="size-20 rounded-[28px] bg-slate-600 text-white flex items-center justify-center mx-auto shadow-lg ring-8 ring-slate-500/10">
                                <ShieldAlert className="size-10" />
                            </div>
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-[11px] font-black tracking-wider uppercase">
                                    Kedaluwarsa
                                </span>
                                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    Batas Waktu Pembayaran Habis
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                    Sesi transaksi ini telah kedaluwarsa. Silakan lakukan pemesanan ulang melalui halaman harga.
                                </p>
                            </div>
                        </div>
                    )}

                    {(currentStatus === 'failed' || currentStatus === 'cancelled') && (
                        <div className="p-8 sm:p-10 text-center space-y-4 bg-gradient-to-b from-rose-50/70 to-white border-b border-rose-100">
                            <div className="size-20 rounded-[28px] bg-rose-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-rose-500/25 ring-8 ring-rose-500/10">
                                <AlertCircle className="size-10" />
                            </div>
                            <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black tracking-wider uppercase">
                                    Pembayaran Dibatalkan / Gagal
                                </span>
                                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                    Transaksi Tidak Dapat Diproses
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                                    Pembayaran dibatalkan atau gagal diotorisasi oleh gateway penyedia.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Middle Content: Order Details & QRIS (if pending) */}
                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Status Check Alert Box */}
                        {checkMessage && (
                            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2">
                                <RefreshCw className={`size-4 text-blue-600 shrink-0 ${isChecking ? 'animate-spin' : ''}`} />
                                <span>{checkMessage}</span>
                            </div>
                        )}

                        {/* QRIS / Checkout Action for Pending */}
                        {currentStatus === 'pending' && (
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 flex flex-col md:flex-row items-center gap-6">
                                {qrImageUrl ? (
                                    <div className="shrink-0 text-center space-y-2">
                                        <div className="size-52 bg-white rounded-2xl p-3 border-2 border-dashed border-slate-300 shadow-xs flex items-center justify-center mx-auto">
                                            <img
                                                src={qrImageUrl}
                                                alt="QRIS Code"
                                                className="size-full object-contain"
                                            />
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-medium block">
                                            Scan via GoPay, DANA, OVO, ShopeePay, atau Mobile Banking
                                        </span>
                                    </div>
                                ) : (
                                    <div className="shrink-0 size-48 bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-4 text-center">
                                        <QrCode className="size-16 text-blue-600 mb-2" />
                                        <span className="text-xs font-bold text-slate-900">QRIS Kasera Pay</span>
                                        <span className="text-[10px] text-slate-500">Klik tautan checkout di bawah</span>
                                    </div>
                                )}

                                <div className="space-y-4 flex-1 text-center md:text-left">
                                    <div>
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                            Total Tagihan
                                        </span>
                                        <div className="text-3xl sm:text-4xl font-black text-blue-600">
                                            {formatRupiah(order.amount)}
                                        </div>
                                        {order.expires_at && (
                                            <p className="text-xs text-amber-600 font-semibold mt-1">
                                                Batas bayar: {order.expires_at}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                                        {order.checkout_url && (
                                            <a
                                                href={order.checkout_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full sm:w-auto px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <span>Buka Checkout Resmi Kasera</span>
                                                <ExternalLink className="size-3.5" />
                                            </a>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => checkOrderStatus(true)}
                                            disabled={isChecking}
                                            className="w-full sm:w-auto px-5 py-3 rounded-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <RefreshCw className={`size-3.5 ${isChecking ? 'animate-spin text-blue-600' : ''}`} />
                                            <span>{isChecking ? 'Mengecek...' : 'Cek Status Sekarang'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Transaction Receipt Table */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-xs">
                            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
                                <span>Rincian Pembayaran</span>
                                <span className="text-[10px] uppercase font-bold text-slate-400">Kasera Pay Verified</span>
                            </div>

                            <div className="divide-y divide-slate-100">
                                <div className="px-5 py-3 flex justify-between items-center">
                                    <span className="text-slate-500">Nomor Pesanan</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-slate-900">{order.order_number}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(order.order_number)}
                                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                            title="Salin"
                                        >
                                            <Copy className="size-3.5" />
                                        </button>
                                        {copied && <span className="text-[10px] text-emerald-600 font-bold">Tersalin</span>}
                                    </div>
                                </div>

                                <div className="px-5 py-3 flex justify-between items-center">
                                    <span className="text-slate-500">Paket</span>
                                    <span className="font-bold text-slate-900">{order.plan_label}</span>
                                </div>

                                <div className="px-5 py-3 flex justify-between items-center">
                                    <span className="text-slate-500">Metode Pembayaran</span>
                                    <span className="font-semibold text-slate-800 uppercase">
                                        {order.payment_method || 'QRIS Instan'}
                                    </span>
                                </div>

                                <div className="px-5 py-3 flex justify-between items-center">
                                    <span className="text-slate-500">Penyedia Gateway</span>
                                    <span className="font-semibold text-blue-600">
                                        Kasera Pay (Official)
                                    </span>
                                </div>

                                {order.provider_transaction_id && (
                                    <div className="px-5 py-3 flex justify-between items-center">
                                        <span className="text-slate-500">ID Gateway Transaksi</span>
                                        <span className="font-mono text-slate-700">
                                            {order.provider_transaction_id}
                                        </span>
                                    </div>
                                )}

                                <div className="px-5 py-3 flex justify-between items-center">
                                    <span className="text-slate-500">Waktu Dibuat</span>
                                    <span className="text-slate-700">{order.created_at || '-'}</span>
                                </div>

                                {order.paid_at && (
                                    <div className="px-5 py-3 flex justify-between items-center bg-emerald-50/40">
                                        <span className="text-emerald-800 font-medium">Waktu Terverifikasi</span>
                                        <span className="font-bold text-emerald-800">{order.paid_at}</span>
                                    </div>
                                )}

                                <div className="px-5 py-3.5 flex justify-between items-center bg-slate-50 font-bold">
                                    <span className="text-slate-900">Total Pembayaran</span>
                                    <span className="text-sm font-black text-slate-900">{formatRupiah(order.amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <Link
                                href="/pricing"
                                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Kembali ke Paket Harga</span>
                            </Link>

                            {currentStatus === 'paid' ? (
                                <Link
                                    href="/ai-workspace"
                                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span>Mulai Gunakan Fitur Pro</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            ) : currentStatus === 'expired' || currentStatus === 'failed' ? (
                                <Link
                                    href="/pricing"
                                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span>Pilih Ulang Paket</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
