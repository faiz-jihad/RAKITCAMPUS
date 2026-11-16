import { formatWhatsAppUrl } from '@/components/competitions/ApplyCompetitionTeamModal';
import { getCompetitionCover } from '@/lib/competition-cover';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowDown,
    ArrowLeft,
    Award,
    Briefcase,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Copy,
    Download,
    ExternalLink,
    Eye,
    FileText,
    Filter,
    Folder,
    FolderArchive,
    FolderKanban,
    FolderOpen,
    GitBranch,
    Github,
    Globe,
    GraduationCap,
    HardDrive,
    History,
    Image as ImageIcon,
    Info,
    LayoutGrid,
    Linkedin,
    List,
    Lock,
    Mail,
    PenLine,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    Trash2,
    Upload,
    UserCheck,
    UserMinus,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import React, { useState } from 'react';
import GitHubContributionMonitor from '@/components/github/GitHubContributionMonitor';

interface Props {
    participation: any;
    readinessScore: number;
    recommendedCandidates: any[];
    availableLecturers: any[];
    selectionStages: Record<string, { label: string; order: number }>;
    teamAllocations?: any[];
    incomingApplications?: any[];
    recruitmentRoles?: any[];
    rounds?: any[];
    isLeader: boolean;
    isMember: boolean;
    isMentor: boolean;
    isAdmin: boolean;
    storageQuota?: {
        used_bytes: number;
        used_mb: number;
        max_bytes: number;
        max_mb: number;
        remaining_bytes: number;
        remaining_mb: number;
        percent_used: number;
    };
    githubRepo?: any;
    githubData?: any;
    canManageGitHub?: boolean;
    availableStudents?: any[];
    sentInvitations?: any[];
    myPendingInvitation?: any;
}

