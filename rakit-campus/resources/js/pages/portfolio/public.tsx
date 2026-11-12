import SeoHead from '@/components/seo/SeoHead';
import { Link } from '@inertiajs/react';
import {
    Award,
    Briefcase,
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    Copy,
    ExternalLink,
    FileText,
    FolderKanban,
    Github,
    Globe,
    GraduationCap,
    Linkedin,
    Mail,
    MapPin,
    MessageSquare,
    Send,
    Share2,
    ShieldCheck,
    Sparkles,
    Trophy,
    UserCheck,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    profile: {
        id: number;
        slug: string;
        headline?: string;
        bio?: string;
        study_program?: string;
        academic_year?: string;
        linkedin_url?: string;
        github_url?: string;
        website_url?: string;
        campus?: {
            id: number;
            name: string;
            slug?: string;
        };
        user: {
            id: number;
            name: string;
            avatar?: string;
            email?: string;
        };
        skills?: Array<{
            id: number;
            name: string;
            category?: string;
        }>;
        experiences?: Array<{
            id: number;
            title: string;
            company: string;
            period?: string;
        }>;
    };
    achievements: Array<{
        id: number;
        title: string;
        badge_level?: string;
        category?: string;
        description?: string;
        achieved_on?: string;
        evidence_url?: string;
        competition?: {
            id: number;
            name: string;
            slug?: string;
        };
        project?: {
            id: number;
            title: string;
            slug?: string;
        };
    }>;
    items: Array<{
        id: number;
        title: string;
        kind: string;
        url?: string;
        description?: string;
    }>;
}

