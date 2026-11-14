import { AlertCircle, CheckCircle2, Github, Loader2, X } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    teamId: number;
    onConnected: () => void;
}

export default function GitHubConnectModal({ isOpen, onClose, teamId, onConnected }: Props) {
    const [repoUrl, setRepoUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setLoading(true);

        try {
            const res = await fetch(`/api/v1/workspaces/${teamId}/github/repository`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    repository_url: repoUrl.trim(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                const firstError = data.errors?.repository_url?.[0] || data.message || 'Gagal menghubungkan repositori.';
                setErrorMsg(firstError);
                setLoading(false);
                return;
            }

            setLoading(false);
            onConnected();
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || 'Terjadi kesalahan jaringan.');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                            <Github className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Hubungkan Repositori GitHub
                            </h2>
                            <p className="text-xs text-slate-500">
                                Monitoring kontribusi kode tim secara otomatis
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="size-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Info Card */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/60 text-xs text-slate-700 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-blue-900 text-[11px] uppercase tracking-wider">
                        <CheckCircle2 className="size-3.5 text-blue-600" />
                        <span>Cukup 1 Repositori untuk Seluruh Tim</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                        Cukup masukkan URL repositori proyek tim. Seluruh riwayat branch, commit, dan pull request akan dianalisis otomatis tanpa mengharuskan setiap anggota menghubungkan akun secara individual.
                    </p>
                </div>

                {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                        <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{errorMsg}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1.5">
                            URL Repositori GitHub <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/organisasi/nama-repo"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition"
                            />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                            Format yang didukung: <code>https://github.com/owner/repo</code> atau <code>owner/repo</code>
                        </span>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !repoUrl.trim()}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Menghubungkan & Memeriksa...</span>
                                </>
                            ) : (
                                <span>Hubungkan Repositori</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
