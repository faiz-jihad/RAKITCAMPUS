import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Award,
    BookOpen,
    Bot,
    Briefcase,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    FileCheck,
    FileText,
    FolderKanban,
    GraduationCap,
    HelpCircle,
    Inbox,
    Layers,
    Mail,
    MessageSquare,
    MoreHorizontal,
    Plus,
    QrCode,
    RefreshCw,
    Scale,
    Send,
    ShieldAlert,
    ShieldCheck,
    Shuffle,
    Sparkles,
    Trophy,
    UserCheck,
    Users,
    X,
    XCircle,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    isPublic?: boolean;
    isAdmin?: boolean;
    isLecturer?: boolean;
    adminStats?: {
        total_students: number;
        verified_students: number;
        unverified_students: number;
        total_lecturers: number;
        active_projects: number;
        completed_projects: number;
        active_competitions: number;
        total_teams: number;
    };
    pendingVerifications?: Array<{
        id: number;
        user_id: number;
        name: string;
        email: string;
        student_number: string;
        study_program: string;
        created_at: string;
    }>;
    recentProjects?: Array<{
        id: number;
        title: string;
        status: string;
        leader_name: string;
        category: string;
        progress: number;
        created_at: string;
    }>;
    recentCompetitions?: Array<{
        id: number;
        name: string;
        organizer?: string;
        registration_deadline?: string;
        status: string;
    }>;
    upcomingCompetitions?: any[];
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        is_admin?: boolean;
        is_lecturer?: boolean;
        is_verified?: boolean;
        campus: string;
        major: string;
        nim?: string;
        academic_status?: string;
        batch_year?: string;
        headline?: string;
        availability?: string | null;
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
    receivedInvitations?: any[];
    recentActivities?: any[];
    taughtClasses?: any[];
    guidedProjects?: any[];
    pendingProposals?: any[];
    pendingEvaluations?: any[];
    recentGuidances?: any[];
    pendingTeamApprovals?: any[];
    teamApprovalHistory?: any[];
    profileCompletion?: { percent: number; missing: string[] };
}

