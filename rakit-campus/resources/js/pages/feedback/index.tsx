import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { useState } from 'react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Bug,
    CheckCircle2,
    Clock,
    HelpCircle,
    Lightbulb,
    MessageSquare,
    RotateCw,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Star,
} from 'lucide-react';

interface FeedbackItem {
    id: number;
    ticket_code: string;
    category: string;
    category_label: string;
    feedback_type: 'suggestion' | 'bug_report';
    urgency: 'low' | 'medium' | 'high' | 'critical';
    urgency_label: string;
    page_url?: string | null;
    message: string;
    rating?: number | null;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    status_label: string;
    admin_notes?: string | null;
    created_at?: string;
    created_at_human?: string;
}

interface Props {
    myFeedbacks?: FeedbackItem[];
    defaultCategory?: string;
    defaultType?: 'suggestion' | 'bug_report';
    defaultUrl?: string;
}

export default function FeedbackIndex({
    myFeedbacks = [],
    defaultCategory = 'saran_fitur',
    defaultType = 'suggestion',
    defaultUrl = '',
}: Props) {
    const { auth } = usePage<SharedData>().props;

    const [activeTab, setActiveTab] = useState<'bug_report' | 'suggestion' | 'history'>(
        defaultType === 'bug_report' ? 'bug_report' : 'suggestion'
    );

    // Form state
    const [category, setCategory] = useState(defaultCategory);
    const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
    const [pageUrl, setPageUrl] = useState(defaultUrl);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submittedTicket, setSubmittedTicket] = useState<{
        code: string;
        type: string;
        message: string;
    } | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || message.trim().length < 5) {
            setErrorMessage('Pesan atau rincian kendala minimal 5 karakter.');
            return;
        }

        setErrorMessage(null);
        setSubmitting(true);

        const chosenCategory = activeTab === 'bug_report' ? 'kendala_bug' : category;

        router.post(
            '/feedback',
            {
                feedback_type: activeTab === 'bug_report' ? 'bug_report' : 'suggestion',
                category: chosenCategory,
                urgency: activeTab === 'bug_report' ? urgency : 'medium',
                page_url: pageUrl.trim() || null,
                name: name.trim() || (auth?.user?.name ?? null),
                email: email.trim() || (auth?.user?.email ?? null),
                message: message.trim(),
                rating: activeTab === 'bug_report' ? null : rating,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setSubmitting(false);
                    const ticketData = (page.props as any).flash?.feedback_ticket;
                    setSubmittedTicket({
                        code: ticketData?.ticket_code || `#TKT-${Date.now().toString().slice(-5)}`,
                        type: activeTab,
                        message: message.trim(),
                    });
                    setMessage('');
                    setRating(null);
                    setPageUrl('');
                },
                onError: (errs) => {
                    setSubmitting(false);
                    const firstError = Object.values(errs)[0];
                    setErrorMessage(
                        typeof firstError === 'string'
                            ? firstError
                            : 'Terjadi kendala saat mengirim. Pastikan semua isian valid.'
                    );
                },
            }
        );
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pusat Aspirasi & Laporan', href: '/feedback' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pusat Aspirasi & Laporan Kendala — RAKIT Campus" />

            <div className="space-y-6 pt-1 max-w-5xl mx-auto pb-20">
                {/* 1. TOP HERO CONTEXT CARD (Apple HIG Bento Squircle Card) */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="size-16 rounded-2xl bg-indigo-50/80 border border-indigo-200/60 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
                            <img
                                src="/images/mascot/mascot-happy.png"
                                alt="Sahabat RAKIT Aspirasi"
                                className="w-full h-full object-contain drop-shadow-xs select-none pointer-events-none transform hover:scale-105 transition"
                            />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                                <Sparkles className="size-3 text-indigo-600" />
                                <span>Pusat Aspirasi & Bantuan Platform</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                Suara Komunitas & Laporan Sistem
                            </h1>
                            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                                Bantu kami menyempurnakan platform. Sampaikan ide fitur baru atau laporkan kendala teknis agar dapat segera diperbaiki tim pengembang.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer active:scale-95"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Dashboard</span>
                        </Link>
                    </div>
                </div>

                {/* 2. SEGMENTED NAVIGATION CONTROL (Apple HIG) */}
                <div className="flex items-center gap-1.5 bg-slate-200/60 p-1.5 rounded-2xl overflow-x-auto text-xs font-semibold shadow-2xs">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('bug_report');
                            setSubmittedTicket(null);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                            activeTab === 'bug_report'
                                ? 'bg-white text-rose-600 shadow-2xs font-extrabold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Bug className="size-3.5" />
                        <span>Lapor Kendala / Bug</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('suggestion');
                            setSubmittedTicket(null);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                            activeTab === 'suggestion'
                                ? 'bg-white text-indigo-600 shadow-2xs font-extrabold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Lightbulb className="size-3.5" />
                        <span>Saran & Ide Fitur</span>
                    </button>

                    {auth?.user && (
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('history');
                                setSubmittedTicket(null);
                            }}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                                activeTab === 'history'
                                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Clock className="size-3.5" />
                            <span>Riwayat Tiket Saya</span>
                            {myFeedbacks.length > 0 && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                    activeTab === 'history'
                                        ? 'bg-slate-100 text-slate-900'
                                        : 'bg-slate-300 text-slate-700'
                                }`}>
                                    {myFeedbacks.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* 3. SUCCESS RECEIPT BANNER */}
                {submittedTicket && (
                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-3xl p-5 sm:p-6 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3.5">
                                <div className="size-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                    <CheckCircle2 className="size-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                            {submittedTicket.type === 'bug_report'
                                                ? 'Laporan Kendala Berhasil Diterima'
                                                : 'Saran & Aspirasi Berhasil Dicatat'}
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                                            {submittedTicket.code}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                                        {submittedTicket.type === 'bug_report'
                                            ? 'Laporan Anda sudah tercatat di antrean investigasi tim teknis RAKIT. Kami akan segera menganalisisnya.'
                                            : 'Terima kasih atas kontribusi Anda! Masukan ini akan ditinjau untuk peningkatan rilis platform berikutnya.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                {auth?.user && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('history')}
                                        className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition cursor-pointer shadow-2xs w-full sm:w-auto text-center active:scale-95"
                                    >
                                        Pantau di Riwayat →
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSubmittedTicket(null)}
                                    className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer active:scale-95"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 1: LAPOR KENDALA / BUG */}
                {activeTab === 'bug_report' && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="bg-rose-50/50 border-b border-rose-100/80 p-5 sm:p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-2xs">
                                    <Bug className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                                        Formulir Laporan Kendala & Bug Sistem
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Jelaskan kendala selengkap mungkin agar tim teknis dapat mereproduksi dan memperbaikinya.
                                    </p>
                                </div>
                            </div>
                            <span className="hidden sm:inline-block text-[10px] font-extrabold text-rose-700 bg-rose-100 px-3 py-1 rounded-full uppercase tracking-wider">
                                Prioritas Tim
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
                            {/* Urgensi Kendala */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-2">
                                    Tingkat Urgensi Kendala <span className="text-rose-500">*</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {[
                                        {
                                            id: 'low',
                                            label: 'Rendah (Minor)',
                                            desc: 'Tampilan kurang pas, typo, atau glitch visual tidak fatal',
                                        },
                                        {
                                            id: 'medium',
                                            label: 'Sedang (Normal)',
                                            desc: 'Fitur terganggu, tapi masih bisa lanjut menggunakan alternatif',
                                        },
                                        {
                                            id: 'high',
                                            label: 'Tinggi / Kritis',
                                            desc: 'Error 500, gagal simpan data, atau alur terblokir total',
                                        },
                                    ].map((u) => (
                                        <button
                                            key={u.id}
                                            type="button"
                                            onClick={() => setUrgency(u.id as any)}
                                            className={`p-3.5 rounded-2xl text-left border transition cursor-pointer flex flex-col justify-between active:scale-[0.99] ${
                                                urgency === u.id
                                                    ? 'bg-rose-50/70 border-rose-500 shadow-2xs ring-1 ring-rose-500'
                                                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-900">{u.label}</span>
                                                <div
                                                    className={`size-4 rounded-full border flex items-center justify-center ${
                                                        urgency === u.id
                                                            ? 'border-rose-600 bg-rose-600'
                                                            : 'border-slate-300'
                                                    }`}
                                                >
                                                    {urgency === u.id && <div className="size-1.5 rounded-full bg-white" />}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                                {u.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* URL Halaman Terkait */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Tautan / Halaman yang Bermasalah <span className="text-slate-400 font-normal">(Opsional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={pageUrl}
                                    onChange={(e) => setPageUrl(e.target.value)}
                                    placeholder="Contoh: /competitions/workspace/alba atau /ai-workspace"
                                    className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition shadow-2xs"
                                />
                            </div>

                            {/* Detail Kendala */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-slate-800">
                                        Rincian Kendala & Pesan Error <span className="text-rose-500">*</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400">
                                        {message.length}/2000
                                    </span>
                                </div>
                                <textarea
                                    rows={5}
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="1. Apa yang sedang Anda lakukan sebelum kendala muncul?&#10;2. Pesan error atau kejanggalan apa yang terjadi?&#10;3. Perangkat / browser apa yang Anda gunakan?"
                                    className="w-full px-4 py-3 bg-slate-50/60 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition resize-none leading-relaxed shadow-2xs font-sans"
                                />
                                {errorMessage && (
                                    <p className="text-xs text-rose-600 font-medium mt-1">{errorMessage}</p>
                                )}
                            </div>

                            {/* Nama & Kontak */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Nama Pelapor <span className="text-slate-400 font-normal">(Opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={auth?.user?.name || 'Nama Anda'}
                                        className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition shadow-2xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Email Kontak Balasan <span className="text-slate-400 font-normal">(Opsional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={auth?.user?.email || 'email@kampus.ac.id'}
                                        className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* Submit button */}
                            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                    <ShieldAlert className="size-3.5 text-rose-500" />
                                    <span>Laporan otomatis mendapat nomor tiket dan disimpan di server secara aman.</span>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting || message.trim().length < 5}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 active:scale-95"
                                >
                                    {submitting ? (
                                        <>
                                            <RotateCw className="size-3.5 animate-spin" />
                                            <span>Mengirim Laporan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Bug className="size-3.5" />
                                            <span>Kirim Laporan Kendala</span>
                                            <ArrowRight className="size-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 2: SARAN & IDE FITUR */}
                {activeTab === 'suggestion' && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="bg-indigo-50/50 border-b border-indigo-100/80 p-5 sm:p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                                    <Lightbulb className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                                        Kotak Aspirasi & Ide Pengembangan
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Bagikan usulan fitur baru, kenyamanan navigasi, atau alur kolaborasi tim yang ideal.
                                    </p>
                                </div>
                            </div>
                            <span className="hidden sm:inline-block text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full uppercase tracking-wider">
                                Aspirasi
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
                            {/* Kategori Masukan */}
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-2">
                                    Kategori Masukan <span className="text-indigo-600">*</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'saran_fitur', label: 'Saran Fitur Baru' },
                                        { id: 'antarmuka_ui', label: 'Desain & Tampilan UI' },
                                        { id: 'performa', label: 'Kecepatan & Performa' },
                                        { id: 'lainnya', label: 'Aspirasi Lainnya' },
                                    ].map((cat) => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setCategory(cat.id)}
                                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                                                category === cat.id
                                                    ? 'bg-indigo-600 text-white shadow-2xs'
                                                    : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700 border border-slate-200/60'
                                            }`}
                                        >
                                            {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rating Kepuasan */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Bagaimana kepuasan Anda terhadap RAKIT Campus sejauh ini? <span className="text-slate-400 font-normal">(Opsional)</span>
                                </label>
                                <div className="flex items-center gap-1.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(rating === star ? null : star)}
                                            className="p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer text-slate-300 hover:text-amber-400 active:scale-90"
                                        >
                                            <Star
                                                className={`size-5 transition ${(rating ?? 0) >= star
                                                    ? 'fill-amber-400 text-amber-400'
                                                    : 'text-slate-300'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                    {rating && (
                                        <span className="text-xs font-bold text-slate-700 ml-2">
                                            {rating} / 5 Bintang
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Detail Masukan */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-slate-800">
                                        Detail Saran & Ide Fitur <span className="text-indigo-600">*</span>
                                    </label>
                                    <span className="text-[10px] text-slate-400">
                                        {message.length}/2000
                                    </span>
                                </div>
                                <textarea
                                    rows={4}
                                    required
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Ceritakan fitur apa yang Anda harapkan, kemudahan apa yang dibutuhkan, atau ide kolaborasi yang ingin diwujudkan..."
                                    className="w-full px-4 py-3 bg-slate-50/60 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition resize-none leading-relaxed shadow-2xs font-sans"
                                />
                                {errorMessage && (
                                    <p className="text-xs text-rose-600 font-medium mt-1">{errorMessage}</p>
                                )}
                            </div>

                            {/* Nama & Kontak */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Nama Anda <span className="text-slate-400 font-normal">(Opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={auth?.user?.name || 'Nama Anda'}
                                        className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition shadow-2xs"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Email Kontak <span className="text-slate-400 font-normal">(Opsional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={auth?.user?.email || 'email@kampus.ac.id'}
                                        className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200/90 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition shadow-2xs"
                                    />
                                </div>
                            </div>

                            {/* Submit button */}
                            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <p className="text-[11px] text-slate-500">
                                    Setiap masukan ditinjau berkala untuk roadmap pengembangan rilis platform RAKIT.
                                </p>
                                <button
                                    type="submit"
                                    disabled={submitting || message.trim().length < 5}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 active:scale-95"
                                >
                                    {submitting ? (
                                        <>
                                            <RotateCw className="size-3.5 animate-spin" />
                                            <span>Mengirim Aspirasi...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Lightbulb className="size-3.5" />
                                            <span>Kirim Saran & Aspirasi</span>
                                            <ArrowRight className="size-3.5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* TAB 3: RIWAYAT TIKET SAYA */}
                {activeTab === 'history' && (
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                        <div className="bg-slate-50/60 border-b border-slate-100 p-5 sm:p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                                    <Clock className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                                        Status & Riwayat Tiket Anda
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Pantau tindak lanjut penanganan bug teknis dan status review saran yang Anda ajukan.
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-slate-700 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                                Total: {myFeedbacks.length} Tiket
                            </span>
                        </div>

                        <div className="p-5 sm:p-7">
                            {myFeedbacks.length > 0 ? (
                                <div className="space-y-3.5">
                                    {myFeedbacks.map((fb) => (
                                        <div
                                            key={fb.id}
                                            className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-slate-300 transition bg-slate-50/40 space-y-3 shadow-2xs"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                                                        {fb.ticket_code}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                                        fb.feedback_type === 'bug_report'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                    }`}>
                                                        {fb.feedback_type === 'bug_report' ? 'Kendala / Bug' : 'Saran Fitur'}
                                                    </span>
                                                    {fb.urgency && fb.feedback_type === 'bug_report' && (
                                                        <span className="text-[10px] text-slate-500">
                                                            Urgensi: <strong>{fb.urgency_label}</strong>
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-extrabold px-3 py-0.5 rounded-full ${
                                                        fb.status === 'pending'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : fb.status === 'reviewed'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : fb.status === 'resolved'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {fb.status === 'pending' && 'Menunggu Review'}
                                                        {fb.status === 'reviewed' && 'Sedang Ditinjau'}
                                                        {fb.status === 'resolved' && 'Terselesaikan'}
                                                        {fb.status === 'dismissed' && 'Diarsipkan'}
                                                    </span>
                                                    <span className="text-[11px] text-slate-400">
                                                        {fb.created_at}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                                {fb.message}
                                            </p>

                                            {fb.page_url && (
                                                <div className="text-[11px] text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-xl inline-block border border-slate-200/60">
                                                    Halaman: {fb.page_url}
                                                </div>
                                            )}

                                            {/* Tanggapan Admin / Status Penanganan */}
                                            {fb.admin_notes && (
                                                <div className="mt-2 pt-2.5 border-t border-slate-200/80 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100 text-xs space-y-1">
                                                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 text-[11px]">
                                                        <ShieldCheck className="size-3.5 text-indigo-600" />
                                                        <span>Tanggapan Tim Pengembang:</span>
                                                    </div>
                                                    <p className="text-slate-700 leading-relaxed text-[11.5px]">
                                                        {fb.admin_notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center text-slate-400 space-y-2">
                                    <div className="size-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                                        <MessageSquare className="size-6" />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-600">Belum ada riwayat tiket laporan atau saran.</p>
                                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                                        Jika Anda menemukan bug atau memiliki ide pengembangan, kirimkan melalui formulir di atas.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('bug_report')}
                                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                                    >
                                        <span>Buat Laporan Kendala Pertama</span>
                                        <ArrowRight className="size-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
