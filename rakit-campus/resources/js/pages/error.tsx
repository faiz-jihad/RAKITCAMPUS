import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { useLocale } from '@/hooks/use-locale';
import {
    ArrowLeft,
    Compass,
    FolderKanban,
    Home,
    Languages,
    RefreshCw,
    Trophy,
    Sparkles,
} from 'lucide-react';

interface ErrorProps {
    status?: number;
    message?: string;
}

export default function ErrorPage({ status = 404, message }: ErrorProps) {
    const { isEn, toggleLocale } = useLocale();

    // Mapping configurations based on HTTP error status
    const errorConfigs: Record<
        number,
        {
            badgeEn: string;
            badgeId: string;
            titleEn: string;
            titleId: string;
            descEn: string;
            descId: string;
            mascot: string;
            accentColor: string;
        }
    > = {
        404: {
            badgeEn: '404 · Page Not Found',
            badgeId: '404 · Halaman Tidak Ditemukan',
            titleEn: 'Lost in the Campus?',
            titleId: 'Tersesat di Kampus?',
            descEn:
                message ||
                "The page you're searching for doesn't exist, was moved, or the link has expired.",
            descId:
                message ||
                'Halaman yang Anda tuju tidak ditemukan, telah dipindahkan, atau tautan sudah usang.',
            mascot: '/images/mascot/mascot-thinking.png',
            accentColor: 'from-blue-500/10 via-indigo-500/5 to-transparent',
        },
        403: {
            badgeEn: '403 · Access Restricted',
            badgeId: '403 · Akses Terbatas',
            titleEn: 'Restricted Workspace',
            titleId: 'Area Akses Terbatas',
            descEn:
                message ||
                "You don't have the required permissions or student credentials to access this workspace.",
            descId:
                message ||
                'Anda belum memiliki izin atau peran yang sesuai untuk membuka direktori atau ruang kerja ini.',
            mascot: '/images/mascot/mascot-intense.png',
            accentColor: 'from-amber-500/10 via-rose-500/5 to-transparent',
        },
        500: {
            badgeEn: '500 · Server Hiccup',
            badgeId: '500 · Gangguan Server',
            titleEn: 'Engineers Are On It',
            titleId: 'Sistem Sedang Diperbaiki',
            descEn:
                message ||
                'Our servers encountered an unexpected hiccup. Our engineering team has been notified.',
            descId:
                message ||
                'Terjadi kendala teknis pada server kami. Tim teknis sedang melakukan pemeriksaan kilat.',
            mascot: '/images/mascot/mascot-laptop.png',
            accentColor: 'from-rose-500/10 via-purple-500/5 to-transparent',
        },
        503: {
            badgeEn: '503 · System Maintenance',
            badgeId: '503 · Pemeliharaan Sistem',
            titleEn: 'Upgrading the Campus',
            titleId: 'Peningkatan Infrastruktur',
            descEn:
                message ||
                'RAKIT Campus is undergoing scheduled improvements to make your collaborative experience faster.',
            descId:
                message ||
                'RAKIT Campus sedang melakukan peningkatan sistem terjadwal agar kolaborasi Anda lebih cepat.',
            mascot: '/images/mascot/mascot-laptop.png',
            accentColor: 'from-indigo-500/10 via-blue-500/5 to-transparent',
        },
    };

    const config = errorConfigs[status] || errorConfigs[404];

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between selection:bg-blue-600 selection:text-white font-sans text-slate-800 relative overflow-hidden">
            <Head title={`${status} — ${isEn ? config.badgeEn : config.badgeId} | RAKIT Campus`} />

            {/* Apple Ambient Soft Blurred Background Glows */}
            <div className="absolute top-[-15%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-200/40 blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[20%] w-[550px] h-[550px] rounded-full bg-indigo-200/35 blur-[140px] pointer-events-none" />

            {/* Top Navigation Bar: Brand & Language Toggle */}
            <header className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 sm:py-8 flex items-center justify-between">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2.5 group active:scale-95 transition-all"
                >
                    <div className="size-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:shadow-md transition">
                        <Sparkles className="size-4.5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition">
                            RAKIT <span className="text-blue-600">CAMPUS</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 -mt-1 tracking-wider uppercase">
                            National Platform
                        </span>
                    </div>
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={toggleLocale}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs text-xs font-bold text-slate-700 hover:text-slate-900 active:scale-95 transition cursor-pointer"
                        title={isEn ? 'Switch to Indonesian' : 'Ubah ke Bahasa Inggris'}
                    >
                        <Languages className="size-3.5 text-blue-600" />
                        <span>{isEn ? 'EN' : 'ID'}</span>
                    </button>
                </div>
            </header>

            {/* Main Center Hero: iOS Frosted Card with Mascot */}
            <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
                <div className="w-full max-w-lg bg-white/85 backdrop-blur-2xl rounded-[32px] sm:rounded-[40px] border border-slate-200/80 shadow-[0_12px_45px_-8px_rgba(0,0,0,0.06)] p-7 sm:p-10 text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                    {/* Mascot Squircle Container */}
                    <div className="relative mb-6">
                        <div className="size-32 sm:size-40 rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-white to-slate-50 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.06)] flex items-center justify-center p-3.5 group">
                            <img
                                src={config.mascot}
                                alt="RAKIT Mascot"
                                className="w-full h-full object-contain drop-shadow-sm select-none pointer-events-none transform group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300"
                            />
                        </div>

                        {/* Status Code Floater Badge */}
                        <div className="absolute -bottom-2.5 -right-2.5 px-3 py-1 rounded-full bg-slate-900 text-white font-mono font-extrabold text-xs shadow-md border border-slate-800">
                            {status}
                        </div>
                    </div>

                    {/* Pill Status Indicator */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 text-blue-700 border border-blue-200/60 text-[11px] font-bold uppercase tracking-wider mb-2.5">
                        <span className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
                        <span>{isEn ? config.badgeEn : config.badgeId}</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                        {isEn ? config.titleEn : config.titleId}
                    </h1>

                    {/* Descriptive copy */}
                    <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">
                        {isEn ? config.descEn : config.descId}
                    </p>

                    {/* Primary & Secondary Action CTAs */}
                    <div className="mt-7 flex flex-wrap items-center justify-center gap-3 w-full">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all w-full sm:w-auto"
                        >
                            <Home className="size-4" />
                            <span>{isEn ? 'Return to Dashboard' : 'Kembali ke Dashboard'}</span>
                        </Link>

                        <button
                            type="button"
                            onClick={() => {
                                if (typeof window !== 'undefined' && window.history.length > 1) {
                                    window.history.back();
                                } else {
                                    window.location.href = '/dashboard';
                                }
                            }}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/70 text-xs sm:text-sm font-semibold active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
                        >
                            <ArrowLeft className="size-4" />
                            <span>{isEn ? 'Previous Page' : 'Halaman Sebelumnya'}</span>
                        </button>
                    </div>

                    {/* Quick Hub Navigation Dock (iOS Segmented Style) */}
                    <div className="mt-8 pt-6 border-t border-slate-100 w-full">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                            {isEn ? 'Quick Navigation' : 'Navigasi Cepat'}
                        </span>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <Link
                                href="/competitions"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-amber-50 hover:text-amber-800 border border-slate-200/70 text-xs font-semibold text-slate-600 transition"
                            >
                                <Trophy className="size-3.5 text-amber-500" />
                                <span>{isEn ? 'Competitions' : 'Kompetisi'}</span>
                            </Link>

                            <Link
                                href="/projects"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-blue-50 hover:text-blue-800 border border-slate-200/70 text-xs font-semibold text-slate-600 transition"
                            >
                                <FolderKanban className="size-3.5 text-blue-500" />
                                <span>{isEn ? 'Projects' : 'Proyek'}</span>
                            </Link>

                            <Link
                                href="/leaderboard"
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-50 hover:bg-purple-50 hover:text-purple-800 border border-slate-200/70 text-xs font-semibold text-slate-600 transition"
                            >
                                <Compass className="size-3.5 text-purple-500" />
                                <span>{isEn ? 'Leaderboard' : 'Klasemen'}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Apple HIG Footer */}
            <footer className="relative z-10 w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-slate-400">
                <p>
                    RAKIT Campus · {isEn ? 'Designed with precision for students & university innovators' : 'Didesain presisi untuk mahasiswa & inovator kampus'}
                </p>
            </footer>
        </div>
    );
}
