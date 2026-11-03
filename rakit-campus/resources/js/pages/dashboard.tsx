import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Award,
    Calendar,
    CheckCircle2,
    Circle,
    Clock,
    FolderKanban,
    GraduationCap,
    Kanban,
    Layers,
    Plus,
    Search,
    ShieldCheck,
    Trophy,
    User,
    Users,
    Wand2,
} from 'lucide-react';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        is_lecturer?: boolean;
        campus: string;
        major: string;
        nim?: string;
        availability: string;
        skills: any[];
    };
    stats: {
        my_teams_count: number;
        pending_tasks_count: number;
        recommended_matches_count: number;
        upcoming_competitions_count: number;
        taught_classes_count?: number;
        total_students_count?: number;
        total_guided_projects_count?: number;
        enrolled_classes_count?: number;
    };
    myTeams: any[];
    myTasks: any[];
    recommendedProjects: any[];
    upcomingCompetitions: any[];
    recentActivities: any[];
    profileCompletion?: { percent: number; missing: string[] };
    taughtClasses?: any[];
    enrolledClasses?: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({
    user = {} as any,
    stats = {} as any,
    myTeams = [],
    myTasks = [],
    recommendedProjects = [],
    upcomingCompetitions = [],
    recentActivities = [],
    profileCompletion,
    taughtClasses = [],
    enrolledClasses = [],
}: Props) {
    const isLecturer = user?.role === 'lecturer' || user?.is_lecturer;

    const priorityBadge = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'urgent':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'high':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'medium':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return { label: 'Selesai', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
            case 'in_progress':
                return { label: 'Sedang Dikerjakan', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
            case 'in_review':
                return { label: 'Review', color: 'bg-purple-50 text-purple-700 border-purple-200' };
            default:
                return { label: 'Belum Mulai', color: 'bg-slate-100 text-slate-700 border-slate-200' };
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard — RAKIT Campus" />

            <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-20 font-sans">
                {/* Main Container */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col gap-6">

                    {/* 1. COMPACT PROFESSIONAL HEADER BAR */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="size-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shrink-0">
                                {user?.name ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'RC'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                                        {user?.name || 'Mahasiswa'}
                                    </h1>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${
                                        isLecturer
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    }`}>
                                        {isLecturer ? 'Dosen Pengampu' : 'Mahasiswa'}
                                    </span>
                                    {user?.nim && (
                                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                            {user.nim}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span>{user?.campus || 'Politeknik Negeri Indramayu'}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{user?.major || 'Teknik Informatika'}</span>
                                    {user?.availability && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-emerald-600 font-medium capitalize">
                                                {user.availability.replace(/_/g, ' ')}
                                            </span>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Primary Action Buttons */}
                        <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            {isLecturer ? (
                                <>
                                    <Link
                                        href="/classes"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                                    >
                                        <GraduationCap className="size-3.5" />
                                        <span>Manajemen Kelas</span>
                                    </Link>
                                    <Link
                                        href="/projects/create"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Buat Proyek</span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/projects/create"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Inisiasi Proyek</span>
                                    </Link>
                                    <Link
                                        href="/matching"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition"
                                    >
                                        <Search className="size-3.5" />
                                        <span>Cari Rekan & Tim</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Profile Completion Bar (Clean Banner) */}
                    {!isLecturer && profileCompletion && profileCompletion.percent < 100 && (
                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-amber-100 border border-amber-200 text-amber-800 font-bold flex items-center justify-center shrink-0">
                                    {profileCompletion.percent}%
                                </div>
                                <div>
                                    <span className="font-semibold text-slate-900">Kelengkapan profil Anda belum 100%.</span>
                                    <span className="text-slate-600 ml-1">Lengkapi data keahlian dan tautan portofolio untuk hasil matching yang lebih akurat.</span>
                                </div>
                            </div>
                            <Link
                                href="/settings/profile"
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold shrink-0 transition"
                            >
                                Lengkapi Sekarang
                            </Link>
                        </div>
                    )}

                    {/* 2. METRIC CARDS (CLEAN SAAS 4-COLUMN ROW) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {isLecturer ? (
                            <>
                                <Link
                                    href="/classes"
                                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Kelas Perkuliahan</span>
                                        <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                                            <GraduationCap className="size-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                                        {stats.taught_classes_count ?? 0}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                        <span>Kelas aktif semester ini</span>
                                        <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>

                                <Link
                                    href="/classes"
                                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Total Mahasiswa</span>
                                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                                            <Users className="size-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                                        {stats.total_students_count ?? 0}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                        <span>Terdaftar di seluruh kelas</span>
                                        <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>

                                <Link
                                    href="/classes"
                                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Kelompok Proyek</span>
                                        <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                                            <FolderKanban className="size-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                                        {stats.total_guided_projects_count ?? 0}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                        <span>Dalam bimbingan & evaluasi</span>
                                        <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>

                                <Link
                                    href="/classes"
                                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Smart Balancing</span>
                                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                                            <Wand2 className="size-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                                        Auto Group
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                        <span>Bagi tim otomatis per kelas</span>
                                        <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/workspace"
                                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Tim Kolaborasi</span>
                                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                                            <Kanban className="size-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                                        {stats.my_teams_count ?? 0}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                        <span>Papan kerja Kanban aktif</span>
                                        <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>

                                <Link
                                    href="/workspace"
                                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Tugas Menunggu</span>
                                        <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                                            <Clock className="size-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                                        {stats.pending_tasks_count ?? 0}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                        <span>Tugas ditugaskan ke Anda</span>
                                        <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>

                                <Link
                                    href="/matching"
                                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Peluang Match AI</span>
                                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                                            <FolderKanban className="size-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                                        {stats.recommended_matches_count ?? 0}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                        <span>Proyek cocok keahlian</span>
                                        <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>

                                <Link
                                    href="/competitions"
                                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-slate-500">Kompetisi Terbuka</span>
                                        <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                                            <Trophy className="size-4" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold tracking-tight text-slate-900 mt-2">
                                        {stats.upcoming_competitions_count ?? 0}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                                        <span>Pendaftaran lomba aktif</span>
                                        <ArrowRight className="size-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* 3. CORE WORKSPACE GRID (8 COLS MAIN + 4 COLS SIDEBAR) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* LEFT 8 COLUMNS: MAIN WORKFLOWS */}
                        <div className="lg:col-span-8 flex flex-col gap-6">

                            {/* SECTION A: LECTURER CLASSES (IF LECTURER) */}
                            {isLecturer && taughtClasses.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <GraduationCap className="size-4 text-slate-700" />
                                                <span>Kelas Perkuliahan Anda</span>
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">Daftar kelas aktif dengan kode pendaftaran dan kelompok tugas.</p>
                                        </div>
                                        <Link href="/classes" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                                            Lihat Semua &rarr;
                                        </Link>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                        {taughtClasses.map((cls: any) => (
                                            <div
                                                key={cls.id}
                                                className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 transition flex flex-col justify-between bg-slate-50/40"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                                                            {cls.code}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            Kode: <strong className="font-mono text-slate-900">{cls.join_code}</strong>
                                                        </span>
                                                    </div>
                                                    <h3 className="text-sm font-semibold text-slate-900">{cls.name}</h3>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        T.A {cls.academic_year} • Semester {cls.semester}
                                                    </p>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                                    <div className="text-slate-600">
                                                        <strong>{cls.students_count}</strong> Mhs • <strong>{cls.projects_count}</strong> Tim
                                                    </div>
                                                    <Link
                                                        href={`/classes/${cls.id}`}
                                                        className="font-semibold text-indigo-600 hover:text-indigo-800 transition"
                                                    >
                                                        Kelola &rarr;
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION B: ACTIVE TEAMS & WORKSPACES */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <Kanban className="size-4 text-slate-700" />
                                            <span>Tim Kolaborasi & Workspace</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">Progres penyelesaian milestone dan pengerjaan tugas tim.</p>
                                    </div>
                                    <Link href="/workspace" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                                        Semua Tim &rarr;
                                    </Link>
                                </div>

                                {myTeams.length === 0 ? (
                                    <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                        <FolderKanban className="size-8 text-slate-400 mx-auto mb-2" />
                                        <h3 className="text-xs font-semibold text-slate-800">Belum memiliki tim proyek</h3>
                                        <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
                                            Lamar lowongan posisi pada proyek yang tersedia atau buat proyek mandiri.
                                        </p>
                                        <div className="flex justify-center gap-2">
                                            <Link
                                                href="/projects"
                                                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
                                            >
                                                Jelajahi Proyek
                                            </Link>
                                            <Link
                                                href="/projects/create"
                                                className="px-3.5 py-1.5 border border-slate-300 hover:bg-white text-slate-700 rounded-lg text-xs font-semibold transition"
                                            >
                                                Buat Proyek
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {myTeams.map((team: any) => (
                                            <div
                                                key={team.id}
                                                className="border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition flex flex-col justify-between bg-white"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <h3 className="text-sm font-bold text-slate-900">{team.name}</h3>
                                                                {team.is_leader && (
                                                                    <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded">
                                                                        Leader
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {team.project && (
                                                                <p className="text-xs text-slate-600 font-medium mt-0.5 line-clamp-1">
                                                                    {team.project.title}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                                                            {team.type}
                                                        </span>
                                                    </div>

                                                    {/* Progress bar */}
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                            <span>Progress Tugas</span>
                                                            <span className="font-semibold text-slate-800">
                                                                {team.done_tasks} / {team.total_tasks} ({team.progress_percent}%)
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-slate-900 h-2 rounded-full transition-all"
                                                                style={{ width: `${Math.min(100, team.progress_percent)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-1 text-slate-500 truncate max-w-[180px]">
                                                        <Users className="size-3.5 text-slate-400 shrink-0" />
                                                        <span className="truncate">
                                                            {team.members ? team.members.map((m: any) => m.name).join(', ') : 'Belum ada anggota'}
                                                        </span>
                                                    </div>
                                                    <Link
                                                        href={`/workspace/${team.id}`}
                                                        className="font-semibold text-indigo-600 hover:text-indigo-800 transition flex items-center gap-1"
                                                    >
                                                        <span>Workspace</span>
                                                        <ArrowRight className="size-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* SECTION C: STUDENT ENROLLED CLASSES (IF STUDENT) */}
                            {!isLecturer && enrolledClasses.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                                <GraduationCap className="size-4 text-slate-700" />
                                                <span>Kelas Perkuliahan Anda</span>
                                            </h2>
                                            <p className="text-xs text-slate-500 mt-0.5">Daftar kelas kuliah yang Anda ikuti semester ini.</p>
                                        </div>
                                        <Link href="/classes" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                                            Semua Kelas &rarr;
                                        </Link>
                                    </div>

                                    <div className="flex flex-col gap-2.5">
                                        {enrolledClasses.map((cls: any) => (
                                            <div
                                                key={cls.id}
                                                className="p-3 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 transition"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                                                        {cls.code}
                                                    </span>
                                                    <div>
                                                        <h3 className="text-xs font-bold text-slate-900">{cls.name}</h3>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                                            {cls.students_count} Rekan Mahasiswa • {cls.projects_count} Kelompok Tugas
                                                        </p>
                                                    </div>
                                                </div>

                                                <Link
                                                    href={`/classes/${cls.id}`}
                                                    className="px-3 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-slate-300 transition"
                                                >
                                                    Detail &rarr;
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* SECTION D: MY PRIORITY KANBAN TASKS */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <CheckCircle2 className="size-4 text-emerald-600" />
                                            <span>Tugas Kanban Anda</span>
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">Tanggung jawab tugas yang sedang aktif di seluruh proyek Anda.</p>
                                    </div>
                                </div>

                                {myTasks.length === 0 ? (
                                    <div className="text-center py-8 px-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                                        <CheckCircle2 className="size-6 text-slate-400 mx-auto mb-1.5" />
                                        <p className="text-xs font-semibold text-slate-700">Tidak ada tugas tertunda</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Seluruh tugas Anda sudah selesai atau belum ada tugas yang didelegasikan kepada Anda.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                                        {myTasks.map((task: any) => {
                                            const status = statusBadge(task.status);
                                            return (
                                                <div
                                                    key={task.id}
                                                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                                                >
                                                    <div className="flex items-start gap-2.5">
                                                        <Circle className="size-4 text-slate-400 mt-0.5 shrink-0" />
                                                        <div>
                                                            <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                                                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                                                <span>Tim: <strong>{task.team?.name}</strong></span>
                                                                {task.milestone && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>Sprint: {task.milestone.title}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${priorityBadge(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${status.color}`}>
                                                            {status.label}
                                                        </span>
                                                        {task.team_id && (
                                                            <Link
                                                                href={`/workspace/${task.team_id}`}
                                                                className="text-slate-400 hover:text-slate-900 transition p-1"
                                                            >
                                                                <ArrowRight className="size-3.5" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* RIGHT 4 COLUMNS: DISCOVERY & RADAR */}
                        <div className="lg:col-span-4 flex flex-col gap-6">

                            {/* WIDGET 1: SMART MATCHING AI RADAR */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                            <Search className="size-3.5 text-indigo-600" />
                                            <span>Rekomendasi Proyek</span>
                                        </h3>
                                        <p className="text-[11px] text-slate-500">Kecocokan keahlian profil Anda</p>
                                    </div>
                                    <Link href="/matching" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                                        Semua &rarr;
                                    </Link>
                                </div>

                                {recommendedProjects.length === 0 ? (
                                    <p className="text-xs text-slate-500 py-3 text-center">
                                        Belum ada rekomendasi proyek baru.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-2.5">
                                        {recommendedProjects.map((rec: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="p-3 border border-slate-200 rounded-xl hover:border-slate-300 transition flex flex-col gap-1.5 bg-slate-50/30"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-slate-900 line-clamp-1">
                                                        {rec.project?.title || rec.title}
                                                    </span>
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                                        {rec.match_score}% Match
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 line-clamp-2">
                                                    {rec.explanation || rec.project?.short_description}
                                                </p>
                                                <div className="flex justify-end pt-1">
                                                    <Link
                                                        href={`/projects/${rec.project?.id || rec.project_id || rec.id}`}
                                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                                                    >
                                                        Lihat Detail &rarr;
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* WIDGET 2: UPCOMING COMPETITIONS */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                            <Trophy className="size-3.5 text-amber-600" />
                                            <span>Kompetisi Terbuka</span>
                                        </h3>
                                        <p className="text-[11px] text-slate-500">Peluang prestasi mahasiswa</p>
                                    </div>
                                    <Link href="/competitions" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
                                        Semua &rarr;
                                    </Link>
                                </div>

                                {upcomingCompetitions.length === 0 ? (
                                    <p className="text-xs text-slate-500 py-3 text-center">
                                        Tidak ada kompetisi aktif.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-2.5">
                                        {upcomingCompetitions.map((comp: any) => (
                                            <div
                                                key={comp.id}
                                                className="p-3 border border-slate-200 rounded-xl hover:border-slate-300 transition flex flex-col gap-1.5 bg-slate-50/30"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-bold text-slate-900 line-clamp-1">
                                                        {comp.name}
                                                    </span>
                                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase shrink-0">
                                                        {comp.category || 'Lomba'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 line-clamp-2">
                                                    {comp.theme || comp.organizer}
                                                </p>
                                                <div className="flex items-center justify-between pt-1 text-xs border-t border-slate-100 text-slate-500">
                                                    <span className="flex items-center gap-1 text-[11px]">
                                                        <Calendar className="size-3 text-slate-400" />
                                                        {comp.registration_deadline ? new Date(comp.registration_deadline).toLocaleDateString('id-ID') : 'Segera'}
                                                    </span>
                                                    <Link
                                                        href={`/competitions/${comp.id}`}
                                                        className="font-semibold text-indigo-600 hover:text-indigo-800 transition"
                                                    >
                                                        Daftar Tim &rarr;
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* WIDGET 3: RECENT ACTIVITIES STREAM */}
                            {recentActivities.length > 0 && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                                    <div className="pb-3 border-b border-slate-100 mb-3.5">
                                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                            <Activity className="size-3.5 text-slate-500" />
                                            <span>Aktivitas Terkini</span>
                                        </h3>
                                        <p className="text-[11px] text-slate-500">Pembaruan dari tim yang Anda ikuti</p>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        {recentActivities.map((act: any) => (
                                            <div key={act.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-none last:pb-0">
                                                <p className="text-slate-800 leading-snug">
                                                    <strong className="font-semibold text-slate-900">{act.actor?.name || 'Seseorang'}</strong>{' '}
                                                    <span className="text-slate-600">{act.description}</span>
                                                </p>
                                                <span className="text-[10px] text-slate-400 mt-1 block">
                                                    {act.team?.name} • {new Date(act.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
