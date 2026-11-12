import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    Archive,
    ArrowLeft,
    Award,
    Bookmark,
    Briefcase,
    Check,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    FileText,
    FolderKanban,
    GitBranch,
    GraduationCap,
    HelpCircle,
    Inbox,
    Layers,
    Lock,
    MessageSquare,
    PieChart,
    Plus,
    Send,
    ShieldCheck,
    Sparkles,
    Trash2,
    UserCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import SemesterTimeline from './components/SemesterTimeline';
import LivingProposalTab from './components/LivingProposalTab';
import ProposalVersionsTab from './components/ProposalVersionsTab';
import TasksKanbanTab from './components/TasksKanbanTab';
import AssessmentTab from './components/AssessmentTab';
import RequirementsTab from './components/RequirementsTab';
import MatchmakingTab from './components/MatchmakingTab';
import TeamBalanceTab from './components/TeamBalanceTab';
import InvitationsTab from './components/InvitationsTab';
import TeamFormationTab from './components/TeamFormationTab';

interface Props {
    project: any;
    isBookmarked: boolean;
    isLeader: boolean;
    isLecturer?: boolean;
    isLecturerAccount?: boolean;
    isMember: boolean;
    userHasActiveProject?: boolean;
    myApplication?: any;
    eligibility?: { eligible: boolean; reason: string | null };
    canEdit: boolean;
    applications?: any[];
    livingProposal?: any;
    assessmentPeriods?: any[];
    submissions?: any[];
    kanban?: {
        todo: any[];
        in_progress: any[];
        in_review: any[];
        completed: any[];
    };
    milestones?: any[];
    activities?: any[];
    discussions?: any[];
    guidances?: any[];
    implementationProgress?: number;
    achievements?: any[];
    teamBalance?: any;
    teamOptimization?: any;
    sameClassCandidates?: any[];
    classStudents?: any[];
    sentInvitations?: any[];
    receivedInvitations?: any[];
    canAccessWorkspace?: boolean;
}

