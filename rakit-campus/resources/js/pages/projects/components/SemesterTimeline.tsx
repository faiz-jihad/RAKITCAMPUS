import { Award, Check, CheckCircle2, Clock, FileText, FolderKanban, GraduationCap, Sparkles } from 'lucide-react';

interface Props {
    proposalVersion: number;
    proposalStatus: string;
    implementationProgress: number;
    utsSubmission?: any;
    uasSubmission?: any;
    projectStatus: string;
}

export default function SemesterTimeline({
    proposalVersion,
    proposalStatus,
    implementationProgress,
    utsSubmission,
    uasSubmission,
    projectStatus,
}: Props) {
    const isUtsSubmitted = utsSubmission && utsSubmission.status !== 'not_started' && utsSubmission.status !== 'draft';
    const isUtsGraded = utsSubmission && utsSubmission.status === 'accepted';
    const isUasSubmitted = uasSubmission && uasSubmission.status !== 'not_started' && uasSubmission.status !== 'draft';
    const isUasGraded = uasSubmission && uasSubmission.status === 'accepted';
    const isCompleted = projectStatus === 'completed';

    const steps = [
        {
            stage: 'Tahap 1',
            title: 'Inisiasi Proposal',
            desc: proposalVersion >= 1 ? `Proposal v${proposalVersion} (${proposalStatus})` : 'Draft awal proyek',
            active: true,
            done: proposalStatus === 'approved' || proposalVersion > 1,
            icon: FileText,
        },
        {
            stage: 'Tahap 2',
            title: 'Sprint Pra-UTS',
            desc: `${implementationProgress}% fitur dibangun`,
            active: true,
            done: implementationProgress >= 40 || isUtsSubmitted,
            icon: FolderKanban,
        },
        {
            stage: 'Tahap 3',
            title: 'Evaluasi UTS',
            desc: isUtsGraded
                ? `Nilai: ${utsSubmission.total_score} (${utsSubmission.final_grade})`
                : isUtsSubmitted
                ? 'Review Dosen'
                : 'Submission Dibuka',
            active: isUtsSubmitted || implementationProgress >= 30,
            done: isUtsGraded,
            icon: GraduationCap,
        },
        {
            stage: 'Tahap 4',
            title: 'Pengembangan Lanjutan',
            desc: isUasSubmitted ? '100% Fitur Selesai' : 'Pengembangan pasca-UTS',
            active: isUtsGraded || implementationProgress >= 60,
            done: implementationProgress >= 90 || isUasSubmitted,
            icon: Sparkles,
        },
        {
            stage: 'Tahap 5',
            title: 'Evaluasi Akhir (UAS)',
            desc: isUasGraded
                ? `Nilai: ${uasSubmission.total_score} (${uasSubmission.final_grade})`
                : isUasSubmitted
                ? 'Review Final'
                : 'Belum Dikumpulkan',
            active: isUasSubmitted,
            done: isUasGraded,
            icon: Award,
        },
        {
            stage: 'Tahap 6',
            title: 'Portofolio Selesai',
            desc: isCompleted ? 'Terverifikasi' : 'Verifikasi Capstone',
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
        <div className="rounded-2xl p-6 bg-white border border-slate-200/80 shadow-xs mb-6 relative">
            {/* Header Timeline */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <Clock className="size-4" />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                        Semester Capstone Timeline
                    </h3>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-[11px] font-semibold text-slate-500">
                        Progres Keseluruhan:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70 text-xs font-black">
                        {implementationProgress}%
                    </span>
                </div>
            </div>

            {/* Stepper Horizontal Metro Track */}
            <div className="pt-6 overflow-x-auto pb-2 scrollbar-none">
                <div className="min-w-[680px] lg:min-w-0 relative">
                    {/* Background Track Line (center of step 0 to center of step 5) */}
                    <div
                        className="absolute top-5 h-1 bg-slate-100 rounded-full -translate-y-1/2 z-0"
                        style={{ left: '8.333%', right: '8.333%' }}
                    />

                    {/* Filled Progress Track Line */}
                    <div
                        className="absolute top-5 h-1 bg-blue-600 rounded-full -translate-y-1/2 transition-all duration-700 z-0"
                        style={{ left: '8.333%', width: `${progressFillPercent}%` }}
                    />

                    {/* 6 Step Nodes Grid */}
                    <div className="grid grid-cols-6 relative z-10">
                        {steps.map((st, idx) => {
                            const Icon = st.icon;
                            const isCurrent = !st.done && st.active;
                            return (
                                <div key={idx} className="flex flex-col items-center text-center px-1 group">
                                    {/* Node Circle */}
                                    <div
                                        className={`size-10 rounded-full flex items-center justify-center transition-all duration-300 relative ${
                                            st.done
                                                ? 'bg-blue-600 text-white shadow-xs ring-4 ring-blue-50'
                                                : isCurrent
                                                ? 'bg-white border-2 border-blue-600 text-blue-600 shadow-sm ring-4 ring-blue-100'
                                                : 'bg-white border border-slate-200 text-slate-400'
                                        }`}
                                    >
                                        {st.done ? (
                                            <Check className="size-4.5 stroke-[2.5]" />
                                        ) : (
                                            <Icon className="size-4.5" />
                                        )}
                                    </div>

                                    {/* Stage Tag */}
                                    <span
                                        className={`text-[10px] font-black uppercase tracking-wider mt-3 block ${
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
                                        className={`text-xs font-black mt-1 leading-tight line-clamp-1 ${
                                            st.done || isCurrent ? 'text-slate-900' : 'text-slate-400'
                                        }`}
                                    >
                                        {st.title}
                                    </h4>

                                    {/* Description */}
                                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                                        {st.desc}
                                    </p>

                                    {/* Status Pill */}
                                    <div className="mt-2.5">
                                        {st.done ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold">
                                                Selesai
                                            </span>
                                        ) : isCurrent ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black shadow-2xs">
                                                Berjalan
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                                                Mendatang
                                            </span>
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
