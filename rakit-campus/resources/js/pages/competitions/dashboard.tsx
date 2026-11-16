import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Award,
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileCheck,
    FolderGit2,
    Inbox,
    Layers,
    Plus,
    Sparkles,
    Trophy,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

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
            {
                preserveScroll: true,
                onFinish: () => setRespondingInvitationId(null),
            }
        );
    };

    const handleDeclineInvitation = (invitationId: number) => {
        const reason = prompt('Alasan menolak undangan (opsional):');
        setRespondingInvitationId(invitationId);
        router.post(
            `/competition-invitations/${invitationId}/decline`,
            { reason },
            {
                preserveScroll: true,
                onFinish: () => setRespondingInvitationId(null),
            }
        );
    };

    const readinessAvg = stats?.team_readiness_avg ?? 0;
    const pendingInvites = receivedInvitations.filter((i: any) => i.status === 'pending');

    return (
        <AppLayout activeTab="lomba" title="Dashboard Kompetisi & Lomba - RakitCampus">
            <Head title="Dashboard Kompetisi & Lomba" />

            {/* 1. HEADER ROW */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-200/80 mb-5 sm:mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/80 flex items-center gap-1.5">
                            <Trophy className="size-3 text-amber-500" />
                            <span>Competition Hub</span>
                        </span>
                        <span className="text-xs text-slate-400">• Ruang Persiapan Kompetisi & Lomba</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                        Dashboard Kompetisi & Lomba
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {/* Hub Switcher Pill */}
                    <div className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0">
                        <Link
                            href="/dashboard"
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition flex items-center gap-1.5"
                        >
                            <FolderGit2 className="size-3.5 text-blue-600" />
                            <span>Dashboard Proyek</span>
                        </Link>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-amber-700 shadow-2xs flex items-center gap-1.5">
                            <Trophy className="size-3.5 text-amber-500" />
                            <span>Dashboard Lomba</span>
                        </span>
                    </div>

                    <Link
                        href="/competitions"
                        className="justify-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Eksplor & Ikut Lomba</span>
                    </Link>
                    <Link
                        href="/competition-workspace"
                        className="justify-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-amber-50/50 hover:border-amber-300 hover:text-amber-700 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-all duration-200 cursor-pointer group"
                    >
                        <span>Workspace Lomba</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </section>

            {/* FLASH & ERROR BANNERS */}
            {flash?.success && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{flash.success}</span>
                </div>
            )}
            {flash?.info && (
                <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800">
                    {flash.info}
                </div>
            )}
            {(flash?.error || pageErrors?.invitation || pageErrors?.capacity) && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{flash?.error || pageErrors?.invitation || pageErrors?.capacity}</span>
                </div>
            )}

            {/* 2. BENTO STATS GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {/* Stat 1: Tim Lomba Anda */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between group hover:border-amber-300 hover:shadow-xs transition">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tim Kompetisi</span>
                        <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/70 group-hover:scale-105 transition-transform">
                            <Trophy className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {myCompetitionTeams.length}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tim aktif terdaftar</p>
                    </div>
                </div>

                {/* Stat 2: Kesiapan Berkas & Karya */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between group hover:border-emerald-300 hover:shadow-xs transition">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Kesiapan</span>
                        <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/70 group-hover:scale-105 transition-transform">
                            <FileCheck className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                {readinessAvg}%
                            </span>
                            <span className="text-[11px] text-emerald-600 font-semibold">Skor Berkas</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(5, readinessAvg))}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Stat 3: Undangan Masuk */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between group hover:border-blue-300 hover:shadow-xs transition">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Undangan Rekrutmen</span>
                        <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/70 group-hover:scale-105 transition-transform">
                            <Inbox className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {pendingInvites.length}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tawaran butuh konfirmasi</p>
                    </div>
                </div>

                {/* Stat 4: Kompetisi Tersedia */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between group hover:border-indigo-300 hover:shadow-xs transition">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Kompetisi Terbuka</span>
                        <div className="size-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/70 group-hover:scale-105 transition-transform">
                            <Calendar className="size-4" />
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {upcomingCompetitions.length}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-0.5">Peluang lomba mendatang</p>
                    </div>
                </div>
            </div>

            {/* 3. MAIN DASHBOARD CONTENT (8 COLS / 4 COLS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                {/* LEFT COLUMN: TEAMS & INVITATIONS */}
                <div className="lg:col-span-8 space-y-5 sm:space-y-6">
                    {/* SECTION 1: TIM KOMPETISI & LOMBA ANDA */}
                    <div className="bg-white rounded-2xl border border-amber-200/80 p-4 sm:p-6 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                            <div>
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    <span>Tim Kompetisi & Lomba Anda</span>
                                    {myCompetitionTeams.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                            {myCompetitionTeams.length} Terdaftar
                                        </span>
                                    )}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Kelola persiapan berkas administrasi, proposal riset, dan deliverable lomba.
                                </p>
                            </div>

                            <Link
                                href="/competitions"
                                className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline transition flex items-center gap-1 group"
                            >
                                <span>Cari Lomba Baru</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        {myCompetitionTeams && myCompetitionTeams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {myCompetitionTeams.map((cTeam: any) => (
                                    <div
                                        key={cTeam.id}
                                        className="p-4 rounded-xl border border-amber-200/70 bg-gradient-to-br from-white via-amber-50/20 to-white hover:border-amber-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between gap-3 group/item"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                                                    Kompetisi {cTeam.competition?.level || 'Nasional'}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    {cTeam.stage_label}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 group-hover/item:text-amber-800 transition">
                                                {cTeam.name}
                                            </h3>
                                            {cTeam.competition?.name && (
                                                <p className="text-xs text-slate-600 mt-0.5 line-clamp-1 font-medium">
                                                    {cTeam.competition.name}
                                                </p>
                                            )}
                                            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500">
                                                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
                                                    Peran: {cTeam.role_name}
                                                </span>
                                                {cTeam.is_leader && (
                                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] border border-emerald-200">
                                                        Ketua Tim
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 space-y-2">
                                            {/* Readiness Score Progress */}
                                            <div className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500">Kesiapan Berkas & Karya:</span>
                                                <span className="font-bold text-slate-900">{cTeam.progress_percent}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${cTeam.progress_percent}%` }}
                                                />
                                            </div>

                                            <div className="pt-1 flex items-center justify-between text-xs">
                                                <span className="text-[11px] text-slate-500">
                                                    {cTeam.members_count || 1} Anggota Terdaftar
                                                </span>
                                                <Link
                                                    href={cTeam.workspace_url}
                                                    className="font-bold text-xs text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
                                                >
                                                    <span>Buka Workspace Lomba</span>
                                                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/item:translate-x-0.5" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <Trophy className="w-9 h-9 text-amber-300 mx-auto mb-2" />
                                <p className="font-semibold text-slate-700 text-sm">Belum Mengikuti Tim Kompetisi</p>
                                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                    Ayo jelajahi daftar kompetisi nasional & kampus untuk membentuk tim inovasi, riset, atau lomba bisnis.
                                </p>
                                <Link
                                    href="/competitions"
                                    className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition shadow-2xs"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Jelajahi Lomba</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* SECTION 2: UNDANGAN TIM LOMBA MASUK */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                            <div>
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Inbox className="w-4 h-4 text-blue-600" />
                                    <span>Undangan Tim Lomba Masuk</span>
                                    {pendingInvites.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                            {pendingInvites.length} Menunggu
                                        </span>
                                    )}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Tinjau tawaran dari ketua tim sebelum menerima dan bergabung secara resmi.
                                </p>
                            </div>
                        </div>

                        {receivedInvitations && receivedInvitations.length > 0 ? (
                            <div className="space-y-3">
                                {receivedInvitations.map((inv: any) => {
                                    const isPending = inv.status === 'pending';
                                    const isAccepted = inv.status === 'accepted';
                                    const isDeclined = inv.status === 'declined';
                                    const isSubmitting = respondingInvitationId === inv.id;

                                    return (
                                        <div
                                            key={inv.id}
                                            className={`p-4 rounded-xl border transition-all ${
                                                isPending
                                                    ? 'bg-amber-50/20 border-amber-200/80 hover:border-amber-300'
                                                    : isAccepted
                                                    ? 'bg-emerald-50/20 border-emerald-200'
                                                    : 'bg-slate-50/50 border-slate-200 opacity-60'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                                                            {inv.level_label || 'Kompetisi'}
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-900 truncate">
                                                            Tim: {inv.team_name}
                                                        </span>
                                                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                            Peran: {inv.role_name}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-600">
                                                        Diundang oleh <strong className="text-slate-800">{inv.inviter_name}</strong>
                                                        {inv.competition_name ? ` untuk ${inv.competition_name}` : ''}
                                                    </p>

                                                    {inv.message && (
                                                        <p className="text-xs text-slate-500 italic mt-1 bg-white/70 p-2 rounded-lg border border-slate-100">
                                                            "{inv.message}"
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                    {isPending ? (
                                                        <>
                                                            <Link
                                                                href={inv.workspace_url}
                                                                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                                                            >
                                                                Buka Workspace
                                                            </Link>
                                                            <button
                                                                type="button"
                                                                disabled={isSubmitting}
                                                                onClick={() => handleAcceptInvitation(inv.id)}
                                                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50"
                                                            >
                                                                {isSubmitting ? 'Memproses...' : 'Terima'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={isSubmitting}
                                                                onClick={() => handleDeclineInvitation(inv.id)}
                                                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 text-xs font-semibold transition disabled:opacity-50"
                                                            >
                                                                Tolak
                                                            </button>
                                                        </>
                                                    ) : isAccepted ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                                                                <CheckCircle2 className="size-3.5" />
                                                                <span>Sudah Bergabung</span>
                                                            </span>
                                                            <Link
                                                                href={inv.workspace_url}
                                                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-2xs"
                                                            >
                                                                Buka Workspace
                                                            </Link>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 font-medium">
                                                            Undangan Ditolak
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                                <p className="font-semibold text-slate-700">Tidak ada undangan tim saat ini</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Undangan dari ketua tim kompetisi lain akan muncul di sini.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* SECTION 3: TUGAS PERSIAPAN LOMBA */}
                    {myTasks && myTasks.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-500" />
                                        <span>Tugas & Deliverable Persiapan Lomba</span>
                                    </h2>
                                </div>
                                <Link
                                    href="/competition-workspace"
                                    className="text-xs font-semibold text-amber-700 hover:underline transition flex items-center gap-1"
                                >
                                    <span>Workspace Lomba</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {myTasks.slice(0, 5).map((task: any, idx: number) => {
                                    const dueDate = task.due_on ? new Date(task.due_on) : (task.due_date ? new Date(task.due_date) : null);
                                    const isUrgent = dueDate && dueDate < new Date(Date.now() + 3 * 86400000);

                                    return (
                                        <div
                                            key={task.id || idx}
                                            className="py-3 flex items-center justify-between gap-3 group"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="text-xs font-semibold text-slate-900 group-hover:text-amber-700 transition block truncate">
                                                    {task.title}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                                    <span>{task.team?.name || 'Tim Lomba'}</span>
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
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: UPCOMING COMPETITIONS & RECENT ACTIVITY */}
                <div className="lg:col-span-4 space-y-5 sm:space-y-6">
                    {/* CARD: KOMPETISI MENDATANG */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Calendar className="size-4 text-amber-500" />
                                <span>Kompetisi Rekomendasi</span>
                            </h3>
                            <Link
                                href="/competitions"
                                className="text-xs font-semibold text-amber-700 hover:underline"
                            >
                                Lihat Semua
                            </Link>
                        </div>

                        {upcomingCompetitions && upcomingCompetitions.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingCompetitions.slice(0, 4).map((comp: any) => (
                                    <div
                                        key={comp.id}
                                        className="p-3 rounded-xl border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/20 transition flex flex-col justify-between gap-2 group/card"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded border border-amber-200">
                                                    {comp.level || 'Nasional'}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    Deadline: {comp.registration_deadline}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-900 group-hover/card:text-amber-800 transition line-clamp-1">
                                                {comp.name}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                                Penyelenggara: {comp.organizer || 'Official'}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                            <span className="text-slate-400 font-medium truncate max-w-[120px]">
                                                {comp.prize_pool || 'Sertifikat'}
                                            </span>
                                            <Link
                                                href={`/competitions/${comp.slug}`}
                                                className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-0.5 hover:underline shrink-0"
                                            >
                                                <span>Detail</span>
                                                <ArrowRight className="size-3" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-slate-400">
                                Belum ada kompetisi aktif.
                            </div>
                        )}
                    </div>

                    {/* CARD: PANDUAN PERSIAPAN LOMBA */}
                    <div className="bg-gradient-to-br from-amber-500/10 via-amber-100/30 to-white rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="size-4 text-amber-600" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                                Tips Kesiapan Lomba RAKIT
                            </h4>
                        </div>
                        <ul className="text-xs text-slate-600 space-y-2 mt-2">
                            <li className="flex items-start gap-2">
                                <span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                                <span>Pastikan anggota tim sesuai dengan batas kuota lomba resmi.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                                <span>Lengkapi berkas proposal, surat pengantar kampus, dan lembar pengesahan.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="size-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                                <span>Gunakan AI Workspace untuk review awal format proposal & abstrak.</span>
                            </li>
                        </ul>
                        <div className="mt-3.5 pt-2.5 border-t border-amber-200/60">
                            <Link
                                href="/competition-workspace"
                                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center justify-between"
                            >
                                <span>Buka Workspace Persiapan</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    </div>

                    {/* CARD: AKTIVITAS TIM TERBARU */}
                    {recentActivities && recentActivities.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                                <Activity className="size-3.5" />
                                <span>Aktivitas Tim Terkini</span>
                            </h3>
                            <div className="space-y-2.5">
                                {recentActivities.slice(0, 5).map((act: any) => (
                                    <div key={act.id} className="text-xs text-slate-600 flex items-start gap-2">
                                        <span className="size-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5" />
                                        <div className="min-w-0 flex-1">
                                            <p className="line-clamp-2">
                                                <strong className="text-slate-800">{act.actor?.name || 'Anggota'}</strong> {act.description || act.action}
                                            </p>
                                            <span className="text-[10px] text-slate-400">
                                                {act.created_at ? new Date(act.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Baru saja'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
