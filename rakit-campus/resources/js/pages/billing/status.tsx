import SeoHead from '@/components/seo/SeoHead';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Check,
    Clock,
    Copy,
    ExternalLink,
    RefreshCw,
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
    { title: 'Harga', href: '/pricing' },
    { title: 'Status', href: '#' },
];

export default function BillingStatusPage({ order, bonusCredits }: Props) {
    const [currentStatus, setCurrentStatus] = useState<OrderData['status']>(order.status);
    const [isChecking, setIsChecking] = useState(false);
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

    const checkOrderStatus = async () => {
        if (isChecking) return;
        setIsChecking(true);

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
            }
        } catch {
            // Keep current status on network error
        } finally {
            setIsChecking(false);
        }
    };

    // Auto-polling every 5 seconds while pending
    useEffect(() => {
        if (currentStatus !== 'pending') return;

        let attempts = 0;
        const maxAttempts = 36;

        const interval = setInterval(() => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(interval);
                return;
            }
            checkOrderStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, [currentStatus]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const qrImageUrl = order.qr_string
        ? `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(order.qr_string)}&size=240x240&margin=4`
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SeoHead
                title={`Status Pembayaran ${order.order_number} — RAKIT Campus`}
                description="Status pembayaran paket RAKIT Campus."
            />

            <div className="min-h-[80vh] py-10 sm:py-16 px-4">
                <div className="max-w-md mx-auto space-y-6">
                    {/* Back Link */}
                    <div>
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Harga</span>
                        </Link>
                    </div>

                    {/* MAIN STATUS CARD */}
                    <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden">
                        {/* 1. STATE: PAID */}
                        {currentStatus === 'paid' && (
                            <div className="p-8 sm:p-10 text-center space-y-5">
                                <div className="size-14 rounded-full bg-zinc-900 text-white flex items-center justify-center mx-auto">
                                    <Check className="size-7 stroke-[2.5]" />
                                </div>

                                <div className="space-y-1">
                                    <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
                                        {order.plan_label} Aktif
                                    </h1>
                                    <p className="text-xs sm:text-sm text-zinc-500">
                                        {bonusCredits > 0
                                            ? `+${bonusCredits} kredit AI telah ditambahkan ke akun.`
                                            : 'Paket Anda sudah aktif dan siap digunakan.'}
                                    </p>
                                </div>

                                <div className="pt-2 flex flex-col gap-2">
                                    <Link
                                        href="/ai-workspace"
                                        className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors text-center"
                                    >
                                        Buka AI Workspace
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="w-full py-2.5 rounded-full text-zinc-600 hover:text-zinc-900 text-xs font-medium transition-colors text-center"
                                    >
                                        Ke Dashboard
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 2. STATE: PENDING */}
                        {currentStatus === 'pending' && (
                            <div className="p-6 sm:p-8 text-center space-y-5">
                                <div className="space-y-1">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-medium">
                                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        <span>Menunggu Pembayaran</span>
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 pt-1">
                                        {formatRupiah(order.amount)}
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        {order.plan_label}
                                    </p>
                                </div>

                                {/* QR Code Box */}
                                <div className="space-y-2">
                                    {qrImageUrl ? (
                                        <div className="size-52 mx-auto bg-white rounded-2xl p-3 border border-zinc-200/80 shadow-xs flex items-center justify-center">
                                            <img
                                                src={qrImageUrl}
                                                alt="QRIS"
                                                className="size-full object-contain rounded-lg"
                                            />
                                        </div>
                                    ) : (
                                        <div className="size-48 mx-auto bg-zinc-50 rounded-2xl border border-zinc-200/80 flex items-center justify-center text-xs text-zinc-400">
                                            Menyiapkan QRIS...
                                        </div>
                                    )}
                                    <p className="text-[11px] text-zinc-400">
                                        Pindai dengan aplikasi pembayaran apa saja
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-1">
                                    {order.checkout_url && (
                                        <a
                                            href={order.checkout_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <span>Buka Kasera Pay</span>
                                            <ExternalLink className="size-3.5" />
                                        </a>
                                    )}

                                    <button
                                        type="button"
                                        onClick={checkOrderStatus}
                                        disabled={isChecking}
                                        className="w-full py-2.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                    >
                                        <RefreshCw className={`size-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                                        <span>{isChecking ? 'Memeriksa...' : 'Cek Status'}</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3. STATE: EXPIRED */}
                        {currentStatus === 'expired' && (
                            <div className="p-8 sm:p-10 text-center space-y-4">
                                <div className="size-12 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
                                    <Clock className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-lg font-semibold text-zinc-900">
                                        Waktu Habis
                                    </h1>
                                    <p className="text-xs text-zinc-500">
                                        Sesi pembayaran ini telah berakhir.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <Link
                                        href="/pricing"
                                        className="inline-flex px-5 py-2 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors"
                                    >
                                        Pilih Paket Lagi
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* 4. STATE: FAILED */}
                        {(currentStatus === 'failed' || currentStatus === 'cancelled') && (
                            <div className="p-8 sm:p-10 text-center space-y-4">
                                <div className="size-12 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto">
                                    <AlertCircle className="size-6" />
                                </div>
                                <div className="space-y-1">
                                    <h1 className="text-lg font-semibold text-zinc-900">
                                        Pembayaran Belum Berhasil
                                    </h1>
                                    <p className="text-xs text-zinc-500">
                                        Transaksi dibatalkan atau tidak selesai.
                                    </p>
                                </div>
                                <div className="pt-2">
                                    <Link
                                        href="/pricing"
                                        className="inline-flex px-5 py-2 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-medium transition-colors"
                                    >
                                        Coba Lagi
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* MINIMAL INSET RECEIPT */}
                        <div className="border-t border-zinc-100 px-6 sm:px-8 py-5">
                            <div className="rounded-2xl bg-zinc-50 divide-y divide-zinc-200/60 text-xs overflow-hidden">
                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-zinc-500">No. Pesanan</span>
                                    <div className="flex items-center gap-1.5 font-mono text-zinc-800">
                                        <span>{order.order_number}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(order.order_number)}
                                            className="text-zinc-400 hover:text-zinc-700 p-0.5 cursor-pointer"
                                            title="Salin No. Pesanan"
                                        >
                                            {copied ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-zinc-500">Paket</span>
                                    <span className="font-medium text-zinc-900">{order.plan_label}</span>
                                </div>

                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-zinc-500">Metode</span>
                                    <span className="text-zinc-800">QRIS</span>
                                </div>

                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-zinc-500">Tanggal</span>
                                    <span className="text-zinc-800">{order.paid_at || order.created_at || '-'}</span>
                                </div>

                                <div className="px-4 py-3 flex justify-between items-center">
                                    <span className="text-zinc-500">Status</span>
                                    <span className={`inline-flex items-center gap-1 font-medium ${
                                        currentStatus === 'paid' ? 'text-emerald-600' :
                                        currentStatus === 'pending' ? 'text-amber-600' : 'text-zinc-500'
                                    }`}>
                                        <span className={`size-1.5 rounded-full ${
                                            currentStatus === 'paid' ? 'bg-emerald-500' :
                                            currentStatus === 'pending' ? 'bg-amber-500' : 'bg-zinc-400'
                                        }`} />
                                        <span>
                                            {currentStatus === 'paid' ? 'Lunas' :
                                             currentStatus === 'pending' ? 'Menunggu' :
                                             currentStatus === 'expired' ? 'Kedaluwarsa' : 'Gagal'}
                                        </span>
                                    </span>
                                </div>

                                <div className="px-4 py-3.5 flex justify-between items-center font-medium bg-zinc-100/50">
                                    <span className="text-zinc-700">Total</span>
                                    <span className="text-sm font-semibold text-zinc-900">{formatRupiah(order.amount)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
