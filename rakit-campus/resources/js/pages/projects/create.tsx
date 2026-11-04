import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Briefcase, CheckCircle2, GraduationCap, Layers, Sparkles, Users, Wrench, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Props {
    categories: string[];
    visibilities: string[];
    enrolledClasses?: { id: number; name: string; code: string }[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Cari Proyek', href: '/projects' },
    { title: 'Buat Proyek Baru', href: '/projects/create' },
];

export default function ProjectCreate({ categories = [], visibilities = [], enrolledClasses = [] }: Props) {
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { data, setData } = useForm({
        academic_class_id: '' as string | number,
        title: '',
        short_description: '',
        description: '',
        category: categories[0] || 'academic',
        problem_statement: '',
        objectives: '',
        proposed_solution: '',
        tech_stack_input: 'Flutter, Laravel, MySQL',
        capacity: 4,
        visibility: 'campus',
        required_skills_input: 'Flutter: 4, Laravel: 3',
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
            // Post to web route /projects with same-origin credentials & CSRF token
            const res = await fetch('/projects', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
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
                // If session expired, navigate smoothly to login
                window.location.href = '/login';
            } else {
                setErrorMessage(json.message || 'Gagal membuat proyek. Silakan periksa kembali isian formulir Anda.');
            }
        } catch {
            setErrorMessage('Terjadi kendala jaringan saat menghubungi server. Silakan coba kembali.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Proyek Baru — RAKIT Campus" />

            <div className="min-h-screen bg-gradient-to-b from-[#F8FAFC] via-white to-[#F1F5F9] relative text-[#0E121B] pb-24">
                {/* Background glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[300px] bg-gradient-to-b from-[#2563EB]/10 to-transparent blur-3xl pointer-events-none -z-0" />

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-6">
                    {/* Back link */}
                    <div>
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-600 hover:text-[#2563EB] hover:border-[#2563EB]/30 shadow-sm transition"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Cari Proyek</span>
                        </Link>
                    </div>

                    {/* Main Form Card */}
                    <div className="rounded-3xl bg-white border border-neutral-200/80 shadow-lg shadow-[#2563EB]/5 p-6 sm:p-10 relative overflow-hidden">
                        {/* Header */}
                        <div className="border-b border-neutral-100 pb-6 mb-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold mb-3 border border-[#2563EB]/20">
                                <Sparkles className="size-3.5" />
                                <span>Buka Ide Proyek & Rekrut Teman Tim</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E121B]">
                                Buat Proyek Baru
                            </h1>
                            <p className="text-xs sm:text-sm text-neutral-500 mt-2 leading-relaxed">
                                Tuliskan ide proyek atau tugas kuliah kamu di sini. Sistem akan bantu pasangkan dengan mahasiswa yang keahliannya paling nyambung!
                            </p>
                        </div>

                        {/* Error Alert if any */}
                        {errorMessage && (
                            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between gap-3">
                                <span>{errorMessage}</span>
                                <button
                                    onClick={() => setErrorMessage(null)}
                                    className="text-rose-600 hover:text-rose-900 transition"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                        )}

                        <form onSubmit={submit} className="flex flex-col gap-6">
                            {/* Kelas Perkuliahan (Jika Terdaftar) */}
                            {enrolledClasses && enrolledClasses.length > 0 && (
                                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#2563EB]/20">
                                    <label className="block text-xs font-bold text-[#2563EB] mb-1.5 flex items-center gap-1.5">
                                        <GraduationCap className="size-4 text-[#2563EB]" />
                                        <span>Kaitkan ke Kelas Kuliah (Opsional)</span>
                                    </label>
                                    <select
                                        value={data.academic_class_id}
                                        onChange={(e) => setData('academic_class_id', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
                                    >
                                        <option value="">Proyek Mandiri (Bukan Tugas Kelas)</option>
                                        {enrolledClasses.map((cls) => (
                                            <option key={cls.id} value={cls.id}>
                                                {cls.name} ({cls.code})
                                            </option>
                                        ))}
                                    </select>
                                    <span className="text-[11px] text-neutral-500 mt-1 block">
                                        Kalau dikaitkan ke kelas, proyek ini bakal otomatis muncul di dashboard dosen pengampu untuk bimbingan dan penilaian.
                                    </span>
                                </div>
                            )}

                            {/* Judul Proyek */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                                    Judul Proyek <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Contoh: AgriTani — Sistem IoT & AI Monitoring Kebun Mangga"
                                    required
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                                />
                            </div>

                            {/* Ringkasan Singkat */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                                    Ringkasan Singkat <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={data.short_description}
                                    onChange={(e) => setData('short_description', e.target.value)}
                                    placeholder="Jelaskan dalam 1-2 kalimat apa yang mau dibuat tim kamu dan apa manfaatnya..."
                                    required
                                    rows={2}
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                                />
                            </div>

                            {/* Kategori, Kapasitas & Visibilitas */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                                        Kategori Proyek <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c.replace('_', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                                        Kapasitas Tim (Jumlah Anggota)
                                    </label>
                                    <input
                                        type="number"
                                        min={2}
                                        max={15}
                                        value={data.capacity}
                                        onChange={(e) => setData('capacity', parseInt(e.target.value, 10))}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                                        Visibilitas Proyek
                                    </label>
                                    <select
                                        value={data.visibility}
                                        onChange={(e) => setData('visibility', e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                                    >
                                        <option value="campus">Hanya Kampus Saya</option>
                                        <option value="public">Publik (Bisa Antar-Kampus)</option>
                                        <option value="private">Privat (Hanya Undangan)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Teknologi yang digunakan */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                                    Teknologi & Tools yang Dipakai (Pisahkan dengan koma)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.tech_stack_input}
                                        onChange={(e) => setData('tech_stack_input', e.target.value)}
                                        placeholder="Contoh: Laravel, React, Tailwind CSS, PostgreSQL, Python"
                                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                                    />
                                </div>
                                <span className="text-[11px] text-neutral-400 mt-1 block">
                                    Keahlian ini akan dicocokkan otomatis dengan profil calon pendaftar.
                                </span>
                            </div>

                            {/* Kebutuhan Keahlian */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                                    Keahlian yang Dibutuhkan (Format: NamaSkill: Level 1-5, pisahkan koma)
                                </label>
                                <input
                                    type="text"
                                    value={data.required_skills_input}
                                    onChange={(e) => setData('required_skills_input', e.target.value)}
                                    placeholder="Contoh: UI/UX Design: 4, Backend Development: 3, IoT Architecture: 3"
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                                />
                            </div>

                            {/* Deskripsi Lengkap */}
                            <div>
                                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                                    Deskripsi Lengkap & Rencana Pengerjaan
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    placeholder="Ceritakan latar belakang ide, target hasil yang ingin dicapai tim, dan peran apa aja yang lagi kamu cari..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition"
                                />
                            </div>

                            {/* Actions Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-100">
                                <Link
                                    href="/projects"
                                    className="px-5 py-2.5 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                                >
                                    Batal
                                </Link>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-md shadow-[#2563EB]/20 hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Menyimpan Proyek...</span>
                                        </>
                                    ) : (
                                        <span>Simpan & Buka Lowongan Anggota</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
