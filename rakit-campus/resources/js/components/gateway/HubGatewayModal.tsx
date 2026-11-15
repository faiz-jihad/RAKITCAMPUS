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
            localStorage.setItem('rakit_active_hub', hub);
        } catch {
            // Ignore storage errors in private mode
        }

        onClose();
        if (hub === 'competition') {
            router.get('/competitions');
        } else {
            router.get('/dashboard');
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
                    {/* Option 1: Proyek Hub */}
                    <button
                        type="button"
                        onClick={() => handleSelectHub('project')}
                        className={`group relative text-left p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between gap-3 cursor-pointer overflow-hidden ${
                            activeHub === 'project'
                                ? 'border-blue-600 bg-blue-50/40 shadow-xs hover:bg-blue-600 hover:border-blue-600 hover:shadow-lg'
                                : 'border-slate-200/90 hover:border-blue-600 hover:bg-blue-600 shadow-xs hover:shadow-lg'
                        }`}
                    >
                        {/* Static Badge Background Frame */}
                        <div className="pointer-events-none absolute top-4 left-4 size-9 rounded-xl bg-blue-50 border border-blue-100 z-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-75" />

                        {/* Pure Morphing Icon Glyph */}
                        <div className="pointer-events-none absolute z-0 flex items-center justify-center transition-all duration-500 ease-out top-4 left-4 size-9 translate-x-0 translate-y-0 group-hover:top-1/2 group-hover:left-1/2 group-hover:-translate-x-1/2 group-hover:-translate-y-1/2 group-hover:size-32">
                            <FolderKanban className="w-4 h-4 text-blue-600 stroke-[2] transition-all duration-500 ease-out group-hover:w-28 group-hover:h-28 group-hover:text-white/20 group-hover:stroke-[1.5]" />
                        </div>

                        <div className="relative z-10 flex items-center justify-between w-full">
                            {/* Layout spacer for top row so Arrow stays pinned to top-right */}
                            <div className="size-9 shrink-0" aria-hidden="true" />
                            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0" />
                        </div>

                        <div className="relative z-10 pointer-events-none">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 group-hover:text-blue-100 transition-colors duration-300 block mb-0.5">
                                Proyek & Kuliah
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-white transition-colors duration-300">
                                Proyek Hub
                            </h3>
                            <p className="text-xs text-slate-500 group-hover:text-blue-100/90 mt-1 leading-snug transition-colors duration-300">
                                Living proposal, proyek kelas & kolaborasi tim.
                            </p>
                        </div>
                    </button>

                    {/* Option 2: Lomba Hub */}
                    <button
                        type="button"
                        onClick={() => handleSelectHub('competition')}
                        className={`group relative text-left p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between gap-3 cursor-pointer overflow-hidden ${
                            activeHub === 'competition'
                                ? 'border-amber-500 bg-amber-50/40 shadow-xs hover:bg-amber-500 hover:border-amber-500 hover:shadow-lg'
                                : 'border-slate-200/90 hover:border-amber-500 hover:bg-amber-500 shadow-xs hover:shadow-lg'
                        }`}
                    >
                        {/* Static Badge Background Frame */}
                        <div className="pointer-events-none absolute top-4 left-4 size-9 rounded-xl bg-amber-50 border border-amber-100 z-0 transition-all duration-300 group-hover:opacity-0 group-hover:scale-75" />

                        {/* Pure Morphing Icon Glyph */}
                        <div className="pointer-events-none absolute z-0 flex items-center justify-center transition-all duration-500 ease-out top-4 left-4 size-9 translate-x-0 translate-y-0 group-hover:top-1/2 group-hover:left-1/2 group-hover:-translate-x-1/2 group-hover:-translate-y-1/2 group-hover:size-32">
                            <Trophy className="w-4 h-4 text-amber-600 stroke-[2] transition-all duration-500 ease-out group-hover:w-28 group-hover:h-28 group-hover:text-white/20 group-hover:stroke-[1.5]" />
                        </div>

                        <div className="relative z-10 flex items-center justify-between w-full">
                            {/* Layout spacer for top row so Arrow stays pinned to top-right */}
                            <div className="size-9 shrink-0" aria-hidden="true" />
                            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 shrink-0" />
                        </div>

                        <div className="relative z-10 pointer-events-none">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 group-hover:text-amber-100 transition-colors duration-300 block mb-0.5">
                                Kompetisi & Prestasi
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 group-hover:text-white transition-colors duration-300">
                                Lomba Hub
                            </h3>
                            <p className="text-xs text-slate-500 group-hover:text-amber-100/90 mt-1 leading-snug transition-colors duration-300">
                                Eksplorasi kompetisi & rekrutmen tim kolaborasi.
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
