import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Trophy, Calendar, CheckCircle, Search, ArrowRight, ShieldCheck } from 'lucide-react';
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
    { title: 'Competition Hub', href: '/competitions' },
];

export default function CompetitionIndex({ competitions, filters, categories, statuses }: Props) {
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
            <Head title="Competition Hub — RAKIT Campus" />

            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Competition Hub</h1>
                        <p className="text-sm text-neutral-500 mt-1">
                            Temukan kompetisi bergengsi, bentuk tim mahasiswa, dan raih prestasi bersama.
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari kompetisi, penyelenggara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </form>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <select
                            value={category}
                            onChange={(e) => handleFilterChange(e.target.value, status)}
                            className="text-xs bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-700"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={(e) => handleFilterChange(category, e.target.value)}
                            className="text-xs bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-700"
                        >
                            <option value="">Semua Status</option>
                            {statuses.map((s) => (
                                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Competitions Grid */}
                {competitions.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-neutral-300 text-center">
                        <div className="size-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-3">
                            <Trophy className="size-6" />
                        </div>
                        <h3 className="text-base font-semibold text-neutral-900">Belum ada kompetisi ditemukan</h3>
                        <p className="text-sm text-neutral-500 max-w-sm mt-1">
                            Sesuaikan kata kunci pencarian Anda untuk melihat kompetisi lainnya.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {competitions.data.map((comp) => (
                            <div
                                key={comp.id}
                                className="flex flex-col justify-between bg-white rounded-xl border border-neutral-200 p-5 hover:border-blue-400 hover:shadow-sm transition-all"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                            {comp.category.replace('_', ' ')}
                                        </span>
                                        {comp.verification_status === 'verified' && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                <ShieldCheck className="size-3" />
                                                Terverifikasi
                                            </span>
                                        )}
                                    </div>

                                    <Link href={`/competitions/${comp.id}`} className="block group">
                                        <h3 className="text-base font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                            {comp.name}
                                        </h3>
                                    </Link>

                                    <p className="text-xs text-neutral-500 mt-1">
                                        Oleh: <span className="text-neutral-800 font-medium">{comp.organizer}</span>
                                    </p>

                                    <p className="text-xs text-neutral-600 mt-3 line-clamp-2 leading-relaxed">
                                        {comp.description}
                                    </p>
                                </div>

                                <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="size-3.5 text-neutral-400" />
                                        <span>
                                            {comp.registration_deadline
                                                ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                                      day: 'numeric',
                                                      month: 'short',
                                                      year: 'numeric',
                                                  })
                                                : 'Belum ditentukan'}
                                        </span>
                                    </div>

                                    <Link
                                        href={`/competitions/${comp.id}`}
                                        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        Bentuk Tim
                                        <ArrowRight className="size-3" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
