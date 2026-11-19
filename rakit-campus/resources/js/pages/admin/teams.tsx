import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ExternalLink,
    Folder,
    FolderKanban,
    GraduationCap,
    MessageSquare,
    RefreshCw,
    Search,
    ShieldAlert,
    Trash2,
    Trophy,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';

interface TeamItem {
    id: number;
    name: string;
    description?: string | null;
    type: 'project' | 'competition';
    capacity: number;
    members_count?: number;
    deleted_at?: string | null;
    created_at: string;
    campus?: {
        id: number;
        name: string;
    };
    leader?: {
        id: number;
        name: string;
        email: string;
        avatar?: string | null;
        google_id?: string | null;
    } | null;
    project?: {
        id: number;
        title: string;
        slug: string;
        category?: string;
    } | null;
    participations?: Array<{
        competition?: {
            id: number;
            name: string;
            slug: string;
            category?: string;
        } | null;
    }>;
    members?: Array<{
        id: number;
        user?: {
            id: number;
            name: string;
            avatar?: string | null;
        } | null;
    }>;
}

interface Props {
    teams: {
        data: TeamItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
    };
    stats: {
        total: number;
        project_teams: number;
        competition_teams: number;
        trashed_teams: number;
    };
    filters: {
        search?: string;
        type?: string;
        status?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ruang Kerja Admin', href: '/admin' },
    { title: 'Kelola Tim', href: '/admin/teams' },
];

export default function AdminTeams({ teams, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [status, setStatus] = useState(filters.status || '');
    const [processingId, setProcessingId] = useState<number | null>(null);

    const applyFilters = (newParams: { search?: string; type?: string; status?: string }) => {
        router.get('/admin/teams', {
            search: (newParams.search !== undefined ? newParams.search : search) || undefined,
            type: (newParams.type !== undefined ? newParams.type : type) || undefined,
            status: (newParams.status !== undefined ? newParams.status : status) || undefined,
        }, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleFilterType = (newType: string) => {
        setType(newType);
        applyFilters({ type: newType });
    };

    const handleFilterStatus = (newStatus: string) => {
        setStatus(newStatus);
        applyFilters({ status: newStatus });
    };

    const handleDeleteTeam = (team: TeamItem, force = false) => {
        const confirmMsg = force
            ? `HAPUS PERMANEN tim "${team.name}"?\nSemua riwayat tugas, anggota, dan ruang kerja akan dimusnahkan dan tidak dapat dipulihkan.`
            : `Hapus tim "${team.name}"?\nTim akan dinonaktifkan dari ruang kerja dan masuk ke daftar sampah admin.`;

        if (!confirm(confirmMsg)) return;

        setProcessingId(team.id);
        router.delete(`/admin/teams/${team.id}${force ? '?force=true' : ''}`, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    const handleRestoreTeam = (team: TeamItem) => {
        if (!confirm(`Pulihkan tim "${team.name}" kembali ke status aktif?`)) return;

        setProcessingId(team.id);
        router.patch(`/admin/teams/${team.id}/restore`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessingId(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manajemen & Hapus Tim — Admin RAKIT Campus" />

            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 pb-5">
                    <div className="flex items-center gap-3.5">
                        <div className="size-11 rounded-xl bg-white border border-slate-200 shadow-2xs p-1.5 shrink-0 flex items-center justify-center">
                            <img
                                src="/images/rakit-mark.png"
                                alt="RAKIT"
                                className="size-8 object-contain"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                                    Manajemen & Hapus Tim
                                </h1>
                                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                                    Admin
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Pantau formasi tim proyek & tim kompetisi, periksa ketua tim, atau hapus tim yang tidak aktif
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/admin/students"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <Users className="size-3.5 text-blue-600" />
                            <span>Kelola Mahasiswa</span>
                        </Link>
                        <Link
                            href="/admin/competitions"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <Trophy className="size-3.5 text-amber-500" />
                            <span>Kelola Kompetisi</span>
                        </Link>
                        <Link
                            href="/admin/feedback"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
                        >
                            <MessageSquare className="size-3.5 text-slate-600" />
                            <span>Feedback</span>
                        </Link>
                    </div>
                </div>

                {/* Metrics Summary Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            setType('');
                            setStatus('');
                            applyFilters({ type: '', status: '' });
                        }}
                        className={`rounded-2xl p-4 border text-left transition-all cursor-pointer flex items-center justify-between ${
                            type === '' && status === ''
                                ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                        }`}
                    >
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Total Tim Aktif</span>
                            <span className="text-xl font-black text-slate-900 mt-0.5 block">{stats.total}</span>
                        </div>
                        <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <FolderKanban className="size-4" />
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFilterType(type === 'project' ? '' : 'project')}
                        className={`rounded-2xl p-4 border text-left transition-all cursor-pointer flex items-center justify-between ${
                            type === 'project'
                                ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                        }`}
                    >
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Tim Proyek</span>
                            <span className="text-xl font-black text-indigo-900 mt-0.5 block">{stats.project_teams}</span>
                        </div>
                        <div className="size-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Folder className="size-4" />
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFilterType(type === 'competition' ? '' : 'competition')}
                        className={`rounded-2xl p-4 border text-left transition-all cursor-pointer flex items-center justify-between ${
                            type === 'competition'
                                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                                : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                        }`}
                    >
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Tim Kompetisi</span>
                            <span className="text-xl font-black text-amber-900 mt-0.5 block">{stats.competition_teams}</span>
                        </div>
                        <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Trophy className="size-4" />
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleFilterStatus(status === 'trashed' ? '' : 'trashed')}
                        className={`rounded-2xl p-4 border text-left transition-all cursor-pointer flex items-center justify-between ${
                            status === 'trashed'
                                ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                                : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300'
                        }`}
                    >
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Sampah (Terhapus)</span>
                            <span className="text-xl font-black text-rose-700 mt-0.5 block">{stats.trashed_teams}</span>
                        </div>
                        <div className="size-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                            <Trash2 className="size-4" />
                        </div>
                    </button>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                    <form onSubmit={handleSearch} className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama tim, ketua, proyek, atau kompetisi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                        />
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Type Filter */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => handleFilterType('')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    type === ''
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Semua Tipe
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterType('project')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    type === 'project'
                                        ? 'bg-white text-indigo-600 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Tim Proyek
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterType('competition')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    type === 'competition'
                                        ? 'bg-white text-amber-600 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Tim Kompetisi
                            </button>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    status === ''
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Aktif
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('trashed')}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    status === 'trashed'
                                        ? 'bg-white text-rose-600 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Trash2 className="size-3" />
                                <span>Sampah</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('all')}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    status === 'all'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Semua
                            </button>
                        </div>
                    </div>
                </div>

                {/* Teams Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-3.5">Tim & Tipe</th>
                                    <th className="px-6 py-3.5">Ketua Tim</th>
                                    <th className="px-6 py-3.5">Anggota</th>
                                    <th className="px-6 py-3.5">Terkait Proyek / Kompetisi</th>
                                    <th className="px-6 py-3.5">Dibuat</th>
                                    <th className="px-6 py-3.5 text-right">Aksi Admin</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {teams.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            Tidak ada tim yang cocok dengan kriteria filter.
                                        </td>
                                    </tr>
                                ) : (
                                    teams.data.map((team) => {
                                        const isTrashed = Boolean(team.deleted_at);
                                        const membersCount = team.members_count ?? team.members?.length ?? 1;
                                        const leader = team.leader;
                                        const targetComp = team.participations?.[0]?.competition;
                                        const isGoogleLeader = Boolean(leader?.google_id);

                                        return (
                                            <tr key={team.id} className={`hover:bg-slate-50/70 transition-colors ${isTrashed ? 'bg-rose-50/20' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-2.5">
                                                        <div className="mt-0.5 size-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                                            {team.type === 'project' ? (
                                                                <Folder className="size-4 text-indigo-600" />
                                                            ) : (
                                                                <Trophy className="size-4 text-amber-500" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-slate-900 leading-snug">
                                                                    {team.name}
                                                                </span>
                                                                <span
                                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                                                        team.type === 'project'
                                                                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                                                    }`}
                                                                >
                                                                    {team.type === 'project' ? 'Proyek' : 'Kompetisi'}
                                                                </span>
                                                                {isTrashed && (
                                                                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase">
                                                                        Terhapus
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {team.description && (
                                                                <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-sm">
                                                                    {team.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    {leader ? (
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="size-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 overflow-hidden">
                                                                {leader.avatar ? (
                                                                    <img src={leader.avatar} alt={leader.name} className="size-full object-cover" />
                                                                ) : (
                                                                    leader.name.charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5 truncate">
                                                                    <span className="truncate">{leader.name}</span>
                                                                    {isGoogleLeader && (
                                                                        <span title="Ketua mendaftar/login via Google">
                                                                            <svg className="size-3 shrink-0" viewBox="0 0 24 24">
                                                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                                                            </svg>
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[11px] text-slate-400 truncate">{leader.email}</div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Tanpa Ketua</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                                                        <Users className="size-3 text-slate-400" />
                                                        <span>{membersCount} / {team.capacity}</span>
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    {team.project ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-700 max-w-xs truncate">
                                                            <FolderKanban className="size-3.5 text-indigo-500 shrink-0" />
                                                            <span className="truncate font-medium">{team.project.title}</span>
                                                        </div>
                                                    ) : targetComp ? (
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-700 max-w-xs truncate">
                                                            <Trophy className="size-3.5 text-amber-500 shrink-0" />
                                                            <span className="truncate font-medium">{targetComp.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>

                                                <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                                                    {new Date(team.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {!isTrashed && (
                                                            <>
                                                                <Link
                                                                    href={team.type === 'competition' ? `/competition-workspace/${targetComp?.slug || team.id}` : `/workspace/${team.id}`}
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
                                                                    title="Buka Ruang Kerja Tim"
                                                                >
                                                                    <span>Workspace</span>
                                                                    <ExternalLink className="size-3 text-slate-400" />
                                                                </Link>
                                                                <button
                                                                    type="button"
                                                                    disabled={processingId === team.id}
                                                                    onClick={() => handleDeleteTeam(team, false)}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer disabled:opacity-50"
                                                                    title="Hapus Tim Ini"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                    <span>Hapus Tim</span>
                                                                </button>
                                                            </>
                                                        )}

                                                        {isTrashed && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    disabled={processingId === team.id}
                                                                    onClick={() => handleRestoreTeam(team)}
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer disabled:opacity-50"
                                                                    title="Pulihkan Tim Ini"
                                                                >
                                                                    <RefreshCw className="size-3.5" />
                                                                    <span>Pulihkan</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={processingId === team.id}
                                                                    onClick={() => handleDeleteTeam(team, true)}
                                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition shadow-2xs cursor-pointer disabled:opacity-50"
                                                                    title="Hapus Permanen Dari Database"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                    <span>Hapus Permanen</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {teams.links && teams.links.length > 3 && (
                        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <div>
                                Menampilkan {teams.data.length} dari total {teams.total} tim
                            </div>
                            <div className="flex items-center gap-1">
                                {teams.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                            link.active
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
