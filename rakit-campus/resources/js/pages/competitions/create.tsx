import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Bell,
    Calendar,
    Globe,
    Image as ImageIcon,
    Info,
    Link as LinkIcon,
    Settings,
    ShieldAlert,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';
import React from 'react';

interface Props {
    categories: string[];
    levels: string[];
    types: string[];
}

export default function CompetitionCreate({ categories, levels, types }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        organizer: '',
        description: '',
        category: categories[0] || 'hackathon',
        level: 'national',
        competition_type: 'team',
        min_team_size: 1,
        max_team_size: 5,
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
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('competitions.store'), {
            forceFormData: true,
        });
    };

    return (
        <div className="min-h-screen bg-[#eceff3] p-3 sm:p-5 lg:p-7 font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
            <Head title="Daftarkan Kompetisi Baru — RakitCampus" />

            {/* Giant Smooth Rounded Container matching Dashboard */}
            <div className="mx-auto max-w-[1400px] bg-[#fbfcfd] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 lg:p-9 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-200/60 space-y-6">
                {/* 1. TOP NAVBAR */}
                <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="2.5" />
                                <circle cx="18" cy="8.5" r="2.5" />
                                <circle cx="18" cy="15.5" r="2.5" />
                                <circle cx="12" cy="19" r="2.5" />
                                <circle cx="6" cy="15.5" r="2.5" />
                                <circle cx="6" cy="8.5" r="2.5" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">
                            RakitCampus
                        </span>
                    </Link>

                    <nav className="inline-flex items-center gap-1 bg-[#f1f3f7] p-1 rounded-full border border-slate-200/70">
                        <Link
                            href="/dashboard"
                            className="px-5 py-2 rounded-full text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/competitions"
                            className="px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#2563eb] text-white shadow-sm transition"
                        >
                            Lomba
                        </Link>
                        <Link
                            href="/competitions?tab=my_competitions&subtab=teams"
                            className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                        >
                            Tim Saya
                        </Link>
                        <Link
                            href="/workspace"
                            className="px-4 py-2 rounded-full text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition"
                        >
                            Task Board
                        </Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/settings/profile"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Pengaturan"
                        >
                            <Settings className="w-5 h-5 stroke-[1.75]" />
                        </Link>
                        <Link
                            href="/notifications"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative transition"
                            title="Notifikasi"
                        >
                            <Bell className="w-5 h-5 stroke-[1.75]" />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                        </Link>
                        <Link
                            href="/settings/profile"
                            className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-100 shadow-2xs overflow-hidden"
                        >
                            FA
                        </Link>
                    </div>
                </header>

                <div className="max-w-4xl mx-auto pt-2 flex flex-col gap-6">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                        <Link
                            href={route('competitions.index')}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:border-blue-200 shadow-2xs transition"
                        >
                            <ArrowLeft className="size-3.5" />
                            <span>Kembali ke Daftar Kompetisi</span>
                        </Link>
                    </div>

                    {/* Page Hero */}
                    <div className="glass-surface rounded-3xl p-6 sm:p-8 bg-white/85">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-800 text-xs font-bold tracking-wide mb-3 border border-amber-500/20">
                            <Trophy className="size-3.5 text-amber-600" />
                            <span>Daftarkan Peluang Prestasi Mahasiswa</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Tambah Informasi Kompetisi Baru
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                            Pastikan data kompetisi bersumber dari informasi valid penyelenggara resmi. Kompetisi yang didaftarkan mahasiswa akan melalui peninjauan dosen/admin sebelum terverifikasi secara publik.
                        </p>
                    </div>

                    {/* Main Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Section 1: Informasi Dasar */}
                        <div className="glass-card rounded-3xl p-6 sm:p-8 bg-white/85 space-y-5">
                            <div className="border-b border-slate-100 pb-3">
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles className="size-4 text-blue-600" />
                                    <span>Informasi Pokok Kompetisi</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Nama Kompetisi / Lomba <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Gemastik XVII, Hackathon Nasional 2026, PKM-KC"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                                    />
                                    {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Penyelenggara / Institusi <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Puspresnas Kemdikbudristek, Google Cloud, dsb."
                                        value={data.organizer}
                                        onChange={(e) => setData('organizer', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                                    />
                                    {errors.organizer && <p className="text-[11px] text-rose-500 mt-1">{errors.organizer}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Kategori Kompetisi <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.category}
                                        onChange={(e) => setData('category', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>
                                                {cat.replace('_', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category && <p className="text-[11px] text-rose-500 mt-1">{errors.category}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tingkat Kompetisi
                                    </label>
                                    <select
                                        value={data.level}
                                        onChange={(e) => setData('level', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    >
                                        <option value="team">Beregu / Tim</option>
                                        <option value="individual">Individu / Perorangan</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Min Anggota per Tim
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={data.min_team_size}
                                        onChange={(e) => setData('min_team_size', parseInt(e.target.value, 10) || 1)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    {errors.min_team_size && <p className="text-[11px] text-rose-500 mt-1">{errors.min_team_size}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Maks Anggota per Tim
                                    </label>
                                    <input
                                        type="number"
                                        min={data.min_team_size}
                                        max={10}
                                        value={data.max_team_size}
                                        onChange={(e) => setData('max_team_size', parseInt(e.target.value, 10) || 5)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    {errors.max_team_size && <p className="text-[11px] text-rose-500 mt-1">{errors.max_team_size}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Deskripsi Lengkap Kompetisi
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Jelaskan ruang lingkup, tema karya, syarat kualifikasi, atau gambaran umum lomba..."
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                                    />
                                    {errors.description && <p className="text-[11px] text-rose-500 mt-1">{errors.description}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Jadwal & Hadiah */}
                        <div className="glass-card rounded-3xl p-6 sm:p-8 bg-white/85 space-y-5">
                            <div className="border-b border-slate-100 pb-3">
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="size-4 text-emerald-600" />
                                    <span>Timeline Penting & Hadiah</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tanggal Buka Pendaftaran
                                    </label>
                                    <input
                                        type="date"
                                        value={data.registration_opens_at}
                                        onChange={(e) => setData('registration_opens_at', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Batas Akhir Pendaftaran (Deadline)
                                    </label>
                                    <input
                                        type="date"
                                        value={data.registration_deadline}
                                        onChange={(e) => setData('registration_deadline', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    {errors.registration_deadline && <p className="text-[11px] text-rose-500 mt-1">{errors.registration_deadline}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tanggal Mulai Penjurian / Lomba
                                    </label>
                                    <input
                                        type="date"
                                        value={data.starts_at}
                                        onChange={(e) => setData('starts_at', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tanggal Selesai / Pengumuman Juara
                                    </label>
                                    <input
                                        type="date"
                                        value={data.ends_at}
                                        onChange={(e) => setData('ends_at', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    {errors.ends_at && <p className="text-[11px] text-rose-500 mt-1">{errors.ends_at}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Informasi Hadiah & Penghargaan
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Total hadiah Rp 50.000.000, sertifikat nasional, piala Puspresnas"
                                        value={data.prize_info}
                                        onChange={(e) => setData('prize_info', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Kriteria Kelayakan & Keahlian yang Dibutuhkan
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Pisahkan dengan koma: Mahasiswa S1/D4 Aktif, React, Laravel, UI/UX, Data Science"
                                        value={data.eligibility}
                                        onChange={(e) => setData('eligibility', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Sumber Resmi & Tautan Validasi */}
                        <div className="glass-card rounded-3xl p-6 sm:p-8 bg-white/85 space-y-5">
                            <div className="border-b border-slate-100 pb-3">
                                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <ShieldAlert className="size-4 text-purple-600" />
                                    <span>Validasi Sumber Informasi & Tautan Resmi</span>
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tautan Website Resmi
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={data.official_url}
                                        onChange={(e) => setData('official_url', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    {errors.official_url && <p className="text-[11px] text-rose-500 mt-1">{errors.official_url}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Tautan Pendaftaran Eksternal
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        value={data.registration_url}
                                        onChange={(e) => setData('registration_url', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    {errors.registration_url && <p className="text-[11px] text-rose-500 mt-1">{errors.registration_url}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        URL Sumber Informasi Valid (Guidebook / Pengumuman) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        placeholder="https://... (Link panduan resmi atau pengumuman penyelenggara)"
                                        value={data.source_url}
                                        onChange={(e) => setData('source_url', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                    {errors.source_url && <p className="text-[11px] text-rose-500 mt-1">{errors.source_url}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Gambar Sampul / Poster Lomba (Opsional)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setData('cover_image', file);
                                        }}
                                        className="w-full px-4 py-2 text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                    />
                                    {errors.cover_image && <p className="text-[11px] text-rose-500 mt-1">{errors.cover_image}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end gap-3 pt-4">
                            <Link
                                href={route('competitions.index')}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50"
                            >
                                {processing ? 'Menyimpan...' : 'Daftarkan Kompetisi'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
