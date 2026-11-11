import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Briefcase,
    Calendar,
    CheckCircle2,
    Compass,
    Filter,
    FolderKanban,
    GraduationCap,
    Layers,
    MapPin,
    Plus,
    Search,
    Send,
    Sparkles,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface ProjectItem {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    category: string;
    status: string;
    progress: number;
    tech_stack: string[];
    has_capacity?: boolean;
    is_member?: boolean;
    has_applied?: boolean;
    has_open_recruitment?: boolean;
    can_access_workspace?: boolean;
    has_active_in_scope?: boolean;
    is_class_restricted?: boolean;
    can_apply?: boolean;
    apply_block_reason?: string | null;
    academic_class?: { id: number; name: string; code: string } | null;
    campus?: { name: string };
    leader?: { name: string };
    skills: { id: number; name: string }[];
    team?: {
        id?: number;
        members: any[];
        recruitment?: {
            status?: string;
            roles?: { id: number; name: string; slots?: number; requirements?: string }[];
        };
    };
}

interface Props {
    projects: {
        data: ProjectItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
    categories: string[];
    statuses: string[];
    userHasActiveProject?: boolean;
    isLecturer?: boolean;
    isGuest?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Cari Proyek', href: '/projects' },
];

export default function ProjectIndex({
    projects,
    filters,
    categories = [],
    statuses = [],
    userHasActiveProject = false,
    isLecturer = false,
    isGuest = false,
}: Props) {
    const { flash, errors: pageErrors } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');
    const [joiningProject, setJoiningProject] = useState<ProjectItem | null>(null);
    const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
    const [applyMessage, setApplyMessage] = useState('');
    const [submittingJoin, setSubmittingJoin] = useState(false);

    const openJoinModal = (proj: ProjectItem) => {
        const firstRole = proj.team?.recruitment?.roles?.[0];
        setJoiningProject(proj);
        setSelectedRoleId(firstRole ? firstRole.id : '');
        setApplyMessage('');
    };

    const handleQuickApply = (e: React.FormEvent) => {
        e.preventDefault();
        if (!joiningProject) return;
        setSubmittingJoin(true);
        router.post(
            `/projects/${joiningProject.id}/apply`,
            {
                recruitment_role_id: selectedRoleId || null,
                message: applyMessage,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setJoiningProject(null);
                    setApplyMessage('');
                },
                onFinish: () => setSubmittingJoin(false),
            }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/projects', { search, category, status }, { preserveState: true });
    };

    const handleFilterChange = (cat: string, stat: string) => {
        setCategory(cat);
        setStatus(stat);
        router.get('/projects', { search, category: cat, status: stat }, { preserveState: true });
    };

    const getStatusBadge = (stat: string) => {
        switch (stat) {
            case 'recruiting':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'in_progress':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'completed':
                return 'bg-slate-100 text-slate-700 border-slate-200';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Project Hub — Temukan & Bangun Proyek Kolaborasi Kampus" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Proyek Kelas
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Eksplorasi ide proyek berbasis perkuliahan, cari rekan kolaborator, dan bangun portofolio tim.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Link
                            href="/workspace"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
                        >
                            <FolderKanban className="size-3.5 text-blue-600" />
                            <span>Workspace Tim</span>
                        </Link>
                        {!isLecturer && (
                            <Link
                                href="/projects/create"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                <span>Buat Proyek</span>
                            </Link>
                        )}
                    </div>
                </div>

                    {flash?.success && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-800">
                            {flash.success}
                        </div>
                    )}
                    {(flash?.error || pageErrors?.project_id) && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700">
                            {flash?.error || pageErrors?.project_id}
                        </div>
                    )}

                    {/* Filter and Search Bar */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <form onSubmit={handleSearch} className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari judul proyek, topik, atau stack..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                            />
                        </form>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <select
                                value={category}
                                onChange={(e) => handleFilterChange(e.target.value, status)}
                                className="text-xs bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer"
                            >
                                <option value="">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c.replace('_', ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={status}
                                onChange={(e) => handleFilterChange(category, e.target.value)}
                                className="text-xs bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer"
                            >
                                <option value="">Semua Status</option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>
                                        {s.replace('_', ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>

                            {(category || status || search) && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setCategory('');
                                        setStatus('');
                                        router.get('/projects');
                                    }}
                                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Projects Grid */}
                    {projects.data.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center max-w-lg mx-auto flex flex-col items-center">
                            <div className="size-12 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mb-3 shadow-2xs">
                                <FolderKanban className="size-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Tidak Ada Proyek yang Ditemukan
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {search || category || status
                                    ? 'Coba sesuaikan kata kunci atau reset filter untuk menampilkan proyek lainnya.'
                                    : isLecturer
                                    ? 'Belum ada proyek mahasiswa terdaftar di kelas Anda.'
                                    : 'Belum ada proyek terdaftar di kelas. Mulai dengan membuat proyek baru.'}
                            </p>
                            {!isLecturer && (
                                <Link
                                    href="/projects/create"
                                    className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Buat Proyek Pertama</span>
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                            {projects.data.map((proj) => {
                                const openRoles = proj.team?.recruitment?.roles?.map((r) => r.name) || [];
                                return (
                                    <div
                                        key={proj.id}
                                        className="bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition p-5 flex flex-col justify-between gap-4 group"
                                    >
                                        <div>
                                            {/* Badges row with clean squircle */}
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                                        {proj.category.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(proj.status)}`}>
                                                    {proj.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <Link href={`/projects/${proj.slug || proj.id}`} className="block group-hover:text-blue-600 transition">
                                                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                                                    {proj.title}
                                                </h3>
                                            </Link>

                                            {/* Description */}
                                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                                {proj.short_description}
                                            </p>

                                            {/* Open Recruitment Alert if recruiting */}
                                            {proj.status === 'recruiting' && (proj.has_open_recruitment ?? proj.team?.recruitment?.status === 'open') && openRoles.length > 0 && (
                                                <div className="mt-3.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs">
                                                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                                                        Membuka {openRoles.length} Posisi:
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {openRoles.slice(0, 3).map((r, rIdx) => (
                                                            <span
                                                                key={rIdx}
                                                                className="text-[10px] font-semibold bg-white text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200"
                                                            >
                                                                {r}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Tech Stack Chips */}
                                            {proj.tech_stack && proj.tech_stack.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-3.5">
                                                    {proj.tech_stack.slice(0, 4).map((tech, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200/60"
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                    {proj.tech_stack.length > 4 && (
                                                        <span className="text-[10px] text-slate-400 font-semibold self-center">
                                                            +{proj.tech_stack.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Footer */}
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Users className="size-3.5 text-slate-400" />
                                                <span className="font-semibold text-slate-700">
                                                    {proj.team?.members?.length || 1} Anggota
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {proj.status === 'recruiting' && !isLecturer && (
                                                    proj.is_member ? (
                                                        proj.can_access_workspace ? (
                                                            <Link
                                                                href={proj.team ? `/workspace/${proj.team.id}` : '/workspace'}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition shadow-2xs"
                                                                title="Buka Workspace Tim Proyek"
                                                            >
                                                                <FolderKanban className="size-3" />
                                                                <span>Workspace Tim</span>
                                                            </Link>
                                                        ) : (
                                                            <span
                                                                title="Workspace Tim menunggu persetujuan dosen pengampu kelas"
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold"
                                                            >
                                                                <span>Tim Anda</span>
                                                            </span>
                                                        )
                                                    ) : proj.has_applied ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                                            <span>Sudah Melamar</span>
                                                        </span>
                                                    ) : isGuest ? (
                                                        proj.has_open_recruitment === false ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold">
                                                                <span>Rekrutmen Ditutup</span>
                                                            </span>
                                                        ) : (
                                                            <Link
                                                                href="/login"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
                                                            >
                                                                <Send className="size-3" />
                                                                <span>Gabung Tim</span>
                                                            </Link>
                                                        )
                                                    ) : proj.can_apply ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => openJoinModal(proj)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                                                        >
                                                            <Send className="size-3" />
                                                            <span>Gabung Tim</span>
                                                        </button>
                                                    ) : (
                                                        <span
                                                            title={proj.apply_block_reason || 'Tidak memenuhi syarat gabung'}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold"
                                                        >
                                                            <span>
                                                                {proj.has_open_recruitment === false
                                                                    ? 'Rekrutmen Ditutup'
                                                                    : proj.has_capacity === false
                                                                    ? 'Penuh'
                                                                    : proj.is_class_restricted
                                                                    ? 'Khusus Kelas'
                                                                    : proj.has_active_in_scope
                                                                    ? 'Sudah Punya Tim'
                                                                    : 'Tidak Memenuhi Syarat'}
                                                            </span>
                                                        </span>
                                                    )
                                                )}

                                                <Link
                                                    href={`/projects/${proj.slug || proj.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 group-hover:bg-blue-600 text-white text-xs font-bold transition shadow-2xs"
                                                >
                                                    <span>Detail</span>
                                                    <ArrowRight className="size-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination if multiple pages */}
                    {projects.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            {Array.from({ length: projects.last_page }).map((_, i) => (
                                <Link
                                    key={i}
                                    href={`/projects?page=${i + 1}${category ? `&category=${category}` : ''}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                                    className={`size-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                                        projects.current_page === i + 1
                                            ? 'bg-blue-600 text-white shadow-xs'
                                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {i + 1}
                                </Link>
                            ))}
                        </div>
                    )}
            </div>

            {/* QUICK JOIN / APPLY MODAL */}
            {joiningProject && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-surface bg-white/95 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                                    Gabung Tim Proyek
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                                    {joiningProject.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pilih posisi yang ingin dilamar dan kirimkan pesan singkat ke ketua tim.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setJoiningProject(null)}
                                className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleQuickApply} className="flex flex-col gap-4">
                            {joiningProject.team?.recruitment?.roles && joiningProject.team.recruitment.roles.length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Pilih Posisi / Peran
                                    </label>
                                    <select
                                        value={selectedRoleId}
                                        onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    >
                                        {joiningProject.team.recruitment.roles.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Pesan Perkenalan & Keahlian Singkat *
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                    placeholder="Jelaskan keahlian, pengalaman relevan, atau kontribusi yang ingin Anda berikan..."
                                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                                <Link
                                    href={`/projects/${joiningProject.slug || joiningProject.id}`}
                                    className="text-xs font-semibold text-blue-600 hover:underline"
                                >
                                    Lihat Detail Lengkap Proyek &rarr;
                                </Link>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setJoiningProject(null)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingJoin}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                                    >
                                        {submittingJoin ? 'Mengirim...' : 'Kirim Lamaran'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
