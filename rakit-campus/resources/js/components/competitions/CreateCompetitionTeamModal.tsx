import { router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Plus,
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

const CATEGORY_OPTIONS = [
    { value: 'technology', label: 'Teknologi & IT' },
    { value: 'programming', label: 'Pemrograman / Competitive Programming' },
    { value: 'ui_ux', label: 'UI/UX & Desain Produk' },
    { value: 'hackathon', label: 'Hackathon' },
    { value: 'business_plan', label: 'Business Plan / Pitching' },
    { value: 'innovation', label: 'Inovasi & Startup' },
    { value: 'research', label: 'Riset & Sains' },
    { value: 'scientific_writing', label: 'Karya Tulis Ilmiah (KTI/PKM)' },
    { value: 'other', label: 'Kategori Lainnya' },
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
    const [mode, setMode] = useState<'existing' | 'new'>(
        competitions.length === 0 ? 'new' : 'existing'
    );

    // Existing comp fields
    const [selectedCompId, setSelectedCompId] = useState<number | null>(initialCompId);

    // New comp fields
    const [newCompName, setNewCompName] = useState('');
    const [newOrganizer, setNewOrganizer] = useState('');
    const [newCategory, setNewCategory] = useState('technology');

    // Shared team fields
    const [teamName, setTeamName] = useState(currentUser?.name ? `Tim ${currentUser.name}` : '');
    const [rolesNeeded, setRolesNeeded] = useState('');
    const [description, setDescription] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen) return null;

    const selectedComp = competitions.find((c) => c.id === Number(selectedCompId)) || competitions[0] || null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!currentUser) {
            router.visit('/login');
            return;
        }

        if (!teamName.trim()) {
            setErrorMsg('Silakan masukkan nama tim kompetisi Anda.');
            return;
        }

        setLoading(true);

        if (mode === 'new') {
            if (!newCompName.trim()) {
                setErrorMsg('Silakan masukkan nama kompetisi.');
                setLoading(false);
                return;
            }
            if (!newOrganizer.trim()) {
                setErrorMsg('Silakan masukkan penyelenggara kompetisi.');
                setLoading(false);
                return;
            }

            router.post(
                route('competitions.store-with-team'),
                {
                    competition_name: newCompName.trim(),
                    organizer: newOrganizer.trim(),
                    category: newCategory,
                    team_name: teamName.trim(),
                    roles_needed: rolesNeeded.trim() || null,
                    description: description.trim() || null,
                    max_team_size: 4,
                },
                {
                    onSuccess: () => {
                        setLoading(false);
                        onClose();
                    },
                    onError: (errors) => {
                        setLoading(false);
                        const firstErr = Object.values(errors)[0];
                        setErrorMsg(typeof firstErr === 'string' ? firstErr : 'Gagal membuat kompetisi dan tim.');
                    },
                }
            );
        } else {
            if (!selectedCompId) {
                setErrorMsg('Silakan pilih kompetisi yang ingin diikuti.');
                setLoading(false);
                return;
            }

            router.post(
                route('competitions.participate', selectedCompId),
                {
                    team_name: teamName.trim(),
                    roles_needed: rolesNeeded.trim() || null,
                    description: description.trim() || null,
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
                        setErrorMsg(typeof firstErr === 'string' ? firstErr : 'Gagal membentuk tim.');
                    },
                }
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative my-6 animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-start justify-between pb-3">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                {mode === 'new' ? 'Daftarkan Lomba & Bentuk Tim' : 'Bentuk Tim Kompetisi'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {mode === 'new'
                                    ? 'Tambah kompetisi baru dan langsung siapkan tim Anda.'
                                    : 'Pilih kompetisi dan mulai kolaborasi persiapan di Workspace.'}
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

                {/* Clean Segmented Mode Switch */}
                <div className="flex bg-slate-100 p-1 rounded-xl mt-4 mb-4">
                    <button
                        type="button"
                        onClick={() => {
                            setMode('existing');
                            setErrorMsg(null);
                        }}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer text-center ${
                            mode === 'existing'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Pilih Lomba Terdaftar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setMode('new');
                            setErrorMsg(null);
                        }}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                            mode === 'new'
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Plus className="size-3.5" />
                        <span>Lomba Belum Ada? Buat Baru</span>
                    </button>
                </div>

                {errorMsg && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                        <AlertCircle className="size-4 text-rose-600 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5">
                    {mode === 'existing' ? (
                        /* MODE EXISTING: SELECT COMPETITION */
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
                                            {comp.name} {comp.organizer ? `— ${comp.organizer}` : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800 rounded-xl">
                                    Belum ada kompetisi terdaftar. Silakan pilih tab <strong>"Lomba Belum Ada? Buat Baru"</strong> di atas.
                                </div>
                            )}
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                                <span>
                                    {selectedComp?.category ? `Kategori: ${selectedComp.category.replace('_', ' ')}` : ''}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setMode('new')}
                                    className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                                >
                                    + Daftarkan lomba lain
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* MODE NEW: PROPOSE NEW COMPETITION */
                        <div className="space-y-3 p-3.5 bg-blue-50/40 rounded-2xl border border-blue-100">
                            <div>
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                    Nama Kompetisi <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Gemastik 2026, Hackathon Arkividia"
                                    value={newCompName}
                                    onChange={(e) => setNewCompName(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-slate-800 block mb-1">
                                        Penyelenggara <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Kemendikbud, HMIF ITB"
                                        value={newOrganizer}
                                        onChange={(e) => setNewOrganizer(e.target.value)}
                                        className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-800 block mb-1">
                                        Kategori Lomba <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={newCategory}
                                        onChange={(e) => setNewCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                    >
                                        {CATEGORY_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SHARED: Nama Tim */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                            Nama Tim Anda <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Tim Inovasi Digital"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                        />
                    </div>

                    {/* SHARED: Peran yang Dicari */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                            <span>Peran yang Dicari</span>
                            <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: UI/UX Designer, Frontend Dev, Backend Dev"
                            value={rolesNeeded}
                            onChange={(e) => setRolesNeeded(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* SHARED: Deskripsi Singkat */}
                    <div>
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                            <span>Fokus / Deskripsi Singkat</span>
                            <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Jelaskan secara singkat ide atau fokus yang ingin dikerjakan..."
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
                            disabled={loading || (mode === 'existing' && !selectedCompId)}
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                            <Plus className="size-4" />
                            <span>
                                {loading
                                    ? 'Memproses...'
                                    : mode === 'new'
                                    ? 'Daftarkan Lomba & Buka Workspace'
                                    : 'Bentuk Tim & Buka Workspace'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
