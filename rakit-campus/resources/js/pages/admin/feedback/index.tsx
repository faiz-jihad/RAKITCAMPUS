import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Archive,
    Bug,
    CheckCircle2,
    Clock,
    Eye,
    ExternalLink,
    Filter,
    HelpCircle,
    Inbox,
    Lightbulb,
    MessageSquare,
    Palette,
    RefreshCw,
    Search,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Star,
    Trash2,
    User,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface FeedbackItem {
    id: number;
    user_id: number | null;
    user: {
        id: number;
        name: string;
        email: string;
        avatar?: string;
    } | null;
    name: string;
    email: string;
    category: string;
    category_label: string;
    feedback_type?: 'suggestion' | 'bug_report';
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    page_url?: string | null;
    admin_notes?: string | null;
    message: string;
    rating: number | null;
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    status_label: string;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    created_at_human: string;
}

interface Props {
    feedbacks: {
        data: FeedbackItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    statistics: {
        total: number;
        pending: number;
        reviewed: number;
        resolved: number;
        bugs: number;
        feature_requests: number;
        average_rating: number;
    };
    filters: {
        status?: string;
        category?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Panel Admin', href: '/admin' },
    { title: 'Saran & Masukan Sistem', href: '/admin/feedback' },
];

export default function AdminFeedbackIndex({ feedbacks, statistics, filters }: Props) {
    const { flash } = usePage<any>().props;

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [expandedMetaId, setExpandedMetaId] = useState<number | null>(null);

    const applyFilter = (newStatus?: string, newCategory?: string, newSearch?: string) => {
        router.get(
            '/admin/feedback',
            {
                status: newStatus !== undefined ? newStatus : selectedStatus,
                category: newCategory !== undefined ? newCategory : selectedCategory,
                search: newSearch !== undefined ? newSearch : searchQuery,
            },
            {
                preserveState: true,
                preserveScroll: true,
            }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter(selectedStatus, selectedCategory, searchQuery);
    };

    const handleUpdateStatus = (id: number, status: 'pending' | 'reviewed' | 'resolved' | 'dismissed', notes?: string) => {
        let adminNotes = notes;
        if (status === 'resolved' && adminNotes === undefined) {
            const promptNote = window.prompt('Tambahkan tanggapan tim untuk pengguna (Opsional):');
            if (promptNote !== null && promptNote.trim().length > 0) {
                adminNotes = promptNote.trim();
            }
        }
        setUpdatingId(id);
        router.patch(
            `/admin/feedback/${id}/status`,
            { status, ...(adminNotes !== undefined ? { admin_notes: adminNotes } : {}) },
            {
                preserveScroll: true,
                onFinish: () => setUpdatingId(null),
            }
        );
    };

    const handleDelete = (id: number) => {
        if (!confirm('Hapus masukan ini secara permanen dari sistem?')) return;
        setUpdatingId(id);
        router.delete(`/admin/feedback/${id}`, {
            preserveScroll: true,
            onFinish: () => setUpdatingId(null),
        });
    };

    const getCategoryBadge = (category: string) => {
        switch (category) {
            case 'kendala_bug':
                return {
                    label: 'Laporan Bug',
                    className: 'bg-rose-50 text-rose-700 border-rose-200',
                    icon: Bug,
                };
            case 'saran_fitur':
                return {
                    label: 'Saran Fitur',
                    className: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: Lightbulb,
                };
            case 'antarmuka_ui':
                return {
                    label: 'Desain UI/UX',
                    className: 'bg-purple-50 text-purple-700 border-purple-200',
                    icon: Palette,
                };
            case 'performa':
                return {
                    label: 'Performa Sistem',
                    className: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: Zap,
                };
            default:
                return {
                    label: 'Masukan Umum',
                    className: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: MessageSquare,
                };
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Menunggu Review',
                    className: 'bg-amber-50 text-amber-800 border-amber-200',
                };
            case 'reviewed':
                return {
                    label: 'Sedang Ditinjau',
                    className: 'bg-blue-50 text-blue-700 border-blue-200',
                };
            case 'resolved':
                return {
                    label: 'Terselesaikan',
                    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                };
            case 'dismissed':
                return {
                    label: 'Diarsipkan',
                    className: 'bg-slate-100 text-slate-500 border-slate-200',
                };
            default:
                return {
                    label: status,
                    className: 'bg-slate-100 text-slate-600 border-slate-200',
                };
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kotak Saran & Masukan — Admin RAKIT Campus" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {/* 1. HEADER ROW */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white">
                                <ShieldCheck className="size-3.5 text-blue-400" />
                                <span>Pusat Tata Kelola Platform</span>
                            </span>
                            <span className="text-xs text-slate-400 font-medium">• Masukan & Aspirasi Mahasiswa</span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">
                            Kotak Saran & Masukan Sistem
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pantau aspirasi pengguna, laporan kendala teknis (bug), saran fitur baru, serta kepuasan platform.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <span>Panel Admin</span>
                        </Link>
                        <button
                            type="button"
                            onClick={() => router.reload()}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        >
                            <RefreshCw className="size-3.5" />
                            <span>Segarkan</span>
                        </button>
                    </div>
                </div>

                {/* FLASH BANNERS */}
                {flash?.success && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* 2. STATS OVERVIEW CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                    {/* Total Masukan */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Masukan</span>
                            <Inbox className="size-4 text-blue-600" />
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-black text-slate-900 tracking-tight">{statistics.total}</div>
                            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Semua kategori</span>
                        </div>
                    </div>

                    {/* Menunggu Review */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Belum Ditinjau</span>
                            <Clock className="size-4 text-amber-500" />
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-black text-slate-900 tracking-tight">{statistics.pending}</div>
                            <span className="text-[11px] font-bold block mt-0.5">
                                {statistics.pending > 0 ? (
                                    <span className="text-amber-600">{statistics.pending} butuh perhatian</span>
                                ) : (
                                    <span className="text-slate-400">Semua telah ditinjau</span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Laporan Bug */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Laporan Bug</span>
                            <Bug className="size-4 text-rose-600" />
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-black text-slate-900 tracking-tight">{statistics.bugs}</div>
                            <span className="text-[11px] text-rose-600 font-semibold block mt-0.5">Kendala teknis</span>
                        </div>
                    </div>

                    {/* Usulan Fitur Baru */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Usulan Fitur</span>
                            <Lightbulb className="size-4 text-blue-600" />
                        </div>
                        <div className="mt-3">
                            <div className="text-2xl font-black text-slate-900 tracking-tight">{statistics.feature_requests}</div>
                            <span className="text-[11px] text-blue-600 font-medium block mt-0.5">Ide pengembangan</span>
                        </div>
                    </div>

                    {/* Rating Kepuasan */}
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kepuasan Sistem</span>
                            <Star className="size-4 text-amber-400 fill-amber-400" />
                        </div>
                        <div className="mt-3">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-slate-900 tracking-tight">
                                    {statistics.average_rating > 0 ? statistics.average_rating : '-'}
                                </span>
                                {statistics.average_rating > 0 && (
                                    <span className="text-xs text-slate-500 font-semibold">/ 5.0</span>
                                )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Skor rerata bintang</span>
                        </div>
                    </div>
                </div>

                {/* 3. FILTERS & SEARCH BAR */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                        {[
                            { id: 'all', label: 'Semua Status' },
                            { id: 'pending', label: 'Menunggu' },
                            { id: 'reviewed', label: 'Ditinjau' },
                            { id: 'resolved', label: 'Selesai' },
                            { id: 'dismissed', label: 'Arsip' },
                        ].map((st) => (
                            <button
                                key={st.id}
                                type="button"
                                onClick={() => {
                                    setSelectedStatus(st.id);
                                    applyFilter(st.id, selectedCategory, searchQuery);
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                                    selectedStatus === st.id
                                        ? 'bg-slate-900 text-white shadow-2xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>

                    {/* Category Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                applyFilter(selectedStatus, e.target.value, searchQuery);
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                            <option value="all">Semua Kategori</option>
                            <option value="saran_fitur">Saran Fitur Baru</option>
                            <option value="antarmuka_ui">Desain & Tampilan</option>
                            <option value="kendala_bug">Laporan Kendala / Bug</option>
                            <option value="performa">Kecepatan & Performa</option>
                            <option value="lainnya">Lainnya</option>
                        </select>

                        <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-56">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama, email, isi pesan..."
                                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                            <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </form>
                    </div>
                </div>

                {/* 4. FEEDBACK LIST CARDS */}
                {feedbacks.data && feedbacks.data.length > 0 ? (
                    <div className="space-y-3.5">
                        {feedbacks.data.map((item) => {
                            const catBadge = getCategoryBadge(item.category);
                            const CatIcon = catBadge.icon;
                            const statBadge = getStatusBadge(item.status);
                            const isUpdating = updatingId === item.id;
                            const isMetaExpanded = expandedMetaId === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between gap-3.5"
                                >
                                    {/* Top Row: User & Meta */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="size-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                                                {item.user ? item.name.charAt(0).toUpperCase() : <User className="size-4 text-slate-400" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{item.name}</h3>
                                                    {item.user && (
                                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                            Terdaftar
                                                        </span>
                                                    )}
                                                    <span className="text-[11px] text-slate-400">• {item.email}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-medium">
                                                    {item.created_at} ({item.created_at_human})
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                            {/* Type Badge */}
                                            {item.feedback_type === 'bug_report' && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-300 text-rose-700">
                                                    <Bug className="size-3" />
                                                    <span>BUG</span>
                                                </span>
                                            )}

                                            {/* Urgency Badge */}
                                            {item.urgency && item.feedback_type === 'bug_report' && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                                    item.urgency === 'high' || item.urgency === 'critical'
                                                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                                                        : item.urgency === 'low'
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                                }`}>
                                                    <span>{item.urgency === 'high' || item.urgency === 'critical' ? 'Kritis' : item.urgency === 'low' ? 'Ringan' : 'Sedang'}</span>
                                                </span>
                                            )}

                                            {/* Category Badge */}
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catBadge.className}`}
                                            >
                                                <CatIcon className="size-3" />
                                                <span>{catBadge.label}</span>
                                            </span>

                                            {/* Rating Stars */}
                                            {item.rating && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                                                    <Star className="size-3 fill-amber-400 text-amber-400" />
                                                    <span>{item.rating}/5</span>
                                                </span>
                                            )}

                                            {/* Status Badge */}
                                            <span
                                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statBadge.className}`}
                                            >
                                                {statBadge.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Message Body */}
                                    <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/60 text-xs sm:text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
                                        "{item.message}"
                                    </div>

                                    {/* Related Page URL */}
                                    {item.page_url && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
                                            <ExternalLink className="size-3 text-slate-400 shrink-0" />
                                            <span className="font-semibold text-slate-700">Tautan:</span>
                                            <a href={item.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                                                {item.page_url}
                                            </a>
                                        </div>
                                    )}

                                    {/* Admin Response Note */}
                                    {item.admin_notes && (
                                        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-slate-700 space-y-1">
                                            <div className="flex items-center gap-1 font-bold text-blue-800 text-[11px]">
                                                <ShieldCheck className="size-3.5" />
                                                <span>Tanggapan Admin / Tim Pengembang:</span>
                                            </div>
                                            <p className="text-slate-800">{item.admin_notes}</p>
                                        </div>
                                    )}

                                    {/* Technical Drawer (IP & User Agent) */}
                                    {isMetaExpanded && (
                                        <div className="p-3 rounded-xl bg-slate-900 text-slate-300 text-[11px] space-y-1 font-mono">
                                            <div>
                                                <span className="text-slate-500 font-bold">IP Address:</span>{' '}
                                                {item.ip_address || '127.0.0.1'}
                                            </div>
                                            <div className="break-all">
                                                <span className="text-slate-500 font-bold">User Agent:</span>{' '}
                                                {item.user_agent || '-'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bottom Action Row */}
                                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedMetaId(isMetaExpanded ? null : item.id)}
                                            className="text-[11px] font-medium text-slate-400 hover:text-slate-700 flex items-center gap-1 transition"
                                        >
                                            <Eye className="size-3" />
                                            <span>{isMetaExpanded ? 'Sembunyikan Info Teknis' : 'Info Teknis (IP & Browser)'}</span>
                                        </button>

                                        <div className="flex items-center gap-1.5">
                                            {item.status !== 'reviewed' && (
                                                <button
                                                    type="button"
                                                    disabled={isUpdating}
                                                    onClick={() => handleUpdateStatus(item.id, 'reviewed')}
                                                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                                                >
                                                    Tandai Ditinjau
                                                </button>
                                            )}

                                            {item.status !== 'resolved' && (
                                                <button
                                                    type="button"
                                                    disabled={isUpdating}
                                                    onClick={() => handleUpdateStatus(item.id, 'resolved')}
                                                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                                                >
                                                    Tandai Selesai
                                                </button>
                                            )}

                                            {item.status !== 'dismissed' && (
                                                <button
                                                    type="button"
                                                    disabled={isUpdating}
                                                    onClick={() => handleUpdateStatus(item.id, 'dismissed')}
                                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                                >
                                                    <Archive className="size-3" />
                                                    <span>Arsipkan</span>
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                disabled={isUpdating}
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer"
                                                title="Hapus masukan"
                                            >
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Pagination */}
                        {feedbacks.last_page > 1 && (
                            <div className="flex items-center justify-center gap-1 pt-4">
                                {feedbacks.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                            link.active
                                                ? 'bg-slate-900 text-white'
                                                : link.url
                                                ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                                : 'text-slate-300 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Empty State */
                    <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200/80 shadow-2xs text-center flex flex-col items-center">
                        <div className="size-12 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mb-3">
                            <Inbox className="size-6" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Belum Ada Masukan atau Laporan</h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                            Tidak ditemukan data saran atau laporan kendala pada filter ini. Masukan yang dikirim melalui formulir
                            landing page akan otomatis muncul di sini.
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
