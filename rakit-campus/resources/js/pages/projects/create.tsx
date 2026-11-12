import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, FolderPlus, GraduationCap, Users } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Props {
    categories: string[];
    visibilities: string[];
    enrolledClasses?: { id: number; name: string; code: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Proyek', href: '/projects' },
    { title: 'Buat Proyek Baru', href: '/projects/create' },
];

export default function ProjectCreate({ categories = [], visibilities = [], enrolledClasses = [] }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { data, setData } = useForm({
        academic_class_id: (enrolledClasses && enrolledClasses.length > 0 ? enrolledClasses[0].id : '') as string | number,
        title: '',
        short_description: '',
        description: '',
        category: categories[0] || 'academic',
        problem_statement: '',
        objectives: '',
        proposed_solution: '',
        tech_stack_input: 'Laravel, React, Tailwind CSS',
        capacity: 4,
        visibility: 'campus',
        required_skills_input: 'Frontend: 3, Backend: 3, UI/UX: 3',
    });

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
                    short_description: data.short_description,
                    description: data.description,
                    category: data.category,
                    problem_statement: data.problem_statement,
                    objectives: data.objectives,
                    proposed_solution: data.proposed_solution,
                    tech_stack,
                    capacity: data.capacity,
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
                setErrorMessage(json.message || 'Gagal membuat proyek. Silakan periksa kembali isian formulir.');
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
                                    onChange={(e) => setData('academic_class_id', e.target.value)}
                                    required
                                    className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                >
                                    <option value="">-- Pilih Kelas --</option>
                                    {enrolledClasses.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} ({cls.code})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[11px] text-slate-400 mt-1.5">
                                    Proyek ini akan terhubung ke dashboard dosen pengampu untuk evaluasi UTS dan UAS.
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
                                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                    Kapasitas Tim
                                </label>
                                <input
                                    type="number"
                                    min={2}
                                    max={10}
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', parseInt(e.target.value, 10) || 4)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                                />
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
                                rows={4}
                                placeholder="Jelaskan gambaran umum perancangan, pembagian tugas awal, atau metodologi yang akan digunakan."
                                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition"
                            />
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
                            disabled={submitting || (enrolledClasses.length > 0 && !data.academic_class_id)}
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
