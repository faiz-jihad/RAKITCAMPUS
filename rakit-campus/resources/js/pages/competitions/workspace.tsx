import { formatWhatsAppUrl } from '@/components/competitions/ApplyCompetitionTeamModal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Briefcase,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Copy,
    Download,
    ExternalLink,
    FileText,
    Filter,
    FolderKanban,
    Globe,
    GraduationCap,
    HardDrive,
    History,
    Lock,
    PenLine,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    Trash2,
    Trophy,
    Upload,
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
}

export default function CompetitionWorkspace({
    participation,
    readinessScore,
    recommendedCandidates = [],
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
}: Props) {
    const canManageTasks = Boolean(isMember || isLeader || isAdmin);
    const [activeTab, setActiveTab] = useState<'overview' | 'applicants' | 'kanban' | 'documents' | 'rounds' | 'mentoring' | 'results' | 'history'>('overview');

    // MinSatu Roles & Applicants State
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleSlots, setNewRoleSlots] = useState(1);
    const [newRoleReqs, setNewRoleReqs] = useState('');
    const [addingRole, setAddingRole] = useState(false);

    // Modals
    const [stageModalOpen, setStageModalOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [candidateRoleName, setCandidateRoleName] = useState('Anggota Tim');
    const [inviteMessage, setInviteMessage] = useState('');
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [docModalOpen, setDocModalOpen] = useState(false);
    const [replaceModalOpen, setReplaceModalOpen] = useState(false);
    const [selectedDocToReplace, setSelectedDocToReplace] = useState<any>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewDocId, setReviewDocId] = useState<number | null>(null);
    const [mentorModalOpen, setMentorModalOpen] = useState(false);
    const [resultModalOpen, setResultModalOpen] = useState(false);
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

    const mentorForm = useForm({
        lecturer_id: availableLecturers[0]?.id || '',
        notes: '',
    });

    const resultForm = useForm({
        outcome: '1st_place',
        achievement_title: `Juara Kompetisi: ${participation.competition?.name}`,
        rank: 1,
        notes: '',
        evidence_url: '',
        certificate: null as File | null,
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

    const handleInviteCandidate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCandidate) return;

        router.post(
            route('competitions.invitations.send', participation.id),
            {
                student_id: selectedCandidate.user.id,
                role_name: candidateRoleName,
                message: inviteMessage,
            },
            {
                onSuccess: () => {
                    setInviteModalOpen(false);
                    setSelectedCandidate(null);
                    setInviteMessage('');
                },
            }
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

    const handleAssignMentor = (e: React.FormEvent) => {
        e.preventDefault();
        mentorForm.post(route('competitions.mentors.assign', participation.id), {
            onSuccess: () => setMentorModalOpen(false),
        });
    };

    const handleRecordResult = (e: React.FormEvent) => {
        e.preventDefault();
        resultForm.post(route('competitions.result.record', participation.id), {
            forceFormData: true,
            onSuccess: () => setResultModalOpen(false),
        });
    };

    const handleVerifyResult = () => {
        if (confirm('Verifikasi sertifikat dan terbitkan prestasi ini ke portofolio mahasiswa secara resmi?')) {
            router.post(route('competitions.result.verify', participation.id));
        }
    };

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
                        {participation.competition?.official_url && (
                            <a
                                href={participation.competition.official_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
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
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs"
                            >
                                <span>Portal Pendaftaran</span>
                                <ExternalLink className="size-3 shrink-0" />
                            </a>
                        )}

                        {isMember && (
                            <button
                                type="button"
                                onClick={handleOpenAiModal}
                                disabled={aiGenerating}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-800 hover:text-blue-700 text-xs font-bold transition cursor-pointer shadow-2xs disabled:opacity-50"
                                title="Susun otomatis rencana tugas Kanban menggunakan AI"
                            >
                                <Sparkles className="size-3.5 text-blue-600" />
                                <span>{aiGenerating ? 'AI Menyusun...' : 'Susun Tugas AI'}</span>
                            </button>
                        )}

                        {(isMentor || isAdmin) && participation.formation_status !== 'approved' && (
                            <button
                                type="button"
                                onClick={handleApproveFormation}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                            >
                                <ShieldCheck className="size-3.5" />
                                <span>Setujui Tim</span>
                            </button>
                        )}

                        {isLeader && !participation.is_formation_locked && (
                            <button
                                type="button"
                                onClick={handleLockFormation}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                            >
                                <Lock className="size-3.5 text-slate-500" />
                                <span>Kunci Tim</span>
                            </button>
                        )}

                        {(isLeader || isMentor || isAdmin) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                                    >
                                        <span>Kelola Tim</span>
                                        <ChevronDown className="size-3 text-slate-400 shrink-0" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                    <DropdownMenuItem
                                        onClick={() => setStageModalOpen(true)}
                                        className="cursor-pointer gap-2"
                                    >
                                        <Sparkles className="size-3.5 text-blue-600" />
                                        <span>Update Tahapan</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={() => setResultModalOpen(true)}
                                        className="cursor-pointer gap-2"
                                    >
                                        <Trophy className="size-3.5 text-slate-700" />
                                        <span>Catat Prestasi</span>
                                    </DropdownMenuItem>

                                    {isLeader && !participation.is_formation_locked && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={handleLockFormation}
                                                className="cursor-pointer gap-2"
                                            >
                                                <Lock className="size-3.5 text-slate-500" />
                                                <span>Kunci Tim</span>
                                            </DropdownMenuItem>
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                        { id: 'applicants', label: 'Pelamar', icon: UserPlus, count: incomingApplications.length, badge: pendingAppsCount > 0 ? `${pendingAppsCount} Baru` : null },
                        { id: 'documents', label: 'Berkas & Karya', icon: FileText, count: participation.documents?.length || 0 },
                        { id: 'rounds', label: 'Babak Seleksi', icon: Clock, count: rounds.length },
                        { id: 'mentoring', label: 'Bimbingan', icon: GraduationCap },
                        { id: 'results', label: 'Prestasi', icon: Trophy },
                        { id: 'history', label: 'Riwayat', icon: History, count: participation.status_histories?.length || 0 },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`shrink-0 flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold transition rounded-t-lg border-b-2 whitespace-nowrap cursor-pointer -mb-px ${
                                    isActive
                                        ? 'border-blue-600 text-blue-600 bg-white shadow-2xs'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                <Icon className="size-3.5 shrink-0" />
                                <span>{tab.label}</span>
                                {typeof tab.count === 'number' && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md min-w-[18px] text-center shrink-0 ${
                                        isActive ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'
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
                            className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 my-1 text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg transition"
                        >
                            <Sparkles className="size-3.5 text-blue-600" />
                            <span>AI Workspace</span>
                        </Link>
                    )}
                </div>

                {/* 3. TAB CONTENT: BENTO GRID OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
                        {/* BENTO CARD 1: Master Team Identity & Readiness Hero (lg:col-span-8) */}
                        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-5">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                        {participation.competition?.category?.replace('_', ' ') || 'Kompetisi'} • Tingkat {participation.competition?.level || 'Nasional'}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => (isLeader || isMentor || isAdmin) && setStageModalOpen(true)}
                                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 transition ${
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
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[260px]">
                                            Jalur: {participation.category_track}
                                        </span>
                                    )}

                                    {participation.is_formation_locked && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                                            <Lock className="size-3" />
                                            <span>Terkunci</span>
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                            {participation.team?.name || 'Tim Mahasiswa'}
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewTeamName(participation.team?.name || '');
                                                setRenameModalOpen(true);
                                            }}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50 text-[11px] font-bold text-slate-600 hover:text-blue-600 transition shadow-2xs cursor-pointer"
                                            title="Ubah Nama Tim"
                                        >
                                            <PenLine className="size-3" />
                                            <span>Ubah Nama Tim</span>
                                        </button>
                                    </div>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-1">
                                        Kompetisi: <strong className="text-slate-800 font-semibold">{participation.competition?.name}</strong>
                                        {participation.competition?.organizer ? ` • ${participation.competition.organizer}` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Readiness KPI Strip */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Kesiapan Tim & Berkas</span>
                                    <span className="font-extrabold text-blue-600 font-mono text-lg">{readinessScore}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min(100, Math.max(0, readinessScore))}%` }}
                                    />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 font-medium">
                                    <div className="flex items-center gap-3">
                                        <span>Tugas: <strong className="text-slate-800 font-bold">{(participation.team?.tasks || []).filter((t: any) => t.status === 'completed').length}/{participation.team?.tasks?.length || 0}</strong> Selesai</span>
                                        <span>Berkas: <strong className="text-slate-800 font-bold">{(participation.documents || []).filter((d: any) => d.path || d.url).length}/{(participation.competition?.required_documents || ['proposal', 'pitch_deck']).length}</strong> Terunggah</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                        Formula: 50% Tugas Kanban + 50% Berkas Wajib
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* BENTO CARD 2: Sprint & Task Progress (lg:col-span-4) */}
                        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-4">
                            <div>
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                    <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
                                        <FolderKanban className="size-4 text-blue-600 shrink-0" />
                                        <span>Sprint & Tugas</span>
                                    </span>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                        {taskPercentage}% Selesai
                                    </span>
                                </div>
                                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-1">
                                    {completedTasks} <span className="text-sm font-semibold text-slate-500 font-sans">/ {totalTasks} Tugas</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden my-2.5">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                                        style={{ width: `${taskPercentage}%` }}
                                    />
                                </div>
                                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                                    <span>{inProgressTasks} Dalam Proses</span>
                                    <span>{todoTasks} Belum Mulai</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab('kanban')}
                                className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 hover:text-blue-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <span>Buka Papan Tugas</span>
                                <span>&rarr;</span>
                            </button>
                        </div>

                        {/* BENTO CARD 3: Linimasa & Deadline (lg:col-span-4) */}
                        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-4">
                            <div>
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                    <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
                                        <Clock className="size-4 text-blue-600 shrink-0" />
                                        <span>Linimasa & Batas</span>
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                        {selectionStages[participation.stage]?.label || participation.stage}
                                    </span>
                                </div>
                                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-1">
                                    {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} Hari` : 'Hari Ini') : 'Terbuka'}
                                    <span className="text-xs font-semibold text-slate-500 font-sans ml-1">
                                        {daysLeft !== null && daysLeft > 0 ? 'Tersisa' : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Batas Pendaftaran: <strong className="text-slate-800 font-semibold">{formattedDeadline}</strong>
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    {rounds.length > 0 ? `${rounds.length} Babak Seleksi Resmi` : `Format: ${participation.competition?.competition_type || 'Tim'}`}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab('rounds')}
                                className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 hover:text-blue-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <span>Lihat Jadwal Seleksi</span>
                                <span>&rarr;</span>
                            </button>
                        </div>

                        {/* BENTO CARD 4: Kesiapan Dokumen & Deliverables (lg:col-span-4) */}
                        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-4">
                            <div>
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                    <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
                                        <FileText className="size-4 text-blue-600 shrink-0" />
                                        <span>Berkas & Karya</span>
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                                        {totalDocs} Berkas
                                    </span>
                                </div>
                                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight my-1">
                                    {totalDocs} <span className="text-sm font-semibold text-slate-500 font-sans">Dokumen Siap</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Penyimpanan: <strong className="text-slate-800 font-semibold">{storageQuota ? `${storageQuota.used_mb}MB / ${storageQuota.max_mb}MB` : 'Aktif'}</strong>
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                    Proposal, Pitch Deck, & Kelengkapan Lomba
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab('documents')}
                                className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 hover:text-blue-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <span>Kelola Berkas</span>
                                <span>&rarr;</span>
                            </button>
                        </div>

                        {/* BENTO CARD 5: Bimbingan Dosen (lg:col-span-4) */}
                        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-4">
                            <div>
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                    <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-slate-700">
                                        <GraduationCap className="size-4 text-blue-600 shrink-0" />
                                        <span>Bimbingan Dosen</span>
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                        {participation.mentor ? 'Terhubung' : 'Mandiri'}
                                    </span>
                                </div>
                                {participation.mentor ? (
                                    <div className="my-1">
                                        <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
                                            {participation.mentor.name}
                                        </div>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{participation.mentor.email}</p>
                                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                                            {participation.mentor_notes || 'Dosen pendamping resmi untuk kompetisi ini.'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="my-1">
                                        <div className="text-base font-bold text-slate-900">Belum Ada Pembimbing</div>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Hubungkan tim dengan dosen kampus untuk review substansi karya & strategi presentasi.
                                        </p>
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveTab('mentoring')}
                                className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-white text-xs font-bold text-slate-700 hover:text-blue-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                                <span>{participation.mentor ? 'Ruang Bimbingan' : 'Ajukan Bimbingan Dosen'}</span>
                                <span>&rarr;</span>
                            </button>
                        </div>

                        {/* BENTO CARD 6: Susunan Tim & Kontak (lg:col-span-8) */}
                        <div className="lg:col-span-8 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Users className="size-4 text-blue-600 shrink-0" />
                                        <span>Susunan Anggota Tim</span>
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {participation.team?.members?.length || 0} dari {participation.team?.capacity || participation.competition?.max_team_size || 5} kuota terisi
                                    </p>
                                </div>

                                {isLeader && !participation.is_formation_locked && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('applicants')}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shadow-2xs"
                                    >
                                        <UserPlus className="size-3.5 shrink-0" />
                                        <span>Buka Lowongan Peran</span>
                                    </button>
                                )}
                            </div>

                            <div className="divide-y divide-slate-100">
                                {participation.team?.members?.map((member: any) => {
                                    const isCurrentUser = member.user_id === participation.team?.members?.find((m: any) => m.user_id === member.user_id)?.user_id;
                                    const phone = member.user?.phone || member.user?.student_profile?.phone;
                                    const waUrl = phone ? formatWhatsAppUrl(phone, `Halo ${member.user?.name}, terkait progres tim kompetisi ${participation.team?.name}`) : null;

                                    return (
                                        <div key={member.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                    {member.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-slate-900 truncate">{member.user?.name}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                                            member.permission === 'leader'
                                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                        }`}>
                                                            {member.role_name || (member.permission === 'leader' ? 'Ketua Tim' : 'Anggota')}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                                        NIM: {member.user?.student_profile?.nim || 'Aktif'} • Bergabung: {new Date(member.joined_at || member.created_at).toLocaleDateString('id-ID')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-wrap sm:justify-end shrink-0">
                                                {member.user?.skills?.slice(0, 2).map((sk: any) => (
                                                    <span key={sk.id} className="text-[10px] px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 font-medium">
                                                        {sk.name}
                                                    </span>
                                                ))}

                                                {waUrl && (
                                                    <a
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition border border-slate-200"
                                                        title={`Chat WhatsApp: ${phone}`}
                                                    >
                                                        <Phone className="size-3.5" />
                                                    </a>
                                                )}

                                                {(isLeader || isCurrentUser) && member.permission !== 'leader' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleWithdrawMember(member.user_id, member.user?.name)}
                                                        title="Lepas keanggotaan"
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                                    >
                                                        <UserMinus className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* BENTO CARD 7: Rekomendasi Rekan Tim / Smart Matchmaking (lg:col-span-4) */}
                        <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="size-3.5 text-blue-600 shrink-0" />
                                        <span>Rekomendasi Rekan</span>
                                    </h4>
                                    <span className="text-[10px] text-slate-400 shrink-0">Matchmaking</span>
                                </div>

                                {recommendedCandidates.length === 0 ? (
                                    <p className="text-xs text-slate-400 py-6 text-center">
                                        Tidak ada rekomendasi rekan tambahan saat ini.
                                    </p>
                                ) : (
                                    <div className="space-y-2.5">
                                        {recommendedCandidates.slice(0, 3).map((cand: any) => (
                                            <div
                                                key={cand.user.id}
                                                className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 transition space-y-2 bg-slate-50/50"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-bold text-slate-900 truncate">{cand.user.name}</div>
                                                        <p className="text-[10px] text-slate-400 truncate">{cand.explanation}</p>
                                                    </div>
                                                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                                        {cand.final_score}%
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-200/60">
                                                    {cand.matched_skills?.slice(0, 2).map((sk: string, i: number) => (
                                                        <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 font-medium">
                                                            {sk}
                                                        </span>
                                                    ))}
                                                </div>

                                                {isLeader && !participation.is_formation_locked && cand.eligible && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCandidate(cand);
                                                            setInviteModalOpen(true);
                                                        }}
                                                        className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition cursor-pointer"
                                                    >
                                                        Undang ke Tim
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                <span>Format Tim: {participation.competition?.min_team_size || 1}-{participation.competition?.max_team_size || 5} Orang</span>
                                {participation.competition?.prize_info && (
                                    <span className="font-semibold text-slate-700">{participation.competition.prize_info}</span>
                                )}
                            </div>
                        </div>

                        {/* BENTO CARD 8: Undangan Terkirim & Alokasi Dosen (lg:col-span-12, shown if either exists) */}
                        {(hasInvitations || hasAllocations) && (
                            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                                {hasInvitations && (
                                    <div className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-3 ${!hasAllocations ? 'md:col-span-2' : ''}`}>
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <Send className="size-3.5 text-blue-600 shrink-0" />
                                            <span>Undangan Terkirim ({participation.team.invitations.length})</span>
                                        </h4>
                                        <div className="space-y-2">
                                            {participation.team.invitations.map((inv: any) => (
                                                <div
                                                    key={inv.id}
                                                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
                                                >
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-slate-900 block truncate">{inv.invitee?.name || 'Mahasiswa'}</span>
                                                        <span className="text-[11px] text-slate-400">({inv.role_name || 'Anggota'})</span>
                                                        {inv.message && <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">"{inv.message}"</p>}
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                                        inv.status === 'accepted' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                    }`}>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hasAllocations && (
                                    <div className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-3 ${!hasInvitations ? 'md:col-span-2' : ''}`}>
                                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <GraduationCap className="size-3.5 text-blue-600 shrink-0" />
                                            <span>Alokasi Mahasiswa Dosen ({teamAllocations.length})</span>
                                        </h4>
                                        <div className="space-y-2">
                                            {teamAllocations.map((alloc: any) => (
                                                <div
                                                    key={alloc.id}
                                                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between gap-3 text-xs"
                                                >
                                                    <div className="min-w-0">
                                                        <span className="font-bold text-slate-900 block truncate">{alloc.student?.name}</span>
                                                        <span className="text-[11px] text-slate-600">• Peran: {alloc.suggested_role || 'Anggota'}</span>
                                                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">Oleh: {alloc.lecturer?.name || 'Dosen'}</p>
                                                    </div>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                                        {alloc.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* 6) TAB CONTENT: APPLICANTS & MINSATU RECRUITMENT */}
                {activeTab === 'applicants' && (
                    <div className="space-y-6">
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
                                    {recruitmentRoles.map((r: any) => (
                                        <div
                                            key={r.id}
                                            className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between gap-2.5"
                                        >
                                            <div className="flex-1 flex flex-col">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-xs font-bold text-slate-900 block truncate">{r.name}</span>
                                                        <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 mt-1 shrink-0">
                                                            {r.slots} Slot
                                                        </span>
                                                    </div>
                                                    {isLeader && !participation.is_formation_locked && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteRecruitmentRole(r.id)}
                                                            className="text-slate-400 hover:text-slate-900 p-1 rounded transition shrink-0 cursor-pointer"
                                                            title="Hapus lowongan"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                                {r.requirements && (
                                                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 flex-1">
                                                        {r.requirements}
                                                    </p>
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
                                        Lamaran mahasiswa akan muncul di sini lengkap dengan resume keahlian dan tombol WhatsApp langsung.
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
                                                className={`p-3.5 rounded-xl border transition space-y-2.5 ${
                                                    app.status === 'accepted'
                                                        ? 'bg-emerald-50/20 border-emerald-200'
                                                        : app.status === 'rejected'
                                                        ? 'bg-slate-50 border-slate-200 opacity-60'
                                                        : 'bg-white border-slate-200 hover:border-blue-300'
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                    <div className="flex items-start gap-3 min-w-0">
                                                        <div className="size-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                            {applicant?.name ? applicant.name.charAt(0) : 'U'}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-xs font-bold text-slate-900 truncate">
                                                                    {applicant?.name || 'Mahasiswa'}
                                                                </span>
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                                                    Posisi: {app.role_name}
                                                                </span>
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                                                    app.status === 'accepted'
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : app.status === 'rejected'
                                                                        ? 'bg-rose-100 text-rose-800'
                                                                        : 'bg-amber-100 text-amber-800'
                                                                }`}>
                                                                    {app.status === 'accepted' ? 'Diterima' : app.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                                                {applicant?.study_program || 'Mahasiswa'} {applicant?.semester ? `• Semester ${applicant.semester}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {app.created_at && (
                                                        <span className="text-[10px] text-slate-400 shrink-0">
                                                            Melamar: {new Date(app.created_at).toLocaleDateString('id-ID')}
                                                        </span>
                                                    )}
                                                </div>

                                                {app.message && (
                                                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                                                        <p className="italic">"{app.message}"</p>
                                                    </div>
                                                )}

                                                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                                                    {waUrl ? (
                                                        <a
                                                            href={waUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition shrink-0"
                                                        >
                                                            <Phone className="size-3" />
                                                            <span>Chat WhatsApp ({phone})</span>
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-400 italic">No WhatsApp tidak tersedia</span>
                                                    )}

                                                    {isLeader && app.status === 'pending' && !participation.is_formation_locked && (
                                                        <div className="flex items-center gap-1.5 shrink-0">
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
                                                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                                                            >
                                                                Terima Masuk Tim
                                                            </button>
                                                        </div>
                                                    )}
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
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
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

                {/* 5) TAB CONTENT: DOCUMENTS & DELIVERABLES */}
                {activeTab === 'documents' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <FileText className="size-4 text-blue-600 shrink-0" />
                                        <span>Berkas & Karya</span>
                                    </h3>
                                </div>

                                {canManageTasks && (
                                    <button
                                        type="button"
                                        onClick={() => setDocModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
                                    >
                                        <Upload className="size-3.5" />
                                        <span>Unggah Berkas Baru</span>
                                    </button>
                                )}
                            </div>

                            {/* Object Storage Quota Widget */}
                            {storageQuota && (
                                <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
                                            <HardDrive className="size-4" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-slate-900">
                                                    Kapasitas Object Storage Tim
                                                </h4>
                                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                                                    Batas 70 MB / Tim
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                Terpakai <strong className="text-slate-800">{storageQuota.used_mb} MB</strong> dari batas <strong className="text-slate-800">{storageQuota.max_mb} MB</strong> ({storageQuota.percent_used}% terpakai, sisa {storageQuota.remaining_mb} MB)
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-48 flex items-center gap-2.5">
                                        <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden border border-slate-200/60">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${
                                                    storageQuota.percent_used > 85 ? 'bg-rose-500' : 'bg-blue-600'
                                                }`}
                                                style={{ width: `${Math.min(100, storageQuota.percent_used)}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-mono font-bold text-slate-700 shrink-0">
                                            {storageQuota.percent_used}%
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Standard Templates Checklist */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {deliverableTemplates.map((tpl) => {
                                    const matchedDoc = participation.documents?.find((d: any) => d.required_document_key === tpl.key);

                                    return (
                                        <div
                                            key={tpl.key}
                                            className={`rounded-xl border flex flex-col gap-2.5 p-3.5 ${
                                                matchedDoc ? 'bg-emerald-50/30 border-emerald-200' : 'bg-slate-50 border-slate-200/80'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-xs font-bold text-slate-900 leading-snug">{tpl.label}</span>
                                                {matchedDoc ? (
                                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                                ) : (
                                                    <span className="text-[9px] font-semibold text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded shrink-0">
                                                        Kosong
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed flex-1">
                                                {tpl.desc}
                                            </p>

                                            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                                {matchedDoc ? (
                                                    <>
                                                        <span className="text-[10px] text-slate-500 font-mono">v{matchedDoc.version}</span>
                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={matchedDoc.file_path || matchedDoc.file_url || matchedDoc.url || (matchedDoc.path ? (matchedDoc.path.startsWith('http') ? matchedDoc.path : '/storage/' + matchedDoc.path) : '#')}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="font-bold text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
                                                            >
                                                                <span>Buka</span>
                                                                <ExternalLink className="size-3 shrink-0" />
                                                            </a>
                                                            {isMember && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openReplaceModal(matchedDoc)}
                                                                    className="font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1 text-[11px] cursor-pointer"
                                                                    title="Ganti atau perbarui berkas"
                                                                >
                                                                    <RefreshCw className="size-2.5 shrink-0" />
                                                                    <span>Ganti</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    isMember ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                docForm.setData('required_document_key', tpl.key);
                                                                docForm.setData('name', tpl.label);
                                                                setDocModalOpen(true);
                                                            }}
                                                            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 text-left cursor-pointer"
                                                        >
                                                            + Unggah sekarang
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-slate-400 italic">Belum diunggah</span>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Submitted Documents Detailed Table */}
                            {participation.documents && participation.documents.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Daftar Berkas Terunggah ({participation.documents.length})
                                    </h4>

                                    <div className="divide-y divide-slate-100">
                                        {participation.documents.map((doc: any) => (
                                            <div key={doc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <FileText className="size-3.5 text-blue-600 shrink-0" />
                                                        <span className="font-bold text-slate-900">{doc.name}</span>
                                                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">v{doc.version}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                            doc.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : doc.status === 'revision_required' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                                                        }`}>
                                                            {doc.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        Diunggah oleh: {doc.uploader?.name || 'Anggota Tim'} • {new Date(doc.created_at).toLocaleDateString('id-ID')}
                                                    </p>
                                                    {doc.feedback && (
                                                        <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg mt-1 border border-amber-200">
                                                            <strong>Masukan Dosen:</strong> {doc.feedback}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                                    {(doc.file_path || doc.file_url || doc.url || doc.path) && (
                                                        <a
                                                            href={doc.file_path || doc.file_url || doc.url || (doc.path ? (doc.path.startsWith('http') ? doc.path : '/storage/' + doc.path) : '#')}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1.5 transition"
                                                        >
                                                            <Download className="size-3 shrink-0" />
                                                            <span>Unduh / Tinjau</span>
                                                        </a>
                                                    )}

                                                    {isMember && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openReplaceModal(doc)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1 cursor-pointer transition"
                                                            title="Ganti atau perbarui berkas ini"
                                                        >
                                                            <RefreshCw className="size-3 shrink-0" />
                                                            <span>Ganti</span>
                                                        </button>
                                                    )}

                                                    {(isMember || isAdmin) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteDoc(doc)}
                                                            className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 font-bold flex items-center gap-1 cursor-pointer transition"
                                                            title="Hapus berkas ini secara permanen"
                                                        >
                                                            <Trash2 className="size-3 shrink-0" />
                                                            <span>Hapus</span>
                                                        </button>
                                                    )}

                                                    {(isMentor || isAdmin) && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setReviewDocId(doc.id);
                                                                setReviewModalOpen(true);
                                                            }}
                                                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition"
                                                        >
                                                            Ulas Berkas
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 10. TAB CONTENT: ROUNDS & TIMELINE */}
                {activeTab === 'rounds' && (
                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="size-4 text-blue-600 shrink-0" />
                                <span>Jadwal & Babak ({rounds.length})</span>
                            </h3>
                        </div>

                        {rounds.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-xs font-semibold text-slate-600">Penyelenggara belum menetapkan rincian babak bertingkat</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">Pantau jadwal keseluruhan pada detail kompetisi.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rounds.map((rnd: any, i: number) => (
                                    <div key={rnd.id || i} className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="size-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                                    {rnd.round_number || i + 1}
                                                </span>
                                                <span className="font-bold text-slate-900 text-sm">{rnd.name}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                                    rnd.status === 'active' ? 'bg-blue-50 text-blue-700' : rnd.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {rnd.status}
                                                </span>
                                            </div>
                                            {rnd.description && <p className="text-[11px] text-slate-500 mt-1">{rnd.description}</p>}
                                        </div>

                                        <div className="text-right sm:text-right text-slate-500 shrink-0">
                                            {rnd.deadline && (
                                                <span className="font-semibold text-slate-800 block">
                                                    Deadline: {new Date(rnd.deadline).toLocaleDateString('id-ID')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 11. TAB CONTENT: MENTORING */}
                {activeTab === 'mentoring' && (
                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <GraduationCap className="size-4 text-blue-600 shrink-0" />
                                    <span>Bimbingan Dosen</span>
                                </h3>
                            </div>

                            {(isLeader || isAdmin) && (
                                <button
                                    type="button"
                                    onClick={() => setMentorModalOpen(true)}
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
                                >
                                    {participation.mentor ? 'Ganti Dosen Pembimbing' : 'Tugaskan Dosen Pembimbing'}
                                </button>
                            )}
                        </div>

                        {participation.mentor ? (
                            <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-200 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="size-11 rounded-xl bg-purple-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
                                        {participation.mentor.name?.charAt(0) || 'D'}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-purple-950">{participation.mentor.name}</h4>
                                        <p className="text-xs text-purple-700">{participation.mentor.email}</p>
                                    </div>
                                </div>

                                {participation.mentor_notes && (
                                    <div className="p-3 bg-white rounded-lg border border-purple-100 text-xs text-slate-700">
                                        <span className="font-bold text-slate-900 block mb-0.5">Arahan Bimbingan:</span>
                                        <p className="leading-relaxed">{participation.mentor_notes}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <GraduationCap className="size-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-700">Belum Ada Dosen Pembimbing yang Ditugaskan</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Ketua tim atau koordinator prodi dapat menugaskan dosen pembimbing untuk tim ini.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 12. TAB CONTENT: RESULTS & ACHIEVEMENTS */}
                {activeTab === 'results' && (
                    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Trophy className="size-4 text-amber-500 shrink-0" />
                                    <span>Hasil & Capaian</span>
                                </h3>
                            </div>

                            {(isLeader || isMentor || isAdmin) && (
                                <button
                                    type="button"
                                    onClick={() => setResultModalOpen(true)}
                                    className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition cursor-pointer shrink-0"
                                >
                                    {participation.result ? 'Perbarui Hasil' : 'Catat Hasil Kompetisi'}
                                </button>
                            )}
                        </div>

                        {participation.result ? (
                            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="size-5 text-amber-600 shrink-0" />
                                            <h4 className="text-base font-extrabold text-slate-900">
                                                {participation.result.achievement_title || 'Prestasi Kompetisi'}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-amber-900 mt-1">
                                            Hasil Akhir: <strong>{participation.result.outcome?.replace('_', ' ')?.toUpperCase()}</strong>
                                            {participation.result.rank ? ` • Peringkat ${participation.result.rank}` : ''}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                                            participation.result.verification_status === 'verified'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-amber-100 text-amber-800'
                                        }`}>
                                            {participation.result.verification_status === 'verified' ? 'Terverifikasi Kampus' : 'Laporan Mandiri'}
                                        </span>

                                        {(isMentor || isAdmin) && participation.result.verification_status !== 'verified' && (
                                            <button
                                                type="button"
                                                onClick={handleVerifyResult}
                                                className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                                            >
                                                Verifikasi Resmi
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {participation.result.notes && (
                                    <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-amber-200/80">
                                        {participation.result.notes}
                                    </p>
                                )}

                                <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                                    <span className="text-slate-500">
                                        Tercatat pada {new Date(participation.result.created_at).toLocaleDateString('id-ID')}
                                    </span>
                                    {participation.result.certificate_path && (
                                        <a
                                            href={participation.result.certificate_path}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="font-bold text-amber-900 hover:underline flex items-center gap-1"
                                        >
                                            <Download className="size-3.5 shrink-0" />
                                            <span>Lihat Sertifikat</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <Trophy className="size-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-700">Belum Ada Hasil Kompetisi yang Dicatat</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Setelah pengumuman lomba selesai, ketua tim dapat mencatat capaian dan mengunggah sertifikat ke portofolio.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 13. TAB CONTENT: AUDIT HISTORY */}
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

            {/* MODAL 2: SEND INVITATION */}
            {inviteModalOpen && selectedCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Undang Calon Anggota</h3>
                            <button type="button" onClick={() => setInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleInviteCandidate} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Nama Mahasiswa</label>
                                <input
                                    type="text"
                                    disabled
                                    value={selectedCandidate.user.name}
                                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-700 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Peran yang Ditawarkan</label>
                                <input
                                    type="text"
                                    required
                                    value={candidateRoleName}
                                    onChange={(e) => setCandidateRoleName(e.target.value)}
                                    placeholder="Contoh: UI/UX Designer, Frontend Developer"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Pesan Undangan</label>
                                <textarea
                                    rows={3}
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    placeholder="Halo, kami mengundang Anda bergabung dengan tim untuk kompetisi ini..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setInviteModalOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                >
                                    Kirim Undangan
                                </button>
                            </div>
                        </form>
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

            {/* MODAL 6: ASSIGN MENTOR */}
            {mentorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Tugaskan Dosen Pembimbing</h3>
                            <button type="button" onClick={() => setMentorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignMentor} className="mt-4 space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Pilih Dosen Kampus</label>
                                <select
                                    value={mentorForm.data.lecturer_id}
                                    onChange={(e) => mentorForm.setData('lecturer_id', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                >
                                    {availableLecturers.map((lec) => (
                                        <option key={lec.id} value={lec.id}>{lec.name} ({lec.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Catatan Arahan Bimbingan</label>
                                <textarea
                                    rows={3}
                                    value={mentorForm.data.notes}
                                    onChange={(e) => mentorForm.setData('notes', e.target.value)}
                                    placeholder="Fokus arahan pembimbing untuk kompetisi ini..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMentorModalOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                >
                                    Tugaskan Dosen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 7: RECORD RESULT */}
            {resultModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                    <div className="w-full max-w-lg p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900">Catat Capaian & Prestasi</h3>
                            <button type="button" onClick={() => setResultModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordResult} className="mt-4 space-y-3.5">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1">Hasil Akhir</label>
                                    <select
                                        value={resultForm.data.outcome}
                                        onChange={(e) => resultForm.setData('outcome', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                                    >
                                        <option value="1st_place">Juara 1 (Medali Emas)</option>
                                        <option value="2nd_place">Juara 2 (Medali Perak)</option>
                                        <option value="3rd_place">Juara 3 (Medali Perunggu)</option>
                                        <option value="finalist">Finalis Resmi</option>
                                        <option value="special_award">Penghargaan Khusus / Harapan</option>
                                        <option value="participant">Peserta Resmi</option>
                                        <option value="not_selected">Partisipan (Belum Lolos Juara)</option>
                                        <option value="withdrawn">Mengundurkan Diri</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1">Peringkat (Jika Ada)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={resultForm.data.rank}
                                        onChange={(e) => resultForm.setData('rank', parseInt(e.target.value, 10) || 1)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Judul Prestasi untuk Portofolio <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={resultForm.data.achievement_title}
                                    onChange={(e) => resultForm.setData('achievement_title', e.target.value)}
                                    placeholder="Contoh: Juara 1 Gemastik Bidang Software Development"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Berkas Sertifikat (PDF / Gambar)</label>
                                <input
                                    type="file"
                                    accept="application/pdf,image/*"
                                    onChange={(e) => resultForm.setData('certificate', e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-800 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Tautan Bukti Pengumuman Resmi (Opsional)</label>
                                <input
                                    type="url"
                                    value={resultForm.data.evidence_url}
                                    onChange={(e) => resultForm.setData('evidence_url', e.target.value)}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-800 mb-1">Catatan Tambahan</label>
                                <textarea
                                    rows={2}
                                    value={resultForm.data.notes}
                                    onChange={(e) => resultForm.setData('notes', e.target.value)}
                                    placeholder="Keterangan tambahan..."
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                                />
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setResultModalOpen(false)}
                                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={resultForm.processing}
                                    className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold disabled:opacity-50"
                                >
                                    Simpan Hasil Prestasi
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
                                <div className="size-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
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
                            <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 text-xs text-purple-950 space-y-1">
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
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-60 cursor-pointer"
                                >
                                    <Sparkles className="size-3.5" />
                                    <span>{aiGenerating ? 'AI Sedang Menganalisis & Menyusun...' : 'Mulai Susun Roadmap AI'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
