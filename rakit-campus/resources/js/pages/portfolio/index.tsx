import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Award, ExternalLink, Plus, ShieldCheck, Trash2, FolderKanban, Trophy, Globe } from 'lucide-react';
import { useState } from 'react';

interface Props {
    achievements: any[];
    portfolioItems: any[];
    completedProjects: any[];
    profile: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Portfolio & Prestasi', href: '/portfolio' },
];

export default function PortfolioIndex({ achievements, portfolioItems: initialItems, completedProjects, profile }: Props) {
    const [items, setItems] = useState(initialItems);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [kind, setKind] = useState('link');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/v1/portfolio/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ title, url, kind, description }),
            });

            const json = await res.json();
            if (res.ok) {
                setItems([json.data, ...items]);
                setAddModalOpen(false);
                setTitle('');
                setUrl('');
                setDescription('');
            } else {
                alert(json.message || 'Gagal menambahkan link portofolio.');
            }
        } catch {
            alert('Terjadi kesalahan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm('Hapus item portofolio ini?')) return;
        try {
            const res = await fetch(`/api/v1/portfolio/items/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            if (res.ok) {
                setItems(items.filter((i) => i.id !== id));
            }
        } catch {
            alert('Gagal menghapus.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Portfolio & Prestasi — RAKIT Campus" />

            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1 rounded bg-amber-50 text-amber-600">
                                <Award className="size-4" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                                Rekam Jejak & Portofolio
                            </h1>
                        </div>
                        <p className="text-xs text-neutral-500">
                            Dokumentasi pencapaian nyata, partisipasi kompetisi, dan kontribusi proyek Anda.
                        </p>
                    </div>

                    {profile?.slug && profile?.portfolio_public && (
                        <a
                            href={`/p/${profile.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition self-start md:self-auto"
                        >
                            <Globe className="size-3.5" />
                            Buka Link Publik Portofolio
                            <ExternalLink className="size-3 ml-0.5" />
                        </a>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Verified Achievements & Projects */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Achievements */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                            <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                                <ShieldCheck className="size-4 text-emerald-600" />
                                Prestasi & Pencapaian Terverifikasi ({achievements.length})
                            </h3>

                            {achievements.length === 0 ? (
                                <div className="p-6 text-center border border-dashed border-neutral-200 rounded-lg">
                                    <p className="text-xs text-neutral-500">
                                        Belum ada pencapaian resmi tercatat. Selesaikan proyek atau kompetisi bersama tim Anda untuk mendapatkan rekam jejak terverifikasi.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {achievements.map((ach) => (
                                        <div
                                            key={ach.id}
                                            className="p-3.5 border border-neutral-200 rounded-lg bg-neutral-50 flex items-start justify-between gap-3"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xs font-bold text-neutral-900">{ach.title}</h4>
                                                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium">
                                                        Terverifikasi
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-neutral-600 mt-1">{ach.description}</p>
                                                {ach.achieved_on && (
                                                    <span className="text-[10px] text-neutral-400 block mt-1.5">
                                                        Dicapai pada: {new Date(ach.achieved_on).toLocaleDateString('id-ID')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Completed Projects */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                            <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                                <FolderKanban className="size-4 text-blue-600" />
                                Proyek yang Telah Diselesaikan ({completedProjects.length})
                            </h3>

                            {completedProjects.length === 0 ? (
                                <p className="text-xs text-neutral-500">
                                    Belum ada proyek yang berstatus selesai.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {completedProjects.map((cp: any, idx: number) => (
                                        <div key={idx} className="p-3 border border-neutral-200 rounded-lg bg-white">
                                            <h4 className="text-xs font-bold text-neutral-900">
                                                {cp.team?.project?.title}
                                            </h4>
                                            <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                                                {cp.team?.project?.short_description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: Custom Portfolio Links */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-neutral-900">Karya & Tautan Luar</h3>
                                <button
                                    onClick={() => setAddModalOpen(true)}
                                    className="p-1 rounded hover:bg-neutral-100 text-neutral-600 transition"
                                    title="Tambah Tautan"
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>

                            {items.length === 0 ? (
                                <p className="text-xs text-neutral-400">
                                    Tambahkan link GitHub repo, Figma showcase, atau artikel penelitian Anda.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {items.map((it) => (
                                        <div
                                            key={it.id}
                                            className="p-3 border border-neutral-200 rounded-lg flex items-center justify-between group hover:border-blue-300 transition"
                                        >
                                            <div className="truncate mr-2">
                                                <h4 className="text-xs font-semibold text-neutral-900 truncate">
                                                    {it.title}
                                                </h4>
                                                <a
                                                    href={it.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[11px] text-blue-600 hover:underline truncate block"
                                                >
                                                    {it.url}
                                                </a>
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => handleDeleteItem(it.id)}
                                                    className="p-1 text-neutral-400 hover:text-red-600 transition"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Add Item Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
                            <h3 className="text-base font-bold text-neutral-900">Tambah Tautan Portofolio</h3>

                            <form onSubmit={handleAddItem} className="mt-4 flex flex-col gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                        Judul Karya *
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Contoh: GitHub Repository AgriTani Mobile"
                                        required
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                        URL Link *
                                    </label>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://github.com/..."
                                        required
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                                        Tipe Tautan
                                    </label>
                                    <select
                                        value={kind}
                                        onChange={(e) => setKind(e.target.value)}
                                        className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="link">Link Umum</option>
                                        <option value="repository">Source Code / Repository</option>
                                        <option value="document">Dokumen / Publikasi</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setAddModalOpen(false)}
                                        className="px-3 py-1.5 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                                    >
                                        {submitting ? 'Menyimpan...' : 'Simpan Tautan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
