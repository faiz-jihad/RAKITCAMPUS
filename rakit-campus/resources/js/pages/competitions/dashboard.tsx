import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    ExternalLink,
    FileCheck,
    FileText,
    FolderGit2,
    FolderKanban,
    Inbox,
    Layers,
    Plus,
    ShieldCheck,
    Sparkles,
    Target,
    Trophy,
    UserCheck,
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

    const readinessAvg = Math.min(100, Math.max(0, stats?.team_readiness_avg ?? 0));
    const pendingInvites = receivedInvitations.filter((i: any) => i.status === 'pending');
    const primaryTeam = myCompetitionTeams && myCompetitionTeams.length > 0 ? myCompetitionTeams[0] : null;
    const featuredCompetition = upcomingCompetitions && upcomingCompetitions.length > 0 ? upcomingCompetitions[0] : null;

    // Helper for team initials avatar
    const getInitials = (name?: string) => {
        if (!name) return 'RC';
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0].toUpperCase())
            .join('');
    };

    // Stage progression definitions (Real Competition Flow)
    const competitionStages = [
        { key: 'recruiting', label: 'Formasi Tim', desc: 'Kelengkapan kuota anggota' },
        { key: 'preparing', label: 'Draf Proposal', desc: 'Penyusunan berkas karya' },
        { key: 'review', label: 'Validasi Pembimbing', desc: 'ACC dosen pendamping' },
        { key: 'submitted', label: 'Submit Berkas', desc: 'Pengunggahan karya resmi' },
        { key: 'finalist', label: 'Babak Final', desc: 'Presentasi & penjurian' },
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

    return (
        <AppLayout activeTab="lomba" title="Dashboard Kompetisi & Lomba - RakitCampus">
            <Head title="Dashboard Kompetisi & Lomba" />

            {/* 1. HEADER ROW */}
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-200/80 mb-5 sm:mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Dashboard Kompetisi Mahasiswa
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
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-amber-800 shadow-2xs flex items-center gap-1.5 border border-amber-200/60">
                            <Trophy className="size-3.5 text-amber-500" />
                            <span>Dashboard Lomba</span>
                        </span>
                    </div>

                    <Link
                        href="/competitions"
                        className="justify-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all duration-200 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Eksplor Lomba</span>
                    </Link>

                    <Link
                        href="/competition-workspace"
                        className="justify-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 hover:border-amber-300 hover:text-amber-800 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-all duration-200 cursor-pointer group"
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

            {/* 2. HERO BENTO GRID (MATCHING HIGH-IMPACT DESIGN STANDARD) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mb-6 sm:mb-8 items-stretch">
                {/* CARD 1 (LEFT 4 COLS): KESIAPAN BERKAS & KARYA LOMBA (TALL DONUT GAUGE) */}
                <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group/card">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Kesiapan Tim Lomba
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                readinessAvg >= 80
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : readinessAvg >= 50
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                                {readinessAvg >= 80 ? 'Siap Submit' : readinessAvg >= 50 ? 'Penyusunan Berkas' : 'Tahap Awal'}
                            </span>
                        </div>

                        {/* Circular Donut Gauge */}
                        <div className="flex flex-col items-center justify-center my-3 sm:my-4">
                            <div className="relative size-36 sm:size-40 flex items-center justify-center">
                                <svg className="size-full -rotate-90 transform" viewBox="0 0 120 120">
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="46"
                                        stroke="currentColor"
                                        strokeWidth="9"
                                        className="text-slate-100"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="60"
                                        cy="60"
                                        r="46"
                                        stroke="currentColor"
                                        strokeWidth="9"
                                        strokeDasharray={2 * Math.PI * 46}
                                        strokeDashoffset={2 * Math.PI * 46 * (1 - readinessAvg / 100)}
                                        strokeLinecap="round"
                                        className="text-amber-500 transition-all duration-700 ease-out"
                                        fill="transparent"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                        {readinessAvg}%
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                        SKOR BERKAS
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 3 Preparation Pillars Breakdown */}
                        <div className="space-y-2.5 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                                    <FileText className="size-3.5 text-amber-500" />
                                    <span>Proposal & Pengesahan</span>
                                </span>
                                <span className="font-bold text-slate-900">
                                    {readinessAvg >= 60 ? 'Lengkap' : 'Dalam Proses'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                                    <Layers className="size-3.5 text-blue-500" />
                                    <span>Prototype & Karya</span>
                                </span>
                                <span className="font-bold text-slate-900">
                                    {primaryTeam?.progress_percent ?? 0}% Selesai
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                                    <Users className="size-3.5 text-emerald-500" />
                                    <span>Formasi Anggota Tim</span>
                                </span>
                                <span className="font-bold text-slate-900">
                                    {primaryTeam?.members_count ?? (myCompetitionTeams.length > 0 ? 1 : 0)} Anggota
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-100">
                        <Link
                            href={primaryTeam?.workspace_url || '/competition-workspace'}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all duration-200 group cursor-pointer"
                        >
                            <span>Buka Workspace Lomba</span>
                            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* RIGHT 8 COLS: HERO SPOTLIGHT + 2 BOTTOM BENTO CARDS */}
                <div className="lg:col-span-8 flex flex-col justify-between gap-4 sm:gap-5">
                    {/* CARD 2: TIM KOMPETISI UTAMA (SPOTLIGHT HERO) */}
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex-1 flex flex-col justify-between group/card">
                        {primaryTeam ? (
                            <div>
                                {/* Header Row */}
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                            Kompetisi {primaryTeam.competition?.level || 'Nasional'}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                                            {primaryTeam.stage_label}
                                        </span>
                                    </div>
                                    {primaryTeam.competition?.registration_end && (
                                        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                            <Clock className="size-3 text-slate-400" />
                                            <span>Batas: {primaryTeam.competition.registration_end}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Team & Competition Name */}
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-5">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                                                {primaryTeam.name}
                                            </h3>
                                            <span className="text-xs text-slate-500 font-semibold">
                                                · {primaryTeam.members_count || 1} Anggota
                                            </span>
                                        </div>

                                        {primaryTeam.competition?.name && (
                                            <p className="text-xs sm:text-[13px] font-bold text-amber-800 line-clamp-1 mb-1">
                                                {primaryTeam.competition.name}
                                            </p>
                                        )}

                                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                            {primaryTeam.description ||
                                                'Persiapan berkas administrasi, proposal inovasi, dan repositori karya untuk tahap seleksi penjurian.'}
                                        </p>

                                        {/* Member Avatars Row */}
                                        <div className="mt-3.5 flex items-center gap-2">
                                            <div className="flex -space-x-2 overflow-hidden">
                                                {primaryTeam.members && primaryTeam.members.length > 0 ? (
                                                    primaryTeam.members.slice(0, 4).map((m: any, idx: number) => (
                                                        <div
                                                            key={m.id || idx}
                                                            title={`${m.name} (${m.role || 'Anggota'})`}
                                                            className="size-7 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-2xs"
                                                        >
                                                            {getInitials(m.name)}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="size-7 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-2xs">
                                                        {getInitials(user?.name)}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-slate-500 font-medium">
                                                Peran Anda: <strong className="text-slate-800">{primaryTeam.role_name}</strong>
                                                {primaryTeam.is_leader && (
                                                    <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Ketua Tim
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 5-Stage Visual Stepper Timeline */}
                                <div className="mt-5 pt-4 border-t border-slate-100">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                                        Tahapan Inkubasi Kompetisi
                                    </div>
                                    <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                                        {competitionStages.map((st, sIdx) => {
                                            const isDone = sIdx < currentStageIdx;
                                            const isCurrent = sIdx === currentStageIdx;
                                            return (
                                                <div key={st.key} className="flex flex-col items-center text-center">
                                                    <div
                                                        className={`w-full h-1.5 rounded-full mb-1.5 transition-all ${
                                                            isDone
                                                                ? 'bg-emerald-500'
                                                                : isCurrent
                                                                ? 'bg-amber-500'
                                                                : 'bg-slate-100'
                                                        }`}
                                                    />
                                                    <span
                                                        className={`text-[10px] font-bold truncate max-w-full ${
                                                            isCurrent
                                                                ? 'text-amber-800'
                                                                : isDone
                                                                ? 'text-slate-800'
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

                                {/* Action Buttons */}
                                <div className="mt-4 pt-3 flex flex-wrap items-center gap-2 sm:gap-2.5">
                                    <Link
                                        href={primaryTeam.workspace_url}
                                        className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white text-xs font-bold transition-all duration-200 shadow-xs cursor-pointer group"
                                    >
                                        <FolderKanban className="size-3.5" />
                                        <span>Buka Workspace Lomba</span>
                                        <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                                    </Link>

                                    {primaryTeam.competition?.slug && (
                                        <Link
                                            href={`/competitions/${primaryTeam.competition.slug}`}
                                            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-xs font-semibold shadow-2xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer group"
                                        >
                                            <span>Panduan Lomba</span>
                                            <ArrowRight className="size-3 text-slate-400 group-hover:text-amber-600 transition-transform duration-200 group-hover:translate-x-0.5" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Empty State: Belum memiliki tim */
                            <div className="py-6 sm:py-8 flex flex-col items-center justify-center text-center">
                                <div className="size-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mb-3">
                                    <Trophy className="size-6" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                    Belum Terdaftar di Tim Kompetisi
                                </h3>
                                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                                    Bentuk tim inovasi atau bergabung dengan rekan kampus untuk mengikuti kompetisi nasional
                                    seperti GEMASTIK, PKM, LIDM, atau Hackathon industri.
                                </p>
                                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                    <Link
                                        href="/competitions"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Pilih & Ikuti Kompetisi</span>
                                    </Link>
                                    <Link
                                        href="/competitions?tab=teams&view=radar"
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition"
                                    >
                                        <Users className="size-3.5 text-slate-400" />
                                        <span>Cari Rekan Kolaborasi</span>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* BOTTOM ROW: 2 EQUAL BENTO CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        {/* CARD 3: TAWARAN UNDANGAN REKRUTMEN */}
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group/card">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Undangan Rekrutmen
                                    </span>
                                    {pendingInvites.length > 0 ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                            {pendingInvites.length} Menunggu
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium text-slate-400">
                                            Status Bersih
                                        </span>
                                    )}
                                </div>

                                {pendingInvites.length > 0 ? (
                                    <div className="space-y-2.5">
                                        {pendingInvites.slice(0, 1).map((inv: any) => {
                                            const isSubmitting = respondingInvitationId === inv.id;
                                            return (
                                                <div
                                                    key={inv.id}
                                                    className="p-3 rounded-xl bg-amber-50/30 border border-amber-200/80 text-xs space-y-2"
                                                >
                                                    <div>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-slate-900 truncate">
                                                                Tim: {inv.team_name}
                                                            </span>
                                                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                                                                {inv.role_name}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                            Diundang oleh {inv.inviter_name}
                                                            {inv.competition_name ? ` (${inv.competition_name})` : ''}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 pt-1">
                                                        <Link
                                                            href={inv.workspace_url}
                                                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition"
                                                        >
                                                            Workspace
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            disabled={isSubmitting}
                                                            onClick={() => handleAcceptInvitation(inv.id)}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-2xs disabled:opacity-50"
                                                        >
                                                            {isSubmitting ? '...' : 'Terima'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={isSubmitting}
                                                            onClick={() => handleDeclineInvitation(inv.id)}
                                                            className="px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-500 text-[11px] font-medium transition"
                                                        >
                                                            Tolak
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-2.5">
                                        <p className="text-xs text-slate-600 font-semibold">
                                            Profil Terbuka untuk Rekrutmen
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                            Ketua tim kompetisi lain dapat melihat keahlian Anda untuk posisi Hacker,
                                            Hipster, atau Hustler.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-[11px] text-slate-400">Matchmaking Talenta</span>
                                <Link
                                    href="/competitions?tab=teams&view=radar"
                                    className="font-bold text-amber-800 hover:underline flex items-center gap-1"
                                >
                                    <span>Buka Radar Rekrutmen</span>
                                    <ChevronRight className="size-3" />
                                </Link>
                            </div>
                        </div>

                        {/* CARD 4: KOMPETISI UNGGULAN & DEADLINE */}
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group/card">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Peluang Kompetisi Terdekat
                                    </span>
                                    <Calendar className="size-3.5 text-amber-500" />
                                </div>

                                {featuredCompetition ? (
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded border border-amber-200">
                                                {featuredCompetition.level || 'Nasional'}
                                            </span>
                                            <span className="text-[10px] font-medium text-slate-500 truncate">
                                                {featuredCompetition.organizer || 'Puspresnas'}
                                            </span>
                                        </div>

                                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover/card:text-amber-800 transition line-clamp-1">
                                            {featuredCompetition.name}
                                        </h4>

                                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
                                            <Clock className="size-3 text-rose-500" />
                                            <span>Batas: {featuredCompetition.registration_deadline}</span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="py-2.5 text-xs text-slate-400">
                                        Belum ada jadwal kompetisi baru.
                                    </div>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[130px]">
                                    {featuredCompetition?.prize_pool || 'Sertifikat Resmi'}
                                </span>
                                <Link
                                    href={featuredCompetition ? `/competitions/${featuredCompetition.slug}` : '/competitions'}
                                    className="font-bold text-amber-800 hover:underline flex items-center gap-1"
                                >
                                    <span>Lihat Detail</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. TIM KOMPETISI LAINNYA (JIKA LEBIH DARI 1 TIM) */}
            {myCompetitionTeams.length > 1 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs mb-6 sm:mb-8">
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                            <Trophy className="size-4 text-amber-500" />
                            <span>Daftar Tim Kompetisi Anda Lainnya</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {myCompetitionTeams.length - 1} Tim
                            </span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {myCompetitionTeams.slice(1).map((team: any) => (
                            <div
                                key={team.id}
                                className="p-4 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-xs transition bg-slate-50/30 flex flex-col justify-between gap-3"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                            {team.competition?.level || 'Kompetisi'}
                                        </span>
                                        <span className="text-[10px] font-semibold text-slate-500">
                                            {team.stage_label}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{team.name}</h3>
                                    {team.competition?.name && (
                                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                            {team.competition.name}
                                        </p>
                                    )}
                                </div>

                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                    <span className="text-[11px] text-slate-400">
                                        {team.members_count || 1} Anggota
                                    </span>
                                    <Link
                                        href={team.workspace_url}
                                        className="font-bold text-amber-800 hover:underline flex items-center gap-1"
                                    >
                                        <span>Buka Workspace</span>
                                        <ArrowRight className="size-3" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. LOWER SECTION: TUGAS SPRINT & CHECKLIST BERKAS LOMBA (8 COLS) + KATALOG & LOG (4 COLS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                {/* LEFT COLUMN: TUGAS & CHECKLIST STANDAR BERKAS */}
                <div className="lg:col-span-8 space-y-5 sm:space-y-6">
                    {/* SECTION: TUGAS & DELIVERABLE PRIORITAS */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                            <div>
                                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-slate-500" />
                                    <span>Tugas & Deliverable Persiapan Lomba</span>
                                    {myTasks.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                            {myTasks.length} Aktif
                                        </span>
                                    )}
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Selesaikan tugas sprint tim sebelum batas waktu pengunggahan karya resmi.
                                </p>
                            </div>

                            <Link
                                href="/competition-workspace"
                                className="text-xs font-semibold text-amber-800 hover:underline transition flex items-center gap-1"
                            >
                                <span>Workspace</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {myTasks && myTasks.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {myTasks.slice(0, 5).map((task: any, idx: number) => {
                                    const dueDate = task.due_on ? new Date(task.due_on) : null;
                                    const isUrgent = dueDate && dueDate < new Date(Date.now() + 3 * 86400000);

                                    return (
                                        <div
                                            key={task.id || idx}
                                            className="py-3 flex items-center justify-between gap-3 group"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="text-xs font-semibold text-slate-900 group-hover:text-amber-800 transition block truncate">
                                                    {task.title}
                                                </span>
                                                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                                                    <span>{task.team?.name || 'Tim Lomba'}</span>
                                                    {dueDate && (
                                                        <>
                                                            <span>•</span>
                                                            <span
                                                                className={
                                                                    isUrgent
                                                                        ? 'text-rose-600 font-bold'
                                                                        : 'text-slate-500'
                                                                }
                                                            >
                                                                Tenggat:{' '}
                                                                {dueDate.toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                })}
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
                            <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <Clock className="size-6 text-slate-300 mx-auto mb-1.5" />
                                <p className="font-semibold text-slate-700">Tidak ada tugas aktif yang tertunda</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Buka Workspace untuk menambah tugas baru bagi anggota tim Anda.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* SECTION: STANDAR KELENGKAPAN BERKAS LOMBA KAMPUS (AUTHENTIC COMPETITION CHECKLIST) */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs">
                        <div className="pb-3.5 border-b border-slate-100 mb-4">
                            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="size-4 text-emerald-600" />
                                <span>Standar Kelengkapan Berkas Kompetisi Nasional</span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Pastikan 5 komponen krusial berikut telah disiapkan sebelum batas akhir pengumpulan:
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-amber-300 transition">
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-lg bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0 border border-amber-200/80">
                                        1
                                    </div>
                                    <div className="min-w-0 flex-1 text-xs">
                                        <h4 className="font-bold text-slate-900">Proposal Inovasi / Abstrak Penelitian</h4>
                                        <p className="text-slate-500 mt-0.5 leading-relaxed">
                                            Format baku PDF (15-20 halaman) mencakup Latar Belakang Masalah, Solusi Inovatif, Metodologi Rekayasa, dan Analisis Manfaat.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-amber-300 transition">
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200/80">
                                        2
                                    </div>
                                    <div className="min-w-0 flex-1 text-xs">
                                        <h4 className="font-bold text-slate-900">Surat Rekomendasi & Lembar Pengesahan Kampus</h4>
                                        <p className="text-slate-500 mt-0.5 leading-relaxed">
                                            Ditandatangani oleh Dosen Pendamping dan Pimpinan Fakultas/Kemahasiswaan dengan cap stempel basah atau tanda tangan digital resmi.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-amber-300 transition">
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200/80">
                                        3
                                    </div>
                                    <div className="min-w-0 flex-1 text-xs">
                                        <h4 className="font-bold text-slate-900">Pitch Deck / Paparan Presentasi</h4>
                                        <p className="text-slate-500 mt-0.5 leading-relaxed">
                                            Slide 10-12 halaman dengan struktur problem, solusi, validasi pengguna, arsitektur teknis, dan proyeksi dampak.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-amber-300 transition">
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-lg bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 border border-purple-200/80">
                                        4
                                    </div>
                                    <div className="min-w-0 flex-1 text-xs">
                                        <h4 className="font-bold text-slate-900">Video Demonstrasi & Poster Publikasi</h4>
                                        <p className="text-slate-500 mt-0.5 leading-relaxed">
                                            Video demo YouTube durasi maksimal 3 menit yang memperlihatkan prototipe aktif, serta poster karya ukuran A1/A2 resolusi 300 DPI.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-amber-300 transition">
                                <div className="flex items-start gap-3">
                                    <div className="size-8 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0 border border-rose-200/80">
                                        5
                                    </div>
                                    <div className="min-w-0 flex-1 text-xs">
                                        <h4 className="font-bold text-slate-900">Surat Pernyataan Bebas Plagiarisme</h4>
                                        <p className="text-slate-500 mt-0.5 leading-relaxed">
                                            Surat pernyataan orisinalitas karya bermaterai Rp 10.000 yang ditandatangani ketua tim pengusul.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Ingin mengunggah berkas sekarang?</span>
                            <Link
                                href={primaryTeam?.workspace_url || '/competition-workspace'}
                                className="font-bold text-amber-800 hover:underline flex items-center gap-1"
                            >
                                <span>Buka Workspace Berkas</span>
                                <ArrowRight className="size-3" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: KATALOG KOMPETISI & AKTIVITAS TIM */}
                <div className="lg:col-span-4 space-y-5 sm:space-y-6">
                    {/* CARD: KATALOG KOMPETISI MENDATANG */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Trophy className="size-4 text-amber-500" />
                                <span>Peluang Kompetisi Baru</span>
                            </h3>
                            <Link
                                href="/competitions"
                                className="text-xs font-semibold text-amber-800 hover:underline"
                            >
                                Semua ({upcomingCompetitions.length})
                            </Link>
                        </div>

                        {upcomingCompetitions && upcomingCompetitions.length > 0 ? (
                            <div className="space-y-2.5">
                                {upcomingCompetitions.slice(0, 4).map((comp: any) => (
                                    <div
                                        key={comp.id}
                                        className="p-3 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 transition flex flex-col justify-between gap-2 group/card"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-1 mb-1">
                                                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded border border-amber-200">
                                                    {comp.level || 'Nasional'}
                                                </span>
                                                <span className="text-[10px] font-medium text-slate-400">
                                                    {comp.registration_deadline}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-slate-900 group-hover/card:text-amber-800 transition line-clamp-1">
                                                {comp.name}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 line-clamp-1">
                                                {comp.organizer || 'Official'}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                            <span className="text-slate-400 font-medium truncate max-w-[120px]">
                                                {comp.prize_pool || 'Sertifikat'}
                                            </span>
                                            <Link
                                                href={`/competitions/${comp.slug}`}
                                                className="font-bold text-amber-800 hover:underline flex items-center gap-0.5 shrink-0"
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

                    {/* CARD: AKTIVITAS TIM TERKINI */}
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
                                                <strong className="text-slate-800">{act.actor?.name || 'Anggota'}</strong>{' '}
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
                </div>
            </div>
        </AppLayout>
    );
}