export default function PortfolioPublic({ profile, achievements = [], items = [] }: Props) {
    const [copied, setCopied] = useState(false);
    const userName = profile?.user?.name || 'Mahasiswa';
    const headline = profile?.headline || 'Mahasiswa & Inovator Kampus • Terbuka untuk Kolaborasi Tim';
    const canonicalUrl = `https://rakitcampus.my.id/p/${encodeURIComponent(profile.slug)}`;

    const handleCopyLink = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(canonicalUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF] text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
            <SeoHead
                title={`Portofolio & Profil Profesional ${userName}`}
                description={`Lihat rekam jejak akademik, portofolio karya, dan riwayat prestasi kompetisi ${userName} (${headline}) di RAKIT Campus.`}
                keywords={`portofolio ${userName}, profil mahasiswa, rekam jejak ${userName}, ${profile?.campus?.name || ''}, rakit campus`}
                canonicalUrl={canonicalUrl}
                ogType="profile"
            />

            {/* LinkedIn-Style Navbar */}
            <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 px-4 sm:px-8 py-2.5">
                <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="inline-flex items-center gap-2 group">
                            <div className="size-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-xs group-hover:scale-105 transition-transform">
                                R
                            </div>
                            <span className="font-extrabold text-base tracking-tight text-slate-900">
                                RAKIT <span className="text-blue-600">CAMPUS</span>
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
                        <Link
                            href="/competitions"
                            className="hidden md:inline-flex px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
                        >
                            Eksplor Lomba
                        </Link>
                        <Link
                            href="/projects"
                            className="hidden md:inline-flex px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
                        >
                            Proyek
                        </Link>
                        <Link
                            href="/leaderboard"
                            className="hidden md:inline-flex px-3 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition"
                        >
                            Leaderboard
                        </Link>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-xs"
                        >
                            <span>Gabung Platform</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* LinkedIn-Style 2-Column Grid Container */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                    {/* ========================================================= */}
                    {/* LEFT / MAIN COLUMN (8 Columns on LG)                     */}
                    {/* ========================================================= */}
                    <div className="lg:col-span-8 space-y-4 sm:space-y-5">
                        {/* 1. HERO INTRO CARD (Cover Banner + Avatar + Details) */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                            {/* Cover Banner */}
                            <div className="h-36 sm:h-52 w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 relative">
                                <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                            </div>

                            {/* Overlapping Avatar & Action Buttons */}
                            <div className="px-5 sm:px-7 pb-6 relative">
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-20 mb-4">
                                    {/* Circular Avatar */}
                                    <div className="size-28 sm:size-36 rounded-full border-4 border-white bg-slate-900 shadow-md relative overflow-hidden flex items-center justify-center text-white font-black text-3xl sm:text-4xl shrink-0">
                                        {profile?.user?.avatar ? (
                                            <img
                                                src={profile.user.avatar}
                                                alt={userName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            userName.charAt(0).toUpperCase()
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <a
                                            href={`mailto:${profile.user?.email || 'support@rakitcampus.my.id'}`}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                                        >
                                            <Send className="size-3.5" />
                                            <span>Ajak Kolaborasi</span>
                                        </a>

                                        <button
                                            type="button"
                                            onClick={handleCopyLink}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                                        >
                                            {copied ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5" />}
                                            <span>{copied ? 'Tersalin' : 'Bagikan'}</span>
                                        </button>

                                        {profile.github_url && (
                                            <a
                                                href={profile.github_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 rounded-full border border-slate-300 hover:bg-slate-50 text-slate-700 transition"
                                                title="GitHub"
                                            >
                                                <Github className="size-4" />
                                            </a>
                                        )}

                                        {profile.linkedin_url && (
                                            <a
                                                href={profile.linkedin_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 rounded-full border border-slate-300 hover:bg-slate-50 text-blue-600 transition"
                                                title="LinkedIn"
                                            >
                                                <Linkedin className="size-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Identity Text */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                            {userName}
                                        </h1>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                            <ShieldCheck className="size-3 text-blue-600" />
                                            <span>Mahasiswa Terverifikasi</span>
                                        </span>
                                    </div>

                                    <p className="text-sm font-medium text-slate-700 leading-snug">
                                        {headline}
                                    </p>

                                    <div className="flex items-center gap-x-4 gap-y-1 text-xs text-slate-500 flex-wrap pt-1">
                                        {profile?.campus && (
                                            <div className="flex items-center gap-1">
                                                <Building2 className="size-3.5 text-slate-400" />
                                                <span className="font-semibold text-slate-700">{profile.campus.name}</span>
                                            </div>
                                        )}
                                        {profile?.study_program && (
                                            <div className="flex items-center gap-1">
                                                <GraduationCap className="size-3.5 text-slate-400" />
                                                <span>{profile.study_program}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 text-slate-400">
                                            <MapPin className="size-3.5" />
                                            <span>Indonesia</span>
                                        </div>
                                    </div>
                                </div>

                                {/* LinkedIn-Style "Open To Work / Collaborate" Box */}
                                <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1 text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-blue-900">Terbuka untuk Kolaborasi Tim</span>
                                        <span className="px-2 py-0.2 rounded-md bg-blue-600 text-white text-[10px] font-bold">Aktif</span>
                                    </div>
                                    <p className="text-[11px] text-slate-600">
                                        Siap bergabung sebagai anggota tim dalam hackathon, kompetisi riset, dan proyek kolaborasi kampus.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 2. TENTANG (ABOUT) CARD */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-3">
                            <h2 className="text-base font-bold text-slate-900">
                                Tentang
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {profile?.bio || 'Mahasiswa aktif dengan minat tinggi pada inovasi teknologi, kolaborasi tim, dan pemecahan masalah nyata melalui rekayasa perangkat lunak.'}
                            </p>
                        </div>

                        {/* 3. PENGALAMAN & PROYEK (EXPERIENCE) CARD */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <h2 className="text-base font-bold text-slate-900">
                                    Pengalaman & Karya Kolaborasi
                                </h2>
                                <span className="text-xs text-slate-400 font-semibold">
                                    {items.length} Entri
                                </span>
                            </div>

                            {items.length === 0 ? (
                                <p className="text-xs text-slate-400 py-3 text-center">
                                    Belum ada portofolio proyek publik yang dicantumkan.
                                </p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {items.map((item) => (
                                        <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group">
                                            <div className="flex items-start gap-3">
                                                <div className="size-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                                                    <FolderKanban className="size-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                        {item.title}
                                                    </h3>
                                                    {item.description && (
                                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {item.url && (
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition shrink-0"
                                                >
                                                    <ExternalLink className="size-3.5" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 4. PRESTASI & PENGHARGAAN (HONORS & AWARDS) CARD */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <h2 className="text-base font-bold text-slate-900">
                                    Prestasi & Penghargaan
                                </h2>
                                <span className="text-xs text-slate-400 font-semibold">
                                    {achievements.length} Terverifikasi
                                </span>
                            </div>

                            {achievements.length === 0 ? (
                                <p className="text-xs text-slate-400 py-3 text-center">
                                    Belum ada rekam jejak prestasi resmi yang dicatat.
                                </p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {achievements.map((ach) => (
                                        <div key={ach.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <div className="size-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Trophy className="size-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                                                            {ach.title}
                                                        </h3>
                                                        <span className="px-2 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                                                            {ach.badge_level || 'Prestasi'}
                                                        </span>
                                                    </div>
                                                    {ach.description && (
                                                        <p className="text-xs text-slate-500 mt-1">
                                                            {ach.description}
                                                        </p>
                                                    )}
                                                    {ach.achieved_on && (
                                                        <span className="text-[11px] text-slate-400 block mt-1">
                                                            Diperoleh: {ach.achieved_on}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {ach.evidence_url && (
                                                <a
                                                    href={ach.evidence_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline shrink-0"
                                                >
                                                    <span>Sertifikat</span>
                                                    <ExternalLink className="size-3" />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 5. KEAHLIAN (SKILLS) CARD */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-3">
                            <h2 className="text-base font-bold text-slate-900">
                                Keahlian Teknis
                            </h2>
                            {profile?.skills && profile.skills.length > 0 ? (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {profile.skills.map((skill) => (
                                        <span
                                            key={skill.id}
                                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 text-xs font-semibold border border-slate-200/80 transition"
                                        >
                                            {skill.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400">Belum ada keahlian yang dicantumkan.</p>
                            )}
                        </div>
                    </div>

                    {/* ========================================================= */}
                    {/* RIGHT / SIDEBAR COLUMN (4 Columns on LG)                  */}
                    {/* ========================================================= */}
                    <div className="lg:col-span-4 space-y-4 sm:space-y-5">
                        {/* Sidebar Card 1: Public Profile Link */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                Tautan Profil Publik
                            </h3>
                            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 break-all select-all">
                                {canonicalUrl}
                            </div>
                            <button
                                type="button"
                                onClick={handleCopyLink}
                                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                            >
                                {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                                <span>{copied ? 'Tautan Berhasil Disalin!' : 'Salin Tautan Profil'}</span>
                            </button>
                        </div>

                        {/* Sidebar Card 2: Academic Credentials */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                Afiliasi Akademik
                            </h3>
                            <div className="space-y-2 text-xs">
                                <div>
                                    <span className="text-[11px] text-slate-400 block">Perguruan Tinggi</span>
                                    <span className="font-bold text-slate-800">{profile?.campus?.name || 'Perguruan Tinggi Indonesia'}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 block">Program Studi</span>
                                    <span className="font-semibold text-slate-700">{profile?.study_program || 'Program Studi Terdaftar'}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] text-slate-400 block">Status Verifikasi</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                                        <CheckCircle2 className="size-3 text-emerald-600" />
                                        <span>Aktif & Terverifikasi</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar Card 3: Rekomendasi Kolaborator */}
                        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-3">
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                Rekomendasi Kolaborasi
                            </h3>
                            <p className="text-xs text-slate-500">
                                Temukan rekan tim potensial dengan minat kompetisi serupa di platform RAKIT Campus.
                            </p>
                            <Link
                                href="/competitions?tab=teams"
                                className="block text-center w-full py-2 rounded-xl border border-blue-200 hover:bg-blue-50 text-blue-600 font-bold text-xs transition"
                            >
                                Eksplor Bursa Tim Rekan &rarr;
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Public Footer */}
            <footer className="border-t border-slate-200/80 bg-white py-8 text-center text-xs text-slate-500 mt-12">
                <p>
                    Ditenagai oleh{' '}
                    <Link href="/" className="font-bold text-blue-600 hover:underline">
                        RAKIT Campus
                    </Link>{' '}
                    — Platform Kolaborasi & Matchmaking Mahasiswa Indonesia.
                </p>
            </footer>
        </div>
    );
}
