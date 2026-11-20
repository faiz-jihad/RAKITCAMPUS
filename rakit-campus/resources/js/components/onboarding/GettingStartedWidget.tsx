import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { FolderKanban, FolderPlus, Users2, Check, ArrowRight, X, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLocale } from '@/hooks/use-locale';

interface GettingStartedWidgetProps {
    hasProjects?: boolean;
    hasTeam?: boolean;
    className?: string;
    onDismiss?: () => void;
}

export default function GettingStartedWidget({
    hasProjects = false,
    hasTeam = false,
    className = '',
    onDismiss,
}: GettingStartedWidgetProps) {
    const { isEn } = useLocale();
    const [isDismissed, setIsDismissed] = useState(true);
    const [exploredComp, setExploredComp] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [isGuidedMode, setIsGuidedMode] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const dismissed = localStorage.getItem('rakit_onboarding_dismissed') === 'true';
        const explored = localStorage.getItem('rakit_guide_comp_explored') === 'true';
        const guideCompleted = localStorage.getItem('rakit_first_time_guide_done') === 'true';

        setIsDismissed(dismissed);
        setExploredComp(explored);

        // If user hasn't seen the 3-step intro and hasn't dismissed, show step-by-step mode first
        if (!guideCompleted && !dismissed) {
            setIsGuidedMode(true);
        }
    }, []);

    const task1Completed = exploredComp;
    const task2Completed = hasProjects;
    const task3Completed = hasTeam;

    const completedCount = [task1Completed, task2Completed, task3Completed].filter(Boolean).length;
    const allCompleted = completedCount === 3;

    // Do not show widget if dismissed or all tasks are completed
    if (isDismissed || allCompleted) {
        return null;
    }

    const handleDismiss = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('rakit_onboarding_dismissed', 'true');
        }
        setIsDismissed(true);
        if (onDismiss) onDismiss();
    };

    const handleFinishGuide = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('rakit_first_time_guide_done', 'true');
        }
        setIsGuidedMode(false);
    };

    const handleExploreClick = () => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('rakit_guide_comp_explored', 'true');
        }
        setExploredComp(true);
    };

    const steps = [
        {
            id: 'explore',
            stepNumber: 1,
            title: isEn ? 'Explore class projects' : 'Jelajahi proyek kelas',
            description: isEn ? 'Browse academic and innovation projects.' : 'Lihat beragam proyek akademik dan karya mahasiswa.',
            href: '/projects',
            icon: FolderKanban,
            completed: task1Completed,
            actionLabel: isEn ? 'Explore projects' : 'Jelajahi proyek',
            onClick: handleExploreClick,
        },
        {
            id: 'project',
            stepNumber: 2,
            title: isEn ? 'Create a project' : 'Buat proyek',
            description: isEn ? 'Turn your idea into something real.' : 'Wujudkan idemu menjadi nyata.',
            href: '/projects/create',
            icon: FolderPlus,
            completed: task2Completed,
            actionLabel: isEn ? 'Create project' : 'Buat proyek',
        },
        {
            id: 'team',
            stepNumber: 3,
            title: isEn ? 'Build your team' : 'Bentuk tim',
            description: isEn ? 'Find people to collaborate and build with.' : 'Temukan rekan untuk berkolaborasi dalam proyek.',
            href: '/projects?status=recruiting',
            icon: Users2,
            completed: task3Completed,
            actionLabel: isEn ? 'Find teammates' : 'Cari rekan',
        },
    ];

    const currentStep = steps[activeStep];
    const progressPercentage = Math.round((completedCount / 3) * 100);

    return (
        <section
            className={`rounded-[24px] bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40 border border-blue-100/80 p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all animate-in fade-in duration-200 mb-5 sm:mb-6 ${className}`}
            aria-label="Getting Started"
        >
            {/* Step-by-Step Onboarding Mode (Section 1 of requirements: Max 3 steps, 1 sentence per step, non-blocking, skip & dismiss) */}
            {isGuidedMode ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-700">
                                {isEn ? `Step ${currentStep.stepNumber} of 3` : `Langkah ${currentStep.stepNumber} dari 3`}
                            </span>
                            <div className="flex items-center gap-1">
                                {steps.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => setActiveStep(i)}
                                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                            i === activeStep ? 'w-6 bg-blue-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
                                        }`}
                                        aria-label={`Go to step ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleFinishGuide}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition px-2 py-1 rounded-lg cursor-pointer"
                            >
                                {isEn ? 'View all tasks' : 'Lihat semua tugas'}
                            </button>
                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                                title={isEn ? 'Dismiss' : 'Sembunyikan'}
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                        <div className="flex items-center gap-3.5">
                            <div className="size-11 sm:size-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <currentStep.icon className="size-5 sm:size-6" />
                            </div>
                            <div>
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                                    {currentStep.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {currentStep.description}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                            {activeStep > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveStep((prev) => prev - 1)}
                                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition cursor-pointer"
                                    aria-label="Previous step"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                            )}

                            <Link
                                href={currentStep.href}
                                onClick={currentStep.onClick}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition"
                            >
                                <span>{currentStep.actionLabel}</span>
                                <ArrowRight className="size-3.5" />
                            </Link>

                            {activeStep < 2 ? (
                                <button
                                    type="button"
                                    onClick={() => setActiveStep((prev) => prev + 1)}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 text-xs font-semibold text-slate-700 transition cursor-pointer"
                                >
                                    <span>{isEn ? 'Next' : 'Lanjut'}</span>
                                    <ChevronRight className="size-3.5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleFinishGuide}
                                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-95 text-xs font-semibold text-slate-700 transition cursor-pointer"
                                >
                                    <span>{isEn ? 'Done' : 'Selesai'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Compact Checklist Mode (Section 2 of requirements: Progress indicator, max 3 tasks, completion states, dismiss) */
                <>
                    {/* Header: Title + Progress + Dismiss */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Sparkles className="size-4" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                                        {isEn ? 'Getting Started' : 'Langkah Awal'}
                                    </h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                                        {completedCount}/3 {isEn ? 'completed' : 'selesai'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {isEn ? 'Three quick actions to kickstart your journey in RAKIT.' : 'Tiga langkah ringkas untuk memulai perjalananmu di RAKIT.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                            {/* Slim Progress Bar */}
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                                    <div
                                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
                                title={isEn ? 'Dismiss' : 'Sembunyikan'}
                            >
                                <span>{isEn ? 'Dismiss' : 'Sembunyikan'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    </div>

                    {/* 3 Action Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3.5">
                        {steps.map((task, idx) => {
                            const Icon = task.icon;
                            return (
                                <div
                                    key={task.id}
                                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                        task.completed
                                            ? 'bg-emerald-50/30 border-emerald-200/70'
                                            : 'bg-white border-slate-200/80 hover:border-blue-200 hover:shadow-xs'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div
                                            className={`size-9 rounded-xl flex items-center justify-center shrink-0 border transition ${
                                                task.completed
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                    : 'bg-slate-100/80 text-slate-700 border-slate-200/60'
                                            }`}
                                        >
                                            {task.completed ? (
                                                <Check className="size-4.5 stroke-[2.5]" />
                                            ) : (
                                                <Icon className="size-4.5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] font-bold text-slate-400">0{idx + 1}</span>
                                                <h4 className={`text-xs font-bold truncate ${task.completed ? 'text-slate-700 line-through' : 'text-slate-900'}`}>
                                                    {task.title}
                                                </h4>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                                                {task.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
                                        {task.completed ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                                <Check className="size-3" />
                                                <span>{isEn ? 'Completed' : 'Selesai'}</span>
                                            </span>
                                        ) : (
                                            <Link
                                                href={task.href}
                                                onClick={task.onClick}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                                            >
                                                <span>{task.actionLabel}</span>
                                                <ArrowRight className="size-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </section>
    );
}
