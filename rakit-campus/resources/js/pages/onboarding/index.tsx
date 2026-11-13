import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Briefcase,
    Check,
    CheckCircle2,
    Eye,
    Globe,
    GraduationCap,
    LoaderCircle,
    Lock,
    Phone,
    Plus,
    Sparkles,
    User,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PIECE_PATHS, BOARD_WIDTH, BOARD_HEIGHT } from '@/components/animated-jigsaw-background';

interface CurrentUser {
    id: number;
    name: string;
    email: string;
    nim?: string;
    academic_status: 'tpb' | 'prodi';
    department: string;
    study_program: string;
    batch_year: string;
    semester: number;
    bio: string;
    phone: string;
    portfolio_url: string;
    preferred_roles: string[];
    skills: string[];
    experience: string;
    is_onboarded: boolean;
}

interface CampusInfo {
    id?: number;
    name: string;
    slug?: string;
    programs?: string[];
}

interface CampusItem {
    id: number;
    name: string;
    slug: string;
    programs: string[];
}

interface Props {
    currentUser: CurrentUser;
    campus: CampusInfo;
    campuses?: CampusItem[];
    popularSkills: string[];
}

export default function OnboardingIndex({
    currentUser,
    campus,
    campuses = [],
    popularSkills,
}: Props) {
    const [step, setStep] = useState<number>(1);
    const [submitting, setSubmitting] = useState(false);
    const [showMobilePreview, setShowMobilePreview] = useState(false);

    // Form States
    const [name, setName] = useState(currentUser.name || '');
    const [nim, setNim] = useState(currentUser.nim || '');
    const [nimError, setNimError] = useState<string | null>(null);
    const [checkingNim, setCheckingNim] = useState(false);
    const [academicStatus, setAcademicStatus] = useState<'tpb' | 'prodi'>(
        currentUser.academic_status || 'prodi'
    );
    const [department, setDepartment] = useState(
        currentUser.department || 'Teknologi Informasi'
    );

    // Dynamic Campus States
    const [selectedCampusId, setSelectedCampusId] = useState<number | 'other'>(
        campus.id || campuses[0]?.id || 1
    );
    const [customCampusName, setCustomCampusName] = useState('');

    const selectedCampus = useMemo(() => {
        if (selectedCampusId === 'other') return null;
        return (
            campuses.find((c) => c.id === selectedCampusId) ||
            (campus.id === selectedCampusId ? campus : campuses[0] || null)
        );
    }, [campuses, selectedCampusId, campus]);

    const availablePrograms = useMemo(() => {
        if (selectedCampusId === 'other') return [];
        return selectedCampus?.programs || campus.programs || [];
    }, [selectedCampus, selectedCampusId, campus.programs]);

    // Dynamic Study Program States
    const [studyProgram, setStudyProgram] = useState(
        currentUser.study_program || (availablePrograms[0] ?? 'Teknik Informatika')
    );
    const [isCustomProgram, setIsCustomProgram] = useState(
        Boolean(
            currentUser.study_program &&
            availablePrograms.length > 0 &&
            !availablePrograms.includes(currentUser.study_program)
        )
    );
    const [customProgramInput, setCustomProgramInput] = useState(
        currentUser.study_program &&
        availablePrograms.length > 0 &&
        !availablePrograms.includes(currentUser.study_program)
            ? currentUser.study_program
            : ''
    );

    const handleCampusChange = (newVal: string) => {
        if (newVal === 'other') {
            setSelectedCampusId('other');
            setIsCustomProgram(true);
        } else {
            const idNum = Number(newVal);
            setSelectedCampusId(idNum);
            const target = campuses.find((c) => c.id === idNum);
            const progs = target?.programs || [];
            if (progs.length > 0) {
                if (!progs.includes(studyProgram)) {
                    setIsCustomProgram(false);
                    setStudyProgram(progs[0]);
                } else {
                    setIsCustomProgram(false);
                }
            } else {
                setIsCustomProgram(true);
            }
        }
    };

    const selectProgram = (progName: string) => {
        setIsCustomProgram(false);
        setStudyProgram(progName);
    };

    const selectCustomProgramMode = () => {
        setIsCustomProgram(true);
        if (customProgramInput.trim()) {
            setStudyProgram(customProgramInput.trim());
        }
    };

    const handleCustomProgramInputChange = (val: string) => {
        setCustomProgramInput(val);
        setStudyProgram(val);
    };

    const currentCampusName = useMemo(() => {
        if (selectedCampusId === 'other') {
            return customCampusName.trim() || 'Kampus Lainnya';
        }
        return selectedCampus?.name || campus.name || 'Perguruan Tinggi';
    }, [selectedCampusId, customCampusName, selectedCampus, campus.name]);

    const [batchYear, setBatchYear] = useState(currentUser.batch_year || '2024');

    const batchYearOptions = useMemo(() => {
        const defaultYears = [
            '2026',
            '2025',
            '2024',
            '2023',
            '2022',
            '2021',
            '2020',
            '2019',
            '2018',
            '2017',
            '2016',
            '2015',
            'Sebelum 2015',
        ];
        if (batchYear && !defaultYears.includes(batchYear)) {
            return [batchYear, ...defaultYears];
        }
        return defaultYears;
    }, [batchYear]);
    const [semester, setSemester] = useState<number>(currentUser.semester || 1);

    const [preferredRole, setPreferredRole] = useState<string>(
        currentUser.preferred_roles?.[0] || 'Developer'
    );
    const [selectedSkills, setSelectedSkills] = useState<string[]>(
        currentUser.skills?.length > 0 ? currentUser.skills : []
    );
    const [customSkillInput, setCustomSkillInput] = useState('');

    const [bio, setBio] = useState(currentUser.bio || '');
    const [hasNoExperience, setHasNoExperience] = useState(
        currentUser.experience ? currentUser.experience.toLowerCase().includes('belum ada') : false
    );
    const [experience, setExperience] = useState(
        currentUser.experience || ''
    );
    const [portfolioUrl, setPortfolioUrl] = useState(
        currentUser.portfolio_url || ''
    );
    const [phone, setPhone] = useState(currentUser.phone || '');

    // Initials for avatar
    const initials = useMemo(() => {
        if (!name.trim()) return '-';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }, [name]);

    // Subtitle preview
    const previewSubtitle = useMemo(() => {
        const prodi = studyProgram.trim();
        if (!prodi) {
            return `Angkatan ${batchYear || '2024'}`;
        }
        return `${prodi} • Angkatan ${batchYear || '2024'}`;
    }, [studyProgram, batchYear]);

    // Reusable Profile Card Renderer (for Desktop Preview, Mobile Sheet, and Step 5 Review)
    const renderProfileCard = () => (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xl sm:shadow-2xl shadow-black/40 border border-slate-200/80 sm:border-white/20 space-y-4 text-slate-900">
            {/* Avatar & Name */}
            <div className="flex items-center gap-3.5">
                <div className="size-12 sm:size-14 rounded-2xl bg-blue-600 text-white font-extrabold text-lg sm:text-xl flex items-center justify-center shrink-0 shadow-xs">
                    {initials}
                </div>
                <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
                        {name.trim() || '-'}
                    </h4>
                    <p className="text-xs text-slate-600 truncate mt-0.5 font-medium">
                        {previewSubtitle}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <GraduationCap className="size-3 text-slate-400 shrink-0" />
                        <span>{currentCampusName}</span>
                    </p>
                </div>
            </div>

            {/* Bio Section */}
            <div className="space-y-1">
                <span className="text-xs text-slate-500 block font-medium">
                    Bio
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                    {bio.trim() || '-'}
                </p>
            </div>

            {/* Skill Section */}
            <div className="space-y-1.5">
                <span className="text-xs text-slate-500 block font-medium">
                    Skill
                </span>
                {selectedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                        {selectedSkills.map((sk) => (
                            <span
                                key={sk}
                                className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-[11px] font-semibold"
                            >
                                {sk}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-slate-400 italic">
                        Belum memilih keahlian
                    </p>
                )}
            </div>

            {/* Experience Section */}
            <div className="space-y-1">
                <span className="text-xs text-slate-500 block font-medium">
                    Pengalaman lomba & proyek
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                    {hasNoExperience
                        ? 'Belum ada pengalaman'
                        : experience.trim() || '-'}
                </p>
            </div>

            {/* Lock / Contact Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <Lock className="size-3.5 text-slate-400 shrink-0" />
                <span>
                    Kontak kebuka pas diajak diskusi
                </span>
            </div>
        </div>
    );

    // Toggle skill selection
    const toggleSkill = (skill: string) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter((s) => s !== skill));
        } else {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    const addCustomSkill = () => {
        const trimmed = customSkillInput.trim();
        if (trimmed && !selectedSkills.includes(trimmed)) {
            setSelectedSkills([...selectedSkills, trimmed]);
            setCustomSkillInput('');
        }
    };

    const checkNimAvailability = async (nimValue: string): Promise<boolean> => {
        const trimmed = nimValue.trim();
        if (!trimmed) {
            setNimError('NIM wajib diisi.');
            return false;
        }
        if (!/^\d+$/.test(trimmed)) {
            setNimError('NIM hanya boleh berisi angka.');
            return false;
        }
        if (trimmed.length < 7) {
            setNimError('NIM minimal 7 digit angka.');
            return false;
        }

        setCheckingNim(true);
        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/onboarding/check-nim', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ nim: trimmed }),
            });

            if (res.ok) {
                const data = await res.json();
                if (!data.available) {
                    setNimError(data.message || 'NIM sudah terdaftar oleh mahasiswa lain.');
                    setCheckingNim(false);
                    return false;
                }
            }
            setNimError(null);
            setCheckingNim(false);
            return true;
        } catch (err) {
            setCheckingNim(false);
            return true;
        }
    };

    const handleNext = async () => {
        if (step === 1) {
            if (!name.trim()) {
                alert('Nama lengkap wajib diisi.');
                return;
            }
            const isNimValid = await checkNimAvailability(nim);
            if (!isNimValid) {
                return;
            }
        }
        if (step === 2) {
            if (selectedCampusId === 'other' && !customCampusName.trim()) {
                alert('Silakan tulis nama Kampus / Perguruan Tinggi kamu.');
                return;
            }
            if (!studyProgram.trim()) {
                alert('Silakan pilih atau tulis Program Studi kamu.');
                return;
            }
        }
        if (step < 5) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSkip = () => {
        router.post('/onboarding/skip');
    };

    const handleSubmit = () => {
        if (submitting) return;

        // Front-end sanity validation before submission
        if (!name.trim()) {
            alert('Nama lengkap wajib diisi pada Langkah 1.');
            setStep(1);
            return;
        }
        if (!nim.trim()) {
            alert('NIM wajib diisi pada Langkah 1.');
            setStep(1);
            return;
        }
        if (!studyProgram.trim()) {
            alert('Program studi wajib dipilih pada Langkah 2.');
            setStep(2);
            return;
        }

        setSubmitting(true);
        router.post(
            '/onboarding',
            {
                name: name.trim(),
                campus_id: selectedCampusId === 'other' ? null : selectedCampusId,
                custom_campus_name: selectedCampusId === 'other' ? customCampusName.trim() : null,
                student_number: nim.trim(),
                academic_status: 'prodi',
                department: department.trim() || 'Teknologi Informasi',
                study_program: studyProgram.trim(),
                batch_year: batchYear,
                semester: semester,
                preferred_roles: [preferredRole],
                skills: selectedSkills,
                bio: bio.trim(),
                experience: hasNoExperience ? 'Belum ada pengalaman' : experience.trim(),
                portfolio_url: portfolioUrl.trim(),
                phone: phone.trim(),
            },
            {
                onError: (errors: Record<string, string>) => {
                    setSubmitting(false);
                    const errorMessages = Object.values(errors);
                    if (errorMessages.length > 0) {
                        alert(`Gagal menyimpan biodata:\n• ${errorMessages.join('\n• ')}`);
                    }

                    if (errors.name || errors.student_number) {
                        if (errors.student_number) setNimError(errors.student_number);
                        setStep(1);
                    } else if (errors.campus_id || errors.custom_campus_name || errors.study_program || errors.batch_year) {
                        setStep(2);
                    } else if (errors.skills || errors.preferred_roles) {
                        setStep(3);
                    } else if (errors.bio || errors.experience) {
                        setStep(4);
                    } else if (errors.phone || errors.portfolio_url) {
                        setStep(5);
                    }
                },
                onFinish: () => setSubmitting(false),
            }
        );
    };

    const stepsList = [
        { id: 1, label: 'Identitas' },
        { id: 2, label: 'Kampus' },
        { id: 3, label: 'Skill' },
        { id: 4, label: 'Pengalaman' },
        { id: 5, label: 'Kontak' },
    ];

    const roleOptions = [
        { id: 'Developer', label: 'Developer / Hacker', desc: 'Frontend, Backend, Mobile, AI/ML' },
        { id: 'Designer', label: 'UI/UX / Hipster', desc: 'Product Design, Figma, Wireframe' },
        { id: 'Hustler', label: 'Bisnis / Hustler', desc: 'Pitching, Business Model, Strategy' },
        { id: 'Peneliti', label: 'Peneliti / Riset', desc: 'Karya Tulis Ilmiah, PKM, Analisis Data' },
    ];

    return (
        <div className="min-h-screen lg:h-screen w-full bg-white text-slate-900 flex flex-col lg:flex-row selection:bg-blue-600 selection:text-white font-sans overflow-x-hidden lg:overflow-hidden relative">
            <Head title="Lengkapi Biodata — RakitCampus" />

            {/* Global Light Theme Lock, Custom Plus Jakarta Sans Font & Zero Horizontal Scroll */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');

                #nprogress,
                #nprogress .bar,
                #nprogress .peg,
                #nprogress .spinner {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    height: 0 !important;
                }

                html, body, #app, button, input, textarea, select, h1, h2, h3, h4, p, span, a {
                    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif !important;
                }
                .font-serif {
                    font-family: 'Playfair Display', Georgia, serif !important;
                }
                html, body {
                    background-color: #FFFFFF !important;
                    overflow-x: hidden !important;
                    margin: 0;
                    padding: 0;
                }
                @media (min-width: 1024px) {
                    html, body {
                        height: 100% !important;
                        overflow: hidden !important;
                    }
                }
            `}</style>

            {/* ============================================================== */}
            {/* LEFT SIDE: WIZARD FORM (FULL SCREEN EDGE-TO-EDGE)              */}
            {/* ============================================================== */}
            <div className="w-full lg:w-[58%] xl:w-[60%] min-h-screen lg:min-h-0 lg:h-full flex flex-col justify-between p-5 sm:p-8 lg:p-10 xl:p-12 bg-white border-b lg:border-b-0 lg:border-r border-slate-200/80 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="w-full max-w-xl mx-auto flex flex-col justify-between min-h-[calc(100vh-2.5rem)] lg:min-h-0 lg:h-full">
                    <div>
                        {/* Header Top Bar */}
                        <div className="flex items-center justify-between pb-4 sm:pb-6 mb-2">
                            <div className="flex items-center gap-2.5">
                                <img
                                    src="/images/rakit-mark.png"
                                    alt="RAKIT CAMPUS"
                                    className="size-7 sm:size-8 object-contain"
                                />
                                <div>
                                    <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight block">
                                        Lengkapin biodata
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                                        Profil Mahasiswa
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowMobilePreview(true)}
                                    className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-blue-600 bg-white border border-slate-200 hover:border-blue-400 shadow-2xs transition-all cursor-pointer"
                                    title="Lihat preview kartu profil"
                                >
                                    <Eye className="size-3.5 text-blue-600" />
                                    <span>Preview</span>
                                </button>
                                <span className="hidden sm:inline-block text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full">
                                    Langkah {step} dari 5
                                </span>
                                <button
                                    onClick={handleSkip}
                                    title="Lewati untuk sekarang"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>

                        {/* Mobile Stepper: Modern Segmented Progress Bar (No Text Squishing) */}
                        <div className="sm:hidden mb-6 pt-1">
                            <div className="flex items-center justify-between text-xs mb-2">
                                <span className="font-bold text-slate-800">
                                    Langkah {step} dari 5:{' '}
                                    <span className="text-blue-600">{stepsList[step - 1].label}</span>
                                </span>
                                <span className="text-[11px] font-semibold text-slate-400">
                                    {step * 20}%
                                </span>
                            </div>
                            <div className="grid grid-cols-5 gap-1.5">
                                {stepsList.map((s) => (
                                    <div
                                        key={s.id}
                                        onClick={() => s.id <= step && setStep(s.id)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            step >= s.id ? 'bg-blue-600' : 'bg-slate-200'
                                        } ${s.id <= step ? 'cursor-pointer' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Desktop Stepper Tabs */}
                        <div className="hidden sm:block border-b border-slate-100 pb-2 mb-6 sm:mb-8">
                            <div className="grid grid-cols-5 text-center text-xs font-semibold">
                                {stepsList.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => s.id <= step && setStep(s.id)}
                                        className={`pb-2 px-1 relative cursor-pointer transition ${
                                            step === s.id
                                                ? 'text-blue-600 font-bold'
                                                : step > s.id
                                                ? 'text-slate-700'
                                                : 'text-slate-400'
                                        }`}
                                    >
                                        <span>{s.label}</span>
                                        {step === s.id && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* STEP 1: IDENTITAS */}
                        {step === 1 && (
                            <div className="space-y-6 sm:space-y-7 animate-in fade-in">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-slate-900 tracking-tight leading-snug">
                                        Kenalan dulu,{' '}
                                        <span className="italic font-serif text-blue-600 font-medium">
                                             siapa namamu?
                                        </span>
                                    </h1>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1">
                                            <span>Nama lengkap</span>
                                            <span className="text-rose-500 font-bold">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Masukkan nama lengkap"
                                            className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/70 focus:outline-none text-base sm:text-sm text-slate-900 font-medium transition shadow-2xs"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-between">
                                            <span className="flex items-center gap-1">
                                                <span>Nomor Induk Mahasiswa (NIM)</span>
                                                <span className="text-rose-500 font-bold">*</span>
                                            </span>
                                            <span className="text-[11px] text-slate-400 font-normal">
                                                {checkingNim ? 'Memeriksa NIM...' : 'Hanya angka'}
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={nim}
                                            onChange={(e) => {
                                                const cleaned = e.target.value.replace(/\D/g, '');
                                                setNim(cleaned);
                                                if (nimError) setNimError(null);
                                            }}
                                            onBlur={() => {
                                                if (nim.trim()) {
                                                    checkNimAvailability(nim);
                                                }
                                            }}
                                            placeholder="Contoh: 2201092"
                                            className={`w-full px-4 py-3 sm:py-2.5 rounded-xl border ${
                                                nimError
                                                    ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                                                    : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/70'
                                            } focus:outline-none text-base sm:text-sm text-slate-900 font-medium transition shadow-2xs`}
                                        />
                                        {nimError ? (
                                            <p className="text-xs text-rose-600 font-medium flex items-center gap-1 mt-1">
                                                <span>⚠️</span>
                                                <span>{nimError}</span>
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-slate-400 mt-1">
                                                NIM resmi mahasiswa Polindra (minimal 7 digit angka).
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: KAMPUS & PROGRAM STUDI (DYNAMIC) */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-slate-900 tracking-tight leading-snug">
                                        Kuliah di mana &{' '}
                                        <span className="italic font-serif text-blue-600 font-medium">
                                            jurusan apa?
                                        </span>
                                    </h1>
                                </div>

                                <div className="space-y-5">
                                    {/* 1. Kampus / Perguruan Tinggi */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-between">
                                            <span>Kampus / Perguruan Tinggi</span>
                                            <span className="text-[11px] text-slate-400 font-normal">Pilih atau tulis manual</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={selectedCampusId}
                                                onChange={(e) => handleCampusChange(e.target.value)}
                                                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-base sm:text-sm font-semibold focus:border-blue-500 focus:ring-4 focus:ring-blue-100/70 focus:outline-none transition cursor-pointer pr-10 shadow-2xs appearance-none"
                                            >
                                                {campuses && campuses.length > 0 ? (
                                                    campuses.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value={campus.id || 1}>{campus.name}</option>
                                                )}
                                                <option value="other">🏛️ Kampus Lainnya (Tulis Manual)</option>
                                            </select>
                                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <GraduationCap className="size-4" />
                                            </div>
                                        </div>

                                        {/* Input custom campus when other is selected */}
                                        {selectedCampusId === 'other' && (
                                            <div className="pt-1.5 animate-in fade-in slide-in-from-top-1">
                                                <input
                                                    type="text"
                                                    value={customCampusName}
                                                    onChange={(e) => setCustomCampusName(e.target.value)}
                                                    placeholder="Tulis nama kampus lengkap (contoh: Universitas Diponegoro / Polman Bandung)"
                                                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100/70 focus:outline-none text-base sm:text-sm text-slate-900 bg-blue-50/20 shadow-2xs"
                                                    autoFocus
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* 2. Program Studi */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                                                Pilih Program Studi
                                            </label>
                                            {availablePrograms.length > 0 && isCustomProgram && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsCustomProgram(false);
                                                        if (availablePrograms.length > 0) setStudyProgram(availablePrograms[0]);
                                                    }}
                                                    className="group inline-flex items-center gap-2 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                                                >
                                                    <ArrowLeft className="size-3.5 stroke-[2.5] shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
                                                    <span>Pilih dari daftar prodi</span>
                                                </button>
                                            )}
                                        </div>

                                        {availablePrograms.length > 0 && !isCustomProgram ? (
                                            <div className="space-y-2.5">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {availablePrograms.map((progName) => {
                                                        const isSelected = studyProgram === progName;
                                                        return (
                                                            <div
                                                                key={progName}
                                                                onClick={() => selectProgram(progName)}
                                                                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                                                                    isSelected
                                                                        ? 'border-blue-500 bg-blue-50/25 shadow-2xs'
                                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                                }`}
                                                            >
                                                                <div className="pt-0.5">
                                                                    <div
                                                                        className={`size-4 rounded-full border flex items-center justify-center transition ${
                                                                            isSelected
                                                                                ? 'border-blue-600 bg-blue-600'
                                                                                : 'border-slate-300'
                                                                        }`}
                                                                    >
                                                                        {isSelected && (
                                                                            <div className="size-1.5 rounded-full bg-white" />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="text-xs font-bold text-slate-900 leading-snug">
                                                                        {progName}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                                        Program Studi Resmi
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    <div
                                                        onClick={selectCustomProgramMode}
                                                        className="p-3.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20 cursor-pointer transition flex items-center gap-3 select-none group"
                                                    >
                                                        <div className="size-4 rounded-full border border-dashed border-slate-400 group-hover:border-blue-500 flex items-center justify-center">
                                                            <Plus className="size-2.5 text-slate-500 group-hover:text-blue-600" />
                                                        </div>
                                                        <div className="text-xs font-semibold text-slate-600 group-hover:text-blue-600">
                                                            Program Studi Lainnya...
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            /* Manual input for custom program studi */
                                            <div className="space-y-2 animate-in fade-in">
                                                <input
                                                    type="text"
                                                    value={customProgramInput}
                                                    onChange={(e) => handleCustomProgramInputChange(e.target.value)}
                                                    placeholder="Tulis nama Program Studi kamu (contoh: Sains Data / Akuntansi / dll.)"
                                                    className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-blue-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100/70 focus:outline-none text-base sm:text-sm text-slate-900 bg-white shadow-2xs"
                                                    autoFocus
                                                />
                                                <div className="pt-0.5">
                                                    <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
                                                        Pilihan populer:
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {[
                                                            'Teknik Informatika',
                                                            'Sistem Informasi',
                                                            'Rekayasa Perangkat Lunak',
                                                            'Ilmu Komputer',
                                                            'Teknik Komputer',
                                                            'Desain Komunikasi Visual',
                                                            'Bisnis Digital',
                                                            'Teknik Mesin',
                                                            'Teknik Elektro',
                                                        ].map((sug) => (
                                                            <button
                                                                type="button"
                                                                key={sug}
                                                                onClick={() => handleCustomProgramInputChange(sug)}
                                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                                                                    studyProgram === sug
                                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                                                }`}
                                                            >
                                                                {sug}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Angkatan & Semester */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                        <div className="space-y-1.5">
                                            <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                                                Angkatan (Tahun Masuk)
                                            </label>
                                            <select
                                                value={batchYear}
                                                onChange={(e) => setBatchYear(e.target.value)}
                                                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/70 focus:outline-none text-base sm:text-sm text-slate-900 bg-white shadow-2xs"
                                            >
                                                {batchYearOptions.map((yr) => (
                                                    <option key={yr} value={yr}>
                                                        {yr}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                                                Semester Saat Ini
                                            </label>
                                            <select
                                                value={semester}
                                                onChange={(e) => setSemester(Number(e.target.value))}
                                                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/70 focus:outline-none text-base sm:text-sm text-slate-900 bg-white shadow-2xs"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                                    <option key={sem} value={sem}>
                                                        Semester {sem}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: SKILL */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-slate-900 tracking-tight leading-snug">
                                        Keahlian apa yang{' '}
                                        <span className="italic font-serif text-blue-600 font-medium">
                                            kamu kuasai?
                                        </span>
                                    </h1>
                                </div>

                                <div className="space-y-5">
                                    {/* Preferred Role Selection */}
                                    <div className="space-y-2">
                                        <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                                            Peran Utama yang Diminati
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {roleOptions.map((role) => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => setPreferredRole(role.id)}
                                                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                                                        preferredRole === role.id
                                                            ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20 shadow-2xs'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="text-xs font-bold text-slate-900">
                                                        {role.label}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                                                        {role.desc}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Popular Skills Chips */}
                                    <div className="space-y-2 pt-1">
                                        <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                                            Keahlian & Tools Populer
                                        </label>
                                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
                                            {popularSkills.map((sk) => {
                                                const isSelected = selectedSkills.includes(sk);
                                                return (
                                                    <button
                                                        key={sk}
                                                        type="button"
                                                        onClick={() => toggleSkill(sk)}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                                                            isSelected
                                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                                                        }`}
                                                    >
                                                        {isSelected && <Check className="size-3" />}
                                                        <span>{sk}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Add Custom Skill */}
                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type="text"
                                                placeholder="+ Tambah skill lain (misal: Blender, PyTorch...)"
                                                value={customSkillInput}
                                                onChange={(e) => setCustomSkillInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                                                className="px-4 py-2.5 sm:py-2 rounded-xl border border-slate-200 text-base sm:text-xs w-full focus:outline-none focus:border-blue-500 shadow-2xs"
                                            />
                                            <button
                                                type="button"
                                                onClick={addCustomSkill}
                                                className="px-4 py-2.5 sm:py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shrink-0"
                                            >
                                                Tambah
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: PENGALAMAN & BIO */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in fade-in">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-slate-900 tracking-tight leading-snug">
                                        Ada pengalaman{' '}
                                        <span className="italic font-serif text-blue-600 font-medium">
                                            lomba atau proyek?
                                        </span>
                                    </h1>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                                            Bio singkat
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Contoh: Mahasiswa yang tertarik di bidang AI & mobile app, aktif bikin proyek dan siap kolaborasi!"
                                            className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/70 focus:outline-none text-base sm:text-sm text-slate-900 leading-relaxed shadow-2xs"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                                                Pengalaman Lomba & Proyek
                                            </label>
                                            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-500">
                                                <input
                                                    type="checkbox"
                                                    checked={hasNoExperience}
                                                    onChange={(e) => {
                                                        setHasNoExperience(e.target.checked);
                                                        if (e.target.checked) {
                                                            setExperience('Belum ada pengalaman');
                                                        } else {
                                                            setExperience('');
                                                        }
                                                    }}
                                                    className="size-3.5 text-blue-600 rounded"
                                                />
                                                <span>Belum ada pengalaman</span>
                                            </label>
                                        </div>

                                        {!hasNoExperience ? (
                                            <textarea
                                                rows={2}
                                                value={experience}
                                                onChange={(e) => setExperience(e.target.value)}
                                                placeholder="Contoh: Juara 2 UI/UX Gemastik 2024, membuat web portal kampus, dll."
                                                className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/70 focus:outline-none text-base sm:text-sm text-slate-900 leading-relaxed shadow-2xs"
                                            />
                                        ) : (
                                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                                                Belum ada pengalaman (masih pemula & siap belajar bareng tim).
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center justify-between">
                                            <span>Link Portofolio / GitHub / LinkedIn</span>
                                            <span className="text-[11px] text-slate-400 font-normal">Opsional</span>
                                        </label>
                                        <input
                                            type="url"
                                            value={portfolioUrl}
                                            onChange={(e) => setPortfolioUrl(e.target.value)}
                                            placeholder="https://github.com/... atau https://behance.net/..."
                                            className="w-full px-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100/70 focus:outline-none text-base sm:text-sm text-slate-900 shadow-2xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: KONTAK */}
                        {step === 5 && (
                            <div className="space-y-6 animate-in fade-in">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-slate-900 tracking-tight leading-snug">
                                        Gimana ketua tim{' '}
                                        <span className="italic font-serif text-emerald-600 font-medium">
                                            menghubungimu?
                                        </span>
                                    </h1>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs sm:text-sm font-semibold text-slate-700 block">
                                            Nomor WhatsApp Aktif
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-emerald-600" />
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="Contoh: 08123456789 atau +628123456789"
                                                className="w-full pl-10 pr-4 py-3 sm:py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100/70 focus:outline-none text-base sm:text-sm text-slate-900 font-medium shadow-2xs"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-emerald-800 leading-relaxed">
                                            <strong>Aman & Terkendali:</strong> Nomor WhatsApp-mu hanya akan dapat dihubungi oleh ketua tim setelah kamu mengajukan diri ke tim mereka.
                                        </p>
                                    </div>

                                    {/* Mobile Inline Preview Summary */}
                                    <div className="lg:hidden pt-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-slate-700">Preview Profil Kamu</span>
                                            <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full">
                                                Tampilan Publik
                                            </span>
                                        </div>
                                        {renderProfileCard()}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Wizard Actions */}
                    <div className="pt-6 sm:pt-8 border-t border-slate-100 mt-8 sm:mt-10">
                        <div className="flex items-center gap-3">
                            {step > 1 && (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    <ArrowLeft className="size-4 stroke-[2.5] shrink-0" />
                                    <span>Kembali</span>
                                </button>
                            )}

                            <button
                                type="button"
                                disabled={submitting || checkingNim}
                                onClick={handleNext}
                                className={`${
                                    step === 1 ? 'w-full sm:w-auto sm:ml-auto' : 'flex-1 sm:flex-initial sm:ml-auto'
                                } inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none`}
                            >
                                <span>
                                    {step === 5
                                        ? submitting
                                            ? 'Menyimpan...'
                                            : 'Selesai & Mulai Eksplor Tim'
                                        : checkingNim
                                            ? 'Memeriksa NIM...'
                                            : 'Lanjut'}
                                </span>
                                {submitting || checkingNim ? (
                                    <LoaderCircle className="size-4 animate-spin shrink-0" />
                                ) : (
                                    <ArrowRight className="size-4 stroke-[2.5] shrink-0" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================== */}
            {/* RIGHT SIDE: PREVIEW PROFIL (DEEP NAVY BLUEPRINT JIGSAW)        */}
            {/* ============================================================== */}
            <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] lg:min-h-0 lg:h-full bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0B132B] p-6 sm:p-8 lg:p-10 xl:p-12 flex-col justify-center items-center overflow-hidden relative select-none">
                {/* 1. Full-Bleed Authentic Interlocking Jigsaw Canvas in Deep Navy Blueprint */}
                <svg
                    viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
                    preserveAspectRatio="xMidYMid slice"
                    className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none opacity-95"
                >
                    <defs>
                        <filter id="previewNavyPieceShadow" x="-25%" y="-25%" width="150%" height="150%">
                            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#020617" floodOpacity="0.5" />
                        </filter>
                    </defs>

                    {/* Blueprint dashed guide grid */}
                    <g opacity="0.25">
                        {Object.entries(PIECE_PATHS).map(([key, pathD]) => (
                            <path
                                key={`guide-${key}`}
                                d={pathD}
                                fill="none"
                                stroke="#38BDF8"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                            />
                        ))}
                    </g>

                    {/* Assembled Deep Navy Blueprint Jigsaw Pieces (Uniform Single Color) */}
                    {Object.entries(PIECE_PATHS).map(([key, pathD]) => (
                        <path
                            key={`piece-${key}`}
                            d={pathD}
                            fill="#1E293B"
                            stroke="rgba(56, 189, 248, 0.35)"
                            strokeWidth={1.25}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                            filter="url(#previewNavyPieceShadow)"
                        />
                    ))}
                </svg>

                {/* 2. Soft Ambient Lighting Aura in Center (Blue Studio Glow) */}
                <div className="absolute w-[440px] h-[440px] rounded-full bg-radial from-blue-500/25 via-sky-400/10 to-transparent blur-3xl pointer-events-none z-0" />

                {/* 3. FOREGROUND: Profile Preview Card Container */}
                <div className="relative z-10 w-full max-w-[420px] mx-auto space-y-4">
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                            Preview profil
                        </h3>
                    </div>

                    {renderProfileCard()}
                </div>
            </div>

            {/* Mobile Bottom Sheet Modal for Profile Preview */}
            {showMobilePreview && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
                    <div
                        className="fixed inset-0"
                        onClick={() => setShowMobilePreview(false)}
                    />
                    <div className="relative z-10 w-full max-w-md bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0B132B] border-t sm:border border-slate-700/80 rounded-t-3xl sm:rounded-2xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl text-white">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                            <span className="text-sm font-bold text-white">Preview Profil</span>
                            <button
                                type="button"
                                onClick={() => setShowMobilePreview(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        {renderProfileCard()}
                    </div>
                </div>
            )}
        </div>
    );
}
