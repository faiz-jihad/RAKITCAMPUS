import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    Calendar,
    Globe,
    Plus,
    Search,
    ShieldCheck,
    Sparkles,
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
    level?: string;
    competition_type?: string;
    scope: string;
    registration_deadline: string | null;
    min_team_size: number;
    max_team_size: number;
    status: string;
    verification_status: string;
    prize_info?: string;
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
    levels: string[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
        level?: string;
    };
    stats?: {
        total: number;
        open_registration: number;
        national_international: number;
        my_participations: number;
    };
    activeParticipation?: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Beranda', href: '/' },
    { title: 'Lomba & Kompetisi', href: '/competitions' },
];

export default function CompetitionIndex({
    competitions,
    categories,
    statuses,
    levels = ['local', 'regional', 'national', 'international'],
    filters,
    stats,
    activeParticipation,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');
    const [level, setLevel] = useState(filters.level || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/competitions', { search, category, status, level }, { preserveState: true });
    };

    const handleFilterChange = (cat: string, stat: string, lvl: string) => {
        setCategory(cat);
        setStatus(stat);
        setLevel(lvl);
        router.get('/competitions', { search, category: cat, status: stat, level: lvl }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Competition Hub — Lomba & Prestasi Mahasiswa" />

            <div className="min-h-screen bg-[#F8FAFC] relative text-slate-900 pb-24 overflow-hidden">
                <div className="pointer-events-none absolute -top-24 -left-20 h-[480px] w-[480px] rounded-full bg-blue-100/50 blur-[110px]" />
                <div className="pointer-events-none absolute top-48 -right-20 h-[380px] w-[380px] rounded-full bg-slate-200/50 blur-[100px]" />
                <div className="pointer-events-none absolute top-2/3 left-8 h-[360px] w-[360px] rounded-full bg-amber-100/40 blur-[100px]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-6">
                    {/* Header Banner */}
                    <div className="glass-surface rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white/85 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold tracking-wide mb-3 border border-amber-500/20 shadow-2xs">
                                <Trophy className="size-3.5 text-amber-600" />
                                <span>Lomba, Hackathon & Prestasi Kampus</span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                Lomba & Kompetisi Mahasiswa
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                                Temukan kompetisi seru tingkat kampus hingga internasional (Gemastik, PKM, Hackathon). Ajak rekan kolaborator lintas-jurusan dengan Smart Fair Matchmaking, dan raih prestasi membanggakan!
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href={route('competitions.create')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
                            >
                                <Plus className="size-4" />
                                <span>Daftarkan Kompetisi</span>
                            </Link>
                        </div>
                    </div>

                    {/* Active Workspace Banner if User is Competing */}
                    {activeParticipation && (
                        <div className="glass-card rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Trophy className="size-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-900">
                                        Tim Anda Sedang Berkompetisi di {activeParticipation.competition?.name}
                                    </div>
                                    <p className="text-[11px] text-blue-700/80 mt-0.5">
                                        Nama Tim: <strong>{activeParticipation.team?.name}</strong> • Tahap: <span className="capitalize">{activeParticipation.stage?.replace('_', ' ')}</span>
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route('competitions.workspace', activeParticipation.id)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs shrink-0"
                            >
                                <span>Buka Workspace Tim</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    )}

                    {/* Stats Overview */}
                    {stats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="glass-card rounded-2xl p-5 bg-white/85 flex flex-col justify-between">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Kompetisi</span>
                                    <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Trophy className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{stats.total}</div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Tersedia di katalog</p>
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-5 bg-white/85 flex flex-col justify-between">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Pendaftaran Buka</span>
                                    <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Calendar className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">{stats.open_registration}</div>
                                    <p className="text-[11px] text-emerald-600/80 mt-0.5">Siap menerima pendaftaran tim</p>
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-5 bg-white/85 flex flex-col justify-between">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Nasional & Global</span>
                                    <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                        <Globe className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-purple-800 tracking-tight">{stats.national_international}</div>
                                    <p className="text-[11px] text-purple-600/80 mt-0.5">Skala nasional/internasional</p>
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-5 bg-white/85 flex flex-col justify-between">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Partisipasi Saya</span>
                                    <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <Award className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight">{stats.my_participations}</div>
                                    <p className="text-[11px] text-amber-600/80 mt-0.5">Riwayat keikutsertaan tim</p>
                                </div>
                            </div>
                        </div>
                    )}

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
                                onChange={(e) => handleFilterChange(e.target.value, status, level)}
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
                                value={level}
                                onChange={(e) => handleFilterChange(category, status, e.target.value)}
                                className="text-xs bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            >
                                <option value="">Semua Tingkat</option>
                                {levels.map((lvl) => (
                                    <option key={lvl} value={lvl}>
                                        {lvl.toUpperCase()}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={status}
                                onChange={(e) => handleFilterChange(category, e.target.value, level)}
                                className="text-xs bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                            >
                                <option value="">Semua Status</option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>
                                        {s.replace('_', ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>

                            {(category || status || level || search) && (
                                <button
                                    onClick={() => {
                                        setSearch('');
                                        setCategory('');
                                        setStatus('');
                                        setLevel('');
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
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80">
                                                        {comp.category?.replace('_', ' ') || 'Kompetisi'}
                                                    </span>
                                                    {comp.level && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                                                            {comp.level}
                                                        </span>
                                                    )}
                                                </div>
                                                {comp.verification_status === 'verified' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                                        <ShieldCheck className="size-3" />
                                                        <span>Terverifikasi</span>
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                <Link href={route('competitions.show', comp.id)}>
                                                    {comp.name}
                                                </Link>
                                            </h3>

                                            <p className="text-xs font-semibold text-slate-500 mt-1">
                                                {comp.organizer}
                                            </p>

                                            <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                                                {comp.description || 'Kompetisi mahasiswa dengan peluang kolaborasi tim berimbang.'}
                                            </p>

                                            {comp.prize_info && (
                                                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200/70">
                                                    <Trophy className="size-3 text-amber-600" />
                                                    <span className="truncate max-w-[260px]">{comp.prize_info}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-4 text-slate-500">
                                                <span className="inline-flex items-center gap-1">
                                                    <Calendar className="size-3.5 text-slate-400" />
                                                    <span>{formattedDeadline}</span>
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <Users className="size-3.5 text-slate-400" />
                                                    <span>{comp.min_team_size} - {comp.max_team_size} mhs</span>
                                                </span>
                                            </div>

                                            <Link
                                                href={route('competitions.show', comp.id)}
                                                className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 transition"
                                            >
                                                <span>Detail</span>
                                                <ArrowRight className="size-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {competitions.last_page > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-6">
                            {Array.from({ length: competitions.last_page }).map((_, i) => (
                                <Link
                                    key={i}
                                    href={`/competitions?page=${i + 1}&category=${category}&status=${status}&level=${level}&search=${search}`}
                                    className={`size-8 rounded-xl text-xs font-bold flex items-center justify-center transition ${
                                        competitions.current_page === i + 1
                                            ? 'bg-blue-600 text-white shadow-2xs'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
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
