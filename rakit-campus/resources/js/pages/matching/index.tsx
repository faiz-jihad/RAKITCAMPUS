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
    complementary_skills?: string[];
    role_compatibility: string;
    explanation: string;
    breakdown: {
        skills: number;
        roles: number;
        interests: number;
        experience: number;
        availability: number;
        diversity?: number;
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
    complementary_skills?: string[];
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
    hasActiveProject?: boolean;
    activeProject?: { id: number; title: string; role_name: string } | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Beranda', href: '/' },
    { title: 'Cari Teman Tim', href: '/matching' },
];

export default function MatchingIndex({
    recommendedProjects = [],
    myLedProjects = [],
    selectedProjectId = 0,
    candidates = [],
    profileCompletion,
    userSkills = [],
    isGuest = false,
    hasActiveProject = false,
    activeProject = null,
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
        if (score >= 90) return 'text-blue-700 bg-blue-500/10 border-blue-500/20';
        if (score >= 75) return 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20';
        return 'text-amber-700 bg-amber-500/10 border-amber-500/20';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cari Teman Tim & Rekomendasi Cerdas — RAKIT Campus" />

            {/* Main container */}
            <div className="min-h-screen bg-[#F8FAFC] relative text-slate-900 pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 relative z-10 flex flex-col gap-6">

                    {/* Minimal Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            Cari Rekan Tim Proyek
                        </h1>

                        <div className="flex items-center gap-2.5 shrink-0">
                            <Link
                                href="/projects"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 border border-slate-200/80 text-xs font-semibold shadow-2xs transition"
                            >
                                <Compass className="size-4 text-blue-600" />
                                <span>Semua Proyek</span>
                            </Link>
                        </div>
                    </div>

                    {/* ACTIVE PROJECT RULE ALERT (RULE 1) */}
                    {hasActiveProject && activeProject && (
                        <div className="glass-card rounded-2xl p-4 sm:p-5 border-l-4 border-l-blue-600 bg-white/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start sm:items-center gap-3.5">
                                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center shrink-0">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span>Aturan 1 Mahasiswa 1 Proyek Aktif Terpenuhi</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                            Status: Aktif Berkolaborasi
                                        </span>
                                    </h4>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Saat ini Anda sedang aktif di proyek <strong className="text-slate-900">{activeProject.title}</strong> sebagai <strong className="text-slate-900">{activeProject.role_name}</strong>. Anda dapat menjelajahi rekomendasi untuk referensi atau semester berikutnya.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={`/projects/${activeProject.id}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 shadow-2xs transition"
                            >
                                <span>Lihat Proyek Aktif</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    )}

                    {/* GUEST BANNER */}
                    {isGuest && (
                        <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
                            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="max-w-2xl">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-300 mb-3 border border-white/10">
                                        <Zap className="size-3.5 text-amber-300" />
                                        <span>Mode Tamu • Rekomendasi Terbuka</span>
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                                        Masuk untuk Rekomendasi Proyek yang Presisi
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                                        Daftarkan profil mahasiswa dan keahlian Anda untuk membuka perhitungan kecocokan 6-komponen (Skill, Peran, Minat, Waktu, Diversitas, dan Kesempatan Adil).
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 shrink-0">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md transition"
                                    >
                                        <LogIn className="size-4" />
                                        <span>Masuk Sekarang</span>
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs sm:text-sm font-semibold transition"
                                    >
                                        <span>Daftar Akun Mahasiswa</span>
                                        <ArrowRight className="size-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AUTHENTICATED PROFILE PROGRESS CARD */}
                    {!isGuest && profileCompletion && profileCompletion.percent < 85 && (
                        <div className="glass-card rounded-2xl p-4 sm:p-5 bg-white/85 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="size-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center font-black text-blue-600 text-sm shrink-0">
                                    {profileCompletion.percent}%
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <span>Tingkatkan Akurasi Rekomendasi Tim</span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                            Profil {profileCompletion.percent}% Lengkap
                                        </span>
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Lengkapi keahlian teknis spesifik dan estimasi jam luang per minggu agar algoritma memasangkan Anda dengan proyek yang paling presisi.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/settings/profile"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 shadow-2xs transition"
                            >
                                <span>Lengkapi Profil</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    )}

                    {/* NAVIGATION SEGMENTED TABS & SEARCH CONTROLS */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-3">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setTab('projects')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                                    tab === 'projects'
                                        ? 'bg-blue-600 text-white shadow-2xs'
                                        : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
                                }`}
                            >
                                <Target className="size-4" />
                                <span>Rekomendasi Proyek ({recommendedProjects.length})</span>
                            </button>

                            {myLedProjects.length > 0 && (
                                <button
                                    onClick={() => setTab('candidates')}
                                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${
                                        tab === 'candidates'
                                            ? 'bg-blue-600 text-white shadow-2xs'
                                            : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80'
                                    }`}
                                >
                                    <Users className="size-4" />
                                    <span>Calon Kolaborator ({candidates.length})</span>
                                </button>
                            )}
                        </div>

                        {/* Search Input Filter */}
                        <div className="relative max-w-xs w-full">
                            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama, keahlian, topik..."
                                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200/80 bg-white/80 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                            />
                        </div>
                    </div>

                    {/* TAB 1: RECOMMENDED PROJECTS */}
                    {tab === 'projects' && (
                        <div className="flex flex-col gap-4">
                            {filteredProjects.length === 0 ? (
                                <div className="glass-card rounded-3xl p-12 text-center bg-white/85">
                                    <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto mb-3">
                                        <Sparkles className="size-6" />
                                    </div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                        Tidak Ada Proyek yang Sesuai dengan Kriteria
                                    </h3>
                                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                                        {searchQuery
                                            ? 'Coba gunakan kata kunci pencarian berbeda untuk menemukan proyek lainnya.'
                                            : 'Saat ini belum ada proyek baru dengan kuota terbuka. Silakan cek kembali dalam waktu dekat.'}
                                    </p>
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="mt-3.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                                        >
                                            Reset Pencarian
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredProjects.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group glass-card rounded-3xl p-6 bg-white/85 hover:bg-white/95 border border-white/85 hover:border-blue-200 shadow-2xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                                        >
                                            {/* Left: Project Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80">
                                                        {item.category}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                                                        <MapPin className="size-3 text-slate-400" />
                                                        <span>{item.campus_name}</span>
                                                    </span>
                                                    {item.open_roles_count > 0 && (
                                                        <>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                                {item.open_roles_count} Posisi Terbuka
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                <Link href={`/projects/${item.id}`} className="block group-hover:text-blue-600 transition">
                                                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                                                        {item.title}
                                                    </h3>
                                                </Link>

                                                <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
                                                    {item.short_description}
                                                </p>

                                                {/* Open roles */}
                                                {item.open_roles.length > 0 && (
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                                        <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                                                            <Briefcase className="size-3 text-slate-400" />
                                                            <span>Dicari:</span>
                                                        </span>
                                                        {item.open_roles.map((roleName, rIdx) => (
                                                            <span
                                                                key={rIdx}
                                                                className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg"
                                                            >
                                                                {roleName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Matched & Complementary Skills */}
                                                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                                                    {item.matched_skills.length > 0 && (
                                                        <>
                                                            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                                                                <CheckCircle2 className="size-3 text-emerald-600" />
                                                                <span>Keahlian Cocok:</span>
                                                            </span>
                                                            {item.matched_skills.map((skill, sIdx) => (
                                                                <span
                                                                    key={sIdx}
                                                                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-md"
                                                                >
                                                                    <Check className="size-2.5 text-emerald-600" />
                                                                    <span>{skill}</span>
                                                                </span>
                                                            ))}
                                                        </>
                                                    )}

                                                    {item.complementary_skills && item.complementary_skills.length > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200/80 px-2 py-0.5 rounded-md">
                                                            <span>+ Variasi Baru ({item.complementary_skills.slice(0, 2).join(', ')})</span>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Transparent AI explanation pill */}
                                                <div className="mt-3.5 inline-flex items-start gap-2 text-xs text-slate-700 bg-slate-50 border border-slate-200/90 p-2.5 rounded-xl w-full">
                                                    <Sparkles className="size-4 shrink-0 text-blue-600 mt-0.5" />
                                                    <span className="text-[11px] leading-relaxed">
                                                        {item.explanation}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right: Score Gauge & Action */}
                                            <div className="flex lg:flex-col items-center justify-between lg:justify-center gap-4 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200/80 pt-4 lg:pt-0 lg:pl-6 min-w-[190px]">
                                                <div className="flex items-center lg:flex-col gap-3 lg:gap-1 text-center">
                                                    <div className={`size-14 sm:size-16 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl border ${getScoreBadgeColor(item.match_score)}`}>
                                                        {item.match_score}%
                                                    </div>
                                                    <div>
                                                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                                                            Skor Kecocokan
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">
                                                            {item.role_compatibility}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 w-full sm:w-auto lg:w-full">
                                                    <Link
                                                        href={`/projects/${item.id}`}
                                                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition w-full"
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
                        <div className="flex flex-col gap-5">
                            {/* Project selector dropdown */}
                            <div className="glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/85">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                        Proyek yang Anda Pimpin
                                    </h3>
                                    <p className="text-xs text-slate-600 mt-0.5">
                                        Pilih proyek untuk mencari calon anggota dengan kecocokan dan afirmasi fairness tertinggi.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {myLedProjects.map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/matching?project_id=${p.id}`}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                                                activeProjectFilter === p.id
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {p.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Candidate Cards Grid */}
                            {candidates && candidates.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {candidates.map((cand, idx) => (
                                        <div
                                            key={idx}
                                            className="glass-card rounded-3xl p-5 bg-white/85 hover:bg-white/95 border border-white/85 hover:border-blue-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-11 rounded-2xl bg-blue-500/10 text-blue-700 font-bold text-sm flex items-center justify-center border border-blue-500/20 overflow-hidden shrink-0">
                                                            {cand.avatar ? (
                                                                <img src={cand.avatar} alt={cand.name} className="size-full object-cover" />
                                                            ) : (
                                                                cand.name.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-bold text-slate-900">
                                                                {cand.name}
                                                            </h4>
                                                            <p className="text-xs text-slate-500">
                                                                {cand.study_program} • Semester {cand.semester}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className={`px-2.5 py-1 rounded-xl font-bold text-xs border ${getScoreBadgeColor(cand.score)}`}>
                                                        {cand.score}% Cocok
                                                    </div>
                                                </div>

                                                <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                                                    {cand.bio || cand.headline || 'Mahasiswa aktif dengan minat kolaborasi proyek.'}
                                                </p>

                                                {/* Skills chips */}
                                                {cand.skills && cand.skills.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {cand.skills.slice(0, 5).map((s, sIdx) => (
                                                            <span
                                                                key={sIdx}
                                                                className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                                                            >
                                                                {s.name} ({s.proficiency}/5)
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Explanation */}
                                                <div className="mt-3 text-[11px] text-slate-700 bg-slate-50 border border-slate-200/90 p-2.5 rounded-xl">
                                                    <span className="font-bold text-blue-700">Analisis Kecocokan: </span>
                                                    {cand.explanation}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-200/80 mt-2">
                                                <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                                    <Clock className="size-3.5 text-slate-400" />
                                                    <span>{cand.availability_hours} jam/minggu</span>
                                                </span>
                                                <Link
                                                    href={cand.profile_slug ? `/p/${cand.profile_slug}` : `/projects`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-semibold transition"
                                                >
                                                    <span>Lihat Profil</span>
                                                    <ExternalLink className="size-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="glass-card rounded-3xl p-8 text-center text-xs text-slate-500 bg-white/85">
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
