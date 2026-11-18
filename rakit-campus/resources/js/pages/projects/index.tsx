import AppLayout from '@/layouts/app-layout';
import SeoHead from '@/components/seo/SeoHead';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
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
    UserPlus,
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
        scope?: 'all' | 'independent' | 'academic';
    };
    counts?: {
        all: number;
        independent: number;
        academic: number;
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
    counts,
    categories = [],
    statuses = [],
    userHasActiveProject = false,
    isLecturer = false,
    isGuest = false,
}: Props) {
    const { flash, errors: pageErrors } = usePage().props as any;
    const [scope, setScope] = useState<'all' | 'independent' | 'academic'>(filters.scope || 'all');
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

    const handleScopeChange = (newScope: 'all' | 'independent' | 'academic') => {
        setScope(newScope);
        router.get(
            '/projects',
            {
                scope: newScope !== 'all' ? newScope : undefined,
                search: search || undefined,
                category: category || undefined,
                status: status || undefined,
            },
            { preserveState: true }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/projects',
            {
                scope: scope !== 'all' ? scope : undefined,
                search: search || undefined,
                category: category || undefined,
                status: status || undefined,
            },
            { preserveState: true }
        );
    };

    const handleFilterChange = (cat: string, stat: string) => {
        setCategory(cat);
        setStatus(stat);
        router.get(
            '/projects',
            {
                scope: scope !== 'all' ? scope : undefined,
                search: search || undefined,
                category: cat || undefined,
                status: stat || undefined,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        setScope('all');
        router.get('/projects');
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
            <SeoHead
                title="Katalog Proyek & Portofolio Karya Mahasiswa"
                description="Jelajahi inovasi proyek mahasiswa, prototipe open-source, riset akademik, dan living proposal tugas akhir perguruan tinggi di RAKIT Campus."
                keywords="proyek mahasiswa, portofolio teknologi, living proposal, tugas akhir inovatif, riset kampus, kolaborasi proyek, rakit campus"
                canonicalUrl="https://rakitcampus.my.id/projects"
            />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Proyek
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Link
                            href="/workspace"
                            className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition"
                        >
                            <FolderKanban className="size-3.5 text-blue-600 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
                            <span>Workspace Tim</span>
                        </Link>
                        {!isLecturer && (
                            <Link
                                href="/projects/create"
                                className="group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                            >
                                <Plus className="size-3.5 transition-transform duration-200 group-hover:rotate-90 group-hover:scale-110" />
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

                    {/* Segmented Filter Tabs: Semua Proyek | Proyek Mandiri & Terbuka | Kelas Perkuliahan */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-2xs self-start overflow-x-auto max-w-full">
                            <button
                                type="button"
                                onClick={() => handleScopeChange('all')}
                                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    scope === 'all'
                                        ? 'bg-white text-blue-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Layers className="size-3.5" />
                                <span>Semua Proyek</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    scope === 'all' ? 'bg-blue-50 text-blue-700' : 'bg-slate-200/80 text-slate-600'
                                }`}>
                                    {counts?.all ?? projects.total}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleScopeChange('independent')}
                                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    scope === 'independent'
                                        ? 'bg-white text-blue-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Compass className="size-3.5 text-blue-600" />
                                <span>Proyek Mandiri & Terbuka</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    scope === 'independent' ? 'bg-blue-50 text-blue-700' : 'bg-slate-200/80 text-slate-600'
                                }`}>
                                    {counts?.independent ?? 0}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleScopeChange('academic')}
                                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                    scope === 'academic'
                                        ? 'bg-white text-blue-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <GraduationCap className="size-3.5 text-blue-600" />
                                <span>Kelas Perkuliahan</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    scope === 'academic' ? 'bg-blue-50 text-blue-700' : 'bg-slate-200/80 text-slate-600'
                                }`}>
                                    {counts?.academic ?? 0}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Contextual Banner for Scope */}
                    {scope === 'independent' && (
                        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900">
                            <Compass className="size-4 text-blue-600 shrink-0" />
                            <p className="leading-relaxed">
                                Menampilkan <strong>Proyek Mandiri & Terbuka</strong>. Siapa saja dapat melamar posisi rekrutmen tanpa batasan kelas perkuliahan.
                            </p>
                        </div>
                    )}
                    {scope === 'academic' && (
                        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900">
                            <GraduationCap className="size-4 text-blue-600 shrink-0" />
                            <p className="leading-relaxed">
                                Menampilkan <strong>Proyek Kelas Perkuliahan (Academic Project-Based Learning)</strong>. Rekrutmen tim dan keanggotaan terikat secara ketat pada mahasiswa yang terdaftar di kelas bersangkutan.
                            </p>
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

                            {(category || status || search || scope !== 'all') && (
                                <button
                                    onClick={handleReset}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 pt-2">
                            {projects.data.map((proj) => {
                                const openRoles = proj.team?.recruitment?.roles?.map((r) => r.name) || [];
                                return (
                                    <div
                                        key={proj.id}
                                        className="group relative pt-6 transition-all duration-300"
                                    >
                                        {/* 1. FOLDER TAB (Kuping Tab Map di Kiri Atas - Polos Tanpa Ikon/Teks Tertutup) */}
                                        <div className="absolute top-0 left-0 w-32 sm:w-36 h-7.5 rounded-t-xl bg-blue-800 border-t border-x border-blue-400/40 shadow-xs z-0" />

                                        {/* 2. INNER DOCUMENT PAPER (Menyembul keluar saat folder dibuka saat di-hover) */}
                                        <div className="absolute inset-x-3.5 top-2.5 h-12 rounded-t-xl bg-amber-100 shadow-md border border-amber-300/80 transition-all duration-300 ease-out transform group-hover:-translate-y-5 group-hover:rotate-[-0.5deg] z-10 pointer-events-none overflow-hidden">
                                            {/* Garis-garis representasi dokumen dalam folder (Kuning Manila / Cream) */}
                                            <div className="flex items-center gap-2 px-3.5 pt-2.5 opacity-90">
                                                <div className="w-10 h-1.5 rounded-full bg-amber-400" />
                                                <div className="w-16 h-1.5 rounded-full bg-amber-300" />
                                                <div className="w-8 h-1.5 rounded-full bg-amber-200" />
                                            </div>
                                        </div>

                                        {/* 3. FOLDER BODY (Badan Folder Berwarna Biru, Teks & Ikon Putih) */}
                                        <div className="relative z-20 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 text-white rounded-2xl rounded-tl-none p-5 sm:p-6 shadow-md border border-blue-400/40 transition-all duration-300 ease-out group-hover:shadow-2xl group-hover:border-blue-300 group-hover:translate-y-0.5 flex flex-col justify-between min-h-[340px]">
                                            <div>
                                                {/* Top Bar Dalam Folder: Kategori, Kelas / Jalur & Status Rekrutmen */}
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <span className="text-[11px] font-black tracking-wider uppercase text-blue-200 truncate">
                                                            {proj.category.replace('_', ' ')}
                                                        </span>
                                                        {proj.academic_class ? (
                                                            <>
                                                                <span className="text-blue-300 text-xs shrink-0 font-sans mx-0.5">|</span>
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white truncate" title={proj.academic_class.name}>
                                                                    <GraduationCap className="size-3 text-blue-200 shrink-0" />
                                                                    <span className="truncate">{proj.academic_class.code || proj.academic_class.name}</span>
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-blue-300 text-xs shrink-0 font-sans mx-0.5">|</span>
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-100 truncate">
                                                                    <Compass className="size-3 text-blue-200 shrink-0" />
                                                                    <span>Mandiri</span>
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {proj.status === 'recruiting' ? (
                                                        <div className="inline-flex items-center gap-1.5 text-white bg-white/20 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight shrink-0 border border-white/25">
                                                            <UserPlus className="size-3.5 text-white" />
                                                            <span>Rekrutmen</span>
                                                        </div>
                                                    ) : proj.status === 'in_progress' ? (
                                                        <div className="inline-flex items-center gap-1.5 text-blue-100 text-[11px] font-medium tracking-tight shrink-0">
                                                            <Clock className="size-3.5 text-blue-200" />
                                                            <span>Sedang Berjalan</span>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 text-blue-100 text-[11px] font-medium tracking-tight shrink-0">
                                                            <CheckCircle2 className="size-3.5 text-blue-200" />
                                                            <span>Selesai</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <Link href={`/projects/${proj.slug || proj.id}`} className="block group/title">
                                                    <h3 className="text-base sm:text-lg font-black text-white group-hover/title:text-blue-100 transition-colors duration-150 leading-snug line-clamp-2">
                                                        {proj.title}
                                                    </h3>
                                                </Link>

                                                {/* Description */}
                                                <p className="text-xs text-blue-100 mt-2 line-clamp-2 leading-relaxed min-h-[34px]">
                                                    {proj.short_description}
                                                </p>

                                                {/* Integrated Recruitment Strip / Team Status */}
                                                <div className="mt-3.5 pt-3 border-t border-white/15 min-h-[52px] flex flex-col justify-center">
                                                    {proj.status === 'recruiting' && (proj.has_open_recruitment ?? proj.team?.recruitment?.status === 'open') && openRoles.length > 0 ? (
                                                        <div>
                                                            <div className="flex items-center justify-between text-[11px] mb-1.5">
                                                                <span className="font-bold text-white">Dibutuhkan:</span>
                                                                <span className="text-[10px] font-bold text-blue-100 bg-white/20 px-2 py-0.5 rounded-full">{openRoles.length} Posisi Terbuka</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {openRoles.slice(0, 2).map((r, rIdx) => (
                                                                    <span
                                                                        key={rIdx}
                                                                        className="text-[10px] font-semibold bg-white/15 text-white px-2 py-0.5 rounded-md border border-white/20 truncate max-w-[150px]"
                                                                    >
                                                                        {r}
                                                                    </span>
                                                                ))}
                                                                {openRoles.length > 2 && (
                                                                    <span className="text-[10px] font-medium text-blue-200 self-center px-1">
                                                                        +{openRoles.length - 2} lagi
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between text-[11px] py-1">
                                                            <span className="font-medium text-blue-100">Susunan Tim:</span>
                                                            <span className="text-[10px] font-semibold text-white bg-white/20 px-2 py-0.5 rounded-md border border-white/20">
                                                                Tim Lengkap
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tech Stack Chips */}
                                                {proj.tech_stack && proj.tech_stack.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                        {proj.tech_stack.slice(0, 4).map((tech, i) => (
                                                            <span
                                                                key={i}
                                                                className="text-[10px] font-medium bg-white/15 text-white px-2 py-0.5 rounded-md border border-white/10"
                                                            >
                                                                {tech}
                                                            </span>
                                                        ))}
                                                        {proj.tech_stack.length > 4 && (
                                                            <span className="text-[10px] text-blue-200 font-medium self-center px-0.5">
                                                                +{proj.tech_stack.length - 4}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Card Footer */}
                                            <div className="pt-3.5 mt-3.5 border-t border-white/15 flex items-center justify-between gap-2 text-xs">
                                                <div className="flex items-center gap-1.5 text-white">
                                                    <Users className="size-3.5 text-blue-200" />
                                                    <span className="font-bold text-white text-xs">
                                                        {proj.team?.members?.length || 1} Anggota
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {proj.status === 'recruiting' && !isLecturer && (
                                                        proj.is_member ? (
                                                            proj.can_access_workspace ? (
                                                                <Link
                                                                    href={proj.team ? `/workspace/${proj.team.id}` : '/workspace'}
                                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 transition"
                                                                    title="Buka Workspace Tim Proyek"
                                                                >
                                                                    <FolderKanban className="size-3 text-white" />
                                                                    <span>Workspace</span>
                                                                </Link>
                                                            ) : (
                                                                <span className="text-[11px] font-bold text-white bg-white/20 px-2.5 py-1 rounded-md border border-white/30">
                                                                    Tim Anda
                                                                </span>
                                                            )
                                                        ) : proj.has_applied ? (
                                                            <span className="text-[11px] font-medium text-blue-100 bg-white/15 px-2 py-1 rounded-md border border-white/20">
                                                                Sudah Melamar
                                                            </span>
                                                        ) : isGuest ? (
                                                            proj.has_open_recruitment !== false && (
                                                                <Link
                                                                    href="/login"
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold shadow-xs transition"
                                                                >
                                                                    <Send className="size-3 text-blue-700" />
                                                                    <span>Lamar</span>
                                                                </Link>
                                                            )
                                                        ) : proj.can_apply ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => openJoinModal(proj)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold shadow-xs transition cursor-pointer"
                                                            >
                                                                <Send className="size-3 text-blue-700" />
                                                                <span>Lamar Posisi</span>
                                                            </button>
                                                        ) : (
                                                            <span className="text-[11px] font-medium text-blue-200">
                                                                {proj.has_open_recruitment === false
                                                                    ? 'Rekrutmen Tutup'
                                                                    : proj.has_capacity === false
                                                                    ? 'Penuh'
                                                                    : proj.is_class_restricted
                                                                    ? 'Khusus Kelas'
                                                                    : proj.has_active_in_scope
                                                                    ? 'Sudah Punya Tim'
                                                                    : 'Tidak Memenuhi Syarat'}
                                                            </span>
                                                        )
                                                    )}

                                                    <Link
                                                        href={`/projects/${proj.slug || proj.id}`}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-blue-50 text-blue-700 text-xs font-extrabold transition shadow-xs duration-150 active:scale-95"
                                                    >
                                                        <span>Detail</span>
                                                        <ArrowRight className="size-3 text-blue-700 group-hover:translate-x-0.5 transition-transform" />
                                                    </Link>
                                                </div>
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
                                    href={`/projects?page=${i + 1}${scope && scope !== 'all' ? `&scope=${scope}` : ''}${category ? `&category=${category}` : ''}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
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
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 leading-snug">
                                    Ajukan Lamaran Tim
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Mengajukan diri untuk bergabung ke proyek <strong className="text-slate-800 font-semibold">{joiningProject.title}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setJoiningProject(null)}
                                className="size-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer shrink-0"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleQuickApply} className="p-5 sm:p-6 flex flex-col gap-4">
                            {joiningProject.team?.recruitment?.roles && joiningProject.team.recruitment.roles.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                        Pilih Posisi / Peran
                                    </label>
                                    <select
                                        value={selectedRoleId}
                                        onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs"
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
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Pesan Singkat & Portofolio Relevan <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                    placeholder="Jelaskan keahlian teknis, pengalaman relevan, atau kontribusi yang ingin Anda berikan..."
                                    className="w-full p-3 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs resize-none leading-relaxed"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-4 bg-slate-50/80">
                                <Link
                                    href={`/projects/${joiningProject.slug || joiningProject.id}`}
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    Detail Proyek &rarr;
                                </Link>
                                <div className="flex items-center gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setJoiningProject(null)}
                                        className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer shadow-2xs"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingJoin}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold transition disabled:opacity-50 shadow-xs cursor-pointer"
                                    >
                                        <Send className="size-3.5" />
                                        <span>{submittingJoin ? 'Mengirim...' : 'Kirim Lamaran'}</span>
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
