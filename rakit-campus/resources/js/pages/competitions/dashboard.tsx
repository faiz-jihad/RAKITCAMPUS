import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    FileText,
    FolderGit2,
    FolderKanban,
    Layers,
    Plus,
    ShieldCheck,
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

    // Stage progression
    const competitionStages = [
        { key: 'recruiting', label: 'Formasi Tim' },
        { key: 'preparing', label: 'Draf Proposal' },
        { key: 'review', label: 'Validasi' },
        { key: 'submitted', label: 'Submit' },
        { key: 'finalist', label: 'Final' },
    ];

    const getStageIndex = (stage?: string) => {
        switch (stage) {
            case 'recruiting':
            case 'pembentukan':
                return 0;
            case 'team_formation':
            case 'preparing':
                return 1;
            case 'registered':
            case 'administrative_selection':
                return 2;
            case 'submitted':
            case 'shortlisted':
                return 3;
            case 'finalist':
            case 'final_presentation':
            case 'winner':
                return 4;
            default:
                return 1;
        }
    };

    const currentStageIdx = primaryTeam ? getStageIndex(primaryTeam.stage) : 0;

    // Urgency helper for tasks
    const getTaskUrgency = (dueDateStr?: string) => {
        if (!dueDateStr) return 'normal';
        const due = new Date(dueDateStr);
        const now = Date.now();
        const diff = due.getTime() - now;
        if (diff < 0) return 'overdue';
        if (diff < 86400000 * 2) return 'critical';
        if (diff < 86400000 * 5) return 'urgent';
        return 'normal';
    };

    const urgencyConfig = {
        overdue: { dot: 'bg-rose-500', label: 'text-rose-600 font-semibold', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
        critical: { dot: 'bg-rose-400', label: 'text-rose-500 font-semibold', badge: 'bg-rose-50 text-rose-600 border-rose-200' },
        urgent: { dot: 'bg-amber-400', label: 'text-amber-600 font-medium', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
        normal: { dot: 'bg-slate-300', label: 'text-slate-400', badge: 'bg-slate-50 text-slate-600 border-slate-200' },
    };

    const checklist = [
        {
            num: 1,
            title: 'Proposal Inovasi / Abstrak',
            desc: 'PDF 15–20 halaman: latar belakang, solusi, metodologi, analisis manfaat.',
            icon: FileText,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            num: 2,
            title: 'Lembar Pengesahan Kampus',
            desc: 'Tanda tangan dosen pendamping dan pimpinan fakultas/kemahasiswaan.',
            icon: ShieldCheck,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        {
            num: 3,
            title: 'Pitch Deck Presentasi',
            desc: 'Slide 10–12 halaman: problem, solusi, validasi, arsitektur, dampak.',
            icon: Layers,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            num: 4,
            title: 'Video Demo & Poster Karya',
            desc: 'Video YouTube maks 3 menit + poster A1/A2 resolusi 300 DPI.',
            icon: Zap,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
        {
            num: 5,
            title: 'Surat Bebas Plagiarisme',
            desc: 'Bermaterai Rp 10.000, ditandatangani ketua tim pengusul.',
            icon: CheckCircle2,
            color: 'text-rose-600',
            bg: 'bg-rose-50',
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
            {flash?.info && (
                <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    {flash.info}
                </div>
            )}
            {(flash?.error || pageErrors?.invitation || pageErrors?.capacity) && (
                <div className="mb-5 flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle className="size-4 shrink-0 text-rose-500" />
                    <span>{flash?.error || pageErrors?.invitation || pageErrors?.capacity}</span>
                </div>
            )}

            {/* ════════════════════════════════════════
                PAGE HEADER
            ════════════════════════════════════════ */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="mb-0.5 text-xs font-medium tracking-wide text-slate-400 uppercase">
                        Kompetisi Mahasiswa
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
                        Dashboard Lomba
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Hub switcher */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-white hover:text-slate-800 hover:shadow-xs"
                        >
                            <FolderGit2 className="size-3.5 text-blue-500" />
                            <span>Proyek</span>
                        </Link>
                        <span className="flex items-center gap-1.5 rounded-lg border border-amber-200/60 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-xs">
                            <Trophy className="size-3.5 text-amber-500" />
                            <span>Lomba</span>
                        </span>
                    </div>

                    <Link
                        href="/competitions"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:-translate-y-px hover:bg-amber-600 hover:shadow-md active:scale-[0.98] active:translate-y-0"
                    >
                        <Plus className="size-3.5 stroke-[2.5]" />
                        <span>Eksplor Lomba</span>
                    </Link>

                    <Link
                        href="/competition-workspace"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:-translate-y-px hover:border-amber-300 hover:text-amber-800 hover:shadow-sm active:scale-[0.98] active:translate-y-0 group"
                    >
                        <span>Workspace</span>
                        <ArrowRight className="size-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-600" />
                    </Link>
                </div>
            </div>

            {/* ════════════════════════════════════════
                SECTION 1 — PRIMARY: FEATURED TEAM + METRICS
            ════════════════════════════════════════ */}
            <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">

                {/* ── LEFT: FEATURED TEAM CARD (8 cols) ── */}
                <div className="lg:col-span-8">
                    {primaryTeam ? (
                        <div className="flex h-full flex-col rounded-[18px] border border-slate-200/80 bg-white p-5 sm:p-6">
                            {/* Top meta row */}
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                                        {primaryTeam.competition?.level || 'Nasional'}
                                    </span>
                                    <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                        {primaryTeam.stage_label}
                                    </span>
                                </div>
                                {primaryTeam.competition?.registration_end && (
                                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                        <Clock className="size-3 text-rose-400" />
                                        Batas {primaryTeam.competition.registration_end}
                                    </span>
                                )}
                            </div>

                            {/* Team identity */}
                            <div className="mb-4">
                                <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                                    {primaryTeam.name}
                                </h2>
                                {primaryTeam.competition?.name && (
                                    <p className="mt-0.5 text-[13px] font-semibold text-amber-700">
                                        {primaryTeam.competition.name}
                                    </p>
                                )}
                                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 line-clamp-2">
                                    {primaryTeam.description ||
                                        'Persiapan berkas administrasi, proposal inovasi, dan repositori karya untuk tahap seleksi penjurian.'}
                                </p>
                            </div>

                            {/* Member avatars */}
                            <div className="mb-5 flex items-center gap-2.5">
                                <div className="flex -space-x-1.5">
                                    {primaryTeam.members && primaryTeam.members.length > 0 ? (
                                        primaryTeam.members.slice(0, 5).map((m: any, idx: number) => (
                                            <div
                                                key={m.id || idx}
                                                title={`${m.name} (${m.role || 'Anggota'})`}
                                                className="size-7 rounded-full border-2 border-white bg-slate-700 flex items-center justify-center text-[9px] font-bold text-white"
                                            >
                                                {getInitials(m.name)}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="size-7 rounded-full border-2 border-white bg-slate-700 flex items-center justify-center text-[9px] font-bold text-white">
                                            {getInitials(user?.name)}
                                        </div>
                                    )}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                    <span>{primaryTeam.members_count || 1} anggota</span>
                                    <span className="mx-1.5 text-slate-300">·</span>
                                    <span>
                                        Peran Anda:{' '}
                                        <strong className="font-semibold text-slate-700">{primaryTeam.role_name}</strong>
                                    </span>
                                    {primaryTeam.is_leader && (
                                        <span className="ml-1.5 rounded-sm border border-emerald-200 bg-emerald-50 px-1.5 py-px text-[9px] font-semibold text-emerald-700">
                                            Ketua
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Stage stepper */}
                            <div className="mb-5 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                                <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                    Tahap Inkubasi
                                </p>
                                <div className="grid grid-cols-5 gap-1.5">
                                    {competitionStages.map((st, sIdx) => {
                                        const isDone = sIdx < currentStageIdx;
                                        const isCurrent = sIdx === currentStageIdx;
                                        return (
                                            <div key={st.key} className="flex flex-col items-center gap-1 text-center">
                                                <div
                                                    className={`h-1 w-full rounded-full transition-all ${
                                                        isDone
                                                            ? 'bg-emerald-400'
                                                            : isCurrent
                                                            ? 'bg-amber-400'
                                                            : 'bg-slate-200'
                                                    }`}
                                                />
                                                <span
                                                    className={`text-[9px] font-semibold leading-tight ${
                                                        isCurrent
                                                            ? 'text-amber-700'
                                                            : isDone
                                                            ? 'text-slate-600'
                                                            : 'text-slate-400'
                                                    }`}
                                                >
                                                    {st.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* CTA row */}
                            <div className="mt-auto flex flex-wrap gap-2 pt-1">
                                <Link
                                    href={primaryTeam.workspace_url}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:-translate-y-px hover:bg-slate-800 hover:shadow-md active:scale-[0.98] active:translate-y-0 group"
                                >
                                    <FolderKanban className="size-3.5" />
                                    <span>Buka Workspace</span>
                                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                                {primaryTeam.competition?.slug && (
                                    <Link
                                        href={`/competitions/${primaryTeam.competition.slug}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:-translate-y-px hover:border-amber-300 hover:text-amber-800 hover:shadow-sm active:scale-[0.98] active:translate-y-0"
                                    >
                                        <span>Panduan Lomba</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Empty state */
                        <div className="flex h-full flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50/40 py-14 text-center">
                            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-500">
                                <Trophy className="size-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">Belum Terdaftar di Tim Kompetisi</h3>
                            <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-400">
                                Bentuk tim inovasi atau bergabung dengan rekan kampus untuk kompetisi nasional seperti
                                GEMASTIK, PKM, LIDM, atau Hackathon industri.
                            </p>
                            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                                <Link
                                    href="/competitions"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-600"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Pilih & Ikuti Kompetisi</span>
                                </Link>
                                <Link
                                    href="/competitions?tab=teams&view=radar"
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-xs transition hover:border-slate-300"
                                >
                                    <Users className="size-3.5 text-slate-400" />
                                    <span>Cari Rekan Kolaborasi</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── RIGHT: METRICS COLUMN (4 cols) ── */}
                <div className="flex flex-col gap-4 lg:col-span-4">

                    {/* Readiness meter */}
                    <div className="rounded-[18px] border border-slate-200/80 bg-white p-5">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Kesiapan Tim
                        </p>

                        {/* Slim horizontal progress bar */}
                        <div className="mb-1.5 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-900">
                                {readinessAvg}
                            </span>
                            <span className="text-sm font-medium text-slate-400">/ 100</span>
                            <span
                                className={`ml-auto rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                                    readinessAvg >= 80
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : readinessAvg >= 50
                                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                                        : 'border-slate-200 bg-slate-100 text-slate-500'
                                }`}
                            >
                                {readinessAvg >= 80 ? 'Siap Submit' : readinessAvg >= 50 ? 'Dalam Proses' : 'Tahap Awal'}
                            </span>
                        </div>

                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                    readinessAvg >= 80
                                        ? 'bg-emerald-400'
                                        : readinessAvg >= 50
                                        ? 'bg-amber-400'
                                        : 'bg-slate-300'
                                }`}
                                style={{ width: `${readinessAvg}%` }}
                            />
                        </div>

                        {/* Sub-metrics */}
                        <div className="mt-3.5 space-y-2 border-t border-slate-100 pt-3.5">
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <span className="size-1.5 rounded-full bg-amber-400 inline-block" />
                                    Proposal & Pengesahan
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {readinessAvg >= 60 ? 'Lengkap' : 'Proses'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <span className="size-1.5 rounded-full bg-blue-400 inline-block" />
                                    Prototype & Karya
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {primaryTeam?.progress_percent ?? 0}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[12px]">
                                <span className="flex items-center gap-1.5 text-slate-500">
                                    <span className="size-1.5 rounded-full bg-emerald-400 inline-block" />
                                    Formasi Anggota
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {primaryTeam?.members_count ?? (myCompetitionTeams.length > 0 ? 1 : 0)} orang
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Undangan rekrutmen */}
                    <div className="flex flex-1 flex-col rounded-[18px] border border-slate-200/80 bg-white p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                Undangan Rekrutmen
                            </p>
                            {pendingInvites.length > 0 && (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                    {pendingInvites.length} baru
                                </span>
                            )}
                        </div>

                        {pendingInvites.length > 0 ? (
                            <div className="space-y-2.5">
                                {pendingInvites.slice(0, 1).map((inv: any) => {
                                    const isSubmitting = respondingInvitationId === inv.id;
                                    return (
                                        <div key={inv.id} className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 text-xs">
                                            <div className="font-semibold text-slate-800 truncate">{inv.team_name}</div>
                                            <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                                                {inv.role_name} · Diundang oleh {inv.inviter_name}
                                            </div>
                                            {inv.competition_name && (
                                                <div className="mt-0.5 text-[11px] text-slate-400 truncate">{inv.competition_name}</div>
                                            )}
                                            <div className="mt-2.5 flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    disabled={isSubmitting}
                                                    onClick={() => handleAcceptInvitation(inv.id)}
                                                    className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-center text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                                >
                                                    {isSubmitting ? '...' : 'Terima'}
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={isSubmitting}
                                                    onClick={() => handleDeclineInvitation(inv.id)}
                                                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-1 flex-col justify-between">
                                <div>
                                    <p className="text-[13px] font-semibold text-slate-700">Profil Terbuka</p>
                                    <p className="mt-0.5 text-[12px] leading-relaxed text-slate-400">
                                        Ketua tim dapat menemukan keahlian Anda untuk posisi Hacker, Hipster, atau Hustler.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto border-t border-slate-100 pt-3">
                            <Link
                                href="/competitions?tab=teams&view=radar"
                                className="flex items-center gap-1 text-[12px] font-semibold text-amber-700 transition hover:underline"
                            >
                                <Sparkles className="size-3 text-amber-500" />
                                <span>Radar Rekrutmen Talenta</span>
                                <ChevronRight className="size-3 ml-auto" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════
                SECTION 2 — OTHER TEAMS (conditional)
            ════════════════════════════════════════ */}
            {myCompetitionTeams.length > 1 && (
                <div className="mb-5 rounded-[18px] border border-slate-200/80 bg-white p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-[15px] font-bold text-slate-900">Tim Kompetisi Lainnya</h2>
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            {myCompetitionTeams.length - 1} Tim
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {myCompetitionTeams.slice(1).map((team: any) => (
                            <div
                                key={team.id}
                                className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/40 p-4 transition hover:border-amber-300 hover:bg-white"
                            >
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between gap-2">
                                        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase text-amber-800">
                                            {team.competition?.level || 'Kompetisi'}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{team.stage_label}</span>
                                    </div>
                                    <h3 className="text-[13px] font-bold text-slate-900 line-clamp-1">{team.name}</h3>
                                    {team.competition?.name && (
                                        <p className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">{team.competition.name}</p>
                                    )}
                                </div>
                                <div className="mt-3 flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-[11px]">
                                    <span className="text-slate-400">{team.members_count || 1} anggota</span>
                                    <Link
                                        href={team.workspace_url}
                                        className="flex items-center gap-0.5 font-semibold text-amber-700 transition hover:underline"
                                    >
                                        <span>Workspace</span>
                                        <ArrowRight className="size-3" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════
                SECTION 3 — TASKS + CHECKLIST  |  CATALOG + ACTIVITY
            ════════════════════════════════════════ */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">

                {/* ── LEFT 8: TASKS + CHECKLIST ── */}
                <div className="space-y-4 lg:col-span-8">

                    {/* Tasks section */}
                    <div className="rounded-[18px] border border-slate-200/80 bg-white p-5 sm:p-6">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3.5">
                            <div>
                                <h2 className="text-[15px] font-bold text-slate-900">
                                    Tugas & Deliverable
                                    {myTasks.length > 0 && (
                                        <span className="ml-2 rounded-full border border-amber-200 bg-amber-50 px-2 py-px text-[10px] font-semibold text-amber-800">
                                            {myTasks.length} aktif
                                        </span>
                                    )}
                                </h2>
                                <p className="mt-0.5 text-[12px] text-slate-400">
                                    Selesaikan sprint tim sebelum batas akhir pengumpulan karya.
                                </p>
                            </div>
                            <Link
                                href="/competition-workspace"
                                className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-amber-700 transition hover:underline"
                            >
                                <span>Workspace</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>

                        {myTasks && myTasks.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {myTasks.slice(0, 6).map((task: any, idx: number) => {
                                    const urgency = getTaskUrgency(task.due_on);
                                    const cfg = urgencyConfig[urgency];
                                    const dueDate = task.due_on ? new Date(task.due_on) : null;

                                    return (
                                        <div
                                            key={task.id || idx}
                                            className="group flex items-center gap-3 py-3 transition"
                                        >
                                            {/* Priority dot */}
                                            <span className={`mt-px size-2 shrink-0 rounded-full ${cfg.dot}`} />

                                            {/* Task info */}
                                            <div className="min-w-0 flex-1">
                                                <span className="block truncate text-[13px] font-semibold text-slate-800 transition group-hover:text-amber-800">
                                                    {task.title}
                                                </span>
                                                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                                                    <span>{task.team?.name || 'Tim Lomba'}</span>
                                                    {dueDate && (
                                                        <>
                                                            <span>·</span>
                                                            <span className={cfg.label}>
                                                                {dueDate.toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                })}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status chip */}
                                            <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ${cfg.badge}`}>
                                                {task.status || 'Aktif'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/40 py-8 text-center">
                                <Clock className="mx-auto mb-2 size-6 text-slate-300" />
                                <p className="text-[13px] font-semibold text-slate-600">Tidak ada tugas aktif</p>
                                <p className="mt-0.5 text-[12px] text-slate-400">
                                    Buka Workspace untuk menambah tugas baru.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Checklist section */}
                    <div className="rounded-[18px] border border-slate-200/80 bg-white p-5 sm:p-6">
                        <div className="mb-4 border-b border-slate-100 pb-3.5">
                            <h2 className="text-[15px] font-bold text-slate-900">
                                Standar Kelengkapan Berkas
                            </h2>
                            <p className="mt-0.5 text-[12px] text-slate-400">
                                5 komponen krusial yang harus disiapkan sebelum batas pengumpulan.
                            </p>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {checklist.map((item) => (
                                <div key={item.num} className="group flex items-start gap-3.5 py-3.5 transition hover:bg-slate-50/40 -mx-1 px-1 rounded-xl">
                                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.color}`}>
                                        <item.icon className="size-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-semibold text-slate-800">{item.title}</p>
                                        <p className="mt-0.5 text-[12px] leading-relaxed text-slate-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 border-t border-slate-100 pt-3.5 flex items-center justify-between">
                            <p className="text-[12px] text-slate-400">Siap mengunggah berkas?</p>
                            <Link
                                href={primaryTeam?.workspace_url || '/competition-workspace'}
                                className="flex items-center gap-1 text-[12px] font-semibold text-amber-700 transition hover:underline"
                            >
                                <span>Buka Workspace Berkas</span>
                                <ArrowRight className="size-3" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT 4: CATALOG + ACTIVITY ── */}
                <div className="space-y-4 lg:col-span-4">

                    {/* Competition catalog */}
                    <div className="rounded-[18px] border border-slate-200/80 bg-white p-5">
                        <div className="mb-3.5 flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-[14px] font-bold text-slate-900">Peluang Kompetisi</h3>
                            <Link
                                href="/competitions"
                                className="text-[11px] font-semibold text-amber-700 transition hover:underline"
                            >
                                Semua ({upcomingCompetitions.length})
                            </Link>
                        </div>

                        {upcomingCompetitions && upcomingCompetitions.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {upcomingCompetitions.slice(0, 5).map((comp: any) => (
                                    <div key={comp.id} className="group py-3">
                                        <div className="mb-0.5 flex items-center justify-between gap-1">
                                            <span className="rounded border border-amber-200/60 bg-amber-50 px-1.5 py-px text-[9px] font-semibold uppercase text-amber-800">
                                                {comp.level || 'Nasional'}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{comp.registration_deadline}</span>
                                        </div>
                                        <p className="text-[13px] font-semibold text-slate-800 line-clamp-1 transition group-hover:text-amber-800">
                                            {comp.name}
                                        </p>
                                        <div className="mt-1 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-400 truncate max-w-[130px]">
                                                {comp.prize_pool || comp.organizer || 'Sertifikat'}
                                            </span>
                                            <Link
                                                href={`/competitions/${comp.slug}`}
                                                className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-amber-700 transition hover:underline"
                                            >
                                                <span>Detail</span>
                                                <ChevronRight className="size-3" />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-5 text-center text-[12px] text-slate-400">Belum ada kompetisi aktif.</p>
                        )}

                        <div className="mt-2 border-t border-slate-100 pt-3">
                            <Link
                                href="/competitions"
                                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                            >
                                <Trophy className="size-3.5 text-amber-500" />
                                <span>Lihat Semua Kompetisi</span>
                            </Link>
                        </div>
                    </div>

                    {/* Activity feed */}
                    {recentActivities && recentActivities.length > 0 && (
                        <div className="rounded-[18px] border border-slate-200/80 bg-white p-5">
                            <div className="mb-3 flex items-center gap-1.5">
                                <Activity className="size-3.5 text-slate-400" />
                                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                    Aktivitas Terkini
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {recentActivities.slice(0, 5).map((act: any) => (
                                    <div key={act.id} className="flex items-start gap-2.5 text-[12px]">
                                        <div className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-300" />
                                        <div className="min-w-0 flex-1">
                                            <p className="leading-relaxed text-slate-600 line-clamp-2">
                                                <strong className="font-semibold text-slate-800">
                                                    {act.actor?.name || 'Anggota'}
                                                </strong>{' '}
                                                {act.description || act.action}
                                            </p>
                                            <span className="text-[10px] text-slate-400">
                                                {act.created_at
                                                    ? new Date(act.created_at).toLocaleDateString('id-ID', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                      })
                                                    : 'Baru saja'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Featured upcoming deadline card */}
                    {featuredCompetition && (
                        <div className="rounded-[18px] border border-slate-200/80 bg-white p-5">
                            <div className="mb-3 flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-amber-500" />
                                <h3 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                    Deadline Terdekat
                                </h3>
                            </div>

                            <div className="flex items-start gap-1.5 mb-1">
                                <span className="rounded border border-amber-200/60 bg-amber-50 px-1.5 py-px text-[9px] font-semibold uppercase text-amber-800">
                                    {featuredCompetition.level || 'Nasional'}
                                </span>
                                <span className="text-[10px] text-slate-400">{featuredCompetition.organizer || ''}</span>
                            </div>

                            <h4 className="text-[13px] font-bold text-slate-900 line-clamp-2 mb-2">
                                {featuredCompetition.name}
                            </h4>

                            <div className="flex items-center gap-1.5 mb-3">
                                <Clock className="size-3 text-rose-400 shrink-0" />
                                <span className="text-[11px] font-semibold text-rose-600">
                                    Batas: {featuredCompetition.registration_deadline}
                                </span>
                            </div>

                            <Link
                                href={`/competitions/${featuredCompetition.slug}`}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-[12px] font-semibold text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                            >
                                <span>Lihat Detail</span>
                                <ArrowRight className="size-3" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
