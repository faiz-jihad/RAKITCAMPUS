import { useState, useEffect } from 'react';
import { GitCompare, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
    projectId: number;
    versions: any[];
    onClose: () => void;
}

export default function CompareVersionsModal({ projectId, versions, onClose }: Props) {
    const [versionAId, setVersionAId] = useState<number>(versions[1]?.id || versions[0]?.id || 0);
    const [versionBId, setVersionBId] = useState<number>(versions[0]?.id || 0);
    const [diffData, setDiffData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const fetchDiff = async (idA: number, idB: number) => {
        if (!idA || !idB) return;
        setLoading(true);
        try {
            const res = await fetch(`/projects/${projectId}/proposal/compare?version_a=${idA}&version_b=${idB}`, {
                headers: { 'Accept': 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                setDiffData(data);
            }
        } catch {
            console.error('Failed to load diff');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiff(versionAId, versionBId);
    }, [versionAId, versionBId]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                            <GitCompare className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900 leading-tight">
                                Bandingkan Riwayat Versi Proposal
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Analisis perbedaan konten dan riwayat revisi antar versi proposal
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Version Selectors Bar */}
                <div className="px-6 py-4 border-b border-slate-100 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/70">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Versi Acuan (Basis)
                            </label>
                            <select
                                value={versionAId}
                                onChange={(e) => setVersionAId(Number(e.target.value))}
                                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
                            >
                                {versions.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        Versi {v.version_number} | {v.created_at ? new Date(v.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} | {v.status?.toUpperCase() || 'DRAFT'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/70">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                                Versi Pembanding
                            </label>
                            <select
                                value={versionBId}
                                onChange={(e) => setVersionBId(Number(e.target.value))}
                                className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
                            >
                                {versions.map((v) => (
                                    <option key={v.id} value={v.id}>
                                        Versi {v.version_number} | {v.created_at ? new Date(v.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} | {v.status?.toUpperCase() || 'DRAFT'}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Summary Row */}
                    {diffData && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-medium">Hasil Perbandingan:</span>
                                {diffData.total_changes === 0 ? (
                                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                                        <span>Identik (Tidak Ada Perubahan)</span>
                                    </span>
                                ) : (
                                    <span className="font-bold text-blue-700 flex items-center gap-1.5">
                                        <AlertCircle className="size-3.5 text-blue-600" />
                                        <span>{diffData.total_changes} Bagian Berbeda</span>
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Diff Output */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {loading ? (
                        <div className="py-16 text-center text-xs text-slate-400">
                            <div className="size-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <span>Memuat komparasi versi...</span>
                        </div>
                    ) : diffData ? (
                        <>
                            {/* Column Header Titles */}
                            <div className="hidden sm:grid sm:grid-cols-2 gap-3 px-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <div>Versi {diffData.version_a?.version_number} (Acuan)</div>
                                <div>Versi {diffData.version_b?.version_number} (Pembanding)</div>
                            </div>

                            {Object.entries(diffData.diffs || {}).map(([key, item]: [string, any]) => (
                                <div
                                    key={key}
                                    className={`rounded-2xl border p-4 transition-all duration-200 ${
                                        item.is_changed
                                            ? 'bg-blue-50/20 border-blue-200 shadow-2xs'
                                            : 'bg-white border-slate-200/80 shadow-2xs'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                                        <h4 className="text-xs font-bold text-slate-900">
                                            {item.label}
                                        </h4>
                                        {item.is_changed ? (
                                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full">
                                                Ada Perubahan
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium text-slate-400">
                                                Sama / Tidak Berubah
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/60">
                                            <span className="sm:hidden text-[10px] font-bold text-slate-400 block mb-1">
                                                Versi {diffData.version_a?.version_number}
                                            </span>
                                            <p className="text-slate-700 whitespace-pre-line text-xs leading-relaxed">
                                                {item.version_a || '— (Kosong)'}
                                            </p>
                                        </div>

                                        <div className={`p-3 rounded-xl border ${
                                            item.is_changed
                                                ? 'bg-blue-50/60 border-blue-200 text-blue-950 font-medium'
                                                : 'bg-slate-50/80 border-slate-200/60 text-slate-700'
                                        }`}>
                                            <span className="sm:hidden text-[10px] font-bold text-slate-400 block mb-1">
                                                Versi {diffData.version_b?.version_number}
                                            </span>
                                            <p className="whitespace-pre-line text-xs leading-relaxed">
                                                {item.version_b || '— (Kosong)'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-2xs active:scale-95 cursor-pointer"
                    >
                        Tutup Komparasi
                    </button>
                </div>
            </div>
        </div>
    );
}
