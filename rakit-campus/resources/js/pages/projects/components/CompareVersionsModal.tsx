import { useState, useEffect } from 'react';
import { GitCompare, X, Check, ArrowRight } from 'lucide-react';

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
            <div className="glass-surface rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <GitCompare className="size-5 text-blue-600" />
                            <span>Bandingkan Riwayat Versi Proposal (*Version Comparison*)</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Lihat perubahan komparatif antar versi proposal yang telah diajukan secara transparan.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Version Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200/80">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Versi Acuan (Basis)</label>
                        <select
                            value={versionAId}
                            onChange={(e) => setVersionAId(Number(e.target.value))}
                            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {versions.map((v) => (
                                <option key={v.id} value={v.id}>
                                    Versi {v.version_number} — ({v.created_at ? new Date(v.created_at).toLocaleDateString() : ''}) [{v.status}]
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Versi Pembanding</label>
                        <select
                            value={versionBId}
                            onChange={(e) => setVersionBId(Number(e.target.value))}
                            className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {versions.map((v) => (
                                <option key={v.id} value={v.id}>
                                    Versi {v.version_number} — ({v.created_at ? new Date(v.created_at).toLocaleDateString() : ''}) [{v.status}]
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Diff Output */}
                <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-5 pr-1">
                    {loading ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                            Memuat komparasi versi...
                        </div>
                    ) : diffData ? (
                        <>
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-bold text-slate-600">
                                    Total Bagian Berubah: <strong className="text-blue-600">{diffData.total_changes} bagian</strong>
                                </span>
                            </div>

                            {Object.entries(diffData.diffs || {}).map(([key, item]: [string, any]) => (
                                <div
                                    key={key}
                                    className={`p-4 rounded-2xl border transition ${
                                        item.is_changed
                                            ? 'bg-amber-50/40 border-amber-200'
                                            : 'bg-white/60 border-slate-200/80'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-slate-900">
                                            {item.label}
                                        </h4>
                                        {item.is_changed ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                                Ada Perubahan
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium text-slate-400">
                                                Sama / Tidak Berubah
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                                            <span className="text-[10px] font-bold text-slate-400 block mb-1">
                                                Versi {diffData.version_a?.version_number}
                                            </span>
                                            <p className="text-slate-700 whitespace-pre-line text-[11px] leading-relaxed">
                                                {item.version_a || '— (Kosong)'}
                                            </p>
                                        </div>

                                        <div className={`p-3 rounded-xl border ${item.is_changed ? 'bg-blue-50/60 border-blue-200 text-blue-950' : 'bg-slate-50 border-slate-200/60 text-slate-700'}`}>
                                            <span className="text-[10px] font-bold text-slate-400 block mb-1">
                                                Versi {diffData.version_b?.version_number}
                                            </span>
                                            <p className="whitespace-pre-line text-[11px] leading-relaxed">
                                                {item.version_b || '— (Kosong)'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : null}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-200/80">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                        Tutup Komparasi
                    </button>
                </div>
            </div>
        </div>
    );
}
