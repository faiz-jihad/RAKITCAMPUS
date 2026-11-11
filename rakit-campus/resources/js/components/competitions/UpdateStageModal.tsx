import { router } from '@inertiajs/react';
import { AlertCircle, CheckCircle2, Clock, X } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    participation: {
        id: number;
        stage: string;
        registration_status?: string;
        external_registration_proof?: string;
        external_submission_proof?: string;
        competition?: {
            name: string;
            organizer: string;
        };
        team?: {
            name: string;
        };
    } | null;
}

const STAGE_OPTIONS = [
    { value: 'preparing', label: '1. Persiapan Berkas & Karya', desc: 'Menyusun ide, proposal, & berkas pendaftaran' },
    { value: 'registered', label: '2. Terdaftar Resmi di Penyelenggara', desc: 'Sudah submit formulir resmi di web eksternal' },
    { value: 'submitted', label: '3. Berkas / Karya Terkirim', desc: 'Telah submit karya/proposal ke sistem lomba' },
    { value: 'administrative_selection', label: '4. Seleksi Administrasi', desc: 'Menunggu hasil verifikasi berkas awal' },
    { value: 'shortlisted', label: '5. Lolos Seleksi Awal / Babak Penyisihan', desc: 'Lolos ke babak selanjutnya' },
    { value: 'finalist', label: '6. Finalis Kompetisi', desc: 'Diumumkan masuk tahap final' },
    { value: 'final_presentation', label: '7. Tahap Presentasi Final', desc: 'Menjalani presentasi/pitching akhir' },
    { value: 'withdrawn', label: 'X. Batal / Mengundurkan Diri', desc: 'Membatalkan keikutsertaan kompetisi' },
];

export default function UpdateStageModal({
    isOpen,
    onClose,
    participation,
}: Props) {
    const [stage, setStage] = useState(participation?.stage || 'preparing');
    const [registrationProof, setRegistrationProof] = useState(participation?.external_registration_proof || '');
    const [submissionProof, setSubmissionProof] = useState(participation?.external_submission_proof || '');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isOpen || !participation) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        router.post(
            route('competitions.stage.update', participation.id),
            {
                stage,
                notes: notes || null,
                external_registration_proof: registrationProof || null,
                external_submission_proof: submissionProof || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLoading(false);
                    onClose();
                },
                onError: (errors) => {
                    setLoading(false);
                    const first = Object.values(errors)[0];
                    setErrorMsg(typeof first === 'string' ? first : 'Gagal memperbarui tahapan.');
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
                            Pembaruan Siklus Kompetisi
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">
                            Update Tahapan Partisipasi
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

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {/* Pilih Tahap */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Pilih Tahapan Terbaru
                        </label>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {STAGE_OPTIONS.map((opt) => (
                                <label
                                    key={opt.value}
                                    className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                                        stage === opt.value
                                            ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20'
                                            : 'bg-white border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <input
                                        type="radio"
                                        name="stage"
                                        value={opt.value}
                                        checked={stage === opt.value}
                                        onChange={() => setStage(opt.value)}
                                        className="mt-0.5 text-blue-600 accent-blue-600"
                                    />
                                    <div className="text-xs">
                                        <span className="font-bold text-slate-900 block">{opt.label}</span>
                                        <span className="text-[11px] text-slate-500 block">{opt.desc}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Nomor Registrasi Resmi jika tahap adalah registered atau sudah terdaftar */}
                    {(stage === 'registered' || participation.registration_status === 'registered') && (
                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                                Nomor Pendaftaran / Bukti Registrasi Eksternal
                            </label>
                            <input
                                type="text"
                                value={registrationProof}
                                onChange={(e) => setRegistrationProof(e.target.value)}
                                placeholder="Contoh: REG-2027-GEMASTIK-0091 atau tautan formulir"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}

                    {/* Bukti Pengumpulan jika tahap submitted */}
                    {stage === 'submitted' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                                Tautan / Bukti Pengumpulan Karya
                            </label>
                            <input
                                type="text"
                                value={submissionProof}
                                onChange={(e) => setSubmissionProof(e.target.value)}
                                placeholder="Contoh: https://drive.google.com/... atau ID submit portal"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}

                    {/* Catatan / Keterangan */}
                    <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                            Catatan Perubahan (Opsional)
                        </label>
                        <textarea
                            rows={3}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tuliskan keterangan progres tim atau pengumuman dari penyelenggara..."
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
                            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'Memperbarui...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
