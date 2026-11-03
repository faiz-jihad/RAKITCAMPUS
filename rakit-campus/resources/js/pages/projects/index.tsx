import AppLayout from '@/layouts/app-layout';
import Premium3dIcon from '@/components/ui/premium-3d-icon';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Briefcase,
    Calendar,
    Compass,
    Filter,
    FolderKanban,
    GraduationCap,
    Layers,
    MapPin,
    Plus,
    Search,
    Sparkles,
    Users,
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
    campus?: { name: string };
    leader?: { name: string };
    skills: { id: number; name: string }[];
    team?: {
        members: any[];
        recruitment?: {
            roles?: { id: number; name: string }[];
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
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Project Hub', href: '/projects' },
];

export default function ProjectIndex({ projects, filters, categories = [], statuses = [] }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');

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
                return 'bg-[#EEEDFD] text-[#5448EE] border-[#5448EE]/20';
            case 'completed':
                return 'bg-neutral-100 text-neutral-700 border-neutral-200';
            default:
                return 'bg-neutral-50 text-neutral-600 border-neutral-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Project Hub — Temukan & Bangun Proyek Kolaborasi Kampus" />

            <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F8F6FF] relative text-[#0E121B] pb-24">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[950px] h-[320px] bg-gradient-to-b from-[#5448EE]/10 to-transparent blur-3xl pointer-events-none -z-0" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-8">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-neutral-200/80">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] text-xs font-semibold tracking-wide mb-3 border border-[#5448EE]/20 shadow-2xs">
                                <Compass className="size-3.5" />
                                <span>Pusat Inisiasi & Rekrutmen Terbuka Antar-Mahasiswa</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0E121B]">
                                Project Hub
                            </h1>
                            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                                Jelajahi ragam proyek riset, tugas capstone perkuliahan, dan startup mahasiswa. Gabung dengan tim yang sedang merekrut atau inisiasi proyek impian Anda sendiri.
                            </p>
                        </div>

                        {/* Top Actions */}
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href="/projects/create"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#5448EE]/20 hover:shadow-lg transition"
                            >
                                <Plus className="size-4" />
                                <span>Inisiasi Proyek Baru</span>
                            </Link>
                        </div>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <form onSubmit={handleSearch} className="relative w-full md:w-96">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Cari judul proyek, topik riset, teknologi..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50/70 border border-neutral-200/90 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE] transition"
                            />
                        </form>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <select
                                value={category}
                                onChange={(e) => handleFilterChange(e.target.value, status)}
                                className="text-xs bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
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
                                className="text-xs bg-white border border-neutral-200/90 rounded-xl px-3.5 py-2.5 text-neutral-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
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
                                    className="px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900"
                                >
                                    Reset Filter
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Projects Grid */}
                    {projects.data.length === 0 ? (
                        <div className="rounded-3xl bg-white border border-neutral-200/80 p-14 text-center shadow-xs">
                            <div className="size-14 rounded-2xl bg-[#EEEDFD] text-[#5448EE] flex items-center justify-center mx-auto mb-4">
                                <FolderKanban className="size-7" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-800">
                                Tidak Ada Proyek yang Ditemukan
                            </h3>
                            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                                {search || category || status
                                    ? 'Coba sesuaikan kata kunci atau bersihkan filter untuk menampilkan lebih banyak proyek.'
                                    : 'Belum ada proyek yang diterbitkan. Jadilah yang pertama menginisiasi proyek kolaborasi di kampus Anda!'}
                            </p>
                            <Link
                                href="/projects/create"
                                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-bold shadow-md shadow-[#5448EE]/20 transition"
                            >
                                <Plus className="size-3.5" />
                                <span>Inisiasi Proyek Baru</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.data.map((proj) => {
                                const openRoles = proj.team?.recruitment?.roles?.map((r) => r.name) || [];
                                return (
                                    <div
                                        key={proj.id}
                                        className="rounded-3xl bg-white border border-neutral-200/80 hover:border-[#5448EE]/40 p-6 shadow-sm hover:shadow-xl hover:shadow-[#5448EE]/10 transition-all duration-300 flex flex-col justify-between gap-5 group"
                                    >
                                        <div>
                                            {/* Badges row with 3D Icon */}
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Premium3dIcon
                                                        icon={FolderKanban}
                                                        variant="purple"
                                                        size="sm"
                                                    />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] border border-[#5448EE]/20">
                                                        {proj.category.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(proj.status)}`}>
                                                    {proj.status.replace('_', ' ')}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <Link href={`/projects/${proj.id}`} className="block group-hover:text-[#5448EE] transition">
                                                <h3 className="text-base font-bold text-[#0E121B] leading-snug line-clamp-2">
                                                    {proj.title}
                                                </h3>
                                            </Link>

                                            {/* Description */}
                                            <p className="text-xs text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
                                                {proj.short_description}
                                            </p>

                                            {/* Open Recruitment Alert if recruiting */}
                                            {proj.status === 'recruiting' && openRoles.length > 0 && (
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
                                                            className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full"
                                                        >
                                                            {tech}
                                                        </span>
                                                    ))}
                                                    {proj.tech_stack.length > 4 && (
                                                        <span className="text-[10px] text-neutral-400 font-semibold self-center">
                                                            +{proj.tech_stack.length - 4}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Card Footer */}
                                        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 text-neutral-500">
                                                <Users className="size-3.5 text-neutral-400" />
                                                <span className="font-semibold text-neutral-700">
                                                    {proj.team?.members?.length || 1} Anggota
                                                </span>
                                            </div>

                                            <Link
                                                href={`/projects/${proj.id}`}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 group-hover:bg-[#5448EE] text-white text-xs font-bold transition shadow-2xs"
                                            >
                                                <span>Detail</span>
                                                <ArrowRight className="size-3" />
                                            </Link>
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
                                            ? 'bg-[#5448EE] text-white shadow-xs'
                                            : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                                    }`}
                                >
                                    {i + 1}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
