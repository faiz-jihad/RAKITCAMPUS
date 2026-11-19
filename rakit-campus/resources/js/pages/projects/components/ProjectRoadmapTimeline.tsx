import {
    Check,
    CheckCircle2,
    Compass,
    FileText,
    FolderKanban,
    Layers,
    Rocket,
    Sparkles,
} from 'lucide-react';

interface Props {
    implementationProgress: number;
    projectStatus: string;
}

export default function ProjectRoadmapTimeline({
    implementationProgress = 0,
    projectStatus = 'draft',
}: Props) {
    const isCompleted = projectStatus === 'completed' || implementationProgress >= 100;

    const steps = [
        {
            stage: 'Tahap 1',
            title: 'Ideasi & Perencanaan',
            shortTitle: 'Ideasi',
            desc: implementationProgress >= 15 ? 'Konsep & Use Case Terdefinisi' : 'Perumusan rancangan solusi',
            active: true,
            done: implementationProgress >= 15 || projectStatus !== 'draft',
            icon: FileText,
        },
        {
            stage: 'Tahap 2',
            title: 'Desain & Arsitektur',
            shortTitle: 'Desain',
            desc: implementationProgress >= 35 ? 'Struktur & Antarmuka Siap' : 'Perancangan UI/UX & sistem',
            active: implementationProgress >= 15,
            done: implementationProgress >= 35,
            icon: Layers,
        },
        {
            stage: 'Tahap 3',
            title: 'Pengembangan MVP',
            shortTitle: 'MVP',
            desc: implementationProgress >= 65 ? 'Fitur Utama Dibangun' : 'Implementasi fungsi inti produk',
            active: implementationProgress >= 35,
            done: implementationProgress >= 65,
            icon: FolderKanban,
        },
        {
            stage: 'Tahap 4',
            title: 'Pengujian & Beta',
            shortTitle: 'Pengujian',
            desc: implementationProgress >= 85 ? 'Validasi Pengguna Selesai' : 'Pengujian fungsi & perbaikan',
            active: implementationProgress >= 65,
            done: implementationProgress >= 85,
            icon: Sparkles,
        },
        {
            stage: 'Tahap 5',
            title: 'Peluncuran / Rilis',
            shortTitle: 'Rilis',
            desc: implementationProgress >= 100 ? 'Produk Siap Dipublikasikan' : 'Persiapan deployment rilis',
            active: implementationProgress >= 85,
            done: implementationProgress >= 100 || isCompleted,
            icon: Rocket,
        },
        {
            stage: 'Tahap 6',
            title: 'Portofolio Selesai',
            shortTitle: 'Portofolio',
            desc: isCompleted ? 'Karya Siap di Showcase' : 'Dokumentasi & Portofolio',
            active: isCompleted,
            done: isCompleted,
            icon: CheckCircle2,
        },
    ];

    // Indeks tahap aktif atau selesai terakhir untuk menentukan panjang garis progres
    const lastDoneIndex = steps.reduce((acc, step, idx) => (step.done ? idx : acc), -1);
    const activeIndex = steps.reduce((acc, step, idx) => (step.active ? idx : acc), 0);
    const progressIndex = Math.max(lastDoneIndex, activeIndex);
    const progressFillPercent = (progressIndex / (steps.length - 1)) * 83.333;

    return (
        <div className="rounded-2xl p-3.5 sm:p-6 bg-white border border-slate-200/80 shadow-xs mb-6 relative overflow-hidden">
            {/* Header Timeline */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 sm:pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="p-1.5 sm:p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                        <Compass className="size-3.5 sm:size-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 truncate">
                        Roadmap Pengerjaan Proyek
                    </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500">
                        Progres:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-black">
                        {implementationProgress}%
                    </span>
                </div>
            </div>

            {/* Stepper Horizontal Metro Track (Auto-responsive without scroll) */}
            <div className="pt-4 sm:pt-6 pb-1 sm:pb-2">
                <div className="w-full relative">
                    {/* Background Track Line (center of step 0 to center of step 5) */}
                    <div
                        className="absolute top-3.5 sm:top-5 h-0.5 sm:h-1 bg-slate-100 rounded-full -translate-y-1/2 z-0"
                        style={{ left: '8.333%', right: '8.333%' }}
                    />

                    {/* Filled Progress Track Line */}
                    <div
                        className="absolute top-3.5 sm:top-5 h-0.5 sm:h-1 bg-blue-600 rounded-full -translate-y-1/2 transition-all duration-700 z-0"
                        style={{ left: '8.333%', width: `${progressFillPercent}%` }}
                    />

                    {/* 6 Step Nodes Grid */}
                    <div className="grid grid-cols-6 relative z-10">
                        {steps.map((st, idx) => {
                            const Icon = st.icon;
                            const isCurrent = !st.done && st.active;
                            return (
                                <div key={idx} className="flex flex-col items-center text-center px-0.5 sm:px-1 group">
                                    {/* Node Circle */}
                                    <div
                                        className={`size-7 sm:size-10 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                                            st.done
                                                ? 'bg-blue-600 text-white shadow-xs ring-2 sm:ring-4 ring-blue-50'
                                                : isCurrent
                                                ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-sm ring-2 sm:ring-4 ring-blue-100'
                                                : 'bg-white border border-slate-200 text-slate-400'
                                        }`}
                                    >
                                        {st.done ? (
                                            <Check className="size-3 sm:size-4.5 stroke-[2.5]" />
                                        ) : (
                                            <Icon className="size-3 sm:size-4.5" />
                                        )}
                                    </div>

                                    {/* Stage Tag */}
                                    <span
                                        className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tight sm:tracking-wider mt-1.5 sm:mt-3 block truncate max-w-full px-0.5 ${
                                            st.done
                                                ? 'text-blue-700'
                                                : isCurrent
                                                ? 'text-blue-600'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        {st.stage}
                                    </span>

                                    {/* Title */}
                                    <h4
                                        className={`text-[9px] sm:text-xs font-black mt-0.5 sm:mt-1 leading-tight line-clamp-1 max-w-full px-0.5 ${
                                            st.done || isCurrent ? 'text-slate-900' : 'text-slate-400'
                                        }`}
                                    >
                                        <span className="hidden sm:inline">{st.title}</span>
                                        <span className="sm:hidden">{st.shortTitle}</span>
                                    </h4>

                                    {/* Description */}
                                    <p className="hidden md:block text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                                        {st.desc}
                                    </p>

                                    {/* Status Pill */}
                                    <div className="mt-1.5 sm:mt-2.5">
                                        {st.done ? (
                                            <>
                                                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold">
                                                    Selesai
                                                </span>
                                                <span className="size-1.5 rounded-full bg-blue-600 sm:hidden block" title="Selesai" />
                                            </>
                                        ) : isCurrent ? (
                                            <>
                                                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black shadow-2xs">
                                                    Berjalan
                                                </span>
                                                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse sm:hidden block" title="Berjalan" />
                                            </>
                                        ) : (
                                            <>
                                                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                                                    Mendatang
                                                </span>
                                                <span className="size-1.5 rounded-full bg-slate-300 sm:hidden block" title="Mendatang" />
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
