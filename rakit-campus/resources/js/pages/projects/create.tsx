import AppLayout from '@/layouts/app-layout';
import ProjectJigsawTracker from '@/components/project-jigsaw-tracker';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Compass, FolderPlus, GraduationCap, Info, Route, Users } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface EnrolledClass {
    id: number;
    name: string;
    code: string;
    target_team_size?: number;
}

interface Props {
    categories: string[];
    visibilities: string[];
    enrolledClasses?: EnrolledClass[];
    selectedClassId?: number | null;
    userHasActiveProject?: boolean;
    activeClassIds?: number[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Proyek', href: '/projects' },
    { title: 'Buat Proyek Baru', href: '/projects/create' },
];

export default function ProjectCreate({
    categories = [],
    visibilities = [],
    enrolledClasses = [],
    selectedClassId = null,
    userHasActiveProject = false,
    activeClassIds = [],
}: Props) {
    const [step, setStep] = useState<number>(1);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isMerging, setIsMerging] = useState(false);
    const [mergePhase, setMergePhase] = useState<'idle' | 'snapping' | 'fused' | 'complete'>('idle');

    const stepsList = [
        { id: 1, key: 'card-class', label: 'Jalur Proyek', icon: Route },
        { id: 2, key: 'card-info', label: 'Informasi Proyek', icon: BookOpen },
        { id: 3, key: 'card-tech', label: 'Teknologi & Tim', icon: Users },
        { id: 4, key: 'card-proposal', label: 'Proposal Inovasi', icon: FolderPlus },
    ];

    const urlClassId = typeof window !== 'undefined'
        ? Number(new URLSearchParams(window.location.search).get('academic_class_id') || 0)
        : 0;
    const preferredClassId = selectedClassId || urlClassId;
    const initialClass = preferredClassId
        ? enrolledClasses.find((cls) => Number(cls.id) === Number(preferredClassId))
        : null;
    const initialMaxCapacity = initialClass?.target_team_size || 4;

    const { data, setData } = useForm({
        academic_class_id: (initialClass ? initialClass.id : '') as string | number,
        title: '',
        team_name: '',
        short_description: '',
        description: '',
        category: categories[0] || 'academic',
        problem_statement: '',
        objectives: '',
        proposed_solution: '',
        tech_stack_input: 'Laravel, React, Tailwind CSS',
        capacity: Math.min(4, Math.max(2, initialMaxCapacity)),
        expected_weekly_hours: 10,
        starts_on: '',
        target_completion_on: '',
        visibility: 'campus',
        required_skills_input: 'Frontend: 3, Backend: 3, UI/UX: 3',
    });

    // 4 Jigsaw Cards Completion Checks
    // Selecting an academic class is optional; choosing Proyek Mandiri or an enrolled class is equally valid
    const isClassCardComplete = true;

    const isInfoCardComplete = Boolean(
        data.title.trim().length >= 3 &&
        data.short_description.trim().length >= 5
    );

    const isTechCardComplete = Boolean(
        data.tech_stack_input.trim().length >= 3
    );

    const isMandiri = !data.academic_class_id;

    // For independent projects (Proyek Mandiri), proposal card is optional (can be filled or left blank)
    const isProposalCardComplete = isMandiri
        ? true
        : Boolean(
            data.problem_statement.trim().length >= 5 ||
            data.objectives.trim().length >= 5 ||
            data.proposed_solution.trim().length >= 5
        );

    const allCompleted =
        isClassCardComplete &&
        isInfoCardComplete &&
        isTechCardComplete &&
        isProposalCardComplete;

    const scrollToCard = (cardId: string) => {
        const el = document.getElementById(cardId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-500/70', 'ring-offset-2');
            setTimeout(() => {
                el.classList.remove('ring-2', 'ring-blue-500/70', 'ring-offset-2');
            }, 1800);
        }
    };

    const selectedClass = enrolledClasses.find(
        (cls) => Number(cls.id) === Number(data.academic_class_id)
    );
    const maxClassCapacity = selectedClass?.target_team_size || 10;
    const isClassSelected = Boolean(data.academic_class_id);
    const hasActiveProjectInSelectedClass = isClassSelected && (
        activeClassIds.length > 0
            ? activeClassIds.includes(Number(data.academic_class_id))
            : userHasActiveProject
    );

