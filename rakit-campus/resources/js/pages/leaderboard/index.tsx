import AppLayout from '@/layouts/app-layout';
import SeoHead from '@/components/seo/SeoHead';
import { LeaderboardPodium, type LeaderboardRanking } from '@/components/ui/leaderboard-podium';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowDown,
    ArrowRight,
    ArrowUp,
    Award,
    Calendar,
    CheckCircle2,
    Clock,
    Filter,
    FolderKanban,
    HelpCircle,
    Info,
    Medal,
    Minus,
    Search,
    Shield,
    ShieldCheck,
    Sparkles,
    Star,
    Target,
    TrendingUp,
    Trophy,
    Users,
    X,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    activeHub: 'overall' | 'project' | 'competition';
    activePeriod: 'all_time' | 'monthly' | 'weekly';
    activeSubType?: string;
    searchQuery: string;
    leaderboard: {
        period: string;
        period_label: string;
        sub_type?: string;
        top_three: any[];
        rankings: any[];
        total_participants: number;
        current_user_context: any;
    };
    rules: any[];
    canManage: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Leaderboard', href: '/leaderboard' },
];

// Curated photos for Teams (collaborative squad, hackathon teamwork, discussions)
const TEAM_PLACEHOLDER_PHOTOS = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=250&q=80', // Tim berkolaborasi dengan laptop
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=250&q=80', // Mahasiswa kerja kelompok
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=250&q=80', // Sesi ide & brainstorming tim
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=250&q=80', // Tim kompak di meja diskusi
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=250&q=80', // Hackathon teamwork intensif
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=250&q=80', // Squad tech developer di ruang kerja
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=250&q=80', // Rekan tim solid & ceria
    'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=250&q=80', // Diskusi proyek kelompok
];

// Curated photos for Projects (software code, modern UI dashboard, apps, tech devices)
const PROJECT_PLACEHOLDER_PHOTOS = [
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=250&q=80', // Dashboard data & analitik modern
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=250&q=80', // Kode pemrograman di layar laptop
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=250&q=80', // Desain UI platform digital
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=250&q=80', // Prototipe website & aplikasi interaktif
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=250&q=80', // Terminal AI & arsitektur sistem
    'https://images.unsplash.com/photo-1555774698-0b77e0d5fac6?auto=format&fit=crop&w=250&q=80', // Antarmuka aplikasi smartphone modern
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=250&q=80', // Perangkat IoT hardware & mikrokontroler
    'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&w=250&q=80', // Digital product & sistem inovasi perangkat lunak
];

function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function getEntityVisual(item: any, activeHub: string, activeSubType?: string) {
    if (!item) {
        return {
            url: 'https://ui-avatars.com/api/?name=RC&background=2563EB&color=fff&size=96&bold=true',
            isTeam: false,
            isProject: false,
            isUser: true,
            name: 'Peserta',
            subtitle: '-',
            entityLabel: 'Peserta',
        };
    }

    // 1. Proyek (Karya / Aplikasi / Software)
    if (item.project || activeSubType === 'projects') {
        const proj = item.project || {};
        const title = proj.title || 'Proyek Inovasi';
        if (proj.cover_url) {
            return {
                url: proj.cover_url,
                isTeam: false,
                isProject: true,
                isUser: false,
                name: title,
                subtitle: proj.category ? `Kategori: ${proj.category}` : 'Proyek Inovasi',
                entityLabel: 'Proyek Inovasi',
            };
        }
        const key = String(proj.id || title);
        const index = hashString(key) % PROJECT_PLACEHOLDER_PHOTOS.length;
        return {
            url: PROJECT_PLACEHOLDER_PHOTOS[index],
            isTeam: false,
            isProject: true,
            isUser: false,
            name: title,
            subtitle: proj.category ? `Kategori: ${proj.category}` : 'Proyek Inovasi',
            entityLabel: 'Proyek Inovasi',
        };
    }

    // 2. Tim Kompetisi (Kelompok / Squad)
    if (item.team || activeSubType === 'teams') {
        const team = item.team || {};
        const teamName = team.name || 'Tim Kompetisi';
        const key = String(team.id || teamName);
        const index = hashString(key) % TEAM_PLACEHOLDER_PHOTOS.length;
        return {
            url: team.avatar || TEAM_PLACEHOLDER_PHOTOS[index],
            isTeam: true,
            isProject: false,
            isUser: false,
            name: teamName,
            subtitle: team.competition_name || 'Kompetisi Nasional',
            entityLabel: 'Tim Kompetisi',
        };
    }

    // 3. Mahasiswa / Pengguna (Individu)
    const user = item.user || {};
    const userName = user.name || 'Mahasiswa';
    const seed = encodeURIComponent(String(user.id || userName));
    const randomUserPhoto = `https://i.pravatar.cc/150?u=${seed}`;

    return {
        url: user.avatar || randomUserPhoto,
        isTeam: false,
        isProject: false,
        isUser: true,
        name: userName,
        subtitle: user.campus_name || 'Perguruan Tinggi',
        entityLabel: 'Mahasiswa',
    };
}

