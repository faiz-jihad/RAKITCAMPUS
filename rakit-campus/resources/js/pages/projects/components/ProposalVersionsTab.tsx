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
                </div>

                {versions.length > 1 && (
                    <button
                        onClick={() => setShowCompareModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer shrink-0"
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
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs shrink-0">
                                    Versi {v.version_number}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900">
                                    {v.title}
                                </h4>
                                <span className="text-slate-300 font-sans mx-0.5">|</span>
                                {v.is_locked ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                                        <Lock className="size-3 text-slate-400" />
                                        <span>Terkunci</span>
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-blue-600">
                                        Versi Aktif
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                                    {v.status}
                                </span>
                                <span className="text-slate-300 font-sans mx-0.5">|</span>
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
