import AnimatedIcon from '@/components/animations/AnimatedIcon';
import ApplyCompetitionTeamModal, {
    type ApplyTeamData,
} from '@/components/competitions/ApplyCompetitionTeamModal';
import AppLayout from '@/layouts/app-layout';
import { getCompetitionCover } from '@/lib/competition-cover';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Bookmark,
    Briefcase,
    Calendar,
    Clock,
    Cpu,
    ExternalLink,
    FileText,
    FolderKanban,
    Globe,
    GraduationCap,
    Leaf,
    MessageSquare,
    Mic,
    Palette,
    Plus,
    Search,
    Sparkles,
    Terminal,
    TrendingUp,
    Trophy,
    User,
    Users,
    X,
    Zap,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface Competition {
    id: number;
    name: string;
    slug: string;
    organizer: string;
    description: string;
    category: string;
    level?: string;
    competition_type?: string;
    official_url?: string;
    registration_url?: string;
    registration_deadline: string | null;
    registration_opens_at?: string | null;
    min_team_size: number;
    max_team_size: number;
    status: string;
    verification_status: string;
    prize_info?: string;
    cover_image?: string;
    campus?: { id: number; name: string };
}

interface RecruitingTeam {
    id: number;
    stage: string;
    category_track?: string;
    competition: {
        id: number;
        name: string;
        slug: string;
        organizer: string;
        category: string;
        level?: string;
        competition_type?: string;
        official_url?: string;
        registration_url?: string;
        description?: string;
        registration_deadline: string | null;
        min_team_size: number;
        max_team_size: number;
        cover_image?: string;
    };
    team: {
        id: number;
        name: string;
        description: string;
        capacity: number;
        leader?: {
            id: number;
            name: string;
            avatar?: string;
            study_program?: string;
            phone?: string;
        };
        members_count: number;
        members: Array<{
            id: number;
            user_id: number;
            name: string;
            avatar?: string;
            role_name: string;
        }>;
        recruitment?: {
            id: number;
            title: string;
            description?: string;
            status: string;
            roles: Array<{
                id: number;
                name: string;
                slots: number;
                requirements?: string;
            }>;
        };
    };
    is_member: boolean;
    is_leader: boolean;
    my_application?: {
        id: number;
        status: string;
        message?: string;
    } | null;
}

interface MyApplication {
    id: number;
    status: string;
    role_name: string;
    message?: string;
    contact_phone?: string;
    created_at?: string;
    team_name: string;
    competition_name: string;
    organizer?: string;
    leader_name?: string;
    participation_id?: number;
}

interface MyTeam {
    id: number;
    stage: string;
    team_name?: string;
    competition_name?: string;
    is_leader: boolean;
    members_count: number;
    max_size?: number;
}

interface Props {
    competitions: {
        data: Competition[];
        current_page: number;
        last_page: number;
        total: number;
    };
    openRecruitingTeams?: RecruitingTeam[];
    totalNeededSlots?: number;
    myApplications?: MyApplication[];
    myTeams?: MyTeam[];
    bookmarkedIds?: number[];
    savedCompetitions?: Competition[];
    featuredCompetitions?: Competition[];
    upcomingDeadlines?: Competition[];
    recommendedCompetitions?: Competition[];
    categoryCounts?: Record<string, number>;
    currentUserInfo?: {
        id?: number;
        name?: string;
        email?: string;
        phone?: string;
        portfolio_url?: string;
        study_program?: string;
    } | null;
    categories: string[];
    statuses: string[];
    levels: string[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
        level?: string;
        tab?: string;
        team_search?: string;
        team_category?: string;
        team_role?: string;
        type?: string;
        format?: string;
    };
    stats?: {
        total: number;
        open_registration: number;
        national_international: number;
        open_teams_count: number;
        total_needed_slots?: number;
        my_participations: number;
        saved_count?: number;
    };
    activeParticipation?: any;
}

