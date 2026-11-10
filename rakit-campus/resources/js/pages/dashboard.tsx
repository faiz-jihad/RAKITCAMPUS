import { Head, Link } from '@inertiajs/react';
import {
    Bell,
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
    Settings,
    Shield,
} from 'lucide-react';
import { useState } from 'react';

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
        academic_status?: string;
        batch_year?: string;
        headline?: string;
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
    myTeams?: any[];
    myTasks?: any[];
    recommendedProjects?: any[];
    upcomingCompetitions?: any[];
    recentActivities?: any[];
    profileCompletion?: { percent: number; missing: string[] };
}

export default function Dashboard({
    user = {} as any,
    stats = {} as any,
    myTeams = [],
    myTasks = [],
    upcomingCompetitions = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'lomba' | 'tim' | 'task' | 'pengajuan'>('dashboard');
    const [activePeriod, setActivePeriod] = useState('Bulanan');
    const [activeSlide, setActiveSlide] = useState(0);

    // Initial avatar letters
    const initials = (user?.name || 'Mahasiswa')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0].toUpperCase())
        .join('');

    // First name for friendly greeting
    const firstName = user?.name ? user.name.split(' ')[0] : 'Kamu';

    // Teammates list with fallback to realistic ITB / competition team members
    const teammates = (myTeams && myTeams.length > 0 && myTeams[0].members?.length > 0)
        ? myTeams[0].members.slice(0, 3).map((m: any, idx: number) => ({
              id: m.id || idx,
              name: m.name,
              role: m.role || 'Anggota Tim',
              team: myTeams[0].name || 'Tim Kompetisi',
              avatarBg: idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700',
              avatarImg: idx === 0
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                  : idx === 1
                  ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
                  : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
          }))
        : [
              {
                  id: 1,
                  name: 'Dr. Leslie Alexander',
                  role: 'Mentor Dosen',
                  team: 'Institut Teknologi Bandung',
                  avatarImg: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
              },
              {
                  id: 2,
                  name: 'Dr. Savannah Nguyen',
                  role: 'Hustler & Lead',
                  team: 'Hackathon IPFEST 2026',
                  avatarImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
              },
              {
                  id: 3,
                  name: 'Dr. Darlene Robertson',
                  role: 'Hipster & UI/UX',
                  team: 'Gemastik UX Design',
                  avatarImg: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
              },
          ];

    return (
        <div className="min-h-screen bg-[#eceff3] p-3 sm:p-5 lg:p-7 font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
            <Head title="Dashboard - RakitCampus" />

            {/* Giant Smooth Rounded Container matching the reference design */}
            <main className="mx-auto max-w-[1400px] bg-[#fbfcfd] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 lg:p-9 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-200/60">

                {/* 1. TOP NAVIGATION BAR */}
                <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    {/* Brand Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition">
                            {/* Hex / Geometric Flower Icon matching screenshot */}
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="2.5" />
                                <circle cx="18" cy="8.5" r="2.5" />
                                <circle cx="18" cy="15.5" r="2.5" />
                                <circle cx="12" cy="19" r="2.5" />
                                <circle cx="6" cy="15.5" r="2.5" />
                                <circle cx="6" cy="8.5" r="2.5" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">
                            RakitCampus
                        </span>
                    </Link>

                    {/* Navigation Capsule / Pills */}
                    <nav className="inline-flex items-center gap-1 bg-[#f1f3f7] p-1 rounded-full border border-slate-200/70">
                        <Link
                            href="/dashboard"
                            onClick={() => setActiveTab('dashboard')}
                            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                                activeTab === 'dashboard'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/competitions"
                            onClick={() => setActiveTab('lomba')}
                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                                activeTab === 'lomba'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Lomba
                        </Link>
                        <Link
                            href="/competitions?tab=my_teams"
                            onClick={() => setActiveTab('tim')}
                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                                activeTab === 'tim'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Tim Saya
                        </Link>
                        <Link
                            href="/workspace"
                            onClick={() => setActiveTab('task')}
                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                                activeTab === 'task'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Task Board
                        </Link>
                    </nav>

                    {/* Right User Actions */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/settings/profile"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Pengaturan"
                        >
                            <Settings className="w-5 h-5 stroke-[1.75]" />
                        </Link>
                        <Link
                            href="/notifications"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative transition"
                            title="Notifikasi"
                        >
                            <Bell className="w-5 h-5 stroke-[1.75]" />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                        </Link>
                        <Link
                            href="/settings/profile"
                            className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-100 shadow-2xs overflow-hidden"
                            title={user?.name}
                        >
                            {initials || 'FA'}
                        </Link>
                    </div>
                </header>

                {/* 2. GREETING ROW (NO SUBTITLE/DESCRIPTION as requested) */}
                <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 mb-4">
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

                {/* 3. ACTION TOOLBAR ROW */}
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

                {/* 4. TOP CARDS ROW (4 CARDS) */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-5">
                    {/* Card 1: Status Tugas (Pending & Selesai) */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                    Status Tugas
                                </h2>
                                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50/80 border border-blue-200/60 px-3 py-0.5 rounded-full">
                                    Laporan
                                </span>
                            </div>

                            {/* Pill Badges */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-[#1e293b] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                    15 Selesai
                                </span>
                                <span className="bg-blue-50 text-blue-600 border border-blue-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                                    10 Pending
                                </span>
                            </div>
                        </div>

                        {/* Dual Curve SVG Chart with dashed reference line */}
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

                    {/* Card 2: Royal Blue Hero Card (News From The Doctor / Matchmaking) */}
                    <div className="bg-[#2563eb] text-white rounded-2xl p-5 shadow-sm shadow-blue-500/20 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
                        {/* Top Row with circular emblem & badge */}
                        <div className="flex items-center justify-between">
                            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs">
                                <div className="w-4 h-4 rounded-full border-[3px] border-[#2563eb]" />
                            </div>
                            <span className="bg-white/20 backdrop-blur-xs text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                                Info Hari Ini
                            </span>
                        </div>

                        {/* Card Content */}
                        <div className="my-2">
                            <h2 className="text-base font-bold text-white tracking-tight mb-1.5">
                                Info Matchmaking Tim
                            </h2>
                            <p className="text-xs text-blue-50/90 leading-relaxed font-normal">
                                RakitCampus bantu kamu temukan partner lomba yang sefrekuensi, selesaikan tugas bareng, dan raih prestasi.
                            </p>
                        </div>

                        {/* Bottom Stepper Indicators */}
                        <div className="flex items-center gap-1.5 pt-1">
                            <button
                                onClick={() => setActiveSlide(0)}
                                className={`h-1 rounded-full transition-all ${activeSlide === 0 ? 'w-7 bg-white' : 'w-4 bg-white/40'}`}
                            />
                            <button
                                onClick={() => setActiveSlide(1)}
                                className={`h-1 rounded-full transition-all ${activeSlide === 1 ? 'w-7 bg-white' : 'w-4 bg-white/40'}`}
                            />
                            <button
                                onClick={() => setActiveSlide(2)}
                                className={`h-1 rounded-full transition-all ${activeSlide === 2 ? 'w-7 bg-white' : 'w-4 bg-white/40'}`}
                            />
                        </div>
                    </div>

                    {/* Card 3: Kesiapan Tim (Health Trend Chart) */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                Kesiapan Tim
                            </h2>
                            <button type="button" className="text-slate-400 hover:text-slate-600 transition">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Metric Row */}
                        <div className="flex items-center gap-2 mt-1 mb-2">
                            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                85%
                            </span>
                            <span className="bg-sky-50 text-sky-600 text-[11px] font-bold px-2 py-0.5 rounded-full border border-sky-100">
                                +0,75%
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

                    {/* Card 4: Deadline Terdekat (Checkup progress) */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[220px]">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                Deadline Terdekat
                            </h2>
                            <button type="button" className="text-slate-400 hover:text-slate-600 transition">
                                <MoreHorizontal className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Progress Item 1 */}
                        <div className="py-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-800">
                                    {upcomingCompetitions?.[0]?.registration_deadline
                                        ? new Date(upcomingCompetitions[0].registration_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : '22 Agustus, 2026'}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="w-[78%] h-full bg-blue-600 rounded-full" />
                            </div>
                        </div>

                        {/* Progress Item 2 */}
                        <div className="py-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold text-slate-800">
                                    {upcomingCompetitions?.[1]?.registration_deadline
                                        ? new Date(upcomingCompetitions[1].registration_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : '16 Agustus, 2026'}
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className="w-[45%] h-full bg-blue-600 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. BOTTOM CARDS ROW (3 CARDS: 1fr - 2fr - 1fr) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                    {/* Bottom Card 1: Informasi Mahasiswa (Medical Information) */}
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
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden ring-2 ring-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm">
                                        {initials || 'FA'}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            {user?.name || 'Cameron Williamson'}
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium">
                                            Mahasiswa
                                        </p>
                                    </div>
                                </div>

                                {/* QR Code Graphic */}
                                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-800" title="Student ID QR">
                                    <QrCode className="w-6 h-6 stroke-[1.5]" />
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
                                    <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                                        {user?.major || 'Teknik Informatika'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400 font-medium mb-0.5">
                                        Peran Utama
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                                        {user?.headline || 'Hacker & Hustler'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-400 font-medium mb-0.5">
                                        Kampus Asal
                                    </p>
                                    <p className="text-xs font-bold text-slate-800 leading-tight truncate">
                                        {user?.campus || 'Institut Teknologi Bandung'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Subtle Footer Link */}
                        <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>NIM: {user?.nim || '13521045'}</span>
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aktif
                            </span>
                        </div>
                    </div>

                    {/* Bottom Card 2: Laporan Aktivitas Tim (Patient health report with Bar Chart & Tooltip) */}
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
                                {/* Dashed 50% target horizontal line */}
                                <div className="absolute top-[48%] left-8 right-2 border-b border-dashed border-blue-200 z-0" />

                                <div className="flex">
                                    {/* Y-axis */}
                                    <div className="flex flex-col justify-between h-40 text-[10px] text-slate-400 font-semibold pr-3 shrink-0">
                                        <span>70</span>
                                        <span>50</span>
                                        <span>30</span>
                                        <span>10</span>
                                    </div>

                                    {/* 6 Monthly Pillars */}
                                    <div className="flex-1 grid grid-cols-6 gap-2 sm:gap-4 items-end h-40 relative z-10 px-2">
                                        {/* Jan */}
                                        <div className="flex flex-col items-center h-full justify-end group">
                                            <div className="w-full max-w-[42px] h-[40%] bg-blue-50/80 rounded-xl group-hover:bg-blue-100 transition" />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-2">Jan</span>
                                        </div>

                                        {/* Feb (Active Blue with Tooltip) */}
                                        <div className="flex flex-col items-center h-full justify-end relative group">
                                            {/* Tooltip bubble matching the screenshot */}
                                            <div className="absolute -top-12 z-20 bg-[#1e293b] text-white text-[10px] py-1.5 px-2.5 rounded-xl shadow-lg whitespace-nowrap pointer-events-none">
                                                <p className="font-bold text-white mb-0.5">Senin</p>
                                                <p className="text-slate-300">● 4 tugas selesai</p>
                                                <p className="text-slate-300">● sprint lolos</p>
                                                {/* Tooltip down arrow */}
                                                <div className="w-2 h-2 bg-[#1e293b] rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                            </div>

                                            <div className="w-full max-w-[42px] h-[85%] bg-gradient-to-t from-blue-700 to-blue-500 rounded-xl shadow-xs" />
                                            <span className="text-[11px] text-slate-800 font-bold mt-2">Feb</span>
                                        </div>

                                        {/* Mar */}
                                        <div className="flex flex-col items-center h-full justify-end group">
                                            <div className="w-full max-w-[42px] h-[35%] bg-blue-50/80 rounded-xl group-hover:bg-blue-100 transition" />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-2">Mar</span>
                                        </div>

                                        {/* Apr */}
                                        <div className="flex flex-col items-center h-full justify-end group">
                                            <div className="w-full max-w-[42px] h-[55%] bg-blue-50/80 rounded-xl group-hover:bg-blue-100 transition" />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-2">Apr</span>
                                        </div>

                                        {/* May (Active Solid Blue) */}
                                        <div className="flex flex-col items-center h-full justify-end group">
                                            <div className="w-full max-w-[42px] h-[72%] bg-gradient-to-t from-blue-700 to-blue-500 rounded-xl shadow-xs" />
                                            <span className="text-[11px] text-slate-800 font-bold mt-2">May</span>
                                        </div>

                                        {/* Jun */}
                                        <div className="flex flex-col items-center h-full justify-end group">
                                            <div className="w-full max-w-[42px] h-[60%] bg-blue-50/80 rounded-xl group-hover:bg-blue-100 transition" />
                                            <span className="text-[11px] text-slate-400 font-semibold mt-2">Jun</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Card 3: Rekan Satu Tim (My Doctor) */}
                    <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                    Rekan Satu Tim
                                </h2>
                                <Link
                                    href="/competitions?tab=my_teams"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                >
                                    Lihat Detail
                                </Link>
                            </div>

                            {/* Teammates List */}
                            <div className="divide-y divide-slate-100">
                                {teammates.map((mate: any) => (
                                    <div key={mate.id} className="py-3 flex items-center gap-3">
                                        <img
                                            src={mate.avatarImg}
                                            alt={mate.name}
                                            className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                                            onError={(e) => {
                                                // Fallback if image fails to load
                                                (e.target as HTMLElement).style.display = 'none';
                                            }}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-xs font-bold text-slate-900 truncate">
                                                {mate.name}
                                            </h3>
                                            <p className="text-[11px] text-slate-400 font-medium truncate">
                                                {mate.team}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Action Footer */}
                        <div className="pt-3 border-t border-slate-100">
                            <Link
                                href="/competitions"
                                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                            >
                                <span>Cari Partner Baru</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