export default function CompetitionWorkspace({
    participation,
    readinessScore,
    recommendedCandidates = [],
    availableStudents = [],
    sentInvitations = [],
    availableLecturers = [],
    selectionStages,
    teamAllocations = [],
    incomingApplications = [],
    recruitmentRoles = [],
    rounds = [],
    isLeader,
    isMember,
    isMentor,
    isAdmin,
    storageQuota,
    githubRepo,
    githubData,
    canManageGitHub = false,
    myPendingInvitation,
}: Props) {
    const canManageTasks = Boolean(isMember || isLeader || isAdmin);
    const [activeTab, setActiveTab] = useState<'overview' | 'applicants' | 'kanban' | 'github' | 'documents' | 'history'>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'github' || window.location.hash === '#github') {
                return 'github';
            }
        }
        return 'overview';
    });

    // MinSatu Roles & Applicants State
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleSlots, setNewRoleSlots] = useState(1);
    const [newRoleReqs, setNewRoleReqs] = useState('');
    const [addingRole, setAddingRole] = useState(false);

    // In-Workspace Direct Invitation Acceptance State
    const [isAcceptingOffer, setIsAcceptingOffer] = useState(false);
    const [isDecliningOffer, setIsDecliningOffer] = useState(false);

    const handleAcceptOffer = (invitationId: number) => {
        setIsAcceptingOffer(true);
        router.post(
            `/competition-invitations/${invitationId}/accept`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsAcceptingOffer(false),
            }
        );
    };

    const handleDeclineOffer = (invitationId: number) => {
        const reason = prompt('Alasan menolak tawaran (opsional):');
        setIsDecliningOffer(true);
        router.post(
            `/competition-invitations/${invitationId}/decline`,
            { reason },
            {
                preserveScroll: true,
                onFinish: () => setIsDecliningOffer(false),
            }
        );
    };

    // Modals
    const [stageModalOpen, setStageModalOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [exploreModalOpen, setExploreModalOpen] = useState(false);
    const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [candidateRoleName, setCandidateRoleName] = useState('Anggota Tim');
    const [inviteMessage, setInviteMessage] = useState('');
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [docModalOpen, setDocModalOpen] = useState(false);
    const [replaceModalOpen, setReplaceModalOpen] = useState(false);
    const [selectedDocToReplace, setSelectedDocToReplace] = useState<any>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewDocId, setReviewDocId] = useState<number | null>(null);
    const [selectedDocFolder, setSelectedDocFolder] = useState<string>('all');
    const [docSearchQuery, setDocSearchQuery] = useState<string>('');
    const [docViewMode, setDocViewMode] = useState<'list' | 'grid'>('list');
    const [dragOverFolderKey, setDragOverFolderKey] = useState<string | null>(null);
    const [selectedApplicantModal, setSelectedApplicantModal] = useState<any>(null);
    const [aiGenerating, setAiGenerating] = useState(false);

    // AI Task Orchestrator Modal State
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiFocus, setAiFocus] = useState('');
    const [aiTrack, setAiTrack] = useState(participation.category_track || '');
    const [aiMode, setAiMode] = useState<'append' | 'replace'>('replace');

    // Kanban filtering, search, and export
    const [kanbanPriorityFilter, setKanbanPriorityFilter] = useState<string>('all');
    const [kanbanSearch, setKanbanSearch] = useState<string>('');
    const [copiedRoadmap, setCopiedRoadmap] = useState(false);

    // Page Flash Props
    const { flash } = usePage().props as any;
    const [dismissedFlash, setDismissedFlash] = useState(false);

    // Form states
    const stageForm = useForm({
        stage: participation.stage || 'recruiting',
        notes: '',
        external_registration_proof: participation.external_registration_proof || '',
        external_submission_proof: participation.external_submission_proof || '',
    });

    const taskForm = useForm({
        title: '',
        description: '',
        priority: 'medium',
        due_on: '',
        assignee_id: '',
    });

    // Trello Kanban drag and inline add state
    const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
    const [dragOverCol, setDragOverCol] = useState<string | null>(null);
    const [inlineAddingCol, setInlineAddingCol] = useState<string | null>(null);
    const [inlineTitle, setInlineTitle] = useState('');
    const [mobileKanbanCol, setMobileKanbanCol] = useState<'all' | 'todo' | 'in_progress' | 'in_review' | 'completed'>('all');

    // Team Rename State
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [newTeamName, setNewTeamName] = useState(participation.team?.name || '');
    const [isRenaming, setIsRenaming] = useState(false);

    const handleRenameTeam = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTeamName.trim() || !participation.team?.id) return;
        setIsRenaming(true);
        router.patch(
            `/competitions/teams/${participation.team.id}/rename`,
            { name: newTeamName.trim() },
            {
                onSuccess: () => {
                    setRenameModalOpen(false);
                    setIsRenaming(false);
                },
                onError: () => setIsRenaming(false),
            }
        );
    };

    const docForm = useForm({
        required_document_key: 'proposal',
        competition_round_id: '' as string | number,
        name: '',
        description: '',
        url: '',
        external_submission_url: '',
        deadline: '',
        file: null as File | null,
    });

    const replaceForm = useForm({
        name: '',
        file: null as File | null,
        url: '',
        mode: 'replace' as 'replace' | 'new_version',
    });

    const reviewForm = useForm({
        status: 'approved',
        feedback: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Competition Hub', href: '/competitions' },
        { title: participation.competition?.name || 'Kompetisi', href: `/competitions/${participation.competition?.slug || participation.competition?.id}` },
        { title: `Workspace: ${participation.team?.name}`, href: `/competition-workspace/${participation.competition?.slug || participation.id}` },
    ];

    // Handlers
    const handleStageUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        stageForm.post(route('competitions.stage.update', participation.id), {
            onSuccess: () => setStageModalOpen(false),
        });
    };

    const handleLockFormation = () => {
        if (confirm('Kunci susunan tim kompetisi ini? Setelah dikunci, tim tidak dapat menambah anggota baru.')) {
            router.post(route('competitions.lock-formation', participation.id));
        }
    };

    const handleApproveFormation = () => {
        const notes = prompt('Masukkan catatan persetujuan susunan tim (opsional):');
        if (notes !== null) {
            router.post(route('competitions.formation.approve', participation.id), { notes });
        }
    };

    const handleWithdrawMember = (userId: number, userName: string) => {
        const isSelf = userId === participation.team?.members?.find((m: any) => m.user_id === userId)?.user_id && !isLeader;
        const msg = isSelf
            ? 'Apakah Anda yakin ingin mengundurkan diri dari tim kompetisi ini?'
            : `Apakah Anda yakin ingin melepas keanggotaan ${userName} dari tim kompetisi?`;

        if (confirm(msg)) {
            const reason = prompt('Masukkan alasan pelepasan / pengunduran diri:');
            if (reason !== null) {
                router.post(route('competitions.members.withdraw', [participation.id, userId]), { reason });
            }
        }
    };

    const openInviteModalForCandidate = (cand: any) => {
        setSelectedCandidate(cand);
        if (recruitmentRoles && recruitmentRoles.length > 0) {
            setCandidateRoleName(recruitmentRoles[0].name);
        } else {
            setCandidateRoleName('Anggota Tim');
        }
        const candidateName = cand.user?.name || cand.name || 'Rekan';
        setInviteMessage(`Halo ${candidateName}, mari bergabung dengan tim ${participation.team?.name || ''} untuk kompetisi ${participation.competition?.name || ''}!`);
        setInviteModalOpen(true);
    };

    const handleInviteCandidate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCandidate) return;

        const studentId = selectedCandidate.user?.id || selectedCandidate.id;
        router.post(
            route('competitions.invitations.send', participation.id),
            {
                student_id: studentId,
                role_name: candidateRoleName,
                message: inviteMessage,
            },
            {
                onSuccess: () => {
                    setInviteModalOpen(false);
                    setSelectedCandidate(null);
                    setInviteMessage('');
                    setExploreModalOpen(false);
                },
            }
        );
    };

    const handleCancelInvitation = (invitationId: number) => {
        if (!confirm('Apakah Anda yakin ingin membatalkan undangan ini?')) return;
        router.post(
            route('competitions.invitations.cancel', invitationId),
            {},
            { preserveScroll: true }
        );
    };

    // MinSatu Flow Handlers
    const handleAddRecruitmentRole = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        router.post(
            `/competition-workspace/${participation.competition?.slug || participation.id}/roles`,
            {
                name: newRoleName.trim(),
                slots: newRoleSlots,
                requirements: newRoleReqs.trim() || null,
            },
            {
                onSuccess: () => {
                    setNewRoleName('');
                    setNewRoleSlots(1);
                    setNewRoleReqs('');
                    setAddingRole(false);
                },
            }
        );
    };

    const handleDeleteRecruitmentRole = (roleId: number) => {
        if (confirm('Hapus lowongan peran ini?')) {
            router.delete(`/competition-workspace/${participation.competition?.slug || participation.id}/roles/${roleId}`);
        }
    };

    const handleRespondApplication = (appId: number, action: 'accept' | 'reject') => {
        const confirmMsg =
            action === 'accept'
                ? 'Terima pelamar ini sebagai anggota tim kompetisi?'
                : 'Tolak lamaran mahasiswa ini?';

        if (confirm(confirmMsg)) {
            router.post(
                `/competitions/teams/${participation.id}/applications/${appId}/respond`,
                { action }
            );
        }
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        taskForm.post(route('competitions.tasks.create', participation.id), {
            onSuccess: () => {
                setTaskModalOpen(false);
                taskForm.reset();
            },
        });
    };

    const handleUpdateTaskStatus = (taskId: number, status: string) => {
        router.patch(
            route('competitions.tasks.update', [participation.id, taskId]),
            { status },
            { preserveScroll: true }
        );
    };

    const handleQuickAddTask = (colKey: string) => {
        if (!inlineTitle.trim()) return;
        router.post(
            route('competitions.tasks.create', participation.id),
            {
                title: inlineTitle.trim(),
                status: colKey,
                priority: 'medium',
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setInlineTitle('');
                    setInlineAddingCol(null);
                },
            }
        );
    };

    const handleOpenAiModal = () => {
        if (!aiTrack) {
            setAiTrack(participation.category_track || participation.competition?.category || '');
        }
        setAiModalOpen(true);
    };

    const handleExecuteAiGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        setAiGenerating(true);
        router.post(
            route('competitions.tasks.ai-generate', participation.id),
            {
                focus: aiFocus.trim() || null,
                track: aiTrack.trim() || null,
                mode: aiMode,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAiModalOpen(false);
                    setActiveTab('kanban');
                    setDismissedFlash(false);
                },
                onFinish: () => {
                    setAiGenerating(false);
                },
            }
        );
    };

    const handleDeleteTask = (taskId: number, taskTitle: string) => {
        if (confirm(`Hapus tugas "${taskTitle}" dari papan tugas?`)) {
            router.delete(route('competitions.tasks.destroy', [participation.id, taskId]), {
                preserveScroll: true,
            });
        }
    };

    const handleCopyRoadmap = () => {
        const tasks = participation.team?.tasks || [];
        if (tasks.length === 0) {
            alert('Belum ada tugas di papan untuk disalin.');
            return;
        }

        let text = `📋 ROADMAP & CHECKLIST TUGAS TIM: ${participation.team?.name || 'Tim'}\n`;
        text += `Kompetisi: ${participation.competition?.name}\n`;
        text += `Jalur: ${participation.category_track || '-'}\n`;
        text += `Total Tugas: ${tasks.length} | Selesai: ${tasks.filter((t: any) => t.status === 'completed').length}\n`;
        text += `=====================================\n\n`;

        const cols = [
            { key: 'todo', label: 'To Do (Belum Dimulai)' },
            { key: 'in_progress', label: 'In Progress (Sedang Dikerjakan)' },
            { key: 'in_review', label: 'In Review (Ulasan / Evaluasi)' },
            { key: 'completed', label: 'Done (Selesai)' },
        ];

        cols.forEach(col => {
            const colTasks = tasks.filter((t: any) => t.status === col.key);
            text += `📌 ${col.label.toUpperCase()} (${colTasks.length}):\n`;
            if (colTasks.length === 0) {
                text += `  - (Belum ada tugas)\n`;
            } else {
                colTasks.forEach((t: any) => {
                    const check = col.key === 'completed' ? '[x]' : '[ ]';
                    const assignee = t.assignee?.name ? ` @${t.assignee.name.split(' ')[0]}` : '';
                    const due = t.due_on ? ` (Tenggat: ${t.due_on})` : '';
                    text += `  ${check} ${t.title} [${t.priority}]${assignee}${due}\n`;
                });
            }
            text += `\n`;
        });

        navigator.clipboard.writeText(text).then(() => {
            setCopiedRoadmap(true);
            setTimeout(() => setCopiedRoadmap(false), 3000);
        });
    };

    const handleDragStart = (e: React.DragEvent, taskId: number, fromCol: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.setData('application/json', JSON.stringify({ taskId, fromCol }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, colKey: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverCol !== colKey) setDragOverCol(colKey);
    };

    const handleDragLeave = (e: React.DragEvent, colKey: string) => {
        if (dragOverCol === colKey) setDragOverCol(null);
    };

    const handleDrop = (e: React.DragEvent, targetCol: string) => {
        e.preventDefault();
        setDragOverCol(null);
        setDraggedTaskId(null);

        const dataStr = e.dataTransfer.getData('application/json');
        if (!dataStr) return;

        try {
            const { taskId, fromCol } = JSON.parse(dataStr);
            if (fromCol === targetCol) return;
            handleUpdateTaskStatus(taskId, targetCol);
        } catch {
            // ignore
        }
    };

    const handleUploadDoc = (e: React.FormEvent) => {
        e.preventDefault();
        docForm.post(route('competitions.deliverables.submit', participation.id), {
            forceFormData: true,
            onSuccess: () => {
                setDocModalOpen(false);
                docForm.reset();
            },
        });
    };

    const openReplaceModal = (doc: any) => {
        setSelectedDocToReplace(doc);
        replaceForm.setData({
            name: doc.name || '',
            file: null,
            url: doc.url || '',
            mode: 'replace',
        });
        setReplaceModalOpen(true);
    };

    const handleReplaceDoc = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDocToReplace) return;

        replaceForm.post(route('competitions.documents.replace', [participation.id, selectedDocToReplace.id]), {
            forceFormData: true,
            onSuccess: () => {
                setReplaceModalOpen(false);
                setSelectedDocToReplace(null);
                replaceForm.reset();
            },
        });
    };

    const handleDeleteDoc = (doc: any) => {
        if (confirm(`Apakah Anda yakin ingin menghapus berkas "${doc.name}"? Berkas fisik yang terunggah juga akan dihapus permanen.`)) {
            router.delete(route('competitions.documents.delete', [participation.id, doc.id]));
        }
    };

    const handleReviewDoc = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewDocId) return;

        reviewForm.post(route('competitions.deliverables.review', [participation.id, reviewDocId]), {
            onSuccess: () => {
                setReviewModalOpen(false);
                setReviewDocId(null);
                reviewForm.reset();
            },
        });
    };

    // Folder Categories for File Explorer UI
    const DOC_FOLDERS = [
        { key: 'proposal', label: 'Proposal & Makalah', desc: 'Latar belakang ide, analisis inovasi, & perancangan', formats: 'PDF, DOCX, ZIP', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        { key: 'pitch_deck', label: 'Pitch Deck & Slide', desc: 'Slide presentasi karya untuk juri & kurasi', formats: 'PDF, PPTX, URL', icon: Briefcase, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
        { key: 'video_demo', label: 'Video Demo & Media', desc: 'Video demonstrasi produk / teaser karya', formats: 'YouTube, Drive, MP4', icon: Globe, color: 'text-violet-600 bg-violet-50 border-violet-200' },
        { key: 'repo_url', label: 'Kode & Repositori Git', desc: 'Tautan GitHub atau kode sumber proyek', formats: 'GitHub, GitLab, ZIP', icon: GitBranch, color: 'text-slate-700 bg-slate-100 border-slate-200' },
        { key: 'poster', label: 'Poster & Infografis', desc: 'Desain poster publikasi dan infografis kompetisi', formats: 'PNG, JPG, PDF', icon: ImageIcon, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
        { key: 'registration_proof', label: 'Bukti Administrasi', desc: 'KTM, surat tugas, bukti registrasi resmi', formats: 'PDF, JPG, PNG', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    ];

    // Standard Deliverables List
    const deliverableTemplates = [
        { key: 'proposal', label: 'Proposal / Makalah Proyek', desc: 'Dokumen latar belakang, analisis inovasi, dan perancangan' },
        { key: 'pitch_deck', label: 'Pitch Deck / Presentasi', desc: 'Slide ringkas presentasi karya untuk juri' },
        { key: 'video_demo', label: 'Video Demo / Teaser', desc: 'Tautan video demonstrasi produk atau prototype berjalan' },
        { key: 'repo_url', label: 'Repositori Kode / Git', desc: 'Tautan GitHub/GitLab kode sumber proyek' },
        { key: 'poster', label: 'Poster Publikasi / Infografis', desc: 'Desain visual ringkasan karya kompetisi' },
        { key: 'registration_proof', label: 'Bukti Pendaftaran Resmi', desc: 'Kartu peserta atau screenshot konfirmasi portal penyelenggara' },
    ];

    const pendingAppsCount = incomingApplications.filter((a: any) => a.status === 'pending').length;
    const hasInvitations = participation.team?.invitations && participation.team.invitations.length > 0;
    const hasAllocations = teamAllocations.length > 0;

    // Executive KPI stats calculation
    const tasks = participation.team?.tasks || [];
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'completed').length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress').length;
    const reviewTasks = tasks.filter((t: any) => t.status === 'in_review').length;
    const todoTasks = tasks.filter((t: any) => t.status === 'todo').length;
    const taskPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const deadlineDate = participation.competition?.registration_deadline ? new Date(participation.competition.registration_deadline) : null;
    const now = new Date();
    const daysLeft = deadlineDate ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const formattedDeadline = deadlineDate
        ? deadlineDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Terbuka';

    const membersCount = participation.team?.members?.length || 0;
    const capacity = participation.team?.capacity || participation.competition?.max_team_size || 5;
    const docs = participation.documents || [];
    const totalDocs = docs.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Workspace: ${participation.team?.name} — ${participation.competition?.name}`} />

            <div className="max-w-7xl mx-auto space-y-6 pb-16">
                {/* GLOBAL FLASH ALERTS */}
                {flash?.success && !dismissedFlash && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs sm:text-sm shadow-xs transition animate-in fade-in">
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="size-4.5 text-blue-400 shrink-0" />
                            <span className="font-semibold leading-relaxed">{flash.success}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDismissedFlash(true)}
                            className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer transition"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                )}
                {flash?.error && !dismissedFlash && (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-900 text-xs sm:text-sm shadow-xs transition animate-in fade-in">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle className="size-4.5 text-slate-700 shrink-0" />
                            <span className="font-semibold leading-relaxed">{flash.error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDismissedFlash(true)}
                            className="text-slate-500 hover:text-slate-900 p-1 rounded-md cursor-pointer transition"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {/* INVITATION OFFER BANNER (Direct in-workspace acceptance) */}
                {myPendingInvitation && (
                    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-100/50 to-emerald-500/10 border-2 border-amber-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
                        <div className="flex items-start gap-4">
                            <div className="size-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Trophy className="size-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                                        Tawaran Bergabung Tim Lomba
                                    </span>
                                    <span className="text-xs text-slate-500">• {myPendingInvitation.created_at || 'Baru saja'}</span>
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                                    Anda diundang bergabung ke tim "{participation.team?.name}" sebagai <span className="text-blue-700 font-bold">{myPendingInvitation.role_name}</span>!
                                </h3>
                                <p className="text-xs text-slate-600 mt-0.5">
                                    Diundang oleh <strong>{myPendingInvitation.inviter?.name || 'Ketua Tim'}</strong> untuk persiapan kompetisi <strong>{participation.competition?.name}</strong>.
                                    {myPendingInvitation.message && <span className="italic block mt-1">"{myPendingInvitation.message}"</span>}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                            <button
                                type="button"
                                disabled={isAcceptingOffer}
                                onClick={() => handleAcceptOffer(myPendingInvitation.id)}
                                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                <CheckCircle2 className="size-4" />
                                <span>{isAcceptingOffer ? 'Memproses...' : 'Terima Tawaran & Resmi Masuk Tim'}</span>
                            </button>
                            <button
                                type="button"
                                disabled={isDecliningOffer}
                                onClick={() => handleDeclineOffer(myPendingInvitation.id)}
                                className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-700 font-semibold text-xs transition disabled:opacity-50 cursor-pointer"
                            >
                                {isDecliningOffer ? 'Menolak...' : 'Tolak Tawaran'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 1. TOP HEADER & ACTIONS */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                    <div className="space-y-1">
                        <Link
                            href={`/competitions/${participation.competition?.slug || participation.competition?.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Detail Kompetisi</span>
                        </Link>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                                {participation.team?.name || 'Tim Mahasiswa'}
                            </h1>
                            <span className="text-xs font-semibold text-slate-300">•</span>
                            <span className="text-xs sm:text-sm font-semibold text-slate-600 truncate max-w-sm sm:max-w-md">
                                {participation.competition?.name}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setNewTeamName(participation.team?.name || '');
                                    setRenameModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-[11px] font-bold text-slate-600 hover:text-blue-600 transition cursor-pointer"
                                title="Ubah Nama Tim"
                            >
                                <PenLine className="size-3" />
                                <span>Ubah</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Reference / External Links */}
                        {participation.competition?.official_url && (
                            <a
                                href={participation.competition.official_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition"
                                title="Website Resmi Kompetisi"
                            >
                                <Globe className="size-3.5 text-slate-400 shrink-0" />
                                <span className="hidden sm:inline">Website Resmi</span>
                                <ExternalLink className="size-3 text-slate-400 shrink-0" />
                            </a>
                        )}

                        {participation.competition?.registration_url && (
                            <a
                                href={participation.competition.registration_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition"
                                title="Portal Pendaftaran Resmi"
                            >
                                <span>Portal Pendaftaran</span>
                                <ExternalLink className="size-3 text-slate-400 shrink-0" />
                            </a>
                        )}

                        {/* GitHub Integration Shortcut */}
                        <button
                            type="button"
                            onClick={() => setActiveTab('github')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900 transition cursor-pointer shadow-2xs"
                            title="Buka Monitoring GitHub Tim"
                        >
                            <Github className="size-3.5 text-slate-700" />
                            {githubRepo ? (
                                <>
                                    <span className="font-mono text-[11px] truncate max-w-[120px] text-slate-800">
                                        {githubRepo.full_name}
                                    </span>
                                    <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                </>
                            ) : (
                                <span className="text-[11px] text-slate-500">
                                    + GitHub
                                </span>
                            )}
                        </button>

                        {/* Team Operations Dropdown */}
                        {(isLeader || isMentor || isAdmin) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                                    >
                                        <span>Kelola Tim</span>
                                        <ChevronDown className="size-3 text-slate-400 shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 p-1 rounded-xl shadow-lg border border-slate-200 bg-white z-50">
                                    <DropdownMenuItem
                                        onClick={() => setStageModalOpen(true)}
                                        className="cursor-pointer gap-2 text-xs font-semibold text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100"
                                    >
                                        <Sparkles className="size-3.5 text-blue-600" />
                                        <span>Update Tahapan Seleksi</span>
                                    </DropdownMenuItem>

                                    {(isMentor || isAdmin) && participation.formation_status !== 'approved' && (
                                        <>
                                            <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                            <DropdownMenuItem
                                                onClick={handleApproveFormation}
                                                className="cursor-pointer gap-2 text-xs font-bold text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-50"
                                            >
                                                <ShieldCheck className="size-3.5 text-emerald-600" />
                                                <span>Setujui Formasi Tim</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}

                                    {isLeader && !participation.is_formation_locked && (
                                        <>
                                            <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                            <DropdownMenuItem
                                                onClick={handleLockFormation}
                                                className="cursor-pointer gap-2 text-xs font-semibold text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-50"
                                            >
                                                <Lock className="size-3.5 text-rose-600" />
                                                <span>Kunci Formasi Tim</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        {/* AI Task Plan Action */}
                        {isMember && (
                            <button
                                type="button"
                                onClick={handleOpenAiModal}
                                disabled={aiGenerating}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50/60 hover:border-blue-200 text-slate-800 hover:text-blue-700 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                                title="Susun otomatis rencana tugas Kanban menggunakan AI"
                            >
                                <Sparkles className="size-3.5 text-blue-600" />
                                <span>{aiGenerating ? 'AI Menyusun...' : 'Susun AI'}</span>
                            </button>
                        )}

                        {canManageTasks && (
                            <button
                                type="button"
                                onClick={() => setTaskModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                            >
                                <Plus className="size-3.5" />
                                <span>Tambah Tugas</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* 2. WORKSPACE TABS NAVIGATION */}
                <div
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-1 px-1"
                >
                    {[
                        { id: 'overview', label: 'Ikhtisar Tim', icon: Users },
                        { id: 'kanban', label: 'Papan Tugas', icon: FolderKanban, count: participation.team?.tasks?.length || 0 },
                        { id: 'github', label: 'Monitoring GitHub', icon: GitBranch, badge: githubRepo ? 'Aktif' : null },
                        { id: 'applicants', label: 'Pelamar', icon: UserPlus, count: incomingApplications.length, badge: pendingAppsCount > 0 ? `${pendingAppsCount} Baru` : null },
                        { id: 'documents', label: 'Berkas & Karya', icon: FileText, count: participation.documents?.length || 0 },
                        { id: 'history', label: 'Riwayat', icon: History, count: participation.status_histories?.length || 0 },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`shrink-0 flex items-center gap-2 px-3 py-2.5 text-xs font-semibold transition border-b-2 whitespace-nowrap cursor-pointer -mb-px ${
                                    isActive
                                        ? 'border-blue-600 text-slate-900 font-bold'
                                        : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                                }`}
                            >
                                <Icon className={`size-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span>{tab.label}</span>
                                {typeof tab.count === 'number' && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md min-w-[18px] text-center shrink-0 ${
                                        isActive ? 'bg-blue-50 text-blue-700 border border-blue-200/80' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                                {tab.badge && (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-900 text-white shrink-0">
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}

                    {participation.team_id && (
                        <Link
                            href={`/ai-workspace?team_id=${participation.team_id}&assistant=competition`}
                            className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 my-1 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg transition"
                        >
                            <Sparkles className="size-3.5 text-blue-600" />
                            <span>AI Workspace</span>
                        </Link>
                    )}
                </div>

                {/* 3. TAB CONTENT: LINEAR/GITHUB-GRADE MASTER-DETAIL WORKSPACE OVERVIEW */}
                {activeTab === 'overview' && (() => {
                    const priorityWeight: Record<string, number> = { high: 1, medium: 2, low: 3 };
                    const statusWeight: Record<string, number> = { in_progress: 1, in_review: 2, todo: 3, completed: 4 };
                    const activeTasksList = [...tasks]
                        .sort((a: any, b: any) => {
                            const sw = (statusWeight[a.status] || 99) - (statusWeight[b.status] || 99);
                            if (sw !== 0) return sw;
                            return (priorityWeight[a.priority] || 99) - (priorityWeight[b.priority] || 99);
                        })
                        .slice(0, 5);

                    const deliverableItems = [
                        { key: 'proposal', label: 'Proposal & Makalah Proyek', desc: 'Latar belakang ide, analisis inovasi, & perancangan' },
                        { key: 'pitch_deck', label: 'Pitch Deck & Slide Presentasi', desc: 'Slide ringkas presentasi karya untuk evaluasi juri' },
                        { key: 'video_demo', label: 'Video Demo / Pitching Karya', desc: 'Tautan rekaman demonstrasi sistem atau prototipe' },
                        { key: 'repo_url', label: 'Repositori Kode & Git', desc: 'Tautan GitHub atau kode sumber proyek kompetisi' },
                        { key: 'poster', label: 'Poster Publikasi / Infografis', desc: 'Desain visual ringkasan poster karya' },
                        { key: 'registration_proof', label: 'Bukti Pendaftaran & Administrasi', desc: 'Kartu tanda peserta atau bukti verifikasi registrasi' },
                    ];

                    return (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                            {/* ======================================================== */}
                            {/* PRIMARY WORKSTREAM (8 COLS) */}
                            {/* ======================================================== */}
                            <div className="lg:col-span-8 space-y-6">

                                {/* CARD 1: PROJECT SPEC & EXECUTIVE BRIEF */}
                                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-5">
                                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
                                        {/* Competition Poster Thumbnail */}
                                        <div className="relative w-20 sm:w-24 aspect-[3/4] rounded-lg overflow-hidden bg-slate-900 border border-slate-200 shadow-2xs shrink-0">
                                            <img
                                                src={getCompetitionCover(participation.competition)}
                                                alt={participation.competition?.name || 'Cover'}
                                                className="w-full h-full object-cover"
                                            />
                                            <span className="absolute bottom-1 left-1 right-1 text-[8px] font-black uppercase tracking-wider text-white text-center truncate px-1 py-0.5 rounded bg-black/60">
                                                {participation.competition?.level || 'NASIONAL'}
                                            </span>
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-2.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                    {participation.competition?.category?.replace('_', ' ') || 'Kompetisi'}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => (isLeader || isMentor || isAdmin) && setStageModalOpen(true)}
                                                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 transition ${
                                                        (isLeader || isMentor || isAdmin)
                                                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 cursor-pointer'
                                                            : 'bg-slate-100 text-slate-700 border border-slate-200 cursor-default'
                                                    }`}
                                                    title="Klik untuk mengubah tahap seleksi"
                                                >
                                                    <span className="size-1.5 rounded-full bg-blue-600" />
                                                    <span>Tahap: {selectionStages[participation.stage]?.label || participation.stage}</span>
                                                    {(isLeader || isMentor || isAdmin) && <PenLine className="size-2.5 text-blue-600 shrink-0" />}
                                                </button>

                                                {participation.category_track && (
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200 truncate max-w-[240px]">
                                                        Jalur: {participation.category_track}
                                                    </span>
                                                )}

                                                {participation.is_formation_locked && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                                        <Lock className="size-2.5" />
                                                        <span>Formasi Terkunci</span>
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2.5 flex-wrap">
                                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                                        {participation.team?.name || 'Tim Mahasiswa'}
                                                    </h2>
                                                    {isLeader && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setNewTeamName(participation.team?.name || '');
                                                                setRenameModalOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-[11px] font-semibold text-slate-600 hover:text-blue-600 transition shadow-2xs cursor-pointer"
                                                            title="Ubah Nama Tim"
                                                        >
                                                            <PenLine className="size-2.5" />
                                                            <span>Ubah Nama</span>
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                                    Berpartisipasi pada <strong className="text-slate-800 font-semibold">{participation.competition?.name}</strong>
                                                    {participation.competition?.organizer ? ` • Diselenggarakan oleh ${participation.competition.organizer}` : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operational Health Strip */}
                                    <div className="pt-4 border-t border-slate-100 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Kesiapan Tim & Berkas Seleksi</span>
                                                <span className="text-[10px] text-slate-400 font-normal">({totalDocs}/6 Berkas • {completedTasks}/{totalTasks} Tugas)</span>
                                            </div>
                                            <span className="font-bold text-blue-600 font-mono text-sm">{readinessScore}% Siap</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(100, Math.max(0, readinessScore))}%` }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <span className="block text-xs font-bold text-slate-900">{completedTasks} / {totalTasks}</span>
                                                <span className="block text-[10px] text-slate-500">Tugas Diselesaikan</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <span className="block text-xs font-bold text-slate-900">{totalDocs} / 6</span>
                                                <span className="block text-[10px] text-slate-500">Berkas Wajib Siap</span>
                                            </div>
                                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                <span className="block text-xs font-bold text-slate-900">{membersCount} / {capacity}</span>
                                                <span className="block text-[10px] text-slate-500">Anggota Terisi</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* CARD 2: ACTIVE TASKS STREAM (SPRINT PULSE) */}
                                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                                                <FolderKanban className="size-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">Tugas Prioritas & Progres Kerja</h3>
                                                <p className="text-[11px] text-slate-400">
                                                    {totalTasks > 0 ? `${taskPercentage}% dari keseluruhan tugas sprint telah tuntas` : 'Belum ada tugas sprint yang dibuat'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {canManageTasks && (
                                                <button
                                                    type="button"
                                                    onClick={() => setTaskModalOpen(true)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
                                                >
                                                    <Plus className="size-3" />
                                                    <span>Tambah Tugas</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('kanban')}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
                                            >
                                                <span>Papan Kanban</span>
                                                <span>&rarr;</span>
                                            </button>
                                        </div>
                                    </div>

                                    {tasks.length === 0 ? (
                                        <div className="p-8 text-center space-y-3">
                                            <div className="size-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                                                <FolderKanban className="size-5" />
                                            </div>
                                            <div className="max-w-sm mx-auto">
                                                <p className="text-xs font-semibold text-slate-700">Papan tugas tim masih kosong</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    Mulai breakdown pekerjaan kompetisi menjadi tugas-tugas konkret atau susun otomatis dengan bantuan AI.
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-center gap-2 pt-1">
                                                {canManageTasks && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setTaskModalOpen(true)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                                                    >
                                                        <Plus className="size-3.5" />
                                                        <span>Buat Tugas Pertama</span>
                                                    </button>
                                                )}
                                                {isMember && (
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenAiModal}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer shadow-2xs"
                                                    >
                                                        <Sparkles className="size-3.5 text-blue-600" />
                                                        <span>Susun Roadmap AI</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {activeTasksList.map((task: any) => {
                                                const statusMeta: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
                                                    in_progress: { label: 'Sedang Dikerjakan', dot: 'bg-blue-500 animate-pulse', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                                                    in_review: { label: 'Dalam Review', dot: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                                                    todo: { label: 'Belum Mulai', dot: 'bg-slate-400', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
                                                    completed: { label: 'Selesai', dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
                                                };
                                                const s = statusMeta[task.status] || statusMeta.todo;

                                                const priorityMeta: Record<string, { label: string; color: string }> = {
                                                    high: { label: 'Tinggi', color: 'text-rose-600 bg-rose-50 border-rose-200' },
                                                    medium: { label: 'Sedang', color: 'text-amber-600 bg-amber-50 border-amber-200' },
                                                    low: { label: 'Rendah', color: 'text-slate-600 bg-slate-50 border-slate-200' },
                                                };
                                                const p = priorityMeta[task.priority] || priorityMeta.medium;

                                                return (
                                                    <div key={task.id} className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${s.bg} ${s.text} ${s.border}`}>
                                                                <span className={`size-1.5 rounded-full shrink-0 ${s.dot}`} />
                                                                <span>{s.label}</span>
                                                            </span>
                                                            <span className="text-xs font-semibold text-slate-900 truncate">
                                                                {task.title}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2.5 shrink-0">
                                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider shrink-0 ${p.color}`}>
                                                                {p.label}
                                                            </span>

                                                            {task.assignee ? (
                                                                <div className="flex items-center gap-1.5" title={`Ditugaskan ke: ${task.assignee.name}`}>
                                                                    <div className="size-6 rounded-full bg-slate-900 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                                                                        {task.assignee.avatar ? (
                                                                            <img src={task.assignee.avatar} alt={task.assignee.name} className="w-full h-full object-cover rounded-full" />
                                                                        ) : (
                                                                            task.assignee.name?.charAt(0) || 'U'
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[11px] text-slate-500 font-medium hidden md:inline truncate max-w-[100px]">
                                                                        {task.assignee.name.split(' ')[0]}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 italic hidden sm:inline">Belum ditugaskan</span>
                                                            )}

                                                            {task.due_on && (
                                                                <span className="text-[10px] font-mono text-slate-400 hidden lg:inline">
                                                                    {new Date(task.due_on).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            <div className="p-3 bg-slate-50/50 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('kanban')}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                                                >
                                                    Lihat seluruh {totalTasks} tugas di papan Kanban &rarr;
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* CARD 3: DELIVERABLES & SUBMISSION CHECKLIST */}
                                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                                                <FileText className="size-4" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">Kelengkapan Berkas & Karya Lomba</h3>
                                                <p className="text-[11px] text-slate-400">
                                                    Standar artefak wajib yang disyaratkan untuk penjurian dan seleksi kompetisi
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('documents')}
                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
                                        >
                                            <span>Kelola Berkas</span>
                                            <span>&rarr;</span>
                                        </button>
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {deliverableItems.map((item) => {
                                            const matchedDoc = (participation.documents || []).find((d: any) => d.required_document_key === item.key);
                                            const isUploaded = Boolean(matchedDoc && (matchedDoc.path || matchedDoc.url));

                                            return (
                                                <div key={item.key} className="p-3.5 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div className={`mt-0.5 size-5 rounded-full flex items-center justify-center shrink-0 ${
                                                            isUploaded ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                                        }`}>
                                                            {isUploaded ? <Check className="size-3" /> : <Clock className="size-3" />}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-slate-900 truncate">{item.label}</span>
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                                                    isUploaded ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    {isUploaded ? 'Terunggah' : 'Belum Ada'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                                                {isUploaded ? (matchedDoc.name || 'Dokumen siap') : item.desc}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0 flex items-center gap-2">
                                                        {isUploaded ? (
                                                            <>
                                                                {matchedDoc.url && (
                                                                    <a
                                                                        href={matchedDoc.url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                                                                        title="Buka Tautan"
                                                                    >
                                                                        <ExternalLink className="size-3" />
                                                                    </a>
                                                                )}
                                                                {matchedDoc.path && (
                                                                    <a
                                                                        href={`/competition-workspace/${participation.competition?.slug || participation.id}/documents/${matchedDoc.id}/download`}
                                                                        className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition"
                                                                        title="Unduh Berkas"
                                                                    >
                                                                        <Download className="size-3" />
                                                                    </a>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setActiveTab('documents');
                                                                    docForm.setData('required_document_key', item.key);
                                                                    docForm.setData('name', item.label);
                                                                    setDocModalOpen(true);
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-[11px] font-bold text-slate-700 hover:text-blue-600 transition cursor-pointer"
                                                            >
                                                                <Upload className="size-3" />
                                                                <span>Unggah</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* CARD 4: REPOSITORY & GIT PULSE */}
                                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="p-2.5 rounded-lg bg-slate-900 text-white shrink-0">
                                            <Github className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Integrasi Repositori Git</h4>
                                                {githubRepo && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                                        <span>Terhubung</span>
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                {githubRepo ? (
                                                    <span>Repository: <strong className="font-mono text-slate-800">{githubRepo.full_name}</strong> ({githubRepo.default_branch || 'main'})</span>
                                                ) : (
                                                    'Pantau kontribusi commit, pull request, dan riwayat kode tim secara real-time.'
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-2">
                                        {githubRepo ? (
                                            <>
                                                {githubRepo.html_url && (
                                                    <a
                                                        href={githubRepo.html_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition inline-flex items-center gap-1.5"
                                                    >
                                                        <span>Buka di GitHub</span>
                                                        <ExternalLink className="size-3" />
                                                    </a>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('github')}
                                                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                                                >
                                                    Monitoring &rarr;
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('github')}
                                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                                            >
                                                Hubungkan GitHub &rarr;
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ======================================================== */}
                            {/* CONTEXT SIDEBAR (4 COLS) */}
                            {/* ======================================================== */}
                            <div className="lg:col-span-4 space-y-6">

                                {/* SIDEBAR 1: COMPETITION TIMELINE & COUNTDOWN */}
                                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3.5">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="size-3.5 text-blue-600" />
                                            <span>Linimasa & Tenggat</span>
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                            {selectionStages[participation.stage]?.label || participation.stage}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                            {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} Hari Lagi` : 'Hari Ini') : 'Pendaftaran Terbuka'}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Batas Registrasi: <strong className="text-slate-800 font-semibold">{formattedDeadline}</strong>
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                                        {participation.competition?.slug && (
                                            <Link
                                                href={route('competitions.show', participation.competition.slug)}
                                                className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 hover:text-blue-600 transition flex items-center justify-center gap-1.5 shadow-2xs"
                                            >
                                                <span>Panduan & Info Lomba</span>
                                                <ExternalLink className="size-3" />
                                            </Link>
                                        )}
                                        {participation.competition?.official_url && (
                                            <a
                                                href={participation.competition.official_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition flex items-center justify-center gap-1.5"
                                            >
                                                <Globe className="size-3" />
                                                <span>Website Resmi Penyelenggara</span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* SIDEBAR 2: TEAM ROSTER & ROLES */}
                                <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                                                <Users className="size-3.5 text-blue-600" />
                                                <span>Susunan Anggota</span>
                                            </h3>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                {membersCount} dari {capacity} kuota tim terisi
                                            </p>
                                        </div>

                                        {isLeader && !participation.is_formation_locked && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('applicants')}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition cursor-pointer shadow-2xs"
                                            >
                                                <UserPlus className="size-3" />
                                                <span>Rekrut</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {participation.team?.members?.map((member: any) => {
                                            const isCurrentUser = member.user_id === participation.team?.members?.find((m: any) => m.user_id === member.user_id)?.user_id;
                                            const phone = member.user?.phone || member.user?.student_profile?.phone;
                                            const waUrl = phone ? formatWhatsAppUrl(phone, `Halo ${member.user?.name}, terkait koordinasi tim kompetisi ${participation.team?.name}`) : null;

                                            return (
                                                <div key={member.id} className="py-2.5 flex items-center justify-between gap-2.5">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="size-8 rounded-lg overflow-hidden bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200">
                                                            {member.user?.avatar ? (
                                                                <img src={member.user.avatar} alt={member.user.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                member.user?.name?.charAt(0) || 'U'
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-xs font-bold text-slate-900 truncate">{member.user?.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                                                    member.permission === 'leader'
                                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                        : 'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                    {member.role_name || (member.permission === 'leader' ? 'Ketua Tim' : 'Anggota')}
                                                                </span>
                                                                {member.user?.student_profile?.nim && (
                                                                    <span className="text-[10px] text-slate-400 font-mono truncate">
                                                                        {member.user.student_profile.nim}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                        {waUrl && (
                                                            <a
                                                                href={waUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition border border-slate-200"
                                                                title={`WhatsApp: ${phone}`}
                                                            >
                                                                <Phone className="size-3" />
                                                            </a>
                                                        )}

                                                        {(isLeader || isCurrentUser) && member.permission !== 'leader' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleWithdrawMember(member.user_id, member.user?.name)}
                                                                title="Lepas keanggotaan"
                                                                className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                                            >
                                                                <UserMinus className="size-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {capacity > membersCount && (
                                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                                            <span className="text-[11px] text-slate-500 font-medium">Tersedia {capacity - membersCount} slot anggota</span>
                                            {isLeader && !participation.is_formation_locked && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('applicants')}
                                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700"
                                                >
                                                    Buka Lowongan &rarr;
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* SIDEBAR: STORAGE QUOTA */}
                                {storageQuota && (
                                    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <HardDrive className="size-3.5 text-blue-600" />
                                                <span>Kapasitas Penyimpanan</span>
                                            </span>
                                            <span className="font-mono text-[11px] font-bold text-slate-600">
                                                {storageQuota.used_mb}MB / {storageQuota.max_mb}MB
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, Math.max(0, storageQuota.percent_used || 0))}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* SIDEBAR 5: CANDIDATES OR ALLOCATIONS IF ANY */}
                                {(recommendedCandidates.length > 0 || hasInvitations || hasAllocations) && (
                                    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-3">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <Sparkles className="size-3.5 text-blue-600" />
                                                <span>Rekomendasi Rekan</span>
                                            </h4>
                                            <span className="text-[10px] text-slate-400">Matchmaking</span>
                                        </div>

                                        <div className="space-y-2">
                                            {recommendedCandidates.slice(0, 2).map((cand: any) => {
                                                const u = cand.user || cand;
                                                return (
                                                    <div
                                                        key={u.id}
                                                        className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 space-y-1.5 text-xs"
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-bold text-slate-900 truncate">{u.name}</span>
                                                            <span className="text-[10px] font-mono font-bold px-1 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                                                {cand.final_score}% Cocok
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 truncate">{cand.explanation}</p>
                                                        {isLeader && !participation.is_formation_locked && cand.eligible && (
                                                            <button
                                                                type="button"
                                                                onClick={() => openInviteModalForCandidate(cand)}
                                                                className="w-full py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition cursor-pointer mt-1"
                                                            >
                                                                Undang ke Tim
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* 6) TAB CONTENT: APPLICANTS & MINSATU RECRUITMENT */}
                {activeTab === 'applicants' && (
                    <div className="space-y-6">
                        {/* Recruitment Header Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white p-5 sm:p-6 rounded-2xl border border-blue-200/80 shadow-2xs">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100/90 px-2.5 py-0.5 rounded-md border border-blue-200">
                                        Perekrutan Anggota Tim
                                    </span>
                                    <span className="text-xs text-slate-400">•</span>
                                    <span className="text-xs font-semibold text-slate-500">MinSatu Matchmaking</span>
                                </div>
                                <h2 className="text-base sm:text-lg font-black text-slate-900">
                                    Rekrut Rekan & Kelola Pelamar Tim
                                </h2>
                                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed max-w-2xl">
                                    Ketua tim dapat mengundang mahasiswa secara langsung dengan persetujuan mereka, membuka lowongan posisi, atau meninjau berkas pelamar yang masuk.
                                </p>
                            </div>

                            {isLeader && !participation.is_formation_locked && (
                                <button
                                    type="button"
                                    onClick={() => setExploreModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0"
                                >
                                    <UserPlus className="size-4" />
                                    <span>+ Rekrut / Undang Mahasiswa</span>
                                </button>
                            )}
                        </div>

                        {/* Open Roles Section */}
                        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Briefcase className="size-4 text-blue-600 shrink-0" />
                                        <span>Posisi / Peran Dicari ({recruitmentRoles.length})</span>
                                    </h3>
                                </div>

                                {isLeader && !participation.is_formation_locked && (
                                    <button
                                        type="button"
                                        onClick={() => setAddingRole(!addingRole)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Tambah Posisi</span>
                                    </button>
                                )}
                            </div>

                            {/* Add Role Form Drawer */}
                            {addingRole && (
                                <form onSubmit={handleAddRecruitmentRole} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-bold text-slate-800 mb-1">
                                                Nama Peran / Posisi <span className="text-blue-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Contoh: UI/UX Designer, Frontend Developer, Pitcher"
                                                value={newRoleName}
                                                onChange={(e) => setNewRoleName(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-800 mb-1">
                                                Jumlah Slot <span className="text-blue-600">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={10}
                                                required
                                                value={newRoleSlots}
                                                onChange={(e) => setNewRoleSlots(parseInt(e.target.value, 10) || 1)}
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-800 mb-1">
                                            Kualifikasi Singkat (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Contoh: Menguasai Figma, familiar dengan React, atau mampu riset pasar"
                                            value={newRoleReqs}
                                            onChange={(e) => setNewRoleReqs(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                        />
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setAddingRole(false)}
                                            className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer transition shadow-2xs"
                                        >
                                            Simpan Lowongan
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Roles List */}
                            {recruitmentRoles.length === 0 ? (
                                <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-xs font-bold text-slate-700">Belum ada daftar lowongan spesifik</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Tambahkan posisi yang dicari agar mahasiswa dapat langsung melamar ke tim Anda.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
                                    {recruitmentRoles.map((r: any) => (
                                        <div
                                            key={r.id}
                                            className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between gap-2.5"
                                        >
                                            <div className="flex-1 flex flex-col">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-xs font-bold text-slate-900 block truncate">{r.name}</span>
                                                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 mt-1 shrink-0">
                                                            {r.slots} Slot Terbuka
                                                        </span>
                                                    </div>
                                                    {isLeader && !participation.is_formation_locked && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRecruitmentRole(r.id)}
                                                            className="text-slate-400 hover:text-rose-600 p-1 rounded transition shrink-0 cursor-pointer"
                                                            title="Hapus lowongan"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                {r.requirements ? (
                                                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 flex-1">
                                                        {r.requirements}
                                                    </p>
                                                ) : (
                                                    <p className="text-[11px] text-slate-400 mt-2 italic flex-1">
                                                        Terbuka untuk semua jurusan
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {isLeader && !participation.is_formation_locked && (
                                        <button
                                            type="button"
                                            onClick={() => setAddingRole(true)}
                                            className="p-3.5 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 text-slate-500 hover:text-blue-600 flex flex-col items-center justify-center gap-1.5 transition text-center min-h-[90px] cursor-pointer"
                                        >
                                            <Plus className="size-4" />
                                            <span className="text-xs font-semibold">Tambah Posisi Lain</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Sent Invitations Section (Recruiting with Approval) */}
                        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Send className="size-4 text-blue-600 shrink-0" />
                                        <span>Undangan Terkirim ({sentInvitations.length})</span>
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                        Mahasiswa yang Anda undang secara langsung. Keanggotaan resmi berlaku setelah disetujui mahasiswa.
                                    </p>
                                </div>

                                {isLeader && !participation.is_formation_locked && (
                                    <button
                                        type="button"
                                        onClick={() => setExploreModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                                    >
                                        <UserPlus className="size-3.5" />
                                        <span>+ Cari & Rekrut Mahasiswa</span>
                                    </button>
                                )}
                            </div>

                            {sentInvitations.length === 0 ? (
                                <div className="text-center py-8 px-4 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                                    <UserCheck className="size-8 text-slate-400 mx-auto mb-2 opacity-60" />
                                    <p className="text-xs font-bold text-slate-700">Belum Ada Undangan yang Dikirimkan</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-md mx-auto">
                                        Anda dapat mencari mahasiswa di kampus Anda dan mengirimkan tawaran posisi langsung dengan persetujuan mereka.
                                    </p>
                                    {isLeader && !participation.is_formation_locked && (
                                        <button
                                            type="button"
                                            onClick={() => setExploreModalOpen(true)}
                                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                                        >
                                            <UserPlus className="size-3.5" />
                                            <span>Cari & Rekrut Mahasiswa Kampus</span>
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {sentInvitations.map((inv: any) => (
                                        <div
                                            key={inv.id}
                                            className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                        >
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="size-10 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                                    {inv.invitee?.avatar ? (
                                                        <img src={inv.invitee.avatar} alt={inv.invitee?.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        inv.invitee?.name?.charAt(0).toUpperCase() || 'M'
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-slate-900 truncate">
                                                            {inv.invitee?.name || 'Mahasiswa'}
                                                        </span>
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0">
                                                            Posisi: {inv.role_name}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                                            inv.status === 'accepted'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : inv.status === 'declined'
                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                : inv.status === 'cancelled'
                                                                ? 'bg-slate-100 text-slate-600'
                                                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                                                        }`}>
                                                            {inv.status === 'accepted'
                                                                ? '✅ Resmi Bergabung'
                                                                : inv.status === 'declined'
                                                                ? '❌ Ditolak'
                                                                : inv.status === 'cancelled'
                                                                ? 'Dibatalkan'
                                                                : '⏳ Menunggu Persetujuan'}
                                                        </span>
                                                    </div>

                                                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                        {inv.invitee?.study_program || 'Mahasiswa'} {inv.invitee?.semester ? `• Semester ${inv.invitee.semester}` : ''}
                                                        {inv.invitee?.campus_name ? ` • ${inv.invitee.campus_name}` : ''}
                                                    </p>

                                                    {inv.invitee?.skills && inv.invitee.skills.length > 0 && (
                                                        <div className="flex items-center gap-1 flex-wrap mt-1.5">
                                                            {inv.invitee.skills.slice(0, 3).map((sk: any, i: number) => (
                                                                <span key={i} className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                    {typeof sk === 'string' ? sk : sk?.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {inv.message && (
                                                        <p className="text-[11px] text-slate-600 italic mt-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                            "{inv.message}"
                                                        </p>
                                                    )}

                                                    {inv.declined_reason && (
                                                        <p className="text-[11px] text-rose-600 mt-1">
                                                            Alasan ditolak: "{inv.declined_reason}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                <span className="text-[10px] text-slate-400 mr-1">
                                                    {inv.created_at || 'Baru saja'}
                                                </span>
                                                {isLeader && inv.status === 'pending' && !participation.is_formation_locked && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCancelInvitation(inv.id)}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-semibold transition cursor-pointer"
                                                    >
                                                        Batalkan
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Incoming Applicants List */}
                        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <UserPlus className="size-4 text-blue-600 shrink-0" />
                                    <span>Pelamar Masuk ({incomingApplications.length})</span>
                                </h3>
                            </div>

                            {incomingApplications.length === 0 ? (
                                <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Users className="size-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-800">Belum Ada Pelamar Masuk</p>
                                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                                        Lamaran mahasiswa akan muncul di sini lengkap dengan resume keahlian dan tombol kontak WhatsApp langsung.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {incomingApplications.map((app: any) => {
                                        const applicant = app.user;
                                        const phone = app.contact_phone || applicant?.phone;
                                        const greeting = `Halo ${applicant?.name || 'Rekan'}, saya ${participation.team?.leader?.name || 'Ketua'} dari tim ${participation.team?.name} untuk kompetisi ${participation.competition?.name}. Saya melihat lamaran Anda untuk peran ${app.role_name}. Bisakah kita ngobrol lebih lanjut mengenai persiapan tim?`;
                                        const waUrl = phone ? formatWhatsAppUrl(phone, greeting) : null;

                                        return (
                                            <div
                                                key={app.id}
                                                className={`p-4 rounded-xl border transition-all ${
                                                    app.status === 'accepted'
                                                        ? 'bg-white border-emerald-200 shadow-2xs ring-1 ring-emerald-500/10'
                                                        : app.status === 'rejected'
                                                        ? 'bg-slate-50/60 border-slate-200 opacity-60'
                                                        : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                                                }`}
                                            >
                                                {/* Applicant Header Info */}
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div
                                                            onClick={() => setSelectedApplicantModal(app)}
                                                            className="size-10 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs cursor-pointer transition overflow-hidden ring-1 ring-slate-200"
                                                            title="Klik untuk melihat profil lengkap"
                                                        >
                                                            {applicant?.avatar ? (
                                                                <img
                                                                    src={applicant.avatar}
                                                                    alt={applicant?.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                applicant?.name ? applicant.name.charAt(0).toUpperCase() : 'U'
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedApplicantModal(app)}
                                                                    className="text-sm font-bold text-slate-900 hover:text-blue-600 truncate transition text-left cursor-pointer"
                                                                    title="Klik untuk melihat profil lengkap"
                                                                >
                                                                    {applicant?.name || 'Mahasiswa'}
                                                                </button>
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                                                    Posisi: {app.role_name || 'Anggota Tim'}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                                                    app.status === 'accepted'
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                        : app.status === 'rejected'
                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                }`}>
                                                                    {app.status === 'accepted' ? 'Diterima' : app.status === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                                                                {applicant?.study_program || 'Mahasiswa'} {applicant?.semester ? `• Semester ${applicant.semester}` : ''}
                                                                {applicant?.campus_name ? ` • ${applicant.campus_name}` : ''}
                                                            </p>

                                                            {/* Mini Skill Badges */}
                                                            {applicant?.skills && applicant.skills.length > 0 && (
                                                                <div className="flex items-center gap-1 flex-wrap mt-1.5">
                                                                    {applicant.skills.slice(0, 3).map((sk: any, i: number) => (
                                                                        <span key={i} className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                            {typeof sk === 'string' ? sk : sk.name}
                                                                        </span>
                                                                    ))}
                                                                    {applicant.skills.length > 3 && (
                                                                        <span className="text-[9px] font-bold text-slate-400">
                                                                            +{applicant.skills.length - 3} lainnya
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {app.created_at && (
                                                        <span className="text-[11px] text-slate-400 shrink-0 self-start sm:self-center">
                                                            Melamar: {new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Motivation Message */}
                                                {app.message && (
                                                    <div className="mt-3 px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
                                                        <span className="text-slate-400 font-serif text-lg leading-none shrink-0 select-none">“</span>
                                                        <p className="italic leading-relaxed flex-1">{app.message}</p>
                                                    </div>
                                                )}

                                                {/* Actions & WhatsApp Contact */}
                                                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedApplicantModal(app)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer shadow-2xs"
                                                        >
                                                            <Eye className="size-3.5" />
                                                            <span>Lihat Profil & Portofolio</span>
                                                        </button>

                                                        {waUrl ? (
                                                            <a
                                                                href={waUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shrink-0 shadow-2xs"
                                                            >
                                                                <Phone className="size-3.5" />
                                                                <span>Chat WhatsApp</span>
                                                            </a>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 italic">No WhatsApp tidak tersedia</span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {isLeader && app.status === 'pending' && !participation.is_formation_locked && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRespondApplication(app.id, 'reject')}
                                                                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
                                                                >
                                                                    Tolak
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRespondApplication(app.id, 'accept')}
                                                                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                                                                >
                                                                    Terima Masuk Tim
                                                                </button>
                                                            </>
                                                        )}
                                                        {app.status === 'accepted' && (
                                                            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                                <span>Sudah Bergabung</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 4) TAB CONTENT: KANBAN TASKS */}
                {activeTab === 'kanban' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <FolderKanban className="size-4 text-blue-600 shrink-0" />
                                    <span>Papan Tugas</span>
                                </h3>
                            </div>
                            {isMember && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        onClick={handleCopyRoadmap}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer shadow-2xs"
                                        title="Salin checklist tugas rapi untuk laporan ke dosen atau WhatsApp tim"
                                    >
                                        {copiedRoadmap ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5 text-slate-500" />}
                                        <span>{copiedRoadmap ? 'Checklist Tersalin!' : 'Salin Roadmap'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleOpenAiModal}
                                        disabled={aiGenerating}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer shadow-2xs disabled:opacity-50"
                                        title="Susun Kanban Tasks Otomatis Menggunakan AI Gemini"
                                    >
                                        <Sparkles className="size-3.5" />
                                        <span>{aiGenerating ? 'AI Menyusun...' : 'Susun Tugas AI (Gemini)'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTaskModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Tambah Tugas</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Kanban Filter Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="relative">
                                    <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={kanbanSearch}
                                        onChange={(e) => setKanbanSearch(e.target.value)}
                                        placeholder="Cari kartu tugas..."
                                        className="pl-8 pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-40 sm:w-52"
                                    />
                                    {kanbanSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setKanbanSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-semibold text-slate-600">
                                    <span className="px-1.5 text-slate-400 flex items-center gap-1">
                                        <Filter className="size-3" />
                                        <span className="text-[10px]">Prioritas:</span>
                                    </span>
                                    {['all', 'urgent', 'high', 'medium', 'low'].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setKanbanPriorityFilter(p)}
                                            className={`px-2 py-0.5 rounded capitalize text-[10px] sm:text-xs transition cursor-pointer ${
                                                kanbanPriorityFilter === p
                                                    ? 'bg-blue-600 text-white font-bold'
                                                    : 'hover:bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {p === 'all' ? 'Semua' : p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="text-[11px] text-slate-500 font-medium self-end sm:self-auto">
                                Total: <strong className="text-slate-800">{participation.team?.tasks?.length || 0}</strong> tugas • Selesai: <strong className="text-emerald-700 font-bold">{(participation.team?.tasks || []).filter((t: any) => t.status === 'completed').length}</strong>
                            </div>
                        </div>

                        {/* 4-Column Board */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-stretch">
                            {(
                                [
                                    { key: 'todo', label: 'Belum Dimulai', dot: 'bg-slate-400' },
                                    { key: 'in_progress', label: 'Sedang Dikerjakan', dot: 'bg-blue-500' },
                                    { key: 'in_review', label: 'Review & Ulasan', dot: 'bg-amber-500' },
                                    { key: 'completed', label: 'Selesai', dot: 'bg-emerald-500' },
                                ] as const
                            ).map((col) => {
                                const colTasks = (participation.team?.tasks || []).filter((t: any) => {
                                    if (t.status !== col.key) return false;
                                    if (kanbanPriorityFilter !== 'all' && t.priority !== kanbanPriorityFilter) return false;
                                    if (kanbanSearch) {
                                        const query = kanbanSearch.toLowerCase();
                                        const matchesTitle = t.title?.toLowerCase().includes(query);
                                        const matchesDesc = (t.description || '').toLowerCase().includes(query);
                                        if (!matchesTitle && !matchesDesc) return false;
                                    }
                                    return true;
                                });
                                const isDragTarget = dragOverCol === col.key;
                                const isAddingHere = inlineAddingCol === col.key;
                                const isColVisibleOnMobile = mobileKanbanCol === 'all' || mobileKanbanCol === col.key;

                                return (
                                    <div
                                        key={col.key}
                                        onDragOver={(e) => handleDragOver(e, col.key)}
                                        onDragLeave={(e) => handleDragLeave(e, col.key)}
                                        onDrop={(e) => handleDrop(e, col.key)}
                                        style={{ minHeight: '300px' }}
                                        className={`rounded-2xl p-2.5 flex-col gap-2.5 transition-all duration-150 ${
                                            isColVisibleOnMobile ? 'flex' : 'hidden lg:flex'
                                        } ${
                                            isDragTarget
                                                ? 'bg-blue-50/80 border-2 border-dashed border-blue-400'
                                                : 'bg-slate-100/70 border border-slate-200/80'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between px-1 shrink-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`size-2 rounded-full ${col.dot} shrink-0`} />
                                                <span className="text-xs font-bold text-slate-800">{col.label}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {colTasks.length}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2 flex-1">
                                            {colTasks.length === 0 && !isAddingHere && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (canManageTasks) {
                                                            setInlineAddingCol(col.key);
                                                            setInlineTitle('');
                                                        }
                                                    }}
                                                    className="flex-1 min-h-[80px] flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition cursor-pointer"
                                                >
                                                    <Plus className="size-4 shrink-0" />
                                                    <span className="text-[10px] font-semibold">Tambah kartu</span>
                                                </button>
                                            )}

                                            {colTasks.map((task: any) => {
                                                const isBeingDragged = draggedTaskId === task.id;

                                                return (
                                                    <div
                                                        key={task.id}
                                                        draggable={canManageTasks}
                                                        onDragStart={(e) => handleDragStart(e, task.id, col.key)}
                                                        className={`bg-white rounded-xl p-3 border border-slate-200/90 shadow-2xs hover:border-blue-300 transition flex flex-col gap-2 cursor-grab active:cursor-grabbing select-none ${
                                                            isBeingDragged ? 'opacity-40' : ''
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-1">
                                                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                                                                task.priority === 'urgent'
                                                                    ? 'bg-rose-50 text-rose-700'
                                                                    : task.priority === 'high'
                                                                    ? 'bg-amber-50 text-amber-800'
                                                                    : 'bg-slate-100 text-slate-600'
                                                            }`}>
                                                                {task.priority}
                                                            </span>

                                                            <div className="flex items-center gap-1 shrink-0">
                                                                {isMember && (
                                                                    <select
                                                                        value={task.status}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                                                        className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-slate-600 cursor-pointer"
                                                                    >
                                                                        <option value="todo">To Do</option>
                                                                        <option value="in_progress">In Progress</option>
                                                                        <option value="in_review">Review</option>
                                                                        <option value="completed">Done</option>
                                                                    </select>
                                                                )}
                                                                {isMember && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteTask(task.id, task.title);
                                                                        }}
                                                                        title="Hapus tugas ini"
                                                                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                                                    >
                                                                        <Trash2 className="size-3" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="text-xs font-bold text-slate-900 leading-snug">
                                                            {task.title}
                                                        </div>

                                                        {task.description && (
                                                            <p className="text-[11px] text-slate-500 line-clamp-2">
                                                                {task.description}
                                                            </p>
                                                        )}

                                                        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 text-slate-400">
                                                            <span className="truncate">{task.assignee?.name?.split(' ')[0] || 'Unassigned'}</span>
                                                            {task.due_on && <span className="shrink-0">{task.due_on}</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Inline Composer */}
                                            {isAddingHere && (
                                                <div className="bg-white rounded-xl p-2.5 border border-blue-400 shadow-2xs flex flex-col gap-2">
                                                    <textarea
                                                        autoFocus
                                                        value={inlineTitle}
                                                        onChange={(e) => setInlineTitle(e.target.value)}
                                                        placeholder="Judul kartu tugas..."
                                                        rows={2}
                                                        className="w-full text-xs text-slate-900 border-0 p-0 focus:outline-none focus:ring-0 resize-none"
                                                    />
                                                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuickAddTask(col.key)}
                                                            disabled={!inlineTitle.trim()}
                                                            className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-bold disabled:opacity-50"
                                                        >
                                                            Tambah
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setInlineAddingCol(null)}
                                                            className="p-1 text-slate-400 hover:text-slate-600"
                                                        >
                                                            <X className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {canManageTasks && !isAddingHere && colTasks.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setInlineAddingCol(col.key);
                                                    setInlineTitle('');
                                                }}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition text-left cursor-pointer shrink-0"
                                            >
                                                <Plus className="size-3.5 shrink-0" />
                                                <span>Tambah kartu</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* TAB CONTENT: GITHUB CONTRIBUTION MONITORING */}
                {activeTab === 'github' && (
                    <div className="space-y-4">
                        <GitHubContributionMonitor
                            teamId={participation.team_id}
                            initialRepo={githubRepo}
                            initialData={githubData}
                            canManage={canManageGitHub}
                            allMembers={participation.team?.members?.map((m: any) => ({
                                id: m.id,
                                user_id: m.user_id,
                                name: m.user?.name || 'Anggota',
                                email: m.user?.email || '',
                                role_name: m.role_name || (m.permission === 'leader' ? 'Leader' : 'Anggota'),
                                permission: m.permission,
                                skills: m.user?.profile?.skills?.map((s: any) => s.name) || [],
                            })) || []}
                        />
                    </div>
                )}

                {/* 5) TAB CONTENT: DOCUMENTS & DELIVERABLES (FOLDER EXPLORER UI) */}
                {activeTab === 'documents' && (() => {
                    const allDocs = participation.documents || [];
                    const activeFolderObj = DOC_FOLDERS.find((f) => f.key === selectedDocFolder);
                    const getFolderDocCount = (key: string) => allDocs.filter((d: any) => d.required_document_key === key).length;
                    const filteredDocs = allDocs.filter((doc: any) => {
                        const matchesFolder = selectedDocFolder === 'all' || doc.required_document_key === selectedDocFolder;
                        const q = docSearchQuery.trim().toLowerCase();
                        const matchesSearch = !q ||
                            (doc.name && doc.name.toLowerCase().includes(q)) ||
                            (doc.uploader?.name && doc.uploader.name.toLowerCase().includes(q)) ||
                            (doc.notes && doc.notes.toLowerCase().includes(q));
                        return matchesFolder && matchesSearch;
                    });

                    return (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-6">
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
                                            <FolderOpen className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-slate-900">
                                                Direktori Berkas & Karya Tim
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Kelola proposal, pitch deck, repositori kode, dan berkas administrasi tim dalam folder terstruktur.
                                            </p>
                                        </div>
                                    </div>

                                    {canManageTasks && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                docForm.setData('required_document_key', selectedDocFolder !== 'all' ? selectedDocFolder : 'proposal');
                                                const found = deliverableTemplates.find((t) => t.key === (selectedDocFolder !== 'all' ? selectedDocFolder : 'proposal'));
                                                if (found) docForm.setData('name', found.label);
                                                setDocModalOpen(true);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
                                        >
                                            <Upload className="size-3.5" />
                                            <span>Unggah Berkas Baru</span>
                                        </button>
                                    )}
                                </div>

                                {/* Object Storage Quota Strip */}
                                {storageQuota && (
                                    <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-3 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <HardDrive className="size-4 text-slate-500 shrink-0" />
                                            <span className="text-xs font-bold text-slate-800">Kapasitas Object Storage Tim</span>
                                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                                                {storageQuota.used_mb} MB / {storageQuota.max_mb} MB ({storageQuota.percent_used}%)
                                            </span>
                                        </div>
                                        <div className="w-full sm:w-56 flex items-center gap-2.5">
                                            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                        storageQuota.percent_used > 85 ? 'bg-rose-500' : 'bg-blue-600'
                                                    }`}
                                                    style={{ width: `${Math.min(100, storageQuota.percent_used)}%` }}
                                                />
                                            </div>
                                            <span className="text-[11px] font-mono font-bold text-slate-600 shrink-0">
                                                Sisa {storageQuota.remaining_mb} MB
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* 6 Clean, Modern Interactive Folder Cards */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Folder className="size-4 text-slate-700" />
                                            <span className="text-xs font-bold text-slate-900">Folder Berkas Seleksi Tim</span>
                                            <span className="text-[10px] text-slate-400">({allDocs.length} berkas terunggah)</span>
                                        </div>
                                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                                            Klik folder untuk membuka atau tarik file ke folder
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                        {DOC_FOLDERS.map((folder) => {
                                            const count = getFolderDocCount(folder.key);
                                            const isSelected = selectedDocFolder === folder.key;
                                            const isDragTarget = dragOverFolderKey === folder.key;
                                            const folderFiles = allDocs.filter((d: any) => d.required_document_key === folder.key);

                                            return (
                                                <div
                                                    key={folder.key}
                                                    onClick={() => setSelectedDocFolder(isSelected ? 'all' : folder.key)}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        if (dragOverFolderKey !== folder.key) setDragOverFolderKey(folder.key);
                                                    }}
                                                    onDragLeave={(e) => {
                                                        if (dragOverFolderKey === folder.key) setDragOverFolderKey(null);
                                                    }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        setDragOverFolderKey(null);
                                                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                                            const droppedFile = e.dataTransfer.files[0];
                                                            setSelectedDocFolder(folder.key);
                                                            docForm.setData('required_document_key', folder.key);
                                                            docForm.setData('name', folder.label);
                                                            docForm.setData('file', droppedFile);
                                                            setDocModalOpen(true);
                                                        }
                                                    }}
                                                    className={`rounded-xl p-4 sm:p-4.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 text-left relative group ${
                                                        isDragTarget
                                                            ? 'bg-blue-50/90 border-blue-500 scale-[1.02] shadow-md ring-2 ring-blue-500/30'
                                                            : isSelected
                                                            ? 'bg-blue-50/40 border-blue-600 shadow-xs ring-2 ring-blue-500/20'
                                                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
                                                    }`}
                                                >
                                                    {/* Top Row: Folder Icon + Title + Count Badge */}
                                                    <div className="flex items-start justify-between gap-2.5">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                                                isSelected
                                                                    ? 'bg-blue-600 text-white shadow-2xs'
                                                                    : 'bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-600 border border-slate-200/80 group-hover:border-blue-200'
                                                            }`}>
                                                                {isSelected ? (
                                                                    <FolderOpen className="size-5" />
                                                                ) : (
                                                                    <Folder className="size-5" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h4 className={`text-xs font-bold leading-snug truncate transition ${
                                                                    isSelected ? 'text-blue-900 font-black' : 'text-slate-900 group-hover:text-blue-600'
                                                                }`}>
                                                                    {folder.label}
                                                                </h4>
                                                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                                                                    {folder.desc}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 border ${
                                                            count > 0
                                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                                        }`}>
                                                            {count > 0 ? (
                                                                <>
                                                                    <CheckCircle2 className="size-2.5 text-emerald-600" />
                                                                    <span>{count} Berkas</span>
                                                                </>
                                                            ) : (
                                                                <span>Kosong</span>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {/* Middle: Format Guideline & File Preview */}
                                                    <div className="space-y-1.5 pt-1">
                                                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                                                            <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60 text-slate-500">
                                                                {folder.formats}
                                                            </span>
                                                            {isDragTarget && (
                                                                <span className="font-bold text-blue-600 animate-pulse">
                                                                    Lepas file di sini
                                                                </span>
                                                            )}
                                                        </div>

                                                        {count > 0 && (
                                                            <div className="space-y-1 pt-0.5">
                                                                {folderFiles.slice(0, 1).map((f: any) => (
                                                                    <div
                                                                        key={f.id}
                                                                        className="text-[10px] font-mono text-slate-700 bg-slate-50/80 border border-slate-200/80 rounded px-2 py-0.5 flex items-center justify-between gap-1.5 truncate"
                                                                    >
                                                                        <div className="flex items-center gap-1.5 truncate">
                                                                            <FileText className="size-3 text-blue-600 shrink-0" />
                                                                            <span className="truncate">{f.name || 'Berkas Dokumen'}</span>
                                                                        </div>
                                                                        <span className="text-[9px] font-bold text-slate-500 shrink-0">
                                                                            v{f.version || 1}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Bottom Action Footer */}
                                                    <div className={`pt-2.5 border-t flex items-center justify-between text-[11px] ${
                                                        isSelected ? 'border-blue-200 text-blue-700' : 'border-slate-100 text-slate-500'
                                                    }`}>
                                                        {isSelected ? (
                                                            <span className="font-bold text-blue-600 flex items-center gap-1.5">
                                                                <span className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
                                                                <span>Folder Sedang Dibuka</span>
                                                                <ChevronDown className="size-3" />
                                                            </span>
                                                        ) : (
                                                            <span className="font-semibold text-slate-500 group-hover:text-blue-600 transition flex items-center gap-1">
                                                                <span>Buka Folder</span>
                                                                <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                                                            </span>
                                                        )}

                                                        {canManageTasks && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    docForm.setData('required_document_key', folder.key);
                                                                    docForm.setData('name', folder.label);
                                                                    setDocModalOpen(true);
                                                                }}
                                                                className="font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-100 px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
                                                                title={`Unggah ke folder ${folder.label}`}
                                                            >
                                                                <Plus className="size-3" />
                                                                <span>Unggah</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Explorer Toolbar, Breadcrumb & File View Toggle */}
                                <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                        {/* Left: Quick Folder Filter Chips */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedDocFolder('all')}
                                                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                                                    selectedDocFolder === 'all'
                                                        ? 'bg-slate-900 text-white shadow-2xs'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                            >
                                                <FolderArchive className="size-3.5" />
                                                <span>Semua Berkas ({allDocs.length})</span>
                                            </button>

                                            {DOC_FOLDERS.map((f) => {
                                                const fCount = getFolderDocCount(f.key);
                                                const isFSelected = selectedDocFolder === f.key;
                                                return (
                                                    <button
                                                        key={f.key}
                                                        type="button"
                                                        onClick={() => setSelectedDocFolder(f.key)}
                                                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                                                            isFSelected
                                                                ? 'bg-blue-600 text-white shadow-2xs font-bold'
                                                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                                                        }`}
                                                    >
                                                        {isFSelected ? <FolderOpen className="size-3" /> : <Folder className="size-3" />}
                                                        <span>{f.label}</span>
                                                        <span className={`text-[10px] font-mono px-1 rounded ${isFSelected ? 'bg-blue-700 text-white' : 'bg-slate-200/70 text-slate-600'}`}>
                                                            {fCount}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Right: Search + View Mode Switcher + Upload */}
                                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                            <div className="relative w-full sm:w-52">
                                                <Search className="size-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                <input
                                                    type="text"
                                                    placeholder="Cari nama berkas..."
                                                    value={docSearchQuery}
                                                    onChange={(e) => setDocSearchQuery(e.target.value)}
                                                    className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                                />
                                                {docSearchQuery && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDocSearchQuery('')}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                )}
                                            </div>

                                            {/* View Mode Toggle: List vs Grid */}
                                            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setDocViewMode('list')}
                                                    className={`p-1.5 rounded-md transition cursor-pointer ${
                                                        docViewMode === 'list'
                                                            ? 'bg-white text-slate-900 shadow-2xs'
                                                            : 'text-slate-400 hover:text-slate-700'
                                                    }`}
                                                    title="Tampilan Tabel (List View)"
                                                >
                                                    <List className="size-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDocViewMode('grid')}
                                                    className={`p-1.5 rounded-md transition cursor-pointer ${
                                                        docViewMode === 'grid'
                                                            ? 'bg-white text-slate-900 shadow-2xs'
                                                            : 'text-slate-400 hover:text-slate-700'
                                                    }`}
                                                    title="Tampilan Kotak (Grid View)"
                                                >
                                                    <LayoutGrid className="size-3.5" />
                                                </button>
                                            </div>

                                            {canManageTasks && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (selectedDocFolder !== 'all' && activeFolderObj) {
                                                            docForm.setData('required_document_key', activeFolderObj.key);
                                                            docForm.setData('name', activeFolderObj.label);
                                                        } else {
                                                            docForm.setData('required_document_key', 'proposal');
                                                            docForm.setData('name', 'Proposal / Makalah Proyek');
                                                        }
                                                        setDocModalOpen(true);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
                                                >
                                                    <Upload className="size-3.5" />
                                                    <span>{selectedDocFolder !== 'all' ? `Unggah ke Folder` : `Unggah Berkas`}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Files Content: List or Grid View */}
                                    {filteredDocs.length > 0 ? (
                                        docViewMode === 'list' ? (
                                            /* LIST VIEW */
                                            <div className="space-y-2.5">
                                                {filteredDocs.map((doc: any) => {
                                                    const folderInfo = DOC_FOLDERS.find((f) => f.key === doc.required_document_key);
                                                    const fileUrl = doc.file_path || doc.file_url || doc.url || (doc.path ? (doc.path.startsWith('http') ? doc.path : '/storage/' + doc.path) : '#');
                                                    const isExternal = Boolean(doc.url || (doc.path && doc.path.startsWith('http')));

                                                    return (
                                                        <div
                                                            key={doc.id}
                                                            className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                                        >
                                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                                <div className="size-9 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                                                    <FileText className="size-4" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-bold text-slate-900 truncate max-w-sm">{doc.name}</span>
                                                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                                                            v{doc.version || 1}
                                                                        </span>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                                            doc.status === 'approved'
                                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                                : doc.status === 'revision_required'
                                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                        }`}>
                                                                            {doc.status === 'approved' ? 'Disetujui' : doc.status === 'revision_required' ? 'Perlu Revisi' : 'Menunggu Kurasi'}
                                                                        </span>
                                                                        {folderInfo && (
                                                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                                                                                📁 {folderInfo.label}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-400 mt-1">
                                                                        Diunggah oleh <strong className="text-slate-600 font-medium">{doc.uploader?.name || 'Anggota Tim'}</strong> • {new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                                    </p>
                                                                    {doc.feedback && (
                                                                        <div className="mt-2 p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                                                                            <AlertCircle className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                                                                            <div>
                                                                                <strong className="font-semibold">Masukan Mentor/Juri:</strong> {doc.feedback}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                                                {fileUrl !== '#' && (
                                                                    <a
                                                                        href={fileUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 transition text-xs shadow-2xs"
                                                                        title={isExternal ? 'Buka tautan' : 'Unduh berkas'}
                                                                    >
                                                                        {isExternal ? <ExternalLink className="size-3.5 text-slate-500" /> : <Download className="size-3.5 text-slate-500" />}
                                                                        <span>{isExternal ? 'Buka' : 'Unduh'}</span>
                                                                    </a>
                                                                )}

                                                                {isMember && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openReplaceModal(doc)}
                                                                        className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1 cursor-pointer transition text-xs shadow-2xs"
                                                                        title="Ganti atau perbarui versi berkas ini"
                                                                    >
                                                                        <RefreshCw className="size-3 shrink-0" />
                                                                        <span>Ganti</span>
                                                                    </button>
                                                                )}

                                                                {(isMember || isAdmin) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteDoc(doc)}
                                                                        className="p-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                                        title="Hapus berkas"
                                                                    >
                                                                        <Trash2 className="size-3.5 shrink-0" />
                                                                    </button>
                                                                )}

                                                                {(isMentor || isAdmin) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setReviewDocId(doc.id);
                                                                            setReviewModalOpen(true);
                                                                        }}
                                                                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition text-xs shadow-2xs"
                                                                    >
                                                                        Ulas
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            /* GRID VIEW */
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                                {filteredDocs.map((doc: any) => {
                                                    const folderInfo = DOC_FOLDERS.find((f) => f.key === doc.required_document_key);
                                                    const fileUrl = doc.file_path || doc.file_url || doc.url || (doc.path ? (doc.path.startsWith('http') ? doc.path : '/storage/' + doc.path) : '#');
                                                    const isExternal = Boolean(doc.url || (doc.path && doc.path.startsWith('http')));

                                                    return (
                                                        <div
                                                            key={doc.id}
                                                            className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3 text-xs"
                                                        >
                                                            <div className="space-y-2.5">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="size-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                                                                        <FileText className="size-5" />
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                                                            v{doc.version || 1}
                                                                        </span>
                                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                                            doc.status === 'approved'
                                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                                : doc.status === 'revision_required'
                                                                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                        }`}>
                                                                            {doc.status === 'approved' ? 'Disetujui' : doc.status === 'revision_required' ? 'Revisi' : 'Kurasi'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <h5 className="font-bold text-slate-900 truncate" title={doc.name}>
                                                                        {doc.name}
                                                                    </h5>
                                                                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                                                        {folderInfo && (
                                                                            <span className="truncate">📁 {folderInfo.label}</span>
                                                                        )}
                                                                        <span>•</span>
                                                                        <span>{new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                                                    </div>
                                                                    <p className="text-[10px] text-slate-500 mt-1 truncate">
                                                                        Oleh: {doc.uploader?.name || 'Anggota'}
                                                                    </p>
                                                                </div>

                                                                {doc.feedback && (
                                                                    <div className="p-2 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-900 line-clamp-2">
                                                                        <strong>Masukan:</strong> {doc.feedback}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                                                                {fileUrl !== '#' && (
                                                                    <a
                                                                        href={fileUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="flex-1 py-1.5 px-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center justify-center gap-1 transition text-xs shadow-2xs"
                                                                    >
                                                                        {isExternal ? <ExternalLink className="size-3" /> : <Download className="size-3" />}
                                                                        <span>{isExternal ? 'Buka' : 'Unduh'}</span>
                                                                    </a>
                                                                )}

                                                                {isMember && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openReplaceModal(doc)}
                                                                        className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                                                                        title="Ganti Berkas"
                                                                    >
                                                                        <RefreshCw className="size-3.5" />
                                                                    </button>
                                                                )}

                                                                {(isMember || isAdmin) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteDoc(doc)}
                                                                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                                                        title="Hapus Berkas"
                                                                    >
                                                                        <Trash2 className="size-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center py-10 px-4 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                                            <div className="size-12 rounded-2xl bg-white border border-slate-200 shadow-2xs mx-auto mb-3 flex items-center justify-center text-slate-400">
                                                <FolderOpen className="size-6 text-slate-400" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-800">
                                                {selectedDocFolder === 'all'
                                                    ? (docSearchQuery ? 'Tidak ada berkas yang sesuai dengan pencarian' : 'Belum Ada Berkas yang Diunggah')
                                                    : `Folder "${activeFolderObj?.label}" Masih Kosong`}
                                            </p>
                                            <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                                                {selectedDocFolder === 'all'
                                                    ? 'Tarik file langsung ke folder di atas atau klik tombol untuk mengunggah dokumen baru.'
                                                    : `Tarik file langsung ke folder ini atau klik tombol di bawah untuk menambahkan ${activeFolderObj?.label.toLowerCase() || 'berkas'}.`}
                                            </p>
                                            {canManageTasks && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (selectedDocFolder !== 'all' && activeFolderObj) {
                                                            docForm.setData('required_document_key', activeFolderObj.key);
                                                            docForm.setData('name', activeFolderObj.label);
                                                        } else {
                                                            docForm.setData('required_document_key', 'proposal');
                                                            docForm.setData('name', 'Proposal / Makalah Proyek');
                                                        }
                                                        setDocModalOpen(true);
                                                    }}
                                                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                                                >
                                                    <Upload className="size-3.5" />
                                                    <span>
                                                        {selectedDocFolder === 'all'
                                                            ? 'Unggah Berkas Baru'
                                                            : `Unggah ke Folder ${activeFolderObj?.label}`}
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* TAB CONTENT: AUDIT HISTORY */}
                {activeTab === 'history' && (
                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <History className="size-4 text-blue-600 shrink-0" />
                                <span>Riwayat Status</span>
                            </h3>
                        </div>

                        {(!participation.status_histories || participation.status_histories.length === 0) ? (
                            <div className="text-center py-6 text-slate-400 text-xs">Belum ada riwayat perubahan tercatat.</div>
                        ) : (
                            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200 pl-6">
                                {participation.status_histories.map((hist: any, i: number) => (
                                    <div key={hist.id || i} className="relative text-xs space-y-1">
                                        <div className="absolute -left-6 top-1.5 size-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">
                                                {hist.to_stage || hist.to_status}
                                            </span>
                                            {hist.from_stage && (
                                                <span className="text-[11px] text-slate-400">
                                                    (Sebelumnya: {hist.from_stage})
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400">
                                            Diperbarui oleh: {hist.changer?.name || 'Sistem'} • {new Date(hist.created_at).toLocaleString('id-ID')}
                                        </p>
                                        {hist.notes && (
                                            <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                "{hist.notes}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 7) MODAL FORMS */}

            {/* MODAL 1: UPDATE STAGE */}
            {stageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="w-full max-w-lg p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Pembaruan Tahap Seleksi</h3>
                            <button type="button" onClick={() => setStageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleStageUpdate} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Tahapan Saat Ini</label>
                                <select
                                    value={stageForm.data.stage}
                                    onChange={(e) => stageForm.setData('stage', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                                >
                                    {Object.entries(selectionStages).map(([k, v]) => (
                                        <option key={k} value={k}>{v.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Nomor Registrasi Resmi (Jika sudah terdaftar)</label>
                                <input
                                    type="text"
                                    value={stageForm.data.external_registration_proof}
                                    onChange={(e) => stageForm.setData('external_registration_proof', e.target.value)}
                                    placeholder="Contoh: REG-2027-GEMASTIK-001"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Tautan Bukti Pengumpulan Karya (Jika tahap submitted)</label>
                                <input
                                    type="text"
                                    value={stageForm.data.external_submission_proof}
                                    onChange={(e) => stageForm.setData('external_submission_proof', e.target.value)}
                                    placeholder="Contoh: https://... atau ID submit portal"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Catatan Progres (Opsional)</label>
                                <textarea
                                    rows={2}
                                    value={stageForm.data.notes}
                                    onChange={(e) => stageForm.setData('notes', e.target.value)}
                                    placeholder="Keterangan mengenai perubahan tahap ini..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStageModalOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={stageForm.processing}
                                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: SEND INVITATION (RECRUITING WITH APPROVAL) */}
            {inviteModalOpen && selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
                    <div className="w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Send className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Undang Rekan ke Tim</h3>
                                    <p className="text-[11px] text-slate-400">Perekrutan resmi dengan persetujuan mahasiswa</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleInviteCandidate} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Calon Anggota</label>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                                    <div className="size-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                        {(selectedCandidate.user?.name || selectedCandidate.name || 'M').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                            {selectedCandidate.user?.name || selectedCandidate.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {selectedCandidate.user?.study_program || selectedCandidate.user?.profile?.study_program || selectedCandidate.study_program || selectedCandidate.profile?.study_program || 'Mahasiswa'}
                                            {(selectedCandidate.user?.semester || selectedCandidate.user?.profile?.semester || selectedCandidate.semester || selectedCandidate.profile?.semester) ? ` • Sem ${selectedCandidate.user?.semester || selectedCandidate.user?.profile?.semester || selectedCandidate.semester || selectedCandidate.profile?.semester}` : ''}
                                            {(selectedCandidate.user?.campus_name || selectedCandidate.user?.profile?.campus?.name || selectedCandidate.campus_name || selectedCandidate.profile?.campus?.name) ? ` • ${selectedCandidate.user?.campus_name || selectedCandidate.user?.profile?.campus?.name || selectedCandidate.campus_name || selectedCandidate.profile?.campus?.name}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Peran / Posisi yang Ditawarkan <span className="text-blue-600">*</span>
                                </label>

                                {recruitmentRoles && recruitmentRoles.length > 0 && (
                                    <div className="mb-2">
                                        <span className="text-[10px] text-slate-400 font-semibold block mb-1">Pilih dari posisi terbuka:</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {recruitmentRoles.map((r: any) => (
                                                <button
                                                    type="button"
                                                    key={r.id}
                                                    onClick={() => setCandidateRoleName(r.name)}
                                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                                                        candidateRoleName === r.name
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {r.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <input
                                    type="text"
                                    required
                                    value={candidateRoleName}
                                    onChange={(e) => setCandidateRoleName(e.target.value)}
                                    placeholder="Contoh: UI/UX Designer, Frontend Developer, AI Engineer"
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Pesan Undangan (Opsional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    placeholder="Tuliskan alasan mengajak bergabung atau fokus tugas yang disiapkan..."
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                            </div>

                            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-2">
                                <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                                <span>
                                    Mahasiswa akan menerima notifikasi undangan di aplikasi dan email mereka. Keanggotaan resmi berlaku setelah mahasiswa menyetujui undangan ini.
                                </span>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setInviteModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                    Kirim Undangan Rekrutmen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EXPLORE & RECRUIT CAMPUS CANDIDATES */}
            {exploreModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
                    <div className="w-full max-w-2xl p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                                    <UserPlus className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Eksplor & Rekrut Rekan Kampus</h3>
                                    <p className="text-[11px] text-slate-400">Undang mahasiswa untuk mengisi peran yang dibutuhkan di tim kompetisi</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setExploreModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Cari nama mahasiswa, program studi, atau keahlian (contoh: UI/UX, React, AI)..."
                                value={candidateSearchQuery}
                                onChange={(e) => setCandidateSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
                            />
                        </div>

                        {/* Candidate Lists */}
                        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                            {/* Section A: Matchmaking Recommendations */}
                            {recommendedCandidates.length > 0 && !candidateSearchQuery && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <Sparkles className="size-3.5 text-blue-600" />
                                            <span>Rekomendasi Terbaik (Matchmaking)</span>
                                        </span>
                                        <span className="text-[10px] text-slate-400">Berdasarkan kecocokan skill</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {recommendedCandidates.map((cand: any) => {
                                            const u = cand.user || cand;
                                            const name = u.name || 'Mahasiswa';
                                            const studyProgram = u.study_program || u.profile?.study_program || 'Mahasiswa';
                                            const semester = u.semester || u.profile?.semester;
                                            const campusName = u.campus_name || u.profile?.campus?.name;
                                            const skills = Array.isArray(u.skills) ? u.skills : (u.profile?.skills || []);

                                            return (
                                                <div
                                                    key={u.id}
                                                    className="p-3.5 rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/40 to-white flex flex-col justify-between gap-2.5 shadow-2xs hover:border-blue-300 transition"
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
                                                                <p className="text-[11px] text-slate-500 truncate">
                                                                    {studyProgram} {semester ? `• Sem ${semester}` : ''}
                                                                    {campusName ? ` • ${campusName}` : ''}
                                                                </p>
                                                            </div>
                                                            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-600 text-white shrink-0 shadow-2xs">
                                                                {cand.final_score}% Cocok
                                                            </span>
                                                        </div>

                                                        {skills.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {skills.slice(0, 3).map((sk: any, i: number) => (
                                                                    <span key={i} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                                                                        {typeof sk === 'string' ? sk : sk.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => openInviteModalForCandidate(cand)}
                                                        className="w-full py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs text-center"
                                                    >
                                                        Undang ke Tim
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Section B: All Campus Students */}
                            <div className="space-y-2">
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                                    Mahasiswa Tersedia di Kampus
                                </span>

                                {(() => {
                                    const pool = availableStudents && availableStudents.length > 0
                                        ? availableStudents
                                        : recommendedCandidates.map((r: any) => r.user || r);

                                    const filtered = pool.filter((s: any) => {
                                        if (!candidateSearchQuery.trim()) return true;
                                        const q = candidateSearchQuery.toLowerCase();
                                        const nameMatch = (s.name || '').toLowerCase().includes(q);
                                        const prodiMatch = (s.study_program || s.profile?.study_program || '').toLowerCase().includes(q);
                                        const skills = Array.isArray(s.skills) ? s.skills : (s.profile?.skills || []);
                                        const skillsMatch = skills.some((sk: any) => (typeof sk === 'string' ? sk : sk.name || '').toLowerCase().includes(q));
                                        return nameMatch || prodiMatch || skillsMatch;
                                    });

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                                <p className="text-xs font-bold text-slate-700">Tidak ada mahasiswa yang cocok</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">Coba ubah kata kunci pencarian nama atau keahlian.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-2">
                                            {filtered.map((s: any) => {
                                                const name = s.name || 'Mahasiswa';
                                                const studyProgram = s.study_program || s.profile?.study_program || 'Mahasiswa';
                                                const semester = s.semester || s.profile?.semester;
                                                const campusName = s.campus_name || s.profile?.campus?.name;
                                                const skills = Array.isArray(s.skills) ? s.skills : (s.profile?.skills || []);

                                                return (
                                                    <div
                                                        key={s.id}
                                                        className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="size-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                                {name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-slate-900 truncate">{name}</p>
                                                                <p className="text-[11px] text-slate-500 truncate">
                                                                    {studyProgram} {semester ? `• Semester ${semester}` : ''}
                                                                    {campusName ? ` • ${campusName}` : ''}
                                                                </p>
                                                                {skills.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {skills.slice(0, 3).map((sk: any, i: number) => (
                                                                            <span key={i} className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                                                                {typeof sk === 'string' ? sk : sk.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => openInviteModalForCandidate(s)}
                                                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs shrink-0 self-end sm:self-center"
                                                        >
                                                            Undang ke Tim
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setExploreModalOpen(false)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: CREATE TASK */}
            {taskModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Tambah Tugas Baru</h3>
                            <button type="button" onClick={() => setTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Judul Tugas <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={taskForm.data.title}
                                    onChange={(e) => taskForm.setData('title', e.target.value)}
                                    placeholder="Contoh: Susun Bab 1 Proposal PKM"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Deskripsi Rinci</label>
                                <textarea
                                    rows={2}
                                    value={taskForm.data.description}
                                    onChange={(e) => taskForm.setData('description', e.target.value)}
                                    placeholder="Instruksi pengerjaan tugas..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1">Prioritas</label>
                                    <select
                                        value={taskForm.data.priority}
                                        onChange={(e) => taskForm.setData('priority', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                    >
                                        <option value="low">Rendah</option>
                                        <option value="medium">Sedang</option>
                                        <option value="high">Tinggi</option>
                                        <option value="urgent">Mendesak</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1">Batas Waktu</label>
                                    <input
                                        type="date"
                                        value={taskForm.data.due_on}
                                        onChange={(e) => taskForm.setData('due_on', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Penanggung Jawab</label>
                                <select
                                    value={taskForm.data.assignee_id}
                                    onChange={(e) => taskForm.setData('assignee_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                >
                                    <option value="">Pilih Anggota Tim</option>
                                    {participation.team?.members?.map((m: any) => (
                                        <option key={m.user_id} value={m.user_id}>{m.user?.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTaskModalOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={taskForm.processing}
                                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
                                >
                                    Simpan Kartu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: UPLOAD DOCUMENT */}
            {docModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Unggah Berkas / Karya</h3>
                            <button type="button" onClick={() => setDocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadDoc} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Jenis Dokumen</label>
                                <select
                                    value={docForm.data.required_document_key}
                                    onChange={(e) => {
                                        docForm.setData('required_document_key', e.target.value);
                                        const found = deliverableTemplates.find((t) => t.key === e.target.value);
                                        if (found) docForm.setData('name', found.label);
                                    }}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                >
                                    {deliverableTemplates.map((t) => (
                                        <option key={t.key} value={t.key}>{t.label}</option>
                                    ))}
                                    <option value="other">Lainnya / Berkas Tambahan</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Nama Dokumen</label>
                                <input
                                    type="text"
                                    required
                                    value={docForm.data.name}
                                    onChange={(e) => docForm.setData('name', e.target.value)}
                                    placeholder="Contoh: Proposal Final GEMASTIK 2026"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Unggah Berkas (PDF / ZIP / Gambar - Maks 70MB per tim)</label>
                                <input
                                    type="file"
                                    onChange={(e) => docForm.setData('file', e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Atau Tautan Eksternal (Google Drive / GitHub / Figma)</label>
                                <input
                                    type="url"
                                    value={docForm.data.url}
                                    onChange={(e) => docForm.setData('url', e.target.value)}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDocModalOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={docForm.processing}
                                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
                                >
                                    Unggah Dokumen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4B: REPLACE / UPDATE DOCUMENT */}
            {replaceModalOpen && selectedDocToReplace && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <RefreshCw className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-slate-900 truncate">Ganti / Perbarui Berkas</h3>
                                    <p className="text-[11px] text-slate-500">Versi aktif saat ini: v{selectedDocToReplace.version}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setReplaceModalOpen(false);
                                    setSelectedDocToReplace(null);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleReplaceDoc} className="space-y-4 pt-4 text-xs">
                            {/* Mode Selection */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700">Metode Pembaruan</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => replaceForm.setData('mode', 'replace')}
                                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                                            replaceForm.data.mode === 'replace'
                                                ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-bold ring-1 ring-blue-600/30'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span className="block text-xs font-bold">Ganti Langsung</span>
                                        <span className="block text-[10px] text-slate-500 mt-0.5">Timpa berkas lama (tetap v{selectedDocToReplace.version})</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => replaceForm.setData('mode', 'new_version')}
                                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                                            replaceForm.data.mode === 'new_version'
                                                ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-bold ring-1 ring-blue-600/30'
                                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span className="block text-xs font-bold">Buat Versi Baru</span>
                                        <span className="block text-[10px] text-slate-500 mt-0.5">Simpan riwayat (naik ke v{selectedDocToReplace.version + 1})</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Judul / Nama Berkas</label>
                                <input
                                    type="text"
                                    value={replaceForm.data.name}
                                    onChange={(e) => replaceForm.setData('name', e.target.value)}
                                    placeholder="Nama berkas"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Pilih Berkas Pengganti Baru (Maks 70MB, kuota tim 70MB)
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => replaceForm.setData('file', e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1 bg-slate-50"
                                />
                                {selectedDocToReplace.original_name && (
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        Berkas saat ini: <span className="font-mono text-slate-600">{selectedDocToReplace.original_name}</span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Atau Tautan Berkas / Cloud Drive URL
                                </label>
                                <input
                                    type="url"
                                    value={replaceForm.data.url}
                                    onChange={(e) => replaceForm.setData('url', e.target.value)}
                                    placeholder="https://drive.google.com/... atau https://figma.com/..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setReplaceModalOpen(false);
                                        setSelectedDocToReplace(null);
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={replaceForm.processing}
                                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer transition shadow-xs"
                                >
                                    {replaceForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: REVIEW DOCUMENT */}
            {reviewModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Ulas Berkas Karya</h3>
                            <button type="button" onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleReviewDoc} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Status Penilaian</label>
                                <select
                                    value={reviewForm.data.status}
                                    onChange={(e) => reviewForm.setData('status', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                >
                                    <option value="approved">Disetujui (Approved)</option>
                                    <option value="revision_required">Perlu Revisi (Revision Required)</option>
                                    <option value="in_review">Sedang Ditinjau (In Review)</option>
                                    <option value="rejected">Ditolak (Rejected)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Catatan Masukan</label>
                                <textarea
                                    rows={3}
                                    value={reviewForm.data.feedback}
                                    onChange={(e) => reviewForm.setData('feedback', e.target.value)}
                                    placeholder="Tuliskan catatan perbaikan atau apresiasi..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold"
                                >
                                    Simpan Ulasan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 6: AI TASK ORCHESTRATOR */}
            {aiModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="w-full max-w-lg p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="size-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-2xs">
                                    <Sparkles className="size-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Susun Tugas AI (Google Gemini)</h3>
                                    <p className="text-xs text-slate-500">Orkestrasi roadmap kerja sprint berorientasi juara</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => !aiGenerating && setAiModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleExecuteAiGenerate} className="mt-4 space-y-4">
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 space-y-1">
                                <div className="font-bold flex items-center gap-1.5 text-purple-900">
                                    <Sparkles className="size-3.5 text-purple-600 shrink-0" />
                                    <span>AI Technical Mentor & Sprint Orchestrator</span>
                                </div>
                                <p className="text-purple-800/90 leading-relaxed text-[11px]">
                                    AI menganalisis kompetisi <strong>{participation.competition?.name}</strong>, memetakan deliverable wajib, dan merumuskan daftar tugas Kanban terstruktur lengkap dengan estimasi waktu dan rekomendasi peran PIC.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">
                                    Jalur / Kategori Bidang Kompetisi
                                </label>
                                <input
                                    type="text"
                                    value={aiTrack}
                                    onChange={(e) => setAiTrack(e.target.value)}
                                    placeholder="Contoh: PKM-VGK (Video Gagasan Konstruktif), Hackathon, Business Plan..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Format disesuaikan otomatis dengan panduan resmi (misal: PKM Belmawa, Gemastik, KTI).
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">
                                    Fokus / Gagasan Proyek Tim <span className="text-slate-400 font-normal">(Opsional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={aiFocus}
                                    onChange={(e) => setAiFocus(e.target.value)}
                                    placeholder="Contoh: Video animasi 3D dan gagasan konstruktif tentang sistem tata air pintar pencegah rob pesisir berbasis kecerdasan buatan..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Beri tahu AI topik atau gagasan karya tim Anda agar tugas yang dihasilkan semakin tajam dan kontekstual.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                    Mode Penyusunan Kartu Tugas
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    <label className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col gap-1 transition ${
                                        aiMode === 'replace'
                                            ? 'border-purple-500 bg-purple-50/50 text-purple-950 ring-1 ring-purple-400'
                                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="aiMode"
                                                value="replace"
                                                checked={aiMode === 'replace'}
                                                onChange={() => setAiMode('replace')}
                                                className="text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="font-bold text-slate-900">Fresh Start (Rapi)</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 pl-5 leading-normal">
                                            Bersihkan tugas lama dan buat rencana kerja baru yang rapi dari awal.
                                        </span>
                                    </label>

                                    <label className={`p-3 rounded-xl border text-xs cursor-pointer flex flex-col gap-1 transition ${
                                        aiMode === 'append'
                                            ? 'border-purple-500 bg-purple-50/50 text-purple-950 ring-1 ring-purple-400'
                                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="aiMode"
                                                value="append"
                                                checked={aiMode === 'append'}
                                                onChange={() => setAiMode('append')}
                                                className="text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="font-bold text-slate-900">Tambahkan (Append)</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 pl-5 leading-normal">
                                            Pertahankan tugas yang ada dan tambahkan tugas baru ke kolom Todo.
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    disabled={aiGenerating}
                                    onClick={() => setAiModalOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={aiGenerating}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-60 cursor-pointer"
                                >
                                    <Sparkles className="size-3.5" />
                                    <span>{aiGenerating ? 'AI Sedang Menganalisis & Menyusun...' : 'Mulai Susun Roadmap AI'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: DETAIL PROFIL PELAMAR */}
            {selectedApplicantModal && (() => {
                const app = selectedApplicantModal;
                const applicant = app.user;
                const phone = app.contact_phone || applicant?.phone;
                const greeting = `Halo ${applicant?.name || 'Rekan'}, saya ${participation.team?.leader?.name || 'Ketua'} dari tim ${participation.team?.name} untuk kompetisi ${participation.competition?.name}. Saya melihat lamaran Anda untuk peran ${app.role_name}. Bisakah kita ngobrol lebih lanjut mengenai persiapan tim?`;
                const waUrl = phone ? formatWhatsAppUrl(phone, greeting) : null;
                const publicPortfolioUrl = applicant?.slug ? route('portfolio.public', applicant.slug) : null;
                const portfolioUrl = app.portfolio_url || applicant?.portfolio_url;
                const githubUrl = applicant?.github_url;
                const linkedinUrl = applicant?.linkedin_url;
                const skills = applicant?.skills || [];
                const experiences = applicant?.experiences || [];

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                        <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl max-h-[90vh] flex flex-col overflow-hidden">
                            {/* Modal Header */}
                            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/60">
                                <div className="flex items-start gap-3.5 min-w-0">
                                    <div className="size-14 rounded-2xl bg-slate-900 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
                                        {applicant?.name ? applicant.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-lg font-bold text-slate-900 truncate">
                                                {applicant?.name || 'Mahasiswa'}
                                            </h3>
                                            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                Posisi: {app.role_name || 'Anggota Tim'}
                                            </span>
                                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                                                app.status === 'accepted'
                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    : app.status === 'rejected'
                                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                            }`}>
                                                {app.status === 'accepted' ? 'Diterima' : app.status === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                                            <span className="flex items-center gap-1 font-medium text-slate-700">
                                                <GraduationCap className="size-3.5 text-blue-600" />
                                                <span>{applicant?.study_program || 'Mahasiswa'} {applicant?.semester ? `• Semester ${applicant.semester}` : ''}</span>
                                            </span>
                                            {applicant?.campus_name && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-slate-600">{applicant.campus_name}</span>
                                                </>
                                            )}
                                            {applicant?.nim && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="font-mono text-slate-400">NIM: {applicant.nim}</span>
                                                </>
                                            )}
                                        </p>

                                        {applicant?.headline && (
                                            <p className="text-xs text-slate-600 mt-1.5 italic font-medium">
                                                "{applicant.headline}"
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelectedApplicantModal(null)}
                                    className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer shrink-0"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
                                {/* Motivation / Cover Message */}
                                {app.message && (
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <FileText className="size-3.5 text-blue-600" />
                                            <span>Pesan Lamaran & Motivasi</span>
                                        </span>
                                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic">
                                            "{app.message}"
                                        </div>
                                    </div>
                                )}

                                {/* Bio */}
                                {applicant?.bio && (
                                    <div className="space-y-1.5">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                            Tentang Pelamar
                                        </span>
                                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {applicant.bio}
                                        </p>
                                    </div>
                                )}

                                {/* Technical Skills */}
                                <div className="space-y-2">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Award className="size-3.5 text-blue-600" />
                                        <span>Keahlian & Kemampuan Teknis</span>
                                    </span>
                                    {skills.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {skills.map((skill: any, idx: number) => {
                                                const skillName = typeof skill === 'string' ? skill : skill.name;
                                                const proficiency = typeof skill === 'object' ? skill.proficiency : null;
                                                return (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200/70"
                                                    >
                                                        <span>{skillName}</span>
                                                        {proficiency && (
                                                            <span className="text-[10px] text-blue-600 font-mono font-bold capitalize">
                                                                • {proficiency}
                                                            </span>
                                                        )}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">
                                            Belum mencantumkan daftar keahlian spesifik di profil.
                                        </p>
                                    )}
                                </div>

                                {/* Experience History */}
                                {experiences.length > 0 && (
                                    <div className="space-y-2.5">
                                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <Briefcase className="size-3.5 text-blue-600" />
                                            <span>Pengalaman & Riwayat Proyek ({experiences.length})</span>
                                        </span>
                                        <div className="space-y-2">
                                            {experiences.map((exp: any, idx: number) => (
                                                <div key={idx} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h5 className="text-xs font-bold text-slate-900">{exp.title}</h5>
                                                            {exp.organization && (
                                                                <p className="text-[11px] text-slate-500 font-medium">{exp.organization}</p>
                                                            )}
                                                        </div>
                                                        {(exp.started_on || exp.ended_on) && (
                                                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                                                {exp.started_on} - {exp.ended_on}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {exp.description && (
                                                        <p className="text-[11px] text-slate-600 leading-relaxed pt-0.5">
                                                            {exp.description}
                                                        </p>
                                                    )}
                                                    {exp.url && (
                                                        <a
                                                            href={exp.url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline pt-0.5"
                                                        >
                                                            <span>Lihat Karya / Bukti</span>
                                                            <ExternalLink className="size-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* External Portfolios & Social Links */}
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Globe className="size-3.5 text-blue-600" />
                                        <span>Tautan Portofolio & Kontak Pelamar</span>
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {publicPortfolioUrl && (
                                            <a
                                                href={publicPortfolioUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-800 font-semibold text-xs flex items-center justify-between transition group"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Award className="size-4 text-blue-600" />
                                                    <span>Halaman Portofolio RAKIT</span>
                                                </span>
                                                <ExternalLink className="size-3.5 text-blue-500 group-hover:translate-x-0.5 transition" />
                                            </a>
                                        )}

                                        {portfolioUrl && (
                                            <a
                                                href={portfolioUrl.startsWith('http') ? portfolioUrl : `https://${portfolioUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-between transition group"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Globe className="size-4 text-slate-500" />
                                                    <span className="truncate max-w-[170px]">Web / Portofolio Eksternal</span>
                                                </span>
                                                <ExternalLink className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                                            </a>
                                        )}

                                        {githubUrl && (
                                            <a
                                                href={githubUrl.startsWith('http') ? githubUrl : `https://${githubUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-between transition group"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Github className="size-4 text-slate-700" />
                                                    <span className="truncate max-w-[170px]">Profil GitHub</span>
                                                </span>
                                                <ExternalLink className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                                            </a>
                                        )}

                                        {linkedinUrl && (
                                            <a
                                                href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-between transition group"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <Linkedin className="size-4 text-blue-600" />
                                                    <span className="truncate max-w-[170px]">Profil LinkedIn</span>
                                                </span>
                                                <ExternalLink className="size-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                                            </a>
                                        )}

                                        {applicant?.email && (
                                            <a
                                                href={`mailto:${applicant.email}`}
                                                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-between transition"
                                            >
                                                <span className="flex items-center gap-2 truncate">
                                                    <Mail className="size-4 text-slate-500 shrink-0" />
                                                    <span className="truncate">{applicant.email}</span>
                                                </span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    {waUrl && (
                                        <a
                                            href={waUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-2xs"
                                        >
                                            <Phone className="size-3.5" />
                                            <span>Hubungi via WhatsApp</span>
                                        </a>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {isLeader && app.status === 'pending' && !participation.is_formation_locked && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleRespondApplication(app.id, 'reject');
                                                    setSelectedApplicantModal(null);
                                                }}
                                                className="px-3.5 py-2 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold transition cursor-pointer"
                                            >
                                                Tolak Lamaran
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleRespondApplication(app.id, 'accept');
                                                    setSelectedApplicantModal(null);
                                                }}
                                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                                            >
                                                Terima Masuk Tim
                                            </button>
                                        </>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedApplicantModal(null)}
                                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </AppLayout>
    );
}
