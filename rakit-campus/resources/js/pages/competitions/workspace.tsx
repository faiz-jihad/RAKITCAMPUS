import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Award,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    FileText,
    FolderKanban,
    GraduationCap,
    History,
    Lock,
    MessageSquare,
    Plus,
    Send,
    Share2,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Trophy,
    Upload,
    UserCheck,
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
    isLeader,
    isMember,
    isMentor,
    isAdmin,
}: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'kanban' | 'documents' | 'mentoring' | 'results' | 'history'>('overview');

    // Modals
    const [stageModalOpen, setStageModalOpen] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [candidateRoleName, setCandidateRoleName] = useState('Anggota Tim');
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

    const docForm = useForm({
        required_document_key: 'proposal',
        name: '',
        url: '',
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

    const handleInviteCandidate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCandidate) return;

        router.post(
            route('competitions.invite-member', participation.id),
            {
                student_id: selectedCandidate.user.id,
                role_name: candidateRoleName,
            },
            {
                onSuccess: () => {
                    setInviteModalOpen(false);
                    setSelectedCandidate(null);
                },
            }
        );
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
        router.patch(route('competitions.tasks.update', [participation.id, taskId]), {
            status,
        });
    };

    const handleUploadDoc = (e: React.FormEvent) => {
        e.preventDefault();
        docForm.post(route('competitions.documents.upload', participation.id), {
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

        reviewForm.post(route('competitions.documents.review', [participation.id, reviewDocId]), {
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Workspace: ${participation.team?.name} — ${participation.competition?.name}`} />

            <div className="min-h-screen bg-[#F8FAFC] relative text-slate-900 pb-24 overflow-hidden">
                <div className="pointer-events-none absolute -top-24 -left-20 h-[480px] w-[480px] rounded-full bg-blue-100/50 blur-[110px]" />
                <div className="pointer-events-none absolute top-48 -right-20 h-[380px] w-[380px] rounded-full bg-slate-200/50 blur-[100px]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-6">
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
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                                    Tahap: {selectionStages[participation.stage]?.label || participation.stage}
                                </span>
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
                                <span>{readinessScore >= 80 ? '🔥 Siap Maju' : readinessScore >= 40 ? '⚡ Dalam Proses' : '🌱 Awal Persiapan'}</span>
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
                                                {isPassed ? '✓' : index + 1}
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
                            <span>Anggota Tim & Matchmaking ({participation.team?.members?.length || 0})</span>
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
                            <span>Kanban Tugas ({participation.team?.tasks?.length || 0})</span>
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

                    {/* TAB CONTENT 1: OVERVIEW & MATCHMAKING */}
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left 2 Cols: Team Members */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="glass-card rounded-3xl p-6 bg-white/85 space-y-4">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Users className="size-4 text-blue-600" />
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Daftar Anggota Tim ({participation.team?.members?.length || 0} / {participation.team?.capacity || participation.competition?.max_team_size})
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
                                            <div key={member.id} className="py-3 flex items-center justify-between gap-4">
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

                                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                                    {member.user?.skills?.slice(0, 3).map((sk: any) => (
                                                        <span key={sk.id} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                                                            {sk.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
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
                                                                Rekrut
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

                    {/* TAB CONTENT 2: KANBAN TASKS */}
                    {activeTab === 'kanban' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Papan Tugas & Timeline Persiapan
                                </span>
                                {isMember && (
                                    <button
                                        onClick={() => setTaskModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Tambah Tugas</span>
                                    </button>
                                )}
                            </div>

                            {/* 4-Column Kanban Board */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {(['todo', 'in_progress', 'in_review', 'completed'] as const).map((columnKey) => {
                                    const colTasks = participation.team?.tasks?.filter((t: any) => t.status === columnKey) || [];
                                    const colLabels: Record<string, string> = {
                                        todo: 'Belum Dimulai',
                                        in_progress: 'Sedang Dikerjakan',
                                        in_review: 'Ulasan / Review',
                                        completed: 'Selesai',
                                    };

                                    return (
                                        <div key={columnKey} className="glass-card rounded-2xl p-4 bg-white/85 flex flex-col gap-3 min-h-[360px]">
                                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                                <span className="text-xs font-bold text-slate-700 capitalize">
                                                    {colLabels[columnKey]}
                                                </span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                    {colTasks.length}
                                                </span>
                                            </div>

                                            <div className="space-y-2.5 flex-1">
                                                {colTasks.map((task: any) => (
                                                    <div
                                                        key={task.id}
                                                        className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2 hover:border-blue-300 transition"
                                                    >
                                                        <div className="text-xs font-bold text-slate-900 leading-snug">{task.title}</div>
                                                        {task.description && (
                                                            <p className="text-[11px] text-slate-500 line-clamp-2">{task.description}</p>
                                                        )}

                                                        <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400">
                                                            <span className="capitalize font-semibold text-slate-600">{task.priority}</span>
                                                            {isMember && (
                                                                <select
                                                                    value={task.status}
                                                                    onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                                                    className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-bold text-slate-700 cursor-pointer"
                                                                >
                                                                    <option value="todo">To Do</option>
                                                                    <option value="in_progress">In Progress</option>
                                                                    <option value="in_review">In Review</option>
                                                                    <option value="completed">Done</option>
                                                                </select>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB CONTENT 3: DOCUMENTS & DELIVERABLES */}
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
                                            Unggah setiap dokumen syarat kompetisi. Versi dokumen akan tersimpan secara terurut.
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
                                                    ) : latestDoc?.url ? (
                                                        <a
                                                            href={latestDoc.url}
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

                    {/* TAB CONTENT 4: MENTORING */}
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

                    {/* TAB CONTENT 5: RESULTS & ACHIEVEMENTS */}
                    {activeTab === 'results' && (
                        <div className="glass-card rounded-3xl p-6 sm:p-8 bg-white/85 space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Award className="size-4 text-amber-500" />
                                        <span>Pencatatan Hasil & Verifikasi Prestasi Portofolio</span>
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Hasil kompetisi yang diverifikasi resmi oleh dosen/admin akan otomatis tampil di portofolio setiap anggota tim.
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

                    {/* TAB CONTENT 6: AUDIT TRAIL HISTORY */}
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

            {/* MODAL 2: REKRUT CALON ANGGOTA */}
            {inviteModalOpen && selectedCandidate && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">Rekrut Anggota ke Tim</h3>
                            <button onClick={() => setInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleInviteCandidate} className="space-y-4">
                            <div className="p-3.5 rounded-xl bg-blue-50 text-xs text-blue-900">
                                Menambahkan <strong>{selectedCandidate.user.name}</strong> ke tim. Skor Kesesuaian: <strong>{selectedCandidate.final_score}%</strong>.
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
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                                >
                                    Konfirmasi Tambah Anggota
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: TAMBAH TUGAS */}
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

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Berkas File (PDF / Gambar / Zip)</label>
                                <input
                                    type="file"
                                    onChange={(e) => docForm.setData('file', e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 cursor-pointer"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Atau Tautan URL Eksternal</label>
                                <input
                                    type="url"
                                    placeholder="https://... Google Drive, Figma, GitHub, YouTube"
                                    value={docForm.data.url}
                                    onChange={(e) => docForm.setData('url', e.target.value)}
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
                                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
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
                                    <option value="revision_required">Perlu Revisi (Revision Required)</option>
                                    <option value="reviewed">Telah Diperiksa (Reviewed)</option>
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
                                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
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
                                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs"
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
                                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs"
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
