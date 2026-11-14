import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    FileText,
    Globe,
    Image as ImageIcon,
    Info,
    Link2,
    Plus,
    ShieldCheck,
    Trophy,
    UploadCloud,
    Users,
    X,
} from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    categories: string[];
    levels: string[];
    types: string[];
}

export default function CompetitionCreate({ categories, levels, types }: Props) {
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        organizer: '',
        description: '',
        category: categories[0] || 'hackathon',
        level: 'national',
        competition_type: 'team',
        min_team_size: 1,
        max_team_size: 4,
        prize_info: '',
        eligibility: '',
        official_url: '',
        registration_url: '',
        registration_opens_at: '',
        registration_deadline: '',
        starts_at: '',
        ends_at: '',
        source_url: '',
        source_label: 'Website Penyelenggara Resmi',
        source_notes: '',
        cover_image: null as File | null,
        images: [] as File[],
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const combined = [...selectedFiles, ...files].slice(0, 5);
        setSelectedFiles(combined);
        setData('images', combined);
        if (combined.length > 0) {
            setData('cover_image', combined[0]);
        }

        // Generate previews
        const newPreviews = combined.map((file) => URL.createObjectURL(file));
        setImagePreviews(newPreviews);
    };

    const handleRemoveImage = (indexToRemove: number) => {
        const updatedFiles = selectedFiles.filter((_, idx) => idx !== indexToRemove);
        setSelectedFiles(updatedFiles);
        setData('images', updatedFiles);
        setData('cover_image', updatedFiles.length > 0 ? updatedFiles[0] : null);

        const updatedPreviews = imagePreviews.filter((_, idx) => idx !== indexToRemove);
        setImagePreviews(updatedPreviews);
    };

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!data.name.trim()) {
                newErrors.name = 'Nama kompetisi wajib diisi.';
            }
            if (!data.organizer.trim()) {
                newErrors.organizer = 'Penyelenggara kompetisi wajib diisi.';
            }
            if (!data.category) {
                newErrors.category = 'Kategori lomba wajib dipilih.';
            }
            if (data.description && data.description.trim().length > 0 && data.description.trim().length < 10) {
                newErrors.description = 'Deskripsi minimal 10 karakter bila diisi.';
            }
            if (data.min_team_size > data.max_team_size) {
                newErrors.max_team_size = 'Kapasitas maksimal tidak boleh lebih kecil dari minimal.';
            }
        }

        if (step === 2) {
            if (!data.registration_deadline) {
                newErrors.registration_deadline = 'Batas akhir pendaftaran wajib ditentukan.';
            } else {
                const deadlineDate = new Date(data.registration_deadline);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (deadlineDate < today) {
                    newErrors.registration_deadline = 'Batas pendaftaran tidak boleh di masa lampau.';
                }
            }
        }

        setStepErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrev = () => {
        setStepErrors({});
        setCurrentStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep(1) || !validateStep(2)) {
            return;
        }

        post(route('competitions.store'), {
            forceFormData: true,
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Competition Hub', href: '/competitions' },
        { title: 'Daftarkan Kompetisi Baru', href: '/competitions/create' },
    ];

    const steps = [
        { number: 1, title: 'Informasi Pokok', subtitle: 'Nama, kategori, dan deskripsi' },
        { number: 2, title: 'Jadwal & Hadiah', subtitle: 'Batas pendaftaran dan reward' },
        { number: 3, title: 'Poster & Tautan', subtitle: 'Unggah poster dan verifikasi sumber' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs} activeTab="lomba" title="Daftarkan Kompetisi Baru — RakitCampus">
            <div className="max-w-3xl mx-auto pt-2 pb-12 flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200/60">
                                Competition Form
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-semibold text-slate-500">Langkah {currentStep} dari 3</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                            Daftarkan Kompetisi Baru
                        </h1>
                    </div>

                    <Link
                        href={route('competitions.index')}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition self-start sm:self-auto"
                    >
                        <ArrowLeft className="size-3.5" />
                        <span>Kembali ke Hub</span>
                    </Link>
                </div>

                {/* Step Indicator Progress Bar */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
                        {steps.map((s) => {
                            const isCompleted = currentStep > s.number;
                            const isCurrent = currentStep === s.number;

                            return (
                                <button
                                    key={s.number}
                                    type="button"
                                    onClick={() => {
                                        if (s.number < currentStep || validateStep(currentStep)) {
                                            setCurrentStep(s.number as 1 | 2 | 3);
                                        }
                                    }}
                                    className={`flex items-start gap-2.5 sm:gap-3 p-2 rounded-xl text-left transition cursor-pointer ${
                                        isCurrent
                                            ? 'bg-blue-50/60 ring-1 ring-blue-600/30'
                                            : 'hover:bg-slate-50'
                                    }`}
                                >
                                    <div
                                        className={`size-7 sm:size-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition ${
                                            isCompleted
                                                ? 'bg-blue-600 text-white'
                                                : isCurrent
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {isCompleted ? <Check className="size-4 stroke-[3]" /> : s.number}
                                    </div>
                                    <div className="min-w-0">
                                        <p
                                            className={`text-xs font-bold leading-tight truncate ${
                                                isCurrent ? 'text-blue-600' : 'text-slate-900'
                                            }`}
                                        >
                                            {s.title}
                                        </p>
                                        <p className="text-[10px] text-slate-400 hidden sm:block truncate mt-0.5">
                                            {s.subtitle}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form Container */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ================= STEP 1: INFORMASI POKOK ================= */}
                    {currentStep === 1 && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in">
                            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Langkah 1: Informasi Pokok Kompetisi
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Isi data identitas dasar kompetisi agar mudah ditemukan oleh mahasiswa.
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                                    Tahap 1 / 3
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Nama Kompetisi / Lomba <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Gemastik XVII, ITB Hackathon 2026, PKM-KC"
                                        value={data.name}
                                        onChange={(e) => {
                                            setData('name', e.target.value);
                                            if (stepErrors.name) setStepErrors({ ...stepErrors, name: '' });
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    />
                                    {(stepErrors.name || errors.name) && (
                                        <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                                            <AlertCircle className="size-3" />
                                            <span>{stepErrors.name || errors.name}</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Penyelenggara / Institusi <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Puspresnas / BPTI Kemdikbud, HIMA ITB, Google"
                                        value={data.organizer}
                                        onChange={(e) => {
                                            setData('organizer', e.target.value);
                                            if (stepErrors.organizer) setStepErrors({ ...stepErrors, organizer: '' });
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    />
                                    {(stepErrors.organizer || errors.organizer) && (
                                        <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                                            <AlertCircle className="size-3" />
                                            <span>{stepErrors.organizer || errors.organizer}</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Kategori Kompetisi <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat.replace(/_/g, ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && (
                                        <p className="text-[11px] text-rose-500 mt-1">{errors.category}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tingkat / Jenjang
                                    </label>
                                    <select
                                        value={data.level}
                                        onChange={(e) => setData('level', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    >
                                        {levels.map((lvl) => (
                                            <option key={lvl} value={lvl}>
                                                {lvl.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Format Kepesertaan
                                    </label>
                                    <select
                                        value={data.competition_type}
                                        onChange={(e) => setData('competition_type', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    >
                                        <option value="team">Beregu / Tim</option>
                                        <option value="individual">Individu / Perorangan</option>
                                    </select>
                                </div>

                                {data.competition_type === 'team' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Minimal Anggota per Tim
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                max={10}
                                                value={data.min_team_size}
                                                onChange={(e) => setData('min_team_size', parseInt(e.target.value, 10) || 1)}
                                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                                Maksimal Anggota per Tim <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min={data.min_team_size}
                                                max={10}
                                                value={data.max_team_size}
                                                onChange={(e) => {
                                                    setData('max_team_size', parseInt(e.target.value, 10) || 5);
                                                    if (stepErrors.max_team_size) setStepErrors({ ...stepErrors, max_team_size: '' });
                                                }}
                                                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                            />
                                            {stepErrors.max_team_size && (
                                                <p className="text-[11px] text-rose-500 mt-1">{stepErrors.max_team_size}</p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Deskripsi & Sasaran Lomba
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Jelaskan ruang lingkup lomba, tema tahun ini, atau ketentuan teknis pengerjaan..."
                                        value={data.description}
                                        onChange={(e) => {
                                            setData('description', e.target.value);
                                            if (stepErrors.description) setStepErrors({ ...stepErrors, description: '' });
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    />
                                    {(stepErrors.description || errors.description) && (
                                        <p className="text-[11px] text-rose-500 font-semibold mt-1">
                                            {stepErrors.description || errors.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 2: JADWAL & HADIAH ================= */}
                    {currentStep === 2 && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-5 animate-in fade-in">
                            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Langkah 2: Jadwal & Ketentuan Hadiah
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Tentukan batas akhir pendaftaran dan apresiasi pemenang kompetisi.
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                                    Tahap 2 / 3
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Batas Akhir Pendaftaran (Deadline) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={data.registration_deadline}
                                        onChange={(e) => {
                                            setData('registration_deadline', e.target.value);
                                            if (stepErrors.registration_deadline) {
                                                setStepErrors({ ...stepErrors, registration_deadline: '' });
                                            }
                                        }}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    />
                                    {(stepErrors.registration_deadline || errors.registration_deadline) && (
                                        <p className="text-[11px] text-rose-500 font-semibold mt-1 flex items-center gap-1">
                                            <AlertCircle className="size-3" />
                                            <span>{stepErrors.registration_deadline || errors.registration_deadline}</span>
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tanggal Buka Pendaftaran (Opsional)
                                    </label>
                                    <input
                                        type="date"
                                        value={data.registration_opens_at}
                                        onChange={(e) => setData('registration_opens_at', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Mulai Penjurian / Lomba (Opsional)
                                    </label>
                                    <input
                                        type="date"
                                        value={data.starts_at}
                                        onChange={(e) => setData('starts_at', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Pengumuman Pemenang / Selesai (Opsional)
                                    </label>
                                    <input
                                        type="date"
                                        value={data.ends_at}
                                        onChange={(e) => setData('ends_at', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    />
                                    {errors.ends_at && (
                                        <p className="text-[11px] text-rose-500 mt-1">{errors.ends_at}</p>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Informasi Hadiah & Penghargaan (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Total hadiah Rp 50.000.000, sertifikat nasional Puspresnas, piala bergilir"
                                        value={data.prize_info}
                                        onChange={(e) => setData('prize_info', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Kriteria Kelayakan & Peran yang Dibutuhkan (Opsional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Mahasiswa Aktif D3/D4/S1, Frontend, Backend, UI/UX Designer"
                                        value={data.eligibility}
                                        onChange={(e) => setData('eligibility', e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= STEP 3: POSTER & TAUTAN RESMI ================= */}
                    {currentStep === 3 && (
                        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-6 animate-in fade-in">
                            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Langkah 3: Unggah Poster & Validasi Tautan
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Lengkapi poster visual (maksimal 5 gambar) dan tautan resmi penyelenggara.
                                    </p>
                                </div>
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                                    Tahap 3 / 3
                                </span>
                            </div>

                            {/* Multiple Poster Upload Area (Max 5 images) */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-slate-700">
                                        Poster & Banner Lomba (Maksimal 5 Gambar)
                                    </label>
                                    <span className="text-[11px] font-semibold text-slate-500">
                                        {selectedFiles.length} / 5 gambar terpilih
                                    </span>
                                </div>

                                {selectedFiles.length < 5 && (
                                    <label className="group flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-blue-600 hover:bg-blue-50/30 transition cursor-pointer">
                                        <div className="size-11 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition">
                                            <UploadCloud className="size-5" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-800">
                                            Klik untuk pilih atau unggah poster lomba
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                            Format PNG, JPG, JPEG, WEBP (maksimal 5MB per berkas)
                                        </p>
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                    </label>
                                )}

                                {/* Image Preview Grid */}
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-4">
                                        {imagePreviews.map((url, idx) => (
                                            <div
                                                key={idx}
                                                className="group relative aspect-3/4 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Poster ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />

                                                {/* Primary badge for first image */}
                                                {idx === 0 && (
                                                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                                                        Sampul Utama
                                                    </span>
                                                )}

                                                {/* Remove button */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 hover:bg-rose-600 text-white transition cursor-pointer"
                                                    title="Hapus gambar"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {errors.cover_image && (
                                    <p className="text-[11px] text-rose-500 mt-1">{errors.cover_image}</p>
                                )}
                            </div>

                            {/* Official Links & Provenance */}
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Website Resmi Kompetisi (Opsional)
                                    </label>
                                    <div className="relative">
                                        <Globe className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="url"
                                            placeholder="https://gemastik.kemdikbud.go.id"
                                            value={data.official_url}
                                            onChange={(e) => setData('official_url', e.target.value)}
                                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                        />
                                    </div>
                                    {errors.official_url && (
                                        <p className="text-[11px] text-rose-500 mt-1">{errors.official_url}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tautan Pendaftaran Eksternal (Bila ada)
                                    </label>
                                    <div className="relative">
                                        <Link2 className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="url"
                                            placeholder="https://bit.ly/daftar-hackathon-2026"
                                            value={data.registration_url}
                                            onChange={(e) => setData('registration_url', e.target.value)}
                                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                        />
                                    </div>
                                    {errors.registration_url && (
                                        <p className="text-[11px] text-rose-500 mt-1">{errors.registration_url}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Link Guidebook / Panduan Resmi (Opsional)
                                    </label>
                                    <div className="relative">
                                        <FileText className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="url"
                                            placeholder="https://... (Link dokumen panduan atau booklet PDF)"
                                            value={data.source_url}
                                            onChange={(e) => setData('source_url', e.target.value)}
                                            className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                        />
                                    </div>
                                    {errors.source_url && (
                                        <p className="text-[11px] text-rose-500 mt-1">{errors.source_url}</p>
                                    )}
                                </div>
                            </div>

                            {/* Review Box before Submit */}
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <ShieldCheck className="size-4 text-blue-600" />
                                    <span>Ringkasan Kompetisi yang Akan Didaftarkan</span>
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                                    <div>
                                        <span className="text-slate-400">Nama:</span>{' '}
                                        <strong className="text-slate-900">{data.name || '-'}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Penyelenggara:</span>{' '}
                                        <strong className="text-slate-900">{data.organizer || '-'}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Kategori:</span>{' '}
                                        <strong className="text-slate-900 capitalize">{data.category}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Batas Akhir:</span>{' '}
                                        <strong className="text-slate-900">{data.registration_deadline || '-'}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step Action Buttons */}
                    <div className="flex items-center justify-between gap-3 pt-2">
                        {currentStep > 1 ? (
                            <button
                                type="button"
                                onClick={handlePrev}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                            >
                                <ArrowLeft className="size-3.5" />
                                <span>Kembali</span>
                            </button>
                        ) : (
                            <Link
                                href={route('competitions.index')}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                            >
                                <span>Batal</span>
                            </Link>
                        )}

                        <div className="flex items-center gap-3">
                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer active:scale-95"
                                >
                                    <span>Lanjut ke Langkah {currentStep + 1}</span>
                                    <ArrowRight className="size-3.5" />
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50 active:scale-95"
                                >
                                    <CheckCircle2 className="size-4" />
                                    <span>{processing ? 'Menyimpan...' : 'Daftarkan Kompetisi'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