export default function ProjectShow({
    project,
    isBookmarked: initialBookmarked,
    isLeader,
    isLecturer = false,
    isLecturerAccount = false,
    isMember,
    userHasActiveProject = false,
    myApplication = null,
    eligibility = { eligible: false, reason: null },
    canEdit,
    applications: initialApplications = [],
    livingProposal,
    assessmentPeriods = [],
    submissions = [],
    kanban = { todo: [], in_progress: [], in_review: [], completed: [] },
    milestones = [],
    activities = [],
    discussions = [],
    guidances = [],
    implementationProgress = 0,
    achievements = [],
    teamBalance,
    teamOptimization,
    sameClassCandidates = [],
    classStudents = [],
    sentInvitations = [],
    receivedInvitations = [],
    canAccessWorkspace = false,
}: Props) {
    const initialTabParam = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('tab')
        : null;
    const [activeTab, setActiveTab] = useState<string>(initialTabParam || 'overview');
    const [bookmarked, setBookmarked] = useState(initialBookmarked);
    const [applications, setApplications] = useState(initialApplications);
    const [applyingRole, setApplyingRole] = useState<any>(null);
    const [applyMessage, setApplyMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [decidingId, setDecidingId] = useState<number | null>(null);
    const [lifecycleProcessing, setLifecycleProcessing] = useState(false);

    // Filter UTS and UAS assessment periods and submissions
    const utsPeriod = assessmentPeriods.find((p: any) => p.type === 'uts') || assessmentPeriods[0];
    const uasPeriod = assessmentPeriods.find((p: any) => p.type === 'uas') || assessmentPeriods[1];
    const utsSubmission = submissions.find((s: any) => s.assessment_period_id === utsPeriod?.id || s.assessmentPeriod?.type === 'uts');
    const uasSubmission = submissions.find((s: any) => s.assessment_period_id === uasPeriod?.id || s.assessmentPeriod?.type === 'uas');

    const proposalVersion = livingProposal?.latest_version_number || 1;
    const proposalStatus = livingProposal?.current_version?.status || livingProposal?.status || 'draft';

    const overallStatusLabel =
        project.status === 'completed' ? 'Selesai (Completed)' :
        uasSubmission?.status === 'accepted' ? 'Lulus UAS' :
        uasSubmission ? 'Evaluasi UAS' :
        utsSubmission?.status === 'accepted' ? 'Pengembangan Lanjutan' :
        utsSubmission ? 'Evaluasi UTS' :
        implementationProgress > 30 ? 'Pengerjaan Pra-UTS' :
        'Inisiasi & Perencanaan';

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Project Hub', href: '/projects' },
        { title: project.title, href: `/projects/${project.slug || project.id}` },
    ];

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const toggleBookmark = async () => {
        try {
            const res = await fetch(`/api/v1/projects/${project.id}/bookmark`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });
            const json = await res.json();
            setBookmarked(json.bookmarked);
        } catch {
            alert('Gagal memperbarui bookmark.');
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/projects/${project.id}/apply`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    recruitment_role_id: applyingRole?.id || null,
                    message: applyMessage,
                }),
            });

            if (res.ok) {
                alert('Lamaran kamu berhasil dikirim ke ketua tim!');
                setApplyingRole(null);
                setApplyMessage('');
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal mengirimkan lamaran.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecideApplication = async (appId: number, action: 'accept' | 'reject') => {
        setDecidingId(appId);
        try {
            const res = await fetch(`/projects/${project.id}/applications/${appId}/respond`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ action }),
            });

            if (res.ok) {
                setApplications((prev: any[]) =>
                    prev.map((a: any) =>
                        a.id === appId ? { ...a, status: action === 'accept' ? 'accepted' : 'rejected' } : a
                    )
                );
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal memproses lamaran.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setDecidingId(null);
        }
    };

    const handleActivateTeam = async () => {
        if (!confirm('Konfirmasi dan aktifkan formasi kelompok ini? Setelah diaktifkan, status proyek menjadi "Sedang Berjalan" dan Project Workspace resmi dibuka untuk seluruh anggota.')) return;
        setLifecycleProcessing(true);
        try {
            const res = await fetch(`/projects/${project.id}/activate-team`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });
            if (res.ok) {
                alert('Kelompok berhasil diaktifkan! Workspace proyek telah dibuka.');
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal mengaktifkan kelompok.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setLifecycleProcessing(false);
        }
    };

    // Calculate total documents
    const allDocuments = [
        ...(utsSubmission?.documents || []),
        ...(uasSubmission?.documents || []),
    ];

    const teamMembers = project.team?.members || [];

    // Comprehensive Project Hub Tabs
    const tabs = [
        { id: 'overview', label: 'Overview', icon: Layers },
        {
            id: 'formation',
            label: 'Alur Formasi',
            icon: UserCheck,
            badge: project.formation_status === 'workspace_activated' ? 'Aktif' : (project.formation_status ? project.formation_status.replace('_', ' ') : 'Draft'),
        },
        { id: 'requirements', label: 'Spesifikasi Tim', icon: Briefcase },
        { id: 'matchmaking', label: 'Smart Matchmaking', icon: Sparkles },
        {
            id: 'team_balance',
            label: 'Keseimbangan Tim',
            icon: PieChart,
            badge: teamBalance?.overall_score ? `${teamBalance.overall_score}%` : null,
        },
        {
            id: 'invitations',
            label: `Undangan (${sentInvitations.length + receivedInvitations.length})`,
            icon: Inbox,
            badge: receivedInvitations.length > 0 ? `${receivedInvitations.length} Baru` : null,
        },
        { id: 'proposal', label: 'Proposal', icon: FileText },
        { id: 'versions', label: `Versions (${livingProposal?.versions?.length || 1})`, icon: GitBranch },
        { id: 'tasks', label: `Tasks & Kanban (${(kanban.todo?.length || 0) + (kanban.in_progress?.length || 0) + (kanban.in_review?.length || 0) + (kanban.completed?.length || 0)})`, icon: FolderKanban },
        { id: 'milestones', label: `Milestones (${milestones.length})`, icon: Clock },
        { id: 'progress', label: `Progress (${implementationProgress}%)`, icon: Sparkles },
        { id: 'uts', label: 'UTS Assessment', icon: GraduationCap, badge: utsSubmission ? utsSubmission.status : null },
        { id: 'uas', label: 'UAS Assessment', icon: Award, badge: uasSubmission ? uasSubmission.status : null },
        { id: 'documents', label: `Documents (${allDocuments.length})`, icon: Download },
        { id: 'members', label: `Team Members (${teamMembers.length})`, icon: Users },
        { id: 'discussion', label: `Discussion (${discussions.length})`, icon: MessageSquare },
        { id: 'lecturer_review', label: `Lecturer Review (${guidances.length + (livingProposal?.current_version?.review_notes ? 1 : 0)})`, icon: GraduationCap },
        { id: 'evaluation', label: 'Evaluation', icon: ShieldCheck },
        { id: 'archive', label: 'Archive', icon: Archive },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${project.title} — RAKIT Campus Project Hub`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-6">
                    {/* Top navigation row */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs font-semibold text-slate-600 hover:text-blue-600 transition shadow-2xs"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Proyek</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            {project.team && (isMember || isLeader || isLecturer) && (
                                <Link
                                    href={`/workspace/${project.team.id}`}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                                >
                                    <FolderKanban className="size-3.5" />
                                    <span>Workspace Tim</span>
                                </Link>
                            )}

                            <button
                                onClick={toggleBookmark}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                                    bookmarked
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50'
                                }`}
                            >
                                <Bookmark className="size-3.5" />
                                <span>{bookmarked ? 'Tersimpan' : 'Simpan Proyek'}</span>
                            </button>
                        </div>
                    </div>

                    {/* HERO HEADER: 3 Distinct Status Indicators & Quick Actions */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div className="max-w-3xl">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                        {project.category?.replace('_', ' ')}
                                    </span>
                                    {project.academicClass && (
                                        <Link
                                            href={`/classes/${project.academicClass.code || project.academicClass.id}`}
                                            className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-900 text-white hover:bg-blue-600 transition"
                                        >
                                            Kelas: {project.academicClass.name} ({project.academicClass.code})
                                        </Link>
                                    )}
                                    <span className="text-xs font-semibold text-slate-500">
                                        Kesulitan: {project.difficulty || 'Intermediate'}
                                    </span>
                                </div>

                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                    {project.title}
                                </h1>

                                <p className="text-xs sm:text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                                    {project.short_description}
                                </p>

                                {/* 3 DISTINCT STATUS INDICATORS (MANDATORY REQUIREMENT) */}
                                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-200/60">
                                    {/* 1. Proposal Status */}
                                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 shadow-2xs flex items-center gap-2">
                                        <FileText className="size-4 text-blue-600" />
                                        <div className="text-[11px]">
                                            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Status Proposal</span>
                                            <strong className="text-slate-900 font-bold">
                                                Versi {proposalVersion} ({proposalStatus})
                                            </strong>
                                        </div>
                                    </div>

                                    {/* 2. Implementation Progress */}
                                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 shadow-2xs flex items-center gap-2">
                                        <FolderKanban className="size-4 text-emerald-600" />
                                        <div className="text-[11px]">
                                            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Progres Pengerjaan</span>
                                            <strong className="text-emerald-700 font-bold">
                                                {implementationProgress}% Implementasi
                                            </strong>
                                        </div>
                                    </div>

                                    {/* 3. Overall Project Status */}
                                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200 shadow-2xs flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-slate-700" />
                                        <div className="text-[11px]">
                                            <span className="text-slate-400 block font-semibold text-[10px] uppercase">Status Keseluruhan</span>
                                            <strong className="text-slate-900 font-bold">
                                                {overallStatusLabel}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right action block */}
                            <div className="flex flex-col sm:items-end justify-center gap-2.5 shrink-0">
                                <div className="text-right text-xs text-slate-500">
                                    <span>Ketua: <strong className="text-slate-900">{project.leader?.name}</strong></span>
                                    {project.academicClass?.lecturer && (
                                        <span className="block mt-0.5">Dosen: <strong className="text-slate-900">{project.academicClass.lecturer.name}</strong></span>
                                    )}
                                </div>

                                {/* Team activation button if leader and in recruitment */}
                                {isLeader && project.status === 'recruiting' && (
                                    <button
                                        onClick={handleActivateTeam}
                                        disabled={lifecycleProcessing}
                                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                                    >
                                        <UserCheck className="size-4" />
                                        <span>Konfirmasi Formasi & Buka Workspace</span>
                                    </button>
                                )}

                                {/* Apply button for eligible students */}
                                {!isMember && !isLecturer && !isLecturerAccount && project.status === 'recruiting' && (
                                    myApplication ? (
                                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                                            <Clock className="size-3.5" />
                                            <span>Lamaran {myApplication.status === 'pending' ? 'Sedang Ditinjau' : myApplication.status}</span>
                                        </span>
                                    ) : project.has_capacity && !userHasActiveProject && eligibility?.eligible !== false ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveTab('members');
                                                const firstRole = project.team?.recruitment?.roles?.[0] || { id: null, name: 'Anggota Tim Pengembang' };
                                                setApplyingRole(firstRole);
                                            }}
                                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                        >
                                            <Send className="size-4" />
                                            <span>Gabung Tim / Lamar Posisi</span>
                                        </button>
                                    ) : null
                                )}
                            </div>
                        </div>
                    </div>

                    {/* SEMESTER CAPSTONE TIMELINE VISUALIZER */}
                    <SemesterTimeline
                        proposalVersion={proposalVersion}
                        proposalStatus={proposalStatus}
                        implementationProgress={implementationProgress}
                        utsSubmission={utsSubmission}
                        uasSubmission={uasSubmission}
                        projectStatus={project.status}
                    />

                    {/* SEGMENTED 14 TABS NAVIGATION */}
                    <div className="glass-surface p-2 rounded-2xl overflow-x-auto scrollbar-none">
                        <div className="flex items-center gap-1 min-w-max">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                        }`}
                                    >
                                        <Icon className="size-3.5" />
                                        <span>{tab.label}</span>
                                        {tab.badge && (
                                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                                                isActive ? 'bg-white text-blue-600' : 'bg-slate-200 text-slate-700'
                                            }`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* TAB CONTENT SWITCHER */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 flex flex-col gap-6">
                                {/* Permasalahan */}
                                {project.problem_statement && (
                                    <div className="glass-card rounded-2xl p-6 shadow-xs">
                                        <h3 className="text-sm font-bold text-slate-900 mb-2">
                                            Permasalahan yang Diselesaikan
                                        </h3>
                                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                                            {project.problem_statement}
                                        </p>
                                    </div>
                                )}

                                {/* Solusi & Tujuan */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="glass-card rounded-2xl p-5 shadow-xs">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                            Tujuan Proyek
                                        </h4>
                                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                                            {project.objectives || 'Belum diisi.'}
                                        </p>
                                    </div>

                                    <div className="glass-card rounded-2xl p-5 shadow-xs">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                            Solusi yang Ditawarkan
                                        </h4>
                                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                                            {project.proposed_solution || 'Belum diisi.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Living Proposal Callout */}
                                <div className="glass-card rounded-2xl p-6 bg-blue-50/50 border-blue-200/80 flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                            Living Proposal Aktif (Versi {proposalVersion})
                                        </h4>
                                        <p className="text-xs text-slate-600 mt-0.5">
                                            {livingProposal?.current_version?.abstract || 'Proposal proyek sedang dalam tahap pengerjaan berkelanjutan.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('proposal')}
                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs shrink-0 cursor-pointer"
                                    >
                                        Buka Proposal →
                                    </button>
                                </div>
                            </div>

                            {/* Right sidebar */}
                            <div className="flex flex-col gap-6">
                                {/* Team Card */}
                                <div className="glass-card rounded-2xl p-6 shadow-xs">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                                        Anggota Tim ({teamMembers.length} Orang)
                                    </h3>
                                    <div className="flex flex-col gap-2.5">
                                        {teamMembers.map((m: any) => (
                                            <div key={m.id} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200/60">
                                                <div>
                                                    <span className="font-bold text-slate-900 block">{m.user?.name}</span>
                                                    <span className="text-[10px] text-slate-500">{m.role_name || (m.permission === 'leader' ? 'Leader' : 'Anggota')}</span>
                                                </div>
                                                {m.permission === 'leader' && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                                        Ketua
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tech Stack Card */}
                                <div className="glass-card rounded-2xl p-6 shadow-xs">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                                        Tech Stack
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 ? (
                                            project.tech_stack.map((t: string, idx: number) => (
                                                <span key={idx} className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-700">
                                                    {t}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-400">Laravel, React, PostgreSQL</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'formation' && (
                        <TeamFormationTab
                            project={project}
                            isLeader={isLeader}
                            isLecturer={isLecturer}
                            canAccessWorkspace={canAccessWorkspace}
                        />
                    )}

                    {activeTab === 'requirements' && (
                        <RequirementsTab
                            project={project}
                            isLeader={isLeader}
                            isLecturer={isLecturer}
                        />
                    )}

                    {activeTab === 'matchmaking' && (
                        <MatchmakingTab
                            project={project}
                            sameClassCandidates={sameClassCandidates}
                            classStudents={classStudents}
                            teamOptimization={teamOptimization}
                            teamBalance={teamBalance}
                            isLeader={isLeader}
                            isLecturer={isLecturer}
                        />
                    )}

                    {activeTab === 'team_balance' && (
                        <TeamBalanceTab
                            project={project}
                            teamBalance={teamBalance}
                            teamOptimization={teamOptimization}
                        />
                    )}

                    {activeTab === 'invitations' && (
                        <InvitationsTab
                            project={project}
                            sentInvitations={sentInvitations}
                            receivedInvitations={receivedInvitations}
                            isLeader={isLeader}
                            isLecturer={isLecturer}
                            userHasActiveProject={userHasActiveProject}
                        />
                    )}

                    {activeTab === 'proposal' && (
                        <LivingProposalTab
                            project={project}
                            livingProposal={livingProposal}
                            isLeader={isLeader}
                            isMember={isMember}
                            isLecturer={isLecturer}
                        />
                    )}

                    {activeTab === 'versions' && (
                        <ProposalVersionsTab
                            project={project}
                            livingProposal={livingProposal}
                        />
                    )}

                    {activeTab === 'tasks' && (
                        <TasksKanbanTab
                            project={project}
                            kanban={kanban}
                            isMember={isMember}
                            isLeader={isLeader}
                        />
                    )}

                    {activeTab === 'milestones' && (
                        <div className="flex flex-col gap-4">
                            <div className="glass-card rounded-2xl p-6 shadow-xs flex items-center justify-between">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                        <Clock className="size-5 text-blue-600" />
                                        <span>Roadmap Milestones Proyek Capstone</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Tahapan pencapaian proyek dari awal semester, UTS, hingga penyerahan UAS.
                                    </p>
                                </div>
                                <span className="text-xs font-bold text-slate-600">
                                    Total: <strong className="text-blue-600">{milestones.length} Milestones</strong>
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {milestones.map((m: any) => (
                                    <div key={m.id} className="glass-card rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                    m.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {m.status}
                                                </span>
                                                <span className="text-[11px] text-slate-400">{m.due_on || 'TBD'}</span>
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-900">{m.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description}</p>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100">
                                            <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                                                <span>Tugas Selesai</span>
                                                <span>{m.completed_tasks_count}/{m.tasks_count} ({m.progress}%)</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${m.progress}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'progress' && (
                        <div className="flex flex-col gap-6">
                            {/* Transparent Calculation Breakdown */}
                            <div className="glass-card rounded-2xl p-6 shadow-xs">
                                <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <Sparkles className="size-5 text-blue-600" />
                                    <span>Kalkulasi Progres Implementasi & Capstone Transparan</span>
                                </h3>
                                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                    Sistem menghitung persentase kemajuan proyek secara objektif menggunakan bobot terstandar: <strong>50% Penyelesaian Tugas (Kanban)</strong> + <strong>50% Pencapaian Milestones</strong>.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Komponen 1</span>
                                        <h4 className="text-xs font-bold text-slate-800">Tugas Kanban Selesai (50%)</h4>
                                        <span className="text-2xl font-black text-blue-600 mt-2 block">
                                            {kanban.completed?.length || 0} / {(kanban.todo?.length || 0) + (kanban.in_progress?.length || 0) + (kanban.in_review?.length || 0) + (kanban.completed?.length || 0)} Tugas
                                        </span>
                                    </div>

                                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Komponen 2</span>
                                        <h4 className="text-xs font-bold text-slate-800">Milestones Tercapai (50%)</h4>
                                        <span className="text-2xl font-black text-emerald-600 mt-2 block">
                                            {milestones.filter((m: any) => m.status === 'completed').length} / {milestones.length || 1} Milestones
                                        </span>
                                    </div>

                                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                                        <span className="text-[10px] font-black uppercase text-blue-800 block mb-1">Total Progres</span>
                                        <h4 className="text-xs font-bold text-blue-900">Progres Akhir Implementasi</h4>
                                        <span className="text-2xl font-black text-blue-700 mt-2 block">
                                            {implementationProgress}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Activity Log stream */}
                            <div className="glass-card rounded-2xl p-6 shadow-xs">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                                    Log Aktivitas & Audit Jejak Rekam Proyek ({activities.length})
                                </h4>
                                <div className="flex flex-col gap-3">
                                    {activities.map((act: any) => (
                                        <div key={act.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-2 rounded-full bg-blue-600" />
                                                <span className="font-bold text-slate-900">{act.actor?.name || 'Sistem'}</span>
                                                <span className="text-slate-600">{act.action?.replace('_', ' ')}</span>
                                            </div>
                                            <span className="text-[11px] text-slate-400">
                                                {act.created_at ? new Date(act.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'uts' && (
                        <AssessmentTab
                            project={project}
                            period={utsPeriod}
                            submission={utsSubmission}
                            isMember={isMember}
                            isLeader={isLeader}
                            isLecturer={isLecturer}
                            type="uts"
                        />
                    )}

                    {activeTab === 'uas' && (
                        <AssessmentTab
                            project={project}
                            period={uasPeriod}
                            submission={uasSubmission}
                            isMember={isMember}
                            isLeader={isLeader}
                            isLecturer={isLecturer}
                            type="uas"
                        />
                    )}

                    {activeTab === 'documents' && (
                        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Download className="size-5 text-blue-600" />
                                <span>Repositori Dokumen Proyek & Berkas Evaluasi</span>
                            </h3>

                            {allDocuments.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    Belum ada berkas laporan atau presentasi yang diunggah. Berkas akan otomatis terkumpul saat pengumpulan UTS dan UAS.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {allDocuments.map((doc: any) => (
                                        <a
                                            key={doc.id}
                                            href={`/storage/${doc.file_path}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 flex items-center justify-between text-xs transition"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <FileText className="size-5 text-blue-600 shrink-0" />
                                                <div className="truncate">
                                                    <span className="font-bold text-slate-800 block truncate">{doc.title}</span>
                                                    <span className="text-[10px] text-slate-400">{Math.round(doc.file_size / 1024)} KB</span>
                                                </div>
                                            </div>
                                            <Download className="size-4 text-slate-400" />
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div className="flex flex-col gap-6" id="recruitment-section">
                            {/* Members Grid */}
                            <div className="glass-card rounded-2xl p-6 shadow-xs">
                                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Users className="size-5 text-blue-600" />
                                    <span>Anggota Kelompok Proyek Capstone ({teamMembers.length} Orang)</span>
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {teamMembers.map((m: any) => (
                                        <div key={m.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-slate-900">{m.user?.name}</span>
                                                {m.permission === 'leader' ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                                        Ketua Tim
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-500 font-semibold">
                                                        Anggota
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-blue-600 font-semibold">{m.role_name || 'Fullstack Developer'}</span>
                                            <span className="text-[11px] text-slate-400">{m.user?.email}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Open Recruitment Roles & Join Team Section */}
                            {project.status === 'recruiting' && (
                                <div className="glass-card rounded-2xl p-6 shadow-xs">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                                <Briefcase className="size-5 text-emerald-600" />
                                                <span>Rekrutmen Terbuka & Posisi Tim</span>
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Pilih posisi yang sesuai dengan keahlian kamu untuk mengajukan diri bergabung ke kelompok ini.
                                            </p>
                                        </div>
                                        {project.has_capacity ? (
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start">
                                                Slot Tim Tersedia
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 self-start">
                                                Kapasitas Penuh
                                            </span>
                                        )}
                                    </div>

                                    {myApplication && (
                                        <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                                            <div>
                                                <strong className="block">Status Lamaran Kamu: {myApplication.status === 'pending' ? 'Menunggu Persetujuan Ketua Tim' : myApplication.status}</strong>
                                                <span className="text-amber-800">Posisi yang dilamar: {myApplication.role?.name || 'Anggota Tim'}</span>
                                            </div>
                                        </div>
                                    )}

                                    {!isMember && !isLecturer && !isLecturerAccount && !myApplication && eligibility && !eligibility.eligible && eligibility.reason && (
                                        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                                            <Lock className="size-4 text-rose-600 mt-0.5 shrink-0" />
                                            <span>{eligibility.reason}</span>
                                        </div>
                                    )}

                                    {project.team?.recruitment?.roles && project.team.recruitment.roles.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            {project.team.recruitment.roles.map((role: any) => (
                                                <div
                                                    key={role.id}
                                                    className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                                >
                                                    <div>
                                                        <h4 className="text-xs font-bold text-slate-900">{role.name}</h4>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                                            Kebutuhan: {role.slots || 1} slot • {role.requirements || 'Keahlian teknis relevan dengan proyek'}
                                                        </p>
                                                    </div>

                                                    {!isMember && !isLecturer && !isLecturerAccount && !myApplication && project.has_capacity && eligibility?.eligible !== false && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setApplyingRole(role)}
                                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                                                        >
                                                            <Send className="size-3" />
                                                            <span>Lamar Posisi Ini</span>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <p className="text-xs text-slate-600">
                                                Tim ini masih membuka pendaftaran anggota pengembang baru.
                                            </p>
                                            {!isMember && !isLecturer && !isLecturerAccount && !myApplication && project.has_capacity && eligibility?.eligible !== false && (
                                                <button
                                                    type="button"
                                                    onClick={() => setApplyingRole({ id: null, name: 'Anggota Tim Pengembang' })}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer inline-flex items-center gap-1.5"
                                                >
                                                    <Send className="size-3" />
                                                    <span>Gabung Tim</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Leader Incoming Applications */}
                            {isLeader && applications.length > 0 && (
                                <div className="glass-card rounded-2xl p-6 shadow-xs">
                                    <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                                        <UserCheck className="size-4 text-blue-600" />
                                        <span>Aplikasi Pelamar ({applications.length})</span>
                                    </h4>

                                    <div className="flex flex-col gap-3">
                                        {applications.map((app: any) => (
                                            <div key={app.id} className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-900">{app.user?.name}</span>
                                                    <span className="text-xs text-slate-500 ml-2">({app.user?.email})</span>
                                                    <span className="text-xs text-blue-600 block mt-0.5">Posisi: {app.role?.name || 'Anggota'}</span>
                                                    {app.message && <p className="text-xs text-slate-600 italic mt-1">"{app.message}"</p>}
                                                </div>

                                                {(app.status === 'pending' || app.status === 'submitted') && (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleDecideApplication(app.id, 'reject')}
                                                            disabled={decidingId === app.id}
                                                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl cursor-pointer"
                                                        >
                                                            Tolak
                                                        </button>
                                                        <button
                                                            onClick={() => handleDecideApplication(app.id, 'accept')}
                                                            disabled={decidingId === app.id}
                                                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                                                        >
                                                            Terima Jadi Anggota
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'discussion' && (
                        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <MessageSquare className="size-5 text-blue-600" />
                                <span>Forum Diskusi & Pengumuman Internal Kelompok</span>
                            </h3>

                            {discussions.length === 0 ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    Belum ada utas diskusi aktif. Tim dapat memanfaatkan fitur diskusi untuk berkoordinasi.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {discussions.map((d: any) => (
                                        <div key={d.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-900">{d.author?.name}</span>
                                                <span className="text-slate-400">{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</span>
                                            </div>
                                            <p className="text-xs text-slate-700 mt-1 leading-relaxed">{d.body}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'lecturer_review' && (
                        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <GraduationCap className="size-5 text-blue-600" />
                                <span>Riwayat Bimbingan & Arahan Dosen Pengampu</span>
                            </h3>

                            {guidances.length === 0 && !livingProposal?.current_version?.review_notes ? (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    Belum ada catatan bimbingan dosen yang tercatat untuk proyek ini.
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {livingProposal?.current_version?.review_notes && (
                                        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-blue-900">Ulasan Living Proposal Versi {proposalVersion}</span>
                                                <span className="text-slate-400">Catatan Resmi</span>
                                            </div>
                                            <p className="text-xs text-slate-800 whitespace-pre-line mt-1">{livingProposal.current_version.review_notes}</p>
                                        </div>
                                    )}

                                    {guidances.map((g: any) => (
                                        <div key={g.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col gap-1">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-900">{g.title}</span>
                                                <span className="text-slate-400">{g.created_at ? new Date(g.created_at).toLocaleDateString() : ''}</span>
                                            </div>
                                            <p className="text-xs text-slate-700 mt-1">{g.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'evaluation' && (
                        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <ShieldCheck className="size-5 text-blue-600" />
                                <span>Rekapitulasi Nilai & Evaluasi Akademik Capstone</span>
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Evaluasi Tengah Semester (UTS - 40%)</span>
                                        <span className="text-2xl font-black text-blue-600">
                                            {utsSubmission?.total_score ? `${utsSubmission.total_score} (${utsSubmission.final_grade})` : 'Belum Dinilai'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 mt-2">
                                        Status: {utsSubmission?.status || 'Belum Ada Penyerahan'}
                                    </span>
                                </div>

                                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Evaluasi Akhir Semester (UAS - 60%)</span>
                                        <span className="text-2xl font-black text-emerald-600">
                                            {uasSubmission?.total_score ? `${uasSubmission.total_score} (${uasSubmission.final_grade})` : 'Belum Dinilai'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 mt-2">
                                        Status: {uasSubmission?.status || 'Belum Ada Penyerahan'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'archive' && (
                        <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Archive className="size-5 text-blue-600" />
                                <span>Arsip Portofolio Capstone & Sertifikat Mahasiswa</span>
                            </h3>

                            {project.status === 'completed' ? (
                                <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="size-5 text-emerald-600" />
                                        <h4 className="text-sm font-bold text-emerald-900">
                                            Proyek Capstone Resmi Dinyatakan Selesai (Completed)!
                                        </h4>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed">
                                        Seluruh dokumen (Living Proposal, Riwayat Revisi, Snapshot UTS & UAS) telah diarsipkan permanen. Pembatasan Rule 1 bagi seluruh anggota tim telah resmi dilepas.
                                    </p>

                                    {achievements.length > 0 && (
                                        <div className="pt-2">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-2">
                                                Sertifikat Portofolio Terverifikasi:
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {achievements.map((ach: any) => (
                                                    <div key={ach.id} className="p-3 bg-white rounded-xl border border-emerald-200 text-xs flex items-center justify-between">
                                                        <div>
                                                            <span className="font-bold text-slate-900 block">{ach.user?.name}</span>
                                                            <span className="text-[10px] text-emerald-600 font-semibold">Portofolio Terverifikasi Dosen</span>
                                                        </div>
                                                        <Award className="size-4 text-amber-500" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-xs text-slate-400">
                                    Proyek masih aktif berjalan. Arsip dan sertifikat portofolio otomatis diterbitkan setelah evaluasi UAS selesai.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* APPLY ROLE MODAL */}
            {applyingRole && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="glass-surface bg-white/95 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-white flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                                    Lamaran Posisi Tim
                                </span>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Lamar sebagai {applyingRole.name}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Kirim pesan perkenalan singkat kepada ketua tim proyek {project.title}.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setApplyingRole(null)}
                                className="size-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleApply} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                    Pesan Singkat & Portofolio Relevan *
                                </label>
                                <textarea
                                    value={applyMessage}
                                    onChange={(e) => setApplyMessage(e.target.value)}
                                    placeholder="Jelaskan keahlian, pengalaman relevan, atau kontribusi yang ingin Anda berikan..."
                                    required
                                    rows={4}
                                    className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setApplyingRole(null)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50 shadow-xs cursor-pointer"
                                >
                                    {submitting ? 'Mengirim...' : 'Kirim Lamaran'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
