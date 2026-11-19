import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    CheckCircle2,
    Crown,
    Download,
    ExternalLink,
    FolderKanban,
    Globe,
    Lock,
    Plus,
    ShieldCheck,
    Sparkles,
    Trash2,
    Trophy,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    achievements: any[];
    competitionResults?: any[];
    portfolioItems: any[];
    completedProjects: any[];
    profile: any;
    isPro?: boolean;
    activeSubscription?: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Portfolio & Rekam Jejak', href: '/portfolio' },
];

export default function PortfolioIndex({
    achievements,
    competitionResults = [],
    portfolioItems: initialItems,
    completedProjects,
    profile,
    isPro = false,
    activeSubscription = null,
}: Props) {
    const [items, setItems] = useState(initialItems);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isProModalOpen, setIsProModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [kind, setKind] = useState('link');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleAtsExport = () => {
        if (!isPro) {
            setIsProModalOpen(true);
            return;
        }
        window.print();
    };

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/v1/portfolio/items', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
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
            alert('Terjadi kendala jaringan.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm('Hapus item portofolio ini?')) return;
        try {
            const res = await fetch(`/api/v1/portfolio/items/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });
            if (res.ok) {
                setItems(items.filter((i) => i.id !== id));
            }
        } catch {
            alert('Gagal menghapus tautan.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Portfolio & Rekam Jejak — RAKIT Campus" />

            <div className="min-h-screen bg-[#F8FAFC] relative text-[#0E121B] pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-[#0E121B]">
                                Rekam Jejak & Portofolio
                            </h1>
                            {isPro && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs">
                                    <Crown className="size-3.5 text-blue-600" />
                                    <span>Verified Pro</span>
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                            <button
                                type="button"
                                onClick={handleAtsExport}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                                    isPro
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
                                }`}
                            >
                                {isPro ? <Download className="size-3.5" /> : <Lock className="size-3.5 text-amber-500" />}
                                <span>Ekspor PDF (ATS-Ready)</span>
                            </button>

                            {profile?.slug && profile?.portfolio_public && (
                                <a
                                    href={`/p/${profile.slug}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                                >
                                    <Globe className="size-3.5" />
                                    <span>Buka Portofolio Publik</span>
                                    <ExternalLink className="size-3" />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left 2 Cols: Verified Achievements & Completed Projects */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* Achievements Card */}
                            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-emerald-600" />
                                        Prestasi & Pencapaian Terverifikasi ({achievements.length})
                                    </h3>
                                    <span className="text-xs text-neutral-400 font-medium">Validasi Kampus</span>
                                </div>

                                {achievements.length === 0 ? (
                                    <div className="p-8 text-center border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                                        <Trophy className="size-8 text-neutral-400 mx-auto mb-2" />
                                        <p className="text-xs font-semibold text-neutral-700">Belum ada rekam prestasi terverifikasi</p>
                                        <p className="text-[11px] text-neutral-500 max-w-md mx-auto mt-1">
                                            Selesaikan proyek perkuliahan atau raih juara kompetisi bersama tim Anda untuk memverifikasi pencapaian otomatis.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3.5">
                                        {achievements.map((ach) => (
                                            <div
                                                key={ach.id}
                                                className="p-4 border border-emerald-100/80 rounded-2xl bg-gradient-to-r from-emerald-50/30 via-white to-white flex items-start justify-between gap-3 shadow-2xs"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-xs font-bold text-neutral-900">{ach.title}</h4>
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                                                            Terverifikasi
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">{ach.description}</p>
                                                    {ach.achieved_on && (
                                                        <span className="text-[10px] text-neutral-400 block mt-2">
                                                            Dicapai pada: {new Date(ach.achieved_on).toLocaleDateString('id-ID')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Competition Results & Achievements Card */}
                            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                        <Trophy className="size-4 text-amber-600" />
                                        <span>Hasil & Prestasi Kompetisi ({competitionResults.length})</span>
                                    </h3>
                                    <span className="text-xs text-neutral-400 font-medium">Competition Hub</span>
                                </div>

                                {competitionResults.length === 0 ? (
                                    <div className="p-6 text-center border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
                                        <Trophy className="size-7 text-neutral-400 mx-auto mb-2 opacity-60" />
                                        <p className="text-xs font-semibold text-neutral-700">Belum ada hasil kompetisi yang dicatat</p>
                                        <p className="text-[11px] text-neutral-500 max-w-md mx-auto mt-1">
                                            Ikuti kompetisi di Competition Hub dan catat capaian atau sertifikat keikutsertaan Anda di sini.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3.5">
                                        {competitionResults.map((res: any) => {
                                            const comp = res.participation?.competition;
                                            const isVerified = res.verification_status === 'verified';
                                            return (
                                                <div
                                                    key={res.id}
                                                    className={`p-4 border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                                                        isVerified
                                                            ? 'border-emerald-200/80 bg-gradient-to-r from-emerald-50/30 via-white to-white'
                                                            : 'border-amber-200/80 bg-gradient-to-r from-amber-50/30 via-white to-white'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs font-bold text-neutral-900">
                                                                {res.achievement_title}
                                                            </span>
                                                            <span
                                                                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                                                    isVerified
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : 'bg-amber-100 text-amber-800'
                                                                }`}
                                                            >
                                                                {isVerified ? 'Terverifikasi Kampus' : 'Laporan Mandiri'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-neutral-600 mt-1">
                                                            Kompetisi: <strong className="text-slate-800">{comp?.name || 'Kompetisi'}</strong>
                                                            {comp?.level ? ` (${comp.level})` : ''} • Tim: {res.participation?.team?.name || 'Mandiri'}
                                                        </p>
                                                        {res.notes && (
                                                            <p className="text-[11px] text-neutral-500 mt-1 italic">
                                                                "{res.notes}"
                                                            </p>
                                                        )}
                                                    </div>

                                                    {res.certificate_path && (
                                                        <a
                                                            href={res.certificate_path.startsWith('http') ? res.certificate_path : `/storage/${res.certificate_path}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold shadow-2xs transition self-start sm:self-center shrink-0"
                                                        >
                                                            <span>Lihat Sertifikat</span>
                                                            <ExternalLink className="size-3" />
                                                        </a>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Completed Projects Card */}
                            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-100">
                                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                        <FolderKanban className="size-4 text-[#2563EB]" />
                                        Proyek yang Telah Selesai ({completedProjects.length})
                                    </h3>
                                    <span className="text-xs text-neutral-400 font-medium">Histori Portofolio</span>
                                </div>

                                {completedProjects.length === 0 ? (
                                    <p className="text-xs text-neutral-400 py-4 text-center">
                                        Belum ada proyek yang berstatus selesai dalam akun Anda.
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {completedProjects.map((cp: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="p-4 border border-neutral-200/80 rounded-2xl bg-[#F8F6FE]/50 flex flex-col justify-between"
                                            >
                                                <div>
                                                    <h4 className="text-xs font-bold text-neutral-900">
                                                        {cp.team?.project?.title}
                                                    </h4>
                                                    <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                                                        {cp.team?.project?.short_description}
                                                    </p>
                                                </div>
                                                {cp.team?.project?.id && (
                                                    <Link
                                                        href={`/projects/${cp.team.project.id}`}
                                                        className="text-[11px] font-semibold text-[#2563EB] hover:underline mt-3 block"
                                                    >
                                                        Lihat Detail Proyek &rarr;
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Col: Custom Portfolio Links */}
                        <div className="flex flex-col gap-6">
                            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-neutral-900">Tautan Karya Eksternal</h3>
                                        <p className="text-[11px] text-neutral-400">GitHub, Figma, Dribbble, Artikel</p>
                                    </div>
                                    <button
                                        onClick={() => setAddModalOpen(true)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold hover:bg-[#E0DCFB] transition"
                                        title="Tambah Tautan"
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Tambah</span>
                                    </button>
                                </div>

                                {items.length === 0 ? (
                                    <p className="text-xs text-neutral-400 py-4 text-center">
                                        Tambahkan tautan repository kode, showcase Figma, atau dokumen laporan Anda.
                                    </p>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {items.map((it) => (
                                            <div
                                                key={it.id}
                                                className="p-3.5 border border-neutral-200/80 rounded-2xl flex items-center justify-between group hover:border-[#2563EB]/40 transition bg-neutral-50/50"
                                            >
                                                <div className="truncate mr-2">
                                                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                                                        {it.title}
                                                    </h4>
                                                    <a
                                                        href={it.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[11px] text-[#2563EB] hover:underline truncate block mt-0.5"
                                                    >
                                                        {it.url}
                                                    </a>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteItem(it.id)}
                                                    className="p-1.5 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Item Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 relative">
                            <button
                                onClick={() => setAddModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                            >
                                <X className="size-4" />
                            </button>

                            <div className="flex items-center gap-2 mb-2">
                                <span className="p-2 rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                                    <Award className="size-5" />
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-neutral-900">Tambah Tautan Portofolio</h3>
                                    <p className="text-xs text-neutral-500">Tampilkan karya terbaik Anda</p>
                                </div>
                            </div>

                            <form onSubmit={handleAddItem} className="mt-5 flex flex-col gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        Judul Karya / Showcase *
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Contoh: GitHub Repository AgriTani Mobile"
                                        required
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        URL Link *
                                    </label>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://github.com/..."
                                        required
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                                        Tipe Tautan
                                    </label>
                                    <select
                                        value={kind}
                                        onChange={(e) => setKind(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-neutral-200/90 rounded-2xl text-xs text-neutral-900 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition"
                                    >
                                        <option value="link">Link Eksternal Umum</option>
                                        <option value="repository">Source Code / Repository</option>
                                        <option value="document">Dokumen / Publikasi Ilmiah</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-2.5 mt-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setAddModalOpen(false)}
                                        className="px-4 py-2 border border-neutral-200 rounded-full text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="px-6 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full text-xs font-semibold transition disabled:opacity-50 shadow-md shadow-indigo-500/25"
                                    >
                                        {submitting ? 'Menyimpan...' : 'Simpan Tautan'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ATS Export Pro Paywall Modal */}
                {isProModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5 animate-in fade-in zoom-in-95">
                            <button
                                type="button"
                                onClick={() => setIsProModalOpen(false)}
                                className="absolute top-5 right-5 size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                            <div className="text-center space-y-2">
                                <div className="size-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center shadow-xs">
                                    <Crown className="size-7" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                    Ekspor PDF ATS-Ready
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Fitur ekspor dokumen portofolio standar industri (ATS-friendly) dengan sertifikasi rekam jejak kampus tersedia untuk pengguna <strong>RAKIT Pro</strong> dan <strong>RAKIT Semester</strong>.
                                </p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Link
                                    href="/pricing"
                                    className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
                                >
                                    <span>Upgrade Mulai Rp 29.000</span>
                                    <ArrowRight className="size-3.5" />
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setIsProModalOpen(false)}
                                    className="w-full py-2.5 rounded-full text-slate-500 hover:text-slate-800 text-xs font-medium transition cursor-pointer"
                                >
                                    Nanti Saja
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
