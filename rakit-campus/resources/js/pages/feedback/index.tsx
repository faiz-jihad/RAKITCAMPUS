import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { useState } from 'react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Bug,
    CheckCircle2,
    Clock,
    HelpCircle,
    Info,
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
    const { auth, flash } = usePage<SharedData>().props;

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
        { title: 'Pusat Bantuan & Laporan', href: '/feedback' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pusat Bantuan & Laporan Kendala - RAKIT Campus" />

            <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
                                    <ShieldCheck className="size-3.5" />
                                    <span>Pusat Kendali Feedback & Laporan</span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                                    Bantuan, Saran & Laporan Sistem
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl leading-relaxed">
                                    Kami berkomitmen menjaga kelancaran kompetisi dan kolaborasi Anda.
                                    Laporkan bug teknis atau bagikan ide fitur baru tanpa rasa ragu.
                                </p>
                            </div>
                            <div className="flex sm:flex-col items-end gap-2 shrink-0">
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer"
                                >
                                    <ArrowLeft className="size-3.5" />
                                    <span>Kembali ke Dashboard</span>
                                </Link>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('bug_report');
                                    setSubmittedTicket(null);
                                }}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'bug_report'
                                        ? 'bg-rose-500 text-white shadow-sm ring-2 ring-rose-400/40'
                                        : 'bg-white/10 text-slate-200 hover:bg-white/15'
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
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'suggestion'
                                        ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                                        : 'bg-white/10 text-slate-200 hover:bg-white/15'
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
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                        activeTab === 'history'
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'bg-white/10 text-slate-200 hover:bg-white/15'
                                    }`}
                                >
                                    <Clock className="size-3.5" />
                                    <span>Riwayat Tiket Saya</span>
                                    {myFeedbacks.length > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                                            activeTab === 'history' ? 'bg-slate-200 text-slate-900' : 'bg-white/20 text-white'
                                        }`}>
                                            {myFeedbacks.length}
                                        </span>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* SUCCESS RECEIPT BANNER */}
                    {submittedTicket && (
                        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                        <CheckCircle2 className="size-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                                {submittedTicket.type === 'bug_report'
                                                    ? 'Laporan Kendala Berhasil Diterima'
                                                    : 'Saran & Ide Berhasil Dicatat'}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
                                                {submittedTicket.code}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                                            {submittedTicket.type === 'bug_report'
                                                ? 'Laporan Anda sudah masuk ke antrean investigasi tim teknis. Kami akan segera menganalisis kendala tersebut.'
                                                : 'Terima kasih atas aspirasi Anda! Saran ini ditinjau untuk peningkatan rilis sistem berikutnya.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                    {auth?.user && (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('history')}
                                            className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold transition cursor-pointer shadow-2xs w-full sm:w-auto text-center"
                                        >
                                            Pantau di Riwayat →
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSubmittedTicket(null)}
                                        className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium transition cursor-pointer"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 1: LAPOR KENDALA / BUG */}
                    {activeTab === 'bug_report' && (
                        <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-xs overflow-hidden">
                            <div className="bg-rose-50/70 border-b border-rose-100 p-4 sm:p-5 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                                        <Bug className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">
                                            Formulir Laporan Kendala & Bug Sistem
                                        </h2>
                                        <p className="text-[11px] text-slate-500">
                                            Pastikan rincian kendala lengkap agar dapat segera direproduksi dan diperbaiki.
                                        </p>
                                    </div>
                                </div>
                                <span className="hidden sm:inline-block text-[11px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                                    Prioritas Cepat
                                </span>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                                {/* Tingkat Keparahan / Urgensi */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-2">
                                        Tingkat Urgensi Kendala <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {[
                                            {
                                                id: 'low',
                                                label: 'Rendah (Minor)',
                                                desc: 'Tampilan kurang pas, typo, atau glitch visual tidak fatal',
                                                badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                            },
                                            {
                                                id: 'medium',
                                                label: 'Sedang (Normal)',
                                                desc: 'Fitur terganggu, tapi masih bisa lanjut menggunakan alur lain',
                                                badge: 'bg-amber-50 text-amber-700 border-amber-200',
                                            },
                                            {
                                                id: 'high',
                                                label: 'Tinggi / Kritis',
                                                desc: 'Error 500, data hilang, atau proses terblokir total',
                                                badge: 'bg-rose-50 text-rose-700 border-rose-200',
                                            },
                                        ].map((u) => (
                                            <button
                                                key={u.id}
                                                type="button"
                                                onClick={() => setUrgency(u.id as any)}
                                                className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                                                    urgency === u.id
                                                        ? 'bg-rose-50/60 border-rose-500 shadow-xs ring-1 ring-rose-500'
                                                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-900">{u.label}</span>
                                                    <div
                                                        className={`size-3.5 rounded-full border flex items-center justify-center ${
                                                            urgency === u.id
                                                                ? 'border-rose-600 bg-rose-600'
                                                                : 'border-slate-300'
                                                        }`}
                                                    >
                                                        {urgency === u.id && <div className="size-1.5 rounded-full bg-white" />}
                                                    </div>
                                                </div>
                                                <p className="text-[10.5px] text-slate-500 mt-1 leading-snug">
                                                    {u.desc}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* URL / Halaman Terkait */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Tautan / Halaman yang Bermasalah <span className="text-slate-400 font-normal">(Opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={pageUrl}
                                        onChange={(e) => setPageUrl(e.target.value)}
                                        placeholder="Contoh: /competition-workspace/gdoc-itb-hackathon-2sbjyf atau /projects/show/..."
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition"
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
                                        placeholder="1. Apa yang sedang Anda lakukan sebelum kendala muncul?&#10;2. Pesan error atau perilaku janggal apa yang terjadi?&#10;3. Perangkat / browser apa yang Anda gunakan?"
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition resize-none leading-relaxed font-sans"
                                    />
                                    {errorMessage && (
                                        <p className="text-xs text-rose-600 font-medium mt-1">{errorMessage}</p>
                                    )}
                                </div>

                                {/* Nama & Kontak */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Nama Pelapor <span className="text-slate-400 font-normal">(Opsional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder={auth?.user?.name || 'Nama Anda'}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Email Kontak Balasan <span className="text-slate-400 font-normal">(Opsional)</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={auth?.user?.email || 'email@kampus.ac.id'}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition"
                                        />
                                    </div>
                                </div>

                                {/* Submit button */}
                                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                                        <ShieldAlert className="size-3.5 text-rose-500" />
                                        <span>Laporan akan otomatis diberikan nomor tiket unik dan dicatat di server.</span>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting || message.trim().length < 5}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
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
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                            <div className="bg-slate-50/80 border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                        <Lightbulb className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">
                                            Kotak Aspirasi & Saran Pengembangan
                                        </h2>
                                        <p className="text-[11px] text-slate-500">
                                            Bagikan ide kreatif untuk fitur baru, desain antarmuka, atau kenyamanan pengguna.
                                        </p>
                                    </div>
                                </div>
                                <span className="hidden sm:inline-block text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                                    Pengembangan
                                </span>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                                {/* Kategori */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-2">
                                        Kategori Masukan <span className="text-blue-600">*</span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { id: 'saran_fitur', label: '💡 Saran Fitur Baru' },
                                            { id: 'antarmuka_ui', label: '🎨 Desain & Tampilan' },
                                            { id: 'performa', label: '⚡ Kecepatan & Performa' },
                                            { id: 'lainnya', label: '💬 Saran Lainnya' },
                                        ].map((cat) => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setCategory(cat.id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                                    category === cat.id
                                                        ? 'bg-blue-50 border border-blue-600 text-blue-700 shadow-2xs'
                                                        : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Rating Kepuasan Sistem */}
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                        Bagaimana kepuasan Anda terhadap RAKIT Campus sejauh ini? <span className="text-slate-400 font-normal">(Opsional)</span>
                                    </label>
                                    <div className="flex items-center gap-1.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(rating === star ? null : star)}
                                                className="p-1 rounded-md hover:bg-slate-100 transition cursor-pointer text-slate-300 hover:text-amber-400"
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
                                            Detail Saran & Ide Fitur <span className="text-rose-500">*</span>
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
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition resize-none leading-relaxed font-sans"
                                    />
                                    {errorMessage && (
                                        <p className="text-xs text-rose-600 font-medium mt-1">{errorMessage}</p>
                                    )}
                                </div>

                                {/* Nama & Kontak */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Nama Anda <span className="text-slate-400 font-normal">(Opsional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder={auth?.user?.name || 'Nama Anda'}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">
                                            Email Kontak <span className="text-slate-400 font-normal">(Opsional)</span>
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder={auth?.user?.email || 'email@kampus.ac.id'}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                        />
                                    </div>
                                </div>

                                {/* Submit button */}
                                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <p className="text-[11px] text-slate-500">
                                        Setiap saran ditinjau berkala untuk pembaruan fitur platform RAKIT Campus.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={submitting || message.trim().length < 5}
                                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                                    >
                                        {submitting ? (
                                            <>
                                                <RotateCw className="size-3.5 animate-spin" />
                                                <span>Mengirim Saran...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Lightbulb className="size-3.5" />
                                                <span>Kirim Saran & Ide</span>
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
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                            <div className="bg-slate-50/80 border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-xs">
                                        <Clock className="size-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">
                                            Status & Riwayat Laporan Anda
                                        </h2>
                                        <p className="text-[11px] text-slate-500">
                                            Pantau proses penanganan tiket kendala dan status saran yang Anda kirimkan.
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-slate-700">
                                    Total: {myFeedbacks.length} Tiket
                                </span>
                            </div>

                            <div className="p-4 sm:p-6">
                                {myFeedbacks.length > 0 ? (
                                    <div className="space-y-3">
                                        {myFeedbacks.map((fb) => (
                                            <div
                                                key={fb.id}
                                                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/40 space-y-2.5"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                                                            {fb.ticket_code}
                                                        </span>
                                                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${
                                                            fb.feedback_type === 'bug_report'
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                                        }`}>
                                                            {fb.feedback_type === 'bug_report' ? '🚨 Kendala / Bug' : '💡 Saran Fitur'}
                                                        </span>
                                                        {fb.urgency && fb.feedback_type === 'bug_report' && (
                                                            <span className="text-[10px] text-slate-500">
                                                                Urgensi: <strong>{fb.urgency_label}</strong>
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${
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
                                                        <span className="text-[10px] text-slate-400">
                                                            {fb.created_at}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                                                    {fb.message}
                                                </p>

                                                {fb.page_url && (
                                                    <div className="text-[11px] text-slate-500 font-mono bg-slate-100/80 px-2.5 py-1 rounded inline-block">
                                                        Halaman: {fb.page_url}
                                                    </div>
                                                )}

                                                {/* Catatan Admin / Status Penanganan */}
                                                {fb.admin_notes && (
                                                    <div className="mt-2 pt-2 border-t border-slate-200/80 bg-blue-50/60 p-2.5 rounded-lg border border-blue-100 text-xs">
                                                        <div className="flex items-center gap-1.5 font-bold text-blue-800 text-[11px] mb-1">
                                                            <ShieldCheck className="size-3.5" />
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
                                    <div className="py-12 text-center text-slate-400">
                                        <MessageSquare className="size-8 mx-auto mb-2 text-slate-300" />
                                        <p className="text-xs font-medium">Anda belum pernah mengirim laporan atau saran.</p>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('bug_report')}
                                            className="mt-3 text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                                        >
                                            Buat Laporan Kendala Pertama →
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
