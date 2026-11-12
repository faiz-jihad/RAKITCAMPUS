import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Award,
    BookOpen,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    FileCheck,
    FileText,
    FolderKanban,
    GraduationCap,
    HelpCircle,
    Layers,
    MessageSquare,
    Plus,
    RefreshCw,
    Scale,
    Send,
    Shuffle,
    Sparkles,
    Trophy,
    UserCheck,
    Users,
    X,
    Zap,
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
        upcoming_competitions_count?: number;
        unassigned_students_count?: number;
        pending_proposals_count?: number;
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
    taughtClasses?: any[];
    guidedProjects?: any[];
    upcomingCompetitions?: any[];
    pendingProposals?: any[];
    recentGuidances?: any[];
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
    recentActivities = [],
    taughtClasses = [],
    guidedProjects = [],
    upcomingCompetitions = [],
    pendingProposals = [],
    recentGuidances = [],
    profileCompletion,
}: Props) {
    const isLecturer = Boolean(user?.is_lecturer || user?.role === 'lecturer');
    const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

    // Modal Catat Bimbingan Cepat
    const [selectedProjectForGuidance, setSelectedProjectForGuidance] = useState<any | null>(null);
    const [guidanceTitle, setGuidanceTitle] = useState('');
    const [guidanceContent, setGuidanceContent] = useState('');
    const [guidanceType, setGuidanceType] = useState('feedback');
    const [submittingGuidance, setSubmittingGuidance] = useState(false);

    // State simulasi tim
    const [simulatingClassId, setSimulatingClassId] = useState<number | null>(null);

    const firstName = user?.name ? user.name.split(' ')[0] : (isLecturer ? 'Dosen' : 'Mahasiswa');
    const initials = (user?.name || (isLecturer ? 'Dosen' : 'Mahasiswa'))
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

    // Handle Quick Guidance Submission
    const handleSendGuidance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProjectForGuidance || !guidanceTitle.trim() || !guidanceContent.trim()) {
            alert('Mohon isi judul dan catatan arahan bimbingan.');
            return;
        }

        setSubmittingGuidance(true);
        router.post(
            `/classes/${selectedProjectForGuidance.class_id}/guidance`,
            {
                project_id: selectedProjectForGuidance.id,
                title: guidanceTitle.trim(),
                content: guidanceContent.trim(),
                type: guidanceType,
            },
            {
                onSuccess: () => {
                    setSelectedProjectForGuidance(null);
                    setGuidanceTitle('');
                    setGuidanceContent('');
                },
                onFinish: () => setSubmittingGuidance(false),
            }
        );
    };

    // Handle 1-Click Simulasi Tim Otomatis
    const handleRunAutoGrouping = (classId: number, className: string) => {
        if (!confirm(`Jalankan Simulasi Tim Otomatis untuk kelas "${className}"? Sistem akan mendistribusikan sisa mahasiswa ke kelompok berimbang tanpa ketimpangan keahlian.`)) {
            return;
        }

        setSimulatingClassId(classId);
        router.post(
            `/classes/${classId}/auto-form-teams`,
            {},
            {
                onFinish: () => setSimulatingClassId(null),
            }
        );
    };

    // ==========================================
    // TAMPILAN DASHBOARD KHUSUS DOSEN PENGAMPU
    // ==========================================
    if (isLecturer) {
        return (
            <AppLayout activeTab="dashboard" title="Dashboard Dosen Pengampu — RakitCampus">
                {/* 1. HEADER ROW DOSEN */}
                <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-900">
                                Portal Dosen Pengampu & Pembimbing
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Selamat Datang, {user?.name}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Kelola ruang kelas, bimbing proyek & persiapan lomba, tinjau proposal, serta jalankan simulasi tim mahasiswa.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                            href="/classes"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
                        >
                            <GraduationCap className="w-4 h-4" />
                            <span>Kelola Ruang Kelas</span>
                        </Link>
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#0e172a] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 text-xs sm:text-sm font-semibold shadow-2xs transition cursor-pointer"
                        >
                            <FolderKanban className="w-4 h-4 text-slate-400" />
                            <span>Eksplorasi Proyek</span>
                        </Link>
                    </div>
                </section>

                {/* 2. STATISTIK KPI DOSEN PENGAMPU (4 KPI CARDS) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* KPI 1: Kelas Kuliah Diampu */}
                    <div className="bg-white dark:bg-[#0c1222] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Kelas Diampu
                                </span>
                                <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {stats?.taught_classes_count ?? taughtClasses.length}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Ruang Kelas Aktif
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/classes"
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80"
                        >
                            <span>Buka manajemen kelas</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* KPI 2: Total Mahasiswa Terbimbing */}
                    <div className="bg-white dark:bg-[#0c1222] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Mahasiswa Terbimbing
                                </span>
                                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {stats?.total_students_count ?? 0}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Mahasiswa Terdaftar
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <span>Sisa Belum Berkelompok:</span>
                            <span className={`font-bold px-1.5 py-0.2 rounded ${
                                (stats?.unassigned_students_count ?? 0) > 0
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            }`}>
                                {stats?.unassigned_students_count ?? 0} Mhs
                            </span>
                        </div>
                    </div>

                    {/* KPI 3: Proyek & Kelompok Bimbingan */}
                    <div className="bg-white dark:bg-[#0c1222] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Proyek Bimbingan
                                </span>
                                <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {stats?.total_guided_projects_count ?? guidedProjects.length}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Tim Proyek
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/projects"
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80"
                        >
                            <span>Tinjau progres proyek</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* KPI 4: Proposal Menunggu Peninjauan */}
                    <div className="bg-white dark:bg-[#0c1222] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Proposal Masuk
                                </span>
                                <FileCheck className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    {stats?.pending_proposals_count ?? pendingProposals.length}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Menunggu Persetujuan
                                </span>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            Living Proposal mahasiswa kelas
                        </div>
                    </div>
                </div>

                {/* 3. MAIN CONTENT LAYOUT DOSEN (8 COLS / 4 COLS) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: TUGAS PENGAMPU & PROYEK BIMBINGAN */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* PILAR 1: MEMBIMBING PROYEK & PERSIAPAN LOMBA */}
                        <div className="bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        <span>Membimbing Proyek & Persiapan Lomba</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Pantau progres tim mahasiswa, beri arahan bimbingan berkala, dan siapkan tim unggulan untuk kompetisi kampus.
                                    </p>
                                </div>
                                <Link
                                    href="/projects"
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <span>Lihat Semua Proyek</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {guidedProjects && guidedProjects.length > 0 ? (
                                <div className="space-y-3.5">
                                    {guidedProjects.map((proj: any) => (
                                        <div
                                            key={proj.id}
                                            className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0e172a] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                                        {proj.class_code || 'KELAS'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {proj.class_name}
                                                    </span>
                                                    {proj.is_competition_ready && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                                            <Trophy className="w-2.5 h-2.5" />
                                                            <span>Potensi Lomba</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                    {proj.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                    <span>Ketua: <strong>{proj.leader_name || 'Mahasiswa'}</strong></span>
                                                    <span>•</span>
                                                    <span>{proj.members_count || 1} Anggota</span>
                                                    <span>•</span>
                                                    <span>{proj.done_tasks}/{proj.total_tasks} Tugas Selesai</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Proposal: {proj.proposal_status.toUpperCase()}</span>
                                                </div>
                                            </div>

                                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0">
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                        {proj.progress}%
                                                    </span>
                                                    <div className="w-28 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                                                        <div
                                                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                                            style={{ width: `${proj.progress}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedProjectForGuidance(proj)}
                                                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/80 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-700 dark:text-blue-300 transition cursor-pointer flex items-center gap-1"
                                                    >
                                                        <MessageSquare className="w-3 h-3" />
                                                        <span>Beri Arahan</span>
                                                    </button>
                                                    <Link
                                                        href={`/projects/${proj.slug || proj.id}`}
                                                        className="px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-[11px] font-bold transition flex items-center gap-1"
                                                    >
                                                        <span>Detail Proyek</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-slate-400">
                                    <FolderKanban className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                                        Belum ada proyek bimbingan aktif
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                        Proyek yang diajukan mahasiswa pada ruang kelas Anda akan otomatis muncul di sini untuk ditinjau, dibimbing, dan diarahkan ke persiapan lomba.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* PILAR 2: MENINJAU SERTA MENYETUJUI PROPOSAL (LIVING PROPOSAL) */}
                        <div className="bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        <span>Meninjau serta Menyetujui Proposal (Living Proposal)</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Verifikasi proposal rancangan proyek mahasiswa sebelum pengerjaan sprint dimulai.
                                    </p>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                    {pendingProposals.length} Menunggu
                                </span>
                            </div>

                            {pendingProposals && pendingProposals.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingProposals.map((prop: any) => (
                                        <div
                                            key={prop.id}
                                            className="p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/70 dark:bg-amber-900 text-amber-900 dark:text-amber-200 uppercase">
                                                        Revisi V{prop.proposal_version}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                                        {prop.title}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                    Diajukan oleh: {prop.leader_name} • Kelas {prop.class_name}
                                                </p>
                                            </div>

                                            <Link
                                                href={`/projects/${prop.slug || prop.id}`}
                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-xs"
                                            >
                                                <span>Tinjau & Setujui</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0e172a] border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <span>Semua proposal proyek telah ditinjau dan disetujui. Tidak ada proposal yang tertunda saat ini.</span>
                                </div>
                            )}
                        </div>

                        {/* PILAR 3: RUANG KELAS & SIMULASI PEMBAGIAN TIM OTOMATIS */}
                        <div className="bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Shuffle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                        <span>Ruang Kelas & Simulasi Pembagian Tim Cerdas</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Kelola kelas kuliah dan jalankan simulasi distribusi mahasiswa yang belum memiliki kelompok agar merata tanpa ketimpangan.
                                    </p>
                                </div>
                                <Link
                                    href="/classes"
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                    <span>Kelola Semua Kelas</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {taughtClasses && taughtClasses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {taughtClasses.map((cls: any) => {
                                        const hasUnassigned = (cls.unassigned_students_count ?? 0) > 0;
                                        const isThisSimulating = simulatingClassId === cls.id;

                                        return (
                                            <div
                                                key={cls.id}
                                                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0e172a] hover:border-blue-500 transition flex flex-col justify-between gap-3 group"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60">
                                                            Kode: {cls.join_code || cls.code}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            Semester {cls.semester} • {cls.academic_year || '2026/2027'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition">
                                                        {cls.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                        {cls.students_count || 0} Mahasiswa Terdaftar • {cls.projects_count || 0} Kelompok
                                                    </p>
                                                </div>

                                                {/* Action Bar Simulasi Tim */}
                                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                                                    {hasUnassigned ? (
                                                        <button
                                                            type="button"
                                                            disabled={isThisSimulating}
                                                            onClick={() => handleRunAutoGrouping(cls.id, cls.name)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs transition disabled:opacity-50 cursor-pointer"
                                                            title="Otomatis bagi sisa mahasiswa ke kelompok berimbang"
                                                        >
                                                            <Zap className="w-3.5 h-3.5" />
                                                            <span>
                                                                {isThisSimulating ? 'Memproses...' : `Bagi ${cls.unassigned_students_count} Mhs Tersisa`}
                                                            </span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                            <Check className="w-3.5 h-3.5" />
                                                            <span>Semua mahasiswa berkelompok</span>
                                                        </span>
                                                    )}

                                                    <Link
                                                        href={`/classes/${cls.code || cls.id}`}
                                                        className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                                                    >
                                                        <span>Ruang Kelas</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-400">
                                    <GraduationCap className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                                        Belum ada ruang kelas yang dibuat
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                        Buat ruang kelas kuliah perdana untuk mengorganisasi mahasiswa dan menjalankan simulasi pembentukan tim.
                                    </p>
                                    <Link
                                        href="/classes"
                                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Buat Kelas Perkuliahan</span>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: IDENTITAS DOSEN & FITUR PENGAMPU */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* KARTU IDENTITAS DOSEN */}
                        <div className="bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-3.5">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Identitas Dosen Pengampu
                                </h2>
                                <Link
                                    href="/settings/profile"
                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Pengaturan Profil
                                </Link>
                            </div>

                            <div className="flex items-center gap-3.5 py-2">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                                    {initials || 'DS'}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {user?.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-medium">NIDN</span>
                                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        {user?.nim || '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-medium">Status</span>
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                        Dosen Terverifikasi
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0e172a] border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>{user?.campus || 'Politeknik Negeri Indramayu'}</span>
                                </div>
                                <span className="text-[11px] text-slate-400">Teknik Informatika & Rekayasa Perangkat Lunak</span>
                            </div>
                        </div>

                        {/* CATATAN ARAHAN BIMBINGAN TERAKHIR */}
                        <div className="bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-3.5">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                                <span>Riwayat Catatan Bimbingan</span>
                                <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </h2>

                            {recentGuidances && recentGuidances.length > 0 ? (
                                <div className="space-y-2.5">
                                    {recentGuidances.slice(0, 4).map((g: any) => (
                                        <div
                                            key={g.id}
                                            className="p-3 rounded-xl bg-slate-50 dark:bg-[#0e172a] border border-slate-200/60 dark:border-slate-800 text-xs"
                                        >
                                            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white mb-1">
                                                <span className="truncate">{g.title}</span>
                                                <span className="text-[10px] text-slate-400 font-normal shrink-0">{g.created_at}</span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 text-[11px] line-clamp-2">
                                                {g.content}
                                            </p>
                                            <div className="mt-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                                {g.project_title || g.class_name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic text-center py-4">
                                    Belum ada catatan bimbingan yang dikirim. Gunakan tombol "Beri Arahan" pada proyek mahasiswa.
                                </p>
                            )}
                        </div>

                        {/* PANDUAN CEPAT 5 TUGAS PENGAMPU */}
                        <div className="bg-white dark:bg-[#0c1222] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs space-y-3.5">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                5 Fokus Tugas Pengampu
                            </h2>

                            <div className="space-y-2.5 text-xs">
                                <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2">
                                    <Trophy className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-blue-900 dark:text-blue-200">1. Bimbingan & Lomba</p>
                                        <p className="text-blue-700/80 dark:text-blue-300/80 text-[11px] mt-0.5">
                                            Arahkan proyek kelas mahasiswa yang berpotensi ke ajang perlombaan.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-2">
                                    <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-emerald-900 dark:text-emerald-200">2. Review Living Proposal</p>
                                        <p className="text-emerald-700/80 dark:text-emerald-300/80 text-[11px] mt-0.5">
                                            Tinjau serta setujui rancangan proyek proposal ketua kelompok.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 flex items-start gap-2">
                                    <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-900 dark:text-amber-200">3. Pantau Progres & Arahan</p>
                                        <p className="text-amber-700/80 dark:text-amber-300/80 text-[11px] mt-0.5">
                                            Cek task selesai dan beri feedback langsung ke tim mahasiswa.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 flex items-start gap-2">
                                    <Award className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-purple-900 dark:text-purple-200">4. Evaluasi & Nilai</p>
                                        <p className="text-purple-700/80 dark:text-purple-300/80 text-[11px] mt-0.5">
                                            Penilaian berkala UTS/UAS dan rubrik capaian luaran.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex items-start gap-2">
                                    <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-indigo-900 dark:text-indigo-200">5. Simulasi Tim Otomatis</p>
                                        <p className="text-indigo-700/80 dark:text-indigo-300/80 text-[11px] mt-0.5">
                                            Distribusikan sisa mahasiswa tanpa kelompok secara adil & seimbang.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MODAL INPUT CATATAN ARAHAN BIMBINGAN */}
                {selectedProjectForGuidance && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-[#0c1222] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                        Catat Arahan & Bimbingan Proyek
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Proyek: <strong>{selectedProjectForGuidance.title}</strong>
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedProjectForGuidance(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSendGuidance} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Judul Arahan / Topik Bimbingan <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={guidanceTitle}
                                        onChange={(e) => setGuidanceTitle(e.target.value)}
                                        placeholder="Contoh: Evaluasi Arsitektur Database & Sprint 1"
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e172a] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-blue-600 font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Jenis Arahan
                                        </label>
                                        <select
                                            value={guidanceType}
                                            onChange={(e) => setGuidanceType(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e172a] text-slate-800 dark:text-slate-200 text-xs"
                                        >
                                            <option value="feedback">Feedback Progres</option>
                                            <option value="revision">Catatan Revisi Proposal</option>
                                            <option value="competition">Instruksi Persiapan Lomba</option>
                                            <option value="evaluation">Evaluasi Tengah Semester</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Target Kelompok
                                        </label>
                                        <input
                                            type="text"
                                            disabled
                                            value={selectedProjectForGuidance.team_name || 'Tim Mahasiswa'}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 text-xs font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                        Isi Arahan / Rekomendasi Perbaikan <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={guidanceContent}
                                        onChange={(e) => setGuidanceContent(e.target.value)}
                                        placeholder="Tuliskan catatan teknis, arahan implementasi, atau perbaikan proposal yang harus diselesaikan kelompok..."
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0e172a] text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-blue-600 leading-relaxed"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProjectForGuidance(null)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submittingGuidance}
                                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>{submittingGuidance ? 'Menyimpan...' : 'Kirim Catatan Arahan'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </AppLayout>
        );
    }

    // ==========================================
    // TAMPILAN DASHBOARD REGULER MAHASISWA
    // ==========================================
    return (
        <AppLayout activeTab="dashboard" title="Dashboard - RakitCampus">
            {/* 1. HEADER ROW */}
            <section className="flex items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800 mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Dashboard Mahasiswa
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0e172a] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold shadow-2xs transition"
                    >
                        <span>Workspace Tim</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                </div>
            </section>

            {/* 2. REAL METRIC SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Metric 1: Tasks */}
                <div className="bg-white dark:bg-[#0c1222] rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Progres Tugas
                            </span>
                            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {completedTasks}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                / {totalTasks > 0 ? totalTasks : 0} Selesai
                            </span>
                        </div>
                    </div>
                    <div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1.5">
                            <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${taskPercent}%` }}
                            />
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {pendingTasks} tugas aktif menunggu
                        </span>
                    </div>
                </div>

                {/* Metric 2: Teams */}
                <div className="bg-white dark:bg-[#0c1222] rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Tim Akademik
                            </span>
                            <Users className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {stats?.my_teams_count ?? 0}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                Tim Terdaftar
                            </span>
                        </div>
                    </div>
                    <Link
                        href="/projects"
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition flex items-center justify-between"
                    >
                        <span>{myTeams.length > 0 ? myTeams[0].name : 'Eksplor tim kelas'}</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Metric 3: Readiness */}
                <div className="bg-white dark:bg-[#0c1222] rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Kesiapan Profil
                            </span>
                            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {readinessScore}%
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60">
                                Siap Kolaborasi
                            </span>
                        </div>
                    </div>
                    <Link
                        href="/settings/profile"
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition flex items-center justify-between"
                    >
                        <span>Kelola keahlian & biodata</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>

                {/* Metric 4: Recommendations */}
                <div className="bg-white dark:bg-[#0c1222] rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Rekrutmen Terbuka
                            </span>
                            <FolderKanban className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {recommendedProjects.length}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                Proyek Kelas
                            </span>
                        </div>
                    </div>
                    <Link
                        href="/projects"
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition flex items-center justify-between"
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
                    <div className="bg-white dark:bg-[#0c1222] rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-3.5">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Tugas Prioritas
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Daftar tugas yang memerlukan tindakan Anda
                                </p>
                            </div>
                            <Link
                                href="/workspace"
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition flex items-center gap-1"
                            >
                                <span>Buka Workspace Tim</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {myTasks && myTasks.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
                                                    className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition block truncate"
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

                                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                                {task.status || 'Aktif'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-400">
                                <Clock className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                <p className="font-semibold text-slate-700 dark:text-slate-300">Semua tugas telah diselesaikan</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada tugas mendesak saat ini.</p>
                            </div>
                        )}
                    </div>

                    {/* Panel 2: Proyek Kelas & Living Proposal */}
                    <div className="bg-white dark:bg-[#0c1222] rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-4">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Proyek Akademik Anda
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Living proposal dan manajemen tim kuliah
                                </p>
                            </div>
                            <Link
                                href="/projects"
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition flex items-center gap-1"
                            >
                                <span>Semua Proyek</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {myTeams && myTeams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {myTeams.map((team: any) => (
                                    <div
                                        key={team.id}
                                        className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0e172a] hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex flex-col justify-between gap-3"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                                    PROYEK KELAS
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-medium">
                                                    {team.members_count || 1} Anggota
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                                                {team.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                                {team.description || 'Ruang kolaborasi tim mahasiswa RakitCampus.'}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                                Progress: {team.progress_percent ?? 0}%
                                            </span>
                                            <Link
                                                href={team.project ? `/projects/${team.project.slug || team.project.id}` : `/workspace/${team.id}`}
                                                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                            >
                                                <span>Buka Detail</span>
                                                <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-slate-400">
                                <FolderKanban className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                                <p className="font-semibold text-slate-700 dark:text-slate-300">Belum tergabung dalam tim proyek</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Mulai dengan membuat proyek baru atau mengajukan diri ke tim kelas.
                                </p>
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
                </div>

                {/* RIGHT COLUMN: PROFILE & ACTIVITIES */}
                <div className="lg:col-span-4 space-y-6">
                    {/* User Card */}
                    <div className="bg-white dark:bg-[#0c1222] rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 mb-3.5">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                                Profil Mahasiswa
                            </h2>
                            <Link
                                href="/settings/profile"
                                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Edit Profil
                            </Link>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900 font-bold text-xs flex items-center justify-center shrink-0">
                                {initials || 'RC'}
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {user?.name || 'Mahasiswa'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {user?.headline || user?.major || 'Teknik Informatika'}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <div>
                                <span className="text-[10px] text-slate-400 block font-medium">NIM</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.nim || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block font-medium">Status</span>
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Aktif</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