export default function CompetitionIndex({
    competitions,
    openRecruitingTeams = [],
    totalNeededSlots = 0,
    myApplications = [],
    myTeams = [],
    bookmarkedIds = [],
    savedCompetitions = [],
    featuredCompetitions = [],
    upcomingDeadlines = [],
    recommendedCompetitions = [],
    categoryCounts = {},
    currentUserInfo,
    categories,
    filters,
}: Props) {
    const [activeTab, setActiveTab] = useState<'explore' | 'teams' | 'categories' | 'my_competitions' | 'recommendations'>(
        (filters.tab as any) || 'explore'
    );

    const [mySubTab, setMySubTab] = useState<'saved' | 'applications' | 'teams'>('saved');

    // Filter States for Explore
    const [exploreSearch, setExploreSearch] = useState(filters.search || '');
    const [exploreCategory, setExploreCategory] = useState(filters.category || '');
    const [exploreLevel, setExploreLevel] = useState(filters.level || '');
    const [exploreFormat, setExploreFormat] = useState(filters.format || '');
    const [exploreType, setExploreType] = useState(filters.type || '');

    // Filter States for Teams
    const [teamSearch, setTeamSearch] = useState(filters.team_search || '');
    const [teamCategory, setTeamCategory] = useState(filters.team_category || '');
    const [teamRole, setTeamRole] = useState(filters.team_role || '');

    // MinSatu Detail Modal State
    const [detailTeam, setDetailTeam] = useState<RecruitingTeam | null>(null);

    // MinSatu Apply Modal State
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [selectedTeamData, setSelectedTeamData] = useState<ApplyTeamData | null>(null);

    // 10 Core Academic Categories (Concise text, ZERO emojis)
    const coreCategoryList = [
        { key: 'technology', name: 'Teknologi & Rekayasa', icon: Terminal, desc: 'Software, IoT, robotika' },
        { key: 'business_plan', name: 'Bisnis & Kewirausahaan', icon: TrendingUp, desc: 'Model bisnis, startup pitch' },
        { key: 'research', name: 'Riset & Karya Ilmiah', icon: GraduationCap, desc: 'Karya tulis ilmiah, PKM' },
        { key: 'innovation', name: 'Inovasi & Produk', icon: Sparkles, desc: 'Prototipe produk tepat guna' },
        { key: 'ui_ux', name: 'Desain & Kreatif', icon: Palette, desc: 'UI/UX, animasi, branding' },
        { key: 'programming', name: 'Sains Data & AI', icon: Cpu, desc: 'Data science, AI, algoritma' },
        { key: 'hackathon', name: 'Hackathon', icon: Zap, desc: 'Fast prototyping 24-48 jam' },
        { key: 'entrepreneurship', name: 'Dampak Sosial', icon: Globe, desc: 'SDGs & pemberdayaan sosial' },
        { key: 'scientific_writing', name: 'Debat & Komunikasi', icon: Mic, desc: 'Debat & public speaking' },
        { key: 'other', name: 'Lingkungan & Iklim', icon: Leaf, desc: 'Energi hijau & aksi iklim' },
    ];

    const commonRoleOptions = [
        'UI/UX Designer',
        'Frontend Developer',
        'Backend Developer',
        'Machine Learning',
        'Hustler / Lead',
        'Researcher',
    ];

    const handleToggleBookmark = (e: React.MouseEvent, compId: number) => {
        e.stopPropagation();
        router.post(`/competitions/${compId}/bookmark`, {}, { preserveScroll: true });
    };

    const handleExploreFilterSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/competitions',
            {
                tab: 'explore',
                search: exploreSearch,
                category: exploreCategory,
                level: exploreLevel,
                format: exploreFormat,
                type: exploreType,
            },
            { preserveState: true }
        );
    };

    const handleResetExploreFilter = () => {
        setExploreSearch('');
        setExploreCategory('');
        setExploreLevel('');
        setExploreFormat('');
        setExploreType('');
        router.get('/competitions', { tab: 'explore' });
    };

    const handleTeamFilterSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/competitions',
            {
                tab: 'teams',
                team_search: teamSearch,
                team_category: teamCategory,
                team_role: teamRole,
            },
            { preserveState: true }
        );
    };

    const handleResetTeamFilter = () => {
        setTeamSearch('');
        setTeamCategory('');
        setTeamRole('');
        router.get('/competitions', { tab: 'teams' });
    };

    const openApplyModal = (part: RecruitingTeam) => {
        setSelectedTeamData({
            participationId: part.id,
            teamName: part.team?.name || 'Tim Kompetisi',
            competitionName: part.competition.name,
            organizer: part.competition.organizer,
            leaderName: part.team?.leader?.name,
            roles: part.team?.recruitment?.roles || [],
        });
        setApplyModalOpen(true);
    };

    const spotlightComp = featuredCompetitions && featuredCompetitions.length > 0
        ? featuredCompetitions[0]
        : competitions.data && competitions.data.length > 0
        ? competitions.data[0]
        : null;

    const catalogCompetitions = competitions.data;

    return (
        <AppLayout activeTab="lomba" title="Competition Hub — RakitCampus">
            <div className="space-y-6 sm:space-y-8">
                {/* 1. MINIMAL HEADER SECTION */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Competition Hub
                    </h1>

                    {/* Navigation Pills Bar */}
                    <div className="flex flex-wrap items-center gap-3">
                        <nav className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 overflow-x-auto max-w-full">
                            <button
                                type="button"
                                onClick={() => setActiveTab('explore')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                    activeTab === 'explore'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Eksplor Lomba
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('teams')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                    activeTab === 'teams'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>Cari Tim</span>
                                {openRecruitingTeams.length > 0 && (
                                    <span className="px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold">
                                        {openRecruitingTeams.length}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('categories')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                    activeTab === 'categories'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Kategori
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('my_competitions')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                                    activeTab === 'my_competitions'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>Lomba Saya</span>
                                {(bookmarkedIds.length > 0 || myApplications.length > 0 || myTeams.length > 0) && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('recommendations')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                    activeTab === 'recommendations'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Rekomendasi
                            </button>
                        </nav>

                        <Link
                            href={route('competitions.create')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition shrink-0"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Bikin Tim</span>
                        </Link>
                    </div>
                </header>

                {/* ========================================================= */}
                {/* TAB 1: EKSPLOR LOMBA                                     */}
                {/* ========================================================= */}
                {activeTab === 'explore' && (
                    <div className="space-y-6 sm:space-y-8">
                        {/* ASYMMETRIC SECTION: Spotlight (7) + Deadlines (5) */}
                        {spotlightComp && (
                            <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                                {/* Spotlight Entry */}
                                <div className="lg:col-span-7 bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col justify-between group">
                                    <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-900">
                                        <img
                                            src={getCompetitionCover(spotlightComp)}
                                            alt={spotlightComp.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/20" />

                                        {/* Floating Badge on Image */}
                                        <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-lg bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                                <AnimatedIcon name="trophy" size={16} />
                                                <span>Sorotan Utama</span>
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-semibold uppercase">
                                                {spotlightComp.level || 'Nasional'}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleBookmark(e, spotlightComp.id)}
                                            className={`absolute top-3.5 right-3.5 p-2 rounded-full backdrop-blur-md transition cursor-pointer ${
                                                bookmarkedIds.includes(spotlightComp.id)
                                                    ? 'bg-rose-500 text-white'
                                                    : 'bg-black/30 hover:bg-black/50 text-white'
                                            }`}
                                            title={bookmarkedIds.includes(spotlightComp.id) ? 'Hapus Simpanan' : 'Simpan'}
                                        >
                                            <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.includes(spotlightComp.id) ? 'fill-current' : ''}`} />
                                        </button>

                                        {/* Deadline on Image bottom */}
                                        <div className="absolute bottom-3 left-3.5 text-white">
                                            <span className="text-[10px] text-white/80 font-medium block">Deadline Pendaftaran</span>
                                            <span className="text-sm font-bold text-white">
                                                {spotlightComp.registration_deadline
                                                    ? new Date(spotlightComp.registration_deadline).toLocaleDateString('id-ID', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : 'Terbuka'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <Link href={`/competitions/${spotlightComp.id}`} className="group block">
                                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition tracking-tight leading-snug">
                                                    {spotlightComp.name}
                                                </h2>
                                            </Link>

                                            <p className="text-xs font-semibold text-slate-400 mt-1">
                                                {spotlightComp.organizer}
                                            </p>

                                            {spotlightComp.description && (
                                                <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                                                    {spotlightComp.description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Spotlight Footer */}
                                        <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                                                    {spotlightComp.competition_type || 'Tim'}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold uppercase">
                                                    {spotlightComp.category?.replace('_', ' ') || 'TEKNOLOGI'}
                                                </span>
                                            </div>

                                            <Link
                                                href={`/competitions/${spotlightComp.id}`}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                                            >
                                                <span>Panduan & Syarat</span>
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Upcoming Deadlines */}
                                <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                                            <AnimatedIcon name="clock" size={20} />
                                            <h3 className="text-sm font-bold text-slate-900">
                                                Deadline Terdekat
                                            </h3>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                                                upcomingDeadlines.slice(0, 4).map((comp) => {
                                                    const deadline = comp.registration_deadline ? new Date(comp.registration_deadline) : null;
                                                    const now = new Date();
                                                    const daysLeft = deadline
                                                        ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                                                        : null;

                                                    return (
                                                        <Link
                                                            key={comp.id}
                                                            href={`/competitions/${comp.id}`}
                                                            className="py-2.5 flex items-center justify-between gap-3 group block"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                                                                    {comp.name}
                                                                </h4>
                                                                <p className="text-[11px] text-slate-400 truncate">
                                                                    {comp.organizer}
                                                                </p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <span
                                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                                        daysLeft !== null && daysLeft <= 3
                                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                            : 'bg-slate-100 text-slate-700'
                                                                    }`}
                                                                >
                                                                    {daysLeft !== null ? `${daysLeft} hari lagi` : 'Segera'}
                                                                </span>
                                                            </div>
                                                        </Link>
                                                    );
                                                })
                                            ) : (
                                                <div className="py-8 text-center text-xs text-slate-400">
                                                    Belum ada jadwal deadline terdekat
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2.5 border-t border-slate-100 text-right">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const el = document.getElementById('catalog-section');
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                        >
                                            Semua Deadline &darr;
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* SEARCH & FILTERS BAR */}
                        <div id="catalog-section" className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-2">
                            <form onSubmit={handleExploreFilterSubmit} className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl w-full">
                                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Cari kompetisi atau penyelenggara..."
                                    value={exploreSearch}
                                    onChange={(e) => setExploreSearch(e.target.value)}
                                    className="bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none w-full font-medium"
                                />
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shrink-0 cursor-pointer"
                                >
                                    Cari
                                </button>
                            </form>

                            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                <select
                                    value={exploreCategory}
                                    onChange={(e) => {
                                        setExploreCategory(e.target.value);
                                        router.get('/competitions', { tab: 'explore', search: exploreSearch, category: e.target.value, level: exploreLevel, format: exploreFormat }, { preserveState: true });
                                    }}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer"
                                >
                                    <option value="">Semua Kategori</option>
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c.replace('_', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={exploreLevel}
                                    onChange={(e) => {
                                        setExploreLevel(e.target.value);
                                        router.get('/competitions', { tab: 'explore', search: exploreSearch, category: exploreCategory, level: e.target.value, format: exploreFormat }, { preserveState: true });
                                    }}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer"
                                >
                                    <option value="">Semua Tingkat</option>
                                    <option value="university">Kampus</option>
                                    <option value="regional">Regional</option>
                                    <option value="national">Nasional</option>
                                    <option value="international">Internasional</option>
                                </select>

                                <select
                                    value={exploreFormat}
                                    onChange={(e) => {
                                        setExploreFormat(e.target.value);
                                        router.get('/competitions', { tab: 'explore', search: exploreSearch, category: exploreCategory, level: exploreLevel, format: e.target.value }, { preserveState: true });
                                    }}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer"
                                >
                                    <option value="">Semua Format</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>

                                {(exploreSearch || exploreCategory || exploreLevel || exploreFormat || exploreType) && (
                                    <button
                                        type="button"
                                        onClick={handleResetExploreFilter}
                                        className="px-2 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* RESULTS HEADER */}
                        <div className="flex items-center justify-between pt-1">
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                Daftar Kompetisi
                            </h2>
                            <span className="text-xs text-slate-400 font-medium">
                                {catalogCompetitions.length} kompetisi
                            </span>
                        </div>

                        {/* COMPETITION CATALOG */}
                        {catalogCompetitions.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                <AnimatedIcon name="search" size={56} className="mx-auto mb-3" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Tidak Ada Kompetisi
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleResetExploreFilter}
                                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
                                >
                                    Reset Filter
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                {catalogCompetitions.map((comp) => {
                                    const isSaved = bookmarkedIds.includes(comp.id);
                                    const isExpired = comp.registration_deadline && new Date(comp.registration_deadline) < new Date();
                                    const formattedDeadline = comp.registration_deadline
                                        ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : 'Terbuka';

                                    const deadline = comp.registration_deadline ? new Date(comp.registration_deadline) : null;
                                    const now = new Date();
                                    const daysLeft = deadline
                                        ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                                        : null;

                                    return (
                                        <div
                                            key={comp.id}
                                            onClick={() => router.get(`/competitions/${comp.id}`)}
                                            className={`bg-white rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between group ${
                                                isExpired
                                                    ? 'border-slate-200/60 opacity-70 bg-slate-50/50'
                                                    : 'border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-lg'
                                            }`}
                                        >
                                            {/* Cover Image Banner */}
                                            <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
                                                <img
                                                    src={getCompetitionCover(comp)}
                                                    alt={comp.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-black/25" />

                                                {/* Category & Level Badges on Image */}
                                                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                                    <span className="px-2.5 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                                                        {comp.category?.replace('_', ' ') || 'UMUM'}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-semibold uppercase">
                                                        {comp.level || 'Nasional'}
                                                    </span>
                                                </div>

                                                {/* Bookmark Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleToggleBookmark(e, comp.id)}
                                                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition cursor-pointer ${
                                                        isSaved
                                                            ? 'bg-rose-500 text-white shadow-xs'
                                                            : 'bg-black/30 hover:bg-black/50 text-white'
                                                    }`}
                                                    title={isSaved ? 'Hapus Simpanan' : 'Simpan'}
                                                >
                                                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
                                                </button>

                                                {/* Days left badge */}
                                                {daysLeft !== null && (
                                                    <div className="absolute bottom-3 left-3">
                                                        <span
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                                daysLeft <= 7
                                                                    ? 'bg-rose-500/90 text-white backdrop-blur-md'
                                                                    : 'bg-slate-900/85 text-white backdrop-blur-md'
                                                            }`}
                                                        >
                                                            {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Hari ini'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Body */}
                                            <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2">
                                                        {comp.name}
                                                    </h3>
                                                    <p className="text-xs font-semibold text-slate-400 mt-1">
                                                        {comp.organizer}
                                                    </p>
                                                </div>

                                                {/* Structured Bottom Info */}
                                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-3 text-slate-500">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 block font-medium">Deadline</span>
                                                            <span className={`font-bold ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                                                                {formattedDeadline} {isExpired ? '(Tutup)' : ''}
                                                            </span>
                                                        </div>
                                                        <div className="h-5 w-px bg-slate-200" />
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 block font-medium">Format</span>
                                                            <span className="font-semibold text-slate-700">
                                                                {comp.competition_type || 'Tim'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                                        Detail ↗
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: CARI TIM                                          */}
                {/* ========================================================= */}
                {activeTab === 'teams' && (
                    <div className="space-y-6 sm:space-y-8">
                        {/* HERO: Team Matchmaking */}
                        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-1 sm:py-2">
                            <div className="lg:col-span-6 space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-xs font-semibold text-blue-700 w-fit">
                                    <AnimatedIcon name="team" size={20} />
                                    <span>MinSatu Matchmaking</span>
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                                    Kurang satu partner? <span className="text-blue-600">Cari di sini.</span>
                                </h2>
                                <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                                    Temukan rekan sefrekuensi untuk tim kompetisi kampus.
                                </p>
                            </div>

                            {/* Royal Blue Slots Card */}
                            <div className="lg:col-span-6">
                                <div className="bg-[#1e40af] rounded-2xl p-5 sm:p-6 text-white shadow-md">
                                    <div className="grid grid-cols-4 gap-2 sm:gap-2.5 pb-4">
                                        <div className="bg-white/10 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 border border-white/10 text-center">
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                                <User className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-[10px] font-medium text-white/90">Ide & Lead</span>
                                        </div>

                                        <div className="bg-white/10 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 border border-white/10 text-center">
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                                <User className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-[10px] font-medium text-white/90">Riset</span>
                                        </div>

                                        <div className="bg-white/10 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 border border-white/10 text-center">
                                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                                <User className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-[10px] font-medium text-white/90">Eksekusi</span>
                                        </div>

                                        <div className="bg-white text-blue-700 rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-md text-center">
                                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center">
                                                <User className="w-3 h-3 text-blue-700 stroke-[2.5]" />
                                            </div>
                                            <span className="text-[10px] font-black text-blue-700">Kamu?</span>
                                        </div>
                                    </div>

                                    {/* Bottom Stats */}
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/15">
                                        <div>
                                            <span className="text-[10px] text-white/70 block">Membuka Rekrutmen</span>
                                            <span className="text-lg sm:text-xl font-bold text-white">
                                                {openRecruitingTeams.length} Tim
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-white/70 block">Posisi Terbuka</span>
                                            <span className="text-lg sm:text-xl font-bold text-white">
                                                {totalNeededSlots} Mahasiswa
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Search & Filters */}
                        <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-2">
                            <form onSubmit={handleTeamFilterSubmit} className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl w-full">
                                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Cari tim atau peran..."
                                    value={teamSearch}
                                    onChange={(e) => setTeamSearch(e.target.value)}
                                    className="bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none w-full font-medium"
                                />
                            </form>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <select
                                    value={teamCategory}
                                    onChange={(e) => {
                                        setTeamCategory(e.target.value);
                                        router.get('/competitions', { tab: 'teams', team_search: teamSearch, team_category: e.target.value, team_role: teamRole }, { preserveState: true });
                                    }}
                                    className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-medium text-slate-700 border-0 cursor-pointer"
                                >
                                    <option value="">Semua Kategori</option>
                                    {categories.map((c) => (
                                        <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>
                                    ))}
                                </select>

                                <select
                                    value={teamRole}
                                    onChange={(e) => {
                                        setTeamRole(e.target.value);
                                        router.get('/competitions', { tab: 'teams', team_search: teamSearch, team_category: teamCategory, team_role: e.target.value }, { preserveState: true });
                                    }}
                                    className="px-3 py-2 bg-slate-50 rounded-xl text-xs font-medium text-slate-700 border-0 cursor-pointer"
                                >
                                    <option value="">Semua Peran</option>
                                    {commonRoleOptions.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>

                                {(teamSearch || teamCategory || teamRole) && (
                                    <button
                                        type="button"
                                        onClick={handleResetTeamFilter}
                                        className="px-2 py-1 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer shrink-0"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Section Header */}
                        <div className="flex items-center justify-between pt-1">
                            <h3 className="text-sm font-bold text-slate-900">
                                Tim yang Merekrut
                            </h3>
                            <span className="text-xs text-slate-400 font-medium">
                                {openRecruitingTeams.length} tim aktif
                            </span>
                        </div>

                        {/* RECRUITING TEAMS GRID */}
                        {openRecruitingTeams.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                <AnimatedIcon name="team" size={56} className="mx-auto mb-3" />
                                <h4 className="text-sm font-bold text-slate-900">
                                    Belum Ada Tim yang Sedang Merekrut
                                </h4>
                                <Link
                                    href={route('competitions.create')}
                                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Bikin Tim</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                {openRecruitingTeams.map((part) => {
                                    const comp = part.competition;
                                    const team = part.team;
                                    const roles = team?.recruitment?.roles || [];
                                    const membersCount = team?.members_count || 1;
                                    const maxCap = comp.max_team_size || 3;
                                    const emptySlots = Math.max(0, maxCap - membersCount);
                                    const formattedDeadline = comp.registration_deadline
                                        ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : 'Terbuka';

                                    const leaderInitials = team?.leader?.name
                                        ? team.leader.name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase()
                                        : 'K';

                                    return (
                                        <div
                                            key={part.id}
                                            onClick={() => setDetailTeam(part)}
                                            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                                                        {comp.category?.replace('_', ' ') || 'HACKATHON'}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-slate-500">
                                                        Deadline: {formattedDeadline}
                                                    </span>
                                                </div>

                                                <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                    {comp.name}
                                                </h4>
                                                <p className="text-xs font-medium text-slate-400 mt-0.5">
                                                    Tim: {team.name}
                                                </p>

                                                {/* Roles Needed */}
                                                <div className="mt-3">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {roles.length > 0 ? (
                                                            roles.map((r) => (
                                                                <span
                                                                    key={r.id}
                                                                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                                                                >
                                                                    {r.name}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                                                                Terbuka semua role
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Slot Counter */}
                                                <div className="mt-3 flex items-center gap-1.5">
                                                    {Array.from({ length: membersCount }).map((_, idx) => (
                                                        <div
                                                            key={`filled-${idx}`}
                                                            className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0"
                                                        >
                                                            <User className="w-3 h-3 fill-current" />
                                                        </div>
                                                    ))}
                                                    {Array.from({ length: Math.min(4, emptySlots) }).map((_, idx) => (
                                                        <div
                                                            key={`empty-${idx}`}
                                                            className="w-5 h-5 rounded-full border-2 border-dashed border-blue-400 text-blue-500 flex items-center justify-center shrink-0"
                                                        >
                                                            <User className="w-2.5 h-2.5" />
                                                        </div>
                                                    ))}
                                                    <span className="text-[11px] text-slate-500 font-medium ml-1">
                                                        {membersCount}/{maxCap} terisi
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bottom Leader */}
                                            <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-3 text-xs">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                        {leaderInitials}
                                                    </div>
                                                    <span className="font-semibold text-slate-800 truncate">
                                                        {team?.leader?.name || 'Ketua Tim'}
                                                    </span>
                                                </div>

                                                <span className="font-bold text-blue-600">
                                                    Formasi Tim ↗
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: KATEGORI                                          */}
                {/* ========================================================= */}
                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <div className="pb-3 border-b border-slate-200/80">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                Kategori Kompetisi
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {coreCategoryList.map((cat) => {
                                const IconComponent = cat.icon;
                                const count = categoryCounts[cat.key] || 0;

                                return (
                                    <div
                                        key={cat.key}
                                        onClick={() => {
                                            setExploreCategory(cat.key);
                                            setActiveTab('explore');
                                            router.get('/competitions', { tab: 'explore', category: cat.key });
                                        }}
                                        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-700 flex items-center justify-center transition">
                                                    <IconComponent className="w-5 h-5 stroke-[1.75]" />
                                                </div>
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                                                    {count} lomba
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                {cat.name}
                                            </h3>

                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                {cat.desc}
                                            </p>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                                            <span>Lihat ↗</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 4: LOMBA SAYA                                        */}
                {/* ========================================================= */}
                {activeTab === 'my_competitions' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMySubTab('saved')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                        mySubTab === 'saved'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Tersimpan ({savedCompetitions.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMySubTab('applications')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                        mySubTab === 'applications'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Pengajuan ({myApplications.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMySubTab('teams')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                        mySubTab === 'teams'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Tim Aktif ({myTeams.length})
                                </button>
                            </div>

                            <Link
                                href={route('competitions.create')}
                                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Bikin Tim</span>
                            </Link>
                        </div>

                        {/* SUB-TAB 1: SAVED */}
                        {mySubTab === 'saved' && (
                            <div>
                                {savedCompetitions.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                        <AnimatedIcon name="target" size={56} className="mx-auto mb-3" />
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Belum Ada Kompetisi Tersimpan
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('explore')}
                                            className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                                        >
                                            Eksplor Lomba
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {savedCompetitions.map((comp) => (
                                            <div
                                                key={comp.id}
                                                onClick={() => router.get(`/competitions/${comp.id}`)}
                                                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                                                            {comp.category?.replace('_', ' ') || 'HACKATHON'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleToggleBookmark(e, comp.id)}
                                                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 cursor-pointer"
                                                            title="Hapus"
                                                        >
                                                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                                                        </button>
                                                    </div>
                                                    <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                        {comp.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-400 mt-0.5">{comp.organizer}</p>
                                                </div>

                                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block">Deadline</span>
                                                        <span className="font-bold text-slate-800">
                                                            {comp.registration_deadline
                                                                ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                                                      day: 'numeric',
                                                                      month: 'short',
                                                                      year: 'numeric',
                                                                  })
                                                                : 'Terbuka'}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-blue-600">Detail ↗</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUB-TAB 2: APPLICATIONS */}
                        {mySubTab === 'applications' && (
                            <div>
                                {myApplications.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                        <AnimatedIcon name="rocket" size={56} className="mx-auto mb-3" />
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Belum Ada Pengajuan Tim
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('teams')}
                                            className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                                        >
                                            Cari Tim
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {myApplications.map((app) => (
                                            <div
                                                key={app.id}
                                                className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-slate-900">{app.team_name}</h4>
                                                        <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                                            Posisi: {app.role_name}
                                                        </span>
                                                        {app.status === 'accepted' ? (
                                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                                                Diterima
                                                            </span>
                                                        ) : app.status === 'rejected' ? (
                                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                                                                Ditolak
                                                            </span>
                                                        ) : (
                                                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                                                Menunggu
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        {app.competition_name} • Ketua: {app.leader_name || 'Ketua Tim'}
                                                    </p>
                                                </div>

                                                {app.participation_id && app.status === 'accepted' && (
                                                    <Link
                                                        href={route('competitions.workspace', app.participation_id)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
                                                    >
                                                        <span>Workspace</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUB-TAB 3: TEAMS */}
                        {mySubTab === 'teams' && (
                            <div>
                                {myTeams.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                        <AnimatedIcon name="folder" size={56} className="mx-auto mb-3" />
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Belum Ada Tim Aktif
                                        </h3>
                                        <div className="mt-3 flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('teams')}
                                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                                            >
                                                Cari Tim
                                            </button>
                                            <Link
                                                href={route('competitions.create')}
                                                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                                            >
                                                Bikin Tim
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {myTeams.map((team) => (
                                            <div
                                                key={team.id}
                                                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <h4 className="text-base font-bold text-slate-900">
                                                            {team.team_name}
                                                        </h4>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                                            {team.is_leader ? 'Ketua Tim' : 'Anggota'}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {team.competition_name}
                                                    </p>
                                                </div>

                                                <Link
                                                    href={route('competitions.workspace', team.id)}
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                                                >
                                                    <span>Workspace Tim</span>
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 5: REKOMENDASI                                       */}
                {/* ========================================================= */}
                {activeTab === 'recommendations' && (
                    <div className="space-y-6">
                        <div className="pb-3 border-b border-slate-200/80">
                            <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                Rekomendasi
                            </h2>
                        </div>

                        {recommendedCompetitions && recommendedCompetitions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {recommendedCompetitions.map((comp, idx) => (
                                    <div
                                        key={comp.id}
                                        onClick={() => router.get(`/competitions/${comp.id}`)}
                                        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                                                    {comp.category?.replace('_', ' ') || 'HACKATHON'}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                                    {idx === 0 ? '98% Relevan' : `${95 - idx * 4}% Relevan`}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                {comp.name}
                                            </h3>
                                            <p className="text-xs font-semibold text-slate-400 mt-0.5">{comp.organizer}</p>
                                        </div>

                                        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                                            <span className="text-slate-500 font-medium">{comp.level || 'Nasional'}</span>
                                            <span className="font-bold text-blue-600">Detail ↗</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                <AnimatedIcon name="sparkles" size={56} className="mx-auto mb-3" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Belum Ada Rekomendasi
                                </h3>
                                <Link
                                    href="/settings/profile"
                                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                                >
                                    <span>Lengkapi Profil</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MINSATU DETAIL MODAL */}
            {detailTeam && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200/90 relative my-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                                {detailTeam.competition.name}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setDetailTeam(null)}
                                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Top 3-Column Metadata Box */}
                        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 grid grid-cols-3 gap-4">
                            <div>
                                <span className="text-xs text-slate-400 font-medium block">
                                    Penyelenggara
                                </span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
                                    {detailTeam.competition.organizer || 'Penyelenggara Resmi'}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-medium block">
                                    Deadline
                                </span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
                                    {detailTeam.competition.registration_deadline
                                        ? new Date(detailTeam.competition.registration_deadline).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : 'Terbuka'}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-medium block">
                                    Format
                                </span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
                                    {detailTeam.competition.competition_type || 'Umum'}
                                </span>
                            </div>
                        </div>

                        {/* Two Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            {/* Left Column (7 cols): Deskripsi tim & File link */}
                            <div className="md:col-span-7 space-y-5">
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-bold text-slate-900">
                                        Deskripsi Tim
                                    </h4>
                                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed font-medium">
                                        {detailTeam.team.description ||
                                            'Mencari rekan tim untuk berkolaborasi dan berkompetisi bersama.'}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-900">
                                        Tautan Resmi
                                    </h4>

                                    <div className="space-y-2">
                                        {detailTeam.competition.official_url && (
                                            <a
                                                href={detailTeam.competition.official_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-3 rounded-xl border border-slate-200/90 flex items-center justify-between hover:border-blue-500 transition text-xs group"
                                            >
                                                <span className="font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                                                    <span>Website & Pedoman</span>
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                </span>
                                                <span className="text-slate-400 text-[11px] truncate max-w-[180px]">
                                                    {detailTeam.competition.official_url.replace(/^https?:\/\//, '')}
                                                </span>
                                            </a>
                                        )}

                                        {detailTeam.competition.registration_url && (
                                            <a
                                                href={detailTeam.competition.registration_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-3 rounded-xl border border-slate-200/90 flex items-center justify-between hover:border-blue-500 transition text-xs group"
                                            >
                                                <span className="font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                                                    <span>Portal Registrasi</span>
                                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                                </span>
                                                <span className="text-slate-400 text-[11px] truncate max-w-[180px]">
                                                    {detailTeam.competition.registration_url.replace(/^https?:\/\//, '')}
                                                </span>
                                            </a>
                                        )}

                                        <Link
                                            href={`/competitions/${detailTeam.competition.id}`}
                                            className="p-3 rounded-xl border border-slate-200/90 flex items-center justify-between hover:border-blue-500 transition text-xs group bg-slate-50/50"
                                        >
                                            <span className="font-bold text-slate-700 group-hover:text-blue-600 flex items-center gap-1.5">
                                                <FileText className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Detail Lengkap</span>
                                            </span>
                                            <span className="text-blue-600 font-semibold text-[11px] flex items-center gap-0.5">
                                                Buka <ArrowUpRight className="w-3 h-3" />
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (5 cols): Formasi Card */}
                            <div className="md:col-span-5 bg-blue-50/60 rounded-2xl p-5 border border-blue-100 space-y-4">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <span>Formasi Tim</span>
                                </div>

                                <div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-blue-600">
                                            {Math.max(0, (detailTeam.competition.max_team_size || 3) - detailTeam.team.members_count)}
                                        </span>
                                        <span className="text-xs text-slate-600 font-bold">
                                            slot kosong
                                        </span>
                                    </div>

                                    <div className="mt-2.5 flex items-center gap-1.5">
                                        {Array.from({ length: detailTeam.team.members_count }).map((_, idx) => (
                                            <div
                                                key={`f-${idx}`}
                                                className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0"
                                            >
                                                <User className="w-3 h-3 fill-current" />
                                            </div>
                                        ))}
                                        {Array.from({
                                            length: Math.max(
                                                0,
                                                (detailTeam.competition.max_team_size || 3) - detailTeam.team.members_count
                                            ),
                                        }).map((_, idx) => (
                                            <div
                                                key={`e-${idx}`}
                                                className="w-6 h-6 rounded-full border-2 border-dashed border-blue-400 text-blue-500 flex items-center justify-center shrink-0"
                                            >
                                                <User className="w-2.5 h-2.5" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[11px] text-blue-700 font-semibold block mt-1.5">
                                        {detailTeam.team.members_count}/{detailTeam.competition.max_team_size || 3} terisi
                                    </span>
                                </div>

                                {/* Peran Dibutuhkan */}
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-slate-700 block">
                                        Posisi Dicari
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {detailTeam.team.recruitment?.roles && detailTeam.team.recruitment.roles.length > 0 ? (
                                            detailTeam.team.recruitment.roles.map((r) => (
                                                <span
                                                    key={r.id}
                                                    className="px-2 py-0.5 rounded-md bg-white text-slate-800 text-[11px] font-semibold shadow-2xs border border-slate-100"
                                                >
                                                    {r.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-md bg-white text-slate-600 text-[11px] font-medium shadow-2xs border border-slate-100">
                                                Terbuka semua role
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Ketua Tim */}
                                <div className="pt-2 border-t border-blue-200/60">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                            {detailTeam.team.leader?.name ? detailTeam.team.leader.name.charAt(0) : 'M'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-900 truncate">
                                                {detailTeam.team.leader?.name || 'Ketua Tim'}
                                            </div>
                                            <Link
                                                href={`/competitions/${detailTeam.competition.id}`}
                                                className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                                            >
                                                <span>Lihat halaman lomba</span>
                                                <ArrowUpRight className="w-2.5 h-2.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA: Ajukan Diri */}
                                <div className="pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const teamToApply = detailTeam;
                                            setDetailTeam(null);
                                            openApplyModal(teamToApply);
                                        }}
                                        className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                                    >
                                        Ajukan Diri ke Tim
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* APPLY COMPETITION TEAM MODAL */}
            {selectedTeamData && (
                <ApplyCompetitionTeamModal
                    isOpen={applyModalOpen}
                    onClose={() => setApplyModalOpen(false)}
                    teamData={selectedTeamData}
                    currentUserInfo={currentUserInfo}
                />
            )}
        </AppLayout>
    );
}
