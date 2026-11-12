import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    Briefcase,
    Check,
    CheckCircle2,
    Clock,
    FolderKanban,
    GraduationCap,
    Inbox,
    Plus,
    ShieldCheck,
    UserCheck,
    Users,
    X,
    XCircle,
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
        pending_invitations_count?: number;
        pending_team_approvals_count?: number;
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
    receivedInvitations?: any[];
    recentActivities?: any[];
    profileCompletion?: { percent: number; missing: string[] };
    taughtClasses?: any[];
    guidedProjects?: any[];
    pendingTeamApprovals?: any[];
    teamApprovalHistory?: any[];
}

export default function Dashboard({
    user = {} as any,
    stats = {} as any,
    myTeams = [],
    myTasks = [],
    teammates = [],
    monthlyActivity = [],
    recommendedProjects = [],
    receivedInvitations = [],
    recentActivities = [],
    profileCompletion,
    taughtClasses = [],
    guidedProjects = [],
    pendingTeamApprovals = [],
    teamApprovalHistory = [],
}: Props) {
    const { flash, errors: pageErrors } = usePage().props as any;
    const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
    const [approvalTab, setApprovalTab] = useState<'pending' | 'history'>('pending');
    const [processingProjectId, setProcessingProjectId] = useState<number | null>(null);
    const [rejectModalProject, setRejectModalProject] = useState<any | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processingInviteId, setProcessingInviteId] = useState<number | null>(null);
    const [declineModalInvite, setDeclineModalInvite] = useState<any | null>(null);
    const [declineReason, setDeclineReason] = useState('');

    const isLecturer = Boolean(user?.is_lecturer);

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

    const getFormationBadgeStyle = (formationStatus?: string) => {
        switch (formationStatus) {
            case 'formation_review':
                return {
                    label: 'Menunggu Persetujuan Dosen',
                    className: 'bg-amber-50 text-amber-800 border-amber-200',
                };
            case 'lecturer_approved':
                return {
                    label: 'Disetujui Dosen',
                    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                };
            case 'workspace_activated':
                return {
                    label: 'Workspace Aktif',
                    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                };
            case 'team_locked':
                return {
                    label: 'Formasi Terkunci',
                    className: 'bg-blue-50 text-blue-700 border-blue-200',
                };
            case 'formation_rejected':
                return {
                    label: 'Ditolak',
                    className: 'bg-rose-50 text-rose-700 border-rose-200',
                };
            case 'matchmaking_open':
                return {
                    label: 'Matchmaking Terbuka',
                    className: 'bg-blue-50 text-blue-700 border-blue-200',
                };
            default:
                return {
                    label: 'Tahap Pembentukan',
                    className: 'bg-slate-100 text-slate-600 border-slate-200',
                };
        }
    };

    const handleApproveTeam = (item: any) => {
        if (!confirm(`Setujui pengajuan tim "${item.team_name}" untuk proyek "${item.title}"?`)) return;
        setProcessingProjectId(item.id);
        router.post(
            `/projects/${item.id}/formation/review`,
            {
                action: 'approve',
                notes: 'Susunan tim disetujui dosen melalui Dashboard Dosen.',
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessingProjectId(null),
            }
        );
    };

    const handleRejectTeamSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectModalProject || !rejectReason.trim()) return;
        setProcessingProjectId(rejectModalProject.id);
        router.post(
            `/projects/${rejectModalProject.id}/formation/review`,
            {
                action: 'reject',
                reason: rejectReason.trim(),
                notes: rejectReason.trim(),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRejectModalProject(null);
                    setRejectReason('');
                },
                onFinish: () => setProcessingProjectId(null),
            }
        );
    };

    const handleAcceptInvitation = (inv: any) => {
        if (!confirm(`Terima undangan kolaborasi dari tim "${inv.team_name}" (${inv.project_title})?`)) return;
        setProcessingInviteId(inv.id);
        router.post(
            `/invitations/${inv.id}/accept`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessingInviteId(null),
            }
        );
    };

    const handleDeclineInvitationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!declineModalInvite) return;
        setProcessingInviteId(declineModalInvite.id);
        router.post(
            `/invitations/${declineModalInvite.id}/decline`,
            { declined_reason: declineReason.trim() || 'Memilih opsi kolaborasi lain.' },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDeclineModalInvite(null);
                    setDeclineReason('');
                },
                onFinish: () => setProcessingInviteId(null),
            }
        );
    };

    if (isLecturer) {
        const displayedApprovals = approvalTab === 'pending' ? pendingTeamApprovals : teamApprovalHistory;

        return (
            <AppLayout activeTab="dashboard" title="Dashboard Dosen — RakitCampus">
                {/* 1. HEADER ROW */}
                <section className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200/80 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Dashboard Dosen
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Kelola kelas perkuliahan, persetujuan pengajuan tim, dan progres proyek bimbingan.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/classes"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                        >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span>Kelola Kelas</span>
                        </Link>
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold shadow-2xs transition"
                        >
                            <span>Proyek Bimbingan</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                    </div>
                </section>

                {/* FLASH & ERROR BANNERS */}
                {flash?.success && (
                    <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
                        {flash.success}
                    </div>
                )}
                {flash?.info && (
                    <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800">
                        {flash.info}
                    </div>
                )}
                {(flash?.error || pageErrors?.auth || pageErrors?.reason || pageErrors?.notes) && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                        {flash?.error || pageErrors?.auth || pageErrors?.reason || pageErrors?.notes}
                    </div>
                )}

                {/* 2. LECTURER SUMMARY CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Persetujuan Tim
                                </span>
                                <ShieldCheck className="w-4 h-4 text-amber-600" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {pendingTeamApprovals.length}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Menunggu Keputusan
                                </span>
                            </div>
                        </div>
                        <a
                            href="#persetujuan-tim"
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition flex items-center justify-between"
                        >
                            <span>Proses pengajuan tim</span>
                            <ArrowUpRight className="w-3 h-3" />
                        </a>
                    </div>

                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Kelas Diampu
                                </span>
                                <GraduationCap className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {stats?.taught_classes_count ?? taughtClasses.length}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    {stats?.total_students_count ?? 0} Mahasiswa
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/classes"
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition flex items-center justify-between"
                        >
                            <span>Buka daftar kelas</span>
                            <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Proyek Bimbingan
                                </span>
                                <FolderKanban className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {stats?.total_guided_projects_count ?? guidedProjects.length}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Proyek Terdaftar
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/projects"
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition flex items-center justify-between"
                        >
                            <span>Lihat semua proyek</span>
                            <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Tugas Tim Selesai
                                </span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-slate-900 tracking-tight">
                                    {completedTasks}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Item Terverifikasi
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/workspace"
                            className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition flex items-center justify-between"
                        >
                            <span>Pantau workspace tim</span>
                            <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>

                {/* 3. LECTURER MAIN CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8 space-y-6">
                        {/* PANEL PERSETUJUAN PENGAJUAN TIM */}
                        <div id="persetujuan-tim" className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                                        <span>Persetujuan Pengajuan Tim</span>
                                        {pendingTeamApprovals.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                                {pendingTeamApprovals.length} Baru
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Tinjau komposisi tim yang diajukan mahasiswa pada kelas yang Anda ampu sebelum Workspace diaktifkan.
                                    </p>
                                </div>

                                <div className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold self-start">
                                    <button
                                        type="button"
                                        onClick={() => setApprovalTab('pending')}
                                        className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                                            approvalTab === 'pending'
                                                ? 'bg-white text-slate-900 shadow-2xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Menunggu ({pendingTeamApprovals.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setApprovalTab('history')}
                                        className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                                            approvalTab === 'history'
                                                ? 'bg-white text-slate-900 shadow-2xs'
                                                : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Riwayat ({teamApprovalHistory.length})
                                    </button>
                                </div>
                            </div>

                            {displayedApprovals.length > 0 ? (
                                <div className="space-y-4">
                                    {displayedApprovals.map((item: any) => {
                                        const badge = getFormationBadgeStyle(item.formation_status);
                                        const isPending = item.formation_status === 'formation_review';
                                        const isBusy = processingProjectId === item.id;

                                        return (
                                            <div
                                                key={item.id}
                                                className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 space-y-3"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            {item.class_code && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900 text-white">
                                                                    {item.class_code}
                                                                </span>
                                                            )}
                                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.className}`}>
                                                                {item.formation_status_label || badge.label}
                                                            </span>
                                                            {item.submitted_at && (
                                                                <span className="text-[11px] text-slate-400">
                                                                    Diperbarui {item.submitted_at}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-sm font-bold text-slate-900">
                                                            {item.team_name} — <span className="text-blue-700">{item.title}</span>
                                                        </h3>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Ketua Tim: <strong className="text-slate-700">{item.leader_name || 'Mahasiswa'}</strong>
                                                            {' • '}
                                                            Anggota: <strong className="text-slate-700">{item.members_count} / {item.max_team_size}</strong> (min. {item.min_team_size})
                                                            {item.class_name && ` • ${item.class_name}`}
                                                        </p>
                                                    </div>

                                                    <Link
                                                        href={`/projects/${item.slug || item.id}?tab=formation`}
                                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 shrink-0 inline-flex items-center gap-1"
                                                    >
                                                        <span>Detail Tim</span>
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                </div>

                                                {/* Member Roster Chips */}
                                                {item.members && item.members.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {item.members.map((m: any) => (
                                                            <span
                                                                key={m.id || m.user_id}
                                                                className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700"
                                                            >
                                                                <span className="font-semibold text-slate-900">{m.name}</span>
                                                                <span className="text-slate-400">•</span>
                                                                <span className="text-blue-700 font-medium">{m.role_name}</span>
                                                                {m.is_leader && (
                                                                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-50 text-blue-700">
                                                                        Ketua
                                                                    </span>
                                                                )}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {item.formation_notes && (
                                                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-600">
                                                        <span className="font-semibold text-slate-800">Catatan Keputusan: </span>
                                                        <span>{item.formation_notes}</span>
                                                    </div>
                                                )}

                                                {isPending && (
                                                    <div className="pt-2 border-t border-slate-200/70 flex flex-wrap items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setRejectModalProject(item);
                                                                setRejectReason('');
                                                            }}
                                                            disabled={isBusy}
                                                            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            <span>Tolak</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApproveTeam(item)}
                                                            disabled={isBusy}
                                                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>{isBusy ? 'Memproses...' : 'Terima Pengajuan Tim'}</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-xs text-slate-400">
                                    <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="font-semibold text-slate-700">
                                        {approvalTab === 'pending'
                                            ? 'Belum ada pengajuan tim yang menunggu persetujuan'
                                            : 'Belum ada riwayat keputusan persetujuan tim'}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Pengajuan formasi tim mahasiswa pada kelas Anda akan otomatis tampil di sini.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* KELAS YANG DIAMPU */}
                        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Kelas Kuliah Diampu
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Daftar kelas dan kode gabung untuk mahasiswa
                                    </p>
                                </div>
                                <Link
                                    href="/classes"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                >
                                    Kelola Semua →
                                </Link>
                            </div>

                            {taughtClasses.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {taughtClasses.map((cls: any) => (
                                        <Link
                                            key={cls.id}
                                            href={`/classes/${cls.code || cls.id}`}
                                            className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-400 bg-slate-50/50 transition flex flex-col justify-between gap-2.5 group"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                                        {cls.code}
                                                    </span>
                                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200/70 text-slate-700">
                                                        Kode: {cls.join_code}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                                    {cls.name}
                                                </h3>
                                            </div>
                                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                                                <span>{cls.students_count} Mahasiswa • {cls.projects_count} Proyek</span>
                                                <span className="font-bold text-blue-600">Buka Kelas →</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center text-xs text-slate-400">
                                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                    <p className="font-semibold text-slate-700">Belum ada kelas perkuliahan</p>
                                    <Link href="/classes" className="text-blue-600 font-semibold hover:underline mt-1 inline-block">
                                        Buat kelas baru →
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* PROYEK BIMBINGAN TERBARU */}
                        {guidedProjects.length > 0 && (
                            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                                    <div>
                                        <h2 className="text-sm font-bold text-slate-900">
                                            Proyek Bimbingan Terbaru
                                        </h2>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Status formasi tim dan progres implementasi mahasiswa
                                        </p>
                                    </div>
                                    <Link
                                        href="/projects"
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                    >
                                        Semua Proyek →
                                    </Link>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                    {guidedProjects.map((proj: any) => {
                                        const badge = getFormationBadgeStyle(proj.formation_status);
                                        return (
                                            <Link
                                                key={proj.id}
                                                href={`/projects/${proj.slug || proj.id}`}
                                                className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-400 bg-slate-50/50 transition flex flex-col justify-between gap-2.5 group"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                                            {proj.class_code || 'PROYEK'}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}>
                                                            {proj.formation_status_label || badge.label}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                                        {proj.title}
                                                    </h3>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        Tim: {proj.team_name} • Ketua: {proj.leader_name || 'Mahasiswa'}
                                                    </p>
                                                </div>
                                                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                                                    <span>{proj.members_count} Anggota • Progress {proj.progress ?? 0}%</span>
                                                    <span className="font-bold text-blue-600">Tinjau →</span>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: PROFIL DOSEN & AKTIVITAS */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                                <h2 className="text-sm font-bold text-slate-900">
                                    Profil Dosen
                                </h2>
                                <Link
                                    href="/settings/profile"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                >
                                    Pengaturan
                                </Link>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 font-bold text-xs flex items-center justify-center shrink-0">
                                    {initials || 'DS'}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 truncate">
                                        {user?.name || 'Dosen'}
                                    </h3>
                                    <p className="text-xs text-slate-500 truncate">
                                        {user?.major || 'Dosen Pengampu & Pembimbing'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-400 block">Institusi</span>
                                    <span className="font-semibold text-slate-800 line-clamp-1">{user?.campus || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block">Peran</span>
                                    <span className="font-semibold text-blue-600">Dosen Pengampu</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
                                <h2 className="text-sm font-bold text-slate-900">
                                    Aktivitas Tim Bimbingan
                                </h2>
                                <span className="text-[11px] text-slate-400">Terbaru</span>
                            </div>

                            {recentActivities && recentActivities.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recentActivities.map((act: any, idx: number) => (
                                        <div key={act.id || idx} className="py-2.5 text-xs">
                                            <p className="font-semibold text-slate-800">
                                                {act.actor?.name || 'Mahasiswa'}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                {(act.action || 'aktivitas').replace('_', ' ')} • {act.team?.name || 'Tim'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-4 text-center text-xs text-slate-400">
                                    Belum ada log aktivitas tim terbaru
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MODAL TOLAK PENGAJUAN TIM (DOSEN) */}
                {rejectModalProject && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Tolak Pengajuan Tim
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {rejectModalProject.team_name} ({rejectModalProject.title})
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRejectModalProject(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleRejectTeamSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Alasan Penolakan *
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Jelaskan alasan penolakan atau penyesuaian anggota yang dibutuhkan..."
                                        className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRejectModalProject(null)}
                                        className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processingProjectId === rejectModalProject.id}
                                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                    >
                                        {processingProjectId === rejectModalProject.id ? 'Menyimpan...' : 'Konfirmasi Tolak'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </AppLayout>
        );
    }

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

            {/* FLASH & ERROR BANNERS */}
            {flash?.success && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
                    {flash.success}
                </div>
            )}
            {flash?.info && (
                <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800">
                    {flash.info}
                </div>
            )}
            {(flash?.error || pageErrors?.invitation || pageErrors?.capacity) && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                    {flash?.error || pageErrors?.invitation || pageErrors?.capacity}
                </div>
            )}

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
                        href="/projects?status=recruiting"
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
                                {myTeams.map((team: any) => {
                                    const fStatus = team.formation_status || team.project?.formation_status || 'draft';
                                    const fBadge = getFormationBadgeStyle(fStatus);
                                    const fLabel = team.formation_status_label || team.project?.formation_status_label || fBadge.label;
                                    const fNotes = team.formation_notes || team.project?.formation_notes;

                                    return (
                                        <div
                                            key={team.id}
                                            className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between gap-3"
                                        >
                                            <div>
                                                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                                        PROYEK KELAS
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${fBadge.className}`}>
                                                        {fLabel}
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                                                    {team.name}
                                                </h3>
                                                {team.project?.title && (
                                                    <p className="text-[11px] font-semibold text-slate-700 mt-0.5 line-clamp-1">
                                                        Proyek: {team.project.title}
                                                    </p>
                                                )}
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                    {team.description || team.project?.short_description || 'Ruang kolaborasi tim mahasiswa RakitCampus.'}
                                                </p>

                                                {fStatus === 'formation_rejected' && fNotes && (
                                                    <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-1.5">
                                                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                                        <span><strong>Alasan Ditolak Dosen:</strong> {fNotes}</span>
                                                    </div>
                                                )}
                                                {fStatus === 'lecturer_approved' && fNotes && (
                                                    <div className="mt-2 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                                                        <strong>Catatan Dosen:</strong> {fNotes}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                                                <span className="text-slate-500">
                                                    {team.members_count || 1} Anggota • Progress {team.progress_percent ?? 0}%
                                                </span>
                                                <Link
                                                    href={team.project ? `/projects/${team.project.slug || team.project.id}` : `/workspace/${team.id}`}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                                >
                                                    Buka Detail →
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-slate-400">
                                <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="font-semibold text-slate-700">Belum tergabung dalam tim proyek</p>
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

                    {/* Panel 2b: Undangan Kolaborasi Antarmahasiswa (Terpisah dari Persetujuan Dosen) */}
                    {receivedInvitations && receivedInvitations.length > 0 && (
                        <div id="undangan-kolaborasi" className="bg-white rounded-xl border border-blue-200/90 p-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Inbox className="w-4 h-4 text-blue-600" />
                                        <span>Tim yang Mengajak Kolaborasi</span>
                                        {receivedInvitations.filter((i: any) => i.status === 'pending').length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                                {receivedInvitations.filter((i: any) => i.status === 'pending').length} Menunggu
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Undangan bergabung antarmahasiswa (berdiri sendiri, terpisah dari status persetujuan dosen)
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {receivedInvitations.map((inv: any) => {
                                    const isPending = inv.status === 'pending';
                                    const isBusy = processingInviteId === inv.id;

                                    return (
                                        <div
                                            key={inv.id}
                                            className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-900">
                                                        {inv.team_name}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    {inv.project_id ? (
                                                        <Link
                                                            href={`/projects/${inv.project_slug || inv.project_id}`}
                                                            className="text-xs font-semibold text-blue-600 hover:underline truncate"
                                                        >
                                                            {inv.project_title}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-xs font-semibold text-slate-700">
                                                            {inv.project_title}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                        inv.status === 'accepted'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : inv.status === 'declined'
                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                            : inv.status === 'expired'
                                                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                        {inv.status === 'accepted'
                                                            ? 'Undangan Diterima'
                                                            : inv.status === 'declined'
                                                            ? 'Undangan Ditolak'
                                                            : inv.status === 'expired'
                                                            ? 'Kedaluwarsa'
                                                            : 'Undangan Masuk'}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-slate-600">
                                                    Pengundang: <strong className="text-slate-800">{inv.inviter_name}</strong>
                                                    {' • '}
                                                    Posisi: <strong className="text-blue-700">{inv.role_name}</strong>
                                                    {' • '}
                                                    Anggota: {inv.team_members_count}/{inv.team_capacity}
                                                    {inv.class_label && ` • ${inv.class_label}`}
                                                </p>

                                                {inv.message && (
                                                    <p className="text-[11px] text-slate-500 italic">
                                                        "{inv.message}"
                                                    </p>
                                                )}
                                                {inv.status === 'declined' && inv.declined_reason && (
                                                    <p className="text-[11px] text-rose-600">
                                                        Alasan ditolak: "{inv.declined_reason}"
                                                    </p>
                                                )}
                                            </div>

                                            {isPending && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeclineModalInvite(inv);
                                                            setDeclineReason('');
                                                        }}
                                                        disabled={isBusy}
                                                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        <span>Tolak</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAcceptInvitation(inv)}
                                                        disabled={isBusy}
                                                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                        <span>{isBusy ? 'Memproses...' : 'Terima'}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Panel 3: Proyek yang Membuka Rekrutmen */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    Proyek yang Membuka Rekrutmen
                                </h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Peluang kolaborasi tim yang sedang membuka pendaftaran anggota
                                </p>
                            </div>
                            <Link
                                href="/projects?status=recruiting"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                            >
                                Eksplorasi Semua →
                            </Link>
                        </div>

                        {recommendedProjects && recommendedProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {recommendedProjects.slice(0, 4).map((proj: any) => (
                                    <Link
                                        key={proj.id}
                                        href={`/projects/${proj.slug || proj.id}`}
                                        className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-400 hover:bg-slate-50/50 transition flex flex-col justify-between gap-3 group block"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                                                    {proj.category || 'AKADEMIK'}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                    Rekrutmen Terbuka
                                                </span>
                                            </div>
                                            <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                                {proj.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {proj.short_description || 'Proyek kolaborasi terpadu mahasiswa.'}
                                            </p>

                                            {proj.open_roles && proj.open_roles.length > 0 && (
                                                <div className="flex flex-wrap items-center gap-1 mt-2">
                                                    <Briefcase className="w-3 h-3 text-emerald-600 shrink-0" />
                                                    {proj.open_roles.slice(0, 2).map((r: any) => (
                                                        <span
                                                            key={r.id || r.name}
                                                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                                                        >
                                                            {r.name}
                                                        </span>
                                                    ))}
                                                    {proj.open_roles.length > 2 && (
                                                        <span className="text-[10px] text-slate-400 font-semibold">
                                                            +{proj.open_roles.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="text-[11px] text-slate-500 truncate">
                                                {proj.leader?.name || 'Ketua Tim'} • {proj.members_count ?? 1}/{proj.max_team_size ?? 4} Anggota
                                            </span>
                                            <span className="font-semibold text-blue-600 flex items-center gap-0.5 shrink-0">
                                                Detail ↗
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-slate-400">
                                <p className="font-semibold text-slate-700">Belum ada proyek yang membuka rekrutmen saat ini</p>
                                <Link href="/projects?status=recruiting" className="text-blue-600 font-semibold hover:underline mt-1 inline-block">
                                    Lihat daftar proyek di Project Hub →
                                </Link>
                            </div>
                        )}
                    </div>
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

            {/* MODAL TOLAK UNDANGAN KOLABORASI (MAHASISWA) */}
            {declineModalInvite && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Tolak Undangan Kolaborasi
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {declineModalInvite.team_name} ({declineModalInvite.project_title})
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDeclineModalInvite(null)}
                                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleDeclineInvitationSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Alasan Penolakan (Opsional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={declineReason}
                                    onChange={(e) => setDeclineReason(e.target.value)}
                                    placeholder="Contoh: Saat ini sudah tergabung di tim lain atau jadwal bentrok..."
                                    className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeclineModalInvite(null)}
                                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingInviteId === declineModalInvite.id}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                >
                                    {processingInviteId === declineModalInvite.id ? 'Memproses...' : 'Konfirmasi Tolak'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
