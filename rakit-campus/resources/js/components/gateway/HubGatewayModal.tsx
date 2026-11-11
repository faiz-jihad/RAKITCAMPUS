import { router } from '@inertiajs/react';
import { ArrowUpRight, FolderKanban, Trophy, X } from 'lucide-react';
import React, { useEffect } from 'react';

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
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectHub = (hub: 'project' | 'competition') => {
        try {
            sessionStorage.setItem('rakit_hub_chosen', hub);
        } catch {
            // Ignore storage errors in private mode
        }

        onClose();

        if (hub === 'project') {
            router.get('/dashboard');
        } else {
            router.get('/competitions');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
            {/* Clean & Compact Modal Card */}
            <div
                className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200/90 p-5 sm:p-6 my-auto animate-in zoom-in-95 duration-150"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                            Pilih Ruang Kerja
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Pilih fokus aktivitas kolaborasi Anda hari ini.
                        </p>
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
                                Akademik & Kelas
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                Project Hub
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-snug">
                                Living proposal, tugas kelas UTS/UAS & bimbingan dosen.
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
                                Eksplorasi kompetisi & MinSatu matchmaking partner tim.
                            </p>
                        </div>
                    </button>
                </div>

                {/* Subtle Footer */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Bisa beralih kapan saja lewat tombol di navbar atas.</span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-800 font-medium transition cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
