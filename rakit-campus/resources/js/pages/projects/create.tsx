import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { FormEventHandler } from 'react';

interface Props {
    categories: string[];
    visibilities: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Project Hub', href: '/projects' },
    { title: 'Buat Proyek', href: '/projects/create' },
];

export default function ProjectCreate({ categories, visibilities }: Props) {
    const { data, setData, post, processing, errors } = useForm({
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

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

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

        // Submit via API endpoint or web route
        fetch('/api/v1/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
            },
            body: JSON.stringify({
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
        })
            .then(async (res) => {
                const json = await res.json();
                if (res.ok) {
                    window.location.href = `/projects/${json.data.id}`;
                } else {
                    alert(json.message || 'Gagal membuat proyek. Periksa isian form.');
                }
            })
            .catch(() => alert('Terjadi kesalahan jaringan.'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buat Proyek Baru — RAKIT Campus" />

            <div className="max-w-3xl mx-auto p-6 w-full">
                <Link
                    href="/projects"
                    className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 mb-4 transition"
                >
                    <ArrowLeft className="size-3.5" />
                    Kembali ke Project Hub
                </Link>

                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                    <div className="border-b border-neutral-200 pb-4 mb-6">
                        <h1 className="text-xl font-bold text-neutral-900">Inisiasi Proyek Baru</h1>
                        <p className="text-xs text-neutral-500 mt-1">
                            Lengkapi informasi proyek secara terstruktur untuk menarik kolaborator yang tepat.
                        </p>
                    </div>

                    <form onSubmit={submit} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                Judul Proyek *
                            </label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                placeholder="Contoh: AgriTani — Sistem IoT & AI Monitoring Mangga"
                                required
                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                Ringkasan Singkat (Short Description) *
                            </label>
                            <textarea
                                value={data.short_description}
                                onChange={(e) => setData('short_description', e.target.value)}
                                placeholder="Jelaskan dalam 1-2 kalimat fokus utama dan tujuan proyek..."
                                required
                                rows={2}
                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                    Kategori Proyek *
                                </label>
                                <select
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c.replace('_', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                    Kapasitas Tim (Orang)
                                </label>
                                <input
                                    type="number"
                                    min={2}
                                    max={15}
                                    value={data.capacity}
                                    onChange={(e) => setData('capacity', parseInt(e.target.value, 10))}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                    Visibilitas
                                </label>
                                <select
                                    value={data.visibility}
                                    onChange={(e) => setData('visibility', e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="campus">Hanya Kampus Saya</option>
                                    <option value="public">Publik (Antar-Kampus)</option>
                                    <option value="private">Privat (Hanya Undangan)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                Teknologi yang Digunakan (Pisahkan koma)
                            </label>
                            <input
                                type="text"
                                value={data.tech_stack_input}
                                onChange={(e) => setData('tech_stack_input', e.target.value)}
                                placeholder="Flutter, Laravel, PostgreSQL, Docker..."
                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                Kebutuhan Keahlian (Format: NamaSkill: Level 1-5, pisahkan koma)
                            </label>
                            <input
                                type="text"
                                value={data.required_skills_input}
                                onChange={(e) => setData('required_skills_input', e.target.value)}
                                placeholder="Flutter: 4, Python: 3, UI/UX Design: 4"
                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                Deskripsi Lengkap & Latar Belakang
                            </label>
                            <textarea
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={4}
                                placeholder="Tuliskan latar belakang, permasalahan, dan metodologi pengembangan..."
                                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                            <Link
                                href="/projects"
                                className="px-4 py-2 border border-neutral-200 text-neutral-700 rounded-lg text-sm hover:bg-neutral-50 transition"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
                            >
                                Buat & Buka Rekrutmen
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
