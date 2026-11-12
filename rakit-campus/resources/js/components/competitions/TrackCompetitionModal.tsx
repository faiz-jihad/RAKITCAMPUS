import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Trophy, Users, X } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    competition: {
        id: number;
        name: string;
        organizer: string;
        category?: string;
        max_team_size?: number;
        category_tracks?: string[] | string;
        registration_url?: string;
        official_url?: string;
    } | null;
    defaultStatus?: 'planning' | 'registered';
}

export default function TrackCompetitionModal({
    isOpen,
    onClose,
    competition,
    defaultStatus = 'planning',
}: Props) {
    const [participationMode, setParticipationMode] = useState<'team' | 'solo'>('team');
    const [initialStatus, setInitialStatus] = useState<'planning' | 'registered'>(defaultStatus);
    const [teamName, setTeamName] = useState('');
    const [categoryTrack, setCategoryTrack] = useState('');
    const [description, setDescription] = useState('');
    const [registrationProof, setRegistrationProof] = useState('');
    const [redirectTo, setRedirectTo] = useState<'hub' | 'workspace'>('hub');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen || !competition) return null;

    const categoryTracks: string[] = Array.isArray(competition.category_tracks)
        ? competition.category_tracks
        : (typeof competition.category_tracks === 'string'
            ? (() => {
                try { return JSON.parse(competition.category_tracks || '[]'); } catch { return []; }
            })()
            : []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (participationMode === 'team' && !teamName.trim()) {
            setErrorMsg('Mohon masukkan nama tim untuk kompetisi ini.');
            return;
        }

        setLoading(true);

        router.post(
            route('competitions.participate', competition.id),
            {
                team_name: participationMode === 'solo' && !teamName.trim() ? `Partisipasi Mandiri` : teamName,
                category_track: categoryTrack || null,
                description: description || null,
                initial_status: initialStatus,
                external_registration_proof: registrationProof || null,
                redirect_to: redirectTo,
            },
            {
                onSuccess: () => {
                    setLoading(false);
                    onClose();
                },
                onError: (errors) => {
                    setLoading(false);
                    const firstError = Object.values(errors)[0];
                    setErrorMsg(typeof firstError === 'string' ? firstError : 'Gagal menambahkan kompetisi.');
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div
                className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-7 border border-slate-200/90 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
                            Manajemen Lomba
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                            Tambahkan ke Lomba Saya
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {competition.name} • {competition.organizer}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {errorMsg && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
                        <AlertCircle className="size-4 shrink-0 text-rose-600 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Important Notice Distinction */}
                <div className="mt-4 p-3.5 bg-blue-50/70 border border-blue-200/70 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
                    <p className="font-semibold text-blue-950 flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-blue-600" />
                        <span>Pembedaan Registrasi Resmi & Pelacakan Internal</span>
                    </p>
                    <p className="mt-1 text-slate-600">
                        Pendaftaran resmi kompetisi tetap dilakukan di portal eksternal penyelenggara. Fitur ini mencatat progres Anda di RAKIT Campus untuk kolaborasi tim, berkas persiapan, dan rekam jejak portofolio.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Status Pendaftaran Awal */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Status Partisipasi Saat Ini
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setInitialStatus('planning')}
                                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                    initialStatus === 'planning'
                                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 text-amber-950'
                                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                            >
                                <span className="block text-xs font-bold">Sedang Merencanakan</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5">
                                    Mempersiapkan ide, anggota tim, & berkas
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setInitialStatus('registered')}
                                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                    initialStatus === 'registered'
                                        ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 text-blue-950'
                                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                }`}
                            >
                                <span className="block text-xs font-bold">Sudah Mendaftar Resmi</span>
                                <span className="block text-[10px] text-slate-500 mt-0.5">
                                    Telah daftar di portal eksternal
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Jika Sudah Mendaftar: Masukkan nomor atau bukti */}
                    {initialStatus === 'registered' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                                Nomor Pendaftaran / Tautan Bukti (Opsional)
                            </label>
                            <input
                                type="text"
                                value={registrationProof}
                                onChange={(e) => setRegistrationProof(e.target.value)}
                                placeholder="Contoh: REG-2027-GEMASTIK-089 atau https://..."
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}

                    {/* Mode Partisipasi */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Format Kepesertaan
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setParticipationMode('team')}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                                    participationMode === 'team'
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <Users className="size-3.5" />
                                <span>Tim Mahasiswa</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setParticipationMode('solo')}
                                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                                    participationMode === 'solo'
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <Trophy className="size-3.5" />
                                <span>Individu / Mandiri</span>
                            </button>
                        </div>
                    </div>

                    {/* Nama Tim */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                            {participationMode === 'team' ? 'Nama Tim' : 'Nama Label Partisipasi'}
                        </label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder={participationMode === 'team' ? 'Contoh: Garuda Tech, Tim Inovasi' : 'Opsional: Nama Anda'}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Jalur / Kategori jika ada */}
                    {categoryTracks.length > 0 && (
                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                                Jalur / Pilihan Cabang Lomba
                            </label>
                            <select
                                value={categoryTrack}
                                onChange={(e) => setCategoryTrack(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="">Pilih Cabang / Jalur</option>
                                {categoryTracks.map((trk, i) => (
                                    <option key={i} value={trk}>{trk}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Tujuan Alur Setelah Ditambahkan */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                            Langkah Selanjutnya
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                                redirectTo === 'hub' ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold' : 'border-slate-200'
                            }`}>
                                <input
                                    type="radio"
                                    name="redirect_to"
                                    value="hub"
                                    checked={redirectTo === 'hub'}
                                    onChange={() => setRedirectTo('hub')}
                                    className="accent-blue-600"
                                />
                                <span>Simpan di Lomba Saya</span>
                            </label>
                            <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                                redirectTo === 'workspace' ? 'bg-blue-50/70 border-blue-300 text-blue-900 font-semibold' : 'border-slate-200'
                            }`}>
                                <input
                                    type="radio"
                                    name="redirect_to"
                                    value="workspace"
                                    checked={redirectTo === 'workspace'}
                                    onChange={() => setRedirectTo('workspace')}
                                    className="accent-blue-600"
                                />
                                <span>Buka Workspace Tim</span>
                            </label>
                        </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Partisipasi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
