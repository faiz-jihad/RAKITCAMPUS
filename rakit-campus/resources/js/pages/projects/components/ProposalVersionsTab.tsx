import { useState } from 'react';
import { GitBranch, GitCompare, Lock, CheckCircle2, RotateCcw, Clock, User, FileText } from 'lucide-react';
import CompareVersionsModal from './CompareVersionsModal';

interface Props {
    project: any;
    livingProposal: any;
}

export default function ProposalVersionsTab({ project, livingProposal }: Props) {
    const [showCompareModal, setShowCompareModal] = useState(false);
    const versions = livingProposal?.versions || [];

    return (
        <div className="flex flex-col gap-6">
            <div className="glass-card rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <GitBranch className="size-5 text-blue-600" />
                        <span>Riwayat Versi Living Proposal (*Immutable History*)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Setiap revisi tersimpan permanen dan tidak dapat diubah kembali. Anda dapat meninjau evolusi dokumen atau membandingkan perbedaan.
                    </p>
                </div>

                {versions.length > 1 && (
                    <button
                        onClick={() => setShowCompareModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
                    >
                        <GitCompare className="size-4" />
                        <span>Bandingkan Antar Versi</span>
                    </button>
                )}
            </div>

            {/* Versions Timeline List */}
            <div className="flex flex-col gap-4">
                {versions.map((v: any) => (
                    <div
                        key={v.id}
                        className="glass-card rounded-2xl p-5 shadow-xs flex flex-col gap-3 relative overflow-hidden"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <span className="text-xs font-black px-2.5 py-1 rounded-lg bg-blue-600 text-white">
                                    Versi {v.version_number}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900">
                                    {v.title}
                                </h4>
                                {v.is_locked ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                        <Lock className="size-3 text-slate-400" />
                                        <span>Terkunci</span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <span>Versi Aktif</span>
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                                        v.status === 'approved'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : v.status === 'submitted'
                                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                                            : v.status === 'revision_requested'
                                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                                            : 'bg-slate-100 text-slate-700 border-slate-200'
                                    }`}
                                >
                                    {v.status}
                                </span>
                                <span className="text-slate-400 text-[11px]">
                                    {v.created_at ? new Date(v.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                        </div>

                        {/* Changelog Summary */}
                        {v.change_summary && (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                                <span className="text-[10px] font-black uppercase text-slate-400 block mb-0.5">
                                    Ringkasan Perubahan (*Changelog*):
                                </span>
                                <p className="text-slate-700 font-medium italic">
                                    "{v.change_summary}"
                                </p>
                            </div>
                        )}

                        {/* Reviewer Notes if any */}
                        {v.review_notes && (
                            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200/70 text-xs">
                                <span className="text-[10px] font-black uppercase text-blue-800 block mb-0.5">
                                    Catatan Dosen Pembimbing ({v.reviewer?.name || 'Dosen'}):
                                </span>
                                <p className="text-blue-950 font-medium">
                                    {v.review_notes}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>Disusun oleh: <strong className="text-slate-700">{v.creator?.name || 'Tim Mahasiswa'}</strong></span>
                            {v.tech_stack && Array.isArray(v.tech_stack) && (
                                <span>Tech Stack: {v.tech_stack.join(', ')}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Compare */}
            {showCompareModal && (
                <CompareVersionsModal
                    projectId={project.id}
                    versions={versions}
                    onClose={() => setShowCompareModal(false)}
                />
            )}
        </div>
    );
}
