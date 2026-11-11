import { Head, router } from '@inertiajs/react';
import {
    Briefcase,
    Check,
    CheckCircle2,
    Globe,
    GraduationCap,
    Lock,
    Phone,
    Plus,
    Sparkles,
    User,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
}

interface Props {
    currentUser: CurrentUser;
    campus: CampusInfo;
    popularSkills: string[];
}

export default function OnboardingIndex({
    currentUser,
    campus,
    popularSkills,
}: Props) {
    const [step, setStep] = useState<number>(1);
    const [submitting, setSubmitting] = useState(false);

    // Form States
    const [name, setName] = useState(currentUser.name || '');
    const [nim, setNim] = useState(currentUser.nim || '');
    const [nimError, setNimError] = useState<string | null>(null);
    const [checkingNim, setCheckingNim] = useState(false);
    const [academicStatus, setAcademicStatus] = useState<'tpb' | 'prodi'>(
        currentUser.academic_status || 'tpb'
    );
    const [department, setDepartment] = useState(
        currentUser.department || (currentUser.academic_status === 'tpb' ? 'Tahap Persiapan Bersama' : 'Teknologi Informasi')
    );
    const [studyProgram, setStudyProgram] = useState(
        currentUser.study_program && ['Teknik Informatika', 'Rekayasa Perangkat Lunak', 'Sistem Informasi Kota Cerdas', 'Teknologi Rekayasa Komputer'].includes(currentUser.study_program)
            ? currentUser.study_program
            : ''
    );
    const [batchYear, setBatchYear] = useState(currentUser.batch_year || '2024');
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
        if (!studyProgram) {
            return `Angkatan ${batchYear || '2024'}`;
        }
        return `${studyProgram} • Angkatan ${batchYear || '2024'}`;
    }, [studyProgram, batchYear]);

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
            if (!studyProgram) {
                alert('Silakan pilih salah satu Program Studi.');
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
        setSubmitting(true);
        router.post(
            '/onboarding',
            {
                name: name.trim(),
                student_number: nim.trim(),
                academic_status: 'prodi',
                department: 'Teknik Informatika',
                study_program: studyProgram,
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
                onError: (errors) => {
                    if (errors.student_number) {
                        setNimError(errors.student_number);
                        setStep(1);
                        alert(errors.student_number);
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
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-3 sm:p-6 md:p-10 font-sans text-slate-900">
            <Head title="Lengkapi Biodata — RakitCampus" />

            <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
                {/* LEFT COLUMN: WIZARD FORM (7 COLS) */}
                <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100">
                    <div>
                        {/* Header Top Bar */}
                        <div className="flex items-center justify-between pb-4">
                            <div className="flex items-center gap-2">
                                {/* Stylized Polygon Logo from Screenshot */}
                                <div className="size-6 text-blue-600 flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5">
                                        <path d="M4 4h10l6 6v10H4V4z" />
                                    </svg>
                                </div>
                                <span className="font-bold text-slate-900 text-sm">
                                    Lengkapin biodata
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-500 font-medium">
                                    Langkah {step} dari 5
                                </span>
                                <button
                                    onClick={handleSkip}
                                    title="Lewati untuk sekarang"
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        </div>

                        {/* Progress Stepper Tabs */}
                        <div className="border-b border-slate-100 pb-2 mb-8">
                            <div className="grid grid-cols-5 text-center text-xs font-semibold">
                                {stepsList.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => s.id <= step && setStep(s.id)}
                                        className={`pb-2 relative cursor-pointer transition ${
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
                            <div className="space-y-6 animate-in fade-in">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">
                                        Kenalan dulu,{' '}
                                        <span className="italic font-serif text-blue-600 font-medium">
                                            siapa namamu?
                                        </span>
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-2">
                                        Nama dan NIM ini muncul di profil dan pengajuan kamu.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                                            <span>Nama lengkap</span>
                                            <span className="text-rose-500 font-bold">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Masukkan nama lengkap"
                                            className="w-full px-4 py-3 rounded-2xl border-2 border-blue-500/80 focus:border-blue-600 focus:outline-none text-sm text-slate-900 font-medium transition"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                            <span className="flex items-center gap-1">
                                                <span>Nomor Induk Mahasiswa (NIM)</span>
                                                <span className="text-rose-500 font-bold">*</span>
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-normal">
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
                                            className={`w-full px-4 py-3 rounded-2xl border ${
                                                nimError
                                                    ? 'border-rose-500 bg-rose-50/20 focus:border-rose-600'
                                                    : 'border-slate-200 focus:border-blue-600'
                                            } focus:outline-none text-sm text-slate-900 font-medium transition`}
                                        />
                                        {nimError ? (
                                            <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
                                                <span>⚠️</span>
                                                <span>{nimError}</span>
                                            </p>
                                        ) : (
                                            <p className="text-[11px] text-slate-400">
                                                NIM resmi mahasiswa Polindra (minimal 7 digit angka).
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: KAMPUS */}
                        {step === 2 && (
                            <div className="space-y-5 animate-in fade-in">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">
                                        Kuliah di mana &{' '}
                                        <span className="italic font-serif text-blue-600 font-medium">
                                            jurusan apa?
                                        </span>
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-2">
                                        Biar tim dan rekan tahu latar belakang akademikmu.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 block">
                                            Kampus / Perguruan Tinggi
                                        </label>
                                        <input
                                            type="text"
                                            disabled
                                            value={campus.name}
                                            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 text-xs sm:text-sm font-medium"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-slate-700 block">
                                            Pilih Program Studi
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {[
                                                { id: 'Teknik Informatika', name: 'Teknik Informatika', desc: 'D3 / Sarjana Terapan' },
                                                { id: 'Rekayasa Perangkat Lunak', name: 'Rekayasa Perangkat Lunak', desc: 'D4 / Sarjana Terapan' },
                                                { id: 'Sistem Informasi Kota Cerdas', name: 'Sistem Informasi Kota Cerdas', desc: 'D4 / Sarjana Terapan' },
                                                { id: 'Teknologi Rekayasa Komputer', name: 'Teknologi Rekayasa Komputer', desc: 'D4 / Sarjana Terapan' },
                                            ].map((prodi) => {
                                                const isSelected = studyProgram === prodi.id;
                                                return (
                                                    <label
                                                        key={prodi.id}
                                                        onClick={() => setStudyProgram(prodi.id)}
                                                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                                                            isSelected
                                                                ? 'border-blue-500 bg-blue-50/20 shadow-xs'
                                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                                        }`}
                                                    >
                                                        <div className="pt-0.5">
                                                            <div
                                                                className={`size-4 rounded-full border flex items-center justify-center ${
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
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-900">
                                                                {prodi.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 mt-0.5">
                                                                {prodi.desc}
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 block">
                                                Angkatan (Tahun Masuk)
                                            </label>
                                            <select
                                                value={batchYear}
                                                onChange={(e) => setBatchYear(e.target.value)}
                                                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-900 bg-white"
                                            >
                                                <option value="2025">2025</option>
                                                <option value="2024">2024</option>
                                                <option value="2023">2023</option>
                                                <option value="2022">2022</option>
                                                <option value="2021">2021</option>
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-700 block">
                                                Semester Saat Ini
                                            </label>
                                            <select
                                                value={semester}
                                                onChange={(e) => setSemester(Number(e.target.value))}
                                                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-900 bg-white"
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
                            <div className="space-y-5 animate-in fade-in">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">
                                        Keahlian apa yang{' '}
                                        <span className="italic font-serif text-blue-600 font-medium">
                                            kamu kuasai?
                                        </span>
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-2">
                                        Pilih peran dan skill utama yang kamu andalkan saat berkompetisi.
                                    </p>
                                </div>

                                {/* Preferred Role Selection */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-700 block">
                                        Peran Utama yang Diminati
                                    </label>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        {roleOptions.map((role) => (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() => setPreferredRole(role.id)}
                                                className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                                                    preferredRole === role.id
                                                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            >
                                                <div className="text-xs font-bold text-slate-900">
                                                    {role.label}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                                    {role.desc}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Popular Skills Chips */}
                                <div className="space-y-2 pt-1">
                                    <label className="text-xs font-semibold text-slate-700 block">
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
                                                            ? 'bg-blue-600 text-white shadow-xs'
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
                                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs w-full focus:outline-none focus:border-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={addCustomSkill}
                                            className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shrink-0"
                                        >
                                            Tambah
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: PENGALAMAN & BIO */}
                        {step === 4 && (
                            <div className="space-y-5 animate-in fade-in">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">
                                        Ada pengalaman{' '}
                                        <span className="italic font-serif text-blue-600 font-medium">
                                            lomba atau proyek?
                                        </span>
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-2">
                                        Bio dan pengalaman bikin profilmu makin dipercaya oleh ketua tim.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 block">
                                            Bio singkat
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Contoh: Mahasiswa yang tertarik di bidang AI & mobile app, aktif bikin proyek dan siap kolaborasi!"
                                            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-900 leading-relaxed"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-semibold text-slate-700 block">
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
                                                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-900 leading-relaxed"
                                            />
                                        ) : (
                                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                                                Belum ada pengalaman (masih pemula & siap belajar bareng tim).
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                                            <span>Link Portofolio / GitHub / LinkedIn</span>
                                            <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                                        </label>
                                        <input
                                            type="url"
                                            value={portfolioUrl}
                                            onChange={(e) => setPortfolioUrl(e.target.value)}
                                            placeholder="https://github.com/... atau https://behance.net/..."
                                            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:border-blue-500 focus:outline-none text-xs sm:text-sm text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: KONTAK */}
                        {step === 5 && (
                            <div className="space-y-5 animate-in fade-in">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-normal text-slate-900 tracking-tight">
                                        Gimana ketua tim{' '}
                                        <span className="italic font-serif text-emerald-600 font-medium">
                                            menghubungimu?
                                        </span>
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-2">
                                        Nomor WhatsApp digunakan untuk 1-Click WhatsApp Direct Connect oleh ketua tim.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-slate-700 block">
                                            Nomor WhatsApp Aktif
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-emerald-600" />
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                placeholder="Contoh: 08123456789 atau +628123456789"
                                                className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-emerald-500/80 focus:border-emerald-600 focus:outline-none text-sm text-slate-900 font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
                                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-emerald-800 leading-relaxed">
                                            <strong>Aman & Terkendali:</strong> Nomor WhatsApp-mu hanya akan dapat dihubungi oleh ketua tim setelah kamu mengajukan diri ke tim mereka.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Wizard Actions */}
                    <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-6">
                        {step > 1 ? (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            >
                                ← Kembali
                            </button>
                        ) : (
                            <div />
                        )}

                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleNext}
                            className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                        >
                            <span>
                                {step === 5
                                    ? submitting
                                        ? 'Menyimpan...'
                                        : 'Selesai & Mulai Eksplor Tim →'
                                    : 'Lanjut →'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: PREVIEW PROFIL (5 COLS) - Matches MinSatu Screenshot */}
                <div className="lg:col-span-5 bg-[#EEF2F6] p-6 sm:p-8 flex flex-col justify-start">
                    <div className="mb-4">
                        <h3 className="text-sm font-bold text-slate-800">
                            Preview profil
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Tampilan profil pas kirim pengajuan
                        </p>
                    </div>

                    {/* White Card Preview */}
                    <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200/80 space-y-4">
                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3.5">
                            <div className="size-14 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0 shadow-sm">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-base font-bold text-slate-900 leading-snug truncate">
                                    {name.trim() || '-'}
                                </h4>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                    {previewSubtitle}
                                </p>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="space-y-1">
                            <span className="text-xs text-slate-500 block">
                                Bio
                            </span>
                            <p className="text-xs text-slate-700 leading-relaxed">
                                {bio.trim() || '-'}
                            </p>
                        </div>

                        {/* Skill Section */}
                        <div className="space-y-1.5">
                            <span className="text-xs text-slate-500 block">
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
                            <span className="text-xs text-slate-500 block">
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
                                {phone.trim()
                                    ? 'Kontak kebuka pas diajak diskusi'
                                    : 'Kontak kebuka pas diajak diskusi'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
