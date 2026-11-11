import { formatWhatsAppUrl } from '@/components/competitions/ApplyCompetitionTeamModal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Briefcase,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    FileText,
    FolderKanban,
    Globe,
    GraduationCap,
    History,
    Lock,
    MessageSquare,
    Phone,
    Plus,
    Send,
    Share2,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Trash2,
    Trophy,
    Upload,
    UserCheck,
    UserMinus,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
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
}: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'applicants' | 'kanban' | 'rounds' | 'documents' | 'mentoring' | 'results' | 'history'>('overview');

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
    const [selectedDocKey, setSelectedDocKey] = useState('proposal');
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [reviewDocId, setReviewDocId] = useState<number | null>(null);
    const [mentorModalOpen, setMentorModalOpen] = useState(false);
    const [resultModalOpen, setResultModalOpen] = useState(false);

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
        { title: participation.competition?.name, href: `/competitions/${participation.competition?.id}` },
        { title: `Workspace: ${participation.team?.name}`, href: `/competition-workspace/${participation.id}` },
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
            `/competition-workspace/${participation.id}/roles`,
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
            router.delete(`/competition-workspace/${participation.id}/roles/${roleId}`);
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

    // Stage order helper
    const currentStageOrder = selectionStages[participation.stage]?.order || 1;

    // Standard Deliverables List
    const deliverableTemplates = [
        { key: 'proposal', label: 'Proposal / Makalah Proyek', desc: 'Dokumen latar belakang, analisis inovasi, dan perancangan' },
        { key: 'pitch_deck', label: 'Pitch Deck / Presentasi', desc: 'Slide ringkas presentasi karya untuk juri' },
        { key: 'video_demo', label: 'Video Demo / Teaser', desc: 'Tautan video demonstrasi produk atau prototype berjalan' },
        { key: 'repo_url', label: 'Repositori Kode / Git', desc: 'Tautan GitHub/GitLab kode sumber proyek' },
        { key: 'poster', label: 'Poster Publikasi / Infografis', desc: 'Desain visual ringkasan karya kompetisi' },
        { key: 'registration_proof', label: 'Bukti Pendaftaran Resmi', desc: 'Kartu peserta atau screenshot konfirmasi portal penyelenggara' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs} activeTab="tim">
            <Head title={`Workspace: ${participation.team?.name} — ${participation.competition?.name}`} />

            <div className="space-y-6 pt-2">
                {/* Top Breadcrumb & Quick Actions Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <Link
                            href={route('competitions.show', participation.competition?.id)}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-600 hover:text-blue-600 shadow-2xs transition"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Detail Kompetisi</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            {(isMentor || isAdmin) && participation.formation_status !== 'approved' && (
                                <button
                                    onClick={handleApproveFormation}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                    <ShieldCheck className="size-3.5" />
                                    <span>Setujui Susunan Tim Resmi</span>
                                </button>
                            )}

                            {(isLeader || isMentor || isAdmin) && (
                                <button
                                    onClick={() => setStageModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                >
                                    <Sparkles className="size-3.5" />
                                    <span>Pembaruan Tahap Seleksi</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Workspace Header Hero Card */}
                    <div className="glass-surface rounded-3xl p-6 sm:p-8 bg-white/85 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80">
                                    {participation.competition?.category?.replace('_', ' ') || 'Kompetisi'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                                    {participation.competition?.level || 'Nasional'}
                                </span>
                                {participation.category_track && (
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                                        Jalur: {participation.category_track}
                                    </span>
                                )}
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                    Tahap: {selectionStages[participation.stage]?.label || participation.stage}
                                </span>
                                {participation.formation_status === 'approved' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                        <CheckCircle2 className="size-3 text-emerald-600" />
                                        <span>Formasi Disetujui Dosen</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                        <Clock className="size-3 text-amber-600" />
                                        <span>Susunan Tim Dalam Pembentukan</span>
                                    </span>
                                )}
                                {participation.is_formation_locked && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                        <Lock className="size-3" />
                                        <span>Tim Dikunci</span>
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                                {participation.team?.name}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-600 mt-1">
                                Kompetisi: <strong className="text-slate-900">{participation.competition?.name}</strong> • Penyelenggara: {participation.competition?.organizer}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                {participation.team?.description || 'Workspace kolaborasi persiapan karya, mentoring dosen, dan submission hasil.'}
                            </p>
                        </div>

                        {/* Readiness Score Progress Card */}
                        <div className="glass-card rounded-2xl p-5 bg-white/95 border border-blue-200/80 min-w-[280px] shrink-0">
                            <div className="flex items-center justify-between text-xs font-bold mb-2">
                                <span className="text-slate-700 flex items-center gap-1.5">
                                    <Trophy className="size-4 text-amber-500" />
                                    <span>Kesiapan Kompetisi</span>
                                </span>
                                <span className="text-blue-600 font-mono text-sm">{readinessScore}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                                    style={{ width: `${readinessScore}%` }}
                                />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                                <span>Tugas Kanban & Berkas</span>
                                <span>{readinessScore >= 80 ? 'Siap Maju' : readinessScore >= 40 ? 'Dalam Proses' : 'Awal Persiapan'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Selection Stages Pipeline */}
                    <div className="glass-card rounded-2xl p-5 bg-white/85">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <History className="size-4 text-blue-600" />
                                <span>Alur Tahapan Seleksi Kompetisi</span>
                            </span>
                            <span className="text-xs font-semibold text-slate-600">
                                Posisi Saat Ini: <strong className="text-blue-700">{selectionStages[participation.stage]?.label || participation.stage}</strong>
                            </span>
                        </div>

                        {/* Pipeline Stage Steps */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
                            {Object.entries(selectionStages)
                                .filter(([key]) => key !== 'not_selected' && key !== 'withdrawn')
                                .map(([stageKey, stageInfo], index) => {
                                    const isCurrent = participation.stage === stageKey;
                                    const isPassed = stageInfo.order < currentStageOrder;

                                    return (
                                        <div
                                            key={stageKey}
                                            className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition ${
                                                isCurrent
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : isPassed
                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                    : 'bg-slate-100 text-slate-400'
                                            }`}
                                        >
                                            <span className="size-5 rounded-full flex items-center justify-center text-[10px] font-black bg-white/20">
                                                {isPassed ? <Check className="w-3 h-3 stroke-[2.5]" /> : index + 1}
                                            </span>
                                            <span>{stageInfo.label}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    {/* Segmented Workspace Navigation Tabs */}
                    <div className="glass-surface p-1.5 rounded-2xl bg-white/85 flex flex-wrap items-center gap-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'overview'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <Users className="size-4" />
                            <span>Anggota Tim & Formasi ({participation.team?.members?.length || 0})</span>
                        </button>

                        {/* MinSatu Applicants Tab */}
                        <button
                            onClick={() => setActiveTab('applicants')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'applicants'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <UserPlus className="size-4" />
                            <span>Pelamar Tim</span>
                            {incomingApplications.filter((a: any) => a.status === 'pending').length > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                                    {incomingApplications.filter((a: any) => a.status === 'pending').length} Baru
                                </span>
                            ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                                    {incomingApplications.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab('kanban')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'kanban'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <FolderKanban className="size-4" />
                            <span>Tugas ({participation.team?.tasks?.length || 0})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('rounds')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'rounds'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <Clock className="size-4" />
                            <span>Tahapan & Babak ({rounds.length})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'documents'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <FileText className="size-4" />
                            <span>Berkas & Karya ({participation.documents?.length || 0})</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('mentoring')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'mentoring'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <GraduationCap className="size-4" />
                            <span>Bimbingan Dosen</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('results')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'results'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <Award className="size-4" />
                            <span>Hasil & Prestasi Portfolio</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'history'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                        >
                            <History className="size-4" />
                            <span>Riwayat Seleksi ({participation.status_histories?.length || 0})</span>
                        </button>
                    </div>

                    {/* TAB CONTENT 1: OVERVIEW, MEMBERS & MATCHMAKING */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left 2 Cols: Team Members, Sent Invitations, & Lecturer Allocations */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Current Members Card */}
                                <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Users className="size-4 text-blue-600" />
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Daftar Anggota Tim ({participation.team?.members?.length || 0} / {participation.team?.capacity || participation.competition?.max_team_size || 5})
                                            </h3>
                                        </div>

                                        {isLeader && !participation.is_formation_locked && (
                                            <button
                                                onClick={handleLockFormation}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
                                            >
                                                <Lock className="size-3.5" />
                                                <span>Kunci Susunan Tim</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="divide-y divide-slate-100">
                                        {participation.team?.members?.map((member: any) => (
                                            <div key={member.id} className="py-3.5 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                        {member.user?.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-900">{member.user?.name}</span>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                                {member.role_name || (member.permission === 'leader' ? 'Ketua Tim' : 'Anggota')}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            NIM: {member.user?.student_profile?.nim || 'Aktif'} • Bergabung: {new Date(member.joined_at || member.created_at).toLocaleDateString('id-ID')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap justify-end">
                                                    {member.user?.skills?.slice(0, 2).map((sk: any) => (
                                                        <span key={sk.id} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                                            {sk.name}
                                                        </span>
                                                    ))}

                                                    {/* Withdraw Button */}
                                                    {(isLeader || member.user_id === participation.team?.members?.find((m: any) => m.user_id === member.user_id)?.user_id) && member.permission !== 'leader' && (
                                                        <button
                                                            onClick={() => handleWithdrawMember(member.user_id, member.user?.name)}
                                                            title="Lepas keanggotaan"
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                        >
                                                            <UserMinus className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Sent Team Invitations (Student-Led) */}
                                {participation.team?.invitations && participation.team.invitations.length > 0 && (
                                    <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Send className="size-4 text-blue-600" />
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Undangan Tim Terkirim ({participation.team.invitations.length})
                                                </h3>
                                            </div>
                                            <span className="text-[11px] text-slate-500 font-medium">Student-Led Formation</span>
                                        </div>

                                        <div className="space-y-2.5">
                                            {participation.team.invitations.map((inv: any) => (
                                                <div
                                                    key={inv.id}
                                                    className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                                                >
                                                    <div>
                                                        <div className="font-bold text-slate-900">
                                                            {inv.invitee?.name || 'Mahasiswa'}
                                                            <span className="text-slate-400 font-normal ml-1">({inv.invitee?.email})</span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                                            Peran: <strong>{inv.role_name || 'Anggota'}</strong>
                                                            {inv.message ? ` • Pesan: "${inv.message}"` : ''}
                                                        </p>
                                                    </div>

                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                                        inv.status === 'accepted'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : inv.status === 'declined'
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Lecturer Allocations for this Team (Lecturer-Led) */}
                                {teamAllocations.length > 0 && (
                                    <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="size-4 text-purple-600" />
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Alokasi Mahasiswa oleh Dosen ({teamAllocations.length})
                                                </h3>
                                            </div>
                                            <span className="text-[11px] text-purple-700 font-medium">Lecturer-Led Allocation</span>
                                        </div>

                                        <div className="space-y-2.5">
                                            {teamAllocations.map((alloc: any) => (
                                                <div
                                                    key={alloc.id}
                                                    className="p-3.5 bg-purple-50/50 rounded-2xl border border-purple-200/70 flex items-center justify-between gap-3 text-xs"
                                                >
                                                    <div>
                                                        <div className="font-bold text-purple-950">
                                                            {alloc.student?.name}
                                                            <span className="text-purple-600 font-normal ml-1">({alloc.student?.email})</span>
                                                        </div>
                                                        <p className="text-[11px] text-purple-800 mt-0.5">
                                                            Peran: <strong>{alloc.suggested_role || 'Anggota'}</strong> • Dialokasikan oleh:{' '}
                                                            <strong>{alloc.lecturer?.name || 'Dosen'}</strong>
                                                            {alloc.notes ? ` • "${alloc.notes}"` : ''}
                                                        </p>
                                                    </div>

                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                                                        alloc.status === 'confirmed' || alloc.status === 'accepted'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : alloc.status === 'declined'
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                    }`}>
                                                        {alloc.status}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Col: Smart Fair Matchmaking Candidates */}
                            <div className="space-y-6">
                                <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="size-4 text-amber-500" />
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Rekomendasi Calon Anggota (Matchmaking)
                                            </h3>
                                        </div>
                                    </div>

                                    {recommendedCandidates.length === 0 ? (
                                        <p className="text-xs text-slate-500 text-center py-6">
                                            Tidak ada calon rekomendasi tambahan saat ini.
                                        </p>
                                    ) : (
                                        <div className="space-y-3">
                                            {recommendedCandidates.slice(0, 5).map((cand: any) => (
                                                <div
                                                    key={cand.user.id}
                                                    className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-200 shadow-2xs space-y-2 transition"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-900">{cand.user.name}</div>
                                                            <p className="text-[10px] text-slate-400">{cand.explanation}</p>
                                                        </div>
                                                        <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            {cand.final_score}%
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                                        <div className="flex items-center gap-1 flex-wrap">
                                                            {cand.matched_skills?.slice(0, 2).map((sk: string, i: number) => (
                                                                <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                                                                    {sk}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {isLeader && !participation.is_formation_locked && cand.eligible && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedCandidate(cand);
                                                                    setInviteModalOpen(true);
                                                                }}
                                                                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition cursor-pointer"
                                                            >
                                                                Kirim Undangan
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT: APPLICANTS & RECRUITMENT (MinSatu Flow) */}
                    {activeTab === 'applicants' && (
                        <div className="space-y-6 animate-in fade-in">
                            {/* Lowongan Peran Tim Header & Management */}
                            <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="size-4 text-purple-600" />
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Posisi yang Dibutuhkan ({recruitmentRoles.length})
                                            </h3>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Tentukan peran dan keahlian yang dicari tim.
                                        </p>
                                    </div>

                                    {isLeader && !participation.is_formation_locked && (
                                        <button
                                            onClick={() => setAddingRole(!addingRole)}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto"
                                        >
                                            <Plus className="size-3.5" />
                                            <span>Tambah Posisi</span>
                                        </button>
                                    )}
                                </div>

                                {/* Add Role Form Drawer */}
                                {addingRole && (
                                    <form
                                        onSubmit={handleAddRecruitmentRole}
                                        className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="sm:col-span-2">
                                                <label className="text-xs font-bold text-purple-900 block mb-1">
                                                    Nama Peran / Posisi <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Contoh: UI/UX Designer, Frontend Developer, Pitcher"
                                                    value={newRoleName}
                                                    onChange={(e) => setNewRoleName(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-purple-900 block mb-1">
                                                    Jumlah Slot <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={10}
                                                    required
                                                    value={newRoleSlots}
                                                    onChange={(e) => setNewRoleSlots(parseInt(e.target.value, 10) || 1)}
                                                    className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-purple-900 block mb-1">
                                                Kualifikasi / Persyaratan Singkat (Opsional)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Contoh: Menguasai Figma, familiar dengan React / Flutter, atau mampu membuat proposal PKM"
                                                value={newRoleReqs}
                                                onChange={(e) => setNewRoleReqs(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl bg-white border border-purple-200 text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setAddingRole(false)}
                                                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                            >
                                                Simpan Lowongan
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Roles List */}
                                {recruitmentRoles.length === 0 ? (
                                    <div className="text-center py-6 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                                        <Briefcase className="size-6 text-slate-400 mx-auto mb-1.5" />
                                        <p className="text-xs font-semibold text-slate-700">Belum ada daftar lowongan peran spesifik</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            Tambahkan posisi seperti Designer, Developer, atau Hustler agar calon rekan dapat melamar posisi tersebut secara tepat.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {recruitmentRoles.map((r: any) => (
                                            <div
                                                key={r.id}
                                                className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-start justify-between gap-2"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-900">{r.name}</span>
                                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                                                            {r.slots} Slot
                                                        </span>
                                                    </div>
                                                    {r.requirements && (
                                                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                                                            {r.requirements}
                                                        </p>
                                                    )}
                                                </div>

                                                {isLeader && !participation.is_formation_locked && (
                                                    <button
                                                        onClick={() => handleDeleteRecruitmentRole(r.id)}
                                                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                                                        title="Hapus lowongan peran ini"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Daftar Pelamar Masuk (Incoming Applications) */}
                            <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <UserPlus className="size-4 text-blue-600" />
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Pelamar Masuk ({incomingApplications.length})
                                        </h3>
                                    </div>
                                </div>

                                {incomingApplications.length === 0 ? (
                                    <div className="text-center py-12 px-4 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                                        <Users className="size-8 text-slate-400 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-800">Belum Ada Pelamar yang Mengajukan Diri</p>
                                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                                            Tim Anda saat ini berstatus terbuka di katalog pencarian rekan kompetisi. Lamaran mahasiswa yang masuk akan muncul di halaman ini lengkap dengan kontak WhatsApp langsung!
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {incomingApplications.map((app: any) => {
                                            const applicant = app.user;
                                            const phone = app.contact_phone || applicant?.phone;
                                            const greeting = `Halo ${applicant?.name || 'Rekan'}, saya ${participation.team?.leader?.name || 'Ketua'} dari tim ${participation.team?.name} untuk kompetisi ${participation.competition?.name}. Saya melihat lamaran Anda untuk peran ${app.role_name}. Bisakah kita ngobrol lebih lanjut mengenai persiapan tim?`;
                                            const waUrl = phone ? formatWhatsAppUrl(phone, greeting) : null;

                                            return (
                                                <div
                                                    key={app.id}
                                                    className={`p-5 rounded-3xl border transition shadow-2xs space-y-4 ${
                                                        app.status === 'accepted'
                                                            ? 'bg-emerald-50/30 border-emerald-200'
                                                            : app.status === 'rejected'
                                                            ? 'bg-slate-50 border-slate-200 opacity-70'
                                                            : 'bg-white border-slate-200/90 hover:border-blue-300'
                                                    }`}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="size-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                                                                {applicant?.name ? applicant.name.charAt(0) : 'U'}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className="text-sm font-bold text-slate-900">
                                                                        {applicant?.name || 'Mahasiswa'}
                                                                    </span>
                                                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                                        Posisi: {app.role_name}
                                                                    </span>
                                                                    {app.status === 'accepted' ? (
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                                                                            <Check className="w-3 h-3 stroke-[2.5]" />
                                                                            <span>Diterima</span>
                                                                        </span>
                                                                    ) : app.status === 'rejected' ? (
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                                                                            <X className="w-3 h-3 stroke-[2.5]" />
                                                                            <span>Ditolak</span>
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                                                            Menunggu Keputusan
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <p className="text-xs text-slate-500 mt-0.5">
                                                                    {applicant?.study_program || 'Mahasiswa'}
                                                                    {applicant?.semester ? ` • Semester ${applicant.semester}` : ''}
                                                                    {applicant?.email ? ` • ${applicant.email}` : ''}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Applied Date */}
                                                        {app.created_at && (
                                                            <span className="text-[11px] text-slate-400 shrink-0">
                                                                Melamar pada {new Date(app.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Applicant Pitch Message */}
                                                    {app.message && (
                                                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                                                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                                                                <MessageSquare className="size-3 text-blue-600" />
                                                                <span>Pesan:</span>
                                                            </div>
                                                            <p className="font-medium italic">"{app.message}"</p>
                                                        </div>
                                                    )}

                                                    {/* Portfolio and Skills */}
                                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                                        {app.portfolio_url && (
                                                            <a
                                                                href={app.portfolio_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 underline"
                                                            >
                                                                <Globe className="size-3.5" />
                                                                <span>Portofolio</span>
                                                                <ExternalLink className="size-3" />
                                                            </a>
                                                        )}

                                                        {applicant?.skills && applicant.skills.length > 0 && (
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                <span className="text-[11px] text-slate-400 font-medium">Keahlian:</span>
                                                                {applicant.skills.slice(0, 5).map((sk: string, i: number) => (
                                                                    <span
                                                                        key={i}
                                                                        className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700"
                                                                    >
                                                                        {sk}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                                        {waUrl ? (
                                                            <a
                                                                href={waUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                                            >
                                                                <Phone className="size-3.5" />
                                                                <span>WhatsApp ({phone})</span>
                                                                <ExternalLink className="size-3 text-emerald-200" />
                                                            </a>
                                                        ) : (
                                                            <span className="text-[11px] text-slate-400 italic">
                                                                No WhatsApp tidak disertakan
                                                            </span>
                                                        )}

                                                        {/* Leader Actions */}
                                                        {isLeader && app.status === 'pending' && !participation.is_formation_locked && (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleRespondApplication(app.id, 'reject')}
                                                                    className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-700 text-xs font-semibold transition cursor-pointer"
                                                                >
                                                                    Tolak
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRespondApplication(app.id, 'accept')}
                                                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                                                >
                                                                    <CheckCircle2 className="size-3.5" />
                                                                    <span>Terima</span>
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

                    {/* TAB CONTENT 2: KANBAN TASKS (Trello Style) */}
                    {activeTab === 'kanban' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                        Papan Tugas
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                        {participation.team?.tasks?.length || 0} Kartu
                                    </span>
                                </div>
                                {isMember && (
                                    <button
                                        onClick={() => setTaskModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Tambah Tugas</span>
                                    </button>
                                )}
                            </div>

                            {/* 4-Column Trello Kanban Board */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                                {(
                                    [
                                        { key: 'todo', label: 'Belum Dimulai (To Do)', dot: 'bg-slate-400', badge: 'bg-slate-200 text-slate-700' },
                                        { key: 'in_progress', label: 'Sedang Dikerjakan', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
                                        { key: 'in_review', label: 'Ulasan & QA', dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800' },
                                        { key: 'completed', label: 'Selesai (Done)', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800' },
                                    ] as const
                                ).map((col) => {
                                    const colTasks = participation.team?.tasks?.filter((t: any) => t.status === col.key) || [];
                                    const isDragTarget = dragOverCol === col.key;
                                    const isAddingHere = inlineAddingCol === col.key;

                                    return (
                                        <div
                                            key={col.key}
                                            onDragOver={(e) => handleDragOver(e, col.key)}
                                            onDragLeave={(e) => handleDragLeave(e, col.key)}
                                            onDrop={(e) => handleDrop(e, col.key)}
                                            className={`rounded-2xl p-3 flex flex-col gap-2.5 min-h-[420px] transition-all duration-150 ${
                                                isDragTarget
                                                    ? 'bg-blue-50/90 border-2 border-dashed border-blue-400 ring-2 ring-blue-500/20'
                                                    : 'bg-[#F1F2F4] border border-slate-200/80 shadow-2xs'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between px-1.5 py-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`size-2 rounded-full ${col.dot}`} />
                                                    <span className="text-xs font-bold text-slate-800">
                                                        {col.label}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                                                    {colTasks.length}
                                                </span>
                                            </div>

                                            <div className="flex flex-col gap-2.5 flex-1">
                                                {colTasks.length === 0 && !isAddingHere && (
                                                    <div className="h-24 flex flex-col items-center justify-center p-3 text-center border border-dashed border-slate-300 rounded-xl text-slate-400">
                                                        <span className="text-[11px] font-medium">Belum ada kartu</span>
                                                        {isMember && (
                                                            <button
                                                                onClick={() => {
                                                                    setInlineAddingCol(col.key);
                                                                    setInlineTitle('');
                                                                }}
                                                                className="mt-1 text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                                                            >
                                                                + Tambah kartu
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {colTasks.map((task: any) => {
                                                    const isBeingDragged = draggedTaskId === task.id;

                                                    return (
                                                        <div
                                                            key={task.id}
                                                            draggable={isMember}
                                                            onDragStart={(e) => handleDragStart(e, task.id, col.key)}
                                                            className={`bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col gap-2 cursor-grab active:cursor-grabbing select-none ${
                                                                isBeingDragged ? 'opacity-40 scale-95 border-blue-400' : ''
                                                            }`}
                                                        >
                                                            {/* Priority Label */}
                                                            <div className="flex items-center justify-between gap-1">
                                                                <span
                                                                    className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                                                                        task.priority === 'urgent'
                                                                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                                            : task.priority === 'high'
                                                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                                                            : task.priority === 'low'
                                                                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                                                    }`}
                                                                >
                                                                    <span>{task.priority}</span>
                                                                </span>

                                                                {isMember && (
                                                                    <select
                                                                        value={task.status}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                                                        className="text-[10px] bg-slate-50 border border-slate-200 rounded-md px-1 py-0.5 font-bold text-slate-600 cursor-pointer hover:bg-slate-100"
                                                                    >
                                                                        <option value="todo">To Do</option>
                                                                        <option value="in_progress">In Progress</option>
                                                                        <option value="in_review">In Review</option>
                                                                        <option value="completed">Done</option>
                                                                    </select>
                                                                )}
                                                            </div>

                                                            <div className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug break-words">
                                                                {task.title}
                                                            </div>

                                                            {task.description && (
                                                                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                                                    {task.description}
                                                                </p>
                                                            )}

                                                            <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 mt-0.5 text-slate-500">
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="size-4 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center">
                                                                        {task.assignee?.name ? task.assignee.name.substring(0, 1).toUpperCase() : '?'}
                                                                    </div>
                                                                    <span className="truncate max-w-[80px]">
                                                                        {task.assignee?.name?.split(' ')[0] || 'Unassigned'}
                                                                    </span>
                                                                </div>
                                                                {task.due_on && (
                                                                    <span className="flex items-center gap-1 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                                        <Clock className="size-2.5 text-slate-400" />
                                                                        <span>{task.due_on}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}

                                                {/* Inline Composer */}
                                                {isAddingHere && (
                                                    <div className="bg-white rounded-xl p-3 border border-blue-400 shadow-sm flex flex-col gap-2">
                                                        <textarea
                                                            autoFocus
                                                            value={inlineTitle}
                                                            onChange={(e) => setInlineTitle(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    handleQuickAddTask(col.key);
                                                                }
                                                                if (e.key === 'Escape') {
                                                                    setInlineAddingCol(null);
                                                                }
                                                            }}
                                                            placeholder="Masukkan judul untuk kartu ini..."
                                                            rows={2}
                                                            className="w-full text-xs text-slate-900 border-0 p-0 focus:outline-none focus:ring-0 resize-none placeholder:text-slate-400"
                                                        />
                                                        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                                                            <button
                                                                onClick={() => handleQuickAddTask(col.key)}
                                                                disabled={!inlineTitle.trim()}
                                                                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                                                            >
                                                                Tambah Kartu
                                                            </button>
                                                            <button
                                                                onClick={() => setInlineAddingCol(null)}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                                                            >
                                                                <X className="size-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Bottom + Tambah Kartu */}
                                            {isMember && !isAddingHere && (
                                                <button
                                                    onClick={() => {
                                                        setInlineAddingCol(col.key);
                                                        setInlineTitle('');
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition w-full text-left cursor-pointer"
                                                >
                                                    <Plus className="size-4 text-slate-500" />
                                                    <span>Tambah kartu</span>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT 3: TIMELINE & ROUNDS */}
                    {activeTab === 'rounds' && (
                        <div className="glass-card rounded-3xl p-6 sm:p-8 bg-white/85 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Clock className="size-4 text-blue-600" />
                                        <span>Tahapan & Babak Kompetisi ({rounds.length})</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Jadwal resmi setiap babak dan batas pengumpulan karya kontingen.
                                    </p>
                                </div>
                            </div>

                            {rounds.length === 0 ? (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Clock className="size-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-600">Belum Ada Babak Khusus yang Didaftarkan</p>
                                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                                        Kompetisi ini berjalan dalam alur pendaftaran dan pengumpulan karya langsung.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {rounds.map((rnd: any) => (
                                        <div
                                            key={rnd.id}
                                            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                                        Babak {rnd.round_number}
                                                    </span>
                                                    <h4 className="text-sm font-bold text-slate-900 mt-1">{rnd.name}</h4>
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                                                    {rnd.status}
                                                </span>
                                            </div>

                                            {rnd.description && (
                                                <p className="text-xs text-slate-600">{rnd.description}</p>
                                            )}

                                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                                <div>
                                                    <span>Mulai: {rnd.starts_at ? new Date(rnd.starts_at).toLocaleDateString('id-ID') : '-'}</span>
                                                    <span className="mx-1.5">•</span>
                                                    <span>Selesai: {rnd.ends_at ? new Date(rnd.ends_at).toLocaleDateString('id-ID') : '-'}</span>
                                                </div>
                                                {rnd.is_final_round && (
                                                    <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                        Babak Final
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT 4: DOCUMENTS & DELIVERABLES */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6">
                            <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-5">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                            <FileText className="size-4 text-blue-600" />
                                            <span>Checklist Berkas Karya Kompetisi</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Unggah setiap dokumen syarat kompetisi. Versi dokumen dan feedback dosen pembimbing tersimpan secara terstruktur.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {deliverableTemplates.map((tpl) => {
                                        const uploadedDocs = participation.documents?.filter((d: any) => d.required_document_key === tpl.key) || [];
                                        const latestDoc = uploadedDocs[uploadedDocs.length - 1];

                                        return (
                                            <div
                                                key={tpl.key}
                                                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-4"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                                        <h4 className="text-xs font-bold text-slate-900">{tpl.label}</h4>
                                                        {latestDoc ? (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                v{latestDoc.version} • {latestDoc.status}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                                                Belum Diunggah
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-relaxed">{tpl.desc}</p>

                                                    {latestDoc && (
                                                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                                                            <div className="font-bold text-slate-800 truncate">{latestDoc.name}</div>
                                                            {latestDoc.round && (
                                                                <div className="text-[10px] text-blue-600 font-semibold">
                                                                    Babak: {latestDoc.round.name}
                                                                </div>
                                                            )}
                                                            {latestDoc.feedback && (
                                                                <div className="text-amber-800 font-medium">
                                                                    Ulasan Pembimbing: "{latestDoc.feedback}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                                                    {latestDoc?.path ? (
                                                        <a
                                                            href={`/storage/${latestDoc.path}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                                                        >
                                                            <Download className="size-3.5" />
                                                            <span>Unduh Berkas</span>
                                                        </a>
                                                    ) : latestDoc?.url || latestDoc?.external_submission_url ? (
                                                        <a
                                                            href={latestDoc.url || latestDoc.external_submission_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                                                        >
                                                            <ExternalLink className="size-3.5" />
                                                            <span>Buka Tautan</span>
                                                        </a>
                                                    ) : (
                                                        <span />
                                                    )}

                                                    <div className="flex items-center gap-2">
                                                        {(isMentor || isAdmin) && latestDoc && (
                                                            <button
                                                                onClick={() => {
                                                                    setReviewDocId(latestDoc.id);
                                                                    setReviewModalOpen(true);
                                                                }}
                                                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold transition cursor-pointer"
                                                            >
                                                                Ulas
                                                            </button>
                                                        )}
                                                        {isMember && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedDocKey(tpl.key);
                                                                    docForm.setData('required_document_key', tpl.key);
                                                                    docForm.setData('name', tpl.label);
                                                                    setDocModalOpen(true);
                                                                }}
                                                                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition cursor-pointer"
                                                            >
                                                                {latestDoc ? 'Revisi / Unggah Baru' : 'Unggah Dokumen'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT 5: MENTORING */}
                    {activeTab === 'mentoring' && (
                        <div className="glass-card rounded-3xl p-6 sm:p-8 bg-white/85 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <GraduationCap className="size-4 text-purple-600" />
                                        <span>Bimbingan & Supervisi Dosen</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Dosen pembimbing membantu peninjauan karya dan validasi kelayakan kompetisi.
                                    </p>
                                </div>

                                {(isLeader || isAdmin) && (
                                    <button
                                        onClick={() => setMentorModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Tugaskan Dosen Pembimbing</span>
                                    </button>
                                )}
                            </div>

                            {participation.mentor ? (
                                <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="size-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                                            {participation.mentor.name?.charAt(0) || 'D'}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-purple-950">{participation.mentor.name}</div>
                                            <p className="text-xs text-purple-700">{participation.mentor.email}</p>
                                        </div>
                                    </div>

                                    {participation.mentor_notes && (
                                        <div className="p-3 rounded-xl bg-white/80 border border-purple-100 text-xs text-purple-900">
                                            <strong>Catatan Bimbingan:</strong> {participation.mentor_notes}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <GraduationCap className="size-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-600">Belum Ada Dosen Pembimbing yang Ditugaskan</p>
                                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                                        Ketua tim atau administrator dapat menugaskan dosen pembimbing kampus untuk mendampingi persiapan lomba.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT 6: RESULTS & ACHIEVEMENTS */}
                    {activeTab === 'results' && (
                        <div className="glass-card rounded-3xl p-6 sm:p-8 bg-white/85 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Award className="size-4 text-amber-500" />
                                        <span>Pencatatan Hasil & Verifikasi Prestasi Portofolio</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Hasil kompetisi yang diverifikasi resmi oleh dosen/admin akan otomatis terbit di portofolio setiap anggota tim.
                                    </p>
                                </div>

                                {(isLeader || isMentor || isAdmin) && !participation.result && (
                                    <button
                                        onClick={() => setResultModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                    >
                                        <Trophy className="size-3.5" />
                                        <span>Catat Hasil Kompetisi</span>
                                    </button>
                                )}
                            </div>

                            {participation.result ? (
                                <div className="p-6 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-600 text-white">
                                                    {participation.result.outcome?.replace('_', ' ')}
                                                </span>
                                                <h4 className="text-base font-bold text-amber-950">
                                                    {participation.result.achievement_title}
                                                </h4>
                                            </div>
                                            {participation.result.notes && (
                                                <p className="text-xs text-amber-900 mt-2">{participation.result.notes}</p>
                                            )}
                                        </div>

                                        <div className="shrink-0 text-right">
                                            {participation.result.verification_status === 'verified' ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                                                    <ShieldCheck className="size-3.5 text-emerald-700" />
                                                    <span>Terverifikasi Portofolio</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                                                    <Clock className="size-3.5 text-amber-700" />
                                                    <span>Menunggu Verifikasi</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-amber-200/80 pt-3 flex items-center justify-between text-xs">
                                        <div>
                                            {participation.result.certificate_path && (
                                                <a
                                                    href={`/storage/${participation.result.certificate_path}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="font-bold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
                                                >
                                                    <Download className="size-3.5" />
                                                    <span>Lihat Sertifikat / Bukti</span>
                                                </a>
                                            )}
                                        </div>

                                        {(isMentor || isAdmin) && participation.result.verification_status !== 'verified' && (
                                            <button
                                                onClick={handleVerifyResult}
                                                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                            >
                                                Verifikasi & Terbitkan ke Portofolio
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                    <Trophy className="size-8 text-slate-400 mx-auto mb-2" />
                                    <p className="text-xs font-bold text-slate-600">Hasil Akhir Kompetisi Belum Dicatat</p>
                                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                                        Setelah seleksi selesai atau pengumuman juara tiba, catat pencapaian tim dan sertakan sertifikat untuk diverifikasi ke portofolio mahasiswa.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB CONTENT 7: AUDIT TRAIL HISTORY */}
                    {activeTab === 'history' && (
                        <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                <History className="size-4 text-blue-600" />
                                <span>Riwayat Perjalanan & Transisi Tahapan Kompetisi</span>
                            </h3>

                            <div className="divide-y divide-slate-100">
                                {participation.status_histories?.map((hist: any) => (
                                    <div key={hist.id} className="py-3 flex items-start justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-900">
                                                    Ke Tahap: <strong className="text-blue-600">{selectionStages[hist.to_stage]?.label || hist.to_stage}</strong>
                                                </span>
                                                {hist.from_stage && (
                                                    <span className="text-[10px] text-slate-400">
                                                        (dari: {selectionStages[hist.from_stage]?.label || hist.from_stage})
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-600 mt-1">{hist.notes || 'Pembaruan tahapan seleksi tim.'}</p>
                                        </div>
                                        <div className="text-right text-[10px] text-slate-400 shrink-0">
                                            <div>Oleh: {hist.changer?.name || 'Sistem'}</div>
                                            <div>{new Date(hist.created_at).toLocaleString('id-ID')}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
            </div>

            {/* MODAL 1: PEMBARUAN TAHAPAN SELEKSI */}
            {stageModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">Pembaruan Tahapan Seleksi</h3>
                            <button onClick={() => setStageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleStageUpdate} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Tahapan Baru</label>
                                <select
                                    value={stageForm.data.stage}
                                    onChange={(e) => stageForm.setData('stage', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                >
                                    {Object.entries(selectionStages).map(([k, v]) => (
                                        <option key={k} value={k}>
                                            {v.label} ({k})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Perubahan Tahap</label>
                                <textarea
                                    rows={3}
                                    placeholder="Contoh: Lolos seleksi tahap administrasi, pengumuman nomor 41/UN/2026..."
                                    value={stageForm.data.notes}
                                    onChange={(e) => stageForm.setData('notes', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tautan Bukti Pendaftaran / Submission Portal (Opsional)</label>
                                <input
                                    type="text"
                                    placeholder="https://... Bukti portal eksternal penyelenggara"
                                    value={stageForm.data.external_submission_proof}
                                    onChange={(e) => stageForm.setData('external_submission_proof', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setStageModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={stageForm.processing}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                                >
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: KIRIM UNDANGAN KE CALON ANGGOTA (STUDENT-LED FORMATION) */}
            {inviteModalOpen && selectedCandidate && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">Kirim Undangan Bergabung Tim</h3>
                            <button onClick={() => setInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleInviteCandidate} className="space-y-4">
                            <div className="p-3.5 rounded-xl bg-blue-50 text-xs text-blue-900 space-y-1">
                                <div>Mengundang <strong>{selectedCandidate.user.name}</strong> ke tim.</div>
                                <div className="text-[11px] text-blue-700">Skor Kesesuaian Kompetensi: <strong>{selectedCandidate.final_score}%</strong> (Skill 40%, Role 20%, Availability 20%, Fairness 20%)</div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Penugasan Peran / Role Anggota</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Frontend Developer, Pitcher, System Analyst"
                                    value={candidateRoleName}
                                    onChange={(e) => setCandidateRoleName(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pesan Undangan (Opsional)</label>
                                <textarea
                                    rows={2}
                                    placeholder="Hai, mari bergabung dengan tim kami untuk berkolaborasi di kompetisi ini!"
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setInviteModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                >
                                    Kirim Undangan Resmi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: TAMBAH TUGAS KANBAN */}
            {taskModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">Tambah Tugas Kanban</h3>
                            <button onClick={() => setTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Judul Tugas <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Buat wireframe Figma, susun RAB proposal"
                                    value={taskForm.data.title}
                                    onChange={(e) => taskForm.setData('title', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Singkat</label>
                                <textarea
                                    rows={2}
                                    placeholder="Rincian yang harus diselesaikan..."
                                    value={taskForm.data.description}
                                    onChange={(e) => taskForm.setData('description', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Prioritas</label>
                                    <select
                                        value={taskForm.data.priority}
                                        onChange={(e) => taskForm.setData('priority', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                    >
                                        <option value="low">Rendah</option>
                                        <option value="medium">Sedang</option>
                                        <option value="high">Tinggi</option>
                                        <option value="urgent">Mendesak</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Tenggat Waktu</label>
                                    <input
                                        type="date"
                                        value={taskForm.data.due_on}
                                        onChange={(e) => taskForm.setData('due_on', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setTaskModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={taskForm.processing}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                                >
                                    Simpan Tugas
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 4: UNGGAH DOKUMEN / BERKAS KARYA */}
            {docModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">Unggah Berkas / Dokumen Karya</h3>
                            <button onClick={() => setDocModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleUploadDoc} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Dokumen</label>
                                <input
                                    type="text"
                                    required
                                    value={docForm.data.name}
                                    onChange={(e) => docForm.setData('name', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            {rounds.length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Kaitkan ke Babak Lomba</label>
                                    <select
                                        value={docForm.data.competition_round_id}
                                        onChange={(e) => docForm.setData('competition_round_id', e.target.value)}
                                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                    >
                                        <option value="">-- Umum / Tanpa Babak Tertentu --</option>
                                        {rounds.map((r: any) => (
                                            <option key={r.id} value={r.id}>
                                                Babak {r.round_number}: {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Berkas File (PDF / Gambar / Zip)</label>
                                <input
                                    type="file"
                                    onChange={(e) => docForm.setData('file', e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Atau Tautan URL Eksternal (Drive, GitHub, Figma)</label>
                                <input
                                    type="url"
                                    placeholder="https://... Google Drive, Figma, GitHub, YouTube"
                                    value={docForm.data.url}
                                    onChange={(e) => docForm.setData('url', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tautan Submission Portal Penyelenggara (Opsional)</label>
                                <input
                                    type="url"
                                    placeholder="https://... Bukti submission resmi"
                                    value={docForm.data.external_submission_url}
                                    onChange={(e) => docForm.setData('external_submission_url', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setDocModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={docForm.processing}
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                >
                                    Unggah Dokumen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 5: ULAS DOKUMEN (MENTOR / ADMIN) */}
            {reviewModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">Ulas Berkas Karya Mahasiswa</h3>
                            <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleReviewDoc} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Penilaian Berkas</label>
                                <select
                                    value={reviewForm.data.status}
                                    onChange={(e) => reviewForm.setData('status', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                >
                                    <option value="approved">Disetujui (Approved)</option>
                                    <option value="ready">Siap Diajukan (Ready)</option>
                                    <option value="revision_required">Perlu Revisi (Revision Required)</option>
                                    <option value="in_review">Sedang Ditinjau (In Review)</option>
                                    <option value="rejected">Ditolak (Rejected)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan & Masukan Perbaikan</label>
                                <textarea
                                    rows={3}
                                    placeholder="Beri umpan balik untuk disempurnakan tim..."
                                    value={reviewForm.data.feedback}
                                    onChange={(e) => reviewForm.setData('feedback', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setReviewModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                >
                                    Simpan Ulasan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 6: TUGASKAN DOSEN PEMBIMBING */}
            {mentorModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">Tugaskan Dosen Pembimbing</h3>
                            <button onClick={() => setMentorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleAssignMentor} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Dosen Kampus</label>
                                <select
                                    value={mentorForm.data.lecturer_id}
                                    onChange={(e) => mentorForm.setData('lecturer_id', e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                >
                                    {availableLecturers.map((lec) => (
                                        <option key={lec.id} value={lec.id}>
                                            {lec.name} ({lec.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan / Arahan Bimbingan</label>
                                <textarea
                                    rows={3}
                                    placeholder="Contoh: Fokus pada pematangan arsitektur sistem dan pitch deck..."
                                    value={mentorForm.data.notes}
                                    onChange={(e) => mentorForm.setData('notes', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setMentorModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                >
                                    Tugaskan Dosen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 7: CATAT HASIL KOMPETISI */}
            {resultModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">Catat Hasil Kompetisi</h3>
                            <button onClick={() => setResultModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordResult} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Capaian / Hasil Akhir</label>
                                    <select
                                        value={resultForm.data.outcome}
                                        onChange={(e) => resultForm.setData('outcome', e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                                    >
                                        <option value="1st_place">Juara 1 (1st Place)</option>
                                        <option value="2nd_place">Juara 2 (2nd Place)</option>
                                        <option value="3rd_place">Juara 3 (3rd Place)</option>
                                        <option value="finalist">Finalis (Finalist)</option>
                                        <option value="special_award">Penghargaan Khusus</option>
                                        <option value="participant">Peserta Aktif</option>
                                        <option value="not_selected">Belum Lolos</option>
                                        <option value="withdrawn">Mengundurkan Diri</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Peringkat (Jika ada)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={resultForm.data.rank}
                                        onChange={(e) => resultForm.setData('rank', parseInt(e.target.value, 10) || 1)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Judul Prestasi untuk Portofolio</label>
                                <input
                                    type="text"
                                    required
                                    value={resultForm.data.achievement_title}
                                    onChange={(e) => resultForm.setData('achievement_title', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Berkas Sertifikat Penghargaan (PDF / Gambar)</label>
                                <input
                                    type="file"
                                    accept="application/pdf,image/*"
                                    onChange={(e) => resultForm.setData('certificate', e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-800 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Atau URL Bukti Pengumuman Resmi</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={resultForm.data.evidence_url}
                                    onChange={(e) => resultForm.setData('evidence_url', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan Tambahan</label>
                                <textarea
                                    rows={2}
                                    placeholder="Keterangan tambahan mengenai hasil..."
                                    value={resultForm.data.notes}
                                    onChange={(e) => resultForm.setData('notes', e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setResultModalOpen(false)}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={resultForm.processing}
                                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                                >
                                    Kirim Hasil Kompetisi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
