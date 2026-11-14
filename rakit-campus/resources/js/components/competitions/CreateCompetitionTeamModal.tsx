import { router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    FileText,
    Globe,
    Layers,
    Plus,
    Sparkles,
    Trophy,
    Users,
    X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface CompetitionOption {
    id: number;
    name: string;
    slug?: string;
    organizer?: string;
    category?: string;
    level?: string;
    max_team_size?: number;
    category_tracks?: string[] | string;
    registration_deadline?: string | null;
    status?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    competitions: CompetitionOption[];
    preselectedCompId?: number | null;
    initialMode?: 'existing' | 'new';
}

const CATEGORY_OPTIONS = [
    { value: 'hackathon', label: 'Hackathon' },
    { value: 'technology', label: 'Teknologi & IT' },
    { value: 'programming', label: 'Pemrograman / Competitive Programming' },
    { value: 'ui_ux', label: 'UI/UX & Desain Produk' },
    { value: 'business_plan', label: 'Business Plan / Pitching' },
    { value: 'innovation', label: 'Inovasi & Startup' },
    { value: 'research', label: 'Riset & Sains' },
    { value: 'scientific_writing', label: 'Karya Tulis Ilmiah (KTI/PKM)' },
    { value: 'entrepreneurship', label: 'Kewirausahaan' },
    { value: 'other', label: 'Kategori Lainnya' },
];

const LEVEL_OPTIONS = [
    { value: 'national', label: 'Nasional' },
    { value: 'international', label: 'Internasional' },
    { value: 'regional', label: 'Regional' },
    { value: 'local', label: 'Tingkat Kampus / Lokal' },
];

export default function CreateCompetitionTeamModal({
    isOpen,
    onClose,
    competitions,
    preselectedCompId = null,
    initialMode,
}: Props) {
    const { auth } = usePage<any>().props;
    const currentUser = auth?.user;

    // Filter out closed or expired competitions
    const openCompetitions = (competitions || []).filter((comp) => {
        if (comp.status === 'closed' || comp.status === 'completed' || comp.status === 'cancelled') {
            return false;
        }
        if (comp.registration_deadline) {
            const deadline = new Date(comp.registration_deadline);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (deadline.getTime() < today.getTime()) {
                return false;
            }
        }
        return true;
    });

    const initialCompId = preselectedCompId || (openCompetitions.length > 0 ? openCompetitions[0].id : null);

    // Modes: 'choice' (Step 1) | 'existing' (Step 2) | 'new' (Step 2 & 3)
    const [mode, setMode] = useState<'choice' | 'existing' | 'new'>('choice');
    const [step, setStep] = useState<number>(1);

    // Step 2 Existing Form
    const [selectedCompId, setSelectedCompId] = useState<number | null>(initialCompId);

    // Step 2 New Competition Form (Semua ketentuan lengkap tidak boleh kurang)
    const [newCompName, setNewCompName] = useState('');
    const [newOrganizer, setNewOrganizer] = useState('');
    const [newCategory, setNewCategory] = useState('hackathon');
    const [newLevel, setNewLevel] = useState('national');
    const [newDeadline, setNewDeadline] = useState('');
    const [newMaxTeamSize, setNewMaxTeamSize] = useState<number>(4);
    const [newOfficialUrl, setNewOfficialUrl] = useState('');
    const [newCompDescription, setNewCompDescription] = useState('');

    // Team Form (shared in existing step 2 or new step 3)
    const [teamName, setTeamName] = useState(currentUser?.name ? `Tim ${currentUser.name}` : '');
    const [rolesNeeded, setRolesNeeded] = useState('');
    const [teamDescription, setTeamDescription] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Reset or initialize state on open
    useEffect(() => {
        if (isOpen) {
            setErrorMsg(null);
            setLoading(false);
            if (preselectedCompId) {
                setMode('existing');
                setStep(2);
                setSelectedCompId(preselectedCompId);
            } else if (initialMode === 'new') {
                setMode('new');
                setStep(2);
            } else if (initialMode === 'existing') {
                setMode('existing');
                setStep(2);
                if (openCompetitions.length > 0 && !selectedCompId) {
                    setSelectedCompId(openCompetitions[0].id);
                }
            } else {
                setMode('choice');
                setStep(1);
            }
        }
    }, [isOpen, preselectedCompId, initialMode]);

    if (!isOpen) return null;

    const selectedComp = openCompetitions.find((c) => c.id === Number(selectedCompId)) || openCompetitions[0] || null;

    // Today's date string in YYYY-MM-DD for min date picker
    const todayDateString = new Date().toISOString().split('T')[0];

    // Validate step 2 for new competition before moving to step 3
    const handleNextToTeamStep = () => {
        setErrorMsg(null);

        if (!newCompName.trim()) {
            setErrorMsg('Silakan masukkan nama kompetisi.');
            return;
        }
        if (!newOrganizer.trim()) {
            setErrorMsg('Silakan masukkan nama penyelenggara kompetisi.');
            return;
        }
        if (!newCategory) {
            setErrorMsg('Silakan pilih kategori lomba.');
            return;
        }
        if (!newLevel) {
            setErrorMsg('Silakan pilih tingkat kompetisi.');
            return;
        }
        if (!newDeadline) {
            setErrorMsg('Silakan tentukan batas akhir pendaftaran lomba.');
            return;
        }
        if (newDeadline < todayDateString) {
            setErrorMsg('Batas akhir pendaftaran tidak boleh di masa lampau.');
            return;
        }
        if (!newMaxTeamSize || newMaxTeamSize < 1 || newMaxTeamSize > 10) {
            setErrorMsg('Kapasitas anggota per tim harus antara 1 sampai 10 orang.');
            return;
        }
        if (!newCompDescription.trim() || newCompDescription.trim().length < 10) {
            setErrorMsg('Silakan isi deskripsi singkat kompetisi (minimal 10 karakter).');
            return;
        }

        setStep(3);
    };

    // Handle final submissions
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
            router.post(
                route('competitions.store-with-team'),
                {
                    competition_name: newCompName.trim(),
                    organizer: newOrganizer.trim(),
                    category: newCategory,
                    level: newLevel,
                    registration_deadline: newDeadline,
                    max_team_size: Number(newMaxTeamSize),
                    official_url: newOfficialUrl.trim() || null,
                    competition_description: newCompDescription.trim(),
                    team_name: teamName.trim(),
                    roles_needed: rolesNeeded.trim() || null,
                    team_description: teamDescription.trim() || null,
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
                    description: teamDescription.trim() || null,
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
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative my-6 animate-in fade-in zoom-in-95">
                {/* Header with Step Indicator */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
                            {mode === 'choice' ? (
                                <Users className="size-5" />
                            ) : mode === 'new' ? (
                                <Plus className="size-5" />
                            ) : (
                                <Trophy className="size-5" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-900">
                                {mode === 'choice'
                                    ? 'Mulai Bentuk Tim Kompetisi'
                                    : mode === 'existing'
                                    ? 'Pilih Lomba & Bentuk Tim'
                                    : step === 2
                                    ? 'Langkah 2: Lengkapi Data Lomba Baru'
                                    : 'Langkah 3: Atur Tim Kompetisi'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {mode === 'choice'
                                    ? 'Tentukan apakah lomba sudah ada di platform atau ingin mendaftarkan lomba baru.'
                                    : mode === 'existing'
                                    ? 'Pilih lomba yang masih membuka pendaftaran dan tentukan nama tim Anda.'
                                    : step === 2
                                    ? 'Isi ketentuan lengkap lomba. Semua field wajib diisi sesuai ketentuan.'
                                    : 'Beri nama tim dan tentukan peran rekan yang dicari.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                        title="Tutup"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Step Breadcrumb Pills (When beyond step 1) */}
                {mode !== 'choice' && (
                    <div className="flex items-center gap-1.5 mt-3 mb-4 text-[11px] font-semibold text-slate-500">
                        <span className="text-blue-600 font-bold">1. Pilih Jalur</span>
                        <span>›</span>
                        {mode === 'existing' ? (
                            <span className="text-slate-900 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md">
                                2. Pilih Lomba & Tim
                            </span>
                        ) : (
                            <>
                                <span className={step === 2 ? 'text-slate-900 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md' : 'text-slate-400'}>
                                    2. Ketentuan Lomba
                                </span>
                                <span>›</span>
                                <span className={step === 3 ? 'text-slate-900 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md' : 'text-slate-400'}>
                                    3. Bentuk Tim
                                </span>
                            </>
                        )}
                    </div>
                )}

                {errorMsg && (
                    <div className="mt-3 mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
                        <AlertCircle className="size-4 text-rose-600 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* ========================================================= */}
                {/* STEP 1: CHOICE (Lomba Ada vs Lomba Belum Ada)             */}
                {/* ========================================================= */}
                {mode === 'choice' && (
                    <div className="py-4 space-y-3">
                        <div className="text-xs font-bold text-slate-700 mb-2">
                            Apakah kompetisi yang ingin Anda ikuti sudah ada di platform?
                        </div>

                        {/* Card Option 1: Existing Competition */}
                        <div
                            onClick={() => {
                                setMode('existing');
                                setStep(2);
                                setErrorMsg(null);
                            }}
                            className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 transition cursor-pointer group shadow-2xs"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 group-hover:scale-105 transition-transform">
                                        <Trophy className="size-4.5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                Ikuti Lomba yang Sudah Ada di Platform
                                            </h4>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                {openCompetitions.length} Aktif
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Pilih dari daftar kompetisi terverifikasi yang pendaftarannya masih dibuka, lalu langsung bentuk tim Anda.
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="size-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition shrink-0 mt-2" />
                            </div>
                        </div>

                        {/* Card Option 2: Register New Competition */}
                        <div
                            onClick={() => {
                                setMode('new');
                                setStep(2);
                                setErrorMsg(null);
                            }}
                            className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/20 transition cursor-pointer group shadow-2xs"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div className="size-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 border border-slate-200 group-hover:scale-105 transition-transform">
                                        <Plus className="size-4.5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                Lomba Belum Ada? Daftarkan Lomba Baru
                                            </h4>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                                Baru
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                            Punya info lomba dari luar kampus? Lengkapi data resmi lomba sesuai ketentuan, kemudian langsung bentuk tim Anda.
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight className="size-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition shrink-0 mt-2" />
                            </div>
                        </div>

                        <div className="pt-3 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* FLOW 1: EXISTING COMPETITION (STEP 2)                     */}
                {/* ========================================================= */}
                {mode === 'existing' && (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                        {/* SELECT COMPETITION */}
                        <div>
                            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                                <Trophy className="size-3.5 text-blue-600" />
                                <span>Pilih Kompetisi Target</span>
                                <span className="text-rose-500">*</span>
                            </label>

                            {openCompetitions.length > 0 ? (
                                <select
                                    value={selectedCompId || ''}
                                    onChange={(e) => setSelectedCompId(Number(e.target.value))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                                >
                                    {openCompetitions.map((comp) => {
                                        const deadlineStr = comp.registration_deadline
                                            ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                                  day: 'numeric',
                                                  month: 'short',
                                              })
                                            : null;
                                        return (
                                            <option key={comp.id} value={comp.id}>
                                                {comp.name} {comp.organizer ? `— ${comp.organizer}` : ''} {deadlineStr ? `(Deadline: ${deadlineStr})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            ) : (
                                <div className="p-3.5 bg-amber-50 border border-amber-200 text-xs text-amber-800 rounded-xl space-y-2">
                                    <p>
                                        Saat ini belum ada kompetisi aktif yang membuka pendaftaran. Silakan daftarkan kompetisi baru.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('new');
                                            setStep(2);
                                            setErrorMsg(null);
                                        }}
                                        className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer"
                                    >
                                        + Daftarkan Lomba Baru
                                    </button>
                                </div>
                            )}

                            {selectedComp && (
                                <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-800">
                                            Kategori: {selectedComp.category ? selectedComp.category.replace('_', ' ').toUpperCase() : 'UMUM'}
                                        </span>
                                        <span>•</span>
                                        <span>Maks. {selectedComp.max_team_size || 4} anggota per tim</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMode('new');
                                            setStep(2);
                                            setErrorMsg(null);
                                        }}
                                        className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                                    >
                                        Lomba tidak ada di daftar? Buat baru
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* TEAM DETAILS */}
                        <div className="pt-2 border-t border-slate-100 space-y-3.5">
                            <div>
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                    Nama Tim Kompetisi Anda <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Tim Inovasi Digital"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                                    <span>Peran Rekan yang Dicari</span>
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

                            <div>
                                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                                    <span>Fokus Ide / Deskripsi Tim</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Jelaskan fokus ide atau sasaran yang ingin dirancang bersama tim..."
                                    value={teamDescription}
                                    onChange={(e) => setTeamDescription(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('choice');
                                    setStep(1);
                                    setErrorMsg(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Kembali</span>
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !selectedCompId}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <span>Memproses...</span>
                                ) : (
                                    <>
                                        <Plus className="size-4" />
                                        <span>Bentuk Tim & Buka Workspace</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* ========================================================= */}
                {/* FLOW 2: NEW COMPETITION STEP 2 (Ketentuan Lengkap Lomba)  */}
                {/* ========================================================= */}
                {mode === 'new' && step === 2 && (
                    <div className="space-y-3.5 pt-1">
                        <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 text-xs text-slate-600">
                            Silakan lengkapi ketentuan data kompetisi di bawah ini secara lengkap sebelum lanjut membuat tim.
                        </div>

                        {/* Nama & Penyelenggara */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                    Nama Kompetisi <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Gemastik XVII 2026"
                                    value={newCompName}
                                    onChange={(e) => setNewCompName(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                    Penyelenggara <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Puspresnas / BPTI Kemendikbud"
                                    value={newOrganizer}
                                    onChange={(e) => setNewOrganizer(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                                />
                            </div>
                        </div>

                        {/* Kategori & Tingkat */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                    Kategori Lomba <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium"
                                >
                                    {CATEGORY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                    Tingkat / Jenjang <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={newLevel}
                                    onChange={(e) => setNewLevel(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium"
                                >
                                    {LEVEL_OPTIONS.map((lvl) => (
                                        <option key={lvl.value} value={lvl.value}>
                                            {lvl.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Batas Akhir Pendaftaran & Kapasitas Tim */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                    Batas Akhir Pendaftaran <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    min={todayDateString}
                                    value={newDeadline}
                                    onChange={(e) => setNewDeadline(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-800 block mb-1">
                                    Maksimal Anggota per Tim <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min={1}
                                    max={10}
                                    value={newMaxTeamSize}
                                    onChange={(e) => setNewMaxTeamSize(Number(e.target.value))}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                                />
                            </div>
                        </div>

                        {/* Link Panduan / Website Resmi */}
                        <div>
                            <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                                <span>Website Resmi / Link Panduan (Booklet)</span>
                                <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                            </label>
                            <input
                                type="url"
                                placeholder="Contoh: https://gemastik.kemdikbud.go.id"
                                value={newOfficialUrl}
                                onChange={(e) => setNewOfficialUrl(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>

                        {/* Deskripsi Singkat Kompetisi */}
                        <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1">
                                Deskripsi & Sasaran Lomba <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                rows={2}
                                required
                                placeholder="Jelaskan ruang lingkup lomba, tema tahun ini, atau ketentuan teknis..."
                                value={newCompDescription}
                                onChange={(e) => setNewCompDescription(e.target.value)}
                                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-medium"
                            />
                        </div>

                        {/* ACTIONS STEP 2 NEW */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('choice');
                                    setStep(1);
                                    setErrorMsg(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Kembali</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleNextToTeamStep}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                                <span>Lanjut: Atur Tim Anda</span>
                                <ArrowRight className="size-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* FLOW 2: NEW COMPETITION STEP 3 (Atur Tim & Submit)        */}
                {/* ========================================================= */}
                {mode === 'new' && step === 3 && (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                        {/* Summary of new competition */}
                        <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white uppercase tracking-wider">
                                    Lomba Baru
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                                >
                                    Ubah Data Lomba
                                </button>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 mt-1.5">{newCompName}</h4>
                            <p className="text-xs text-slate-500">
                                Penyelenggara: <strong className="text-slate-700">{newOrganizer}</strong> • Tingkat: {newLevel.toUpperCase()}
                            </p>
                            <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                                <span>Deadline: {newDeadline}</span>
                                <span>•</span>
                                <span>Maks. {newMaxTeamSize} Anggota</span>
                            </div>
                        </div>

                        {/* Team Form Inputs */}
                        <div className="space-y-3.5">
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
                                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                                    <span>Peran Rekan yang Dicari</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: UI/UX Designer, Frontend Dev, Pitch Deck"
                                    value={rolesNeeded}
                                    onChange={(e) => setRolesNeeded(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-800 flex items-center justify-between mb-1">
                                    <span>Fokus Ide / Sasaran Solusi</span>
                                    <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Jelaskan fokus ide atau solusi yang ingin dirancang bersama tim..."
                                    value={teamDescription}
                                    onChange={(e) => setTeamDescription(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-medium"
                                />
                            </div>
                        </div>

                        {/* ACTIONS STEP 3 NEW */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Kembali ke Data Lomba</span>
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                            >
                                {loading ? (
                                    <span>Menyimpan & Membuka Workspace...</span>
                                ) : (
                                    <>
                                        <Plus className="size-4" />
                                        <span>Daftarkan Lomba & Buka Workspace</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
