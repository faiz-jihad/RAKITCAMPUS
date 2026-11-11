import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Trophy, Upload, X } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    participation: {
        id: number;
        competition?: {
            name: string;
            organizer: string;
            level?: string;
        };
        team?: {
            name: string;
        };
        result?: {
            outcome?: string;
            achievement_title?: string;
            rank?: number;
            notes?: string;
            certificate_path?: string;
        } | null;
    } | null;
}

const OUTCOME_OPTIONS = [
    { value: '1st_place', label: 'Juara 1 (Medali Emas)', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
    { value: '2nd_place', label: 'Juara 2 (Medali Perak)', badge: 'bg-slate-200 text-slate-800 border-slate-300' },
    { value: '3rd_place', label: 'Juara 3 (Medali Perunggu)', badge: 'bg-orange-100 text-orange-900 border-orange-300' },
    { value: 'finalist', label: 'Finalis Resmi', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
    { value: 'special_award', label: 'Penghargaan Khusus / Harapan', badge: 'bg-purple-100 text-purple-900 border-purple-300' },
    { value: 'participant', label: 'Peserta Resmi', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
    { value: 'not_selected', label: 'Partisipan (Belum Lolos Juara)', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
    { value: 'withdrawn', label: 'Mengundurkan Diri', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
];

export default function RecordResultModal({
    isOpen,
    onClose,
    participation,
}: Props) {
    if (!isOpen || !participation) return null;

    const existingResult = participation.result;

    const [outcome, setOutcome] = useState(existingResult?.outcome || '1st_place');
    const [achievementTitle, setAchievementTitle] = useState(
        existingResult?.achievement_title || `Juara Kompetisi: ${participation.competition?.name || ''}`
    );
    const [rank, setRank] = useState<number | ''>(existingResult?.rank ?? 1);
    const [evidenceUrl, setEvidenceUrl] = useState(
        existingResult?.certificate_path?.startsWith('http') ? existingResult.certificate_path : ''
    );
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [notes, setNotes] = useState(existingResult?.notes || '');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        const formData = new FormData();
        formData.append('outcome', outcome);
        formData.append('achievement_title', achievementTitle);
        if (rank !== '') formData.append('rank', String(rank));
        if (evidenceUrl) formData.append('evidence_url', evidenceUrl);
        if (certificateFile) formData.append('certificate', certificateFile);
        if (notes) formData.append('notes', notes);

        router.post(
            route('competitions.result.record', participation.id),
            formData,
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setLoading(false);
                    onClose();
                },
                onError: (errors) => {
                    setLoading(false);
                    const first = Object.values(errors)[0];
                    setErrorMsg(typeof first === 'string' ? first : 'Gagal mencatat hasil kompetisi.');
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
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block flex items-center gap-1.5">
                            <Trophy className="size-3.5" />
                            <span>Pencatatan Rekam Jejak Prestasi</span>
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
                            Catat Hasil & Prestasi Kompetisi
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {participation.competition?.name} • {participation.team?.name}
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

                {/* Information Callout */}
                <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-2xl text-[11px] text-amber-950 leading-relaxed">
                    <p className="font-semibold text-amber-950">
                        Integrasi Otomatis ke Portofolio Mahasiswa
                    </p>
                    <p className="mt-1 text-slate-600">
                        Hasil kompetisi yang Anda catat akan otomatis tampil di tab Lomba Selesai & Prestasi, dan diverifikasi oleh dosen pembimbing atau admin kampus ke rekam jejak portofolio resmi.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Hasil Capaian */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Hasil Akhir Kompetisi
                        </label>
                        <select
                            value={outcome}
                            onChange={(e) => {
                                setOutcome(e.target.value);
                                const selected = OUTCOME_OPTIONS.find((o) => o.value === e.target.value);
                                if (selected && (!achievementTitle || achievementTitle.startsWith('Juara') || achievementTitle.startsWith('Hasil'))) {
                                    setAchievementTitle(`${selected.label.split('(')[0].trim()} - ${participation.competition?.name || ''}`);
                                }
                            }}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            {OUTCOME_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Judul Prestasi */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                            Judul Prestasi / Capaian
                        </label>
                        <input
                            type="text"
                            required
                            value={achievementTitle}
                            onChange={(e) => setAchievementTitle(e.target.value)}
                            placeholder="Contoh: Juara 1 Software Development GEMASTIK XVII"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Peringkat Angka */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                            Peringkat Juara (Opsional)
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={500}
                            value={rank}
                            onChange={(e) => setRank(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Contoh: 1, 2, 3, atau kosongkan"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Unggah Sertifikat */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                            Berkas Sertifikat / Piagam (PDF / Gambar, Maks 5MB)
                        </label>
                        <div className="flex items-center gap-3">
                            <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition">
                                <Upload className="size-3.5" />
                                <span>Pilih Berkas</span>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                />
                            </label>
                            <span className="text-xs text-slate-500 truncate max-w-xs">
                                {certificateFile ? certificateFile.name : 'Belum ada berkas dipilih'}
                            </span>
                        </div>
                    </div>

                    {/* Alternatif Tautan Sertifikat */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                            Atau Tautan Sertifikat / Pengumuman Online
                        </label>
                        <input
                            type="url"
                            value={evidenceUrl}
                            onChange={(e) => setEvidenceUrl(e.target.value)}
                            placeholder="https://drive.google.com/... atau web penyelenggara"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Catatan / Keterangan */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                            Catatan & Ringkasan Solusi (Opsional)
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ceritakan singkat kontribusi tim, inovasi yang dibuat, atau pengalaman berharga..."
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                        />
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
                            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : 'Simpan Hasil Prestasi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
