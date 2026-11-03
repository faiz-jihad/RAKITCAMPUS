import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Award,
    Briefcase,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Compass,
    ExternalLink,
    Filter,
    Layers,
    LogIn,
    MapPin,
    Search,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    UserCheck,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface RecommendedProject {
    id: number;
    title: string;
    slug: string;
    short_description: string;
    category: string;
    campus_name: string;
    tech_stack: string[];
    status: string;
    open_roles_count: number;
    open_roles: string[];
    match_score: number;
    matched_skills: string[];
    missing_skills: string[];
    role_compatibility: string;
    explanation: string;
    breakdown: {
        skills: number;
        roles: number;
        interests: number;
        experience: number;
        availability: number;
    };
}

interface Candidate {
    user_id: number;
    profile_slug: string;
    name: string;
    email?: string;
    avatar?: string;
    department: string;
    study_program: string;
    semester: number;
    headline: string;
    bio: string;
    availability_hours: number;
    skills: { name: string; proficiency: number }[];
    preferred_roles: string[];
    score: number;
    matched_skills: string[];
    missing_skills: string[];
    explanation: string;
    breakdown?: Record<string, number>;
}

interface LedProject {
    id: number;
    title: string;
    slug: string;
    open_roles: string[];
}

interface Props {
    recommendedProjects: RecommendedProject[];
    myLedProjects: LedProject[];
    selectedProjectId?: number;
    candidates?: Candidate[];
    profileCompletion?: { percent: number; missing: string[] } | null;
    userSkills?: string[];
    isGuest?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Beranda', href: '/' },
    { title: 'Smart Team Matching', href: '/matching' },
];