export default function Dashboard({
    isAdmin = false,
    adminStats,
    pendingVerifications = [],
    recentProjects = [],
    recentCompetitions = [],
    upcomingCompetitions = [],
    user = {} as any,
    stats = {} as any,
    myTeams = [],
    myTasks = [],
    teammates = [],
    monthlyActivity = [],
    recommendedProjects = [],
    receivedInvitations = [],
    recentActivities = [],
    taughtClasses = [],
    guidedProjects = [],
    pendingProposals = [],
    pendingEvaluations = [],
    recentGuidances = [],
    pendingTeamApprovals = [],
    teamApprovalHistory = [],
    profileCompletion,
}: Props) {
    const { flash, errors: pageErrors } = usePage().props as any;
    const isLecturer = Boolean(user?.is_lecturer || user?.role === 'lecturer');

    // State untuk persetujuan tim & undangan
    const [approvalTab, setApprovalTab] = useState<'pending' | 'history'>('pending');
    const [processingProjectId, setProcessingProjectId] = useState<number | null>(null);
    const [rejectModalProject, setRejectModalProject] = useState<any | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [processingInviteId, setProcessingInviteId] = useState<number | null>(null);
    const [declineModalInvite, setDeclineModalInvite] = useState<any | null>(null);
    const [declineReason, setDeclineReason] = useState('');

    // State untuk bimbingan & simulasi tim
    const [selectedProjectForGuidance, setSelectedProjectForGuidance] = useState<any | null>(null);
    const [guidanceTitle, setGuidanceTitle] = useState('');
    const [guidanceContent, setGuidanceContent] = useState('');
    const [guidanceType, setGuidanceType] = useState('feedback');
    const [submittingGuidance, setSubmittingGuidance] = useState(false);
    const [simulatingClassId, setSimulatingClassId] = useState<number | null>(null);

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
    const primaryTeam = myTeams && myTeams.length > 0 ? myTeams[0] : null;

    // Helper Status Formasi Tim
    const getFormationBadgeStyle = (formationStatus?: string) => {
        switch (formationStatus) {
            case 'formation_review':
                return {
                    label: 'Menunggu Persetujuan Dosen',
                    className: 'text-amber-700 bg-amber-50',
                    dotColor: 'bg-amber-500',
                };
            case 'lecturer_approved':
                return {
                    label: 'Disetujui Dosen',
                    className: 'text-blue-700 bg-blue-50',
                    dotColor: 'bg-blue-600',
                };
            case 'workspace_activated':
                return {
                    label: 'Workspace Aktif',
                    className: 'text-blue-700 bg-blue-50',
                    dotColor: 'bg-blue-600',
                };
            case 'team_locked':
                return {
                    label: 'Formasi Terkunci',
                    className: 'text-slate-700 bg-slate-100',
                    dotColor: 'bg-slate-600',
                };
            case 'formation_rejected':
                return {
                    label: 'Ditolak',
                    className: 'text-rose-700 bg-rose-50',
                    dotColor: 'bg-rose-500',
                };
            case 'matchmaking_open':
                return {
                    label: 'Matchmaking Terbuka',
                    className: 'text-blue-700 bg-blue-50',
                    dotColor: 'bg-blue-600',
                };
            default:
                return {
                    label: 'Tahap Pembentukan',
                    className: 'text-slate-600 bg-slate-100',
                    dotColor: 'bg-slate-400',
                };
        }
    };

    // Handler Dosen: Setujui Formasi Tim
    const handleApproveTeam = (item: any) => {
        if (!confirm(`Setujui pengajuan tim "${item.team_name}" untuk proyek "${item.title}"?`)) return;
        setProcessingProjectId(item.id);
        router.post(
            `/projects/${item.id}/formation/review`,
            {
                action: 'approve',
                notes: 'Susunan tim dan pembimbing disetujui dosen melalui Dashboard Dosen.',
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessingProjectId(null),
            }
        );
    };

    // Handler Dosen: Tolak Formasi Tim dengan Catatan
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

    // Handler Mahasiswa: Terima Undangan Kolaborasi
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

    // Handler Mahasiswa: Tolak Undangan Kolaborasi
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

    // Handler Dosen: Catat Arahan Bimbingan Cepat
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

    // Handler Dosen: 1-Click Simulasi Tim Otomatis
    const handleRunAutoGrouping = (classId: number, className: string) => {
        if (!confirm(`Jalankan Simulasi Tim Otomatis untuk kelas "${className}"? Sistem akan mendistribusikan sisa mahasiswa ke kelompok berimbang tanpa ketimpangan keahlian.`)) {
            return;
        }

        setSimulatingClassId(classId);
        router.post(
            `/classes/${classId}/auto-form-teams`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setSimulatingClassId(null),
            }
        );
    };

    const isUserAdmin = Boolean(isAdmin || user?.is_admin || user?.role === 'campus_admin' || user?.role === 'platform_admin');
    const isUserLecturer = Boolean(isLecturer || user?.role === 'lecturer');

    const [pendingList, setPendingList] = useState(pendingVerifications || []);
    const [verifyingId, setVerifyingId] = useState<number | null>(null);

    const getXsrfToken = () => {
        if (typeof document === 'undefined') return '';
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const handleVerifyStudent = async (membershipId: number, status: 'verified' | 'rejected') => {
        setVerifyingId(membershipId);
        try {
            const res = await fetch(`/api/v1/admin/students/${membershipId}/verify`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                setPendingList(pendingList.filter((p: any) => p.id !== membershipId));
            } else {
                router.reload();
            }
        } catch {
            router.reload();
        } finally {
            setVerifyingId(null);
        }
    };

    // ==========================================
    // 1. ADMIN DASHBOARD VIEW
    // ==========================================
    if (isUserAdmin) {
        return (
            <AppLayout activeTab="dashboard" title="Admin Dashboard — RAKIT Campus">
                {/* 1. HEADER ROW */}
                <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-900 text-white">
                                <ShieldCheck className="size-3.5 text-blue-400" />
                                <span>{user.role === 'platform_admin' ? 'Super Admin Platform' : 'Admin Kampus'}</span>
                            </span>
                            <span className="text-xs text-slate-500 font-medium">{user.campus || 'Kampus Anda'}</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            Pusat Kendali Administrator
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Manajemen verifikasi mahasiswa, pengawasan kompetisi, dan tata kelola ekosistem kampus.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Link
                            href="/admin/competitions"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                        >
                            <Plus className="size-3.5" />
                            <span>Tambah Kompetisi</span>
                        </Link>
                        <Link
                            href="/admin/students"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition"
                        >
                            <Users className="size-3.5 text-slate-500" />
                            <span>Verifikasi Mahasiswa</span>
                        </Link>
                        <Link
                            href="/admin/notifications"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition"
                        >
                            <Mail className="size-3.5 text-slate-500" />
                            <span>Uji Email</span>
                        </Link>
                    </div>
                </section>

                {/* FLASH & ERROR BANNERS */}
                {flash?.success && (
                    <div className="mb-5 p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-white flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-blue-400 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.info && (
                    <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-medium text-blue-800">
                        {flash.info}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-slate-100 border border-slate-300 text-xs font-medium text-slate-900 flex items-center gap-2">
                        <AlertCircle className="size-4 text-slate-700 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* 2. ADMIN KPI STAT CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5 sm:gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Mahasiswa</span>
                            <Users className="size-4 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {adminStats?.total_students ?? stats?.total_students_count ?? 0}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-1">
                                {adminStats?.verified_students ?? 0} Terverifikasi
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Antrean Verifikasi</span>
                            <ShieldAlert className="size-4 text-slate-700" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {adminStats?.unverified_students ?? pendingList.length}
                            </div>
                            <div className="text-[10px] font-bold mt-1">
                                {pendingList.length > 0 ? (
                                    <span className="text-blue-700 font-semibold">{pendingList.length} Perlu Ditinjau</span>
                                ) : (
                                    <span className="text-slate-400">Semua Terverifikasi</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Dosen Pembimbing</span>
                            <GraduationCap className="size-4 text-slate-700" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {adminStats?.total_lecturers ?? 1}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-1">
                                Dosen Terdaftar
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Proyek Inovasi</span>
                            <FolderKanban className="size-4 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {adminStats?.active_projects ?? 0}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-1">
                                {adminStats?.completed_projects ?? 0} Selesai
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Kompetisi Aktif</span>
                            <Trophy className="size-4 text-slate-700" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {adminStats?.active_competitions ?? 0}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-1">
                                Periode Berjalan
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-3">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Tim</span>
                            <UserCheck className="size-4 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {adminStats?.total_teams ?? 0}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium mt-1">
                                Tim Kolaborasi
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. MAIN DASHBOARD CONTENT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: PENDING VERIFICATIONS & RECENT ACTIVITIES */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* PENDING STUDENT VERIFICATIONS PANEL */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span>Antrean Verifikasi Mahasiswa Baru</span>
                                        {pendingList.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                {pendingList.length} Menunggu
                                            </span>
                                        )}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Tinjau dan setujui status registrasi mahasiswa untuk akses penuh ke ekosistem kampus.
                                    </p>
                                </div>
                                <Link
                                    href="/admin/students"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition shrink-0"
                                >
                                    Kelola Semua Mahasiswa →
                                </Link>
                            </div>

                            {pendingList.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {pendingList.slice(0, 5).map((student: any) => (
                                        <div
                                            key={student.id}
                                            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-slate-50/60 rounded-lg px-2 -mx-2 transition"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                    {(student.name || 'M').substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-slate-900 truncate">
                                                        {student.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-2">
                                                        <span>NIM: <strong className="text-slate-700">{student.student_number}</strong></span>
                                                        <span>•</span>
                                                        <span className="text-slate-600">{student.study_program}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    type="button"
                                                    disabled={verifyingId === student.id}
                                                    onClick={() => handleVerifyStudent(student.id, 'verified')}
                                                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                                                >
                                                    Setujui
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={verifyingId === student.id}
                                                    onClick={() => handleVerifyStudent(student.id, 'rejected')}
                                                    className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                                                >
                                                    Tolak
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-slate-400">
                                    <CheckCircle2 className="size-8 mx-auto text-blue-600 mb-2 opacity-80" />
                                    <p className="text-xs font-semibold text-slate-700">Semua Mahasiswa Telah Terverifikasi</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada antrean verifikasi baru saat ini.</p>
                                </div>
                            )}
                        </div>

                        {/* RECENT INNOVATION PROJECTS */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Proyek Inovasi Mahasiswa Terkini
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Progres inovasi riset dan tugas akhir lintas program studi.
                                    </p>
                                </div>
                                <Link
                                    href="/projects"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                >
                                    Eksplor Semua Proyek →
                                </Link>
                            </div>

                            {recentProjects && recentProjects.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {recentProjects.slice(0, 4).map((proj: any) => (
                                        <div
                                            key={proj.id}
                                            className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition shadow-2xs flex flex-col justify-between gap-3"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                        {proj.category || 'Inovasi'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {proj.created_at}
                                                    </span>
                                                </div>
                                                <h3 className="text-xs font-bold text-slate-900 line-clamp-1">
                                                    {proj.title}
                                                </h3>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Ketua: {proj.leader_name}
                                                </p>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                                                    <span>Progres</span>
                                                    <span>{proj.progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-1.5 rounded-full transition-all"
                                                        style={{ width: `${proj.progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 py-4 text-center">Belum ada proyek yang terdaftar.</p>
                            )}
                        </div>

                        {/* RECENT COMPETITIONS MONITORING */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Status Kompetisi Kampus
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Monitoring periode pendaftaran dan delegasi mahasiswa.
                                    </p>
                                </div>
                                <Link
                                    href="/admin/competitions"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                >
                                    Kelola Semua Lomba →
                                </Link>
                            </div>

                            {recentCompetitions && recentCompetitions.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recentCompetitions.map((comp: any) => (
                                        <div
                                            key={comp.id}
                                            className="py-3 flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <h3 className="text-xs font-bold text-slate-900 truncate">
                                                    {comp.name}
                                                </h3>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Batas Pendaftaran: <strong className="text-slate-700">{comp.registration_deadline}</strong> {comp.organizer && `• ${comp.organizer}`}
                                                </p>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0 capitalize">
                                                {typeof comp.status === 'object' ? (comp.status?.value || 'Aktif') : (comp.status || 'Aktif')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 py-4 text-center">Belum ada kompetisi aktif.</p>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: ADMIN PROFILE & QUICK SHORTCUTS */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* ADMIN PROFILE CARD */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                                <h2 className="text-sm font-bold text-slate-900">
                                    Profil Administrator
                                </h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                    {user.role === 'platform_admin' ? 'Super Admin' : 'Admin Kampus'}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-11 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                                    {(user?.name || 'AD').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 truncate">
                                        {user?.name || 'Administrator'}
                                    </h3>
                                    <p className="text-xs text-slate-500 truncate">
                                        {user?.email || 'admin@rakitcampus.id'}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span>Lembaga Kampus:</span>
                                    <span className="font-semibold text-slate-800">{user?.campus || 'Kampus Anda'}</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500">
                                    <span>Hak Akses:</span>
                                    <span className="font-semibold text-slate-800">Akses Penuh (Full Control)</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500">
                                    <span>Layanan Email:</span>
                                    <span className="font-semibold text-blue-600">rakitcampus@gmail.com</span>
                                </div>
                            </div>
                        </div>

                        {/* QUICK ADMIN ACTION SHORTCUTS */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
                            <h2 className="text-sm font-bold text-slate-900 pb-3.5 border-b border-slate-100 mb-3.5">
                                Pintasan Menu Administrator
                            </h2>

                            <div className="space-y-2">
                                <Link
                                    href="/admin"
                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <ShieldCheck className="size-4 text-blue-600" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                Panel Administrasi Utama
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                Ikhtisar metrik dan log sistem
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="size-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                                </Link>

                                <Link
                                    href="/admin/students"
                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Users className="size-4 text-blue-600" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                Verifikasi & Kelola Mahasiswa
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                Status akun, program studi & NIM
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="size-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                                </Link>

                                <Link
                                    href="/admin/competitions"
                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Trophy className="size-4 text-slate-700" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                Kelola Kompetisi Kampus
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                Batas waktu, status & aturan lomba
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="size-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                                </Link>

                                <Link
                                    href="/admin/notifications"
                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Mail className="size-4 text-slate-700" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                Monitoring & Uji Email
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                Log pengiriman & uji SMTP
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="size-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                                </Link>

                                <Link
                                    href="/leaderboard/admin"
                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Award className="size-4 text-slate-700" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                Aturan Leaderboard & Poin
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                Konfigurasi bobot penilaian
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="size-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                                </Link>

                                <Link
                                    href="/ai-workspace"
                                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-slate-50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition group cursor-pointer"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <Bot className="size-4 text-blue-600" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                AI Workspace Copilot
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                Asisten AI cerdas ruang kerja
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="size-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // ==========================================
    // 2. LECTURER DASHBOARD VIEW
    // ==========================================
    if (isUserLecturer) {

        const displayedApprovals = approvalTab === 'pending' ? pendingTeamApprovals : teamApprovalHistory;

        return (
            <AppLayout activeTab="dashboard" title="Dashboard Dosen Pengampu — RakitCampus">
                {/* 1. HEADER ROW DOSEN */}
                <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200/80 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                            Selamat Datang, {user?.name}
                        </h1>
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
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs sm:text-sm font-semibold shadow-2xs transition cursor-pointer"
                        >
                            <FolderKanban className="w-4 h-4 text-slate-400" />
                            <span>Eksplorasi Proyek</span>
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
                {(flash?.error || pageErrors?.auth || pageErrors?.reason || pageErrors?.notes) && (
                    <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{flash?.error || pageErrors?.auth || pageErrors?.reason || pageErrors?.notes}</span>
                    </div>
                )}

                {/* 2. STATISTIK KPI DOSEN PENGAMPU (4 KPI CARDS GABUNGAN) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* KPI 1: Persetujuan Pengajuan Tim */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Persetujuan Tim
                                </span>
                                <ShieldCheck className="w-5 h-5 text-amber-600" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {pendingTeamApprovals.length}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Menunggu Keputusan
                                </span>
                            </div>
                        </div>
                        <a
                            href="#persetujuan-tim"
                            className="text-xs font-semibold text-blue-600 hover:underline flex items-center justify-between pt-2 border-t border-slate-100"
                        >
                            <span>Tinjau ajuan formasi</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </a>
                    </div>

                    {/* KPI 2: Kelas Kuliah Diampu */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Kelas Diampu
                                </span>
                                <GraduationCap className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {stats?.taught_classes_count ?? taughtClasses.length}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    {stats?.total_students_count ?? 0} Mahasiswa
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/classes"
                            className="text-xs font-semibold text-blue-600 hover:underline flex items-center justify-between pt-2 border-t border-slate-100"
                        >
                            <span>Buka manajemen kelas</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* KPI 3: Proyek & Kelompok Bimbingan */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Proyek Bimbingan
                                </span>
                                <FolderKanban className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {stats?.total_guided_projects_count ?? guidedProjects.length}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Tim Proyek
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/projects"
                            className="text-xs font-semibold text-blue-600 hover:underline flex items-center justify-between pt-2 border-t border-slate-100"
                        >
                            <span>Tinjau progres proyek</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* KPI 4: Living Proposal Menunggu Review */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between gap-3">
                        <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Proposal Masuk
                                </span>
                                <FileCheck className="w-5 h-5 text-amber-500" />
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                                    {stats?.pending_proposals_count ?? pendingProposals.length}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">
                                    Menunggu Persetujuan
                                </span>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                            Living Proposal mahasiswa kelas
                        </div>
                    </div>
                </div>

                {/* 3. MAIN CONTENT LAYOUT DOSEN (8 COLS / 4 COLS) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: PERSETUJUAN TIM & 5 PILAR DOSEN */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* PANEL PERSETUJUAN PENGAJUAN TIM (FITUR UTAMA PERSETUJUAN DOSEN) */}
                        <div id="persetujuan-tim" className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <ShieldCheck className="w-5 h-5 text-amber-600" />
                                        <span>Persetujuan Pengajuan Tim & Pembimbing</span>
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
                                                            <span>Tolak dengan Catatan</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApproveTeam(item)}
                                                            disabled={isBusy}
                                                            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span>{isBusy ? 'Memproses...' : 'Setujui Tim & Jadi Pembimbing'}</span>
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

                        {/* PILAR 1: MEMBIMBING PROYEK & PERSIAPAN LOMBA */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-blue-600" />
                                        <span>Membimbing Proyek & Persiapan Lomba</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Pantau progres tim mahasiswa, beri arahan bimbingan berkala, dan siapkan tim unggulan untuk kompetisi kampus.
                                    </p>
                                </div>
                                <Link
                                    href="/projects"
                                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
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
                                            className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                                        {proj.class_code || 'KELAS'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 truncate">
                                                        {proj.class_name}
                                                    </span>
                                                    {proj.is_competition_ready && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                                            <Trophy className="w-2.5 h-2.5" />
                                                            <span>Potensi Lomba</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                                    {proj.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                                                    <span>Ketua: <strong>{proj.leader_name || 'Mahasiswa'}</strong></span>
                                                    <span>•</span>
                                                    <span>{proj.members_count || 1} Anggota</span>
                                                    <span>•</span>
                                                    <span>{proj.done_tasks}/{proj.total_tasks} Tugas Selesai</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-slate-700">Proposal: {(proj.proposal_status || 'draft').toUpperCase()}</span>
                                                </div>
                                            </div>

                                            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2.5 shrink-0">
                                                <div className="text-right">
                                                    <span className="text-xs font-bold text-slate-800">
                                                        {proj.progress}%
                                                    </span>
                                                    <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
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
                                                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold text-blue-700 transition cursor-pointer flex items-center gap-1"
                                                    >
                                                        <MessageSquare className="w-3 h-3" />
                                                        <span>Beri Arahan</span>
                                                    </button>
                                                    <Link
                                                        href={`/projects/${proj.slug || proj.id}`}
                                                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition flex items-center gap-1"
                                                    >
                                                        <span>Detail</span>
                                                        <ArrowRight className="w-3 h-3" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-slate-400">
                                    <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="font-semibold text-slate-700 text-sm">
                                        Belum ada proyek bimbingan aktif
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                                        Proyek yang diajukan mahasiswa pada ruang kelas Anda akan otomatis muncul di sini untuk ditinjau, dibimbing, dan diarahkan ke persiapan lomba.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* PILAR 2: MENINJAU SERTA MENYETUJUI PROPOSAL (LIVING PROPOSAL) */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <FileCheck className="w-4 h-4 text-emerald-600" />
                                        <span>Meninjau serta Menyetujui Proposal (Living Proposal)</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Verifikasi proposal rancangan proyek mahasiswa sebelum pengerjaan sprint dimulai.
                                    </p>
                                </div>
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    {pendingProposals.length} Menunggu
                                </span>
                            </div>

                            {pendingProposals && pendingProposals.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingProposals.map((prop: any) => (
                                        <div
                                            key={prop.id}
                                            className="p-3.5 rounded-xl border border-amber-200/70 bg-amber-50/30 flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/70 text-amber-900 uppercase">
                                                        Revisi V{prop.proposal_version}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-800 truncate">
                                                        {prop.title}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">
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
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>Semua proposal proyek telah ditinjau dan disetujui. Tidak ada proposal yang tertunda saat ini.</span>
                                </div>
                            )}
                        </div>

                        {/* PILAR 4: EVALUASI & SNAPSHOT IMUTABEL (UTS & UAS) - ALUR 4 */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Award className="w-4 h-4 text-purple-600" />
                                        <span>Evaluasi & Snapshot Imutabel (UTS & UAS)</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Penilaian rubrik berkala UTS/UAS dan penguncian snapshot proposal & progres yang tidak tertimpa revisi.
                                    </p>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                                    pendingEvaluations.length > 0
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {pendingEvaluations.length} Menunggu Penilaian
                                </span>
                            </div>

                            {pendingEvaluations && pendingEvaluations.length > 0 ? (
                                <div className="space-y-3">
                                    {pendingEvaluations.map((ev: any) => (
                                        <div
                                            key={ev.id}
                                            className="p-3.5 rounded-xl border border-purple-200/80 bg-purple-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                                        ev.period_type === 'uas'
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                                                    }`}>
                                                        {ev.period_name || ev.period_type.toUpperCase()}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                                        Snapshot V{ev.version_number} • Progress {ev.progress_percentage}%
                                                    </span>
                                                    {ev.class_code && (
                                                        <span className="text-[10px] font-mono text-slate-400">
                                                            {ev.class_code}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                                    {ev.team_name} — <span className="text-purple-700">{ev.project_title}</span>
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                    Pengumpul: {ev.submitter_name} • Diserahkan {ev.submitted_at}
                                                </p>
                                            </div>

                                            <Link
                                                href={`/projects/${ev.project_slug || ev.project_id}?tab=${ev.period_type || 'uts'}`}
                                                className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shrink-0 flex items-center gap-1.5 shadow-xs"
                                            >
                                                <span>Beri Nilai & Review Rubrik</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                                        <span>Semua evaluasi UTS/UAS telah dinilai. Saat mahasiswa menyerahkan berkas laporan, sistem otomatis mengunci snapshot imutabel di sini.</span>
                                    </div>
                                    <Link
                                        href="/projects"
                                        className="text-xs font-bold text-purple-600 hover:underline shrink-0 inline-flex items-center gap-1"
                                    >
                                        <span>Lihat Proyek</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* PILAR 3: RUANG KELAS & SIMULASI PEMBAGIAN TIM OTOMATIS */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                                <div>
                                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Shuffle className="w-4 h-4 text-indigo-600" />
                                        <span>Ruang Kelas & Simulasi Pembagian Tim Cerdas</span>
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Kelola kelas kuliah dan jalankan simulasi distribusi mahasiswa yang belum memiliki kelompok agar merata tanpa ketimpangan.
                                    </p>
                                </div>
                                <Link
                                    href="/classes"
                                    className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
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
                                                className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-500 transition flex flex-col justify-between gap-3 group"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                                            Kode: {cls.join_code || cls.code}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            Semester {cls.semester} • {cls.academic_year || '2026/2027'}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                        {cls.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {cls.students_count || 0} Mahasiswa Terdaftar • {cls.projects_count || 0} Kelompok
                                                    </p>
                                                </div>

                                                {/* Action Bar Simulasi Tim */}
                                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
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
                                                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                                            <Check className="w-3.5 h-3.5" />
                                                            <span>Semua mahasiswa berkelompok</span>
                                                        </span>
                                                    )}

                                                    <Link
                                                        href={`/classes/${cls.code || cls.id}`}
                                                        className="font-bold text-blue-600 flex items-center gap-1 hover:underline"
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
                                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="font-semibold text-slate-700 text-sm">
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
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                                <h2 className="text-sm font-bold text-slate-900">
                                    Identitas Dosen Pengampu
                                </h2>
                                <Link
                                    href="/settings/profile"
                                    className="text-xs font-semibold text-blue-600 hover:underline"
                                >
                                    Pengaturan Profil
                                </Link>
                            </div>

                            <div className="flex items-center gap-3.5 py-2">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                                    {initials || 'DS'}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 truncate">
                                        {user?.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 truncate mt-0.5">
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-medium">NIDN / NIP</span>
                                    <span className="font-semibold text-slate-800">
                                        {user?.nim || '-'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-400 block font-medium">Status</span>
                                    <span className="font-semibold text-emerald-600">
                                        Dosen Pengampu
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600">
                                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-0.5">
                                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{user?.campus || 'Politeknik Negeri Indramayu'}</span>
                                </div>
                                <span className="text-[11px] text-slate-400">{user?.major || 'Teknik Informatika'}</span>
                            </div>
                        </div>

                        {/* CATATAN ARAHAN BIMBINGAN TERAKHIR */}
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
                                <span>Riwayat Catatan Bimbingan</span>
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                            </h2>

                            {recentGuidances && recentGuidances.length > 0 ? (
                                <div className="space-y-2.5">
                                    {recentGuidances.slice(0, 4).map((g: any) => (
                                        <div
                                            key={g.id}
                                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs"
                                        >
                                            <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                                                <span className="truncate">{g.title}</span>
                                                <span className="text-[10px] text-slate-400 font-normal shrink-0">{g.created_at}</span>
                                            </div>
                                            <p className="text-slate-600 text-[11px] line-clamp-2">
                                                {g.content}
                                            </p>
                                            <div className="mt-1.5 text-[10px] text-blue-600 font-medium">
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
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3.5">
                            <h2 className="text-sm font-bold text-slate-900">
                                5 Fokus Tugas Pengampu
                            </h2>

                            <div className="space-y-2.5 text-xs">
                                <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-2">
                                    <Trophy className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-blue-900">1. Bimbingan & Lomba</p>
                                        <p className="text-blue-700/80 text-[11px] mt-0.5">
                                            Arahkan proyek kelas mahasiswa yang berpotensi ke ajang perlombaan.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2">
                                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-emerald-900">2. Review Living Proposal</p>
                                        <p className="text-emerald-700/80 text-[11px] mt-0.5">
                                            Tinjau serta setujui rancangan proyek proposal ketua kelompok.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-100 flex items-start gap-2">
                                    <Activity className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-900">3. Pantau Progres & Arahan</p>
                                        <p className="text-amber-700/80 text-[11px] mt-0.5">
                                            Cek task selesai dan beri feedback langsung ke tim mahasiswa.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 flex items-start gap-2">
                                    <Award className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-purple-900">4. Evaluasi & Nilai</p>
                                        <p className="text-purple-700/80 text-[11px] mt-0.5">
                                            Penilaian berkala UTS/UAS dan rubrik capaian luaran.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-2">
                                    <Zap className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-indigo-900">5. Simulasi Tim Otomatis</p>
                                        <p className="text-indigo-700/80 text-[11px] mt-0.5">
                                            Distribusikan sisa mahasiswa tanpa kelompok secara adil & seimbang.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AKTIVITAS TIM TERBARU */}
                        {recentActivities && recentActivities.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
                                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Aktivitas Tim Bimbingan
                                    </h2>
                                    <span className="text-[11px] text-slate-400">Terbaru</span>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {recentActivities.slice(0, 5).map((act: any, idx: number) => (
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
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL TOLAK PENGAJUAN TIM (DOSEN) */}
                {rejectModalProject && (
                    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Tolak Pengajuan Formasi Tim
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
                                        Alasan Penolakan & Arahan Perbaikan <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        required
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Jelaskan alasan penolakan, penyesuaian komposisi anggota yang dibutuhkan, atau saran topik..."
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

                {/* MODAL INPUT CATATAN ARAHAN BIMBINGAN (DOSEN) */}
                {selectedProjectForGuidance && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Catat Arahan & Bimbingan Proyek
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Proyek: <strong>{selectedProjectForGuidance.title}</strong>
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedProjectForGuidance(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSendGuidance} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Judul Arahan / Topik Bimbingan <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={guidanceTitle}
                                        onChange={(e) => setGuidanceTitle(e.target.value)}
                                        placeholder="Contoh: Evaluasi Arsitektur Database & Sprint 1"
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 font-medium"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Jenis Arahan
                                        </label>
                                        <select
                                            value={guidanceType}
                                            onChange={(e) => setGuidanceType(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 text-xs"
                                        >
                                            <option value="feedback">Feedback Progres</option>
                                            <option value="revision">Catatan Revisi Proposal</option>
                                            <option value="competition">Instruksi Persiapan Lomba</option>
                                            <option value="evaluation">Evaluasi Tengah Semester</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                                            Target Kelompok
                                        </label>
                                        <input
                                            type="text"
                                            disabled
                                            value={selectedProjectForGuidance.team_name || 'Tim Mahasiswa'}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                                        Isi Arahan / Rekomendasi Perbaikan <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={guidanceContent}
                                        onChange={(e) => setGuidanceContent(e.target.value)}
                                        placeholder="Tuliskan catatan teknis, arahan implementasi, atau perbaikan proposal yang harus diselesaikan kelompok..."
                                        required
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 leading-relaxed"
                                    />
                                </div>

                                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProjectForGuidance(null)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
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
            <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-200/80 mb-5 sm:mb-6">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Dashboard Mahasiswa
                </h1>

                <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                    <Link
                        href="/projects/create"
                        className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Buat Proyek</span>
                    </Link>
                    <Link
                        href="/workspace"
                        className="flex-1 sm:flex-none justify-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 hover:border-slate-300 hover:text-blue-600 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-slate-700 border border-slate-200 text-xs font-semibold shadow-2xs transition-all duration-200 cursor-pointer group"
                    >
                        <span>Workspace Tim</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform duration-200 group-hover:translate-x-0.5" />
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

            {/* 2. BENTO GRID UTAMA (4 KARTU: PROGRES TUGAS TALL + TIM UTAMA + KESIAPAN PROFIL & REKRUTMEN) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mb-6 sm:mb-8 items-stretch">
                {/* CARD 1: PROGRES TUGAS SPRINT (TALL / 4 COLS LG) */}
                <div className="lg:col-span-4 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group/card">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Progres Tugas
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                Sprint Aktif
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
                                        strokeDashoffset={2 * Math.PI * 46 * (1 - Math.min(100, Math.max(0, taskPercent)) / 100)}
                                        strokeLinecap="round"
                                        className="text-blue-600 transition-all duration-700 ease-out"
                                        fill="transparent"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {taskPercent}%
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                                        TUNTAS
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 text-left">
                            <div className="text-sm font-bold text-slate-900">
                                {completedTasks} / {totalTasks} Tugas Selesai
                            </div>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                {totalTasks === 0
                                    ? 'Belum ada tugas sprint aktif.'
                                    : pendingTasks === 0
                                    ? 'Semua tugas sprint telah selesai.'
                                    : `${pendingTasks} tugas sedang berjalan.`}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 sm:mt-6 pt-4 border-t border-slate-100">
                        <Link
                            href={primaryTeam ? `/workspace/${primaryTeam.id}` : '/workspace'}
                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white text-xs font-semibold shadow-xs transition-all duration-200 group cursor-pointer"
                        >
                            <span>Buka Workspace</span>
                            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* RIGHT COLUMN (8 COLS LG): CARD 2 ON TOP, CARDS 3 & 4 AT BOTTOM */}
                <div className="lg:col-span-8 flex flex-col justify-between gap-4 sm:gap-5">
                    {/* CARD 2: TIM AKADEMIK / MANDIRI & SUSUNAN TIM */}
                    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex-1 flex flex-col justify-between group/card">
                        <div>
                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    {primaryTeam
                                        ? (primaryTeam.is_academic || primaryTeam.project?.category === 'academic' ? 'Tim Akademik' : 'Tim Mandiri')
                                        : 'Tim Proyek'}
                                </span>
                                {primaryTeam?.project?.class_label && (
                                    <span className="text-xs text-slate-400 font-medium truncate max-w-[160px] sm:max-w-[200px]">
                                        {primaryTeam.project.class_label}
                                    </span>
                                )}
                            </div>

                            {/* Middle content: Team Info on Left, Susunan Tim box on Right */}
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-5">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
                                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                                            {primaryTeam ? primaryTeam.name : 'Belum Memiliki Tim'}
                                        </h3>
                                        {primaryTeam && (
                                            <span className="text-xs text-slate-500 font-semibold">
                                                · {primaryTeam.members_count || primaryTeam.members?.length || 1} Anggota
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed line-clamp-2">
                                        {primaryTeam?.project?.title ? (
                                            <span className="font-semibold text-slate-800">
                                                Proyek: {primaryTeam.project.title}
                                            </span>
                                        ) : (
                                            primaryTeam?.description || 'Bergabunglah dengan tim atau mulai proyek baru Anda.'
                                        )}
                                    </p>

                                    {/* Action Buttons */}
                                    <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-2 sm:gap-2.5">
                                        {primaryTeam ? (
                                            primaryTeam.can_access_workspace ? (
                                                <Link
                                                    href={`/workspace/${primaryTeam.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white text-xs font-bold transition-all duration-200 shadow-xs cursor-pointer group"
                                                >
                                                    <FolderKanban className="size-3.5" />
                                                    <span>Buka Workspace</span>
                                                    <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                                                </Link>
                                            ) : (
                                                <Link
                                                    href={primaryTeam.project ? `/projects/${primaryTeam.project.slug || primaryTeam.project.id}` : '/projects'}
                                                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white text-xs font-bold transition-all duration-200 shadow-xs cursor-pointer group"
                                                >
                                                    <Users className="size-3.5" />
                                                    <span>Kelola Tim</span>
                                                    <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-0.5" />
                                                </Link>
                                            )
                                        ) : (
                                            <Link
                                                href="/projects/create"
                                                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] text-white text-xs font-bold transition-all duration-200 shadow-xs cursor-pointer group"
                                            >
                                                <Plus className="size-3.5" />
                                                <span>Buat Proyek</span>
                                            </Link>
                                        )}

                                        {primaryTeam?.project && (
                                            <Link
                                                href={`/projects/${primaryTeam.project.slug || primaryTeam.project.id}`}
                                                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-300 text-xs font-semibold shadow-2xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 cursor-pointer group"
                                            >
                                                <span>Detail Proyek</span>
                                                <ArrowRight className="size-3 text-slate-400 group-hover:text-blue-600 transition-transform duration-200 group-hover:translate-x-0.5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Susunan Tim Box (Right side of Card 2) */}
                                {primaryTeam && primaryTeam.members && primaryTeam.members.length > 0 && (
                                    <div className="bg-slate-50/70 rounded-xl p-3 sm:p-3.5 border border-slate-200/70 w-full md:w-auto md:min-w-[210px] shrink-0">
                                        <div className="mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                Susunan Tim
                                            </span>
                                        </div>

                                        {/* Colorful Avatar Row */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            {primaryTeam.members.map((member: any, idx: number) => {
                                                const memberInitials = (member.name || 'M')
                                                    .split(' ')
                                                    .filter(Boolean)
                                                    .slice(0, 2)
                                                    .map((w: string) => w[0].toUpperCase())
                                                    .join('');
                                                const avatarColors = [
                                                    'bg-blue-600 text-white',
                                                    'bg-amber-500 text-white',
                                                    'bg-emerald-600 text-white',
                                                    'bg-purple-600 text-white',
                                                    'bg-rose-600 text-white',
                                                    'bg-indigo-600 text-white',
                                                ];
                                                const grad = avatarColors[idx % avatarColors.length];

                                                return (
                                                    <div
                                                        key={member.id || idx}
                                                        className={`size-7 rounded-full ${grad} font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-2xs hover:scale-110 transition-transform cursor-pointer`}
                                                        title={`${member.name} - ${member.role || 'Anggota'}`}
                                                    >
                                                        {memberInitials}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Roles list */}
                                        <div className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
                                            {primaryTeam.members
                                                .map((m: any) => m.role?.replace(/ Specialist| Developer/gi, '') || 'Anggota')
                                                .slice(0, 3)
                                                .join(' · ')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BOTTOM ROW: KESIAPAN PROFIL & REKRUTMEN TERBUKA (2 CARDS) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        {/* CARD 3: KESIAPAN PROFIL */}
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group/card">
                            <div>
                                <div className="mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Kesiapan Profil
                                    </span>
                                </div>

                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                            {readinessScore}%
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                            Lengkapi keahlian & biodata Anda.
                                        </p>
                                    </div>

                                    {/* Verified / Mahasiswa Badge */}
                                    <div className="size-12 sm:size-14 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex flex-col items-center justify-center text-blue-600 shrink-0 group-hover/card:scale-105 transition-transform duration-200">
                                        <ShieldCheck className="size-4 sm:size-5" />
                                        <span className="text-[8px] font-extrabold tracking-wider uppercase mt-0.5">
                                            {user?.is_verified ? 'VERIFIED' : 'MAHASISWA'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <Link
                                    href="/settings/profile"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition flex items-center justify-between group cursor-pointer"
                                >
                                    <span>Kelola Profil</span>
                                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1.5" />
                                </Link>
                            </div>
                        </div>

                        {/* CARD 4: REKRUTMEN TERBUKA */}
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between group/card">
                            <div>
                                <div className="mb-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Rekrutmen Terbuka
                                    </span>
                                </div>

                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                                {recommendedProjects.length}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-500">
                                                Proyek Terbuka
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-1">
                                            Peluang bergabung dengan tim proyek baru.
                                        </p>
                                        {recommendedProjects.length > 0 && (
                                            <div className="text-[11px] text-slate-500 truncate mt-1.5 flex items-center gap-1.5">
                                                <span className="font-medium text-slate-700 truncate">
                                                    {recommendedProjects[0]?.title}
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/70 shrink-0">
                                                    Open Slot
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Open Slot Badge */}
                                    <div className="size-14 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex flex-col items-center justify-center text-blue-600 shrink-0 group-hover/card:scale-105 transition-transform duration-200">
                                        <Building2 className="size-5" />
                                        <span className="text-[8px] font-extrabold tracking-wider uppercase mt-0.5">
                                            OPEN SLOT
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <Link
                                    href="/projects?status=recruiting"
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition flex items-center justify-between group cursor-pointer"
                                >
                                    <span>Eksplorasi Proyek</span>
                                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. MAIN CONTENT (TWO COLUMNS: 8 COLS / 4 COLS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
                {/* LEFT COLUMN: TASKS, ACTIVE PROJECTS, INVITATIONS, RECRUITING */}
                <div className="lg:col-span-8 space-y-5 sm:space-y-6">
                    {/* Panel 1: Tugas Prioritas */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900">
                                    Tugas Prioritas
                                </h2>
                            </div>
                            <Link
                                href="/workspace"
                                className="text-xs font-semibold text-blue-600 hover:underline transition flex items-center gap-1"
                            >
                                <span>Buka Workspace Tim</span>
                                <ArrowRight className="w-3.5 h-3.5" />
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
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                            <h2 className="text-sm font-bold text-slate-900">
                                Proyek & Tim Anda
                            </h2>
                            <Link
                                href="/projects"
                                className="text-xs font-semibold text-blue-600 hover:underline transition flex items-center gap-1 group"
                            >
                                <span>Semua Proyek</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        {myTeams && myTeams.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {myTeams.map((team: any) => {
                                    const fStatus = team.formation_status || team.project?.formation_status || 'draft';
                                    const fBadge = getFormationBadgeStyle(fStatus);
                                    const fLabel = team.formation_status_label || team.project?.formation_status_label || fBadge.label;
                                    const fNotes = team.formation_notes || team.project?.formation_notes;
                                    const isAcademicProject = Boolean(team.is_academic || team.project?.category === 'academic');

                                    return (
                                        <div
                                            key={team.id}
                                            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 hover:border-slate-300 hover:shadow-xs transition-all duration-200 flex flex-col justify-between gap-3 group/item"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-2">
                                                    <span className="text-[11px] font-semibold text-slate-500">
                                                        {isAcademicProject ? 'Proyek Akademik' : 'Proyek Mandiri'}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                                                        <span className={`size-1.5 rounded-full ${fBadge.dotColor}`} />
                                                        <span>{fLabel}</span>
                                                    </span>
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 group-hover/item:text-blue-600 transition">
                                                    {team.name}
                                                </h3>
                                                {team.project?.title && team.project.title !== team.name && (
                                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                                        Proyek: {team.project.title}
                                                    </p>
                                                )}

                                                {fStatus === 'formation_rejected' && fNotes && (
                                                    <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-1.5">
                                                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                                                        <span><strong>Alasan Ditolak Dosen:</strong> {fNotes}</span>
                                                    </div>
                                                )}
                                                {fStatus === 'lecturer_approved' && fNotes && (
                                                    <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-800">
                                                        <strong>Catatan Dosen:</strong> {fNotes}
                                                    </div>
                                                )}
                                            </div>

                                            {isAcademicProject && team.can_access_workspace && team.project && (
                                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                                    <span className="text-slate-500 text-[11px]">Evaluasi Semester:</span>
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/projects/${team.project.slug || team.project.id}?tab=uts`}
                                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                                                        >
                                                            Snapshot UTS
                                                        </Link>
                                                        <span className="text-slate-300">·</span>
                                                        <Link
                                                            href={`/projects/${team.project.slug || team.project.id}?tab=uas`}
                                                            className="text-xs font-semibold text-slate-600 hover:text-blue-600 hover:underline"
                                                        >
                                                            Snapshot UAS
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                                <span className="text-[11px] text-slate-500">
                                                    {team.members_count || 1} Anggota · Progres {team.progress_percent ?? 0}%
                                                </span>
                                                <Link
                                                    href={team.project ? `/projects/${team.project.slug || team.project.id}` : `/workspace/${team.id}`}
                                                    className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                                                >
                                                    <span>Buka Detail</span>
                                                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/item:translate-x-0.5" />
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

                    {/* Panel 2b: Undangan Kolaborasi Antarmahasiswa */}
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
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                            <h2 className="text-sm font-bold text-slate-900">
                                Proyek yang Membuka Rekrutmen
                            </h2>
                            <Link
                                href="/projects?status=recruiting"
                                className="text-xs font-semibold text-blue-600 hover:underline transition flex items-center gap-1 group"
                            >
                                <span>Eksplorasi Semua</span>
                                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </div>

                        {recommendedProjects && recommendedProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                {recommendedProjects.slice(0, 4).map((proj: any) => (
                                    <Link
                                        key={proj.id}
                                        href={`/projects/${proj.slug || proj.id}`}
                                        className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-xs transition-all duration-200 flex flex-col justify-between gap-3 group block"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-1.5 text-xs">
                                                <span className="font-semibold text-slate-500 capitalize">
                                                    {proj.category?.replace(/_/g, ' ') || 'Proyek'}
                                                </span>
                                                <span className="font-semibold text-blue-600">
                                                    {proj.open_roles?.length || 1} Posisi Dicari
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                                {proj.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                                {proj.short_description || 'Proyek kolaborasi mahasiswa.'}
                                            </p>

                                            {proj.open_roles && proj.open_roles.length > 0 && (
                                                <div className="flex items-center gap-1.5 mt-2.5 text-xs text-slate-600">
                                                    <span className="text-slate-400 font-medium">Posisi:</span>
                                                    <span className="font-medium text-slate-800 truncate">
                                                        {proj.open_roles.map((r: any) => r.name).slice(0, 2).join(', ')}
                                                        {proj.open_roles.length > 2 ? ` +${proj.open_roles.length - 2}` : ''}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <span className="text-[11px] text-slate-500 truncate">
                                                {proj.leader?.name || 'Ketua Tim'} · {proj.members_count ?? 1}/{proj.max_team_size ?? 4} Anggota
                                            </span>
                                            <span className="font-semibold text-blue-600 group-hover:text-blue-700 flex items-center gap-1 shrink-0 group-hover:underline">
                                                <span>Detail</span>
                                                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="py-6 text-center text-xs text-slate-400">
                                <p className="font-semibold text-slate-700">Belum ada proyek yang membuka rekrutmen saat ini</p>
                                <Link href="/projects?status=recruiting" className="text-blue-600 font-semibold hover:underline mt-1 inline-flex items-center gap-1">
                                    <span>Lihat daftar proyek di Project Hub</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: PROFILE & ACTIVITIES */}
                <div className="lg:col-span-4 space-y-5 sm:space-y-6">
                    {/* User Card */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                            <h2 className="text-sm font-bold text-slate-900">
                                Profil Mahasiswa
                            </h2>
                            <Link
                                href="/settings/profile"
                                className="text-xs font-semibold text-blue-600 hover:underline"
                            >
                                Edit Profil
                            </Link>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <div className="size-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
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
                                <span className="text-[10px] text-slate-400 block font-medium">NIM</span>
                                <span className="font-semibold text-slate-800">{user?.nim || '-'}</span>
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 block font-medium">Kampus</span>
                                <span className="font-semibold text-slate-800 truncate block">{user?.campus || 'Kampus'}</span>
                            </div>
                        </div>

                        {user?.skills && user.skills.length > 0 && (
                            <div className="pt-3 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400 block font-medium mb-1.5">Keahlian</span>
                                <div className="flex flex-wrap gap-1">
                                    {user.skills.slice(0, 4).map((s: any, idx: number) => (
                                        <span key={s.id || idx} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                            {s.name}
                                        </span>
                                    ))}
                                    {user.skills.length > 4 && (
                                        <span className="text-[10px] text-slate-400 font-medium self-center">
                                            +{user.skills.length - 4}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rekan Kolaborasi Tim (Real teammates from active projects) */}
                    {teammates && teammates.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                                <h2 className="text-sm font-bold text-slate-900">
                                    Rekan Kolaborasi Tim
                                </h2>
                                <span className="text-xs text-slate-400 font-medium">
                                    {teammates.length} Rekan
                                </span>
                            </div>

                            <div className="space-y-3">
                                {teammates.slice(0, 5).map((peer: any, idx: number) => {
                                    const peerInitials = (peer.name || 'M')
                                        .split(' ')
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((w: string) => w[0].toUpperCase())
                                        .join('');
                                    const peerColors = [
                                        'bg-blue-50 text-blue-700',
                                        'bg-amber-50 text-amber-700',
                                        'bg-emerald-50 text-emerald-700',
                                        'bg-purple-50 text-purple-700',
                                    ];
                                    const peerColor = peerColors[idx % peerColors.length];

                                    return (
                                        <div key={peer.id || idx} className="flex items-center gap-2.5">
                                            <div className={`size-8 rounded-full ${peerColor} font-bold text-xs flex items-center justify-center shrink-0`}>
                                                {peerInitials}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-semibold text-slate-900 truncate">
                                                    {peer.name}
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate">
                                                    {peer.role || 'Anggota'} · {peer.team}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Aktivitas Tim Terbaru (Real team activities) */}
                    {recentActivities && recentActivities.length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                                <h2 className="text-sm font-bold text-slate-900">
                                    Aktivitas Terbaru
                                </h2>
                            </div>

                            <div className="space-y-3">
                                {recentActivities.slice(0, 4).map((act: any, idx: number) => (
                                    <div key={act.id || idx} className="text-xs text-slate-600">
                                        <span className="font-semibold text-slate-900">{act.actor?.name || 'Rekan Tim'}</span>{' '}
                                        <span>{act.description || act.action || 'memperbarui proyek'}</span>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            {act.team?.name ? `${act.team.name} · ` : ''}
                                            {act.created_at ? new Date(act.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Baru saja'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
