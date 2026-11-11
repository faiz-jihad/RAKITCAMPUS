import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    ExternalLink,
    FolderKanban,
    MoreHorizontal,
    Plus,
    QrCode,
    UserCheck,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface Props {
    isPublic?: boolean;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        is_lecturer?: boolean;
        campus: string;
        major: string;
        nim?: string;
        academic_status?: string;
        batch_year?: string;
        headline?: string;
        availability: string;
        skills: any[];
    };
    stats: {
        my_teams_count: number;
        pending_tasks_count: number;
        completed_tasks_count?: number;
        team_readiness_avg?: number;
        recommended_matches_count: number;
        taught_classes_count?: number;
        total_students_count?: number;
        total_guided_projects_count?: number;
        enrolled_classes_count?: number;
    };
    myTeams?: any[];
    myTasks?: any[];
    teammates?: any[];
    monthlyActivity?: Array<{
        month: string;
        done_tasks: number;
        logs: number;
        percent: number;
    }>;
    recommendedProjects?: any[];
    recentActivities?: any[];
    profileCompletion?: { percent: number; missing: string[] };
}

export default function Dashboard({
    user = {} as any,
    stats = {} as any,
    myTeams = [],
    myTasks = [],
    teammates = [],
    monthlyActivity = [],
    recommendedProjects = [],
    profileCompletion,
}: Props) {
    const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

    const firstName = user?.name ? user.name.split(' ')[0] : 'Mahasiswa';
    const initials = (user?.name || 'Mahasiswa')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0].toUpperCase())
        .join('');

    const completedTasks = stats?.completed_tasks_count ?? 0;
    const pendingTasks = stats?.pending_tasks_count ?? 0;
    const totalTasks = completedTasks + pendingTasks;
    const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const readinessScore = profileCompletion?.percent ?? stats?.team_readiness_avg ?? 0;

    // Monthly activity data
    const displayMonthlyActivity = monthlyActivity && monthlyActivity.length === 6
        ? monthlyActivity
        : [
              { month: 'Jan', done_tasks: 0, logs: 0, percent: 0 },
              { month: 'Feb', done_tasks: completedTasks, logs: 0, percent: taskPercent },
              { month: 'Mar', done_tasks: 0, logs: 0, percent: 0 },
              { month: 'Apr', done_tasks: 0, logs: 0, percent: 0 },
              { month: 'Mei', done_tasks: 0, logs: 0, percent: 0 },
              { month: 'Jun', done_tasks: 0, logs: 0, percent: 0 },
          ];

    const defaultActiveIndex = displayMonthlyActivity.reduce(
        (maxIdx, item, idx, arr) => (item.percent > arr[maxIdx].percent ? idx : maxIdx),
        1
    );
    const activeMonthIdx = hoveredMonth !== null ? hoveredMonth : defaultActiveIndex;

    const displayTeammates = teammates || [];

    return (
        <AppLayout activeTab="dashboard" title="Dashboard - RakitCampus">
            {/* 1. HEADER ROW */}
            <section className="flex items-center justify-between gap-4 pb-5 border-b border-slate-200/80 mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Dashboard
                </h1>

                <div className="flex items-center gap-2.5">
                    <Link
                        href="/projects/create"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Buat Proyek</span>
                    </Link>
                    <Link
                        href="/workspace"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold shadow-2xs transition"
                    >
                        <span>Workspace Tim</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                </div>
            </section>

            {/* 2. REAL METRIC SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Metric 1: Tasks */}
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Progres Tugas
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {completedTasks}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                / {totalTasks > 0 ? totalTasks : 0} Selesai
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                            <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${taskPercent}%` }}
                            />
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                            {pendingTasks} tugas aktif menunggu
                        </span>
                    </div>
                </div>

                {/* Metric 2: Teams */}
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Tim Akademik
                            </span>
                            <Users className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {stats?.my_teams_count ?? 0}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                Tim Terdaftar
                            </span>
                        </div>
                    </div>
                    <Link
                        href="/projects"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition flex items-center justify-between"
                    >
                        <span>{myTeams.length > 0 ? myTeams[0].name : 'Eksplor tim kelas'}</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Metric 3: Readiness */}
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Kesiapan Profil
                            </span>
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {readinessScore}%
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                Siap Kolaborasi
                            </span>
                        </div>
                    </div>
                    <Link
                        href="/settings/profile"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition flex items-center justify-between"
                    >
                        <span>Kelola keahlian & biodata</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Metric 4: Recommendations */}
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Rekrutmen Terbuka
                            </span>
                            <FolderKanban className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                {recommendedProjects.length}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                Proyek Kelas
                            </span>
                        </div>
                    </div>
                    <Link
                        href="/projects"
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition flex items-center justify-between"
                    >
                        <span>Cari proyek yang sesuai</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* 3. MAIN CONTENT (TWO COLUMNS: 8 COLS / 4 COLS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: TASKS & ACTIVE PROJECTS */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Panel 1: Tugas Prioritas */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    Tugas Prioritas
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Daftar tugas yang memerlukan tindakan Anda
                                </p>
                            </div>
                            <Link
                                href="/workspace"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                            >
                                Buka Workspace Tim →
                            </Link>
                        </div>

                        {myTasks && myTasks.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {myTasks.slice(0, 4).map((task: any, idx: number) => {
                                    const dueDate = task.due_date ? new Date(task.due_date) : null;
                                    const isUrgent = dueDate && dueDate < new Date(Date.now() + 3 * 86400000);

                                    return (
                                        <div
                                            key={task.id || idx}
                                            className="py-3 flex items-center justify-between gap-3 group"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <Link
                                                    href="/workspace"
                                                    className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition block truncate"
                                                >
                                                    {task.title}
                                                </Link>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                                    <span>{task.team?.name || 'Tugas Proyek'}</span>
                                                    {dueDate && (
                                                        <>
                                                            <span>•</span>
                                                            <span className={isUrgent ? 'text-rose-600 font-medium' : ''}>
                                                                Tenggat: {dueDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 shrink-0">
                                                {task.status || 'Aktif'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-400">
                                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="font-semibold text-slate-700">Semua tugas telah diselesaikan</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada tugas mendesak saat ini.</p>
                            </div>
                        )}
                    </div>

                    {/* Panel 2: Proyek Kelas & Living Proposal */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    Proyek Akademik Anda
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Living proposal dan manajemen tim kuliah
                                </p>
                            </div>
                            <Link
                                href="/projects"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                            >
                                Semua Proyek →
                            </Link>
                        </div>

                        {myTeams && myTeams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {myTeams.map((team: any) => (
                                    <div
                                        key={team.id}
                                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between gap-3"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                                    PROYEK KELAS
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-medium">
                                                    {team.members_count || 1} Anggota
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                                                {team.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {team.description || 'Ruang kolaborasi tim mahasiswa RakitCampus.'}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-500">
                                                Progress: {team.progress_percent ?? 0}%
                                            </span>
                                            <Link
                                                href={team.project ? `/projects/${team.project.slug || team.project.id}` : `/workspace/${team.id}`}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                            >
                                                Buka Detail →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-slate-400">
                                <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="font-semibold text-slate-700">Belum tergabung dalam tim proyek</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Mulai dengan membuat proyek baru atau mengajukan diri ke tim kelas.</p>
                                <Link
                                    href="/projects/create"
                                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs transition"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Buat Proyek Baru</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Panel 3: Rekomendasi Proyek Kelas */}
                    {recommendedProjects && recommendedProjects.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Proyek yang Membuka Rekrutmen
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Peluang kolaborasi seimbang sesuai keahlian Anda
                                    </p>
                                </div>
                                <Link
                                    href="/projects"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                >
                                    Eksplorasi Semua →
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {recommendedProjects.slice(0, 2).map((proj: any) => (
                                    <Link
                                        key={proj.id}
                                        href={`/projects/${proj.slug || proj.id}`}
                                        className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-400 hover:bg-slate-50/50 transition flex flex-col justify-between gap-3 group block"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                                    {proj.category || 'AKADEMIK'}
                                                </span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {proj.status === 'recruiting' ? 'Merekrut' : 'Aktif'}
                                                </span>
                                            </div>
                                            <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                                {proj.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {proj.short_description || 'Proyek kolaborasi terpadu mahasiswa.'}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="text-[11px] text-slate-400">
                                                {proj.leader?.name || 'Mahasiswa'}
                                            </span>
                                            <span className="font-semibold text-blue-600 flex items-center gap-0.5">
                                                Detail ↗
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: PROFILE, ACTIVITY & TEAMMATES */}
                <div className="lg:col-span-4 space-y-6">
                    {/* User Card */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                            <h2 className="text-sm font-bold text-slate-900">
                                Profil Mahasiswa
                            </h2>
                            <Link
                                href="/settings/profile"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                            >
                                Edit Profil
                            </Link>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 font-bold text-xs flex items-center justify-center shrink-0">
                                {initials || 'RC'}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                    {user?.name || 'Mahasiswa'}
                                </h3>
                                <p className="text-xs text-slate-500 truncate">
                                    {user?.headline || user?.major || 'Teknik Informatika'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                            <div>
                                <span className="text-[10px] text-slate-400 block">NIM</span>
                                <span className="font-semibold text-slate-800">{user?.nim || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block">Status</span>
                                <span className="font-semibold text-emerald-600">Aktif</span>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Activity Feed */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                            <h2 className="text-sm font-bold text-slate-900">
                                Laporan Aktivitas Tim
                            </h2>
                            <span className="text-[11px] text-slate-400">6 Bulan</span>
                        </div>

                        {/* 6 Monthly Pillars */}
                        <div className="pt-2">
                            <div className="grid grid-cols-6 gap-2 items-end h-28 relative px-1">
                                {displayMonthlyActivity.map((item, idx) => {
                                    const isActive = idx === activeMonthIdx;

                                    return (
                                        <div
                                            key={idx}
                                            className="flex flex-col items-center h-full justify-end relative group cursor-pointer"
                                            onMouseEnter={() => setHoveredMonth(idx)}
                                            onMouseLeave={() => setHoveredMonth(null)}
                                        >
                                            {isActive && (
                                                <div className="absolute -top-10 z-20 bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md shadow-md whitespace-nowrap pointer-events-none">
                                                    <span>{item.done_tasks} tugas selesai</span>
                                                </div>
                                            )}

                                            <div
                                                className={`w-full max-w-[28px] rounded-t-md transition-all duration-200 ${
                                                    isActive
                                                        ? 'bg-blue-600 ring-2 ring-blue-300'
                                                        : 'bg-slate-200 group-hover:bg-blue-400'
                                                }`}
                                                style={{ height: `${Math.max(12, item.percent)}%` }}
                                            />
                                            <span
                                                className={`text-[10px] font-semibold mt-1.5 ${
                                                    isActive ? 'text-slate-900 font-bold' : 'text-slate-400'
                                                }`}
                                            >
                                                {item.month}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Teammates List */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
                            <h2 className="text-sm font-bold text-slate-900">
                                Rekan Kolaborasi
                            </h2>
                            <Link
                                href="/projects"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                            >
                                Cari Rekan
                            </Link>
                        </div>

                        {displayTeammates.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {displayTeammates.map((mate: any, idx: number) => {
                                    const mateInitials = (mate.name || 'M')
                                        .split(' ')
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((w: string) => w[0].toUpperCase())
                                        .join('');

                                    return (
                                        <div key={mate.id || idx} className="py-2.5 flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-[11px] text-slate-700 flex items-center justify-center shrink-0">
                                                {mateInitials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-semibold text-slate-900 truncate">
                                                    {mate.name}
                                                </h3>
                                                <p className="text-[11px] text-slate-400 truncate">
                                                    {mate.role || 'Mahasiswa'} {mate.team ? `• ${mate.team}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-4 text-center text-xs text-slate-400">
                                Belum ada rekan tim aktif
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
