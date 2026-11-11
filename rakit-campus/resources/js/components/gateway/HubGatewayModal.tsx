import AnimatedIcon from '@/components/animations/AnimatedIcon';
import { router } from '@inertiajs/react';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
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
    // Lock scroll when open
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
            {/* Modal Dialog Card */}
            <div
                className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-auto animate-in zoom-in-95 duration-200"
                role="dialog"
                aria-modal="true"
                aria-labelledby="hub-gateway-title"
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer z-10"
                    title="Tutup"
                >
                    <X className="w-4 h-4 stroke-[2.25]" />
                </button>

                {/* Modal Header */}
                <div className="pt-8 sm:pt-10 px-6 sm:px-10 pb-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider mb-3">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Portal Kolaborasi Mahasiswa</span>
                    </div>

                    <h2
                        id="hub-gateway-title"
                        className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                    >
                        Pilih Ruang Kerja Anda
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-2 leading-relaxed">
                        Tentukan fokus aktivitas kolaborasi hari ini. Setiap ruang kerja dirancang terpisah dan terarah untuk memaksimalkan produktivitas Anda.
                    </p>
                </div>

                {/* Two Large Choice Cards */}
                <div className="p-6 sm:p-10 pt-2 grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                    {/* OPTION 1: PROJECT HUB */}
                    <div
                        onClick={() => handleSelectHub('project')}
                        className={`group relative rounded-2xl border-2 transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between cursor-pointer ${
                            activeHub === 'project'
                                ? 'border-blue-600 bg-blue-50/20 shadow-lg'
                                : 'border-slate-200/90 hover:border-blue-500 bg-gradient-to-b from-slate-50/50 to-white hover:shadow-xl hover:-translate-y-1'
                        }`}
                    >
                        <div>
                            {/* Card Header & Icon */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-300">
                                    <AnimatedIcon name="folder" size={32} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                                    Akademik & Kelas
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                Project Hub
                            </h3>

                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                Pusat living proposal akademik, manajemen tim proyek kelas UTS / UAS, tugas akhir, dan bimbingan terintegrasi bersama dosen.
                            </p>

                            {/* Features Checklist */}
                            <div className="space-y-2.5 mt-5 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <Check className="w-3 h-3 stroke-[2.5]" />
                                    </div>
                                    <span>Proyek Kelas, Living Proposal & Revisi</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <Check className="w-3 h-3 stroke-[2.5]" />
                                    </div>
                                    <span>Matchmaking Tim Seimbang & Task Board</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <Check className="w-3 h-3 stroke-[2.5]" />
                                    </div>
                                    <span>Evaluasi & Penilaian Mandiri / Dosen</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="mt-6 pt-4">
                            <button
                                type="button"
                                className="w-full py-3 px-4 rounded-xl bg-slate-900 group-hover:bg-blue-600 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                            >
                                <span>Buka Project Hub</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* OPTION 2: COMPETITION HUB */}
                    <div
                        onClick={() => handleSelectHub('competition')}
                        className={`group relative rounded-2xl border-2 transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between cursor-pointer ${
                            activeHub === 'competition'
                                ? 'border-amber-500 bg-amber-50/20 shadow-lg'
                                : 'border-slate-200/90 hover:border-amber-500 bg-gradient-to-b from-amber-50/20 via-white to-white hover:shadow-xl hover:-translate-y-1'
                        }`}
                    >
                        <div>
                            {/* Card Header & Icon */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform duration-300">
                                    <AnimatedIcon name="trophy" size={32} />
                                </div>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80">
                                    Lomba & Prestasi
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition leading-snug">
                                Competition Hub
                            </h3>

                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                Pusat eksplorasi kompetisi bergengsi terverifikasi, MinSatu matchmaking partner sefrekuensi, dan akselerasi prestasi kampus.
                            </p>

                            {/* Features Checklist */}
                            <div className="space-y-2.5 mt-5 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <Check className="w-3 h-3 stroke-[2.5]" />
                                    </div>
                                    <span>Katalog Lomba Nasional & Internasional</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <Check className="w-3 h-3 stroke-[2.5]" />
                                    </div>
                                    <span>MinSatu: Cari 1 Rekan Tim Sefrekuensi</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                                    <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                                        <Check className="w-3 h-3 stroke-[2.5]" />
                                    </div>
                                    <span>Workspace Lomba & Submit Deliverable</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="mt-6 pt-4">
                            <button
                                type="button"
                                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
                            >
                                <span>Buka Competition Hub</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Modal Footer Note */}
                <div className="bg-slate-50 border-t border-slate-200/80 px-6 sm:px-10 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                    <p className="text-xs text-slate-500">
                        Tip: Anda dapat beralih ruang kerja kapan saja melalui navigasi atas.
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                        Tutup (Pilih Nanti)
                    </button>
                </div>
            </div>
        </div>
    );
}
