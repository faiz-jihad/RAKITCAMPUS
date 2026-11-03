import AppLayout from '@/layouts/app-layout';
import Premium3dIcon from '@/components/ui/premium-3d-icon';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    Filter,
    MapPin,
    Search,
    ShieldCheck,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface CompetitionItem {
    id: number;
    name: string;
    slug: string;
    organizer: string;
    description: string;
    category: string;
    status: string;
    scope: string;
    registration_deadline: string;
    min_team_size: number;
    max_team_size: number;
    verification_status: string;
    sources?: any[];
}

interface Props {
    competitions: {
        data: CompetitionItem[];
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
    { title: 'Lomba & Kompetisi', href: '/competitions' },
];

export default function CompetitionIndex({ competitions, filters, categories = [], statuses = [] }: Props) {
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
            <Head title="Competition Hub — Kompetisi Mahasiswa & Prestasi Kampus" />

            <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F8F6FF] relative text-[#0E121B] pb-24">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[950px] h-[320px] bg-gradient-to-b from-[#5448EE]/10 to-transparent blur-3xl pointer-events-none -z-0" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-8">
                    {/* Header Banner */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-neutral-200/80">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] text-xs font-semibold tracking-wide mb-3 border border-[#5448EE]/20 shadow-2xs">
                                <Trophy className="size-3.5 text-amber-500" />
                                <span>Lomba, Hackathon & Prestasi Kampus</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0E121B]">
                                Lomba & Kompetisi
                            </h1>
                            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">
                                Temukan kompetisi seru tingkat kampus hingga nasional (Gemastik, PKM, Hackathon). Ajak teman lintas-jurusan, bentuk tim hebat, dan borong piala prestasinya!
                            </p>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <form onSubmit={handleSearch} className="relative w-full md:w-96">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Cari nama kompetisi, penyelenggara, topik..."
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
                                        router.get('/competitions');
                                    }}
                                    className="px-3 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Competitions Grid */}
                    {competitions.data.length === 0 ? (
                        <div className="rounded-3xl bg-white border border-neutral-200/80 p-14 text-center shadow-xs">
                            <div className="size-14 rounded-2xl bg-[#EEEDFD] text-[#5448EE] flex items-center justify-center mx-auto mb-4">
                                <Trophy className="size-7 text-amber-500" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-800">
                                Tidak Ada Kompetisi yang Ditemukan
                            </h3>
                            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 leading-relaxed">
                                Coba sesuaikan kata kunci atau bersihkan filter untuk menampilkan lebih banyak daftar kompetisi aktif.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                                        className="rounded-3xl bg-white border border-neutral-200/80 hover:border-[#5448EE]/40 p-6 shadow-sm hover:shadow-xl hover:shadow-[#5448EE]/10 transition-all duration-300 flex flex-col justify-between gap-5 group"
                                    >
                                        <div>
                                            {/* Badges row with 3D Icon */}
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Premium3dIcon
                                                        icon={Trophy}
                                                        variant={comp.scope === 'global' ? 'amber' : 'purple'}
                                                        size="sm"
                                                    />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] border border-[#5448EE]/20">
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

                                            {/* Competition Name */}
                                            <Link href={`/competitions/${comp.id}`} className="block group-hover:text-[#5448EE] transition">
                                                <h3 className="text-base font-bold text-[#0E121B] leading-snug line-clamp-2">
                                                    {comp.name}
                                                </h3>
                                            </Link>

                                            <p className="text-xs text-neutral-500 mt-1 font-medium">
                                                Penyelenggara: <strong className="text-neutral-700">{comp.organizer}</strong>
                                            </p>

                                            {/* Description */}
                                            <p className="text-xs text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
                                                {comp.description}
                                            </p>

                                            {/* Deadline & Team Size Meta */}
                                            <div className="mt-4 p-3 rounded-2xl bg-[#FAF8FF] border border-[#5448EE]/15 flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1.5 text-neutral-600">
                                                    <Calendar className="size-3.5 text-[#5448EE]" />
                                                    <span className="text-[11px]">
                                                        Batas: <strong>{formattedDeadline}</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-neutral-600">
                                                    <Users className="size-3.5 text-neutral-400" />
                                                    <span className="text-[11px]">
                                                        {comp.min_team_size}-{comp.max_team_size} Orang
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                                                Skala: {comp.scope}
                                            </span>

                                            <Link
                                                href={`/competitions/${comp.id}`}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 group-hover:bg-[#5448EE] text-white text-xs font-bold transition shadow-2xs"
                                            >
                                                <span>Buka Detail Tim</span>
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
