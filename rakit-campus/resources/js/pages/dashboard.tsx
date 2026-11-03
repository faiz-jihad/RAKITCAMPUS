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
    Clock,
    FolderKanban,
    GraduationCap,
    Kanban,
    Plus,
    Search,
    ShieldCheck,
    Sparkles,
    Trophy,
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
    user,
    stats,
    myTeams = [],
    myTasks = [],
    recommendedProjects = [],
    upcomingCompetitions = [],
    recentActivities = [],
    profileCompletion,
    taughtClasses = [],
    enrolledClasses = [],
}: Props) {
    const isLecturer = user.role === 'lecturer' || user.is_lecturer;

    const priorityColors: Record<string, string> = {
        urgent: 'bg-rose-50 text-rose-700 border-rose-200',
        high: 'bg-amber-50 text-amber-700 border-amber-200',
        medium: 'bg-[#EEEDFD] text-[#5448EE] border-[#5448EE]/20',
        low: 'bg-neutral-50 text-neutral-600 border-neutral-200',
    };

    const statusLabels: Record<string, string> = {
        todo: 'To Do',
        in_progress: 'In Process',
        in_review: 'In Review',
        completed: 'Completed',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard — RAKIT Campus" />

            {/* Atmosphere top glow */}
            <div className="relative flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full selection:bg-[#5448EE] selection:text-white">
                <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#EAE6FF]/40 via-[#F6F4FE]/20 to-transparent pointer-events-none -z-10" />

                {/* 1. Hero Identity Banner (TaskGo Dark Indigo Card) */}
                <div className="bg-gradient-to-r from-[#181135] via-[#231752] to-[#181135] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-[#5448EE]/20 blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            {/* Status Pills */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                {isLecturer ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30">
                                        <GraduationCap className="size-3.5 text-purple-300" />
                                        Dosen Pengampu & Pembimbing Terverifikasi
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        <ShieldCheck className="size-3.5" />
                                        Mahasiswa Terverifikasi
                                    </span>
                                )}

                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-neutral-200 border border-white/15">
                                    {user.campus}
                                </span>

                                {!isLecturer && user.nim && (
                                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/10 text-neutral-300">
                                        NIM: {user.nim}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Halo, {user.name} 👋
                            </h1>
                            <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 max-w-2xl leading-relaxed">
                                {isLecturer
                                    ? 'Kelola daftar mahasiswa per kelas perkuliahan, monitor kelompok tugas besar/capstone, dan lakukan Smart Team Balancing otomatis.'
                                    : `${user.major} • Bangun tim kolaborasi mahasiswa, selesaikan tugas Kanban, dan raih prestasi nyata di kompetisi kampus.`}
                            </p>

                            {/* Skills or Lecturer tag */}
                            {!isLecturer && user.skills && user.skills.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-4">
                                    <span className="text-xs text-neutral-400">Keahlian Anda:</span>
                                    {user.skills.slice(0, 5).map((s: any) => (
                                        <span key={s.id} className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-neutral-200 font-medium">
                                            {s.name}
                                        </span>
                                    ))}
                                    {user.skills.length > 5 && (
                                        <span className="text-[11px] text-neutral-400">+{user.skills.length - 5} lainnya</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quick CTA Buttons (Pills) */}
                        <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
                            {isLecturer ? (
                                <>
                                    <Link
                                        href="/classes"
                                        className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all"
                                    >
                                        <GraduationCap className="size-3.5" />
                                        Manajemen Kelas Kuliah
                                    </Link>
                                    <Link
                                        href="/projects/create"
                                        className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold border border-white/20 transition-all"
                                    >
                                        <Plus className="size-3.5" />
                                        Inisiasi Proyek / Tugas
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/projects/create"
                                        className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all"
                                    >
                                        <Plus className="size-3.5" />
                                        Buat Proyek Baru
                                    </Link>
                                    <Link
                                        href="/classes"
                                        className="inline-flex items-center justify-center gap-1.5 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-semibold border border-white/20 transition-all"
                                    >
                                        <GraduationCap className="size-3.5" />
                                        Kelas & Bimbingan Dosen
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Completion Alert if incomplete (for students) */}
                {!isLecturer && profileCompletion && profileCompletion.percent < 80 && (
                    <div className="bg-gradient-to-r from-[#EEEDFD] to-white border border-[#5448EE]/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-[#5448EE]/10 text-[#5448EE] flex items-center justify-center text-xs font-bold shrink-0">
                                {profileCompletion.percent}%
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-neutral-900">Kelengkapan Profil Belum 100%</h4>
                                <p className="text-[11px] text-neutral-500">
                                    Lengkapi keahlian dan jam ketersediaan agar algoritma Smart Matching dapat merekomendasikan proyek secara presisi.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/settings/profile"
                            className="px-4 py-2 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-semibold self-start sm:self-auto transition shadow-xs"
                        >
                            Lengkapi Profil
                        </Link>
                    </div>
                )}

                {/* 2. 4 Metric Cards (Matching the TaskGo Bento Card aesthetic) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isLecturer ? (
                        <>
                            {/* Lecturer Stat 1: Classes */}
                            <Link
                                href="/classes"
                                className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/90 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group"
                            >
                                <div className="size-8 rounded-full bg-purple-100 text-[#5448EE] flex items-center justify-center absolute top-5 right-5 group-hover:scale-110 transition-transform">
                                    <ArrowUpRight className="size-4" />
                                </div>
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                    Kelas Perkuliahan
                                </span>
                                <div className="text-3xl font-extrabold text-neutral-900 mt-2">
                                    {stats.taught_classes_count ?? 0} <span className="text-base font-semibold text-neutral-500">Kelas</span>
                                </div>
                                <p className="text-xs text-[#5448EE] font-medium mt-3">
                                    Buka manajemen kelas &rarr;
                                </p>
                            </Link>

                            {/* Lecturer Stat 2: Total Students */}
                            <Link
                                href="/classes"
                                className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/90 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group"
                            >
                                <div className="size-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center absolute top-5 right-5 group-hover:scale-110 transition-transform">
                                    <Users className="size-4" />
                                </div>
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                    Mahasiswa Terdaftar
                                </span>
                                <div className="text-3xl font-extrabold text-neutral-900 mt-2">
                                    {stats.total_students_count ?? 0} <span className="text-base font-semibold text-neutral-500">Mahasiswa</span>
                                </div>
                                <p className="text-xs text-emerald-600 font-medium mt-3">
                                    Pantau status kelompok &rarr;
                                </p>
                            </Link>

                            {/* Lecturer Stat 3: Guided Project Groups */}
                            <Link
                                href="/classes"
                                className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/90 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group"
                            >
                                <div className="size-8 rounded-full bg-purple-100 text-[#5448EE] flex items-center justify-center absolute top-5 right-5 group-hover:scale-110 transition-transform">
                                    <FolderKanban className="size-4" />
                                </div>
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                    Kelompok Proyek
                                </span>
                                <div className="text-3xl font-extrabold text-neutral-900 mt-2">
                                    {stats.total_guided_projects_count ?? 0} <span className="text-base font-semibold text-neutral-500">Kelompok</span>
                                </div>
                                <p className="text-xs text-[#5448EE] font-medium mt-3">
                                    Bimbingan & evaluasi &rarr;
                                </p>
                            </Link>

                            {/* Lecturer Stat 4: Smart Balancing shortcut */}
                            <Link
                                href="/classes"
                                className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/90 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group"
                            >
                                <div className="size-8 rounded-full bg-indigo-100 text-[#5448EE] flex items-center justify-center absolute top-5 right-5 group-hover:scale-110 transition-transform">
                                    <Wand2 className="size-4" />
                                </div>
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                    Smart Balancing
                                </span>
                                <div className="text-3xl font-extrabold text-neutral-900 mt-2">
                                    Auto <span className="text-base font-semibold text-neutral-500">Bentuk Tim</span>
                                </div>
                                <p className="text-xs text-[#5448EE] font-medium mt-3">
                                    Bagi anak belum ada tim &rarr;
                                </p>
                            </Link>
                        </>
                    ) : (
                        <>
                            {/* Student Stat 1: Teams */}
                            <Link
                                href="/workspace"
                                className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/90 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group"
                            >
                                <div className="size-8 rounded-full bg-purple-100 text-[#5448EE] flex items-center justify-center absolute top-5 right-5 group-hover:scale-110 transition-transform">
                                    <ArrowUpRight className="size-4" />
                                </div>
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                    Tim & Workspace
                                </span>
                                <div className="text-3xl font-extrabold text-neutral-900 mt-2">
                                    {stats.my_teams_count} <span className="text-base font-semibold text-neutral-500">Tim Aktif</span>
                                </div>
                                <p className="text-xs text-[#5448EE] font-medium mt-3">
                                    Buka papan Kanban kolaborasi &rarr;
                                </p>
                            </Link>

                            {/* Student Stat 2: Classes */}
                            <Link
                                href="/classes"
                                className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/90 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group"
                            >
                                <div className="size-8 rounded-full bg-purple-100 text-[#5448EE] flex items-center justify-center absolute top-5 right-5 group-hover:scale-110 transition-transform">
                                    <GraduationCap className="size-4" />
                                </div>
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                    Kelas Kuliah Saya
                                </span>
                                <div className="text-3xl font-extrabold text-neutral-900 mt-2">
                                    {stats.enrolled_classes_count ?? 0} <span className="text-base font-semibold text-neutral-500">Kelas</span>
                                </div>
                                <p className="text-xs text-[#5448EE] font-medium mt-3">
                                    Cek pembagian kelompok &rarr;
                                </p>
                            </Link>

                            {/* Student Stat 3: Matching Opportunities */}
                            <Link
                                href="/matching"
                                className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/90 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group"
                            >
                                <div className="size-8 rounded-full bg-purple-100 text-[#5448EE] flex items-center justify-center absolute top-5 right-5 group-hover:scale-110 transition-transform">
                                    <ArrowUpRight className="size-4" />
                                </div>
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                    Peluang Match AI
                                </span>
                                <div className="text-3xl font-extrabold text-neutral-900 mt-2">
                                    {stats.recommended_matches_count} <span className="text-base font-semibold text-neutral-500">Proyek</span>
                                </div>
                                <p className="text-xs text-[#5448EE] font-medium mt-3">
                                    Sesuai keahlian & minat Anda &rarr;
                                </p>
                            </Link>

                            {/* Student Stat 4: Competitions */}
                            <Link
                                href="/competitions"
                                className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/90 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group"
                            >
                                <div className="size-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center absolute top-5 right-5 group-hover:scale-110 transition-transform">
                                    <Trophy className="size-4" />
                                </div>
                                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                                    Kompetisi Terbuka
                                </span>
                                <div className="text-3xl font-extrabold text-neutral-900 mt-2">
                                    {stats.upcoming_competitions_count} <span className="text-base font-semibold text-neutral-500">Lomba</span>
                                </div>
                                <p className="text-xs text-amber-600 font-medium mt-3">
                                    Bentuk tim & raih prestasi &rarr;
                                </p>
                            </Link>
                        </>
                    )}
                </div>

                {/* 3. Main 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Classes/Teams & Tasks */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* Lecturer Dedicated Classes Section */}
                        {isLecturer && taughtClasses.length > 0 && (
                            <div className="bg-white/95 border border-neutral-200/90 rounded-3xl p-6 shadow-2xs">
                                <div className="flex items-center justify-between mb-5 pb-4 border-b border-neutral-100">
                                    <div>
                                        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                            <GraduationCap className="size-4 text-[#5448EE]" />
                                            Kelas Kuliah yang Anda Ampu
                                        </h2>
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                            Akses langsung ke daftar mahasiswa, kode join, dan auto team balancing.
                                        </p>
                                    </div>
                                    <Link
                                        href="/classes"
                                        className="text-xs font-semibold text-[#5448EE] hover:text-[#4336D6] transition"
                                    >
                                        Semua Kelas &rarr;
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {taughtClasses.map((cls: any) => (
                                        <div
                                            key={cls.id}
                                            className="p-4 border border-purple-100/80 rounded-2xl bg-gradient-to-b from-[#FDFCFF] to-[#F8F6FE] flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5448EE]/10 text-[#5448EE] font-bold">
                                                        {cls.code}
                                                    </span>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-neutral-600 font-medium">
                                                        Kode Join: <strong className="font-mono text-[#5448EE]">{cls.join_code}</strong>
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-neutral-900">{cls.name}</h3>
                                                <p className="text-xs text-neutral-500 mt-0.5">
                                                    T.A {cls.academic_year} • Semester {cls.semester}
                                                </p>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-purple-100/60 flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-xs text-neutral-600">
                                                    <span><strong>{cls.students_count}</strong> Mhs</span>
                                                    <span>•</span>
                                                    <span><strong>{cls.projects_count}</strong> Tim</span>
                                                </div>
                                                <Link
                                                    href={`/classes/${cls.id}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#181135] hover:bg-neutral-900 text-white rounded-full text-xs font-semibold transition"
                                                >
                                                    Kelola Kelas
                                                    <ArrowRight className="size-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Student Enrolled Classes Banner */}
                        {!isLecturer && enrolledClasses.length > 0 && (
                            <div className="bg-white/95 border border-neutral-200/90 rounded-3xl p-6 shadow-2xs">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                                    <div>
                                        <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                            <GraduationCap className="size-4 text-[#5448EE]" />
                                            Kelas Kuliah Terdaftar
                                        </h2>
                                        <p className="text-xs text-neutral-500 mt-0.5">
                                            Cek kelompok proyek kelas Anda dan catatan bimbingan dosen pengampu.
                                        </p>
                                    </div>
                                    <Link
                                        href="/classes"
                                        className="text-xs font-semibold text-[#5448EE] hover:text-[#4336D6] transition"
                                    >
                                        Buka Kelas &rarr;
                                    </Link>
                                </div>

                                <div className="flex flex-col gap-2.5">
                                    {enrolledClasses.map((cls: any) => (
                                        <div
                                            key={cls.id}
                                            className="p-3.5 border border-neutral-200/80 rounded-2xl bg-neutral-50/60 flex items-center justify-between gap-3 hover:bg-neutral-50 transition"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-neutral-200 font-bold text-neutral-800">
                                                        {cls.code}
                                                    </span>
                                                    <h3 className="text-xs font-bold text-neutral-900">{cls.name}</h3>
                                                </div>
                                                <p className="text-[11px] text-neutral-500 mt-1">
                                                    {cls.students_count} Rekan Mahasiswa • {cls.projects_count} Kelompok Tugas
                                                </p>
                                            </div>

                                            <Link
                                                href={`/classes/${cls.id}`}
                                                className="px-3.5 py-1.5 rounded-full bg-white border border-neutral-200 hover:border-[#5448EE] text-neutral-700 hover:text-[#5448EE] text-xs font-semibold transition"
                                            >
                                                Lihat Roster & Tim
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Section: My Teams & Workspaces */}
                        <div className="bg-white/95 border border-neutral-200/90 rounded-3xl p-6 shadow-2xs">
                            <div className="flex items-center justify-between mb-5 pb-4 border-b border-neutral-100">
                                <div>
                                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                        <Kanban className="size-4 text-[#5448EE]" />
                                        Tim Kolaborasi & Workspace
                                    </h2>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        Papan kerja tim untuk pembagian tugas, sprint, dan milestone.
                                    </p>
                                </div>
                                <Link
                                    href="/workspace"
                                    className="text-xs font-semibold text-[#5448EE] hover:text-[#4336D6] transition"
                                >
                                    Lihat Semua &rarr;
                                </Link>
                            </div>

                            {myTeams.length === 0 ? (
                                <div className="text-center py-10 px-4 bg-neutral-50/70 rounded-2xl border border-dashed border-neutral-200">
                                    <FolderKanban className="size-8 text-neutral-400 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-neutral-700">Belum tergabung dalam tim manapun</p>
                                    <p className="text-[11px] text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
                                        Lamar posisi di proyek kampus atau buat proyek Anda sendiri untuk memulai kolaborasi.
                                    </p>
                                    <div className="flex justify-center gap-2">
                                        <Link
                                            href="/projects"
                                            className="px-5 py-2 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-semibold transition"
                                        >
                                            Cari Proyek
                                        </Link>
                                        <Link
                                            href="/projects/create"
                                            className="px-5 py-2 border border-neutral-200 hover:bg-white text-neutral-700 rounded-full text-xs font-semibold transition"
                                        >
                                            Buat Proyek
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3.5">
                                    {myTeams.map((team: any) => (
                                        <div
                                            key={team.id}
                                            className="p-4 border border-neutral-200/90 rounded-2xl hover:border-purple-200 hover:shadow-xs transition bg-white flex flex-col justify-between"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-bold text-neutral-900">{team.name}</h3>
                                                        {team.is_leader && (
                                                            <span className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
                                                                Leader
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium capitalize">
                                                            {team.type}
                                                        </span>
                                                    </div>
                                                    {team.project && (
                                                        <p className="text-xs text-[#5448EE] font-medium mt-0.5">
                                                            {team.project.title}
                                                        </p>
                                                    )}
                                                </div>

                                                <Link
                                                    href={`/workspace/${team.id}`}
                                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#181135] hover:bg-neutral-900 text-white rounded-full text-xs font-semibold self-start sm:self-auto transition"
                                                >
                                                    <Kanban className="size-3" />
                                                    Buka Workspace
                                                    <ArrowRight className="size-3" />
                                                </Link>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mt-3">
                                                <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                                                    <span>Penyelesaian Tugas</span>
                                                    <span className="font-semibold text-neutral-800">
                                                        {team.done_tasks} / {team.total_tasks} ({team.progress_percent}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-[#5448EE] h-1.5 rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, team.progress_percent)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Members avatar stack */}
                                            <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                                                <div className="flex items-center gap-2">
                                                    <Users className="size-3.5 text-neutral-400" />
                                                    <span>{team.members.map((m: any) => m.name).join(', ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Section: My Assigned Tasks */}
                        <div className="bg-white/95 border border-neutral-200/90 rounded-3xl p-6 shadow-2xs">
                            <div className="flex items-center justify-between mb-5 pb-4 border-b border-neutral-100">
                                <div>
                                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        Tugas Kanban Prioritas Saya
                                    </h2>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        Tugas yang ditugaskan kepada Anda di seluruh papan kerja tim.
                                    </p>
                                </div>
                            </div>

                            {myTasks.length === 0 ? (
                                <div className="text-center py-8 px-4 bg-neutral-50/70 rounded-2xl border border-dashed border-neutral-200">
                                    <CheckCircle2 className="size-8 text-neutral-400 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-neutral-700">Tidak ada tugas tertunda saat ini</p>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">
                                        Semua tugas Anda telah selesai, atau Anda belum memiliki tugas baru di tim.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {myTasks.map((task: any) => (
                                        <div
                                            key={task.id}
                                            className="p-3.5 border border-neutral-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/70 transition"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="size-2 rounded-full bg-[#5448EE] mt-1.5 shrink-0" />
                                                <div>
                                                    <h4 className="text-xs font-bold text-neutral-900">{task.title}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                                                        <span>Tim: {task.team?.name}</span>
                                                        {task.milestone && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Milestone: {task.milestone.title}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                                    priorityColors[task.priority] || priorityColors.medium
                                                }`}>
                                                    {task.priority}
                                                </span>
                                                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-medium">
                                                    {statusLabels[task.status] || task.status}
                                                </span>
                                                {task.team_id && (
                                                    <Link
                                                        href={`/workspace/${task.team_id}`}
                                                        className="p-1 rounded text-neutral-400 hover:text-neutral-900 transition"
                                                        title="Buka Papan Kanban"
                                                    >
                                                        <ArrowRight className="size-3.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Recommendations & Competitions */}
                    <div className="flex flex-col gap-6">
                        {/* Smart Matching Preview (Bento card style) */}
                        <div className="bg-white/95 border border-neutral-200/90 rounded-3xl p-6 shadow-2xs">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                                <div>
                                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                                        <Sparkles className="size-4 text-[#5448EE]" />
                                        Rekomendasi Proyek AI
                                    </h3>
                                    <p className="text-[11px] text-neutral-500">Kecocokan keahlian & profil</p>
                                </div>
                                <Link
                                    href="/matching"
                                    className="text-xs text-[#5448EE] hover:text-[#4336D6] font-semibold transition"
                                >
                                    Semua &rarr;
                                </Link>
                            </div>

                            {recommendedProjects.length === 0 ? (
                                <p className="text-xs text-neutral-500 py-3 text-center">
                                    Belum ada rekomendasi proyek baru saat ini.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {recommendedProjects.map((rec: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="p-3.5 bg-neutral-50/80 rounded-2xl border border-neutral-100 flex flex-col gap-1.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-neutral-900 line-clamp-1">
                                                    {rec.project?.title || rec.title}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 shrink-0">
                                                    {rec.match_score}% Match
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-neutral-500 line-clamp-2">
                                                {rec.explanation || rec.project?.short_description}
                                            </p>
                                            <div className="flex justify-end pt-1">
                                                <Link
                                                    href={`/projects/${rec.project?.id || rec.project_id || rec.id}`}
                                                    className="text-[11px] font-semibold text-[#5448EE] hover:text-[#4336D6] transition"
                                                >
                                                    Lihat Detail Proyek &rarr;
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upcoming Competitions */}
                        <div className="bg-white/95 border border-neutral-200/90 rounded-3xl p-6 shadow-2xs">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                                <div>
                                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                                        <Trophy className="size-4 text-amber-500" />
                                        Kompetisi Kampus
                                    </h3>
                                    <p className="text-[11px] text-neutral-500">Peluang prestasi mahasiswa</p>
                                </div>
                                <Link
                                    href="/competitions"
                                    className="text-xs text-amber-600 hover:text-amber-800 font-semibold transition"
                                >
                                    Semua &rarr;
                                </Link>
                            </div>

                            {upcomingCompetitions.length === 0 ? (
                                <p className="text-xs text-neutral-500 py-3 text-center">
                                    Tidak ada kompetisi aktif saat ini.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {upcomingCompetitions.map((comp: any) => (
                                        <div
                                            key={comp.id}
                                            className="p-3.5 bg-neutral-50/80 rounded-2xl border border-neutral-100 flex flex-col gap-1.5"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-neutral-900 line-clamp-1">
                                                    {comp.name}
                                                </span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase shrink-0">
                                                    {comp.category || 'Lomba'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-neutral-500 line-clamp-2">
                                                {comp.theme || comp.organizer}
                                            </p>
                                            <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="size-3 text-neutral-400" />
                                                    {comp.registration_deadline ? new Date(comp.registration_deadline).toLocaleDateString('id-ID') : 'Segera'}
                                                </span>
                                                <Link
                                                    href={`/competitions/${comp.id}`}
                                                    className="font-semibold text-[#5448EE] hover:text-[#4336D6] transition"
                                                >
                                                    Bentuk Tim &rarr;
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Team Activities */}
                        {recentActivities.length > 0 && (
                            <div className="bg-white/95 border border-neutral-200/90 rounded-3xl p-6 shadow-2xs">
                                <h3 className="text-sm font-bold text-neutral-900 mb-4 pb-3 border-b border-neutral-100 flex items-center gap-1.5">
                                    <Activity className="size-4 text-neutral-500" />
                                    Aktivitas Terbaru Tim
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {recentActivities.map((act: any) => (
                                        <div key={act.id} className="text-xs">
                                            <p className="text-neutral-800">
                                                <span className="font-semibold">{act.actor?.name || 'Seseorang'}</span>{' '}
                                                {act.description}
                                            </p>
                                            <span className="text-[10px] text-neutral-400">
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
        </AppLayout>
    );
}