export default function LeaderboardIndex({
    activeHub,
    activePeriod,
    activeSubType,
    searchQuery,
    leaderboard,
    rules = [],
    canManage = false,
}: Props) {
    const [search, setSearch] = useState(searchQuery || '');
    const [rulesModalOpen, setRulesModalOpen] = useState(false);

    const handleSwitchHub = (hub: string) => {
        try {
            if (hub === 'competition' || hub === 'project') {
                localStorage.setItem('rakit_active_hub', hub);
                sessionStorage.setItem('rakit_hub_chosen', hub);
            }
        } catch {
            // ignore
        }
        router.get(
            '/leaderboard',
            { hub, period: activePeriod },
            { preserveState: false, preserveScroll: true }
        );
    };

    const handleSwitchPeriod = (period: string) => {
        router.get(
            '/leaderboard',
            { hub: activeHub, period, sub_type: activeSubType, search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSwitchSubType = (subType: string) => {
        router.get(
            '/leaderboard',
            { hub: activeHub, period: activePeriod, sub_type: subType, search },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/leaderboard',
            { hub: activeHub, period: activePeriod, sub_type: activeSubType, search },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Render rank change indicator (+2, -1, 0, NEW)
    const renderRankChange = (change: number | null | undefined) => {
        if (change === null || change === undefined) {
            return (
                <span className="inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                    BARU
                </span>
            );
        }
        if (change > 0) {
            return (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    <ArrowUp className="size-3 stroke-[3]" />
                    <span>{change}</span>
                </span>
            );
        }
        if (change < 0) {
            return (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                    <ArrowDown className="size-3 stroke-[3]" />
                    <span>{Math.abs(change)}</span>
                </span>
            );
        }
        return (
            <span className="inline-flex items-center text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md" title="Posisi tetap">
                <Minus className="size-3" />
            </span>
        );
    };

    const userContext = leaderboard.current_user_context;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <SeoHead
                title="Klasemen & Peringkat Mahasiswa Berprestasi Nasional"
                description="Papan peringkat mahasiswa berprestasi, kontributor proyek teraktif, dan tim juara kompetisi kampus terverifikasi di seluruh Indonesia."
                keywords="peringkat mahasiswa, klasemen kampus, mahasiswa berprestasi, juara lomba, leaderboard rakit campus"
                canonicalUrl="https://rakitcampus.my.id/leaderboard"
            />

            <div className="max-w-7xl mx-auto space-y-6 pb-20">
                {/* 1. TOP HERO HEADER with Mascot Trophy (Apple HIG Bento Context Card) */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="size-16 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
                            <img
                                src="/images/mascot/mascot-trophy.png"
                                alt="Mascot Champion Trophy"
                                className="w-full h-full object-contain drop-shadow-sm select-none pointer-events-none transform hover:scale-105 transition"
                            />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/80 text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">
                                <Award className="size-3 text-amber-600" />
                                <span>Hall of Fame & Podium Nasional</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                                Klasemen & Peringkat RAKIT Campus
                            </h1>
                            <p className="text-xs text-slate-500 mt-1 max-w-xl">
                                Panggung prestasi mahasiswa, kontributor proyek teraktif, dan tim juara kompetisi terverifikasi se-Indonesia.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
                        <button
                            type="button"
                            onClick={() => setRulesModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                            <Info className="size-3.5 text-indigo-600" />
                            <span>Aturan Poin</span>
                        </button>

                        {canManage && (
                            <Link
                                href="/leaderboard/admin"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                            >
                                <Shield className="size-3.5" />
                                <span>Kelola Leaderboard</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* 2. MAIN HUB TABS & CONTROLS BAR (Apple iOS Segmented Control) */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                    {/* Primary Hub Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="bg-slate-200/60 p-1.5 rounded-2xl inline-flex items-center gap-1 border border-slate-200/60 shadow-2xs backdrop-blur-sm overflow-x-auto no-scrollbar">
                            {[
                                { id: 'overall', label: 'Klasemen Utama', icon: Trophy },
                                { id: 'project', label: 'Project Hub', icon: FolderKanban },
                                { id: 'competition', label: 'Competition Hub', icon: Award },
                            ].map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeHub === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => handleSwitchHub(tab.id as any)}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                                            isActive
                                                ? 'bg-white text-slate-900 font-bold shadow-xs'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                                        }`}
                                    >
                                        <Icon className={`size-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Period Filter (Apple Segmented Pill) */}
                        <div className="bg-slate-100/90 p-1 rounded-xl inline-flex items-center gap-1 shrink-0 self-start sm:self-auto border border-slate-200/50">
                            {[
                                { id: 'weekly', label: '7 Hari' },
                                { id: 'monthly', label: 'Bulan Ini' },
                                { id: 'all_time', label: 'Semua Waktu' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSwitchPeriod(p.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                        activePeriod === p.id
                                            ? 'bg-white text-slate-900 font-bold shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sub-type Filters & Search Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            {activeHub === 'project' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSubType('projects')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                            leaderboard.sub_type === 'projects'
                                                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs'
                                                : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        Peringkat Proyek
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSubType('contributors')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                            leaderboard.sub_type === 'contributors'
                                                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs'
                                                : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        Kontributor Teraktif
                                    </button>
                                </>
                            )}

                            {activeHub === 'competition' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSubType('students')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                            leaderboard.sub_type === 'students'
                                                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs'
                                                : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        Peringkat Mahasiswa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSubType('teams')}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                            leaderboard.sub_type === 'teams'
                                                ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/80 shadow-2xs'
                                                : 'text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        Peringkat Tim
                                    </button>
                                </>
                            )}

                            {activeHub === 'overall' && (
                                <span className="text-xs text-slate-500 font-medium">
                                    Periode: <strong className="text-slate-800 font-semibold">{leaderboard.period_label}</strong> · {leaderboard.total_participants} peserta aktif
                                </span>
                            )}
                        </div>

                        {/* Search Input */}
                        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nama / kampus..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                            />
                        </form>
                    </div>
                </div>

                {/* 3. TOP 3 PODIUM SECTION */}
                {leaderboard.top_three && leaderboard.top_three.length >= 2 && !search && (
                    <div className="space-y-6 pt-2">
                        {/* Interactive Visual Olympic Podium */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center">
                            <LeaderboardPodium
                                rankings={leaderboard.top_three.slice(0, 3).map((item: any, idx: number) => {
                                    const v = getEntityVisual(item, activeHub, leaderboard.sub_type);
                                    return {
                                        userId: String(item.user?.id || item.team?.id || item.project?.id || idx + 1),
                                        userName: v.name,
                                        rank: (item.rank || idx + 1) as 1 | 2 | 3,
                                        value: item.points || 0,
                                        avatarUrl: v.url,
                                        entityType: v.isProject ? ('project' as const) : v.isTeam ? ('team' as const) : ('user' as const),
                                    };
                                })}
                                size="default"
                                medalStyle="modern"
                                showValue={true}
                                showAvatar={true}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                            {/* 2nd Place (Silver) */}
                            {leaderboard.top_three[1] && (() => {
                                const item2 = leaderboard.top_three[1];
                                const v2 = getEntityVisual(item2, activeHub, leaderboard.sub_type);
                                return (
                                    <div className="order-2 md:order-1 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between items-center text-center relative overflow-hidden group">
                                        <div className="absolute top-4 left-4">
                                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                                                #2
                                            </span>
                                        </div>
                                        <div className="absolute top-4 right-4">
                                            {renderRankChange(item2.rank_change)}
                                        </div>

                                        <div className="mt-4 flex flex-col items-center">
                                            <div className={`size-16 ${v2.isProject ? 'rounded-2xl' : 'rounded-full'} bg-slate-100 border-2 border-slate-200 flex items-center justify-center text-slate-700 font-black text-lg shadow-xs mb-3 overflow-hidden relative ring-2 ring-white`}>
                                                <img
                                                    src={v2.url}
                                                    alt={v2.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v2.name)}&background=64748B&color=fff&size=96&bold=true`;
                                                    }}
                                                />
                                            </div>
                                            <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1" title={v2.name}>
                                                {v2.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                                {v2.subtitle}
                                            </p>
                                            {item2.badge && (
                                                <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                                    {item2.badge.name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1.5">
                                            <Zap className="size-4 text-amber-500 fill-amber-500" />
                                            <span className="text-xl font-extrabold text-slate-900 font-mono">
                                                {item2.points.toLocaleString()}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-400">pts</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 1st Place (Gold Champion) */}
                            {leaderboard.top_three[0] && (() => {
                                const item1 = leaderboard.top_three[0];
                                const v1 = getEntityVisual(item1, activeHub, leaderboard.sub_type);
                                return (
                                    <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50/80 via-white to-white rounded-3xl p-6 border-2 border-amber-300 shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden group">
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 rounded-full bg-amber-400 text-amber-950 font-extrabold text-xs flex items-center gap-1 shadow-2xs">
                                                <Trophy className="size-3.5 shrink-0" />
                                                <span>Peringkat 1</span>
                                            </span>
                                        </div>
                                        <div className="absolute top-4 right-4">
                                            {renderRankChange(item1.rank_change)}
                                        </div>

                                        <div className="mt-5 flex flex-col items-center">
                                            <div className={`size-20 ${v1.isProject ? 'rounded-2xl' : 'rounded-full'} bg-amber-100 border-4 border-amber-300 flex items-center justify-center text-amber-900 font-black text-2xl shadow-sm mb-3 overflow-hidden relative ring-4 ring-amber-100`}>
                                                <img
                                                    src={v1.url}
                                                    alt={v1.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v1.name)}&background=D97706&color=fff&size=96&bold=true`;
                                                    }}
                                                />
                                            </div>
                                            <h3 className="font-extrabold text-base text-slate-900 line-clamp-1" title={v1.name}>
                                                {v1.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">
                                                {v1.subtitle}
                                            </p>
                                            {item1.badge && (
                                                <span className="mt-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                                    {item1.badge.name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-amber-100 w-full flex items-center justify-center gap-1.5">
                                            <Sparkles className="size-4 text-amber-500" />
                                            <span className="text-2xl font-extrabold text-slate-900 font-mono">
                                                {item1.points.toLocaleString()}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-400">pts</span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 3rd Place (Bronze) */}
                            {leaderboard.top_three[2] && (() => {
                                const item3 = leaderboard.top_three[2];
                                const v3 = getEntityVisual(item3, activeHub, leaderboard.sub_type);
                                return (
                                    <div className="order-3 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between items-center text-center relative overflow-hidden group">
                                        <div className="absolute top-4 left-4">
                                            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-200">
                                                #3
                                            </span>
                                        </div>
                                        <div className="absolute top-4 right-4">
                                            {renderRankChange(item3.rank_change)}
                                        </div>

                                        <div className="mt-4 flex flex-col items-center">
                                            <div className={`size-16 ${v3.isProject ? 'rounded-2xl' : 'rounded-full'} bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-800 font-black text-lg shadow-xs mb-3 overflow-hidden relative ring-2 ring-white`}>
                                                <img
                                                    src={v3.url}
                                                    alt={v3.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v3.name)}&background=B45309&color=fff&size=96&bold=true`;
                                                    }}
                                                />
                                            </div>
                                            <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1" title={v3.name}>
                                                {v3.name}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                                {v3.subtitle}
                                            </p>
                                            {item3.badge && (
                                                <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                                    {item3.badge.name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1.5">
                                            <Zap className="size-4 text-amber-500 fill-amber-500" />
                                            <span className="text-xl font-extrabold text-slate-900 font-mono">
                                                {item3.points.toLocaleString()}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-400">pts</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* 4. CURRENT LOGGED IN USER CONTEXT BANNER (Apple Squircle Dark Context Hub) */}
                {userContext && (
                    <div className="bg-slate-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-extrabold text-xl text-white shrink-0 shadow-xs">
                                #{userContext.rank}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-indigo-300">Posisi Peringkat Anda</span>
                                    {renderRankChange(userContext.rank_change)}
                                </div>
                                <h4 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                                    {userContext.points.toLocaleString()} Total Poin Terverifikasi
                                </h4>
                                {userContext.points_to_next > 0 && (
                                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                                        <TrendingUp className="size-3.5 shrink-0 text-emerald-400" />
                                        <span>
                                            Butuh <strong className="text-white">{userContext.points_to_next} poin lagi</strong> untuk menyalip peringkat #{userContext.next_target_rank}!
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                            <Link
                                href="/projects"
                                className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/10"
                            >
                                Kembangkan Proyek
                            </Link>
                            <Link
                                href="/competitions"
                                className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-xs"
                            >
                                Ikuti Kompetisi
                            </Link>
                        </div>
                    </div>
                )}

                {/* 5. RANKED TABLE LIST (Apple HIG Squircle List) */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                            <span>Daftar Lengkap Peringkat</span>
                            <span className="text-xs font-normal text-slate-400">({leaderboard.rankings.length} data)</span>
                        </h3>
                        <span className="text-xs text-slate-400">
                            Diperbarui otomatis secara real-time
                        </span>
                    </div>

                    {leaderboard.rankings.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <Target className="size-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-xs font-semibold text-slate-600">Belum ada aktivitas terverifikasi untuk filter ini.</p>
                            <p className="text-[11px] text-slate-400 mt-1">Selesaikan proyek atau ikuti kompetisi untuk mulai mengumpulkan skor.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 overflow-x-auto">
                            {leaderboard.rankings.map((item: any, idx: number) => {
                                const isMe = item.user?.is_current_user || item.is_my_team || item.is_my_project;
                                const v = getEntityVisual(item, activeHub, leaderboard.sub_type);

                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center justify-between gap-4 p-4 sm:px-6 transition ${
                                            isMe ? 'bg-indigo-50/50 font-semibold' : 'hover:bg-slate-50/80'
                                        }`}
                                    >
                                        {/* Left: Rank & Movement & Profile */}
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                            {/* Rank Number */}
                                            <div className="w-8 sm:w-10 text-center shrink-0">
                                                <span className={`text-sm sm:text-base font-extrabold font-mono ${
                                                    item.rank === 1 ? 'text-amber-500' : item.rank === 2 ? 'text-slate-500' : item.rank === 3 ? 'text-amber-700' : 'text-slate-700'
                                                }`}>
                                                    #{item.rank}
                                                </span>
                                            </div>

                                            {/* Rank Delta */}
                                            <div className="w-10 shrink-0 flex items-center justify-center">
                                                {renderRankChange(item.rank_change)}
                                            </div>

                                            {/* Avatar / Thumbnail */}
                                            <div className={`size-10 sm:size-11 ${v.isProject ? 'rounded-2xl' : 'rounded-full'} bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-xs font-bold text-slate-700 overflow-hidden shadow-2xs`}>
                                                <img
                                                    src={v.url}
                                                    alt={v.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(v.name)}&background=2563EB&color=fff&size=96&bold=true`;
                                                    }}
                                                />
                                            </div>

                                            {/* Name & Details */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={v.name}>
                                                        {v.name}
                                                    </h4>
                                                    {isMe && (
                                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                                                            Anda
                                                        </span>
                                                    )}
                                                    {item.badge && (
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                                            {item.badge.name}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                    {item.user?.campus_name && (
                                                        <span>{item.user.campus_name} • {item.user.major}</span>
                                                    )}
                                                    {item.team?.competition_name && (
                                                        <span>{item.team.competition_name} ({item.team.competition_level})</span>
                                                    )}
                                                    {item.project?.team_name && (
                                                        <span>Tim: {item.project.team_name} • {item.project.category}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right: Breakdown & Score */}
                                        <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-right">
                                            {/* Breakdown stats for overall */}
                                            {activeHub === 'overall' && (
                                                <div className="hidden sm:flex flex-col text-[11px] text-slate-400">
                                                    <span>Lomba: <strong className="text-slate-700">{item.competition_points} pts</strong></span>
                                                    <span>Proyek: <strong className="text-slate-700">{item.project_points} pts</strong></span>
                                                </div>
                                            )}

                                            {/* Activity count */}
                                            {item.total_activities > 0 && (
                                                <span className="hidden md:inline-block text-[11px] font-semibold text-slate-500 px-2.5 py-1 rounded-full bg-slate-100/70 border border-slate-200/50">
                                                    {item.total_activities} aktivitas
                                                </span>
                                            )}

                                            {/* Total Points */}
                                            <div className="min-w-[90px]">
                                                <div className="text-sm sm:text-base font-extrabold text-slate-900 font-mono">
                                                    {item.points.toLocaleString()}
                                                </div>
                                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                    Poin
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL: TRANSPARANSI ATURAN PENILAIAN */}
            {rulesModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[85vh] overflow-y-auto space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="size-5 text-blue-600" />
                                <h3 className="text-base font-extrabold text-slate-900">
                                    Transparansi Sistem Penilaian RAKIT
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRulesModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500">
                            Poin dihitung otomatis berbasis bukti nyata (verified ledger). Anti bot-farming & manipulasi.
                        </p>

                        <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Bobot Prestasi Kompetisi & Hackathon:
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
                                    <strong className="text-amber-900 block font-bold">Juara 1 (First Place)</strong>
                                    <span className="text-amber-800 text-[11px]">Base: 1.000 Poin × Bobot Tingkat</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <strong className="text-slate-900 block font-bold">Juara 2 (Second Place)</strong>
                                    <span className="text-slate-600 text-[11px]">Base: 750 Poin × Bobot Tingkat</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <strong className="text-slate-900 block font-bold">Juara 3 (Third Place)</strong>
                                    <span className="text-slate-600 text-[11px]">Base: 500 Poin × Bobot Tingkat</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <strong className="text-slate-900 block font-bold">Finalis Kompetisi</strong>
                                    <span className="text-slate-600 text-[11px]">Base: 250 Poin × Bobot Tingkat</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 space-y-1">
                                <span className="font-bold block">Pengali Bobot Tingkat Kompetisi:</span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                                    <div>Internasional: <strong>2.5×</strong></div>
                                    <div>Nasional: <strong>1.8×</strong></div>
                                    <div>Regional: <strong>1.3×</strong></div>
                                    <div>Kampus: <strong>1.0×</strong></div>
                                </div>
                            </div>

                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 pt-2">
                                Kontribusi Proyek (Project Hub):
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <strong className="text-slate-900 block font-bold">Proyek Selesai & Disetujui</strong>
                                    <span className="text-slate-600 text-[11px]">300 Poin Tim + Kontributor</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <strong className="text-slate-900 block font-bold">Pencapaian Milestone Proyek</strong>
                                    <span className="text-slate-600 text-[11px]">60 Poin per Milestone</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <strong className="text-slate-900 block font-bold">Tugas Kanban Diselesaikan</strong>
                                    <span className="text-slate-600 text-[11px]">20 Poin (Maks. 6 tugas/hari anti-farming)</span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                                    <strong className="text-slate-900 block font-bold">Deliverable Terverifikasi</strong>
                                    <span className="text-slate-600 text-[11px]">50 Poin per Berkas Disetujui</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setRulesModalOpen(false)}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                            >
                                Tutup Penjelasan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