    const handleClassChange = (classIdValue: string) => {
        const nextClass = enrolledClasses.find((cls) => String(cls.id) === classIdValue);
        const nextCapacity = nextClass?.target_team_size || 4;
        setData((prev) => ({
            ...prev,
            academic_class_id: classIdValue,
            capacity: nextCapacity,
        }));
        if (stepErrors.academic_class_id) {
            setStepErrors((prev) => {
                const next = { ...prev };
                delete next.academic_class_id;
                return next;
            });
        }
    };

    const validateStep = (stepNumber: number): boolean => {
        const errors: Record<string, string> = {};

        if (stepNumber === 1) {
            if (hasActiveProjectInSelectedClass) {
                errors.academic_class_id = 'Anda masih terdaftar dalam proyek aktif pada kelas ini. Selesaikan proyek sebelumnya atau pilih opsi Proyek Mandiri.';
            }
        } else if (stepNumber === 2) {
            if (!data.title.trim()) {
                errors.title = 'Judul proyek wajib diisi.';
            } else if (data.title.trim().length < 3) {
                errors.title = 'Judul proyek minimal 3 karakter.';
            }

            if (!data.short_description.trim()) {
                errors.short_description = 'Ringkasan singkat proyek wajib diisi.';
            } else if (data.short_description.trim().length < 5) {
                errors.short_description = 'Ringkasan singkat minimal 5 karakter.';
            }

            if (!data.category) {
                errors.category = 'Kategori proyek wajib dipilih.';
            }
        } else if (stepNumber === 3) {
            if (!data.tech_stack_input.trim()) {
                errors.tech_stack_input = 'Stack teknologi minimal 1 (contoh: Laravel, React).';
            } else if (data.tech_stack_input.trim().length < 3) {
                errors.tech_stack_input = 'Stack teknologi minimal 3 karakter.';
            }
        }

        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStepErrors({});
            setStep((prev) => Math.min(4, prev + 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        setStepErrors({});
        setStep((prev) => Math.max(1, prev - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleJumpToStep = (targetStep: number) => {
        if (targetStep > step) {
            if (!validateStep(step)) return;
        }
        setStepErrors({});
        setStep(targetStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleTrackerCardClick = (cardId: string) => {
        const target = stepsList.find((s) => s.key === cardId);
        if (target) {
            handleJumpToStep(target.id);
        }
    };

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();

        // Validate all preceding steps
        if (!validateStep(1)) {
            setStep(1);
            return;
        }
        if (!validateStep(2)) {
            setStep(2);
            return;
        }
        if (!validateStep(3)) {
            setStep(3);
            return;
        }

        setSubmitting(true);
        setErrorMessage(null);

        const startTime = Date.now();
        const minAnimationDuration = allCompleted ? 2000 : 0;

        if (allCompleted) {
            setIsMerging(true);
            setMergePhase('snapping');
            setTimeout(() => setMergePhase('fused'), 550);
            setTimeout(() => setMergePhase('complete'), 1150);
        }

        const tech_stack = data.tech_stack_input
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        const required_skills = data.required_skills_input
            .split(',')
            .map((s) => {
                const parts = s.split(':');
                return {
                    name: parts[0]?.trim() || '',
                    min_proficiency: parseInt(parts[1]?.trim() || '1', 10),
                };
            })
            .filter((s) => s.name);

        try {
            const res = await fetch('/projects', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    academic_class_id: data.academic_class_id || null,
                    title: data.title,
                    team_name: data.team_name || null,
                    short_description: data.short_description,
                    description: data.description,
                    category: data.category,
                    problem_statement: data.problem_statement,
                    objectives: data.objectives,
                    proposed_solution: data.proposed_solution,
                    tech_stack,
                    capacity: selectedClass?.target_team_size || Math.min(Math.max(2, data.capacity), maxClassCapacity),
                    expected_weekly_hours: data.expected_weekly_hours,
                    starts_on: data.starts_on || null,
                    target_completion_on: data.target_completion_on || null,
                    visibility: data.visibility,
                    required_skills,
                }),
            });

            if (res.redirected) {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, minAnimationDuration - elapsed);
                setTimeout(() => {
                    window.location.href = res.url;
                }, remaining);
                return;
            }

            const json = await res.json();

            if (res.ok) {
                const targetId = json.data?.id;
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, minAnimationDuration - elapsed);

                setTimeout(() => {
                    if (targetId) {
                        window.location.href = `/projects/${targetId}`;
                    } else {
                        window.location.href = '/projects';
                    }
                }, remaining);
                return;
            } else if (res.status === 401) {
                window.location.href = '/login';
            } else {
                setIsMerging(false);
                setMergePhase('idle');
                setSubmitting(false);
                const firstFieldError = json.errors
                    ? (Object.values(json.errors).flat()[0] as string | undefined)
                    : undefined;
                setErrorMessage(
                    firstFieldError ||
                        json.message ||
                        'Gagal membuat proyek. Silakan periksa kembali isian formulir.'
                );
            }
        } catch {
            setIsMerging(false);
            setMergePhase('idle');
            setSubmitting(false);
            setErrorMessage('Terjadi kendala jaringan saat menghubungi server. Silakan coba kembali.');
        } finally {
            if (!allCompleted) {
                setSubmitting(false);
            }
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} activeTab="dashboard" title="Buat Proyek Baru — Project Hub">
            <div className="max-w-7xl mx-auto pt-6 sm:pt-8 md:pt-10 pb-12 space-y-8">
                {/* Active Project Rule 1 Notice: Hanya aktif untuk proyek yang memasukkan kelas pada jalur proyek */}
                {hasActiveProjectInSelectedClass && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex items-start gap-3">
                        <div className="size-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center shrink-0 mt-0.5">
                            <Info className="size-4" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="font-bold text-slate-900">Aturan 1 Mahasiswa 1 Proyek Aktif</p>
                            <p className="text-slate-600 leading-relaxed">
                                Saat ini Anda masih terdaftar dalam proyek aktif pada kelas perkuliahan ini. Selesaikan proyek yang sedang berjalan terlebih dahulu sebelum membentuk kelompok proyek baru di kelas ini.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                        {errorMessage}
                    </div>
                )}

                {/* Main 2-Column Grid: Left (Multi-Step Form Wizard) & Right (2x2 Jigsaw Tracker) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                    {/* Left Column: Multi-Step Form Wizard */}
                    <div className="lg:col-span-7 xl:col-span-7">
                        <form onSubmit={submit} className="space-y-8">
                            {/* Step 1: Project Pathway & Class Selection */}
                            {step === 1 && (
                                <div id="card-class" className="space-y-6 transition-all duration-300 animate-in fade-in">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                            Bagaimana jalur pengerjaan proyek Anda?
                                        </h2>
                                    </div>

                                    {/* 2 Big Interactive Selection Tiles */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                        {/* Tile A: Proyek Mandiri */}
                                        <div
                                            onClick={() => handleClassChange('')}
                                            className={`p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative flex flex-col justify-between group ${
                                                !data.academic_class_id
                                                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                                                    : 'border-slate-200 bg-white text-slate-900 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-md'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`size-11 rounded-xl flex items-center justify-center transition-colors ${
                                                        !data.academic_class_id
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-blue-50 text-blue-600 group-hover:bg-white/20 group-hover:text-white'
                                                    }`}>
                                                        <Compass className="size-5.5" />
                                                    </div>
                                                </div>

                                                <h3 className={`text-base font-bold transition-colors ${
                                                    !data.academic_class_id ? 'text-white' : 'text-slate-900 group-hover:text-white'
                                                }`}>
                                                    Proyek Mandiri
                                                </h3>
                                                <p className={`text-xs mt-1.5 leading-relaxed transition-colors ${
                                                    !data.academic_class_id ? 'text-blue-100' : 'text-slate-500 group-hover:text-blue-100'
                                                }`}>
                                                    Eksplorasi bebas tanpa batasan dosen pengampu kelas. Cocok untuk portofolio, riset terbuka, atau persiapan kompetisi.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tile B: Kelas Perkuliahan */}
                                        <div
                                            onClick={() => {
                                                if (enrolledClasses.length > 0 && !data.academic_class_id) {
                                                    handleClassChange(String(enrolledClasses[0].id));
                                                }
                                            }}
                                            className={`p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer relative flex flex-col justify-between group ${
                                                data.academic_class_id
                                                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                                                    : 'border-slate-200 bg-white text-slate-900 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-md'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`size-11 rounded-xl flex items-center justify-center transition-colors ${
                                                        data.academic_class_id
                                                            ? 'bg-white/20 text-white'
                                                            : 'bg-blue-50 text-blue-600 group-hover:bg-white/20 group-hover:text-white'
                                                    }`}>
                                                        <GraduationCap className="size-5.5" />
                                                    </div>
                                                </div>

                                                <h3 className={`text-base font-bold transition-colors ${
                                                    data.academic_class_id ? 'text-white' : 'text-slate-900 group-hover:text-white'
                                                }`}>
                                                    Kelas Perkuliahan
                                                </h3>
                                                <p className={`text-xs mt-1.5 leading-relaxed transition-colors ${
                                                    data.academic_class_id ? 'text-blue-100' : 'text-slate-500 group-hover:text-blue-100'
                                                }`}>
                                                    Terhubung ke dashboard dosen pengampu kelas untuk persetujuan kelompok, bimbingan, evaluasi UTS, dan nilai semester.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-Selection: If Academic Class is selected */}
                                    {data.academic_class_id && (
                                        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3 animate-in fade-in">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold text-slate-900 block">
                                                    Pilih Kelas yang Anda Ikuti:
                                                </label>
                                                <span className="text-[11px] text-slate-500 font-medium">
                                                    {enrolledClasses.length} Kelas Tersedia
                                                </span>
                                            </div>

                                            {enrolledClasses.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {enrolledClasses.map((cls) => {
                                                        const isSelected = String(cls.id) === String(data.academic_class_id);
                                                        const hasActiveInThisClass = activeClassIds.includes(Number(cls.id));

                                                        return (
                                                            <div
                                                                key={cls.id}
                                                                onClick={() => handleClassChange(String(cls.id))}
                                                                className={`p-3.5 rounded-xl border-2 text-xs transition-all duration-200 cursor-pointer flex items-start justify-between gap-2.5 group ${
                                                                    isSelected
                                                                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                                                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-xs'
                                                                }`}
                                                            >
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${
                                                                            isSelected
                                                                                ? 'bg-white/20 text-white border border-white/30'
                                                                                : 'bg-blue-50 text-blue-700 border border-blue-200/80 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30'
                                                                        }`}>
                                                                            {cls.code}
                                                                        </span>
                                                                        {cls.target_team_size && (
                                                                            <span className={`text-[10px] transition-colors ${
                                                                                isSelected ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-100'
                                                                            }`}>
                                                                                Maks {cls.target_team_size} orang
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className={`font-bold leading-snug truncate transition-colors ${
                                                                        isSelected ? 'text-white' : 'text-slate-900 group-hover:text-white'
                                                                    }`}>
                                                                        {cls.name}
                                                                    </p>
                                                                    {hasActiveInThisClass && (
                                                                        <span className={`text-[10px] font-semibold block mt-1 transition-colors ${
                                                                            isSelected ? 'text-rose-200' : 'text-rose-600 group-hover:text-rose-200'
                                                                        }`}>
                                                                            Sudah Ada Proyek Aktif
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                                                    Anda belum terdaftar di kelas perkuliahan aktif.{' '}
                                                    <Link href="/classes" className="text-blue-600 font-semibold hover:underline">
                                                        Gabung ke Ruang Kelas
                                                    </Link>
                                                </div>
                                            )}

                                            {stepErrors.academic_class_id && (
                                                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5 pt-1">
                                                    <AlertCircle className="size-3.5 shrink-0" />
                                                    <span>{stepErrors.academic_class_id}</span>
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Core Project Details */}
                            {step === 2 && (
                                <div id="card-info" className="space-y-6 transition-all duration-300 animate-in fade-in">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                            Ceritakan tentang proyek yang akan dibangun
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                Judul Proyek <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.title}
                                                onChange={(e) => {
                                                    setData('title', e.target.value);
                                                    if (stepErrors.title) {
                                                        setStepErrors((prev) => {
                                                            const next = { ...prev };
                                                            delete next.title;
                                                            return next;
                                                        });
                                                    }
                                                }}
                                                placeholder="Contoh: Sistem Informasi Presensi Cerdas Berbasis Lokasi & AI"
                                                required
                                                className={`w-full px-4 py-3 rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs ${
                                                    stepErrors.title ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                                                }`}
                                            />
                                            {stepErrors.title && (
                                                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5 mt-1.5">
                                                    <AlertCircle className="size-3.5 shrink-0" />
                                                    <span>{stepErrors.title}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                Nama Tim Proyek <span className="text-slate-400 font-normal">(Opsional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.team_name}
                                                onChange={(e) => setData('team_name', e.target.value)}
                                                placeholder="Contoh: Tim Inovasi Alpha, Garuda Dev Team"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                            />
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                Opsional. Jika dikosongkan, nama tim otomatis dinamai: <em>[Judul Proyek] Core Team</em>.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                Ringkasan Singkat <span className="text-rose-500">*</span>
                                            </label>
                                            <textarea
                                                value={data.short_description}
                                                onChange={(e) => {
                                                    setData('short_description', e.target.value);
                                                    if (stepErrors.short_description) {
                                                        setStepErrors((prev) => {
                                                            const next = { ...prev };
                                                            delete next.short_description;
                                                            return next;
                                                        });
                                                    }
                                                }}
                                                placeholder="Ringkasan 1-2 kalimat mengenai fokus solusi dan target hasil proyek."
                                                required
                                                rows={2}
                                                className={`w-full px-4 py-3 rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs ${
                                                    stepErrors.short_description ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                                                }`}
                                            />
                                            {stepErrors.short_description && (
                                                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5 mt-1.5">
                                                    <AlertCircle className="size-3.5 shrink-0" />
                                                    <span>{stepErrors.short_description}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                    Kategori Proyek <span className="text-rose-500">*</span>
                                                </label>
                                                <select
                                                    value={data.category}
                                                    onChange={(e) => setData('category', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                                >
                                                    {categories.map((c) => (
                                                        <option key={c} value={c}>
                                                            {c.replace('_', ' ').toUpperCase()}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                                                    <span>Kapasitas Tim</span>
                                                    {selectedClass ? (
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                            Aturan Dosen
                                                        </span>
                                                    ) : null}
                                                </label>
                                                {selectedClass ? (
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            disabled
                                                            value={`${selectedClass.target_team_size || 4} Orang / Tim`}
                                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-xs font-bold text-slate-800 cursor-not-allowed"
                                                        />
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min={2}
                                                        max={10}
                                                        value={data.capacity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value, 10) || 2;
                                                            setData('capacity', Math.min(Math.max(2, val), 10));
                                                        }}
                                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                                    />
                                                )}
                                                <p className="text-[11px] text-slate-400 mt-1">
                                                    {selectedClass
                                                        ? `Ditetapkan oleh Dosen di kelas ${selectedClass.name}.`
                                                        : 'Jumlah maksimal anggota dalam kelompok ini.'}
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                    Akses Visibilitas
                                                </label>
                                                <select
                                                    value={data.visibility}
                                                    onChange={(e) => setData('visibility', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                                >
                                                    <option value="campus">Satu Kampus</option>
                                                    <option value="public">Publik</option>
                                                    <option value="private">Khusus Undangan</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Tech Stack & Required Skills */}
                            {step === 3 && (
                                <div id="card-tech" className="space-y-6 transition-all duration-300 animate-in fade-in">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                            Teknologi apa yang akan digunakan?
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                Stack Teknologi (Pisahkan koma) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={data.tech_stack_input}
                                                onChange={(e) => {
                                                    setData('tech_stack_input', e.target.value);
                                                    if (stepErrors.tech_stack_input) {
                                                        setStepErrors((prev) => {
                                                            const next = { ...prev };
                                                            delete next.tech_stack_input;
                                                            return next;
                                                        });
                                                    }
                                                }}
                                                placeholder="Contoh: Laravel, React, Tailwind CSS, PostgreSQL"
                                                className={`w-full px-4 py-3 rounded-xl border bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs ${
                                                    stepErrors.tech_stack_input ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                                                }`}
                                            />
                                            {stepErrors.tech_stack_input ? (
                                                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5 mt-1.5">
                                                    <AlertCircle className="size-3.5 shrink-0" />
                                                    <span>{stepErrors.tech_stack_input}</span>
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-slate-400 mt-1">
                                                    Digunakan sistem untuk mencocokkan keahlian anggota tim sekelas.
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                Keahlian yang Dibutuhkan (Format: Nama: Level 1-5, pisahkan koma)
                                            </label>
                                            <input
                                                type="text"
                                                value={data.required_skills_input}
                                                onChange={(e) => setData('required_skills_input', e.target.value)}
                                                placeholder="Contoh: UI/UX Design: 3, Backend: 4, Research: 3"
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                            />
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                Memberi sinyal kepada calon anggota tentang kompetensi yang diharapkan dalam proyek.
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                Deskripsi Rencana Pengerjaan (Opsional)
                                            </label>
                                            <textarea
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                rows={3}
                                                placeholder="Jelaskan gambaran umum perancangan, pembagian tugas awal, atau metodologi yang akan digunakan."
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Living Proposal Awal (Draft v1) */}
                            {step === 4 && (
                                <div id="card-proposal" className="space-y-6 transition-all duration-300 animate-in fade-in">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                            Proposal inovasi & target luaran awal{isMandiri && (
                                                <span className="text-slate-400 font-normal text-base ml-2">(Opsional)</span>
                                            )}
                                        </h2>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                Rumusan Masalah
                                            </label>
                                            <textarea
                                                value={data.problem_statement}
                                                onChange={(e) => setData('problem_statement', e.target.value)}
                                                rows={2}
                                                placeholder="Masalah utama atau kendala nyata yang ingin diselesaikan oleh proyek ini."
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                    Tujuan Proyek
                                                </label>
                                                <textarea
                                                    value={data.objectives}
                                                    onChange={(e) => setData('objectives', e.target.value)}
                                                    rows={3}
                                                    placeholder="Target luaran atau manfaat yang ingin dicapai pada akhir semester."
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                    Solusi yang Ditawarkan
                                                </label>
                                                <textarea
                                                    value={data.proposed_solution}
                                                    onChange={(e) => setData('proposed_solution', e.target.value)}
                                                    rows={3}
                                                    placeholder="Gambaran sistem, fitur utama, atau pendekatan teknis yang diusulkan."
                                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                    Komitmen (Jam / Minggu)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={40}
                                                    value={data.expected_weekly_hours}
                                                    onChange={(e) => setData('expected_weekly_hours', parseInt(e.target.value, 10) || 10)}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                    Tanggal Mulai (Opsional)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.starts_on}
                                                    onChange={(e) => setData('starts_on', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                                                    Target Selesai (Opsional)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.target_completion_on}
                                                    onChange={(e) => setData('target_completion_on', e.target.value)}
                                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition shadow-2xs"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Wizard Bottom Actions */}
                            <div className="flex items-center justify-between gap-3 pt-6 border-t border-slate-200/80">
                                {step > 1 ? (
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Kembali</span>
                                    </button>
                                ) : (
                                    <Link
                                        href="/projects"
                                        className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-2xs hover:shadow-xs"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Kembali</span>
                                    </Link>
                                )}

                                <div className="flex items-center gap-2">
                                    {step < 4 ? (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 flex items-center gap-2 cursor-pointer"
                                        >
                                            <span>Lanjut</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={submitting || hasActiveProjectInSelectedClass}
                                            title={hasActiveProjectInSelectedClass ? 'Anda sudah memiliki proyek aktif di kelas perkuliahan ini' : undefined}
                                            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    <span>Menyimpan Proyek...</span>
                                                </>
                                            ) : (
                                                <span>Simpan & Buka Tim</span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Sticky 2x2 Jigsaw Tracker */}
                    <div className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-28 flex flex-col items-center justify-center pt-2 lg:pt-6 order-first lg:order-last">
                        <ProjectJigsawTracker
                            classComplete={isClassCardComplete}
                            infoComplete={isInfoCardComplete}
                            techComplete={isTechCardComplete}
                            proposalComplete={isProposalCardComplete}
                            onScrollToCard={handleTrackerCardClick}
                            isMerging={isMerging}
                            mergePhase={mergePhase}
                            isMandiri={!data.academic_class_id}
                            currentStep={step}
                        />
                    </div>
                </div>
    </div>
</AppLayout>
    );
}
