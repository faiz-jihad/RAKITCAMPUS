import { useState } from 'react';
import {
    AlertCircle,
    Check,
    CheckCircle2,
    Clock,
    Edit3,
    FileText,
    GraduationCap,
    Plus,
    RotateCcw,
    Send,
    Sparkles,
} from 'lucide-react';

interface Props {
    project: any;
    livingProposal: any;
    isLeader: boolean;
    isMember: boolean;
    isLecturer: boolean;
}

export default function LivingProposalTab({
    project,
    livingProposal,
    isLeader,
    isMember,
    isLecturer,
}: Props) {
    const currentVersion = livingProposal?.current_version;
    const [isEditing, setIsEditing] = useState(false);
    const [showReviseModal, setShowReviseModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form inputs for editing
    const [title, setTitle] = useState(currentVersion?.title || project.title || '');
    const [abstract, setAbstract] = useState(currentVersion?.abstract || project.short_description || '');
    const [problemStatement, setProblemStatement] = useState(currentVersion?.problem_statement || project.problem_statement || '');
    const [objectives, setObjectives] = useState(currentVersion?.objectives || project.objectives || '');
    const [targetUsers, setTargetUsers] = useState(currentVersion?.target_users || 'Mahasiswa dan Civitas Akademika');
    const [proposedSolution, setProposedSolution] = useState(currentVersion?.proposed_solution || project.proposed_solution || '');
    const [needsAnalysis, setNeedsAnalysis] = useState(currentVersion?.needs_analysis || '');
    const [systemArchitecture, setSystemArchitecture] = useState(currentVersion?.system_architecture || '');
    const [methodology, setMethodology] = useState(currentVersion?.methodology || '');
    const [timelinePlan, setTimelinePlan] = useState(currentVersion?.timeline_plan || '');
    const [budgetEstimate, setBudgetEstimate] = useState(currentVersion?.budget_estimate || '');
    const [techStackInput, setTechStackInput] = useState(
        Array.isArray(currentVersion?.tech_stack) ? currentVersion.tech_stack.join(', ') : ''
    );
    const [changeSummary, setChangeSummary] = useState('');

    // Lecturer review state
    const [reviewDecision, setReviewDecision] = useState<'approved' | 'revision_requested'>('approved');
    const [reviewNotes, setReviewNotes] = useState('');

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const handleSaveDraft = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/projects/${project.id}/proposal/draft`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    title,
                    abstract,
                    problem_statement: problemStatement,
                    objectives,
                    target_users: targetUsers,
                    proposed_solution: proposedSolution,
                    needs_analysis: needsAnalysis,
                    system_architecture: systemArchitecture,
                    methodology,
                    timeline_plan: timelinePlan,
                    budget_estimate: budgetEstimate,
                    tech_stack: techStackInput.split(',').map((s) => s.trim()).filter(Boolean),
                    change_summary: changeSummary,
                }),
            });
            if (res.ok) {
                alert('Draft living proposal berhasil disimpan!');
                setIsEditing(false);
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal menyimpan draft.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitForReview = async () => {
        if (!confirm('Ajukan versi proposal ini kepada Dosen Pembimbing untuk ditinjau?')) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/projects/${project.id}/proposal/submit`, {
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
                alert('Proposal berhasil diajukan untuk ditinjau oleh Dosen Pembimbing!');
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal mengajukan proposal.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateRevision = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`/projects/${project.id}/proposal/revise`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({ change_summary: changeSummary }),
            });
            if (res.ok) {
                alert('Revisi proposal baru berhasil dibuat! Versi sebelumnya telah diarsipkan secara permanen.');
                setShowReviseModal(false);
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal membuat revisi proposal.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLecturerReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentVersion?.id) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/projects/${project.id}/proposal/${currentVersion.id}/review`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    decision: reviewDecision,
                    review_notes: reviewNotes,
                }),
            });
            if (res.ok) {
                alert('Hasil review living proposal berhasil disimpan dan dikirim ke tim!');
                setShowReviewModal(false);
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal menyimpan review proposal.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const canEditProposal = (isLeader || isMember) && currentVersion?.status !== 'submitted';

    return (
        <div className="flex flex-col gap-6">
            {/* Header Card */}
            <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-600 text-white">
                            Versi {currentVersion?.version_number || 1}
                        </span>
                        <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                                currentVersion?.status === 'approved'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : currentVersion?.status === 'submitted'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : currentVersion?.status === 'revision_requested'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                        >
                            {currentVersion?.status || 'Draft'}
                        </span>
                        {currentVersion?.is_locked && (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                Terkunci (Immutable)
                            </span>
                        )}
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                        {currentVersion?.title || project.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Living Proposal — Dokumen perencanaan aktif yang terus disempurnakan seiring perkembangan proyek.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {canEditProposal && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                            <Edit3 className="size-3.5 text-blue-600" />
                            <span>Edit Proposal</span>
                        </button>
                    )}

                    {(isLeader || isMember) && currentVersion?.status === 'draft' && !isEditing && (
                        <button
                            onClick={handleSubmitForReview}
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            <Send className="size-3.5" />
                            <span>Ajukan ke Dosen</span>
                        </button>
                    )}

                    {(isLeader || isMember) && (currentVersion?.status === 'approved' || currentVersion?.status === 'revision_requested') && (
                        <button
                            onClick={() => setShowReviseModal(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            <span>Buat Revisi Baru (v{(currentVersion?.version_number || 1) + 1})</span>
                        </button>
                    )}

                    {isLecturer && currentVersion?.status === 'submitted' && (
                        <button
                            onClick={() => setShowReviewModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                            <GraduationCap className="size-3.5 text-amber-400" />
                            <span>Tinjau & Beri Keputusan</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Lecturer Review Notes Banner (if any) */}
            {currentVersion?.review_notes && (
                <div className="glass-card rounded-2xl p-5 bg-blue-50/50 border-blue-200/80">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="size-4 text-blue-700" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                                Catatan Evaluasi Dosen Pembimbing
                            </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                            Oleh: {currentVersion.reviewer?.name || 'Dosen Pembimbing'}
                        </span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                        {currentVersion.review_notes}
                    </p>
                </div>
            )}

            {/* Editing Form OR Clean Display */}
            {isEditing ? (
                <form onSubmit={handleSaveDraft} className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <Edit3 className="size-4 text-blue-600" />
                            <span>Edit Living Proposal (Versi {currentVersion?.version_number || 1})</span>
                        </h3>
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                            Batal
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Judul Proyek</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Abstrak / Ringkasan Eksekutif</label>
                        <textarea
                            value={abstract}
                            onChange={(e) => setAbstract(e.target.value)}
                            rows={3}
                            className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Identifikasi & Rumusan Masalah</label>
                            <textarea
                                value={problemStatement}
                                onChange={(e) => setProblemStatement(e.target.value)}
                                rows={4}
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Tujuan & Manfaat Proyek</label>
                            <textarea
                                value={objectives}
                                onChange={(e) => setObjectives(e.target.value)}
                                rows={4}
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Target Pengguna / Sasaran</label>
                            <input
                                type="text"
                                value={targetUsers}
                                onChange={(e) => setTargetUsers(e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Solusi yang Ditawarkan</label>
                            <input
                                type="text"
                                value={proposedSolution}
                                onChange={(e) => setProposedSolution(e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Analisis Kebutuhan (Fungsional & Non-Fungsional)</label>
                        <textarea
                            value={needsAnalysis}
                            onChange={(e) => setNeedsAnalysis(e.target.value)}
                            rows={4}
                            className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Tuliskan daftar kebutuhan fungsional dan non-fungsional sistem..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Rancangan & Arsitektur Sistem (Database, API, Arsitektur)</label>
                        <textarea
                            value={systemArchitecture}
                            onChange={(e) => setSystemArchitecture(e.target.value)}
                            rows={4}
                            className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            placeholder="Deskripsikan arsitektur sistem, skema basis data, dan rancangan API..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Metodologi Pengerjaan</label>
                            <textarea
                                value={methodology}
                                onChange={(e) => setMethodology(e.target.value)}
                                rows={3}
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Contoh: Agile Scrum dengan sprint 2 pekan..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Timeline & Skenario Pengerjaan</label>
                            <textarea
                                value={timelinePlan}
                                onChange={(e) => setTimelinePlan(e.target.value)}
                                rows={3}
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Jadwal pengerjaan pra-UTS, pasca-UTS, dan finalisasi UAS..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Teknologi & Tech Stack (pisahkan koma)</label>
                            <input
                                type="text"
                                value={techStackInput}
                                onChange={(e) => setTechStackInput(e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Laravel, React, PostgreSQL, Tailwind CSS"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Ringkasan Perubahan / Changelog</label>
                            <input
                                type="text"
                                value={changeSummary}
                                onChange={(e) => setChangeSummary(e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="Alasan pembaruan bagian proposal ini..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            <Check className="size-4" />
                            <span>Simpan Draft Proposal</span>
                        </button>
                    </div>
                </form>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {/* Ringkasan & Problem Solution */}
                    <div className="glass-card rounded-2xl p-6 shadow-xs">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                            Ringkasan Eksekutif & Latar Belakang
                        </h3>
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                            {currentVersion?.abstract || project.short_description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card rounded-2xl p-6 shadow-xs">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                Rumusan Masalah
                            </h3>
                            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                                {currentVersion?.problem_statement || 'Belum diisi.'}
                            </p>
                        </div>

                        <div className="glass-card rounded-2xl p-6 shadow-xs">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                Tujuan & Manfaat
                            </h3>
                            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                                {currentVersion?.objectives || 'Belum diisi.'}
                            </p>
                        </div>
                    </div>

                    {/* Analisis Kebutuhan & Arsitektur Sistem */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card rounded-2xl p-6 shadow-xs">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                Analisis Kebutuhan Sistem
                            </h3>
                            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-mono text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                                {currentVersion?.needs_analysis || 'Belum ada rincian kebutuhan.'}
                            </p>
                        </div>

                        <div className="glass-card rounded-2xl p-6 shadow-xs">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                Rancangan & Arsitektur Sistem
                            </h3>
                            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-mono text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                                {currentVersion?.system_architecture || 'Belum ada deskripsi arsitektur.'}
                            </p>
                        </div>
                    </div>

                    {/* Metodologi & Jadwal Pengerjaan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-card rounded-2xl p-6 shadow-xs">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                Metodologi Pengerjaan (SDLC)
                            </h3>
                            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                                {currentVersion?.methodology || 'Belum diisi.'}
                            </p>
                        </div>

                        <div className="glass-card rounded-2xl p-6 shadow-xs">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                Rencana Timeline & Milestones
                            </h3>
                            <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                                {currentVersion?.timeline_plan || 'Belum diisi.'}
                            </p>
                        </div>
                    </div>

                    {/* Tech Stack */}
                    <div className="glass-card rounded-2xl p-6 shadow-xs">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                            Teknologi & Tech Stack
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {Array.isArray(currentVersion?.tech_stack) && currentVersion.tech_stack.length > 0 ? (
                                currentVersion.tech_stack.map((t: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold"
                                    >
                                        {t}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400">Belum ada tech stack tercatat.</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Create Revision */}
            {showReviseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <form onSubmit={handleCreateRevision} className="glass-surface rounded-3xl p-6 max-w-md w-full shadow-xl">
                        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                            <Plus className="size-5 text-blue-600" />
                            <span>Buat Revisi Proposal Versi {(currentVersion?.version_number || 1) + 1}</span>
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            Versi {currentVersion?.version_number} saat ini akan disimpan permanen sebagai riwayat tidak berubah (*immutable snapshot*). Anda akan dapat menyunting versi baru secara bebas.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Alasan & Ringkasan Perubahan (*Changelog*)
                            </label>
                            <textarea
                                value={changeSummary}
                                onChange={(e) => setChangeSummary(e.target.value)}
                                required
                                rows={3}
                                placeholder="Contoh: Pembaruan ruang lingkup pasca-evaluasi UTS dan integrasi API payment gateway..."
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowReviseModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                Lanjutkan Buat Versi {(currentVersion?.version_number || 1) + 1}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal: Lecturer Review */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <form onSubmit={handleLecturerReview} className="glass-surface rounded-3xl p-6 max-w-lg w-full shadow-xl">
                        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                            <GraduationCap className="size-5 text-blue-600" />
                            <span>Review Living Proposal (Versi {currentVersion?.version_number})</span>
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Tinjau kelayakan proposal proyek capstone mahasiswa dan berikan arahan teknis.
                        </p>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Keputusan Bimbingan</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 text-xs font-bold ${
                                    reviewDecision === 'approved' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'
                                }`}>
                                    <input
                                        type="radio"
                                        name="decision"
                                        value="approved"
                                        checked={reviewDecision === 'approved'}
                                        onChange={() => setReviewDecision('approved')}
                                        className="sr-only"
                                    />
                                    <CheckCircle2 className="size-4 text-emerald-600" />
                                    <span>Setujui (Approved)</span>
                                </label>

                                <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 text-xs font-bold ${
                                    reviewDecision === 'revision_requested' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-700'
                                }`}>
                                    <input
                                        type="radio"
                                        name="decision"
                                        value="revision_requested"
                                        checked={reviewDecision === 'revision_requested'}
                                        onChange={() => setReviewDecision('revision_requested')}
                                        className="sr-only"
                                    />
                                    <RotateCcw className="size-4 text-amber-600" />
                                    <span>Minta Revisi</span>
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Catatan Bimbingan & Arahan Dosen
                            </label>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                required
                                rows={4}
                                placeholder="Tuliskan catatan perbaikan arsitektur, ruang lingkup, atau arahan pengembangan..."
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                Simpan & Kirim Evaluasi
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
