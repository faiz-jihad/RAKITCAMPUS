import { router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Briefcase,
    CheckCircle2,
    Compass,
    Layers,
    Plus,
    Send,
    Sparkles,
    Trophy,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

export interface CompetitionOption {
    id: number;
    name: string;
    slug?: string;
    organizer?: string;
    category?: string;
    max_team_size?: number;
    category_tracks?: string[] | string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    competitions: CompetitionOption[];
    preselectedCompId?: number | null;
}

const COMMON_ROLE_SUGGESTIONS = [
    'UI/UX Designer',
    'Frontend Developer',
    'Backend Developer',
    'AI / ML Engineer',
    'Pitch Deck Specialist',
    'Hustler / Lead',
];

export default function CreateCompetitionTeamModal({
    isOpen,
    onClose,
    competitions,
    preselectedCompId = null,
}: Props) {
    const { auth } = usePage<any>().props;
    const currentUser = auth?.user;

    const initialCompId = preselectedCompId || (competitions.length > 0 ? competitions[0].id : null);
    const [selectedCompId, setSelectedCompId] = useState<number | null>(initialCompId);
    const [teamName, setTeamName] = useState(currentUser?.name ? `Tim ${currentUser.name}` : '');
    const [categoryTrack, setCategoryTrack] = useState('');
    const [description, setDescription] = useState('');
    const [rolesNeeded, setRolesNeeded] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const selectedComp = competitions.find((c) => c.id === Number(selectedCompId)) || competitions[0] || null;

    const handleAddRolePill = (role: string) => {
        const current = rolesNeeded
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean);

        if (!current.includes(role)) {
            const updated = [...current, role].join(', ');
            setRolesNeeded(updated);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!currentUser) {
            router.visit('/login');
            return;
        }

        if (!selectedCompId) {
            setErrorMsg('Silakan pilih kompetisi yang ingin diikuti.');
            return;
        }

        if (!teamName.trim()) {
            setErrorMsg('Silakan masukkan nama tim kompetisi Anda.');
            return;
        }

        setLoading(true);

        router.post(
            route('competitions.participate', selectedCompId),
            {
                team_name: teamName.trim(),
                category_track: categoryTrack.trim() || null,
                description: description.trim() || null,
                roles_needed: rolesNeeded.trim() || null,
                initial_status: 'planning',
                redirect_to: 'workspace',
            },
            {
                onSuccess: () => {
                    setLoading(false);
                    onClose();
                },
                onError: (errors) => {
                    setLoading(false);
                    const firstErr = Object.values(errors)[0];
                    setErrorMsg(typeof firstErr === 'string' ? firstErr : 'Gagal membuat tim. Silakan periksa formulir.');
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative my-8 animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                Bentuk Tim Kompetisi Baru
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Mulai kolaborasi tim, rekrut rekan sekelompok, dan kelola persiapan di Workspace.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {errorMsg && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                        <AlertCircle className="size-4 text-rose-600 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Target Competition Selector */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                            <Trophy className="size-3.5 text-blue-600" />
                            <span>Pilih Kompetisi Target</span>
                            <span className="text-rose-500">*</span>
                        </label>
                        {competitions.length > 0 ? (
                            <select
                                value={selectedCompId || ''}
                                onChange={(e) => setSelectedCompId(Number(e.target.value))}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                            >
                                {competitions.map((comp) => (
                                    <option key={comp.id} value={comp.id}>
                                        {comp.name} {comp.organizer ? `(${comp.organizer})` : ''}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800 rounded-xl">
                                Belum ada daftar kompetisi terbuka yang dapat dipilih.
                            </div>
                        )}
                        {selectedComp && (
                            <p className="text-[11px] text-slate-500 mt-1">
                                Kategori: <strong className="text-slate-700 capitalize">{selectedComp.category?.replace('_', ' ') || 'Umum'}</strong>
                                {selectedComp.max_team_size && ` • Maksimal ${selectedComp.max_team_size} anggota per tim`}
                            </p>
                        )}
                    </div>

                    {/* Nama Tim */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1.5">
                            Nama Tim Kompetisi <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Tim Inovasi Cemerlang"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Kategori / Jalur Khusus */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1.5">
                            Kategori / Jalur Lomba <span className="text-slate-400 font-normal">(Opsional)</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Web Development, UI/UX Design, Competitive Programming"
                            value={categoryTrack}
                            onChange={(e) => setCategoryTrack(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Peran yang Dicari */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1.5">
                            <span className="flex items-center gap-1.5">
                                <Briefcase className="size-3.5 text-blue-600" />
                                <span>Peran Lowongan Rekan Tim</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: UI/UX Designer, Frontend Dev, Backend Dev (pisahkan dengan koma)"
                            value={rolesNeeded}
                            onChange={(e) => setRolesNeeded(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        {/* Suggestion Chips */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="text-[10px] text-slate-400 font-medium">Saran cepat:</span>
                            {COMMON_ROLE_SUGGESTIONS.map((role, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleAddRolePill(role)}
                                    className="px-2 py-0.5 rounded-md bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-[10px] font-semibold text-slate-600 hover:text-blue-700 transition cursor-pointer"
                                >
                                    + {role}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10.5px] text-slate-400 mt-1.5">
                            Peran ini akan langsung ditampilkan di tab <strong>Cari Tim</strong> agar mahasiswa lain dapat mengajukan diri.
                        </p>
                    </div>

                    {/* Deskripsi Tim */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1.5">
                            Deskripsi Singkat Tim & Sasaran Inovasi <span className="text-slate-400 font-normal">(Opsional)</span>
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Jelaskan fokus ide atau solusi yang ingin dirancang bersama tim..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedCompId}
                            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            <Plus className="size-4" />
                            <span>{loading ? 'Membentuk Tim...' : 'Bentuk Tim & Buka Workspace'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
