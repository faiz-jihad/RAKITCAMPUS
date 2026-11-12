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
    FolderKanban,
    GraduationCap,
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
}

export default function TeamFormationTab({
    project,
    isLeader,
    isLecturer,
    canAccessWorkspace,
}: Props) {
    const { errors: pageErrors } = usePage().props as any;
    const formationStatus = project.formation_status || 'draft';
    const formationApprover = project.formation_approver || project.formationApprover;
    const activeMembers = project.team?.members || [];
    const minRequired = project.min_team_size || 2;
    const maxCapacity = project.max_team_size || 4;
    const hasEnoughMembers = activeMembers.length >= minRequired;

    const [processing, setProcessing] = useState(false);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewDecision, setReviewDecision] = useState<'approve' | 'request_changes' | 'reject'>('approve');
    const [showReviewModal, setShowReviewModal] = useState(false);

    // 7 Stages
    const stages = [
        { id: 'draft', title: 'Perencanaan', desc: 'Pembuatan proyek dan deskripsi' },
        { id: 'requirements_configured', title: 'Konfigurasi Kebutuhan', desc: 'Penentuan peran & batas kapasitas' },
        { id: 'matchmaking_open', title: 'Matchmaking Terbuka', desc: 'Penerimaan lamaran & undangan sekelas' },
        { id: 'formation_review', title: 'Evaluasi Dosen', desc: 'Peninjauan komposisi oleh pengampu' },
        { id: 'lecturer_approved', title: 'Disetujui Dosen', desc: 'Kelayakan tim resmi divalidasi' },
        { id: 'team_locked', title: 'Formasi Terkunci', desc: 'Komposisi final ditetapkan' },
        { id: 'workspace_activated', title: 'Workspace Aktif', desc: 'Ruang kerja & Kanban terbuka penuh' },
    ];

    const getStageIndex = (status: string) => {
        const idx = stages.findIndex((s) => s.id === status);
        return idx !== -1 ? idx : 0;
    };

    const currentStageIndex = getStageIndex(formationStatus);

    // Leader Action 1: Open Matchmaking
    const handleOpenMatchmaking = () => {
        if (!confirm('Buka sesi matchmaking untuk proyek ini? Mahasiswa sekelas akan dapat melihat rekomendasi dan mengirimkan lamaran.')) return;
        setProcessing(true);
        router.post(`/projects/${project.id}/formation/open`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    // Leader Action 2: Submit Formation to Lecturer
    const handleSubmitFormation = () => {
        if (!hasEnoughMembers) {
            alert(`Jumlah anggota saat ini (${activeMembers.length}) belum memenuhi kuota minimum (${minRequired} orang).`);
            return;
        }

        if (!confirm('Ajukan susunan tim ini kepada Dosen Pengampu untuk dievaluasi dan disetujui?')) return;
        setProcessing(true);
        router.post(`/projects/${project.id}/formation/submit`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    // Lecturer Review Action
    const handleLecturerReview = () => {
        if ((reviewDecision === 'reject' || reviewDecision === 'request_changes') && !reviewNotes.trim()) {
            alert('Wajib mengisi catatan/alasan untuk revisi atau penolakan formasi tim.');
            return;
        }

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
        if (!confirm('Aktifkan Project Workspace resmi sekarang? Seluruh anggota tim akan langsung memiliki akses ke modul Kanban, Milestone, dan Kolaborasi Dokumen.')) return;
        setProcessing(true);
        router.post(`/projects/${project.id}/formation/activate-workspace`, {}, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
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
                                Siklus Formasi Tim & Persetujuan Dosen
                            </span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Status Formasi: {stages[currentStageIndex]?.title}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 max-w-xl">
                            {stages[currentStageIndex]?.desc}. Sistem menjamin transparansi, kesetaraan peluang, dan validasi akademik dosen pengampu sebelum aktivitas pengembangan proyek dimulai.
                        </p>
                    </div>

                    {/* Quick Status Pill */}
                    <div className="flex flex-wrap items-center gap-3">
                        {formationStatus === 'workspace_activated' ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-md">
                                <Sparkles className="size-4" />
                                <span>Workspace Aktif</span>
                            </div>
                        ) : formationStatus === 'lecturer_approved' ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-600 text-white font-bold text-xs shadow-md">
                                <CheckCircle2 className="size-4" />
                                <span>Disetujui Dosen</span>
                            </div>
                        ) : formationStatus === 'formation_review' ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 text-white font-bold text-xs shadow-md">
                                <Clock className="size-4" />
                                <span>Menunggu Persetujuan Dosen</span>
                            </div>
                        ) : formationStatus === 'formation_rejected' ? (
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-600 text-white font-bold text-xs shadow-md">
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

                {/* 7-Stage Visual Pipeline */}
                <div className="mt-8 pt-6 border-t border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
                                            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
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
                                                        ? 'bg-emerald-500 text-white'
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}
                                            >
                                                {isCompleted ? <Check className="size-3.5 stroke-[3]" /> : idx + 1}
                                            </span>
                                            {isCurrent && (
                                                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                                            )}
                                        </div>
                                        <h4 className="text-xs font-bold leading-snug">
                                            {stg.title}
                                        </h4>
                                    </div>
                                    <p
                                        className={`text-[10px] mt-2 line-clamp-2 ${
                                            isCurrent ? 'text-blue-100' : isCompleted ? 'text-emerald-700' : 'text-slate-400'
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

            {/* Formation Notes & Feedback History (If any) */}
            {project.formation_notes && (
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

            {/* Lecturer Review Panel (Visible to Class Lecturers) */}
            {isLecturer && (
                <div className="glass-surface p-6 rounded-3xl border border-amber-300 bg-amber-50/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-xs">
                                <GraduationCap className="size-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Panel Pengawasan & Evaluasi Dosen Pengampu
                                </h3>
                                <p className="text-xs text-slate-600">
                                    Tinjau kesesuaian profil anggota, beban kerja mingguan, dan sebaran peran sebelum menyetujui.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setReviewDecision('approve');
                                    setShowReviewModal(true);
                                }}
                                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <CheckCircle2 className="size-4" />
                                <span>Setujui Formasi</span>
                            </button>
                            <button
                                onClick={() => {
                                    setReviewDecision('request_changes');
                                    setShowReviewModal(true);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Minta Revisi</span>
                            </button>
                            <button
                                onClick={() => {
                                    setReviewDecision('reject');
                                    setShowReviewModal(true);
                                }}
                                className="px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50 transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                                <span>Tolak</span>
                            </button>
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
                                <p className="text-xs text-slate-500">
                                    Kelola alur pendaftaran dan pengajuan formasi resmi kelompok.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Action 1: Open Matchmaking */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">1. Sesi Rekrutmen & Matchmaking</h4>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Buka rekrutmen terbuka agar mahasiswa sekelas dapat menemukan proyek ini dan mengajukan diri.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-slate-500">
                                    Status:{' '}
                                    <strong className="text-slate-800">
                                        {formationStatus === 'matchmaking_open' ? 'Terbuka' : 'Ditutup/Draft'}
                                    </strong>
                                </span>
                                {formationStatus !== 'matchmaking_open' && formationStatus !== 'workspace_activated' && (
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

                        {/* Action 2: Submit to Lecturer */}
                        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                            <div>
                                <h4 className="text-sm font-bold text-slate-900">2. Pengajuan Evaluasi Dosen</h4>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                    Setelah kuota minimum terpenuhi ({activeMembers.length}/{minRequired} anggota), ajukan ke dosen pengampu untuk persetujuan resmi.
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-slate-500">
                                    Kuota Minimum: <strong className={hasEnoughMembers ? 'text-emerald-600' : 'text-amber-600'}>
                                        {hasEnoughMembers ? 'Terpenuhi' : 'Kurang'}
                                    </strong>
                                </span>
                                {['requirements_configured', 'matchmaking_open', 'formation_rejected', 'draft'].includes(formationStatus) && (
                                    <button
                                        onClick={handleSubmitFormation}
                                        disabled={processing || !hasEnoughMembers}
                                        className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                    >
                                        {formationStatus === 'formation_rejected' ? 'Ajukan Ulang ke Dosen' : 'Ajukan ke Dosen'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Workspace Activation Gatekeeper Panel */}
            <div className="glass-surface p-6 sm:p-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-2xl shrink-0 ${
                            canAccessWorkspace
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                        }`}>
                            {canAccessWorkspace ? <Unlock className="size-6" /> : <Lock className="size-6" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-black text-slate-900">
                                    Project Workspace Gatekeeper
                                </h3>
                                {canAccessWorkspace ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Terbuka Penuh
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                                        Terkunci
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                                {canAccessWorkspace
                                    ? 'Kelompok proyek telah divalidasi dan disetujui dosen pengampu. Seluruh anggota dapat mengakses kanban, timeline milestone, dan kolaborasi living proposal.'
                                    : 'Sesuai aturan akademik, Project Workspace hanya dapat diakses setelah susunan tim disetujui oleh Dosen Pengampu kelas.'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {formationStatus === 'workspace_activated' ? (
                            <Link
                                href={`/workspace/${project.team?.id}`}
                                className="px-5 py-2.5 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-md flex items-center gap-2"
                            >
                                <FolderKanban className="size-4" />
                                <span>Buka Workspace Tim</span>
                                <ExternalLink className="size-3.5" />
                            </Link>
                        ) : formationStatus === 'lecturer_approved' ? (
                            <button
                                onClick={handleActivateWorkspace}
                                disabled={processing}
                                className="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Unlock className="size-4" />
                                <span>Aktifkan Project Workspace Sekarang</span>
                            </button>
                        ) : (
                            <div className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                                <Lock className="size-3.5" />
                                <span>Menunggu Persetujuan Dosen</span>
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
                                Susunan Anggota Tim Saat Ini ({activeMembers.length} / {maxCapacity})
                            </h3>
                            <p className="text-xs text-slate-500">
                                Anggota yang resmi tergabung dalam proyek ini.
                            </p>
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
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                                            ? 'bg-emerald-600 hover:bg-emerald-700'
                                            : reviewDecision === 'request_changes'
                                            ? 'bg-amber-600 hover:bg-amber-700'
                                            : 'bg-rose-600 hover:bg-rose-700'
                                    }`}
                                >
                                    {processing ? 'Memproses...' : 'Kirim Keputusan'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
