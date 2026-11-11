import AnimatedIcon from '@/components/animations/AnimatedIcon';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import {
    Calendar,
    ChevronDown,
    Download,
    ExternalLink,
    Filter,
    LayoutGrid,
    MoreHorizontal,
    Plus,
    QrCode,
    Search,
    Shield,
    Users,
} from 'lucide-react';
import { useState } from 'react';

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
        upcoming_competitions_count: number;
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
    upcomingCompetitions?: any[];
    recentActivities?: any[];
    profileCompletion?: { percent: number; missing: string[] };
}

export default function Dashboard({
    isPublic = false,
    user = {} as any,
    stats = {} as any,
    myTeams = [],
    myTasks = [],
    teammates = [],
    monthlyActivity = [],
    upcomingCompetitions = [],
    profileCompletion,
}: Props) {
    const [activePeriod, setActivePeriod] = useState('Bulanan');
    const [activeSlide, setActiveSlide] = useState(0);
    const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

    // Initial avatar letters
    const initials = (user?.name || 'Mahasiswa')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0].toUpperCase())
        .join('');

    // First name for friendly greeting
    const firstName = user?.name ? user.name.split(' ')[0] : 'Kamu';

    // Slide carousel data
    const infoSlides = [
        {
            title: 'Info Matchmaking Tim',
            description: 'RakitCampus bantu kamu temukan partner lomba yang sefrekuensi, selesaikan tugas bareng, dan raih prestasi.',
            tag: 'Info Hari Ini',
            link: '/competitions?tab=teams',
        },
        {
            title: 'Eksplorasi Kompetisi',
            description: 'Temukan berbagai kompetisi bergengsi dari tingkat universitas hingga internasional sesuai minat dan keahlianmu.',
            tag: 'Peluang Prestasi',
            link: '/competitions?tab=explore',
        },
        {
            title: 'Workspace Tim',
            description: 'Kelola sprint proyek, milestone kompetisi, dan delegasikan tugas bersama rekan satu tim secara terstruktur.',
            tag: 'Kolaborasi',
            link: '/workspace',
        },
    ];

    // Fallback monthly activity if empty
    const displayMonthlyActivity = monthlyActivity && monthlyActivity.length === 6
        ? monthlyActivity
        : [
              { month: 'Jan', done_tasks: 0, logs: 0, percent: 25 },
              { month: 'Feb', done_tasks: stats?.completed_tasks_count || 4, logs: 2, percent: 85 },
              { month: 'Mar', done_tasks: 0, logs: 0, percent: 35 },
              { month: 'Apr', done_tasks: 0, logs: 0, percent: 55 },
              { month: 'Mei', done_tasks: 0, logs: 0, percent: 70 },
              { month: 'Jun', done_tasks: 0, logs: 0, percent: 60 },
          ];

    // Active tooltip index: hovered or default to index with highest percent
    const defaultActiveIndex = displayMonthlyActivity.reduce(
        (maxIdx, item, idx, arr) => (item.percent > arr[maxIdx].percent ? idx : maxIdx),
        1
    );
    const activeMonthIdx = hoveredMonth !== null ? hoveredMonth : defaultActiveIndex;

    // Display teammates: real teammates from controller
    const displayTeammates = teammates && teammates.length > 0
        ? teammates.slice(0, 3)
        : (myTeams && myTeams.length > 0 && myTeams[0].members?.length > 0)
        ? myTeams[0].members.slice(0, 3).map((m: any, idx: number) => ({
              id: m.id || idx,
              name: m.name,
              role: m.role || 'Anggota Tim',
              team: myTeams[0].name || 'Tim Saya',
          }))
        : [];

    return (
        <AppLayout activeTab="dashboard" title="Dashboard - RakitCampus">
            {/* 1. GREETING ROW */}
            <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2 mb-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d3557] tracking-tight">
                    Selamat Pagi, {firstName}!
                </h1>

                <Link
                    href="/competitions/create"
                    className="inline-flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 active:scale-[0.98] transition self-start sm:self-auto"
                >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Bikin Tim</span>
                </Link>
            </section>

            {/* 2. ACTION TOOLBAR ROW */}
            <section className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                    >
                        <Filter className="w-3.5 h-3.5 text-slate-500" />
                        <span>Filter</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActivePeriod(activePeriod === 'Bulanan' ? 'Semester Ini' : 'Bulanan')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                    >
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{activePeriod}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                    >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
                        <span>Download Data</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-white transition"
                        title="Cari"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                    >
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        <span>Support</span>
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                    >
                        <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                        <span>Content Layout</span>
                    </button>
                </div>
            </section>

            {/* 3. TOP CARDS ROW (4 CARDS) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-5">
                {/* Card 1: Status Tugas (Pending & Selesai) */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                Status Tugas
                            </h2>
                            <Link
                                href="/workspace"
                                className="text-[11px] font-semibold text-blue-600 bg-blue-50/80 border border-blue-200/60 px-3 py-0.5 rounded-full hover:bg-blue-100 transition"
                            >
                                Laporan
                            </Link>
                        </div>

                        {/* Pill Badges */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-[#1e293b] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                {stats?.completed_tasks_count ?? 0} Selesai
                            </span>
                            <span className="bg-blue-50 text-blue-600 border border-blue-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                {stats?.pending_tasks_count ?? 0} Pending
                            </span>
                        </div>
                    </div>

                    {/* Dual Curve SVG Chart with reference points */}
                    <div className="relative pt-2">
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                            <span>30</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium mb-1">
                            <span>20</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                            <span>10</span>
                        </div>

                        {/* SVG Graph overlay */}
                        <svg className="w-full h-16 overflow-visible -mt-12" viewBox="0 0 240 60" preserveAspectRatio="none">
                            {/* Dashed indicator marker */}
                            <line x1="75" y1="0" x2="75" y2="60" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />
                            <circle cx="75" cy="35" r="3.5" fill="#2563eb" />
                            <circle cx="75" cy="48" r="3" fill="#93c5fd" />

                            {/* Dark curve (Completed) */}
                            <path
                                d="M 10 32 C 40 32, 60 40, 75 35 C 90 30, 110 18, 140 18 C 170 18, 190 30, 230 24"
                                fill="none"
                                stroke="#1e293b"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                            />

                            {/* Light blue curve (Pending) */}
                            <path
                                d="M 10 46 C 40 46, 60 52, 75 48 C 90 42, 110 30, 140 32 C 170 34, 190 46, 230 42"
                                fill="none"
                                stroke="#93c5fd"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                            />
                        </svg>

                        {/* X-axis labels */}
                        <div className="flex justify-between text-[11px] text-slate-400 font-semibold pt-1">
                            <span>Jan</span>
                            <span>Feb</span>
                            <span>Mar</span>
                            <span>Apr</span>
                        </div>
                    </div>
                </div>

                {/* Card 2: Royal Blue Hero Card (Interactive Info Matchmaking Carousel) */}
                <div className="bg-[#2563eb] text-white rounded-2xl p-5 shadow-sm shadow-blue-500/20 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
                    {/* Top Row with animated emblem & badge */}
                    <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs">
                            <AnimatedIcon
                                name={activeSlide === 0 ? 'rocket' : activeSlide === 1 ? 'trophy' : 'team'}
                                size={22}
                                primaryColor="#2563eb"
                                accentColor="#60a5fa"
                            />
                        </div>
                        <span className="bg-white/20 backdrop-blur-xs text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                            {infoSlides[activeSlide].tag}
                        </span>
                    </div>

                    {/* Card Content */}
                    <div className="my-2">
                        <h2 className="text-base font-bold text-white tracking-tight mb-1.5">
                            {infoSlides[activeSlide].title}
                        </h2>
                        <p className="text-xs text-blue-50/90 leading-relaxed font-normal">
                            {infoSlides[activeSlide].description}
                        </p>
                    </div>

                    {/* Bottom Stepper Indicators */}
                    <div className="flex items-center gap-1.5 pt-1">
                        {infoSlides.map((_, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => setActiveSlide(idx)}
                                className={`h-1 rounded-full transition-all cursor-pointer ${
                                    activeSlide === idx ? 'w-7 bg-white' : 'w-4 bg-white/40 hover:bg-white/70'
                                }`}
                                title={`Slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Card 3: Kesiapan Tim */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                            Kesiapan Tim
                        </h2>
                        <button type="button" className="text-slate-400 hover:text-slate-600 transition" title="Menu">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Metric Row */}
                    <div className="flex items-center gap-2 mt-1 mb-2">
                        <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {stats?.team_readiness_avg ?? profileCompletion?.percent ?? 0}%
                        </span>
                        <span className="bg-sky-50 text-sky-600 text-[11px] font-bold px-2 py-0.5 rounded-full border border-sky-100">
                            +{stats?.my_teams_count ?? 0} Tim
                        </span>
                    </div>

                    {/* Stepped / Upward Area Chart */}
                    <div className="relative pt-2">
                        <svg className="w-full h-16 overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                                </linearGradient>
                            </defs>
                            {/* Area fill */}
                            <polygon
                                points="0,55 35,50 65,48 85,38 120,35 155,20 200,10 200,60 0,60"
                                fill="url(#trendGradient)"
                            />
                            {/* Blue step line */}
                            <polyline
                                points="0,55 35,50 65,48 85,38 120,35 155,20 200,10"
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        {/* X-axis labels */}
                        <div className="flex justify-between text-[11px] text-slate-400 font-semibold pt-1">
                            <span>Sen</span>
                            <span>Sel</span>
                            <span>Rab</span>
                            <span>Kam</span>
                        </div>
                    </div>
                </div>

                {/* Card 4: Deadline Terdekat */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                            Deadline Terdekat
                        </h2>
                        <Link
                            href="/competitions?tab=explore"
                            className="text-slate-400 hover:text-slate-600 transition"
                            title="Semua Lomba"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </Link>
                    </div>

                    {upcomingCompetitions && upcomingCompetitions.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingCompetitions.slice(0, 2).map((comp: any, idx: number) => {
                                const deadline = comp.registration_deadline ? new Date(comp.registration_deadline) : null;
                                const now = new Date();
                                const daysLeft = deadline
                                    ? Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                                    : 0;
                                const progressPercent = Math.max(20, Math.min(100, 100 - daysLeft * 3));

                                return (
                                    <div key={comp.id || idx} className="py-1">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate" title={comp.name}>
                                                        {comp.name}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-medium">
                                                        {deadline
                                                            ? deadline.toLocaleDateString('id-ID', {
                                                                  day: 'numeric',
                                                                  month: 'short',
                                                                  year: 'numeric',
                                                              })
                                                            : 'Terbuka'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-blue-600 shrink-0 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Segera'}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-6 text-center text-xs text-slate-400">
                            Belum ada kompetisi dengan deadline terdekat
                        </div>
                    )}

                    <div className="pt-2 text-right">
                        <Link
                            href="/competitions?tab=explore"
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition"
                        >
                            Lihat Semua Jadwal &rarr;
                        </Link>
                    </div>
                </div>
            </div>

            {/* 4. BOTTOM CARDS ROW (3 CARDS: 1fr - 2fr - 1fr) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                {/* Bottom Card 1: Informasi Mahasiswa */}
                <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                Informasi Mahasiswa
                            </h2>
                            <Link
                                href="/settings/profile"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                            >
                                Lihat Detail
                            </Link>
                        </div>

                        {/* User Header Snippet */}
                        <div className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                                    {initials || 'RC'}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 truncate" title={user?.name}>
                                        {user?.name || 'Mahasiswa'}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium">
                                        {user?.is_lecturer ? 'Dosen' : 'Mahasiswa'}
                                    </p>
                                </div>
                            </div>

                            {/* QR Code Graphic */}
                            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0" title="Student ID QR">
                                <QrCode className="w-5 h-5 stroke-[1.5]" />
                            </div>
                        </div>

                        {/* 2x2 Fields Grid */}
                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-2">
                            <div>
                                <p className="text-[11px] text-slate-400 font-medium mb-0.5">
                                    Status Akademik
                                </p>
                                <p className="text-xs font-bold text-slate-800 leading-tight">
                                    {user?.academic_status === 'tpb' ? 'Tahap TPB' : 'Mahasiswa Prodi'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 font-medium mb-0.5">
                                    Program Studi
                                </p>
                                <p className="text-xs font-bold text-slate-800 leading-tight truncate" title={user?.major}>
                                    {user?.major || 'Teknik Informatika'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 font-medium mb-0.5">
                                    Peran Utama
                                </p>
                                <p className="text-xs font-bold text-slate-800 leading-tight truncate" title={user?.headline}>
                                    {user?.headline || 'Anggota Tim'}
                                </p>
                            </div>
                            <div>
                                <p className="text-[11px] text-slate-400 font-medium mb-0.5">
                                    Kampus Asal
                                </p>
                                <p className="text-xs font-bold text-slate-800 leading-tight truncate" title={user?.campus}>
                                    {user?.campus || 'Politeknik Negeri Indramayu'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Subtle Footer Link */}
                    <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="truncate mr-2">NIM: {user?.nim || '-'}</span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aktif
                        </span>
                    </div>
                </div>

                {/* Bottom Card 2: Laporan Aktivitas Tim (Dynamic Bar Chart with Tooltip) */}
                <div className="lg:col-span-6 bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                Laporan Aktivitas Tim
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full border border-blue-400" />
                                        Progres
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                        Selesai
                                    </span>
                                </div>
                                <Link
                                    href="/workspace"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                >
                                    Lihat Detail
                                </Link>
                            </div>
                        </div>

                        {/* Bar Chart Container */}
                        <div className="relative pt-6 pb-2">
                            {/* Dashed reference line */}
                            <div className="absolute top-[48%] left-8 right-2 border-b border-dashed border-blue-200 z-0" />

                            <div className="flex">
                                {/* Y-axis */}
                                <div className="flex flex-col justify-between h-40 text-[10px] text-slate-400 font-semibold pr-3 shrink-0">
                                    <span>70</span>
                                    <span>50</span>
                                    <span>30</span>
                                    <span>10</span>
                                </div>

                                {/* 6 Dynamic Monthly Pillars */}
                                <div className="flex-1 grid grid-cols-6 gap-2 sm:gap-4 items-end h-40 relative z-10 px-2">
                                    {displayMonthlyActivity.map((item, idx) => {
                                        const isActive = idx === activeMonthIdx;
                                        const isHigh = item.percent >= 60;

                                        return (
                                            <div
                                                key={idx}
                                                className="flex flex-col items-center h-full justify-end relative group cursor-pointer"
                                                onMouseEnter={() => setHoveredMonth(idx)}
                                                onMouseLeave={() => setHoveredMonth(null)}
                                            >
                                                {/* Tooltip bubble matching the reference design */}
                                                {isActive && (
                                                    <div className="absolute -top-12 z-20 bg-[#1e293b] text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-lg whitespace-nowrap pointer-events-none transition-all duration-200">
                                                        <p className="font-bold text-white mb-0.5">{item.month}</p>
                                                        <p className="text-slate-300">● {item.done_tasks} tugas selesai</p>
                                                        <p className="text-slate-300">● {item.logs} aktivitas tim</p>
                                                        {/* Tooltip down arrow */}
                                                        <div className="w-2 h-2 bg-[#1e293b] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                                    </div>
                                                )}

                                                <div
                                                    className={`w-full max-w-[42px] rounded-xl transition-all duration-300 ${
                                                        isActive || isHigh
                                                            ? 'bg-gradient-to-t from-blue-700 to-blue-500 shadow-xs ring-2 ring-blue-400/30'
                                                            : 'bg-blue-50/80 group-hover:bg-blue-100'
                                                    }`}
                                                    style={{ height: `${item.percent}%` }}
                                                />
                                                <span
                                                    className={`text-[11px] font-semibold mt-2 transition ${
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
                    </div>
                </div>

                {/* Bottom Card 3: Rekan Satu Tim */}
                <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                Rekan Satu Tim
                            </h2>
                            <Link
                                href="/competitions?tab=teams"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                            >
                                Lihat Detail
                            </Link>
                        </div>

                        {/* Teammates List */}
                        {displayTeammates.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {displayTeammates.map((mate: any, idx: number) => {
                                    const mateInitials = (mate.name || 'M')
                                        .split(' ')
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((w: string) => w[0].toUpperCase())
                                        .join('');

                                    const colors = [
                                        'bg-blue-100 text-blue-700',
                                        'bg-emerald-100 text-emerald-700',
                                        'bg-purple-100 text-purple-700',
                                    ];
                                    const colorClass = colors[idx % colors.length];

                                    return (
                                        <div key={mate.id || idx} className="py-3 flex items-center gap-3">
                                            <div
                                                className={`w-9 h-9 rounded-full ${colorClass} font-bold text-xs flex items-center justify-center ring-2 ring-slate-100 shrink-0`}
                                            >
                                                {mateInitials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-bold text-slate-900 truncate" title={mate.name}>
                                                    {mate.name}
                                                </h3>
                                                <p className="text-[11px] text-slate-400 font-medium truncate" title={`${mate.role} • ${mate.team}`}>
                                                    {mate.role || 'Mahasiswa'} {mate.team ? `• ${mate.team}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-slate-400 text-xs">
                                <AnimatedIcon name="team" size={48} className="mx-auto mb-2" />
                                <p className="font-semibold text-slate-600">Belum ada rekan tim</p>
                                <p className="text-[11px] mt-0.5">Gabung tim atau temukan rekan di MinSatu!</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Action Footer */}
                    <div className="pt-3 border-t border-slate-100">
                        <Link
                            href="/competitions?tab=teams"
                            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                            <span>Cari Partner Baru</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
