import { AlertCircle, CheckCircle2, Link2, Loader2, User, X } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    teamId: number;
    mappingId: number | null;
    contributorName: string;
    contributorLogin?: string;
    contributorEmail?: string;
    currentUserId?: number | null;
    allMembers: { user_id: number; name: string; email: string; role_name?: string }[];
    onMapped: () => void;
}

export default function GitHubMappingModal({
    isOpen,
    onClose,
    teamId,
    mappingId,
    contributorName,
    contributorLogin,
    contributorEmail,
    currentUserId,
    allMembers = [],
    onMapped,
}: Props) {
    const [selectedUserId, setSelectedUserId] = useState<string>(currentUserId ? String(currentUserId) : '');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen || !mappingId) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        setSubmitting(true);

        try {
            const res = await fetch(`/api/v1/workspaces/${teamId}/github/mappings/${mappingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    user_id: selectedUserId ? Number(selectedUserId) : null,
                    notes: notes.trim() || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMsg(data.message || 'Gagal memperbarui pemetaan.');
                setSubmitting(false);
                return;
            }

            setSubmitting(false);
            onMapped();
            onClose();
        } catch (err: any) {
            setErrorMsg(err.message || 'Terjadi kesalahan.');
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Link2 className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Petakan Kontributor GitHub</h3>
                            <p className="text-[11px] text-slate-400">Hubungkan identitas commit ke anggota tim</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="size-7 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1">
                    <div className="font-bold text-slate-800">
                        Kontributor: {contributorName}
                    </div>
                    {contributorLogin && (
                        <div className="text-slate-500 font-mono text-[11px]">
                            Username: @{contributorLogin}
                        </div>
                    )}
                    {contributorEmail && (
                        <div className="text-slate-500 text-[11px]">
                            Email commit: {contributorEmail}
                        </div>
                    )}
                </div>

                {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                        <AlertCircle className="size-4 text-rose-600 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-3.5">
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Pilih Anggota Tim RAKIT
                        </label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium"
                        >
                            <option value="">— Lepaskan Pemetaan (Tidak Terpetakan) —</option>
                            {allMembers.map((m) => (
                                <option key={m.user_id} value={m.user_id}>
                                    {m.name} ({m.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Catatan Pemetaan <span className="text-[10px] text-slate-400 font-normal">(Opsional)</span>
                        </label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Contoh: Akun pribadi alternatif mahasiswa"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="size-3 animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <span>Simpan Pemetaan</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
