import { useState } from 'react';
import {
    AlertCircle,
    Award,
    Check,
    CheckCircle2,
    Clock,
    Download,
    ExternalLink,
    FileText,
    FolderKanban,
    GraduationCap,
    Lock,
    RotateCcw,
    Send,
    ShieldCheck,
    Sparkles,
    Upload,
} from 'lucide-react';

interface Props {
    project: any;
    period: any;
    submission?: any;
    isMember: boolean;
    isLeader: boolean;
    isLecturer: boolean;
    type: 'uts' | 'uas';
}

export default function AssessmentTab({
    project,
    period,
    submission,
    isMember,
    isLeader,
    isLecturer,
    type,
}: Props) {
    const isUas = type === 'uas';
    const rubrics = period?.rubrics || [];
    const latestSnapshot = submission?.snapshots?.[0] || submission?.latest_snapshot;

    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Student submission form inputs
    const [repoUrl, setRepoUrl] = useState(submission?.repository_url || project.repository_url || '');
    const [demoUrl, setDemoUrl] = useState(submission?.demo_url || project.demo_url || '');
    const [notes, setNotes] = useState(submission?.submission_notes || '');
    const [challenges, setChallenges] = useState(submission?.challenges_and_solutions || '');
    const [nextSteps, setNextSteps] = useState(submission?.next_steps || '');
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [pptFile, setPptFile] = useState<File | null>(null);
    const [supportingFile, setSupportingFile] = useState<File | null>(null);

    // Lecturer rubric review form inputs
    const [rubricScores, setRubricScores] = useState<Record<number, number>>(() => {
        const initial: Record<number, number> = {};
        rubrics.forEach((r: any) => {
            initial[r.id] = 85;
        });
        return initial;
    });
    const [feedback, setFeedback] = useState(submission?.reviews?.[0]?.feedback || '');
    const [revisionNotes, setRevisionNotes] = useState(submission?.reviews?.[0]?.revision_notes || '');
    const [decision, setDecision] = useState<'accepted' | 'revision_required'>('accepted');
    const [completeProject, setCompleteProject] = useState(true);

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    // Calculate real-time estimated weighted grade in modal
    const calculateEstimatedScore = () => {
        let total = 0;
        let totalWeight = 0;
        rubrics.forEach((r: any) => {
            const pts = rubricScores[r.id] || 0;
            const w = r.weight || 25;
            total += pts * (w / 100);
            totalWeight += w;
        });
        if (totalWeight > 0 && totalWeight !== 100) {
            total = (total / totalWeight) * 100;
        }
        return Math.round(total * 10) / 10;
    };

    const estimatedScore = calculateEstimatedScore();
    const estimatedGrade =
        estimatedScore >= 85 ? 'A' :
        estimatedScore >= 78 ? 'AB' :
        estimatedScore >= 70 ? 'B' :
        estimatedScore >= 63 ? 'BC' :
        estimatedScore >= 55 ? 'C' : 'D';

    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const formData = new FormData();
        formData.append('repository_url', repoUrl);
        formData.append('demo_url', demoUrl);
        formData.append('submission_notes', notes);
        formData.append('challenges_and_solutions', challenges);
        formData.append('next_steps', nextSteps);

        if (reportFile) formData.append('report_pdf', reportFile);
        if (pptFile) formData.append('presentation_ppt', pptFile);
        if (supportingFile) formData.append('supporting_doc', supportingFile);

        try {
            const res = await fetch(`/projects/${project.id}/assessments/${period.id}/submit`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: formData,
            });

            if (res.ok) {
                alert(`Pengumpulan berkas ${period.name} berhasil disimpan bersama snapshot proyek yang tidak berubah!`);
                setShowSubmitModal(false);
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal menyerahkan berkas evaluasi.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLecturerReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submission?.id) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/submissions/${submission.id}/review`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    rubric_scores: rubricScores,
                    feedback,
                    revision_notes: revisionNotes,
                    decision,
                    complete_project: isUas ? completeProject : false,
                }),
            });

            if (res.ok) {
                alert(`Evaluasi penilaian berhasil disimpan!`);
                setShowReviewModal(false);
                window.location.reload();
            } else {
                const json = await res.json().catch(() => ({}));
                alert(json.message || 'Gagal menyimpan evaluasi rubrik.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const isSubmitted = submission && submission.status !== 'not_started' && submission.status !== 'draft';
    const isGraded = submission && (submission.status === 'accepted' || submission.status === 'revision_required');

    return (
        <div className="flex flex-col gap-6">
            {/* Header Assessment Card */}
            <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-600 text-white">
                            {period?.name || (isUas ? 'Evaluasi Akhir Semester (UAS)' : 'Evaluasi Tengah Semester (UTS)')}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                            Bobot: {period?.weight || (isUas ? 60 : 40)}%
                        </span>
                        <span
                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                                submission?.status === 'accepted'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : submission?.status === 'submitted'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : submission?.status === 'revision_required'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                        >
                            {submission?.status || 'Belum Dikumpulkan'}
                        </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                        {period?.description || (isUas ? 'Penilaian Capstone Akhir & Verifikasi Portofolio Proyek' : 'Evaluasi Progres Tengah Semester & Living Proposal Snapshot')}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Batas Pengumpulan: {period?.deadline ? new Date(period.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Sesuai Jadwal Akademik'}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {(isMember || isLeader) && (
                        <button
                            onClick={() => setShowSubmitModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                            <Upload className="size-4" />
                            <span>{isSubmitted ? `Pembaruan / Resubmit ${type.toUpperCase()}` : `Kumpulkan Berkas ${type.toUpperCase()}`}</span>
                        </button>
                    )}

                    {isLecturer && isSubmitted && (
                        <button
                            onClick={() => setShowReviewModal(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                        >
                            <GraduationCap className="size-4 text-amber-400" />
                            <span>Penilaian Rubrik Dosen</span>
                        </button>
                    )}
                </div>
            </div>

            {/* If Graded: Score Summary Card */}
            {submission?.total_score && (
                <div className="glass-card rounded-2xl p-6 bg-emerald-50/40 border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                            Hasil Penilaian Resmi Dosen
                        </span>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black text-emerald-700 tracking-tight">
                                {submission.total_score}
                            </span>
                            <span className="text-xl font-black px-3 py-1 rounded-xl bg-emerald-600 text-white shadow-2xs">
                                Grade: {submission.final_grade}
                            </span>
                        </div>
                        {submission.reviews?.[0]?.feedback && (
                            <p className="text-xs text-slate-700 mt-2 italic">
                                "{submission.reviews[0].feedback}"
                            </p>
                        )}
                    </div>

                    <div className="text-right text-xs text-slate-500">
                        <span>Dievaluasi oleh: <strong className="text-slate-800">{submission.evaluator?.name || 'Dosen Pembimbing'}</strong></span>
                        <span className="block mt-0.5">{submission.evaluated_at ? new Date(submission.evaluated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                    </div>
                </div>
            )}

            {/* IMMUTABLE SNAPSHOT INSPECTOR (If Submitted) */}
            {latestSnapshot ? (
                <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col gap-4 border-blue-200/80">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Lock className="size-4 text-blue-600" />
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                Snapshot Terkunci (*Immutable Historical State*)
                            </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                            Versi Pengumpulan #{latestSnapshot.version_number} — {new Date(latestSnapshot.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    {/* Snapshot Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Progres Proyek Saat Dikumpulkan
                            </span>
                            <span className="text-2xl font-black text-blue-600 mt-1 block">
                                {latestSnapshot.progress_percentage}%
                            </span>
                            <span className="text-[10px] text-slate-500">
                                Terkunci dan tidak terpengaruh pengerjaan lanjutan.
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Living Proposal Saat Dikumpulkan
                            </span>
                            <span className="text-xs font-bold text-slate-800 mt-1 block truncate">
                                {latestSnapshot.proposal_snapshot_data?.title || project.title}
                            </span>
                            <span className="text-[10px] text-slate-500">
                                Versi #{latestSnapshot.proposal_version_id || '1'} (Snapshot Beku)
                            </span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Status Tugas Saat Dikumpulkan
                            </span>
                            <span className="text-xs font-bold text-emerald-700 mt-1 block">
                                Selesai: {latestSnapshot.tasks_summary?.completed || 0} / Total: {latestSnapshot.tasks_summary?.total || 0} Tugas
                            </span>
                            <span className="text-[10px] text-slate-500">
                                To-Do: {latestSnapshot.tasks_summary?.todo || 0} | In-Progress: {latestSnapshot.tasks_summary?.in_progress || 0}
                            </span>
                        </div>
                    </div>

                    {/* Deliverables URLs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        {submission.repository_url && (
                            <a
                                href={submission.repository_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-800 flex items-center justify-between transition group"
                            >
                                <span className="truncate">Repository: {submission.repository_url}</span>
                                <ExternalLink className="size-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                            </a>
                        )}

                        {submission.demo_url && (
                            <a
                                href={submission.demo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-800 flex items-center justify-between transition group"
                            >
                                <span className="truncate">Live Demo: {submission.demo_url}</span>
                                <ExternalLink className="size-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                            </a>
                        )}
                    </div>

                    {/* Submission Notes & Challenges */}
                    {latestSnapshot.notes && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                                Catatan Pengumpulan:
                            </span>
                            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                                {latestSnapshot.notes}
                            </p>
                        </div>
                    )}

                    {submission.challenges_and_solutions && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                                Kendala & Solusi yang Diterapkan:
                            </span>
                            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                                {submission.challenges_and_solutions}
                            </p>
                        </div>
                    )}

                    {/* Uploaded Documents List */}
                    {submission.documents && submission.documents.length > 0 && (
                        <div className="pt-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                                Berkas & Dokumen yang Diunggah ({submission.documents.length}):
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {submission.documents.map((doc: any) => (
                                    <a
                                        key={doc.id}
                                        href={`/storage/${doc.file_path}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-xs transition"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <FileText className="size-4 text-blue-600 shrink-0" />
                                            <span className="font-bold text-slate-800 truncate">{doc.title}</span>
                                            <span className="text-[10px] text-slate-400 shrink-0">({Math.round(doc.file_size / 1024)} KB)</span>
                                        </div>
                                        <Download className="size-3.5 text-slate-400" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="glass-card rounded-2xl p-8 text-center text-xs text-slate-500">
                    <p className="mb-2">Kelompok Anda belum mengumpulkan berkas {period?.name || type.toUpperCase()}.</p>
                    <p className="text-slate-400 text-[11px]">
                        Saat dikumpulkan, sistem akan otomatis membekukan *snapshot* proposal dan progres tugas pada detik pengumpulan secara permanen.
                    </p>
                </div>
            )}

            {/* Rubrics Criteria Reference List */}
            <div className="glass-card rounded-2xl p-6 shadow-xs">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                    Kriteria Rubrik Penilaian Dosen ({rubrics.length} Kriteria)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {rubrics.map((r: any) => (
                        <div key={r.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
                            <div className="flex items-center justify-between mb-1">
                                <h5 className="text-xs font-bold text-slate-900">{r.criteria}</h5>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/80">
                                    Bobot: {r.weight}%
                                </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                {r.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal: Student Submission */}
            {showSubmitModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
                    <form onSubmit={handleStudentSubmit} className="glass-surface rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Upload className="size-5 text-blue-600" />
                                <span>Pengumpulan Berkas {period?.name || type.toUpperCase()}</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Menyerahkan tugas akan mengunci *snapshot* proposal versi aktif dan progres pengerjaan saat ini.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Link Repository (GitHub/GitLab)</label>
                            <input
                                type="url"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/..."
                                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Link Live Demo Produk</label>
                            <input
                                type="url"
                                value={demoUrl}
                                onChange={(e) => setDemoUrl(e.target.value)}
                                placeholder="https://aplikasi.polindra.ac.id"
                                className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Pengumpulan & Deskripsi Hasil</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                                placeholder="Jelaskan ringkasan pencapaian fitur dan kelengkapan berkas..."
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Kendala yang Dihadapi & Solusi</label>
                            <textarea
                                value={challenges}
                                onChange={(e) => setChallenges(e.target.value)}
                                rows={2}
                                placeholder="Kendala teknis selama pengerjaan dan solusi penyelesaian..."
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Rencana Pengerjaan Selanjutnya</label>
                            <textarea
                                value={nextSteps}
                                onChange={(e) => setNextSteps(e.target.value)}
                                rows={2}
                                placeholder="Rencana sprint lanjutan..."
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        {/* File Uploads */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Laporan Kemajuan / Akhir (PDF)</label>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Slide Presentasi (PPTX / PDF)</label>
                                <input
                                    type="file"
                                    accept=".ppt,.pptx,.pdf"
                                    onChange={(e) => setPptFile(e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setShowSubmitModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                Kunci Snapshot & Kumpulkan
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Modal: Lecturer Rubric Evaluation */}
            {showReviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
                    <form onSubmit={handleLecturerReview} className="glass-surface rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <GraduationCap className="size-5 text-blue-600" />
                                    <span>Penilaian Rubrik {period?.name || type.toUpperCase()}</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Berikan nilai skor (0-100) per kriteria rubrik terstandar akademik.
                                </p>
                            </div>

                            <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Estimasi Nilai Akhir
                                </span>
                                <span className="text-xl font-black text-blue-600">
                                    {estimatedScore} ({estimatedGrade})
                                </span>
                            </div>
                        </div>

                        {/* Rubrics Form Inputs */}
                        <div className="flex flex-col gap-3">
                            {rubrics.map((r: any) => (
                                <div key={r.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="max-w-md">
                                        <div className="flex items-center gap-2">
                                            <h5 className="text-xs font-bold text-slate-900">{r.criteria}</h5>
                                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded">
                                                Bobot {r.weight}%
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{r.description}</p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <label className="text-xs font-bold text-slate-600">Nilai (0-100):</label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={rubricScores[r.id] ?? 85}
                                            onChange={(e) =>
                                                setRubricScores({
                                                    ...rubricScores,
                                                    [r.id]: Number(e.target.value),
                                                })
                                            }
                                            className="w-20 text-xs font-bold text-center rounded-xl border border-slate-200 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Evaluasi / Ulasan Dosen</label>
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                required
                                rows={3}
                                placeholder="Ulasan kualitas implementasi produk, penguasaan materi, dan penyelesaian masalah..."
                                className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Keputusan Penilaian</label>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 text-xs font-bold ${
                                    decision === 'accepted' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'
                                }`}>
                                    <input
                                        type="radio"
                                        name="dec"
                                        value="accepted"
                                        checked={decision === 'accepted'}
                                        onChange={() => setDecision('accepted')}
                                        className="sr-only"
                                    />
                                    <CheckCircle2 className="size-4 text-emerald-600" />
                                    <span>Lulus / Terima (Accepted)</span>
                                </label>

                                <label className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 text-xs font-bold ${
                                    decision === 'revision_required' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-slate-200 text-slate-700'
                                }`}>
                                    <input
                                        type="radio"
                                        name="dec"
                                        value="revision_required"
                                        checked={decision === 'revision_required'}
                                        onChange={() => setDecision('revision_required')}
                                        className="sr-only"
                                    />
                                    <RotateCcw className="size-4 text-amber-600" />
                                    <span>Perlu Revisi</span>
                                </label>
                            </div>
                        </div>

                        {/* If UAS: Complete Project checkbox */}
                        {isUas && decision === 'accepted' && (
                            <label className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center gap-2.5 text-xs text-blue-900 font-semibold cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={completeProject}
                                    onChange={(e) => setCompleteProject(e.target.checked)}
                                    className="rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span>Nyatakan Proyek Resmi Selesai (Completed), Terbitkan Sertifikat Portofolio, dan Rilis Pembatasan Rule 1 Mahasiswa.</span>
                            </label>
                        )}

                        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
                                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                Simpan Nilai Evaluasi
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
