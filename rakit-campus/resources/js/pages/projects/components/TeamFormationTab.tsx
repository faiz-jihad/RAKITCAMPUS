import { useState } from 'react';
import { router, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Award,
    Check,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileCheck,
    FileText,
    FolderKanban,
    GraduationCap,
    Info,
    Lock,
    Send,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Sparkles,
    Unlock,
    UserCheck,
    Users,
    X,
} from 'lucide-react';

interface Props {
    project: any;
    isLeader: boolean;
    isLecturer: boolean;
    canAccessWorkspace: boolean;
    academicClass?: any;
    livingProposal?: any;
}

export default function TeamFormationTab({
    project,
    isLeader,
    isLecturer,
    canAccessWorkspace,
    academicClass,
    livingProposal,
}: Props) {
    const { errors: pageErrors } = usePage().props as any;
    const isAcademic = Boolean(academicClass || project.academic_class_id || project.category === 'academic');
    const formationStatus = project.formation_status || 'draft';
    const formationApprover = project.formation_approver || project.formationApprover;
    const activeMembers = (project.team?.members || []).filter((m: any) => !m.status || m.status === 'active');
    const minRequired = project.min_team_size || 2;
    const targetCapacity = academicClass?.target_team_size 
        || project.academic_class?.target_team_size 
        || project.academicClass?.target_team_size 
        || project.max_team_size 
        || 4;
    
    // Alur 3 Prerequisite Rules:
    // 1. Anggota tim wajib sudah PENUH (sesuai target ukuran tim kelas/proyek)
    const isTeamFull = activeMembers.length >= targetCapacity;
    // 2. Draft Living Proposal wajib sudah tersedia (tidak kosong)
    const hasProposal = Boolean(
        livingProposal?.current_version_id 
        || (livingProposal?.versions && livingProposal.versions.length > 0)
        || project.description 
        || project.problem_statement
    );
    const canSubmitToLecturer = isTeamFull && hasProposal;
    const isWorkspaceUnlocked = Boolean(canAccessWorkspace || (!isAcademic && isTeamFull) || formationStatus === 'workspace_activated');

    const [processing, setProcessing] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewDecision, setReviewDecision] = useState<'approve' | 'request_changes' | 'reject'>('approve');
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);

    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showOpenMatchmakingModal, setShowOpenMatchmakingModal] = useState(false);
    const [showActivateWorkspaceModal, setShowActivateWorkspaceModal] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    // Lifecycle Stages (Differentiated: Academic 7 Stages vs Mandiri 5 Stages)
    const stages = isAcademic
        ? [
            { id: 'draft', title: 'Perencanaan', desc: 'Pembuatan proyek dan deskripsi' },
            { id: 'requirements_configured', title: 'Konfigurasi Kebutuhan', desc: 'Penentuan peran & batas kapasitas' },
            { id: 'matchmaking_open', title: 'Matchmaking Terbuka', desc: 'Penerimaan lamaran & undangan sekelas' },
            { id: 'formation_review', title: 'Evaluasi Dosen', desc: 'Peninjauan komposisi oleh pengampu' },
            { id: 'lecturer_approved', title: 'Disetujui Dosen', desc: 'Kelayakan tim resmi divalidasi' },
            { id: 'team_locked', title: 'Formasi Terkunci', desc: 'Komposisi final ditetapkan' },
            { id: 'workspace_activated', title: 'Workspace Aktif', desc: 'Ruang kerja & Kanban terbuka penuh' },
        ]
        : [
            { id: 'draft', title: 'Perencanaan', desc: 'Pembuatan proyek dan deskripsi' },
            { id: 'requirements_configured', title: 'Konfigurasi Kebutuhan', desc: 'Penentuan peran & batas kapasitas' },
            { id: 'matchmaking_open', title: 'Rekrutmen Terbuka', desc: 'Penerimaan lamaran & anggota tim' },
            { id: 'team_locked', title: 'Formasi Penuh', desc: 'Kuota anggota telah terpenuhi' },
            { id: 'workspace_activated', title: 'Workspace Aktif', desc: 'Ruang kerja & Kanban terbuka otomatis' },
        ];

    const getStageIndex = (status: string) => {
        if (!isAcademic) {
            if (isWorkspaceUnlocked) return 4;
            if (status === 'team_locked') return 3;
            if (status === 'matchmaking_open' || (project.status === 'recruiting' && activeMembers.length > 0)) return 2;
            if (status === 'requirements_configured') return 1;
            return 0;
        }
        const idx = stages.findIndex((s) => s.id === status);
        return idx !== -1 ? idx : 0;
    };

    const currentStageIndex = getStageIndex(formationStatus);

    // Leader Action 1: Open Matchmaking
    const handleOpenMatchmaking = () => {
        setShowOpenMatchmakingModal(true);
    };

    const confirmOpenMatchmaking = () => {
        setProcessing(true);
        router.post(`/projects/${project.id}/formation/open`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setShowOpenMatchmakingModal(false);
            },
        });
    };

    // Leader Action 2: Submit Formation to Lecturer (Alur 3: Tahap 1)
    const handleSubmitFormation = () => {
        if (!isTeamFull) {
            setValidationError(`Seluruh kuota anggota tim wajib PENUH sebelum dapat diajukan ke Dosen Pengampu (${activeMembers.length}/${targetCapacity} anggota). Silakan lengkapi anggota tim terlebih dahulu.`);
            return;
        }

        if (!hasProposal) {
            setValidationError('Draft Living Proposal belum tersedia. Silakan lengkapi rancangan proposal terlebih dahulu sebelum diajukan ke Dosen Pengampu.');
            return;
        }

        setShowSubmitModal(true);
    };

    const confirmSubmitFormation = () => {
        setProcessing(true);
        router.post(`/projects/${project.id}/formation/submit`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setShowSubmitModal(false);
            },
        });
    };

    // Lecturer Review Action
    const handleLecturerReview = () => {
        if ((reviewDecision === 'reject' || reviewDecision === 'request_changes') && !reviewNotes.trim()) {
            setReviewError('Wajib mengisi catatan/alasan untuk revisi atau penolakan formasi tim.');
            return;
        }
        setReviewError(null);
        setProcessing(true);
        router.post(
            `/projects/${project.id}/formation/review`,
            {
                action: reviewDecision,
                notes: reviewNotes,
                reason: reviewDecision === 'reject' ? reviewNotes : undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowReviewModal(false);
                    setReviewNotes('');
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    // Activate Workspace
    const handleActivateWorkspace = () => {
        setShowActivateWorkspaceModal(true);
    };

    const confirmActivateWorkspace = () => {
        setProcessing(true);
        router.post(`/projects/${project.id}/formation/activate-workspace`, {}, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setShowActivateWorkspaceModal(false);
            },
        });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Top Lifecycle Header Card */}
            <div className="glass-surface p-6 sm:p-8 rounded-3xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                                <ShieldCheck className="size-5" />
                            </span>
                            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-700">
                                {isAcademic ? 'Siklus Formasi Tim & Persetujuan Dosen' : 'Siklus Formasi Tim Mandiri'}
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Status Formasi: {stages[currentStageIndex]?.title}
                        </h2>
                    </div>

                    {/* Quick Status Pill */}
                    <div className="flex flex-wrap items-center gap-3">
                        {isWorkspaceUnlocked ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-md">
                                <Sparkles className="size-4" />
                                <span>Workspace Aktif</span>
                            </div>
                        ) : formationStatus === 'lecturer_approved' ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-md">
                                <CheckCircle2 className="size-4" />
                                <span>Disetujui Dosen</span>
                            </div>
                        ) : formationStatus === 'formation_review' ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800 text-white font-bold text-xs shadow-md">
                                <Clock className="size-4" />
                                <span>Menunggu Persetujuan Dosen</span>
                            </div>
                        ) : formationStatus === 'formation_rejected' ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md">
                                <AlertCircle className="size-4" />
                                <span>Ditolak Dosen</span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md">
                                <Users className="size-4" />
                                <span>Tahap Rekrutmen & Pembentukan</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pipeline visual */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className={`grid grid-cols-2 ${isAcademic ? 'sm:grid-cols-4 lg:grid-cols-7' : 'sm:grid-cols-3 lg:grid-cols-5'} gap-3`}>
                        {stages.map((stg, idx) => {
                            const isCompleted = idx < currentStageIndex;
                            const isCurrent = idx === currentStageIndex;

                            return (
                                <div
                                    key={stg.id}
                                    className={`relative p-3 rounded-2xl border transition flex flex-col justify-between ${
                                        isCurrent
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20'
                                            : isCompleted
                                            ? 'bg-blue-50/50 border-blue-200 text-slate-900'
                                            : 'bg-white/60 border-slate-200/80 text-slate-400'
                                    }`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span
                                                className={`size-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                                    isCurrent
                                                        ? 'bg-white text-blue-600'
                                                        : isCompleted
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}
                                            >
                                                {isCompleted ? <Check className="size-3.5 stroke-[3]" /> : idx + 1}
                                            </span>
                                            {isCurrent && (
                                                <span className="size-2 rounded-full bg-white animate-pulse" />
                                            )}
                                        </div>
                                        <h4 className="text-xs font-bold leading-snug">
                                            {stg.title}
                                        </h4>
                                    </div>
                                    <p
                                        className={`text-[10px] mt-2 line-clamp-2 ${
                                            isCurrent ? 'text-blue-100' : isCompleted ? 'text-slate-600' : 'text-slate-400'
                                        }`}
                                    >
                                        {stg.desc}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Validation Errors if any */}
            {pageErrors && (pageErrors.team || pageErrors.workspace || pageErrors.notes || pageErrors.reason || pageErrors.action || pageErrors.auth) && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                    {pageErrors.team || pageErrors.workspace || pageErrors.reason || pageErrors.notes || pageErrors.action || pageErrors.auth}
                </div>
            )}

            {/* Formation Notes & Feedback History (If any, Academic only) */}
            {isAcademic && project.formation_notes && (
                <div className="glass-surface p-5 rounded-3xl border border-blue-200 bg-blue-50/40">
                    <div className="flex items-start gap-3">
                        <GraduationCap className="size-5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                Catatan / Umpan Balik Dosen Pengampu:
                            </h4>
                            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                                "{project.formation_notes}"
                            </p>
                            {formationApprover && (
                                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                                    Oleh: <span className="font-semibold text-slate-800">{formationApprover.name}</span>
                                    {project.formation_approved_at && ` • Disetujui pada ${new Date(project.formation_approved_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Lecturer Review Panel (Visible to Class Lecturers in Academic Projects) */}
            {isAcademic && isLecturer && (
                <div className="glass-surface p-6 rounded-3xl border border-slate-200/80 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-xs">
                                <GraduationCap className="size-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Panel Pengawasan & Evaluasi Dosen Pengampu
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setReviewDecision('approve');
                                    setShowReviewModal(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <CheckCircle2 className="size-4" />
                                <span>Setujui Formasi</span>
                            </button>
                            <button
                                onClick={() => {
                                    setReviewDecision('request_changes');
                                    setShowReviewModal(true);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Minta Revisi</span>
                            </button>
                            <button
                                onClick={() => {
                                    setReviewDecision('reject');
                                    setShowReviewModal(true);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Tolak</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Information Panel (For regular team members) */}
            {!isLeader && !isLecturer && (
                <div className="glass-surface p-5 rounded-3xl border border-slate-200/80 bg-white shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-900">Peran Anda: Anggota Tim</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isAcademic
                                    ? `Pengelolaan formasi kelompok, seleksi lamaran, dan pengajuan tim ke dosen pengampu dilakukan oleh Ketua Tim (${project.leader?.name}).`
                                    : `Pengelolaan formasi kelompok dan seleksi lamaran dilakukan oleh Ketua Tim (${project.leader?.name}). Ruang kerja (workspace) akan aktif otomatis segera setelah kuota anggota tim terpenuhi.`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Leader Actions Panel */}
            {isLeader && (
                <div className="glass-surface p-6 rounded-3xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-blue-600 text-white">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Tindakan Ketua Tim
                                </h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Action 1: Open Matchmaking */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">1. Sesi Rekrutmen & Matchmaking</h4>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-slate-500">
                                    Status:{' '}
                                    <strong className="text-slate-800">
                                        {formationStatus === 'matchmaking_open' || (project.status === 'recruiting' && !isTeamFull) ? 'Terbuka' : 'Ditutup/Selesai'}
                                    </strong>
                                </span>
                                {formationStatus !== 'matchmaking_open' && !isWorkspaceUnlocked && (
                                    <button
                                        onClick={handleOpenMatchmaking}
                                        disabled={processing}
                                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                    >
                                        Buka Matchmaking
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Action 2: Dosen submission for Academic OR Auto-Activation status for Mandiri */}
                        {isAcademic ? (
                            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-900">2. Pengajuan ke Dosen</h4>
                                        {canSubmitToLecturer ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                Syarat Terpenuhi
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                Menunggu Prasyarat
                                            </span>
                                        )}
                                    </div>

                                    {/* Checklist Prasyarat Alur 3 */}
                                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                {isTeamFull ? <CheckCircle2 className="size-4 text-blue-600" /> : <Clock className="size-4 text-slate-400" />}
                                                <span>Formasi Anggota Penuh: <strong>{activeMembers.length}/{targetCapacity} Orang</strong></span>
                                            </span>
                                            <span className={`text-[11px] font-bold ${isTeamFull ? 'text-blue-700' : 'text-slate-600'}`}>
                                                {isTeamFull ? 'Lengkap' : `Kurang ${targetCapacity - activeMembers.length}`}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                                            <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                {hasProposal ? <CheckCircle2 className="size-4 text-blue-600" /> : <AlertCircle className="size-4 text-slate-400" />}
                                                <span>Draft Living Proposal</span>
                                            </span>
                                            <span className={`text-[11px] font-bold ${hasProposal ? 'text-blue-700' : 'text-slate-600'}`}>
                                                {hasProposal ? 'Tersedia' : 'Belum Dibuat'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                                    {['requirements_configured', 'matchmaking_open', 'formation_rejected', 'draft'].includes(formationStatus) && (
                                        <button
                                            onClick={handleSubmitFormation}
                                            disabled={processing || !canSubmitToLecturer}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                                canSubmitToLecturer
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer'
                                                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                                            }`}
                                        >
                                            <Send className="size-3.5" />
                                            <span>{formationStatus === 'formation_rejected' ? 'Ajukan Ulang ke Dosen' : 'Ajukan ke Dosen'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-900">2. Aktivasi Workspace Mandiri</h4>
                                        {isWorkspaceUnlocked ? (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                Aktif Otomatis
                                            </span>
                                        ) : (
                                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                                Menunggu Kuota Penuh
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5 font-medium text-slate-700">
                                                {isTeamFull ? <CheckCircle2 className="size-4 text-blue-600" /> : <Clock className="size-4 text-slate-400" />}
                                                <span>Kapasitas Anggota: <strong>{activeMembers.length}/{targetCapacity} Orang</strong></span>
                                            </span>
                                            <span className={`text-[11px] font-bold ${isTeamFull ? 'text-blue-700' : 'text-slate-600'}`}>
                                                {isTeamFull ? 'Terpenuhi' : `Kurang ${targetCapacity - activeMembers.length}`}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                                    {isWorkspaceUnlocked && project.team?.id ? (
                                        <Link
                                            href={`/workspace/${project.team.id}`}
                                            className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                                        >
                                            <FolderKanban className="size-3.5" />
                                            <span>Buka Workspace Tim</span>
                                        </Link>
                                    ) : (
                                        <span className="text-[11px] text-slate-500 font-medium">
                                            Workspace aktif otomatis saat kuota penuh
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Workspace Activation Gatekeeper Panel */}
            <div className="glass-surface p-6 sm:p-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl shrink-0 ${
                            isWorkspaceUnlocked
                                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                : 'bg-slate-100 text-slate-500'
                        }`}>
                            {isWorkspaceUnlocked ? <Unlock className="size-6" /> : <Lock className="size-6" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-slate-900">
                                    Project Workspace {isAcademic ? 'Gatekeeper' : ''}
                                </h3>
                                {isWorkspaceUnlocked ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                        Terbuka Penuh
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                                        {isAcademic ? 'Terkunci' : 'Menunggu Kuota Lengkap'}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                                {isWorkspaceUnlocked
                                    ? (isAcademic
                                        ? 'Kelompok proyek telah divalidasi dan disetujui dosen pengampu. Seluruh anggota dapat mengakses kanban, timeline milestone, dan kolaborasi living proposal.'
                                        : 'Kuota anggota tim mandiri telah terpenuhi. Ruang kerja proyek, kanban, dan manajemen tugas aktif dan siap digunakan.')
                                    : (isAcademic
                                        ? 'Sesuai aturan akademik, Project Workspace hanya dapat diakses setelah susunan tim disetujui oleh Dosen Pengampu kelas.'
                                        : 'Ruang kerja proyek mandiri akan terbuka secara otomatis segera setelah formasi kuota anggota terpenuhi.')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {isWorkspaceUnlocked && project.team?.id ? (
                            <Link
                                href={`/workspace/${project.team?.id}`}
                                className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-md flex items-center gap-2"
                            >
                                <FolderKanban className="size-4" />
                                <span>Buka Workspace Tim</span>
                                <ExternalLink className="size-3.5" />
                            </Link>
                        ) : isAcademic && formationStatus === 'lecturer_approved' ? (
                            <button
                                onClick={handleActivateWorkspace}
                                disabled={processing}
                                className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Unlock className="size-4" />
                                <span>Aktifkan Project Workspace Sekarang</span>
                            </button>
                        ) : (
                            <div className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                                <Lock className="size-3.5" />
                                <span>{isAcademic ? 'Menunggu Persetujuan Dosen' : `Menunggu Kuota Tim (${activeMembers.length}/${targetCapacity})`}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Current Active Roster Table */}
            <div className="glass-surface p-6 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-slate-900 text-white">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Susunan Anggota Tim Saat Ini ({activeMembers.length} / {targetCapacity})
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[10px]">
                                <th className="py-3 px-4">Nama Mahasiswa</th>
                                <th className="py-3 px-4">Peran di Tim</th>
                                <th className="py-3 px-4">Status Keanggotaan</th>
                                <th className="py-3 px-4">Tanggal Bergabung</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {activeMembers.map((m: any) => (
                                <tr key={m.id} className="hover:bg-slate-50/50 transition">
                                    <td className="py-3.5 px-4">
                                        <div className="font-bold text-slate-900">
                                            {m.user?.name || 'Mahasiswa'}
                                            {m.user?.id === project.leader_id && (
                                                <span className="ml-2 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-[10px] font-extrabold">
                                                    Ketua Tim
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            {m.user?.email || ''}
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                                        {m.role_name || (m.user?.id === project.leader_id ? 'Project Lead' : 'Anggota Tim')}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                            <CheckCircle2 className="size-3" />
                                            Aktif
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-slate-500">
                                        {m.created_at
                                            ? new Date(m.created_at).toLocaleDateString('id-ID', {
                                                  day: 'numeric',
                                                  month: 'short',
                                                  year: 'numeric',
                                              })
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Lecturer Review */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900">
                                {reviewDecision === 'approve'
                                    ? 'Setujui Formasi Tim'
                                    : reviewDecision === 'request_changes'
                                    ? 'Minta Revisi Formasi'
                                    : 'Tolak Formasi Tim'}
                            </h3>
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Catatan / Umpan Balik Dosen{' '}
                                    {reviewDecision !== 'approve' && <span className="text-rose-500">*</span>}
                                </label>
                                <textarea
                                    rows={4}
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder={
                                        reviewDecision === 'approve'
                                            ? 'Catatan apresiasi atau instruksi tambahan awal proyek (opsional)...'
                                            : 'Jelaskan alasan revisi atau kekurangan komposisi peran/keahlian...'
                                    }
                                    className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                />
                                {reviewError && (
                                    <p className="text-[11px] text-rose-600 font-medium mt-1">
                                        {reviewError}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => setShowReviewModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleLecturerReview}
                                    disabled={processing}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer disabled:opacity-50 ${
                                        reviewDecision === 'approve'
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-slate-900 hover:bg-slate-800'
                                    }`}
                                >
                                    {processing ? 'Memproses...' : 'Kirim Keputusan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Ajukan ke Dosen */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        {/* Top Close Button */}
                        <button
                            type="button"
                            onClick={() => setShowSubmitModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                                <Send className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    {formationStatus === 'formation_rejected' ? 'Ajukan Ulang Formasi ke Dosen' : 'Ajukan Formasi Tim & Proposal'}
                                </h3>
                            </div>
                        </div>

                        {/* Verification Checklist Card */}
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 my-4">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                Ringkasan Berkas Pengajuan:
                            </p>
                            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                    <Users className="size-3.5 text-blue-600" />
                                    <span>Formasi Anggota</span>
                                </span>
                                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                                    {activeMembers.length} / {targetCapacity} Orang (Lengkap)
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200/60">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                    <FileText className="size-3.5 text-blue-600" />
                                    <span>Dokumen Proposal</span>
                                </span>
                                <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                                    Living Proposal Siap
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs py-1">
                                <span className="text-slate-600 flex items-center gap-1.5">
                                    <GraduationCap className="size-3.5 text-blue-600" />
                                    <span>Dosen Pengampu</span>
                                </span>
                                <span className="font-bold text-slate-900 truncate max-w-[180px]">
                                    {academicClass?.lecturer?.name || project.lecturer?.name || 'Dosen Pengampu'}
                                </span>
                            </div>
                        </div>

                        {/* Note banner */}
                        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-800 leading-relaxed flex items-start gap-2 mb-5">
                            <Info className="size-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>Setelah diajukan, status proyek berpindah ke tahap <strong>Evaluasi Dosen</strong>. Formasi anggota akan dikunci sementara hingga dosen memberikan keputusan persetujuan.</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowSubmitModal(false)}
                                disabled={processing}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirmSubmitFormation}
                                disabled={processing}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <Send className="size-3.5" />
                                <span>{processing ? 'Mengajukan...' : 'Ya, Ajukan Sekarang'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Validasi / Peringatan Prasyarat */}
            {validationError && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200 text-center">
                        <button
                            type="button"
                            onClick={() => setValidationError(null)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="mx-auto size-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center mb-3.5 shadow-2xs">
                            <AlertCircle className="size-7" />
                        </div>

                        <h3 className="text-base font-black text-slate-900 tracking-tight">
                            Persyaratan Belum Lengkap
                        </h3>
                        <p className="text-xs text-slate-600 mt-2 leading-relaxed px-2">
                            {validationError}
                        </p>

                        <div className="mt-5">
                            <button
                                type="button"
                                onClick={() => setValidationError(null)}
                                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                            >
                                Mengerti
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Buka Matchmaking */}
            {showOpenMatchmakingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setShowOpenMatchmakingModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
                                <Sparkles className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Buka Sesi Matchmaking
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowOpenMatchmakingModal(false)}
                                disabled={processing}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirmOpenMatchmaking}
                                disabled={processing}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <span>{processing ? 'Membuka...' : 'Buka Sekarang'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Aktifkan Workspace */}
            {showActivateWorkspaceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setShowActivateWorkspaceModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
                                <FolderKanban className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Aktifkan Project Workspace
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowActivateWorkspaceModal(false)}
                                disabled={processing}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirmActivateWorkspace}
                                disabled={processing}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <span>{processing ? 'Mengaktifkan...' : 'Aktifkan Workspace'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
