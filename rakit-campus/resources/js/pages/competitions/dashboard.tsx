import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Award,
    Bot,
    Calendar,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    FileText,
    Folder,
    FolderGit2,
    FolderKanban,
    Layers,
    LayoutGrid,
    List,
    MessageSquare,
    Plus,
    ShieldCheck,
    Sparkles,
    Star,
    Trophy,
    Users,
    Video,
    Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Props {
    isPublic?: boolean;
    user?: any;
    stats?: {
        my_competition_teams_count: number;
        team_readiness_avg: number;
        pending_invitations_count: number;
        upcoming_competitions_count: number;
        completed_tasks_count: number;
    };
    myCompetitionTeams?: any[];
    receivedInvitations?: any[];
    upcomingCompetitions?: any[];
    myTasks?: any[];
    recentActivities?: any[];
}

export default function CompetitionDashboard({
    isPublic = false,
    user = {} as any,
    stats = {} as any,
    myCompetitionTeams = [],
    receivedInvitations = [],
    upcomingCompetitions = [],
    myTasks = [],
    recentActivities = [],
}: Props) {
    const { flash, errors: pageErrors } = usePage<any>().props;
    const [respondingInvitationId, setRespondingInvitationId] = useState<number | null>(null);

    const handleAcceptInvitation = (invitationId: number) => {
        setRespondingInvitationId(invitationId);
        router.post(
            `/competition-invitations/${invitationId}/accept`,
            {},
            { preserveScroll: true, onFinish: () => setRespondingInvitationId(null) }
        );
    };

    const handleDeclineInvitation = (invitationId: number) => {
        const reason = prompt('Alasan menolak undangan (opsional):');
        setRespondingInvitationId(invitationId);
        router.post(
            `/competition-invitations/${invitationId}/decline`,
            { reason },
            { preserveScroll: true, onFinish: () => setRespondingInvitationId(null) }
        );
    };

    const readinessAvg = Math.min(100, Math.max(0, stats?.team_readiness_avg ?? 0));
    const pendingInvites = receivedInvitations.filter((i: any) => i.status === 'pending');
    const primaryTeam = myCompetitionTeams && myCompetitionTeams.length > 0 ? myCompetitionTeams[0] : null;
    const featuredCompetition = upcomingCompetitions && upcomingCompetitions.length > 0 ? upcomingCompetitions[0] : null;

    const getInitials = (name?: string) => {
        if (!name) return 'RC';
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0].toUpperCase())
            .join('');
    };

    // Calendar weekdays generator (Apple iOS style strip)
    const today = new Date();
    const weekDays = useMemo(() => {
        const days = [];
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const currentDayIndex = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDayIndex + 1); // Start from Monday

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            days.push({
                dayName: dayNames[d.getDay()],
                dateNum: d.getDate(),
                isToday: d.toDateString() === today.toDateString(),
            });
        }
        return days;
    }, []);

    const checklist = [
        {
            num: 1,
            title: 'Proposal Inovasi / Abstrak',
            desc: 'PDF 15–20 halaman baku.',
            icon: FileText,
            isDone: readinessAvg >= 40,
        },
        {
            num: 2,
            title: 'Lembar Pengesahan Kampus',
            desc: 'TTD Dosen & Pimpinan Fakultas.',
            icon: ShieldCheck,
            isDone: readinessAvg >= 60,
        },
        {
            num: 3,
            title: 'Pitch Deck Paparan',
            desc: 'Slide 10–12 halaman.',
            icon: Layers,
            isDone: readinessAvg >= 80,
        },
        {
            num: 4,
            title: 'Video Demo & Poster',
            desc: 'Video demo YouTube + poster A1.',
            icon: Zap,
            isDone: readinessAvg >= 90,
        },
    ];

    return (
        <AppLayout activeTab="lomba" title="Dashboard Kompetisi & Lomba - RakitCampus">
            <Head title="Dashboard Kompetisi & Lomba" />

            {/* ── FLASH BANNERS ── */}
            {flash?.success && (
                <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    <span>{flash.success}</span>
                </div>
            )}
            {(flash?.error || pageErrors?.invitation || pageErrors?.capacity) && (
                <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="size-4 shrink-0 text-rose-500" />
                    <span>{flash?.error || pageErrors?.invitation || pageErrors?.capacity}</span>
                </div>
            )}

            <div className="space-y-5 sm:space-y-6">

                {/* ═══════════════════════════════════════════════════════════════════
                    TOP CONTEXT HUB CARD (Inspired by "My Projects" Header in Image 2)
                ═══════════════════════════════════════════════════════════════════ */}
                <div className="rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-4">
                    {/* Top Row: Title, Status Badge, Team Member Avatars */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Workspace Tim
                                </span>
                                <span className="size-1 rounded-full bg-slate-300" />
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>{primaryTeam ? primaryTeam.stage_label : 'Siap Mulai'}</span>
                                </div>
                            </div>

                            <div className="mt-1 flex items-baseline gap-2.5 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    {primaryTeam?.name || 'Workspace Mandiri'}
                                </h1>
                                {primaryTeam?.competition?.name && (
                                    <span className="text-xs sm:text-sm font-semibold text-blue-600 truncate max-w-md">
                                        · {primaryTeam.competition.name}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right: Assigned Members & Actions */}
                        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2 overflow-hidden">
                                    {primaryTeam?.members && primaryTeam.members.length > 0 ? (
                                        primaryTeam.members.slice(0, 4).map((m: any, idx: number) => (
                                            <div
                                                key={m.id || idx}
                                                title={`${m.name} (${m.role || 'Anggota'})`}
                                                className="size-8 rounded-full border-2 border-white bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs"
                                            >
                                                {getInitials(m.name)}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="size-8 rounded-full border-2 border-white bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                                            {getInitials(user?.name)}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-slate-500 font-medium">
                                    {primaryTeam?.members_count || 1} Anggota
                                </span>
                            </div>

                            <Link
                                href="/competitions?tab=teams&view=radar"
                                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <Plus className="size-3.5 stroke-[2.5]" />
                                <span>Undang Rekan</span>
                            </Link>
                        </div>
                    </div>

                    {/* Bottom Row: Sub-Tabs & Workspace Action */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                            <span className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-xs">
                                Ikhtisar Lomba
                            </span>
                            <Link
                                href={primaryTeam?.workspace_url || '/competition-workspace'}
                                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-600 text-xs font-medium whitespace-nowrap transition"
                            >
                                Papan Tugas
                            </Link>
                            <Link
                                href={primaryTeam?.workspace_url || '/competition-workspace'}
                                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-600 text-xs font-medium whitespace-nowrap transition"
                            >
                                Berkas & Karya
                            </Link>
                            <Link
                                href="/competitions?tab=teams&view=radar"
                                className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-600 text-xs font-medium whitespace-nowrap transition"
                            >
                                Radar Talenta
                            </Link>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Link
                                href="/competitions"
                                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs"
                            >
                                Eksplor Lomba
                            </Link>
                            <Link
                                href={primaryTeam?.workspace_url || '/competition-workspace'}
                                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 group cursor-pointer"
                            >
                                <FolderKanban className="size-3.5" />
                                <span>Buka Workspace</span>
                                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════════
                    MAIN BENTO GRID (Sliced from iOS & Modern SaaS References)
                ═══════════════════════════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

                    {/* ─────────────────────────────────────────────────────────────
                        LEFT COLUMN (4 cols): PRIORITY ASSIGNMENT & TODAY'S SPRINT
                    ───────────────────────────────────────────────────────────── */}
                    <div className="lg:col-span-4 space-y-5">

                        {/* CARD 1: ASSIGNMENT / PRIORITY TASK (Image 2 Center Card Style) */}
                        <div className="rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col justify-between group">
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/70">
                                            {primaryTeam?.stage_label || 'Inkubasi'}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200/70">
                                            Prioritas Tinggi
                                        </span>
                                    </div>
                                    <Zap className="size-4 text-amber-500 fill-amber-400" />
                                </div>

                                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-blue-600 transition">
                                    {myTasks[0]?.title || 'Penyusunan Proposal Inovasi & Surat Pengesahan'}
                                </h3>

                                <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                                    Pastikan seluruh komponen bab latar belakang, arsitektur teknis prototipe, dan lembar pengesahan fakultas telah lengkap.
                                </p>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                    <Clock className="size-3 text-rose-500" />
                                    <span>Tenggat: {myTasks[0]?.due_on || 'Minggu Ini'}</span>
                                </span>

                                <Link
                                    href={primaryTeam?.workspace_url || '/competition-workspace'}
                                    className="px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-xs"
                                >
                                    Kerjakan
                                </Link>
                            </div>
                        </div>

                        {/* CARD 2: TODAY'S TASKS LIST (Image 2 Bottom Left Tasks Card Style) */}
                        <div className="rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold text-slate-900">Tugas Sprint</h3>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                        {myTasks.length} Aktif
                                    </span>
                                </div>
                                <Link
                                    href={primaryTeam?.workspace_url || '/competition-workspace'}
                                    className="text-xs font-semibold text-blue-600 hover:underline"
                                >
                                    Semua
                                </Link>
                            </div>

                            {myTasks && myTasks.length > 0 ? (
                                <div className="space-y-2.5">
                                    {myTasks.slice(0, 4).map((task: any, idx: number) => (
                                        <div
                                            key={task.id || idx}
                                            className="p-3 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-slate-300 hover:shadow-2xs transition-all flex items-center justify-between gap-3 group"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-blue-600 transition">
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                                    <span>{task.team?.name || 'Tim Lomba'}</span>
                                                    <span>·</span>
                                                    <span>{task.due_on ? task.due_on : 'Sprint'}</span>
                                                </div>
                                            </div>

                                            <div className="size-6 rounded-full border border-slate-300 group-hover:border-blue-500 flex items-center justify-center shrink-0 transition">
                                                <Check className="size-3 text-transparent group-hover:text-blue-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-xs text-slate-400">
                                    Belum ada tugas sprint aktif.
                                </div>
                            )}
                        </div>

                        {/* CARD 3: STANDAR KELENGKAPAN BERKAS (Checklist Style) */}
                        <div className="rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                                <span>Standar Kelengkapan Berkas</span>
                                <ShieldCheck className="size-4 text-emerald-600" />
                            </h3>

                            <div className="space-y-2">
                                {checklist.map((item) => (
                                    <div
                                        key={item.num}
                                        className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className={`size-6 rounded-lg flex items-center justify-center shrink-0 ${item.isDone ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <item.icon className="size-3.5" />
                                            </div>
                                            <span className="font-semibold text-slate-800 truncate">{item.title}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {item.isDone ? 'Siap' : 'Proses'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────
                        CENTER COLUMN (4 cols): COLLABORATION HERO & AI WORKSPACE
                    ───────────────────────────────────────────────────────────── */}
                    <div className="lg:col-span-4 space-y-5">

                        {/* CARD 4: HERO COLLABORATION / MEETING HUB (Image 1 Center Video Card) */}
                        <div className="rounded-[28px] bg-white p-6 sm:p-7 border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col items-center justify-between text-center relative overflow-hidden group">
                            {/* Ambient Light Ring */}
                            <div className="absolute -top-12 -right-12 size-36 rounded-full bg-blue-100/50 blur-2xl pointer-events-none" />

                            <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2">
                                <span className="font-bold text-[10px] uppercase tracking-wider">Ruang Kolaborasi</span>
                                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                            </div>

                            {/* Overlapping Large Avatars Cluster with Video Badge (Image 1 Slicing) */}
                            <div className="my-5 relative flex items-center justify-center">
                                <div className="size-16 sm:size-18 rounded-full border-4 border-white bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md -mr-4 z-0">
                                    {getInitials(primaryTeam?.members?.[0]?.name || 'TM')}
                                </div>
                                <div className="size-20 sm:size-22 rounded-full border-4 border-white bg-slate-900 text-white font-bold text-xl flex items-center justify-center shadow-xl z-10 relative">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 opacity-90 flex items-center justify-center text-white">
                                        <Video className="size-8 text-white stroke-[2.2]" />
                                    </div>
                                </div>
                                <div className="size-16 sm:size-18 rounded-full border-4 border-white bg-gradient-to-tr from-amber-400 to-orange-500 text-white font-bold text-lg flex items-center justify-center shadow-md -ml-4 z-0">
                                    {getInitials(primaryTeam?.members?.[1]?.name || 'KD')}
                                </div>
                            </div>

                            <div className="space-y-1 mb-5">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                                    Workspace Tim Aktif
                                </h3>
                                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                                    Diskusi sinkronisasi tugas, kurasi berkas dokumen, dan integrasi repositori kode tim Anda.
                                </p>
                            </div>

                            {/* Solid Action Pill Button (Image 1 Green Join Button Style) */}
                            <Link
                                href={primaryTeam?.workspace_url || '/competition-workspace'}
                                className="w-full py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm text-center shadow-xs hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <FolderKanban className="size-4" />
                                <span>Masuk Workspace Kolaborasi</span>
                            </Link>
                        </div>

                        {/* CARD 5: AI WORKSPACE FLAGSHIP BANNER (Image 2 Bottom Center Purple Banner) */}
                        <div className="rounded-[28px] bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white p-6 sm:p-7 shadow-[0_8px_30px_rgba(79,70,229,0.25)] relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                            {/* Decorative background blurs */}
                            <div className="absolute -top-10 -right-10 size-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
                            <div className="absolute -bottom-8 -left-8 size-28 rounded-full bg-purple-400/20 blur-xl pointer-events-none" />

                            <div>
                                <div className="size-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4">
                                    <Bot className="size-5 text-amber-300" />
                                </div>

                                <h3 className="text-lg font-black tracking-tight text-white mb-1">
                                    AI Workspace RAKIT
                                </h3>
                                <p className="text-xs text-indigo-100/90 leading-relaxed">
                                    Konsultasikan draf proposal, telaah kriteria penjurian GEMASTIK/PKM, dan perbaiki penulisan karya secara instan.
                                </p>
                            </div>

                            <div className="mt-5">
                                <Link
                                    href="/ai-workspace"
                                    className="w-full py-2.5 rounded-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs sm:text-sm text-center transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <Sparkles className="size-3.5 text-amber-500" />
                                    <span>Konsultasi AI Sekarang</span>
                                </Link>
                            </div>
                        </div>

                        {/* CARD 6: UNDANGAN REKRUTMEN (Image 1 User Row List Style) */}
                        <div className="rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center justify-between mb-3.5">
                                <h3 className="text-sm font-bold text-slate-900">Undangan Rekrutmen</h3>
                                {pendingInvites.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                                        {pendingInvites.length} Baru
                                    </span>
                                )}
                            </div>

                            {pendingInvites.length > 0 ? (
                                <div className="space-y-2.5">
                                    {pendingInvites.slice(0, 2).map((inv: any) => (
                                        <div key={inv.id} className="p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70 text-xs space-y-2">
                                            <div className="font-bold text-slate-900 truncate">{inv.team_name}</div>
                                            <p className="text-[11px] text-slate-500 truncate">
                                                {inv.role_name} · oleh {inv.inviter_name}
                                            </p>
                                            <div className="flex items-center gap-1.5 pt-1">
                                                <button
                                                    type="button"
                                                    disabled={respondingInvitationId === inv.id}
                                                    onClick={() => handleAcceptInvitation(inv.id)}
                                                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold transition hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    Terima
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={respondingInvitationId === inv.id}
                                                    onClick={() => handleDeclineInvitation(inv.id)}
                                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-[11px] font-medium hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 py-2">
                                    Tidak ada undangan rekrutmen tertunda.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* ─────────────────────────────────────────────────────────────
                        RIGHT COLUMN (4 cols): SPRINT CALENDAR, METRIC GAUGES, DEADLINE
                    ───────────────────────────────────────────────────────────── */}
                    <div className="lg:col-span-4 space-y-5">

                        {/* CARD 7: SPRINT CALENDAR STRIP (Image 1 & 2 Weekdays Calendar Style) */}
                        <div className="rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-900">
                                    {today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                                </h3>
                                <div className="flex items-center gap-1">
                                    <button type="button" className="size-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700">
                                        <ChevronLeft className="size-3" />
                                    </button>
                                    <button type="button" className="size-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700">
                                        <ChevronRight className="size-3" />
                                    </button>
                                </div>
                            </div>

                            {/* Horizontal Week Days Strip (Exact Slicing from Image 1 & 2) */}
                            <div className="grid grid-cols-7 gap-1 text-center py-2 border-y border-slate-100">
                                {weekDays.map((d, i) => (
                                    <div
                                        key={i}
                                        className={`flex flex-col items-center py-1.5 rounded-xl transition ${
                                            d.isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        <span className={`text-[10px] font-medium ${d.isToday ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {d.dayName}
                                        </span>
                                        <span className={`text-xs font-bold mt-0.5 ${d.isToday ? 'text-white' : 'text-slate-800'}`}>
                                            {d.dateNum}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Schedule Timeline below */}
                            <div className="mt-3.5 space-y-2 text-xs">
                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-500 font-medium">Sprint Tim Harian</span>
                                    <span className="font-bold text-slate-800">14:00 - 16:30</span>
                                </div>
                                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-slate-500 font-medium">Validasi Dosen</span>
                                    <span className="font-bold text-blue-600">Kamis, 10:00</span>
                                </div>
                            </div>
                        </div>

                        {/* CARD 8: 2 COMPACT METRIC DONUT GAUGES (Image 2 Bottom Right Donut Gauges) */}
                        <div className="grid grid-cols-2 gap-3.5">
                            {/* Gauge 1: Kesiapan Berkas */}
                            <div className="rounded-[24px] bg-white p-4 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center text-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Kesiapan Berkas
                                </span>

                                <div className="relative size-20 my-2 flex items-center justify-center">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-slate-100"
                                            strokeWidth="3.8"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-blue-600 transition-all duration-700"
                                            strokeDasharray={`${readinessAvg}, 100`}
                                            strokeWidth="3.8"
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <span className="absolute text-sm font-black text-slate-900">{readinessAvg}%</span>
                                </div>

                                <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                    {readinessAvg >= 80 ? 'Lengkap' : 'Penyusunan'}
                                </span>
                            </div>

                            {/* Gauge 2: Tugas Selesai */}
                            <div className="rounded-[24px] bg-white p-4 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col items-center text-center justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Tugas Selesai
                                </span>

                                <div className="relative size-20 my-2 flex items-center justify-center">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-slate-100"
                                            strokeWidth="3.8"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path
                                            className="text-emerald-500 transition-all duration-700"
                                            strokeDasharray={`${primaryTeam?.progress_percent || 0}, 100`}
                                            strokeWidth="3.8"
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="none"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <span className="absolute text-sm font-black text-slate-900">{primaryTeam?.progress_percent || 0}%</span>
                                </div>

                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                    {primaryTeam?.progress_percent || 0}% Selesai
                                </span>
                            </div>
                        </div>

                        {/* CARD 9: DEADLINE / FEATURED COMPETITION (Image 2 Bottom Right Action Card) */}
                        {featuredCompetition && (
                            <div className="rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        Peluang Lomba
                                    </span>
                                    <Trophy className="size-4 text-amber-500" />
                                </div>

                                <h4 className="text-sm font-bold text-slate-900 line-clamp-1 mt-1">
                                    {featuredCompetition.name}
                                </h4>
                                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                    {featuredCompetition.organizer || 'Official Puspresnas'}
                                </p>

                                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                                    <span className="text-slate-400">Batas Daftar:</span>
                                    <span className="font-bold text-rose-600">{featuredCompetition.registration_deadline}</span>
                                </div>

                                <div className="mt-4 flex items-center gap-2">
                                    <Link
                                        href={`/competitions/${featuredCompetition.slug}`}
                                        className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold text-center transition shadow-2xs"
                                    >
                                        Panduan Lomba
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
