import { Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, FolderKanban, GraduationCap, Layers, Trophy, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface HubGatewayModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeHub?: 'project' | 'competition';
}

export default function HubGatewayModal({
    isOpen,
    onClose,
    activeHub,
}: HubGatewayModalProps) {
    const [step, setStep] = useState<'hub' | 'project_mode'>('hub');
    const [classCode, setClassCode] = useState('');
    const [classError, setClassError] = useState<string | null>(null);
    const [classLoading, setClassLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setStep('hub');
            setClassCode('');
            setClassError(null);
            setClassLoading(false);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectHub = (hub: 'project' | 'competition') => {
        if (hub === 'project') {
            setStep('project_mode');
            return;
        }

        try {
            sessionStorage.setItem('rakit_hub_chosen', 'competition');
        } catch {
            // Ignore storage errors in private mode
        }

        onClose();
        router.get('/competitions');
    };

    const handleSelectMandiri = () => {
        try {
            sessionStorage.setItem('rakit_hub_chosen', 'project');
        } catch {
            // Ignore storage errors in private mode
        }

        onClose();
        router.get('/dashboard');
    };

    const handleJoinClass = (e: React.FormEvent) => {
        e.preventDefault();
        const code = classCode.trim().toUpperCase();
        if (!code) {
            setClassError('Kode kelas wajib diisi.');
            return;
        }

        setClassLoading(true);
        setClassError(null);

        router.post(
            '/classes/join',
            { join_code: code },
            {
                onSuccess: () => {
                    try {
                        sessionStorage.setItem('rakit_hub_chosen', 'project');
                    } catch {
                        // ignore
                    }
                    onClose();
                },
                onError: (errors) => {
                    setClassLoading(false);
                    setClassError(errors.join_code || 'Kode kelas tidak valid atau tidak ditemukan.');
                },
                onFinish: () => setClassLoading(false),
            }
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
            {/* Clean & Compact Modal Card */}
            <div
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200/90 p-5 sm:p-6 my-auto animate-in zoom-in-95 duration-150"
                role="dialog"
                aria-modal="true"
            >
                {/* STEP 1: PILIH RUANG KERJA (HUB) */}
                {step === 'hub' && (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                Pilih Ruang Kerja
                            </h2>

                            <button
                                type="button"
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer shrink-0"
                                title="Tutup"
                            >
                                <X className="w-4 h-4 stroke-[2]" />
                            </button>
                        </div>

                        {/* Two Compact Choice Tiles */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
                            {/* Option 1: Project Hub */}
                            <button
                                type="button"
                                onClick={() => handleSelectHub('project')}
                                className={`group text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between gap-3 cursor-pointer ${
                                    activeHub === 'project'
                                        ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                                        : 'border-slate-200/90 hover:border-blue-500 hover:bg-slate-50/80'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                                        <FolderKanban className="w-4 h-4 stroke-[2]" />
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
                                        Proyek & Kelas
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                        Project Hub
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                                        Living proposal, proyek mandiri & kelas kuliah.
                                    </p>
                                </div>
                            </button>

                            {/* Option 2: Competition Hub */}
                            <button
                                type="button"
                                onClick={() => handleSelectHub('competition')}
                                className={`group text-left p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between gap-3 cursor-pointer ${
                                    activeHub === 'competition'
                                        ? 'border-amber-500 bg-amber-50/40 shadow-xs'
                                        : 'border-slate-200/90 hover:border-amber-500 hover:bg-slate-50/80'
                                }`}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                                        <Trophy className="w-4 h-4 stroke-[2]" />
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>

                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-0.5">
                                        Lomba & Prestasi
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-600 transition">
                                        Competition Hub
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                                        Eksplorasi kompetisi & MinSatu matchmaking.
                                    </p>
                                </div>
                            </button>
                        </div>

                        {/* Subtle Footer */}
                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-end text-xs">
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-slate-500 hover:text-slate-800 font-medium transition cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </>
                )}

                {/* STEP 2: PILIH JALUR PROJECT (MANDIRI VS AKADEMIK) */}
                {step === 'project_mode' && (
                    <>
                        {/* Header with Back button */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStep('hub')}
                                    className="p-1.5 -ml-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                    title="Kembali"
                                >
                                    <ArrowLeft className="w-4 h-4 stroke-[2]" />
                                </button>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                                    Pilih Jalur Proyek
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer shrink-0"
                                title="Tutup"
                            >
                                <X className="w-4 h-4 stroke-[2]" />
                            </button>
                        </div>

                        {/* Two Tiles: Project Mandiri vs Akademik */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4">
                            {/* Option A: Project Mandiri (Bebas) */}
                            <div
                                onClick={handleSelectMandiri}
                                className="group text-left p-4 rounded-xl border border-slate-200/90 hover:border-blue-500 hover:bg-slate-50/80 transition-all duration-150 flex flex-col justify-between gap-3 cursor-pointer"
                            >
                                <div>
                                    <div className="flex items-center justify-between w-full mb-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                                            <Layers className="w-4 h-4 stroke-[2]" />
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                                            Bebas Masuk
                                        </span>
                                    </div>

                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                                        Jalur Terbuka
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                        Project Mandiri
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                                        Eksplorasi ide bebas, tugas akhir, atau riset tanpa kode kelas.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSelectMandiri}
                                    className="w-full mt-2 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <span>Buka Mandiri</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Option B: Akademik & Kelas (Masukin Kode Kelas) */}
                            <div className="p-4 rounded-xl border border-blue-200/90 bg-blue-50/30 flex flex-col justify-between gap-3">
                                <div>
                                    <div className="flex items-center justify-between w-full mb-3">
                                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                                            <GraduationCap className="w-4 h-4 stroke-[2]" />
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                            Perlu Kode
                                        </span>
                                    </div>

                                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-0.5">
                                        Akademik Kuliah
                                    </span>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Proyek Kelas Kuliah
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                                        Masukkan kode kelas dari dosen pengampu untuk masuk.
                                    </p>
                                </div>

                                {/* Form Input Kode Kelas */}
                                <form onSubmit={handleJoinClass} className="space-y-2 mt-1">
                                    <div className="space-y-1">
                                        <input
                                            type="text"
                                            maxLength={12}
                                            placeholder="Kode Kelas (misal: WEB-2024)"
                                            value={classCode}
                                            onChange={(e) => {
                                                setClassCode(e.target.value.toUpperCase());
                                                if (classError) setClassError(null);
                                            }}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono uppercase tracking-wider font-bold text-slate-900 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-center transition"
                                        />
                                        {classError && (
                                            <p className="text-[11px] font-medium text-rose-600 text-center">
                                                {classError}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={classLoading || !classCode.trim()}
                                        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-2xs"
                                    >
                                        <span>{classLoading ? 'Mengecek...' : 'Masuk Kelas'}</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    </button>
                                </form>

                                <Link
                                    href="/classes"
                                    onClick={() => {
                                        try {
                                            sessionStorage.setItem('rakit_hub_chosen', 'project');
                                        } catch {
                                            // ignore
                                        }
                                        onClose();
                                    }}
                                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline text-center block pt-0.5"
                                >
                                    Daftar Kelas Saya →
                                </Link>
                            </div>
                        </div>

                        {/* Subtle Footer */}
                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <button
                                type="button"
                                onClick={() => setStep('hub')}
                                className="text-slate-500 hover:text-slate-800 font-medium transition cursor-pointer flex items-center gap-1"
                            >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Kembali ke pilihan hub</span>
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="text-slate-500 hover:text-slate-800 font-medium transition cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
