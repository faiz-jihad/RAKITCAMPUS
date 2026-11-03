import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Award,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    FolderKanban,
    Kanban,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Rocket,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    Trophy,
    Users,
} from 'lucide-react';
import { useState } from 'react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [activeTab, setActiveTab] = useState<'board' | 'list'>('board');
    const [stepIndex, setStepIndex] = useState(0);

    return (
        <div className="min-h-screen bg-white text-neutral-900 selection:bg-[#5448EE] selection:text-white font-sans antialiased">
            <Head title="RAKIT Campus — Simplify Student Projects, Boost Campus Achievements" />

            {/* Background Atmosphere Glow (Soft Ethereal Lavender Gradient) */}
            <div className="relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-[850px] bg-gradient-to-b from-[#EAE6FF] via-[#F6F4FE] to-white pointer-events-none -z-10" />
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-r from-violet-300/30 via-indigo-200/40 to-purple-300/30 blur-3xl rounded-full pointer-events-none -z-10" />

                {/* Left & Right Soft Cloud Vignettes */}
                <div className="absolute top-40 -left-20 w-96 h-96 bg-white/60 blur-3xl rounded-full pointer-events-none -z-10" />
                <div className="absolute top-32 -right-20 w-96 h-96 bg-white/60 blur-3xl rounded-full pointer-events-none -z-10" />

                {/* 1. Header / Navigation */}
                <header className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="size-9 rounded-xl bg-[#5448EE] flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                                <Sparkles className="size-5 fill-white/20" />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight text-neutral-900">
                                RAKIT<span className="text-[#5448EE]">Campus</span>
                            </span>
                        </Link>

                        {/* Navigation Links */}
                        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
                            <a href="#features" className="hover:text-neutral-900 transition">Fitur Utama</a>
                            <a href="#why-choose" className="hover:text-neutral-900 transition">Keunggulan</a>
                            <a href="#workflow" className="hover:text-neutral-900 transition">Cara Kerja</a>
                            <a href="#testimonials" className="hover:text-neutral-900 transition">Testimoni</a>
                            <Link href="/projects" className="hover:text-[#5448EE] transition">Project Hub</Link>
                            <Link href="/competitions" className="hover:text-[#5448EE] transition">Kompetisi</Link>
                        </nav>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            {auth?.user ? (
                                <Link
                                    href="/dashboard"
                                    className="bg-[#181135] hover:bg-neutral-900 text-white text-xs font-semibold px-6 py-2.5 rounded-full transition-all shadow-sm"
                                >
                                    Buka Dashboard &rarr;
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-xs font-semibold text-neutral-700 hover:text-neutral-900 px-3 py-2 transition"
                                    >
                                        Masuk
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="bg-[#181135] hover:bg-neutral-900 text-white text-xs font-semibold px-6 py-2.5 rounded-full transition-all shadow-sm"
                                    >
                                        Mulai Sekarang
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* 2. Hero Section */}
                <section className="pt-16 pb-12 text-center max-w-5xl mx-auto px-4 relative">
                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.12]">
                        Simplify Project Collaboration <br />
                        <span className="text-neutral-900">Boost Campus Achievements</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="mt-5 text-sm sm:text-base text-neutral-500 max-w-xl mx-auto leading-relaxed">
                        Platform pembentukan tim mahasiswa, manajemen proyek Kanban, dan persiapan kompetisi berbasis kecocokan keahlian nyata.
                    </p>

                    {/* CTA Buttons (Pills) */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
                        <Link
                            href={auth?.user ? "/dashboard" : "/register"}
                            className="bg-[#5448EE] hover:bg-[#4336D6] text-white text-xs sm:text-sm font-semibold px-7 py-3.5 rounded-full shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            href="/login"
                            className="bg-white hover:bg-neutral-50 text-neutral-800 text-xs sm:text-sm font-semibold px-7 py-3.5 rounded-full border border-neutral-200/90 shadow-xs hover:border-neutral-300 transition-all"
                        >
                            Coba Akun Demo Polindra
                        </Link>
                    </div>

                    {/* 3. Hero App Mockup with Floating Pill Tags */}
                    <div className="mt-14 relative max-w-5xl mx-auto">
                        {/* Floating Pill Badges */}
                        {/* Left Badge 1: Analyst */}
                        <div className="hidden lg:flex items-center gap-1.5 absolute -top-4 left-6 bg-white/95 backdrop-blur border border-neutral-200/80 rounded-full px-3.5 py-1.5 shadow-sm text-xs font-medium text-neutral-700 animate-bounce duration-1000">
                            <span className="size-2 rounded-full bg-blue-500" />
                            Data Analyst
                        </div>
                        {/* Left Badge 2: Task Developer */}
                        <div className="hidden lg:flex items-center gap-1.5 absolute top-28 -left-8 bg-white/95 backdrop-blur border border-neutral-200/80 rounded-full px-3.5 py-1.5 shadow-sm text-xs font-medium text-neutral-700">
                            <span className="size-2 rounded-full bg-amber-500" />
                            IoT Engineer
                        </div>
                        {/* Right Badge 1: Programmer */}
                        <div className="hidden lg:flex items-center gap-1.5 absolute -top-4 right-10 bg-white/95 backdrop-blur border border-neutral-200/80 rounded-full px-3.5 py-1.5 shadow-sm text-xs font-medium text-neutral-700 animate-bounce duration-1000">
                            <span className="size-2 rounded-full bg-emerald-500" />
                            Flutter Developer
                        </div>
                        {/* Right Badge 2: Human Resources / Leader */}
                        <div className="hidden lg:flex items-center gap-1.5 absolute top-28 -right-8 bg-white/95 backdrop-blur border border-neutral-200/80 rounded-full px-3.5 py-1.5 shadow-sm text-xs font-medium text-neutral-700">
                            <span className="size-2 rounded-full bg-purple-500" />
                            Project Leader
                        </div>

                        {/* Central App Mockup Card */}
                        <div className="bg-white/95 backdrop-blur-xl border border-white/80 rounded-3xl shadow-[0_25px_80px_rgba(84,72,238,0.12)] p-4 sm:p-6 text-left overflow-hidden">
                            {/* App Mockup Top Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-100 gap-3">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="size-6 rounded-lg bg-[#5448EE] flex items-center justify-center text-white">
                                            <Sparkles className="size-3.5" />
                                        </div>
                                        <span className="text-sm font-bold text-neutral-900">TaskGo / RAKIT</span>
                                    </div>
                                    <div className="hidden md:flex items-center gap-4 text-xs font-medium text-neutral-500">
                                        <span className="text-neutral-900 font-semibold border-b-2 border-[#5448EE] pb-0.5">Dashboard</span>
                                        <span className="hover:text-neutral-800 cursor-pointer">My Tasks</span>
                                        <span className="hover:text-neutral-800 cursor-pointer">Activities</span>
                                        <span className="hover:text-neutral-800 cursor-pointer">Reporting</span>
                                        <span className="hover:text-neutral-800 cursor-pointer">Estimates</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="hidden sm:flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-full px-3 py-1 text-xs text-neutral-400">
                                        <Search className="size-3" />
                                        <span>Cari proyek / tugas...</span>
                                    </div>
                                    {/* Avatar stack */}
                                    <div className="flex items-center -space-x-1.5">
                                        <div className="size-6 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">B</div>
                                        <div className="size-6 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">S</div>
                                        <div className="size-6 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">A</div>
                                        <div className="size-6 rounded-full bg-neutral-200 text-neutral-700 text-[9px] font-bold flex items-center justify-center border-2 border-white">+3</div>
                                    </div>
                                </div>
                            </div>

                            {/* Subheader: Board Title & Controls */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 pb-3 gap-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-neutral-900">Task Boards</h3>
                                    <span className="text-xs text-neutral-400">/ Sprint Polindra 2026</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs">
                                    <button
                                        onClick={() => setActiveTab('board')}
                                        className={`px-3 py-1 rounded-full font-medium transition ${
                                            activeTab === 'board'
                                                ? 'bg-neutral-900 text-white'
                                                : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    >
                                        Board View
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('list')}
                                        className={`px-3 py-1 rounded-full font-medium transition ${
                                            activeTab === 'list'
                                                ? 'bg-neutral-900 text-white'
                                                : 'text-neutral-600 hover:bg-neutral-100'
                                        }`}
                                    >
                                        List View
                                    </button>
                                </div>
                            </div>

                            {/* 4-Column Live Kanban Board Preview */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                                {/* Column 1: To Do */}
                                <div className="bg-neutral-50/70 border border-neutral-100 rounded-2xl p-3 flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                                            To Do <span className="text-purple-500 ml-1">3</span>
                                        </span>
                                        <MoreHorizontal className="size-3.5 text-neutral-400" />
                                    </div>

                                    <div className="bg-white border border-neutral-200/80 rounded-xl p-3 shadow-2xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                                            High Priority
                                        </span>
                                        <h4 className="text-xs font-bold text-neutral-900 mt-2">
                                            Competitive Analysis & Hackathon Pitch
                                        </h4>
                                        <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                                            Riset benchmark solusi smart waste management untuk proposal kompetisi.
                                        </p>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 text-[10px] text-neutral-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="size-2.5" /> 2 Hari
                                            </span>
                                            <div className="size-5 rounded-full bg-purple-600 text-white text-[8px] font-bold flex items-center justify-center">
                                                B
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: In Process */}
                                <div className="bg-neutral-50/70 border border-neutral-100 rounded-2xl p-3 flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                            In Process <span className="text-blue-500 ml-1">2</span>
                                        </span>
                                        <MoreHorizontal className="size-3.5 text-neutral-400" />
                                    </div>

                                    <div className="bg-white border border-neutral-200/80 rounded-xl p-3 shadow-2xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                                            In Progress
                                        </span>
                                        <h4 className="text-xs font-bold text-neutral-900 mt-2">
                                            Dashboard UI Refinement
                                        </h4>
                                        <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                                            Implementasi layout web dashboard dan integrasi explainable matching.
                                        </p>
                                        {/* Mini progress bar */}
                                        <div className="w-full bg-neutral-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                                            <div className="bg-[#5448EE] h-1.5 rounded-full w-3/4" />
                                        </div>
                                        <div className="flex items-center justify-between mt-2.5 text-[10px] text-neutral-400">
                                            <span>75% Done</span>
                                            <div className="size-5 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center">
                                                S
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: In Review */}
                                <div className="bg-neutral-50/70 border border-neutral-100 rounded-2xl p-3 flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                            In Review <span className="text-amber-500 ml-1">1</span>
                                        </span>
                                        <MoreHorizontal className="size-3.5 text-neutral-400" />
                                    </div>

                                    <div className="bg-white border border-neutral-200/80 rounded-xl p-3 shadow-2xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                                            Review Ready
                                        </span>
                                        <h4 className="text-xs font-bold text-neutral-900 mt-2">
                                            Review Task Automation Rules
                                        </h4>
                                        <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                                            Validasi middleware multi-tenancy dan endpoint rekrutmen anggota tim.
                                        </p>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 text-[10px] text-neutral-400">
                                            <span className="text-amber-600 font-semibold">Siap Diuji</span>
                                            <div className="size-5 rounded-full bg-amber-600 text-white text-[8px] font-bold flex items-center justify-center">
                                                A
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 4: Completed */}
                                <div className="bg-neutral-50/70 border border-neutral-100 rounded-2xl p-3 flex flex-col gap-2.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                            Completed <span className="text-emerald-500 ml-1">4</span>
                                        </span>
                                        <MoreHorizontal className="size-3.5 text-neutral-400" />
                                    </div>

                                    <div className="bg-white border border-neutral-200/80 rounded-xl p-3 shadow-2xs">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                            Completed
                                        </span>
                                        <h4 className="text-xs font-bold text-neutral-900 mt-2">
                                            Design System Consistency
                                        </h4>
                                        <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                                            Standarisasi token warna, typography, dan komponen reusable web.
                                        </p>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100 text-[10px] text-neutral-400">
                                            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                                                <CheckCircle2 className="size-3" /> Terverifikasi
                                            </span>
                                            <div className="size-5 rounded-full bg-emerald-600 text-white text-[8px] font-bold flex items-center justify-center">
                                                D
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* 4. Endorsement / Partner Logos Strip */}
            <section className="py-12 border-b border-neutral-100">
                <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider max-w-[200px]">
                        Dipercaya oleh program studi unggulan kampus:
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <div className="px-5 py-2.5 rounded-full border border-neutral-200 text-xs font-bold text-neutral-700 hover:border-neutral-400 transition bg-white shadow-2xs">
                            POLINDRA
                        </div>
                        <div className="px-5 py-2.5 rounded-full border border-neutral-200 text-xs font-bold text-neutral-700 hover:border-neutral-400 transition bg-white shadow-2xs">
                            Teknik Informatika
                        </div>
                        <div className="px-5 py-2.5 rounded-full border border-neutral-200 text-xs font-bold text-neutral-700 hover:border-neutral-400 transition bg-white shadow-2xs">
                            Rekayasa Perangkat Lunak
                        </div>
                        <div className="px-5 py-2.5 rounded-full border border-neutral-200 text-xs font-bold text-neutral-700 hover:border-neutral-400 transition bg-white shadow-2xs">
                            Sistem Informasi Kota Cerdas
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Bento Feature Grid: "Unlock Premium Benefits With Our Advanced Features." */}
            <section id="features" className="py-20 max-w-6xl mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
                        Unlock Premium Benefits With Our Advanced Features.
                    </h2>
                    <p className="mt-3 text-sm text-neutral-500">
                        Solusi terintegrasi pembentukan tim, workspace kolaborasi, dan dokumentasi pencapaian nyata mahasiswa.
                    </p>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Bento 1: Smart Task Organization */}
                    <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition">
                        <div>
                            <h3 className="text-base font-bold text-neutral-900">Smart Task Organization</h3>
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                Buat, kelompokkan, dan prioritaskan tugas proyek mahasiswa dengan mudah menggunakan papan Kanban fleksibel.
                            </p>
                        </div>

                        {/* Visual Widget: Task breakdown */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-4 mt-6 shadow-2xs">
                            <div className="flex items-center justify-between text-xs mb-3">
                                <span className="font-bold text-neutral-900">105 Total Tasks</span>
                                <span className="text-[11px] text-[#5448EE] font-semibold cursor-pointer">Lihat Rincian</span>
                            </div>

                            <div className="flex flex-col gap-2 text-xs">
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-neutral-600">
                                        <span className="size-2 rounded-full bg-emerald-500" /> Selesai
                                    </span>
                                    <span className="font-semibold text-neutral-800">49 Tugas</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-neutral-600">
                                        <span className="size-2 rounded-full bg-blue-500" /> Dalam Proses
                                    </span>
                                    <span className="font-semibold text-neutral-800">32 Tugas</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1.5 text-neutral-600">
                                        <span className="size-2 rounded-full bg-amber-400" /> Belum Mulai
                                    </span>
                                    <span className="font-semibold text-neutral-800">24 Tugas</span>
                                </div>
                            </div>

                            {/* Color Bar */}
                            <div className="flex h-2 w-full rounded-full overflow-hidden mt-4 gap-0.5">
                                <div className="bg-emerald-500 w-[47%]" />
                                <div className="bg-blue-500 w-[30%]" />
                                <div className="bg-amber-400 w-[23%]" />
                            </div>
                        </div>
                    </div>

                    {/* Bento 2: Automated Workflows / Matching Engine */}
                    <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition">
                        <div>
                            <h3 className="text-base font-bold text-neutral-900">Explainable Smart Matching</h3>
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                Rekomendasi rekan tim berbasis 4 dimensi: kecocokan keahlian (40%), peran (25%), jam kerja (20%), dan minat (15%).
                            </p>
                        </div>

                        {/* Visual Widget: Assignment Card */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-4 mt-6 shadow-2xs">
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                                Assignment Match
                            </span>
                            <h4 className="text-xs font-bold text-neutral-900">
                                User Journey Map & Design System Setup
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                                    96% Match
                                </span>
                                <span className="text-[10px] text-neutral-400">UI/UX Specialist</span>
                            </div>

                            <button className="w-full mt-4 py-2 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition">
                                <Plus className="size-3" /> Tambah Kolaborator
                            </button>
                        </div>
                    </div>

                    {/* Bento 3: File & Comment Management / Team Chat */}
                    <div className="bg-neutral-50/70 border border-neutral-200/80 rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition">
                        <div>
                            <h3 className="text-base font-bold text-neutral-900">File & Comment Management</h3>
                            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                Diskusi tim terpusat dengan komentar tugas, lampiran berkas proposal, dan notifikasi aktivitas terkini.
                            </p>
                        </div>

                        {/* Visual Widget: Messenger chat list */}
                        <div className="bg-white border border-neutral-200 rounded-2xl p-4 mt-6 shadow-2xs flex flex-col gap-2.5">
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                                Diskusi Tim Terbaru
                            </div>

                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="size-6 rounded-full bg-purple-600 text-white font-bold text-[9px] flex items-center justify-center">B</div>
                                    <div>
                                        <span className="font-bold text-neutral-900 block leading-tight">Budi Santoso</span>
                                        <span className="text-[10px] text-[#5448EE] font-medium">Typing...</span>
                                    </div>
                                </div>
                                <span className="size-2 rounded-full bg-emerald-500" />
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100">
                                <div className="flex items-center gap-2">
                                    <div className="size-6 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center justify-center">S</div>
                                    <div>
                                        <span className="font-bold text-neutral-900 block leading-tight">Siti Rahma</span>
                                        <span className="text-[10px] text-neutral-400 truncate max-w-[120px] block">Slide proposal sudah...</span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-neutral-400">14:20</span>
                            </div>
                        </div>
                    </div>

                    {/* Bento 4: Real-Time Progress Tracking (Spans 3 cols on desktop) */}
                    <div className="md:col-span-3 bg-neutral-50/70 border border-neutral-200/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:shadow-md transition">
                        <div className="max-w-md">
                            <h3 className="text-xl font-bold text-neutral-900">Real-Time Progress Tracking</h3>
                            <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                                Pantau deadline kompetisi, pencapaian milestone, dan performa tim secara live dengan indikator visual yang jelas.
                            </p>
                            <Link
                                href="/projects"
                                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#5448EE] hover:text-[#4336D6] transition"
                            >
                                Jelajah Semua Proyek Aktif &rarr;
                            </Link>
                        </div>

                        {/* Right side table widget */}
                        <div className="w-full md:w-auto flex-1 bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xs overflow-x-auto">
                            <div className="text-xs font-bold text-neutral-900 mb-3 flex items-center justify-between">
                                <span>Project Overview</span>
                                <span className="text-[11px] text-neutral-400 font-normal">Semester Genap 2026</span>
                            </div>

                            <table className="w-full text-xs text-left">
                                <thead>
                                    <tr className="text-neutral-400 border-b border-neutral-100 text-[11px]">
                                        <th className="pb-2 font-medium">Nama Proyek</th>
                                        <th className="pb-2 font-medium">Tim</th>
                                        <th className="pb-2 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    <tr>
                                        <td className="py-2.5 font-semibold text-neutral-900">Smart Waste Management</td>
                                        <td className="py-2.5">
                                            <div className="flex items-center -space-x-1">
                                                <div className="size-5 rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center font-bold">B</div>
                                                <div className="size-5 rounded-full bg-purple-500 text-white text-[8px] flex items-center justify-center font-bold">S</div>
                                            </div>
                                        </td>
                                        <td className="py-2.5 text-right">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                Recruiting
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="py-2.5 font-semibold text-neutral-900">Campus Attendance AI</td>
                                        <td className="py-2.5">
                                            <div className="flex items-center -space-x-1">
                                                <div className="size-5 rounded-full bg-amber-500 text-white text-[8px] flex items-center justify-center font-bold">A</div>
                                                <div className="size-5 rounded-full bg-emerald-500 text-white text-[8px] flex items-center justify-center font-bold">D</div>
                                            </div>
                                        </td>
                                        <td className="py-2.5 text-right">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                                In Progress
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Why Teams Choose Task Pilot (4 Stat Cards with Purple Gradient Tint) */}
            <section id="why-choose" className="py-20 bg-neutral-50/50 border-y border-neutral-100">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
                            Why Teams Choose Task Pilot & RAKIT
                        </h2>
                        <p className="mt-3 text-sm text-neutral-500">
                            Dipercaya oleh mahasiswa untuk berkolaborasi lebih efisien dan meraih hasil nyata.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Stat Card 1 */}
                        <div className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/80 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group">
                            <div className="size-8 rounded-full bg-purple-100 text-[#5448EE] flex items-center justify-center absolute top-6 right-6 group-hover:scale-110 transition-transform">
                                <ArrowUpRight className="size-4" />
                            </div>
                            <div className="text-4xl font-extrabold text-neutral-900 mt-4">95%</div>
                            <p className="text-xs text-neutral-600 font-medium mt-3 leading-relaxed">
                                Tingkat akurasi kecocokan rekan tim berbasis algoritma Smart Matching multi-dimensi.
                            </p>
                        </div>

                        {/* Stat Card 2 */}
                        <div className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/80 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group">
                            <div className="size-8 rounded-full bg-purple-100 text-[#5448EE] flex items-center justify-center absolute top-6 right-6 group-hover:scale-110 transition-transform">
                                <ArrowUpRight className="size-4" />
                            </div>
                            <div className="text-4xl font-extrabold text-neutral-900 mt-4">3x</div>
                            <p className="text-xs text-neutral-600 font-medium mt-3 leading-relaxed">
                                Lebih cepat dalam merekrut anggota tim yang memiliki keahlian dan jam kerja komplementer.
                            </p>
                        </div>

                        {/* Stat Card 3 */}
                        <div className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/80 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group">
                            <div className="size-8 rounded-full bg-purple-100 text-[#5448EE] flex items-center justify-center absolute top-6 right-6 group-hover:scale-110 transition-transform">
                                <ArrowUpRight className="size-4" />
                            </div>
                            <div className="text-4xl font-extrabold text-neutral-900 mt-4">100%</div>
                            <p className="text-xs text-neutral-600 font-medium mt-3 leading-relaxed">
                                Portofolio terverifikasi resmi oleh kampus sebagai bukti kontribusi dan prestasi nyata.
                            </p>
                        </div>

                        {/* Stat Card 4 */}
                        <div className="bg-gradient-to-b from-[#F3F0FE] to-white border border-purple-100/80 rounded-3xl p-6 shadow-2xs hover:shadow-md transition relative group">
                            <div className="size-8 rounded-full bg-purple-100 text-[#5448EE] flex items-center justify-center absolute top-6 right-6 group-hover:scale-110 transition-transform">
                                <ArrowUpRight className="size-4" />
                            </div>
                            <div className="text-4xl font-extrabold text-neutral-900 mt-4">500+</div>
                            <p className="text-xs text-neutral-600 font-medium mt-3 leading-relaxed">
                                Mahasiswa aktif dan calon kolaborator terdaftar di fase pilot Politeknik Negeri Indramayu.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 7. Get Started In Just 3 Easy Steps */}
            <section id="workflow" className="py-20 max-w-6xl mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-14">
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
                        Get Started In Just 3 Easy Steps
                    </h2>
                    <p className="mt-3 text-sm text-neutral-500">
                        Alur onboarding cepat dan intuitif untuk mulai membangun proyek dan membentuk tim kompetisi.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                    {/* Left Screen Preview Mockup */}
                    <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                        <div className="bg-white rounded-2xl border border-neutral-200/80 p-5 shadow-xs">
                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
                                <div className="size-7 rounded-lg bg-[#5448EE] text-white flex items-center justify-center text-xs font-bold">
                                    R
                                </div>
                                <span className="text-xs font-bold text-neutral-900">RAKIT Onboarding System</span>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200">
                                    <span className="text-[10px] text-neutral-400 font-bold block mb-1">LANGKAH SAAT INI</span>
                                    <h4 className="text-xs font-bold text-neutral-900">
                                        {stepIndex === 0 && 'Lengkapi Profil & Keahlian Mahasiswa'}
                                        {stepIndex === 1 && 'Cari Peluang & Rekomendasi Rekan Tim'}
                                        {stepIndex === 2 && 'Buka Workspace Kanban & Dokumentasi'}
                                    </h4>
                                    <p className="text-[11px] text-neutral-500 mt-1">
                                        {stepIndex === 0 && 'Pilih program studi, keahlian utama, dan ketersediaan jam kerja per minggu.'}
                                        {stepIndex === 1 && 'Lihat skor kecocokan matematis 0-100% dan lamar peran yang dibuka ketua proyek.'}
                                        {stepIndex === 2 && 'Kelola sprint tugas, unggah link karya, dan klaim pencapaian terverifikasi.'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between text-xs pt-2">
                                    <span className="text-neutral-400 font-medium">Status Akun: Aktif</span>
                                    <span className="text-[#5448EE] font-bold">Langkah {stepIndex + 1} dari 3</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Step Accordions */}
                    <div className="flex flex-col gap-4">
                        {/* Step 1 */}
                        <div
                            onClick={() => setStepIndex(0)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                                stepIndex === 0
                                    ? 'bg-gradient-to-r from-purple-50/80 to-white border-purple-200 shadow-sm'
                                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    stepIndex === 0 ? 'bg-[#5448EE] text-white' : 'bg-neutral-100 text-neutral-600'
                                }`}>
                                    01
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-neutral-900">Simple And Fast Setup</h4>
                                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                        Daftar menggunakan akun kampus Polindra, pilih bidang keahlian, dan tentukan jam ketersediaan mingguan.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div
                            onClick={() => setStepIndex(1)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                                stepIndex === 1
                                    ? 'bg-gradient-to-r from-purple-50/80 to-white border-purple-200 shadow-sm'
                                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    stepIndex === 1 ? 'bg-[#5448EE] text-white' : 'bg-neutral-100 text-neutral-600'
                                }`}>
                                    02
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-neutral-900">Work Together Effortlessly</h4>
                                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                        Temukan kolaborator ideal lewat Smart Matching atau bentuk tim baru untuk kompetisi hackathon nasional.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div
                            onClick={() => setStepIndex(2)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                                stepIndex === 2
                                    ? 'bg-gradient-to-r from-purple-50/80 to-white border-purple-200 shadow-sm'
                                    : 'bg-white border-neutral-200 hover:border-neutral-300'
                            }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                    stepIndex === 2 ? 'bg-[#5448EE] text-white' : 'bg-neutral-100 text-neutral-600'
                                }`}>
                                    03
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-neutral-900">Monitor Your Progress & Achievements</h4>
                                    <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                                        Kelola milestone proyek dengan Kanban terintegrasi, bangun portofolio publik, dan klaim pengakuan kampus.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 8. Success Stories & Real Impact */}
            <section id="testimonials" className="py-20 bg-neutral-50/60 border-t border-neutral-100">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto mb-14">
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900">
                            Real Results, Real Impact. <br /> Our Success Stories
                        </h2>
                        <p className="mt-3 text-sm text-neutral-500">
                            Pengalaman nyata mahasiswa Polindra yang sukses membangun tim dan menjuarai kompetisi.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Testimonial 1 */}
                        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-1 text-amber-400 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="size-4 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-xs text-neutral-600 leading-relaxed italic">
                                    "Lewat Smart Matching di RAKIT, kami menemukan rekan tim mobile developer dalam waktu 2 hari. Tim kami lolos tahap final kompetisi inovasi!"
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-100">
                                <div className="size-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                                    B
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-neutral-900">Budi Santoso</h5>
                                    <span className="text-[10px] text-neutral-400">Project Leader IoT • Polindra</span>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 2 */}
                        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-1 text-amber-400 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="size-4 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-xs text-neutral-600 leading-relaxed italic">
                                    "Kanban workspace-nya sangat intuitif. Pembagian tugas dan pelacakan deadline hackathon jadi rapi dan transparan antar anggota tim."
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-100">
                                <div className="size-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                                    S
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-neutral-900">Siti Rahma</h5>
                                    <span className="text-[10px] text-neutral-400">Mobile Flutter Dev • Teknik Informatika</span>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial 3 */}
                        <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-1 text-amber-400 mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className="size-4 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-xs text-neutral-600 leading-relaxed italic">
                                    "Portofolio publik otomatis memudahkan saya melampirkan bukti kontribusi nyata saat mendaftar magang dan beasiswa."
                                </p>
                            </div>
                            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-neutral-100">
                                <div className="size-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                                    A
                                </div>
                                <div>
                                    <h5 className="text-xs font-bold text-neutral-900">Agus Prasetyo</h5>
                                    <span className="text-[10px] text-neutral-400">Backend Engineer • RPL Polindra</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 9. Bottom CTA Section */}
            <section className="py-20 relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="bg-gradient-to-r from-[#181135] via-[#221650] to-[#181135] rounded-3xl p-8 sm:p-14 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-[#5448EE]/20 blur-3xl rounded-full pointer-events-none" />
                        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight relative z-10">
                            Siap Membangun Tim & Raih Prestasi di Kampus?
                        </h2>
                        <p className="text-xs sm:text-sm text-neutral-300 mt-3 max-w-xl mx-auto relative z-10 leading-relaxed">
                            Bergabunglah bersama ratusan mahasiswa Politeknik Negeri Indramayu sekarang juga. Gratis dan terintegrasi penuh.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 relative z-10">
                            <Link
                                href={auth?.user ? "/dashboard" : "/register"}
                                className="bg-[#5448EE] hover:bg-[#4336D6] text-white text-xs sm:text-sm font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
                            >
                                Daftar Akun Mahasiswa
                            </Link>
                            <Link
                                href="/login"
                                className="bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold px-7 py-3.5 rounded-full border border-white/20 transition-all"
                            >
                                Masuk Akun Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* 10. Footer */}
            <footer className="border-t border-neutral-200 py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-[#5448EE] flex items-center justify-center text-white">
                            <Sparkles className="size-4 fill-white/20" />
                        </div>
                        <span className="text-sm font-bold text-neutral-900">
                            RAKIT Campus • Politeknik Negeri Indramayu
                        </span>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-neutral-500">
                        <Link href="/projects" className="hover:text-neutral-900 transition">Project Hub</Link>
                        <Link href="/competitions" className="hover:text-neutral-900 transition">Competition Hub</Link>
                        <Link href="/matching" className="hover:text-neutral-900 transition">Smart Matching</Link>
                        <Link href="/portfolio" className="hover:text-neutral-900 transition">Portofolio</Link>
                    </div>

                    <p className="text-xs text-neutral-400">
                        &copy; {new Date().getFullYear()} RAKIT Campus. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
