import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, FolderPlus, GraduationCap, Users } from 'lucide-react';
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
}: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const urlClassId = typeof window !== 'undefined'
        ? Number(new URLSearchParams(window.location.search).get('academic_class_id') || 0)
        : 0;
    const preferredClassId = selectedClassId || urlClassId;
    const initialClass =
        enrolledClasses.find((cls) => Number(cls.id) === Number(preferredClassId)) ||
        enrolledClasses[0];
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

    const selectedClass = enrolledClasses.find(
        (cls) => Number(cls.id) === Number(data.academic_class_id)
    );
    const maxClassCapacity = selectedClass?.target_team_size || 10;

    const handleClassChange = (classIdValue: string) => {
        const nextClass = enrolledClasses.find((cls) => String(cls.id) === classIdValue);
        const nextCapacity = nextClass?.target_team_size || 4;
        setData((prev) => ({
            ...prev,
            academic_class_id: classIdValue,
            capacity: nextCapacity,
        }));
    };

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const submit: FormEventHandler = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMessage(null);

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
                window.location.href = res.url;
                return;
            }

            const json = await res.json();

            if (res.ok) {
                const targetId = json.data?.id;
                if (targetId) {
                    window.location.href = `/projects/${targetId}`;
                } else {
                    window.location.href = '/projects';
                }
            } else if (res.status === 401) {
                window.location.href = '/login';
            } else {
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
            setErrorMessage('Terjadi kendala jaringan saat menghubungi server. Silakan coba kembali.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} activeTab="dashboard" title="Buat Proyek Baru — Project Hub">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Buat Proyek Baru
                    </h1>

                    <Link
                        href="/projects"
                        className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                        Batal
                    </Link>
                </div>

                {/* Active Project Rule 1 Warning */}
                {userHasActiveProject && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                        <p className="font-bold">Aturan 1 Mahasiswa 1 Proyek Aktif</p>
                        <p className="text-amber-800 leading-relaxed">
                            Saat ini Anda masih terdaftar dalam proyek aktif. Selesaikan proyek yang sedang berjalan terlebih dahulu sebelum membentuk proyek baru.
                        </p>
                    </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                        {errorMessage}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={submit} className="space-y-6">
                    {/* 1. Academic Class Selection */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                            <h2 className="text-sm font-bold text-slate-900">Kelas Perkuliahan</h2>
                        </div>

                        {enrolledClasses && enrolledClasses.length > 0 ? (
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Pilih Kelas Terdaftar <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.academic_class_id}
                                    onChange={(e) => handleClassChange(e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {enrolledClasses.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} ({cls.code}){cls.target_team_size ? ` • Maks ${cls.target_team_size} orang/tim` : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1.5">
                                    Proyek ini akan terhubung ke dashboard dosen pengampu untuk persetujuan formasi, evaluasi UTS, dan UAS.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                <p className="font-bold">Belum terdaftar di kelas perkuliahan aktif</p>
                                <p className="mt-1 text-amber-700 text-[11px]">
                                    Untuk membuat proyek kelas, Anda dapat bergabung ke kelas terlebih dahulu melalui menu{' '}
                                    <Link href="/classes" className="underline font-semibold hover:text-amber-900">
                                        Kelas Kuliah
                                    </Link>{' '}
                                    menggunakan kode akses dari dosen pengampu.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* 2. Core Project Details */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <h2 className="text-sm font-bold text-slate-900">Informasi Proyek</h2>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Judul Proyek <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Contoh: Sistem Informasi Presensi Cerdas Berbasis Lokasi & AI"
                                required
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Nama Tim Proyek <span className="text-slate-400 font-normal">(Opsional)</span>
                            </label>
                            <input
                                type="text"
                                value={data.team_name}
                                onChange={(e) => setData('team_name', e.target.value)}
                                placeholder="Contoh: Tim Inovasi Alpha, Garuda Dev Team"
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                                Opsional. Jika dikosongkan, nama tim otomatis dinamai: <em>[Judul Proyek] Core Team</em>.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Ringkasan Singkat <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={data.short_description}
                                onChange={(e) => setData('short_description', e.target.value)}
                                placeholder="Ringkasan 1-2 kalimat mengenai fokus solusi dan target hasil proyek."
                                required
                                rows={2}
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Kategori Proyek <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                >
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c.replace('_', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
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
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-xs font-bold text-slate-800 cursor-not-allowed"
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
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                    />
                                )}
                                <p className="text-[11px] text-slate-400 mt-1">
                                    {selectedClass
                                        ? `Ditetapkan oleh Dosen Pengampu di kelas ${selectedClass.name} (${selectedClass.target_team_size || 4} orang).`
                                        : 'Jumlah maksimal anggota dalam kelompok ini.'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Akses Visibilitas
                                </label>
                                <select
                                    value={data.visibility}
                                    onChange={(e) => setData('visibility', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                >
                                    <option value="campus">Satu Kampus</option>
                                    <option value="public">Publik</option>
                                    <option value="private">Khusus Undangan</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* 3. Tech Stack & Required Skills */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                            <Users className="w-4 h-4 text-blue-600" />
                            <h2 className="text-sm font-bold text-slate-900">Teknologi & Kebutuhan Tim</h2>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Stack Teknologi (Pisahkan koma)
                            </label>
                            <input
                                type="text"
                                value={data.tech_stack_input}
                                onChange={(e) => setData('tech_stack_input', e.target.value)}
                                placeholder="Contoh: Laravel, React, Tailwind CSS, PostgreSQL"
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                                Digunakan sistem untuk mencocokkan keahlian anggota tim sekelas.
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Keahlian yang Dibutuhkan (Format: Nama: Level 1-5, pisahkan koma)
                            </label>
                            <input
                                type="text"
                                value={data.required_skills_input}
                                onChange={(e) => setData('required_skills_input', e.target.value)}
                                placeholder="Contoh: UI/UX Design: 3, Backend: 4, Research: 3"
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Deskripsi Rencana Pengerjaan (Opsional)
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                                placeholder="Jelaskan gambaran umum perancangan, pembagian tugas awal, atau metodologi yang akan digunakan."
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                            />
                        </div>
                    </div>

                    {/* 4. Living Proposal Awal (Draft v1) */}
                    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <FolderPlus className="w-4 h-4 text-blue-600" />
                                <h2 className="text-sm font-bold text-slate-900">Proposal Awal Proyek (Living Proposal v1)</h2>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                                Dapat disempurnakan lagi di tab Proposal
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Rumusan Masalah
                            </label>
                            <textarea
                                value={data.problem_statement}
                                onChange={(e) => setData('problem_statement', e.target.value)}
                                rows={2}
                                placeholder="Masalah utama atau kendala nyata yang ingin diselesaikan oleh proyek ini."
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Tujuan Proyek
                                </label>
                                <textarea
                                    value={data.objectives}
                                    onChange={(e) => setData('objectives', e.target.value)}
                                    rows={3}
                                    placeholder="Target luaran atau manfaat yang ingin dicapai pada akhir semester."
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Solusi yang Ditawarkan
                                </label>
                                <textarea
                                    value={data.proposed_solution}
                                    onChange={(e) => setData('proposed_solution', e.target.value)}
                                    rows={3}
                                    placeholder="Gambaran sistem, fitur utama, atau pendekatan teknis yang diusulkan."
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Komitmen (Jam / Minggu)
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={40}
                                    value={data.expected_weekly_hours}
                                    onChange={(e) => setData('expected_weekly_hours', parseInt(e.target.value, 10) || 10)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Tanggal Mulai (Opsional)
                                </label>
                                <input
                                    type="date"
                                    value={data.starts_on}
                                    onChange={(e) => setData('starts_on', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Target Selesai (Opsional)
                                </label>
                                <input
                                    type="date"
                                    value={data.target_completion_on}
                                    onChange={(e) => setData('target_completion_on', e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <Link
                            href="/projects"
                            className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting || userHasActiveProject || (enrolledClasses.length > 0 && !data.academic_class_id)}
                            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
