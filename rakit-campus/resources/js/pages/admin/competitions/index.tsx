import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Edit3,
    ExternalLink,
    Filter,
    Image as ImageIcon,
    Plus,
    RotateCw,
    Search,
    ShieldCheck,
    Trash2,
    Trophy,
    Upload,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface CompetitionItem {
    id: number;
    name: string;
    slug: string;
    organizer: string;
    description?: string;
    category: string;
    category_label: string;
    level: string;
    competition_type: string;
    scope: string;
    status: string;
    verification_status: string;
    registration_opens_at?: string;
    registration_deadline: string;
    starts_at?: string;
    ends_at?: string;
    days_remaining: number | null;
    min_team_size: number;
    max_team_size: number;
    prize_info?: string;
    official_url?: string;
    registration_url?: string;
    participations_count: number;
    campus_name?: string;
    cover_image?: string | null;
    cover_image_url?: string | null;
}

interface Props {
    competitions: {
        data: CompetitionItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
    filters: {
        search?: string;
        category?: string;
        status?: string;
        level?: string;
    };
    categories: string[];
    statuses: string[];
    levels: string[];
    stats: {
        total: number;
        open: number;
        upcoming: number;
        closed: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Campus Admin', href: '/admin' },
    { title: 'Kelola Kompetisi', href: '/admin/competitions' },
];

export default function AdminCompetitionsIndex({
    competitions,
    filters,
    categories = [],
    statuses = [],
    levels = [],
    stats,
}: Props) {
    const { flash } = usePage().props as any;

    const [search, setSearch] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingCompetition, setEditingCompetition] = useState<CompetitionItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // Create Form State
    const [createForm, setCreateForm] = useState({
        name: '',
        organizer: '',
        description: '',
        category: 'technology',
        level: 'national',
        competition_type: 'team',
        scope: 'global',
        status: 'open',
        registration_opens_at: new Date().toISOString().split('T')[0],
        registration_deadline: '2027-05-30',
        starts_at: '2027-06-01',
        ends_at: '2027-06-30',
        min_team_size: 1,
        max_team_size: 5,
        prize_info: '',
        official_url: '',
        registration_url: '',
        eligibility: 'Mahasiswa aktif D3/D4/S1 seluruh Indonesia',
        cover_image: null as File | null,
    });

    // Edit Form State
    const [editForm, setEditForm] = useState<any>({});

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/competitions',
            {
                search,
                category: selectedCategory,
                status: selectedStatus,
            },
            { preserveState: true }
        );
    };

    const handleResetFilter = () => {
        setSearch('');
        setSelectedCategory('');
        setSelectedStatus('');
        router.get('/admin/competitions');
    };

    const openEditModal = (comp: CompetitionItem) => {
        setEditingCompetition(comp);
        setEditForm({
            name: comp.name,
            organizer: comp.organizer,
            description: comp.description || '',
            category: comp.category,
            level: comp.level || 'national',
            competition_type: comp.competition_type || 'team',
            status: comp.status,
            verification_status: comp.verification_status,
            registration_opens_at: comp.registration_opens_at || '',
            registration_deadline: comp.registration_deadline || '',
            starts_at: comp.starts_at || '',
            ends_at: comp.ends_at || '',
            min_team_size: comp.min_team_size || 1,
            max_team_size: comp.max_team_size || 5,
            prize_info: comp.prize_info || '',
            official_url: comp.official_url || '',
            registration_url: comp.registration_url || '',
            eligibility: '',
            cover_image: null as File | null,
            remove_cover_image: false,
        });
        setFormErrors({});
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormErrors({});

        router.post('/admin/competitions', createForm, {
            forceFormData: true,
            onSuccess: () => {
                setIsCreateModalOpen(false);
                setSubmitting(false);
            },
            onError: (errs) => {
                setFormErrors(errs);
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCompetition) return;

        setSubmitting(true);
        setFormErrors({});

        router.post(`/admin/competitions/${editingCompetition.slug || editingCompetition.id}`, {
            ...editForm,
            _method: 'PUT',
        }, {
            forceFormData: true,
            onSuccess: () => {
                setEditingCompetition(null);
                setSubmitting(false);
            },
            onError: (errs) => {
                setFormErrors(errs);
                setSubmitting(false);
            },
            onFinish: () => setSubmitting(false),
        });
    };

    const handleQuickExtend = (id: number | string, days: number) => {
        if (!confirm(`Perpanjang batas pendaftaran kompetisi ini sebanyak ${days} hari?`)) return;

        router.patch(`/admin/competitions/${id}/status`, { extend_days: days }, { preserveScroll: true });
    };

    const handleDelete = (id: number | string, name: string) => {
        if (!confirm(`Hapus kompetisi "${name}" dari sistem? Tindakan ini dapat dibatalkan melalui pemulihan data.`)) return;

        router.delete(`/admin/competitions/${id}`, { preserveScroll: true });
    };

    const getStatusBadge = (status: string, daysRemaining: number | null) => {
        if (status === 'closed' || (daysRemaining !== null && daysRemaining < 0)) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Pendaftaran Ditutup
                </span>
            );
        }
        if (status === 'open') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Pendaftaran Aktif
                </span>
            );
        }
        if (status === 'upcoming') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Segera Dibuka
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {status.toUpperCase()}
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kelola Kompetisi & Masa Aktif — Admin RAKIT Campus" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
                {/* 1. Header (Minimal Title Only) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Kelola Kompetisi & Masa Aktif
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setIsCreateModalOpen(true);
                            setFormErrors({});
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer self-start sm:self-auto"
                    >
                        <Plus className="size-3.5" />
                        <span>Buat Kompetisi Baru</span>
                    </button>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-800 flex items-center gap-2">
                        <AlertCircle className="size-4 shrink-0 text-rose-600" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* 2. Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Kompetisi</span>
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stats.total}</div>
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                        <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">Pendaftaran Aktif</span>
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stats.open}</div>
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                        <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">Segera Dibuka</span>
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stats.upcoming}</div>
                    </div>
                    <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Ditutup / Selesai</span>
                        <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{stats.closed}</div>
                    </div>
                </div>

                {/* 3. Search and Filters */}
                <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama kompetisi, penyelenggara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                        />
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                router.get(
                                    '/admin/competitions',
                                    { search, category: e.target.value, status: selectedStatus },
                                    { preserveState: true }
                                );
                            }}
                            className="text-xs bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition cursor-pointer"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c.replace('_', ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                router.get(
                                    '/admin/competitions',
                                    { search, category: selectedCategory, status: e.target.value },
                                    { preserveState: true }
                                );
                            }}
                            className="text-xs bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition cursor-pointer"
                        >
                            <option value="">Semua Status</option>
                            {statuses.map((s) => (
                                <option key={s} value={s}>
                                    {s.replace('_', ' ').toUpperCase()}
                                </option>
                            ))}
                        </select>

                        {(search || selectedCategory || selectedStatus) && (
                            <button
                                type="button"
                                onClick={handleResetFilter}
                                className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                            >
                                Reset
                            </button>
                        )}
                    </div>
                </div>

                {/* 4. Table of Competitions */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                                    <th className="py-3 px-4">Nama Kompetisi</th>
                                    <th className="py-3 px-4">Batas Akhir (Deadline)</th>
                                    <th className="py-3 px-4">Status & Sisa Waktu</th>
                                    <th className="py-3 px-4">Pelaksanaan</th>
                                    <th className="py-3 px-4 text-right">Aksi Manajemen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {competitions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-400">
                                            Tidak ada data kompetisi yang sesuai kriteria pencarian.
                                        </td>
                                    </tr>
                                ) : (
                                    competitions.data.map((comp) => (
                                        <tr key={comp.id} className="hover:bg-slate-50/60 transition">
                                            {/* Nama & Penyelenggara */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    {comp.cover_image ? (
                                                        <img
                                                            src={comp.cover_image}
                                                            alt={comp.name}
                                                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 text-blue-600 shadow-2xs">
                                                            <Trophy className="size-5" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-slate-900 truncate max-w-[260px] sm:max-w-[340px]">{comp.name}</div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                                            <span>{comp.organizer}</span>
                                                            <span>•</span>
                                                            <span className="capitalize">{comp.level}</span>
                                                            <span>•</span>
                                                            <span className="text-blue-600 font-medium">{comp.category_label}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Deadline Pendaftaran */}
                                            <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                                                {comp.registration_deadline || '-'}
                                            </td>

                                            {/* Status & Sisa Hari */}
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    {getStatusBadge(comp.status, comp.days_remaining)}
                                                    {comp.days_remaining !== null && (
                                                        <span
                                                            className={`text-[10px] font-medium ${
                                                                comp.days_remaining < 0
                                                                    ? 'text-rose-600'
                                                                    : comp.days_remaining <= 30
                                                                    ? 'text-amber-600 font-bold'
                                                                    : 'text-slate-500'
                                                            }`}
                                                        >
                                                            {comp.days_remaining < 0
                                                                ? `Lewat ${Math.abs(comp.days_remaining)} hari`
                                                                : `Sisa ${comp.days_remaining} hari`}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Periode Pelaksanaan */}
                                            <td className="py-3 px-4 text-slate-600">
                                                {comp.starts_at ? (
                                                    <span className="font-mono text-[11px]">
                                                        {comp.starts_at} s/d {comp.ends_at || 'Selesai'}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic">Belum ditentukan</span>
                                                )}
                                            </td>

                                            {/* Action Buttons */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="inline-flex items-center gap-1.5 justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(comp)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold transition cursor-pointer"
                                                        title="Atur Masa Aktif & Detail"
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                        <span>Atur Masa Aktif</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleQuickExtend(comp.slug || comp.id, 30)}
                                                        className="px-2 py-1 rounded-md bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200/80 font-medium transition cursor-pointer"
                                                        title="Perpanjang deadline pendaftaran 30 hari"
                                                    >
                                                        +30 Hari
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(comp.slug || comp.id, comp.name)}
                                                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                        title="Hapus Kompetisi"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {competitions.last_page > 1 && (
                        <div className="p-3.5 border-t border-slate-200/80 flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                                Menampilkan {competitions.data.length} dari {competitions.total} kompetisi
                            </span>
                            <div className="flex items-center gap-1">
                                {competitions.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL 1: BUAT KOMPETISI BARU (ADMIN) */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Buat & Terbitkan Kompetisi Baru</h3>
                                <p className="text-xs text-slate-500">Didaftarkan langsung oleh Administrator Kampus</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                            {/* Nama & Penyelenggara */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Nama Kompetisi <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.name}
                                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                        placeholder="Contoh: GEMASTIK XIX 2027"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                    {formErrors.name && <p className="text-rose-600 mt-1 font-medium">{formErrors.name}</p>}
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">
                                        Penyelenggara / Institusi <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={createForm.organizer}
                                        onChange={(e) => setCreateForm({ ...createForm, organizer: e.target.value })}
                                        placeholder="Contoh: Puspresnas / Kemendikbudristek"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                    {formErrors.organizer && <p className="text-rose-600 mt-1 font-medium">{formErrors.organizer}</p>}
                                </div>
                            </div>

                            {/* Kategori, Tingkat, Tipe */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                                    <select
                                        value={createForm.category}
                                        onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c.replace('_', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Tingkat</label>
                                    <select
                                        value={createForm.level}
                                        onChange={(e) => setCreateForm({ ...createForm, level: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                    >
                                        <option value="national">Nasional</option>
                                        <option value="international">Internasional</option>
                                        <option value="regional">Regional</option>
                                        <option value="local">Lokal / Kampus</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Status Awal</label>
                                    <select
                                        value={createForm.status}
                                        onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                    >
                                        <option value="open">Pendaftaran Aktif (Open)</option>
                                        <option value="upcoming">Segera Dibuka (Upcoming)</option>
                                        <option value="closed">Ditutup (Closed)</option>
                                    </select>
                                </div>
                            </div>

                            {/* PENGATURAN MASA AKTIF & DEADLINE */}
                            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="size-4 text-blue-600" />
                                    <span className="font-bold text-slate-900 text-xs">Pengaturan Masa Aktif & Deadline</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">
                                            Tanggal Buka Pendaftaran
                                        </label>
                                        <input
                                            type="date"
                                            value={createForm.registration_opens_at}
                                            onChange={(e) => setCreateForm({ ...createForm, registration_opens_at: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-900 mb-1">
                                            Batas Akhir (Deadline Pendaftaran) <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={createForm.registration_deadline}
                                            onChange={(e) => setCreateForm({ ...createForm, registration_deadline: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                        {formErrors.registration_deadline && (
                                            <p className="text-rose-600 mt-1 font-medium">{formErrors.registration_deadline}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-blue-100">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">
                                            Mulai Pelaksanaan Lomba
                                        </label>
                                        <input
                                            type="date"
                                            value={createForm.starts_at}
                                            onChange={(e) => setCreateForm({ ...createForm, starts_at: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">
                                            Selesai Pelaksanaan Lomba
                                        </label>
                                        <input
                                            type="date"
                                            value={createForm.ends_at}
                                            onChange={(e) => setCreateForm({ ...createForm, ends_at: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Kapasitas Anggota & Hadiah */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Min. Anggota Tim</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={createForm.min_team_size}
                                        onChange={(e) => setCreateForm({ ...createForm, min_team_size: parseInt(e.target.value, 10) || 1 })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Max. Anggota Tim</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={createForm.max_team_size}
                                        onChange={(e) => setCreateForm({ ...createForm, max_team_size: parseInt(e.target.value, 10) || 1 })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Total Hadiah / Benefit</label>
                                    <input
                                        type="text"
                                        value={createForm.prize_info}
                                        onChange={(e) => setCreateForm({ ...createForm, prize_info: e.target.value })}
                                        placeholder="Contoh: Rp 150.000.000 + Medali"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                </div>
                            </div>

                            {/* URLs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Website Resmi Lomba</label>
                                    <input
                                        type="url"
                                        value={createForm.official_url}
                                        onChange={(e) => setCreateForm({ ...createForm, official_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Tautan Pendaftaran</label>
                                    <input
                                        type="url"
                                        value={createForm.registration_url}
                                        onChange={(e) => setCreateForm({ ...createForm, registration_url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                </div>
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat Kompetisi</label>
                                <textarea
                                    rows={3}
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    placeholder="Jelaskan ringkasan perlombaan, cabang kompetisi, dan tema utama..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none leading-relaxed"
                                />
                            </div>

                            {/* Gambar Poster / Banner Lomba */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Poster / Gambar Sampul Lomba (Opsional)
                                </label>
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setCreateForm({ ...createForm, cover_image: file });
                                        }}
                                        className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                    <p className="text-[11px] text-slate-400">
                                        Format: PNG, JPG, JPEG, WEBP. Maksimal ukuran 4MB. Direkomendasikan rasio 4:5 (portrait) atau 16:9.
                                    </p>
                                    {formErrors.cover_image && (
                                        <p className="text-rose-600 text-xs font-medium mt-1">{formErrors.cover_image}</p>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer Buttons */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting && <RotateCw className="size-3.5 animate-spin" />}
                                    <span>Terbitkan Kompetisi</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: EDIT MASA AKTIF & DETAIL KOMPETISI (ADMIN) */}
            {editingCompetition && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Atur Masa Aktif & Detail Kompetisi</h3>
                                <p className="text-xs text-slate-500 font-mono">{editingCompetition.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditingCompetition(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                            {/* PENGATURAN MASA AKTIF & DEADLINE (HIGHLIGHTED) */}
                            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="size-4 text-blue-600" />
                                        <span className="font-bold text-slate-900 text-xs">Masa Aktif & Batas Deadline</span>
                                    </div>
                                    <span className="text-[11px] text-blue-700 font-semibold">
                                        Status: {editForm.status?.toUpperCase()}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">
                                            Tanggal Buka Pendaftaran
                                        </label>
                                        <input
                                            type="date"
                                            value={editForm.registration_opens_at || ''}
                                            onChange={(e) => setEditForm({ ...editForm, registration_opens_at: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-blue-900 mb-1">
                                            Batas Akhir (Deadline Pendaftaran) *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={editForm.registration_deadline || ''}
                                            onChange={(e) => setEditForm({ ...editForm, registration_deadline: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white border border-blue-400 rounded-lg text-blue-900 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        />
                                        {formErrors.registration_deadline && (
                                            <p className="text-rose-600 mt-1 font-medium">{formErrors.registration_deadline}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Extend Buttons */}
                                <div className="pt-2 border-t border-blue-100 flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 font-medium">Perpanjang Cepat:</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const current = new Date(editForm.registration_deadline || new Date());
                                            current.setDate(current.getDate() + 14);
                                            setEditForm({ ...editForm, registration_deadline: current.toISOString().split('T')[0], status: 'open' });
                                        }}
                                        className="px-2 py-0.5 rounded bg-white hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-semibold transition cursor-pointer"
                                    >
                                        +14 Hari
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const current = new Date(editForm.registration_deadline || new Date());
                                            current.setDate(current.getDate() + 30);
                                            setEditForm({ ...editForm, registration_deadline: current.toISOString().split('T')[0], status: 'open' });
                                        }}
                                        className="px-2 py-0.5 rounded bg-white hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-semibold transition cursor-pointer"
                                    >
                                        +30 Hari
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditForm({ ...editForm, registration_deadline: '2027-06-30', status: 'open' });
                                        }}
                                        className="px-2 py-0.5 rounded bg-white hover:bg-blue-100 border border-blue-200 text-blue-700 text-[10px] font-semibold transition cursor-pointer"
                                    >
                                        Set ke Juni 2027
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-blue-100">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">
                                            Mulai Pelaksanaan Lomba
                                        </label>
                                        <input
                                            type="date"
                                            value={editForm.starts_at || ''}
                                            onChange={(e) => setEditForm({ ...editForm, starts_at: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">
                                            Selesai Pelaksanaan Lomba
                                        </label>
                                        <input
                                            type="date"
                                            value={editForm.ends_at || ''}
                                            onChange={(e) => setEditForm({ ...editForm, ends_at: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status & Kategori */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Status Pendaftaran</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                    >
                                        <option value="open">Pendaftaran Aktif (Open)</option>
                                        <option value="upcoming">Segera Dibuka (Upcoming)</option>
                                        <option value="closing_soon">Segera Ditutup (Closing Soon)</option>
                                        <option value="closed">Ditutup (Closed)</option>
                                        <option value="ongoing">Sedang Berjalan (Ongoing)</option>
                                        <option value="completed">Selesai (Completed)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Kategori Lomba</label>
                                    <select
                                        value={editForm.category}
                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c.replace('_', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Nama & Penyelenggara */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Nama Kompetisi *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Penyelenggara *</label>
                                    <input
                                        type="text"
                                        required
                                        value={editForm.organizer}
                                        onChange={(e) => setEditForm({ ...editForm, organizer: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                </div>
                            </div>

                            {/* URLs & Prize */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Website Resmi</label>
                                    <input
                                        type="url"
                                        value={editForm.official_url}
                                        onChange={(e) => setEditForm({ ...editForm, official_url: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Tautan Pendaftaran</label>
                                    <input
                                        type="url"
                                        value={editForm.registration_url}
                                        onChange={(e) => setEditForm({ ...editForm, registration_url: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-1">Total Hadiah / Benefit</label>
                                    <input
                                        type="text"
                                        value={editForm.prize_info}
                                        onChange={(e) => setEditForm({ ...editForm, prize_info: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                                    />
                                </div>
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                                <textarea
                                    rows={3}
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none leading-relaxed"
                                />
                            </div>

                            {/* Gambar Poster / Banner Lomba */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">
                                    Poster / Gambar Sampul Lomba
                                </label>
                                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                                    {/* Existing image display */}
                                    {editingCompetition.cover_image && !editForm.remove_cover_image && (
                                        <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <img
                                                    src={editingCompetition.cover_image}
                                                    alt="Poster saat ini"
                                                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 shadow-2xs"
                                                />
                                                <div className="min-w-0">
                                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 mb-0.5">
                                                        Poster Saat Ini
                                                    </span>
                                                    <p className="text-xs text-slate-600 truncate max-w-[260px]">
                                                        {editingCompetition.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, remove_cover_image: true, cover_image: null })}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                                                title="Hapus gambar sampul ini"
                                            >
                                                <Trash2 className="size-3" />
                                                <span>Hapus</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* If marked for removal */}
                                    {editForm.remove_cover_image && (
                                        <div className="flex items-center justify-between p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                            <div className="flex items-center gap-2 text-amber-800 text-xs font-medium">
                                                <AlertCircle className="size-4 text-amber-600 shrink-0" />
                                                <span>Gambar sampul akan dihapus saat disimpan.</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditForm({ ...editForm, remove_cover_image: false })}
                                                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                                            >
                                                Batal Hapus
                                            </button>
                                        </div>
                                    )}

                                    {/* File input for new cover image */}
                                    <div className="space-y-1.5">
                                        <label className="block text-[11px] font-medium text-slate-600">
                                            {editingCompetition.cover_image && !editForm.remove_cover_image
                                                ? 'Unggah gambar baru untuk mengganti poster saat ini:'
                                                : 'Pilih file gambar poster (Opsional):'}
                                        </label>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setEditForm({ ...editForm, cover_image: file, remove_cover_image: false });
                                            }}
                                            className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        />
                                        <p className="text-[11px] text-slate-400">
                                            Format yang didukung: PNG, JPG, JPEG, WEBP. Maksimal 4MB.
                                        </p>
                                    </div>

                                    {formErrors.cover_image && (
                                        <p className="text-rose-600 text-xs font-medium mt-1">{formErrors.cover_image}</p>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer Buttons */}
                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setEditingCompetition(null)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-50 cursor-pointer"
                                >
                                    {submitting && <RotateCw className="size-3.5 animate-spin" />}
                                    <span>Simpan Perubahan</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
