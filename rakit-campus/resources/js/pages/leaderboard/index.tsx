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
                {/* 1. TOP HERO HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Klasemen & Peringkat RAKIT Campus
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                        <button
                            type="button"
                            onClick={() => setRulesModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                        >
                            <Info className="size-3.5 text-blue-600" />
                            <span>Aturan Poin</span>
                        </button>

                        {canManage && (
                            <Link
                                href="/leaderboard/admin"
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                            >
                                <Shield className="size-3.5" />
                                <span>Kelola Leaderboard</span>
                            </Link>
                        )}
                    </div>
                </div>

                {/* 2. MAIN HUB TABS & CONTROLS BAR */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-4">
                    {/* Primary Hub Switcher (Overall vs Project vs Competition) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
                            <button
                                type="button"
                                onClick={() => handleSwitchHub('overall')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    activeHub === 'overall'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Trophy className="size-3.5" />
                                <span>Klasemen RAKIT (Overall)</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSwitchHub('project')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    activeHub === 'project'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <FolderKanban className="size-3.5" />
                                <span>Project Hub</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleSwitchHub('competition')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                    activeHub === 'competition'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Award className="size-3.5" />
                                <span>Competition Hub</span>
                            </button>
                        </div>

                        {/* Period Filter (Weekly / Monthly / All-Time) */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-start sm:self-auto">
                            {[
                                { id: 'weekly', label: '7 Hari' },
                                { id: 'monthly', label: 'Bulan Ini' },
                                { id: 'all_time', label: 'Semua Waktu' },
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handleSwitchPeriod(p.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                        activePeriod === p.id
                                            ? 'bg-white text-slate-900 shadow-2xs'
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
                        {/* Sub-type selector for Project or Competition Hub */}
                        <div className="flex items-center gap-1.5">
                            {activeHub === 'project' && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSubType('projects')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            leaderboard.sub_type === 'projects'
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        Peringkat Proyek
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSubType('contributors')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            leaderboard.sub_type === 'contributors'
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'text-slate-500 hover:bg-slate-50'
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
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            leaderboard.sub_type === 'students'
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        Peringkat Mahasiswa
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSwitchSubType('teams')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                                            leaderboard.sub_type === 'teams'
                                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        Peringkat Tim
                                    </button>
                                </>
                            )}

                            {activeHub === 'overall' && (
                                <span className="text-xs text-slate-500 font-medium">
                                    Periode: <strong className="text-slate-700">{leaderboard.period_label}</strong> · {leaderboard.total_participants} peserta aktif
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
                                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 transition"
                            />
                        </form>
                    </div>
                </div>

                {/* 3. TOP 3 PODIUM SECTION (Only when 2 or more entries exist) */}
                {leaderboard.top_three && leaderboard.top_three.length >= 2 && !search && (
                    <div className="space-y-6 pt-2">
                        {/* Interactive Visual Olympic Podium */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center">
                            <LeaderboardPodium
                                rankings={leaderboard.top_three.slice(0, 3).map((item: any, idx: number) => ({
                                    userId: String(item.user?.id || item.team?.id || item.project?.id || idx + 1),
                                    userName: item.user?.name || item.team?.name || item.project?.title || `Peserta #${item.rank || idx + 1}`,
                                    rank: (item.rank || idx + 1) as 1 | 2 | 3,
                                    value: item.points || 0,
                                    avatarUrl: item.user?.avatar || (item.user?.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(item.user.name)}&background=2563EB&color=fff` : null),
                                }))}
                                size="default"
                                medalStyle="modern"
                                showValue={true}
                                showAvatar={true}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 2nd Place (Silver) */}
                        {leaderboard.top_three[1] && (
                            <div className="order-2 md:order-1 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-slate-300 transition">
                                <div className="absolute top-3 left-3">
                                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shadow-2xs">
                                        #2
                                    </span>
                                </div>
                                <div className="absolute top-3 right-3">
                                    {renderRankChange(leaderboard.top_three[1].rank_change)}
                                </div>

                                <div className="mt-4 flex flex-col items-center">
                                    <div className="size-16 rounded-full bg-slate-100 border-2 border-slate-300 flex items-center justify-center text-slate-700 font-black text-lg shadow-xs mb-3 overflow-hidden">
                                        {leaderboard.top_three[1].user?.avatar ? (
                                            <img src={leaderboard.top_three[1].user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            leaderboard.top_three[1].user?.name?.slice(0, 2).toUpperCase() || 'P2'
                                        )}
                                    </div>
                                    <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                                        {leaderboard.top_three[1].user?.name || leaderboard.top_three[1].team?.name || leaderboard.top_three[1].project?.title}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                        {leaderboard.top_three[1].user?.campus_name || leaderboard.top_three[1].team?.competition_name || leaderboard.top_three[1].project?.category}
                                    </p>
                                    {leaderboard.top_three[1].badge && (
                                        <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                            {leaderboard.top_three[1].badge.name}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1.5">
                                    <Zap className="size-4 text-amber-500 fill-amber-500" />
                                    <span className="text-xl font-black text-slate-900 font-mono">
                                        {leaderboard.top_three[1].points.toLocaleString()}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-400">pts</span>
                                </div>
                            </div>
                        )}

                        {/* 1st Place (Gold Champion) */}
                        {leaderboard.top_three[0] && (
                            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50/70 via-white to-white rounded-2xl p-6 border-2 border-amber-300 shadow-xs flex flex-col justify-between items-center text-center relative overflow-hidden group">
                                <div className="absolute top-3 left-3">
                                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-amber-950 font-black text-xs flex items-center gap-1 shadow-2xs">
                                        <Trophy className="size-3 shrink-0" />
                                        <span>Peringkat 1</span>
                                    </span>
                                </div>
                                <div className="absolute top-3 right-3">
                                    {renderRankChange(leaderboard.top_three[0].rank_change)}
                                </div>

                                <div className="mt-5 flex flex-col items-center">
                                    <div className="size-20 rounded-full bg-amber-100 border-4 border-amber-300 flex items-center justify-center text-amber-900 font-black text-2xl shadow-sm mb-3 overflow-hidden">
                                        {leaderboard.top_three[0].user?.avatar ? (
                                            <img src={leaderboard.top_three[0].user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            leaderboard.top_three[0].user?.name?.slice(0, 2).toUpperCase() || 'P1'
                                        )}
                                    </div>
                                    <h3 className="font-black text-base text-slate-900 line-clamp-1">
                                        {leaderboard.top_three[0].user?.name || leaderboard.top_three[0].team?.name || leaderboard.top_three[0].project?.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 font-medium">
                                        {leaderboard.top_three[0].user?.campus_name || leaderboard.top_three[0].team?.competition_name || leaderboard.top_three[0].project?.category}
                                    </p>
                                    {leaderboard.top_three[0].badge && (
                                        <span className="mt-2 text-[11px] font-black px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                                            {leaderboard.top_three[0].badge.name}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-5 pt-3 border-t border-amber-100 w-full flex items-center justify-center gap-1.5">
                                    <Sparkles className="size-4 text-amber-500" />
                                    <span className="text-2xl font-black text-slate-900 font-mono">
                                        {leaderboard.top_three[0].points.toLocaleString()}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-400">pts</span>
                                </div>
                            </div>
                        )}

                        {/* 3rd Place (Bronze) */}
                        {leaderboard.top_three[2] && (
                            <div className="order-3 bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex flex-col justify-between items-center text-center relative overflow-hidden group hover:border-slate-300 transition">
                                <div className="absolute top-3 left-3">
                                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-200 shadow-2xs">
                                        #3
                                    </span>
                                </div>
                                <div className="absolute top-3 right-3">
                                    {renderRankChange(leaderboard.top_three[2].rank_change)}
                                </div>

                                <div className="mt-4 flex flex-col items-center">
                                    <div className="size-16 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-800 font-black text-lg shadow-xs mb-3 overflow-hidden">
                                        {leaderboard.top_three[2].user?.avatar ? (
                                            <img src={leaderboard.top_three[2].user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            leaderboard.top_three[2].user?.name?.slice(0, 2).toUpperCase() || 'P3'
                                        )}
                                    </div>
                                    <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                                        {leaderboard.top_three[2].user?.name || leaderboard.top_three[2].team?.name || leaderboard.top_three[2].project?.title}
                                    </h3>
                                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                        {leaderboard.top_three[2].user?.campus_name || leaderboard.top_three[2].team?.competition_name || leaderboard.top_three[2].project?.category}
                                    </p>
                                    {leaderboard.top_three[2].badge && (
                                        <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                            {leaderboard.top_three[2].badge.name}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1.5">
                                    <Zap className="size-4 text-amber-500 fill-amber-500" />
                                    <span className="text-xl font-black text-slate-900 font-mono">
                                        {leaderboard.top_three[2].points.toLocaleString()}
                                    </span>
                                    <span className="text-xs font-semibold text-slate-400">pts</span>
                                </div>
                            </div>
                        )}
                        </div>
                    </div>
                )}

                {/* 4. CURRENT LOGGED IN USER CONTEXT BANNER */}
                {userContext && (
                    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="size-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-lg text-white shrink-0">
                                #{userContext.rank}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-blue-200">Posisi Peringkat Anda</span>
                                    {renderRankChange(userContext.rank_change)}
                                </div>
                                <h4 className="text-base font-extrabold text-white mt-0.5">
                                    {userContext.points.toLocaleString()} Total Poin Terverifikasi
                                </h4>
                                {userContext.points_to_next > 0 && (
                                    <p className="text-xs text-blue-200/90 mt-0.5 flex items-center gap-1.5">
                                        <TrendingUp className="size-3.5 shrink-0 text-blue-300" />
                                        <span>
                                            Butuh <strong>{userContext.points_to_next} poin lagi</strong> untuk menyalip peringkat #{userContext.next_target_rank}!
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                            <Link
                                href="/projects"
                                className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/10"
                            >
                                Kembangkan Proyek
                            </Link>
                            <Link
                                href="/competitions"
                                className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold transition shadow-2xs"
                            >
                                Ikuti Kompetisi
                            </Link>
                        </div>
                    </div>
                )}

                {/* 5. RANKED TABLE LIST */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
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

                                return (
                                    <div
                                        key={idx}
                                        className={`flex items-center justify-between gap-4 p-4 sm:px-6 transition ${
                                            isMe ? 'bg-blue-50/60 font-semibold' : 'hover:bg-slate-50/80'
                                        }`}
                                    >
                                        {/* Left: Rank & Movement & Profile */}
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                                            {/* Rank Number */}
                                            <div className="w-8 sm:w-10 text-center shrink-0">
                                                <span className={`text-sm sm:text-base font-black font-mono ${
                                                    item.rank === 1 ? 'text-amber-500' : item.rank === 2 ? 'text-slate-600' : item.rank === 3 ? 'text-amber-700' : 'text-slate-700'
                                                }`}>
                                                    #{item.rank}
                                                </span>
                                            </div>

                                            {/* Rank Delta */}
                                            <div className="w-10 shrink-0 flex items-center justify-center">
                                                {renderRankChange(item.rank_change)}
                                            </div>

                                            {/* Avatar / Thumbnail */}
                                            <div className="size-10 sm:size-11 rounded-xl bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center text-xs font-bold text-slate-700 overflow-hidden">
                                                {item.user?.avatar ? (
                                                    <img src={item.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{(item.user?.name || item.team?.name || item.project?.title || 'R').slice(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>

                                            {/* Name & Details */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                                                        {item.user?.name || item.team?.name || item.project?.title}
                                                    </h4>
                                                    {isMe && (
                                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-blue-600 text-white">
                                                            Anda
                                                        </span>
                                                    )}
                                                    {item.badge && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                                            {item.badge.name}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
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
                                                <span className="hidden md:inline-block text-[11px] font-semibold text-slate-500 px-2 py-1 rounded-lg bg-slate-50">
                                                    {item.total_activities} aktivitas
                                                </span>
                                            )}

                                            {/* Total Points */}
                                            <div className="min-w-[90px]">
                                                <div className="text-sm sm:text-base font-black text-slate-900 font-mono">
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