export default function MatchingIndex({
    recommendedProjects = [],
    myLedProjects = [],
    selectedProjectId = 0,
    candidates = [],
    profileCompletion,
    userSkills = [],
    isGuest = false,
}: Props) {
    const [tab, setTab] = useState<'projects' | 'candidates'>('projects');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeProjectFilter, setActiveProjectFilter] = useState<number>(selectedProjectId);

    const filteredProjects = recommendedProjects.filter((p) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            p.title.toLowerCase().includes(q) ||
            p.short_description.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.campus_name.toLowerCase().includes(q) ||
            p.matched_skills.some((s) => s.toLowerCase().includes(q))
        );
    });

    const getScoreBadgeColor = (score: number) => {
        if (score >= 90) return 'text-[#5448EE] bg-[#EEEDFD] border-[#5448EE]/20';
        if (score >= 75) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
        return 'text-amber-700 bg-amber-50 border-amber-200';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Smart Team Matching — Rekomendasi Tim & Proyek Berbasis AI" />

            {/* Atmosphere background container */}
            <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F8F6FF] relative text-[#0E121B] pb-20">
                {/* Ethereal background radial glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[340px] bg-gradient-to-b from-[#5448EE]/10 to-transparent blur-3xl pointer-events-none -z-0" />
                <div className="absolute top-48 right-10 w-96 h-96 bg-[#9B87F5]/10 rounded-full blur-3xl pointer-events-none -z-0" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-8">
                    {/* Hero Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEEDFD] border border-[#5448EE]/20 text-[#5448EE] text-xs font-semibold tracking-wide mb-4 shadow-sm">
                                <Sparkles className="size-3.5" />
                                <span>Algoritma Multikriteria & Pencocokan Profil Kampus</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0E121B] leading-tight">
                                Smart Team Matching
                            </h1>
                            <p className="text-sm sm:text-base text-neutral-600 mt-2.5 leading-relaxed">
                                Temukan proyek inovasi, tim kompetisi, dan rekan kolaborator ideal berdasarkan keselarasan keahlian teknis, preferensi peran, ketersediaan jam kerja, dan minat nyata Anda.
                            </p>
                        </div>

                        {/* Top quick actions */}
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href="/projects"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold shadow-sm transition"
                            >
                                <Compass className="size-4 text-[#5448EE]" />
                                <span>Eksplor Semua Proyek</span>
                            </Link>
                            <Link
                                href="/competitions"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200/80 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold shadow-sm transition"
                            >
                                <Award className="size-4 text-amber-500" />
                                <span>Kompetisi Terbuka</span>
                            </Link>
                        </div>
                    </div>

                    {/* Guest Callout Banner */}
                    {isGuest && (
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#5448EE] via-[#6152F6] to-[#7B68EE] p-6 sm:p-8 text-white shadow-xl shadow-[#5448EE]/20 border border-white/20">
                            {/* Decorative background orbs */}
                            <div className="absolute -top-12 -right-12 size-56 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                            <div className="absolute -bottom-10 right-1/3 size-40 bg-purple-300/20 rounded-full blur-xl pointer-events-none" />

                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="max-w-2xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white mb-3">
                                        <Zap className="size-3.5 text-amber-300" />
                                        <span>Mode Tamu • Pratinjau Rekomendasi Terbuka</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold leading-snug">
                                        Masuk untuk Melihat Skor Kecocokan Personal Anda
                                    </h2>
                                    <p className="text-xs sm:text-sm text-purple-100 mt-2 leading-relaxed">
                                        Saat ini Anda melihat daftar proyek publik unggulan. Masuk atau daftar akun mahasiswa terverifikasi untuk mengaktifkan perhitungan skor kecocokan otomatis sesuai skill matrix, peran favorit, dan jadwal Anda.
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 shrink-0">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#5448EE] hover:bg-neutral-100 text-xs sm:text-sm font-bold shadow-lg shadow-black/10 transition"
                                    >
                                        <LogIn className="size-4" />
                                        <span>Masuk Sekarang</span>
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md text-xs sm:text-sm font-semibold transition"
                                    >
                                        <span>Daftar Akun Mahasiswa</span>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Authenticated Profile Optimization Card */}
                    {!isGuest && profileCompletion && profileCompletion.percent < 85 && (
                        <div className="rounded-2xl bg-white border border-[#5448EE]/20 p-5 shadow-sm shadow-[#5448EE]/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-[#EEEDFD] flex items-center justify-center font-extrabold text-[#5448EE] text-sm shrink-0 border border-[#5448EE]/20">
                                    {profileCompletion.percent}%
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#0E121B] flex items-center gap-2">
                                        <span>Tingkatkan Akurasi Rekomendasi Tim</span>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                            Profil {profileCompletion.percent}% Selesai
                                        </span>
                                    </h4>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        Lengkapi keahlian teknis spesifik dan estimasi jam ketersediaan per minggu agar sistem dapat memasangkan Anda dengan proyek yang paling presisi.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/settings/profile"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-semibold shrink-0 shadow-sm transition"
                            >
                                <span>Lengkapi Profil</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    )}

                    {/* Navigation Tabs & Search Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setTab('projects')}
                                className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                                    tab === 'projects'
                                        ? 'bg-[#5448EE] text-white shadow-md shadow-[#5448EE]/25'
                                        : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200/80'
                                }`}
                            >
                                <Target className="size-4" />
                                <span>Rekomendasi Proyek ({recommendedProjects.length})</span>
                            </button>

                            {myLedProjects.length > 0 && (
                                <button
                                    onClick={() => setTab('candidates')}
                                    className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
                                        tab === 'candidates'
                                            ? 'bg-[#5448EE] text-white shadow-md shadow-[#5448EE]/25'
                                            : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200/80'
                                    }`}
                                >
                                    <Users className="size-4" />
                                    <span>Calon Kolaborator ({candidates.length})</span>
                                </button>
                            )}
                        </div>

                        {/* Search Input Filter */}
                        <div className="relative max-w-xs w-full">
                            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama, keahlian, kategori..."
                                className="w-full pl-9 pr-4 py-2 rounded-full border border-neutral-200/80 bg-white text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#5448EE]/20 focus:border-[#5448EE]"
                            />
                        </div>
                    </div>

                    {/* TAB 1: RECOMMENDED PROJECTS */}
                    {tab === 'projects' && (
                        <div className="flex flex-col gap-5">
                            {filteredProjects.length === 0 ? (
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-12 text-center shadow-sm">
                                    <div className="size-14 rounded-2xl bg-[#EEEDFD] text-[#5448EE] flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="size-7" />
                                    </div>
                                    <h3 className="text-base font-bold text-neutral-800">
                                        Tidak Ada Proyek yang Cocok dengan Kriteria
                                    </h3>
                                    <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                                        {searchQuery
                                            ? 'Coba gunakan kata kunci pencarian yang berbeda untuk menemukan proyek lainnya.'
                                            : 'Saat ini belum ada proyek baru dengan kuota rekrutmen aktif. Silakan cek kembali dalam waktu dekat.'}
                                    </p>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="mt-4 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#EEEDFD] text-[#5448EE] hover:bg-[#5448EE] hover:text-white transition"
                                        >
                                            Reset Pencarian
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-5">
                                    {filteredProjects.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group rounded-3xl bg-white border border-neutral-200/80 hover:border-[#5448EE]/40 p-6 shadow-sm hover:shadow-xl hover:shadow-[#5448EE]/10 transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                                        >
                                            {/* Project Info Block */}
                                            <div className="flex-1 min-w-0">
                                                {/* Badges row */}
                                                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                                                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] border border-[#5448EE]/20">
                                                        {item.category}
                                                    </span>
                                                    <span className="text-neutral-300">•</span>
                                                    <span className="inline-flex items-center gap-1 text-xs text-neutral-500 font-medium">
                                                        <MapPin className="size-3 text-neutral-400" />
                                                        <span>{item.campus_name}</span>
                                                    </span>
                                                    {item.open_roles_count > 0 && (
                                                        <>
                                                            <span className="text-neutral-300">•</span>
                                                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                                {item.open_roles_count} Posisi Terbuka
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Project Title */}
                                                <Link href={`/projects/${item.id}`} className="block group-hover:text-[#5448EE] transition">
                                                    <h3 className="text-lg font-bold text-[#0E121B] leading-snug">
                                                        {item.title}
                                                    </h3>
                                                </Link>

                                                {/* Short Description */}
                                                <p className="text-xs text-neutral-600 mt-1.5 line-clamp-2 leading-relaxed">
                                                    {item.short_description}
                                                </p>

                                                {/* Open roles list */}
                                                {item.open_roles.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                                        <span className="text-[11px] font-medium text-neutral-400 mr-1 flex items-center gap-1">
                                                            <Briefcase className="size-3 text-neutral-400" />
                                                            <span>Dicari:</span>
                                                        </span>
                                                        {item.open_roles.map((roleName, rIdx) => (
                                                            <span
                                                                key={rIdx}
                                                                className="text-[11px] font-semibold bg-neutral-100 hover:bg-[#EEEDFD] text-neutral-700 hover:text-[#5448EE] px-2.5 py-0.5 rounded-full transition"
                                                            >
                                                                {roleName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Matched Skills pills */}
                                                {item.matched_skills.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                                        <span className="text-[11px] font-medium text-neutral-400 mr-1 flex items-center gap-1">
                                                            <CheckCircle2 className="size-3 text-emerald-600" />
                                                            <span>Keahlian Cocok:</span>
                                                        </span>
                                                        {item.matched_skills.map((skill, sIdx) => (
                                                            <span
                                                                key={sIdx}
                                                                className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2.5 py-0.5 rounded-full"
                                                            >
                                                                <Check className="size-2.5 text-emerald-600" />
                                                                <span>{skill}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Transparent AI explanation pill */}
                                                <div className="mt-3.5 inline-flex items-start gap-2 text-xs text-purple-900 bg-[#FAF8FF] border border-[#5448EE]/15 p-2.5 rounded-xl w-full">
                                                    <Sparkles className="size-4 shrink-0 text-[#5448EE] mt-0.5" />
                                                    <span className="text-[11px] leading-relaxed">
                                                        {item.explanation}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Match Gauge & CTA Block */}
                                            <div className="flex lg:flex-col items-center justify-between lg:justify-center gap-4 shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-100 pt-4 lg:pt-0 lg:pl-6 min-w-[190px]">
                                                {/* Score badge */}
                                                <div className="flex items-center lg:flex-col gap-3 lg:gap-1 text-center">
                                                    <div className={`size-14 sm:size-16 rounded-2xl flex items-center justify-center font-extrabold text-xl sm:text-2xl border ${getScoreBadgeColor(item.match_score)}`}>
                                                        {item.match_score}%
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                                                            Match Score
                                                        </span>
                                                        <span className="text-[10px] text-neutral-400 block">
                                                            {item.role_compatibility}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action CTA */}
                                                <div className="flex flex-col gap-2 w-full sm:w-auto lg:w-full">
                                                    <Link
                                                        href={`/projects/${item.id}`}
                                                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#5448EE] hover:bg-[#4336D9] text-white text-xs font-bold shadow-md shadow-[#5448EE]/20 hover:shadow-lg hover:shadow-[#5448EE]/30 transition w-full"
                                                    >
                                                        <span>Lihat Proyek</span>
                                                        <ArrowRight className="size-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: FIND CANDIDATES FOR LED PROJECT */}
                    {tab === 'candidates' && myLedProjects.length > 0 && (
                        <div className="flex flex-col gap-6">
                            {/* Project selector dropdown */}
                            <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                                        Proyek yang Anda Pimpin
                                    </h3>
                                    <p className="text-xs text-neutral-600 mt-0.5">
                                        Pilih proyek untuk mencari calon anggota dengan kecocokan tertinggi.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {myLedProjects.map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/matching?project_id=${p.id}`}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                                                activeProjectFilter === p.id
                                                    ? 'bg-[#5448EE] text-white border-[#5448EE]'
                                                    : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                                            }`}
                                        >
                                            {p.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Candidate Cards */}
                            {candidates && candidates.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {candidates.map((cand, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded-3xl bg-white border border-neutral-200/80 hover:border-[#5448EE]/40 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between gap-4"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-11 rounded-full bg-[#EEEDFD] text-[#5448EE] font-bold text-sm flex items-center justify-center border border-[#5448EE]/20 overflow-hidden">
                                                            {cand.avatar ? (
                                                                <img src={cand.avatar} alt={cand.name} className="size-full object-cover" />
                                                            ) : (
                                                                cand.name.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-[#0E121B]">
                                                                {cand.name}
                                                            </h4>
                                                            <p className="text-xs text-neutral-500">
                                                                {cand.study_program} • Semester {cand.semester}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className={`px-2.5 py-1 rounded-xl font-bold text-xs border ${getScoreBadgeColor(cand.score)}`}>
                                                        {cand.score}% Cocok
                                                    </div>
                                                </div>

                                                {/* Bio / Headline */}
                                                <p className="text-xs text-neutral-600 mt-3 line-clamp-2 leading-relaxed">
                                                    {cand.bio || cand.headline || 'Mahasiswa aktif dengan minat kolaborasi proyek.'}
                                                </p>

                                                {/* Skills chips */}
                                                {cand.skills && cand.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {cand.skills.slice(0, 5).map((s, sIdx) => (
                                                            <span
                                                                key={sIdx}
                                                                className="text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md"
                                                            >
                                                                {s.name} ({s.proficiency}/5)
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* AI Matching explanation */}
                                                <div className="mt-3 text-[11px] text-purple-900 bg-[#FAF8FF] border border-[#5448EE]/15 p-2.5 rounded-xl">
                                                    <span className="font-semibold text-[#5448EE]">Analisis Kecocokan: </span>
                                                    {cand.explanation}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-neutral-100 mt-2">
                                                <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                                                    <Clock className="size-3.5 text-neutral-400" />
                                                    <span>{cand.availability_hours} jam/minggu</span>
                                                </span>
                                                <Link
                                                    href={cand.profile_slug ? `/p/${cand.profile_slug}` : `/projects`}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-[#5448EE] text-white text-xs font-semibold transition"
                                                >
                                                    <span>Lihat Profil</span>
                                                    <ExternalLink className="size-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-3xl bg-white border border-neutral-200/80 p-8 text-center text-xs text-neutral-500">
                                    Belum ada kandidat aktif yang cocok dengan kriteria proyek ini saat ini.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
