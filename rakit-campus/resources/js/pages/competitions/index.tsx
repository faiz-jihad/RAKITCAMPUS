import AppLayout from '@/layouts/app-layout';
import Premium3dIcon from '@/components/ui/premium-3d-icon';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    Calendar,
    Filter,
    Plus,
    Search,
    ShieldCheck,
    Trophy,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface Competition {
    id: number;
    name: string;
    slug: string;
    organizer: string;
    description: string;
    category: string;
    scope: string;
    registration_deadline: string | null;
    min_team_size: number;
    max_team_size: number;
    status: string;
    verification_status: string;
}

interface Props {
    competitions: {
        data: Competition[];
        current_page: number;
        last_page: number;
        total: number;
    };
    categories: string[];
    statuses: string[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Beranda', href: '/' },
    { title: 'Lomba & Kompetisi', href: '/competitions' },
];

export default function CompetitionIndex({
    competitions,
    categories,
    statuses,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/competitions', { search, category, status }, { preserveState: true });
    };

    const handleFilterChange = (cat: string, stat: string) => {
        setCategory(cat);
        setStatus(stat);
        router.get('/competitions', { search, category: cat, status: stat }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Competition Hub — Lomba & Prestasi Kampus" />

            <div className="min-h-screen bg-[#F8FAFC] relative text-slate-900 pb-24 overflow-hidden">
                <div className="pointer-events-none absolute -top-24 -left-20 h-[480px] w-[480px] rounded-full bg-blue-100/50 blur-[110px]" />
                <div className="pointer-events-none absolute top-48 -right-20 h-[380px] w-[380px] rounded-full bg-slate-200/50 blur-[100px]" />
                <div className="pointer-events-none absolute top-2/3 left-8 h-[360px] w-[360px] rounded-full bg-amber-100/40 blur-[100px]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-6">
                    {/* Header Banner */}
                    <div className="glass-surface rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white/85">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold tracking-wide mb-3 border border-amber-500/20 shadow-2xs">
                                <Trophy className="size-3.5 text-amber-600" />
                                <span>Lomba, Hackathon & Prestasi Kampus</span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                Lomba & Kompetisi
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                                Temukan kompetisi seru tingkat kampus hingga nasional (Gemastik, PKM, Hackathon). Ajak rekan kolaborator lintas-jurusan, bentuk tim berimbang, dan raih prestasi membanggakan!
                            </p>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="glass-card rounded-2xl p-4 bg-white/85 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <form onSubmit={handleSearch} className="relative w-full md:w-96">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nama kompetisi, penyelenggara, topik..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                            />
                        </form>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <select
                                value={category}
                                onChange={(e) => handleFilterChange(e.target.value, status)}
                                className="text-xs bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                                className="text-xs bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                                        router.get('/competitions');
                                    }}
                                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Competitions Grid */}
                    {competitions.data.length === 0 ? (
                        <div className="glass-card rounded-3xl p-14 text-center bg-white/85">
                            <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
                                <Trophy className="size-7" />
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                Tidak Ada Kompetisi yang Ditemukan
                            </h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                                Coba sesuaikan kata kunci atau bersihkan filter untuk menampilkan lebih banyak daftar kompetisi aktif.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {competitions.data.map((comp) => {
                                const formattedDeadline = comp.registration_deadline
                                    ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                      })
                                    : 'Terbuka';

                                return (
                                    <div
                                        key={comp.id}
                                        className="glass-card rounded-3xl p-6 bg-white/85 hover:bg-white/95 border border-white/85 hover:border-blue-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
                                    >
                                        <div>
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80">
                                                        {comp.category?.replace('_', ' ') || 'Kompetisi'}
                                                    </span>
                                                </div>
                                                {comp.verification_status === 'verified' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                                        <ShieldCheck className="size-3" />
                                                        <span>Terverifikasi</span>
                                                    </span>
                                                )}
                                            </div>

                                            <Link href={`/competitions/${comp.id}`} className="block group-hover:text-blue-600 transition">
                                                <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">
                                                    {comp.name}
                                                </h3>
                                            </Link>

                                            <p className="text-xs text-slate-500 mt-1 font-medium">
                                                Penyelenggara: <strong className="text-slate-700">{comp.organizer}</strong>
                                            </p>

                                            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                                                {comp.description}
                                            </p>

                                            <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Calendar className="size-3.5 text-blue-600" />
                                                    <span className="text-[11px]">
                                                        Batas: <strong>{formattedDeadline}</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-600">
                                                    <Users className="size-3.5 text-slate-400" />
                                                    <span className="text-[11px]">
                                                        {comp.min_team_size}-{comp.max_team_size} Orang
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                Skala: {comp.scope}
                                            </span>

                                            <Link
                                                href={`/competitions/${comp.id}`}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 group-hover:bg-blue-600 text-white text-xs font-bold transition shadow-2xs"
                                            >
                                                <span>Detail Tim</span>
                                                <ArrowRight className="size-3" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {competitions.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            {Array.from({ length: competitions.last_page }).map((_, i) => (
                                <Link
                                    key={i}
                                    href={`/competitions?page=${i + 1}${category ? `&category=${category}` : ''}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`}
                                    className={`size-9 rounded-xl flex items-center justify-center text-xs font-bold transition ${
                                        competitions.current_page === i + 1
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
            </div>
        </AppLayout>
    );
}
