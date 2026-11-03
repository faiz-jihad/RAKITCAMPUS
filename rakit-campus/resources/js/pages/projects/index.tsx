import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Users, Calendar, ArrowRight, Bookmark } from 'lucide-react';
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
    team?: { members: any[] };
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

export default function ProjectIndex({ projects, filters, categories, statuses }: Props) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Project Hub — RAKIT Campus" />

            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Project Hub</h1>
                        <p className="text-sm text-neutral-500 mt-1">
                            Temukan proyek mahasiswa, ikuti open recruitment, atau buat proyek kolaborasi Anda sendiri.
                        </p>
                    </div>
                    <Link
                        href="/projects/create"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm self-start md:self-auto"
                    >
                        <Plus className="size-4" />
                        Buat Proyek Baru
                    </Link>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                    <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Cari judul, topik, teknologi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </form>

                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        <select
                            value={category}
                            onChange={(e) => handleFilterChange(e.target.value, status)}
                            className="text-xs bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Kategori</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={(e) => handleFilterChange(category, e.target.value)}
                            className="text-xs bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Status</option>
                            {statuses.map((s) => (
                                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Projects Grid */}
                {projects.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-neutral-300 text-center">
                        <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                            <Plus className="size-6" />
                        </div>
                        <h3 className="text-base font-semibold text-neutral-900">Belum ada proyek yang cocok</h3>
                        <p className="text-sm text-neutral-500 max-w-sm mt-1">
                            Coba sesuaikan kata kunci pencarian Anda atau buat proyek baru untuk memulai tim.
                        </p>
                        <Link
                            href="/projects/create"
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                        >
                            Mulai Proyek Pertama
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {projects.data.map((proj) => (
                            <div
                                key={proj.id}
                                className="flex flex-col justify-between bg-white rounded-xl border border-neutral-200 p-5 hover:border-blue-400 hover:shadow-sm transition-all"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                            {proj.category.replace('_', ' ')}
                                        </span>
                                        <span className="text-[11px] font-medium text-neutral-500 capitalize">
                                            {proj.status.replace('_', ' ')}
                                        </span>
                                    </div>

                                    <Link href={`/projects/${proj.id}`} className="block group">
                                        <h3 className="text-base font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {proj.title}
                                        </h3>
                                    </Link>

                                    <p className="text-xs text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
                                        {proj.short_description}
                                    </p>

                                    {/* Tech Stack badges */}
                                    <div className="flex flex-wrap gap-1 mt-3">
                                        {proj.tech_stack?.slice(0, 4).map((tech, i) => (
                                            <span key={i} className="text-[10px] bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="size-3.5 text-neutral-400" />
                                        <span>{proj.team?.members?.length || 1} Anggota</span>
                                    </div>

                                    <Link
                                        href={`/projects/${proj.id}`}
                                        className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-800"
                                    >
                                        Detail
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
