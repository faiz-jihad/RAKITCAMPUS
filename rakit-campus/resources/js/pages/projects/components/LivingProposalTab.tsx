import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
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
    Trash2,
    X,
} from 'lucide-react';

interface CustomSection {
    id: string;
    label: string;
    content: string;
}

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
    const [showSubmitModal, setShowSubmitModal] = useState(false);
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
    const [customSections, setCustomSections] = useState<CustomSection[]>(() => {
        if (Array.isArray(currentVersion?.custom_sections)) {
            return currentVersion.custom_sections;
        }
        return [];
    });
    const [changeSummary, setChangeSummary] = useState('');

    useEffect(() => {
        if (Array.isArray(currentVersion?.custom_sections)) {
            setCustomSections(currentVersion.custom_sections);
        }
    }, [currentVersion]);

    const handleAddCustomSection = () => {
        setCustomSections((prev) => [
            ...prev,
            {
                id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                label: '',
                content: '',
            },
        ]);
    };

    const handleUpdateCustomSection = (index: number, field: 'label' | 'content', value: string) => {
        setCustomSections((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    const handleRemoveCustomSection = (index: number) => {
        setCustomSections((prev) => prev.filter((_, i) => i !== index));
    };

    // Lecturer review state
    const [reviewDecision, setReviewDecision] = useState<'approved' | 'revision_requested'>('approved');
    const [reviewNotes, setReviewNotes] = useState('');
    const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => {
                setToastMessage(null);
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

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
                    tech_stack: techStackInput.split(',').map((s: string) => s.trim()).filter(Boolean),
                    custom_sections: customSections.filter((s) => s.label.trim() !== ''),
                    change_summary: changeSummary,
                }),
            });
            if (res.ok) {
                setIsEditing(false);
                setToastMessage({ type: 'success', text: 'Draft living proposal berhasil disimpan!' });
                router.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                setToastMessage({ type: 'error', text: json.message || 'Gagal menyimpan draft.' });
            }
        } catch {
            setToastMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitForReview = () => {
        setShowSubmitModal(true);
    };

    const confirmSubmitForReview = async () => {
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
                setShowSubmitModal(false);
                setToastMessage({ type: 'success', text: 'Living proposal berhasil diajukan untuk ditinjau oleh Dosen Pembimbing!' });
                router.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                setToastMessage({ type: 'error', text: json.message || 'Gagal mengajukan proposal.' });
            }
        } catch {
            setToastMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
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
                setShowReviseModal(false);
                setToastMessage({ type: 'success', text: 'Revisi proposal baru berhasil dibuat!' });
                router.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                setToastMessage({ type: 'error', text: json.message || 'Gagal membuat revisi proposal.' });
            }
        } catch {
            setToastMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
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
                setShowReviewModal(false);
                setToastMessage({ type: 'success', text: 'Hasil review living proposal berhasil disimpan dan dikirim ke tim!' });
                router.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                setToastMessage({ type: 'error', text: json.message || 'Gagal menyimpan review proposal.' });
            }
        } catch {
            setToastMessage({ type: 'error', text: 'Terjadi kesalahan jaringan.' });
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
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold uppercase px-3 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                            Versi {currentVersion?.version_number || 1}
                        </span>
                        <span
                            className={`text-xs font-bold px-3 py-0.5 rounded-full border uppercase ${
                                currentVersion?.status === 'approved'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : currentVersion?.status === 'submitted'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : currentVersion?.status === 'revision_requested'
                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                        >
                            {currentVersion?.status || 'Draft'}
                        </span>
                        {currentVersion?.is_locked && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                Terkunci (Immutable)
                            </span>
                        )}
                    </div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">
                        {currentVersion?.title || project.title}
                    </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {canEditProposal && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 hover:border-slate-400 text-slate-800 hover:text-slate-900 text-xs font-bold transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer"
                        >
                            <Edit3 className="size-3.5 text-blue-600" />
                            <span>Edit Proposal</span>
                        </button>
                    )}

                    {(isLeader || isMember) && currentVersion?.status === 'draft' && !isEditing && (
                        <button
                            onClick={handleSubmitForReview}
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                        >
                            <Send className="size-3.5" />
                            <span>Ajukan ke Dosen</span>
                        </button>
                    )}

                    {(isLeader || isMember) && (currentVersion?.status === 'approved' || currentVersion?.status === 'revision_requested') && (
                        <button
                            onClick={() => setShowReviseModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer"
                        >
                            <Plus className="size-3.5" />
                            <span>Buat Revisi Baru (v{(currentVersion?.version_number || 1) + 1})</span>
                        </button>
                    )}

                    {isLecturer && currentVersion?.status === 'submitted' && (
                        <button
                            onClick={() => setShowReviewModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold transition-all duration-200 shadow-2xs hover:shadow-md cursor-pointer"
                        >
                            <GraduationCap className="size-3.5 text-blue-400" />
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

                    {/* BAGIAN & FIELD TAMBAHAN (KUSTOM) */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                                    <span>Bagian & Field Tambahan (Kustom)</span>
                                    {customSections.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                            {customSections.length} Bagian
                                        </span>
                                    )}
                                </h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Tambahkan field berlabel baru sesuai kebutuhan proposal (contoh: Rencana Anggaran / RAB, Analisis Risiko, Mitra Kerjasama, dll).
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddCustomSection}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100/80 active:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold transition shadow-2xs self-start cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                <span>Tambah Label / Field Baru</span>
                            </button>
                        </div>

                        {customSections.length > 0 ? (
                            <div className="flex flex-col gap-3.5 mt-1">
                                {customSections.map((sec, idx) => (
                                    <div
                                        key={sec.id || idx}
                                        className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex flex-col gap-2.5 relative group/sec"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex-1">
                                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                    Label / Nama Bagian #{idx + 1}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={sec.label}
                                                    onChange={(e) => handleUpdateCustomSection(idx, 'label', e.target.value)}
                                                    placeholder="Contoh: Rencana Anggaran Biaya (RAB), Analisis Risiko, Mitra..."
                                                    className="w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-900"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveCustomSection(idx)}
                                                title="Hapus field ini"
                                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer self-end mb-0.5"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                                Isi / Deskripsi Bagian
                                            </label>
                                            <textarea
                                                value={sec.content}
                                                onChange={(e) => handleUpdateCustomSection(idx, 'content', e.target.value)}
                                                rows={3}
                                                placeholder="Tuliskan rincian atau keterangan bagian ini..."
                                                className="w-full text-xs rounded-lg border border-slate-200 bg-white p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                                Belum ada field tambahan. Klik tombol <strong className="text-slate-600">Tambah Label / Field Baru</strong> di atas untuk membuat bagian kustom.
                            </div>
                        )}
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

                    {/* Bagian & Field Tambahan (Kustom) */}
                    {Array.isArray(currentVersion?.custom_sections) && currentVersion.custom_sections.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentVersion.custom_sections.map((sec: any, idx: number) => (
                                <div key={sec.id || idx} className="glass-card rounded-2xl p-6 shadow-xs">
                                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                                        {sec.label}
                                    </h3>
                                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                                        {sec.content || 'Belum diisi.'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <form onSubmit={handleLecturerReview} className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setShowReviewModal(false)}
                            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        {/* Modal Header without description */}
                        <div className="flex items-center gap-3.5 mb-6">
                            <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
                                <GraduationCap className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Review Living Proposal (Versi {currentVersion?.version_number})
                                </h3>
                            </div>
                        </div>

                        {/* Decision Selector */}
                        <div className="mb-5">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
                                Keputusan Bimbingan
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-2.5 text-xs font-bold ${
                                    reviewDecision === 'approved'
                                        ? 'bg-blue-50/70 border-blue-600 text-blue-900 shadow-2xs'
                                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}>
                                    <input
                                        type="radio"
                                        name="decision"
                                        value="approved"
                                        checked={reviewDecision === 'approved'}
                                        onChange={() => setReviewDecision('approved')}
                                        className="sr-only"
                                    />
                                    <CheckCircle2 className={`size-4.5 shrink-0 ${reviewDecision === 'approved' ? 'text-blue-600' : 'text-slate-400'}`} />
                                    <span>Setujui (Approved)</span>
                                </label>

                                <label className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-2.5 text-xs font-bold ${
                                    reviewDecision === 'revision_requested'
                                        ? 'bg-slate-100 border-slate-900 text-slate-900 shadow-2xs'
                                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                                }`}>
                                    <input
                                        type="radio"
                                        name="decision"
                                        value="revision_requested"
                                        checked={reviewDecision === 'revision_requested'}
                                        onChange={() => setReviewDecision('revision_requested')}
                                        className="sr-only"
                                    />
                                    <RotateCcw className={`size-4.5 shrink-0 ${reviewDecision === 'revision_requested' ? 'text-slate-900' : 'text-slate-400'}`} />
                                    <span>Minta Revisi</span>
                                </label>
                            </div>
                        </div>

                        {/* Notes Textarea */}
                        <div className="mb-6">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                Catatan Bimbingan & Arahan Dosen
                            </label>
                            <textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                required
                                rows={4}
                                placeholder="Tuliskan catatan perbaikan arsitektur, ruang lingkup, atau arahan pengembangan..."
                                className="w-full text-xs rounded-2xl border border-slate-200 p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-slate-50/50 hover:bg-white focus:bg-white text-slate-800 transition placeholder:text-slate-400 resize-none leading-relaxed"
                            />
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowReviewModal(false)}
                                disabled={submitting}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <CheckCircle2 className="size-3.5" />
                                <span>{submitting ? 'Menyimpan...' : 'Simpan & Kirim Evaluasi'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {/* Modal Konfirmasi Ajukan Proposal ke Dosen */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
                        <button
                            type="button"
                            onClick={() => setShowSubmitModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="flex items-center gap-3.5 mb-4">
                            <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0">
                                <Send className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Ajukan Living Proposal
                                </h3>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowSubmitModal(false)}
                                disabled={submitting}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirmSubmitForReview}
                                disabled={submitting}
                                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                                <Send className="size-3.5" />
                                <span>{submitting ? 'Mengajukan...' : 'Ya, Ajukan Sekarang'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Non-blocking Toast Notification (Menggantikan Alert Native Pop-up) */}
            {toastMessage && (
                <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div
                        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
                            toastMessage.type === 'success'
                                ? 'bg-slate-900/95 text-white border-slate-700/80'
                                : 'bg-rose-500/95 text-white border-rose-600'
                        }`}
                    >
                        {toastMessage.type === 'success' ? (
                            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                        ) : (
                            <AlertCircle className="size-4 text-white shrink-0" />
                        )}
                        <span>{toastMessage.text}</span>
                        <button
                            type="button"
                            onClick={() => setToastMessage(null)}
                            className="ml-2 p-1 rounded-md text-slate-400 hover:text-white transition cursor-pointer"
                        >
                            <X className="size-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
