import { CheckCircle2, Clock, FileText, FolderKanban, GraduationCap, Sparkles, Award } from 'lucide-react';

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
            title: '1. Inisiasi Proposal (v1)',
            desc: proposalVersion >= 1 ? `Proposal v${proposalVersion} (${proposalStatus})` : 'Draft awal proyek',
            active: true,
            done: proposalStatus === 'approved' || proposalVersion > 1,
            icon: FileText,
        },
        {
            title: '2. Sprint Pra-UTS',
            desc: `${implementationProgress}% fitur dibangun`,
            active: true,
            done: implementationProgress >= 40 || isUtsSubmitted,
            icon: FolderKanban,
        },
        {
            title: '3. Evaluasi UTS',
            desc: isUtsGraded ? `Nilai: ${utsSubmission.total_score} (${utsSubmission.final_grade})` : isUtsSubmitted ? 'Menunggu Review Dosen' : 'Submission Dibuka',
            active: isUtsSubmitted || implementationProgress >= 30,
            done: isUtsGraded,
            icon: GraduationCap,
        },
        {
            title: '4. Pengembangan Lanjutan',
            desc: isUasSubmitted ? '100% Fitur Selesai' : 'Pengembangan pasca-UTS',
            active: isUtsGraded || implementationProgress >= 60,
            done: implementationProgress >= 90 || isUasSubmitted,
            icon: Sparkles,
        },
        {
            title: '5. Evaluasi Akhir (UAS)',
            desc: isUasGraded ? `Nilai: ${uasSubmission.total_score} (${uasSubmission.final_grade})` : isUasSubmitted ? 'Menunggu Penilaian Final' : 'Belum Dikumpulkan',
            active: isUasSubmitted,
            done: isUasGraded,
            icon: Award,
        },
        {
            title: '6. Portofolio Selesai',
            desc: isCompleted ? 'Terverifikasi & Selesai' : 'Verifikasi Capstone',
            active: isCompleted,
            done: isCompleted,
            icon: CheckCircle2,
        },
    ];

    return (
        <div className="glass-card rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock className="size-4 text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Semester Capstone Timeline (Continuous Development)
                    </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                    Progres Keseluruhan: <strong className="text-blue-600 font-bold">{implementationProgress}%</strong>
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {steps.map((st, idx) => {
                    const Icon = st.icon;
                    return (
                        <div
                            key={idx}
                            className={`p-3 rounded-xl border flex flex-col justify-between transition ${
                                st.done
                                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                                    : st.active
                                    ? 'bg-blue-50/60 border-blue-200 text-blue-900 shadow-2xs'
                                    : 'bg-slate-50/50 border-slate-200/70 text-slate-400'
                            }`}
                        >
                            <div className="flex items-center justify-between gap-1 mb-2">
                                <span className="text-[10px] font-black uppercase tracking-wider">
                                    Tahap {idx + 1}
                                </span>
                                <Icon className={`size-3.5 shrink-0 ${st.done ? 'text-emerald-600' : st.active ? 'text-blue-600' : 'text-slate-400'}`} />
                            </div>
                            <div>
                                <h4 className="text-xs font-bold leading-tight">
                                    {st.title}
                                </h4>
                                <p className="text-[10px] opacity-80 mt-1 line-clamp-1">
                                    {st.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
