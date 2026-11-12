import AnimatedIcon from '@/components/animations/AnimatedIcon';
import SeoHead from '@/components/seo/SeoHead';
import ApplyCompetitionTeamModal, {
    type ApplyTeamData,
} from '@/components/competitions/ApplyCompetitionTeamModal';
import RecordResultModal from '@/components/competitions/RecordResultModal';
import TrackCompetitionModal from '@/components/competitions/TrackCompetitionModal';
import UpdateStageModal from '@/components/competitions/UpdateStageModal';
import AppLayout from '@/layouts/app-layout';
import { getCompetitionCover } from '@/lib/competition-cover';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    ArrowUpRight,
    Award,
    Bookmark,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    Cpu,
    ExternalLink,
    FileText,
    FolderKanban,
    Globe,
    GraduationCap,
    Layers,
    Leaf,
    MessageSquare,
    Mic,
    Palette,
    Plus,
    Search,
    ShieldCheck,
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
    format?: string;
    is_urgent?: boolean;
    is_open?: boolean;
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
    competition_slug?: string;
    competition?: any;
    organizer?: string;
    leader_name?: string;
    participation_id?: number;
}

interface MyParticipation {
    id: number;
    lifecycle_status: 'planning' | 'registered' | 'in_progress' | 'completed' | 'withdrawn';
    stage: string;
    stage_label: string;
    registration_status: string;
    progress_status: string;
    category_track?: string;
    external_registration_proof?: string;
    external_submission_proof?: string;
    registered_at?: string;
    is_formation_locked: boolean;
    can_manage: boolean;
    next_milestone: string;
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
        registration_deadline?: string;
        cover_image?: string;
        min_team_size: number;
        max_team_size: number;
        is_urgent: boolean;
        is_overdue: boolean;
    };
    team?: {
        id: number;
        name: string;
        is_leader: boolean;
        members_count: number;
        members: Array<{
            id: number;
            user_id: number;
            name: string;
            avatar?: string;
            role_name: string;
            is_me: boolean;
        }>;
    };
    result?: {
        id: number;
        outcome: string;
        outcome_label: string;
        achievement_title: string;
        rank?: number;
        notes?: string;
        certificate_path?: string;
        verification_status: string;
        verifier_name?: string;
        verified_at?: string;
    };
    status_histories: Array<{
        id: number;
        from_stage?: string;
        to_stage: string;
        notes?: string;
        created_at: string;
    }>;
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
    myParticipations?: MyParticipation[];
    lifecycleCounts?: {
        all: number;
        saved: number;
        planning: number;
        registered: number;
        in_progress: number;
        completed: number;
        withdrawn: number;
    };
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
        sort?: string;
        my_lifecycle_status?: string;
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
    competitions = { data: [], current_page: 1, last_page: 1, total: 0 },
    openRecruitingTeams = [],
    totalNeededSlots = 0,
    myApplications = [],
    myTeams = [],
    myParticipations = [],
    lifecycleCounts = { all: 0, saved: 0, planning: 0, registered: 0, in_progress: 0, completed: 0, withdrawn: 0 },
    bookmarkedIds = [],
    savedCompetitions = [],
    featuredCompetitions = [],
    upcomingDeadlines = [],
    recommendedCompetitions = [],
    categoryCounts = {},
    currentUserInfo = null,
    categories = [],
    filters = {},
}: Props) {
    const safeFilters = (Array.isArray(filters) || !filters) ? {} : filters;

    const [activeTab, setActiveTab] = useState<'explore' | 'teams' | 'categories' | 'my_competitions' | 'recommendations'>(
        (safeFilters.tab as any) || 'explore'
    );

    const [myLifecycleFilter, setMyLifecycleFilter] = useState<'all' | 'saved' | 'planning' | 'registered' | 'in_progress' | 'completed' | 'withdrawn' | 'applications'>(
        (safeFilters.my_lifecycle_status as any) || 'all'
    );

    // Lifecycle Modals State
    const [trackModalOpen, setTrackModalOpen] = useState(false);
    const [selectedTrackComp, setSelectedTrackComp] = useState<any | null>(null);
    const [stageModalOpen, setStageModalOpen] = useState(false);
    const [selectedStagePart, setSelectedStagePart] = useState<any | null>(null);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [selectedResultPart, setSelectedResultPart] = useState<any | null>(null);

    // Filter States for Explore
    const [exploreSearch, setExploreSearch] = useState(safeFilters.search || '');
    const [exploreCategory, setExploreCategory] = useState(safeFilters.category || '');
    const [exploreLevel, setExploreLevel] = useState(safeFilters.level || '');
    const [exploreFormat, setExploreFormat] = useState(safeFilters.format || '');
    const [exploreType, setExploreType] = useState(safeFilters.type || '');
    const [exploreStatus, setExploreStatus] = useState(safeFilters.status || '');
    const [exploreSort, setExploreSort] = useState(safeFilters.sort || 'deadline_asc');

    // Filter States for Teams
    const [teamSearch, setTeamSearch] = useState(safeFilters.team_search || '');
    const [teamCategory, setTeamCategory] = useState(safeFilters.team_category || '');
    const [teamRole, setTeamRole] = useState(safeFilters.team_role || '');

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
                status: exploreStatus,
                sort: exploreSort,
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
        setExploreStatus('');
        setExploreSort('deadline_asc');
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

    const catalogCompetitions = competitions?.data || [];

    const spotlightComp = featuredCompetitions && featuredCompetitions.length > 0
        ? featuredCompetitions[0]
        : catalogCompetitions.length > 0
        ? catalogCompetitions[0]
        : null;

    return (
        <AppLayout activeTab="lomba" title="Competition Hub — RakitCampus">
            <SeoHead
                title="Eksplor Lomba & Hackathon Mahasiswa Nasional & Internasional"
                description="Katalog kompetisi mahasiswa terkurasi: Hackathon, Business Plan, UI/UX, Olimpiade & Riset. Cari tim, daftar lomba, dan catat prestasi kampus."
                keywords="lomba mahasiswa, kompetisi mahasiswa, hackathon indonesia 2026, cari tim lomba, business plan competition, ui ux design, rakit campus"
                canonicalUrl="https://rakitcampus.my.id/competitions"
            />
            <div className="space-y-6 sm:space-y-8">
                {/* 1. MINIMAL HEADER SECTION */}
                <header className="space-y-3 sm:space-y-4 pb-5 border-b border-slate-200/80">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                                Competition Hub
                            </h1>
                        </div>

                        <button
                            type="button"
                            onClick={() => setActiveTab('teams')}
                            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition shrink-0 cursor-pointer"
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Cari & Bikin Tim</span>
                        </button>
                    </div>

                    {/* Navigation Pills Bar (Mobile full-width swipeable, Desktop segmented) */}
                    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                        <nav className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 min-w-full sm:min-w-0">
                            <button
                                type="button"
                                onClick={() => setActiveTab('explore')}
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer text-center ${
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
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
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
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer text-center ${
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
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer ${
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
                                className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer text-center ${
                                    activeTab === 'recommendations'
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Rekomendasi
                            </button>
                        </nav>
                    </div>
                </header>

                {/* ========================================================= */}
                {/* TAB 1: EKSPLOR LOMBA                                     */}
                {/* ========================================================= */}
                {activeTab === 'explore' && (
                    <div className="space-y-6 sm:space-y-8">
                        {/* BENTO SHOWCASE GRID: 4 Cohesive Tiles */}
                        {spotlightComp && (
                            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4.5 items-stretch">
                                {/* Tile 1: Spotlight Hero (lg:col-span-7 xl:col-span-8) */}
                                <div className="md:col-span-2 lg:col-span-7 xl:col-span-8 bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs flex flex-col md:flex-row justify-between group">
                                    <div className="relative aspect-[4/5] sm:aspect-auto sm:h-64 md:h-auto md:w-5/12 md:aspect-[4/5] overflow-hidden bg-slate-950 shrink-0">
                                        <img
                                            src={getCompetitionCover(spotlightComp)}
                                            alt={spotlightComp.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/20" />

                                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                                            <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                                                <AnimatedIcon name="trophy" size={14} />
                                                <span>Sorotan</span>
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-white/90 text-[10px] font-semibold uppercase">
                                                {spotlightComp.level || 'Nasional'}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleBookmark(e, spotlightComp.id)}
                                            className={`absolute top-3 right-3 p-1.5 rounded-full backdrop-blur-md transition cursor-pointer ${
                                                bookmarkedIds.includes(spotlightComp.id)
                                                    ? 'bg-rose-500 text-white'
                                                    : 'bg-black/30 hover:bg-black/50 text-white'
                                            }`}
                                            title={bookmarkedIds.includes(spotlightComp.id) ? 'Hapus Simpanan' : 'Simpan'}
                                        >
                                            <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.includes(spotlightComp.id) ? 'fill-current' : ''}`} />
                                        </button>

                                        <div className="absolute bottom-2.5 left-3 text-white">
                                            <span className="text-[10px] text-white/80 block">Deadline</span>
                                            <span className="text-xs font-bold text-white">
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

                                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
                                        <div>
                                            <span className="text-[11px] font-semibold text-slate-400 block">
                                                {spotlightComp.organizer}
                                            </span>
                                            <Link href={`/competitions/${spotlightComp.slug || spotlightComp.id}`} className="group/link block">
                                                <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover/link:text-blue-600 transition tracking-tight leading-snug line-clamp-2 mt-0.5">
                                                    {spotlightComp.name}
                                                </h2>
                                            </Link>
                                            {spotlightComp.description && (
                                                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                                    {spotlightComp.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                                                    {spotlightComp.competition_type || 'Tim'}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold uppercase">
                                                    {spotlightComp.category?.replace('_', ' ') || 'Teknologi'}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/competitions/${spotlightComp.slug || spotlightComp.id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                                            >
                                                <span>Detail</span>
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Tile 2: Deadlines Countdown (lg:col-span-5 xl:col-span-4) */}
                                <div className="md:col-span-2 lg:col-span-5 xl:col-span-4 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <AnimatedIcon name="clock" size={16} />
                                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                                    Deadline Terdekat
                                                </h3>
                                            </div>
                                            <span className="text-[10px] font-semibold text-slate-400">Segera Ditutup</span>
                                        </div>

                                        <div className="divide-y divide-slate-100">
                                            {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                                                upcomingDeadlines.slice(0, 3).map((comp) => {
                                                    const deadline = comp.registration_deadline ? new Date(comp.registration_deadline) : null;
                                                    const now = new Date();
                                                    const daysLeft = deadline
                                                        ? Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                                                        : null;

                                                    return (
                                                        <Link
                                                            key={comp.id}
                                                            href={`/competitions/${comp.slug || comp.id}`}
                                                            className="py-2 flex items-center justify-between gap-2.5 group block"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                                                                    {comp.name}
                                                                </h4>
                                                                <p className="text-[10px] text-slate-400 truncate">
                                                                    {comp.organizer}
                                                                </p>
                                                            </div>
                                                            <span
                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                                                    daysLeft !== null && daysLeft <= 3
                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                        : 'bg-slate-100 text-slate-700'
                                                                }`}
                                                            >
                                                                {daysLeft !== null ? `${daysLeft} hari` : 'Segera'}
                                                            </span>
                                                        </Link>
                                                    );
                                                })
                                            ) : (
                                                <div className="py-6 text-center text-xs text-slate-400">
                                                    Belum ada jadwal deadline terdekat
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 text-right">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const el = document.getElementById('catalog-section');
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                                        >
                                            Lihat Semua &darr;
                                        </button>
                                    </div>
                                </div>

                                {/* Tile 3: Cari Rekan Tim (lg:col-span-6) */}
                                <div
                                    onClick={() => setActiveTab('teams')}
                                    className="col-span-1 md:col-span-1 lg:col-span-6 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl p-4 sm:p-5 border border-blue-200/70 shadow-2xs hover:border-blue-400 transition cursor-pointer flex flex-col justify-between group"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-xs">
                                                <Users className="w-3.5 h-3.5" />
                                            </span>
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-900">
                                                    Cari Rekan Tim
                                                </h3>
                                                <span className="text-[10px] text-slate-500">
                                                    {openRecruitingTeams.length} tim aktif membuka lowongan peran
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                                            Eksplor Tim &rarr;
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap mt-2">
                                        {openRecruitingTeams.slice(0, 3).map((team: any) => (
                                            <span
                                                key={team.id}
                                                className="px-2.5 py-1 rounded-lg bg-white/90 border border-blue-200/80 text-[11px] font-semibold text-slate-800 shadow-2xs truncate max-w-[200px]"
                                            >
                                                {team.name}
                                            </span>
                                        ))}
                                        {openRecruitingTeams.length === 0 && (
                                            <span className="text-xs text-slate-500 italic">Belum ada tim yang membuka lowongan</span>
                                        )}
                                    </div>
                                </div>

                                {/* Tile 4: Kategori Unggulan (lg:col-span-6) */}
                                <div className="col-span-1 md:col-span-1 lg:col-span-6 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1.5 rounded-lg bg-slate-900 text-white shadow-xs">
                                                <Layers className="w-3.5 h-3.5" />
                                            </span>
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-900">
                                                    Kategori Unggulan
                                                </h3>
                                                <span className="text-[10px] text-slate-500">
                                                    Filter cepat minat kompetisi
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('categories')}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                                        >
                                            Semua ({categories.length})
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                        {categories.slice(0, 5).map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => {
                                                    setExploreCategory(cat);
                                                    router.get('/competitions', { tab: 'explore', category: cat }, { preserveState: true });
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                                                    exploreCategory === cat
                                                        ? 'bg-blue-600 text-white shadow-xs'
                                                        : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                                                }`}
                                            >
                                                {cat.replace('_', ' ').toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* SEARCH & FILTERS BAR */}
                        <div id="catalog-section" className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
                            <form onSubmit={handleExploreFilterSubmit} className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl w-full border border-slate-200/60 focus-within:border-blue-500 focus-within:bg-white transition">
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

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center gap-2 w-full lg:w-auto">
                                <select
                                    value={exploreCategory}
                                    onChange={(e) => {
                                        setExploreCategory(e.target.value);
                                        router.get('/competitions', { tab: 'explore', search: exploreSearch, category: e.target.value, level: exploreLevel, format: exploreFormat }, { preserveState: true });
                                    }}
                                    className="w-full lg:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer truncate"
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
                                    className="w-full lg:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer truncate"
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
                                        router.get('/competitions', { tab: 'explore', search: exploreSearch, category: exploreCategory, level: exploreLevel, format: e.target.value, type: exploreType, status: exploreStatus, sort: exploreSort }, { preserveState: true });
                                    }}
                                    className="w-full lg:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer truncate"
                                >
                                    <option value="">Semua Format</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>

                                <select
                                    value={exploreType}
                                    onChange={(e) => {
                                        setExploreType(e.target.value);
                                        router.get('/competitions', { tab: 'explore', search: exploreSearch, category: exploreCategory, level: exploreLevel, format: exploreFormat, type: e.target.value, status: exploreStatus, sort: exploreSort }, { preserveState: true });
                                    }}
                                    className="w-full lg:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer truncate"
                                >
                                    <option value="">Semua Tipe</option>
                                    <option value="team">Tim</option>
                                    <option value="individual">Individu</option>
                                </select>

                                <select
                                    value={exploreStatus}
                                    onChange={(e) => {
                                        setExploreStatus(e.target.value);
                                        router.get('/competitions', { tab: 'explore', search: exploreSearch, category: exploreCategory, level: exploreLevel, format: exploreFormat, type: exploreType, status: e.target.value, sort: exploreSort }, { preserveState: true });
                                    }}
                                    className="w-full lg:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer truncate"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="open">Buka</option>
                                    <option value="closing_soon">Segera Tutup</option>
                                    <option value="closed">Ditutup</option>
                                </select>

                                <select
                                    value={exploreSort}
                                    onChange={(e) => {
                                        setExploreSort(e.target.value);
                                        router.get('/competitions', { tab: 'explore', search: exploreSearch, category: exploreCategory, level: exploreLevel, format: exploreFormat, type: exploreType, status: exploreStatus, sort: e.target.value }, { preserveState: true });
                                    }}
                                    className="w-full lg:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-blue-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer truncate"
                                >
                                    <option value="deadline_asc">Deadline Terdekat</option>
                                    <option value="deadline_desc">Deadline Terlama</option>
                                    <option value="latest">Terbaru</option>
                                </select>

                                {(exploreSearch || exploreCategory || exploreLevel || exploreFormat || exploreType || exploreStatus) && (
                                    <button
                                        type="button"
                                        onClick={handleResetExploreFilter}
                                        className="col-span-2 sm:col-span-1 lg:w-auto px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-center cursor-pointer transition"
                                    >
                                        Reset Filter
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
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
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
                                            onClick={() => router.get(`/competitions/${comp.slug || comp.id}`)}
                                            className={`bg-white rounded-2xl sm:rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col justify-between h-full group ${
                                                isExpired
                                                    ? 'border-slate-200/60 opacity-70 bg-slate-50/50'
                                                    : 'border-slate-200/90 shadow-2xs hover:shadow-xl hover:-translate-y-1 hover:border-blue-500/70'
                                            }`}
                                        >
                                            {/* Cover Image Poster — 4:5 Instagram Portrait Aspect Ratio */}
                                            <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-950 shrink-0">
                                                <img
                                                    src={getCompetitionCover(comp)}
                                                    alt={comp.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/25 pointer-events-none" />

                                                {/* Category & Level Badges on Image */}
                                                <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex items-center gap-1 sm:gap-1.5 flex-wrap max-w-[80%] z-10">
                                                    <span className="px-2 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg bg-blue-600/95 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                                                        {comp.category?.replace('_', ' ') || 'UMUM'}
                                                    </span>
                                                    {comp.level && (
                                                        <span className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-black/40 backdrop-blur-md text-white/95 text-[9px] sm:text-[10px] font-semibold uppercase border border-white/10">
                                                            {comp.level}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Bookmark Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleToggleBookmark(e, comp.id)}
                                                    className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 size-7 sm:size-8 rounded-full backdrop-blur-md flex items-center justify-center transition cursor-pointer shadow-xs z-10 ${
                                                        isSaved
                                                            ? 'bg-rose-500 text-white'
                                                            : 'bg-black/35 hover:bg-black/60 text-white border border-white/10'
                                                    }`}
                                                    title={isSaved ? 'Hapus Simpanan' : 'Simpan'}
                                                >
                                                    <Bookmark className={`size-3 sm:size-3.5 ${isSaved ? 'fill-current' : ''}`} />
                                                </button>

                                                {/* Bottom Banner Status Pill on Cover */}
                                                <div className="absolute bottom-2 left-2 right-2 sm:bottom-2.5 sm:left-2.5 sm:right-2.5 flex items-center justify-between gap-1.5 z-10">
                                                    {daysLeft !== null ? (
                                                        <span
                                                            className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md backdrop-blur-md shadow-xs ${
                                                                daysLeft <= 3
                                                                    ? 'bg-rose-600/95 text-white'
                                                                    : daysLeft <= 14
                                                                        ? 'bg-amber-500/95 text-white'
                                                                        : 'bg-slate-900/80 text-white border border-white/10'
                                                            }`}
                                                        >
                                                            {daysLeft > 0 ? `${daysLeft} hari lagi` : 'Tutup hari ini'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-600/90 text-white backdrop-blur-md">
                                                            Buka
                                                        </span>
                                                    )}

                                                    <span className="text-[9px] sm:text-[10px] font-medium text-white/90 bg-black/40 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-md border border-white/10 truncate">
                                                        {comp.format || 'Online'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between gap-2.5 sm:gap-3">
                                                <div>
                                                    <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">
                                                        <Award className="size-3 sm:size-3.5 text-blue-600 shrink-0" />
                                                        <span className="truncate">{comp.organizer}</span>
                                                    </div>

                                                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-2 mt-1">
                                                        {comp.name}
                                                    </h3>

                                                    {comp.description && (
                                                        <p className="line-clamp-2 text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed hidden sm:block">
                                                            {comp.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Structured Bottom Info & CTA */}
                                                <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs mt-auto">
                                                    <div className="flex items-center gap-1 sm:gap-1.5 text-slate-500 truncate">
                                                        <Clock className="size-3 sm:size-3.5 text-slate-400 shrink-0" />
                                                        <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 truncate">
                                                            {formattedDeadline}
                                                        </span>
                                                    </div>

                                                    <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                                                        <span>Detail</span>
                                                        <ArrowUpRight className="size-3 sm:size-3.5" />
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
                {/* TAB 2: CARI TIM                                           */}
                {/* ========================================================= */}
                {activeTab === 'teams' && (
                    <div className="space-y-6">
                        {/* Clean Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                    Tim Mencari Rekan
                                </h2>
                                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/70">
                                    {openRecruitingTeams.length} tim aktif
                                </span>
                            </div>
                            {totalNeededSlots > 0 && (
                                <span className="text-xs text-slate-500 font-medium">
                                    Tersedia <strong className="text-slate-800">{totalNeededSlots} posisi</strong> untuk mahasiswa
                                </span>
                            )}
                        </div>

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

                        {/* RECRUITING TEAMS GRID */}
                        {openRecruitingTeams.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                <AnimatedIcon name="team" size={56} className="mx-auto mb-3" />
                                <h4 className="text-sm font-bold text-slate-900">
                                    Belum Ada Tim yang Sedang Merekrut
                                </h4>
                                <Link
                                    href="/competitions/create"
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

                                    const teamInitials = (team?.name || 'Tim')
                                        .split(/\s+/)
                                        .map((p: string) => p[0])
                                        .slice(0, 2)
                                        .join('')
                                        .toUpperCase();

                                    return (
                                        <div
                                            key={part.id}
                                            onClick={() => setDetailTeam(part)}
                                            className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between gap-4 group"
                                        >
                                            <div className="space-y-3">
                                                {/* Category & Deadline */}
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                                                        {comp.category?.replace('_', ' ') || 'KOMPETISI'}
                                                    </span>
                                                    <span className="text-slate-400 text-[11px] flex items-center gap-1 font-medium">
                                                        <Clock className="size-3" />
                                                        <span>{formattedDeadline}</span>
                                                    </span>
                                                </div>

                                                {/* Team Title & Target Competition */}
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-1">
                                                        {team.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                                                        Target: <span className="text-slate-800 font-medium">{comp.name}</span>
                                                    </p>
                                                </div>

                                                {/* Roles Needed */}
                                                {roles.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                        {roles.map((r: any) => (
                                                            <span
                                                                key={r.id}
                                                                className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[11px] font-medium border border-slate-200/70"
                                                            >
                                                                {r.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Clean Formation Row: Blue Person Icons */}
                                                <div className="pt-1.5 border-t border-slate-100">
                                                    <div className="flex items-center justify-between text-xs mb-2">
                                                        <span className="text-[11px] text-slate-500 font-medium">Formasi Anggota</span>
                                                        <span className="text-xs font-semibold text-slate-700">
                                                            <span className="text-blue-600 font-bold">{membersCount}</span>/{maxCap} Terisi
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {Array.from({ length: maxCap }).map((_, idx) => {
                                                            const isFilled = idx < membersCount;
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className={`size-8 rounded-full flex items-center justify-center transition-colors ${
                                                                        isFilled
                                                                            ? 'bg-blue-600 text-white shadow-2xs'
                                                                            : 'border border-dashed border-slate-300 bg-slate-50/60 text-slate-300'
                                                                    }`}
                                                                    title={isFilled ? `Anggota #${idx + 1} Terisi` : `Slot #${idx + 1} Kosong`}
                                                                >
                                                                    <User className="size-3.5 stroke-[2]" />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Leader & Action */}
                                            <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-3 text-xs">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="size-6 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                        {leaderInitials}
                                                    </div>
                                                    <span className="font-medium text-slate-700 text-xs truncate">
                                                        {team?.leader?.name || 'Ketua Tim'}
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:text-blue-700 transition"
                                                >
                                                    <span>Ajukan Diri</span>
                                                    <ArrowUpRight className="size-3.5" />
                                                </button>
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
                {/* TAB 4: LOMBA SAYA (LIFECYCLE MANAGEMENT)                  */}
                {/* ========================================================= */}
                {activeTab === 'my_competitions' && (
                    <div className="space-y-6">
                        {/* Sub-navigation Filters for 6 Lifecycle Stages */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                                <button
                                    type="button"
                                    onClick={() => setMyLifecycleFilter('all')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                        myLifecycleFilter === 'all'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Semua ({lifecycleCounts.all ?? (myParticipations.length + savedCompetitions.length)})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMyLifecycleFilter('saved')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                        myLifecycleFilter === 'saved'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Tersimpan ({lifecycleCounts.saved ?? savedCompetitions.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMyLifecycleFilter('planning')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                        myLifecycleFilter === 'planning'
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Rencana ({lifecycleCounts.planning ?? myParticipations.filter(p => p.lifecycle_status === 'planning').length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMyLifecycleFilter('registered')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                        myLifecycleFilter === 'registered'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Terdaftar Resmi ({lifecycleCounts.registered ?? myParticipations.filter(p => p.lifecycle_status === 'registered').length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMyLifecycleFilter('in_progress')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                        myLifecycleFilter === 'in_progress'
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Sedang Berjalan ({lifecycleCounts.in_progress ?? myParticipations.filter(p => p.lifecycle_status === 'in_progress').length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMyLifecycleFilter('completed')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                        myLifecycleFilter === 'completed'
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Selesai & Prestasi ({lifecycleCounts.completed ?? myParticipations.filter(p => p.lifecycle_status === 'completed').length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMyLifecycleFilter('withdrawn')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                        myLifecycleFilter === 'withdrawn'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Dibatalkan ({lifecycleCounts.withdrawn ?? myParticipations.filter(p => p.lifecycle_status === 'withdrawn').length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMyLifecycleFilter('applications')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                                        myLifecycleFilter === 'applications'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Pengajuan Tim ({myApplications.length})
                                </button>
                            </div>

                            <Link
                                href="/competitions/create"
                                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shrink-0"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Bikin Tim</span>
                            </Link>
                        </div>

                        {/* CASE 1: APPLICATIONS (MinSatu User Requests) */}
                        {myLifecycleFilter === 'applications' && (
                            <div>
                                {myApplications.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                        <AnimatedIcon name="rocket" size={56} className="mx-auto mb-3" />
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Belum Ada Pengajuan Tim
                                        </h3>
                                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                            Anda belum mengajukan diri ke tim yang sedang merekrut anggota di tab Cari Tim.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('teams')}
                                            className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                                        >
                                            Cari Tim Rekan
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
                                                    <div className="flex flex-wrap items-center gap-2">
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
                                                        {app.competition_name} • Ketua Tim: {app.leader_name || 'Ketua Tim'}
                                                    </p>
                                                    {app.message && (
                                                        <p className="text-[11px] text-slate-400 mt-1 italic">
                                                            "{app.message}"
                                                        </p>
                                                    )}
                                                </div>

                                                {app.participation_id && app.status === 'accepted' && (
                                                    <Link
                                                        href={`/competition-workspace/${app.competition?.slug || app.participation_id}`}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
                                                    >
                                                        <span>Workspace Tim</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CASE 2: SAVED COMPETITIONS ONLY */}
                        {myLifecycleFilter === 'saved' && (
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
                                                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 px-2 py-0.5 bg-blue-50 rounded-md">
                                                                {comp.category?.replace('_', ' ') || 'KOMPETISI'}
                                                            </span>
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                                                                SAVED
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleToggleBookmark(e, comp.id)}
                                                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 cursor-pointer"
                                                            title="Hapus dari Simpanan"
                                                        >
                                                            <Bookmark className="w-3.5 h-3.5 fill-current" />
                                                        </button>
                                                    </div>
                                                    <Link href={`/competitions/${comp.slug || comp.id}`}>
                                                        <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                            {comp.name}
                                                        </h4>
                                                    </Link>
                                                    <p className="text-xs text-slate-400 mt-0.5">{comp.organizer}</p>

                                                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                                        <div>
                                                            <span className="text-[10px] text-slate-400 block">Batas Pendaftaran</span>
                                                            <span className={`font-bold text-[11px] ${comp.is_urgent ? 'text-rose-600' : 'text-slate-800'}`}>
                                                                {comp.registration_deadline
                                                                    ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                                                          day: 'numeric',
                                                                          month: 'short',
                                                                          year: 'numeric',
                                                                      })
                                                                    : 'Terbuka'}
                                                            </span>
                                                        </div>
                                                        {comp.is_urgent && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                                                                Segera Tutup
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedTrackComp(comp);
                                                            setTrackModalOpen(true);
                                                        }}
                                                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex-1 text-center"
                                                    >
                                                        Ikuti Sekarang
                                                    </button>
                                                    <Link
                                                        href={`/competitions/${comp.slug || comp.id}`}
                                                        className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
                                                    >
                                                        Detail ↗
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CASE 3: PARTICIPATIONS LIFECYCLE GRID (ALL, PLANNING, REGISTERED, IN PROGRESS, COMPLETED, WITHDRAWN) */}
                        {myLifecycleFilter !== 'applications' && myLifecycleFilter !== 'saved' && (
                            <div>
                                {(() => {
                                    const filteredParticipations = myParticipations.filter((p) => {
                                        if (myLifecycleFilter === 'all') return true;
                                        return p.lifecycle_status === myLifecycleFilter;
                                    });

                                    if (filteredParticipations.length === 0 && (myLifecycleFilter !== 'all' || savedCompetitions.length === 0)) {
                                        return (
                                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                                <AnimatedIcon name="target" size={56} className="mx-auto mb-3" />
                                                <h3 className="text-sm font-bold text-slate-900">
                                                    Belum Ada Lomba di Tahap Ini
                                                </h3>
                                                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                                    Temukan peluang kompetisi dan mulai rancang tim Anda di halaman eksplorasi.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('explore')}
                                                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                                                >
                                                    Eksplor Lomba
                                                </button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {filteredParticipations.map((part) => {
                                                const comp = part.competition;
                                                const team = part.team;
                                                const result = part.result;
                                                const status = part.lifecycle_status;

                                                const statusBadge =
                                                    status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                        : status === 'registered'
                                                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                                                        : status === 'in_progress'
                                                        ? 'bg-purple-50 text-purple-800 border-purple-300'
                                                        : status === 'withdrawn'
                                                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                        : 'bg-amber-50 text-amber-800 border-amber-300';

                                                return (
                                                    <div
                                                        key={part.id}
                                                        className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                                                    >
                                                        <div>
                                                            {/* Top Status Row */}
                                                            <div className="flex items-center justify-between gap-2 mb-2.5">
                                                                <div className="flex flex-wrap items-center gap-1.5">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">
                                                                        {comp?.category?.replace('_', ' ') || 'KOMPETISI'}
                                                                    </span>
                                                                    {comp?.level && (
                                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase">
                                                                            {comp.level}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                                                                    {status === 'planning'
                                                                        ? 'Rencana'
                                                                        : status === 'registered'
                                                                        ? 'Terdaftar Resmi'
                                                                        : status === 'in_progress'
                                                                        ? 'Sedang Berjalan'
                                                                        : status === 'completed'
                                                                        ? 'Selesai'
                                                                        : 'Dibatalkan'}
                                                                </span>
                                                            </div>

                                                            {/* Title */}
                                                            <Link href={`/competitions/${comp?.slug || comp?.id}`}>
                                                                <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                                    {comp?.name || 'Kompetisi'}
                                                                </h4>
                                                            </Link>
                                                            <p className="text-xs text-slate-400 mt-0.5">
                                                                {comp?.organizer} • Tim: <strong className="text-slate-700">{team?.name || 'Mandiri'}</strong>
                                                            </p>

                                                            {/* Next Milestone & Deadline */}
                                                            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                                                                <div className="flex items-center justify-between text-[11px]">
                                                                    <span className="text-slate-500 font-medium">Agenda / Milestone:</span>
                                                                    <span className="font-bold text-slate-800 text-right truncate max-w-[160px]">
                                                                        {part.next_milestone}
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                                                                    <span className="text-slate-500 font-medium">Tahap Seleksi:</span>
                                                                    <span className="font-bold text-blue-700">
                                                                        {part.stage_label}
                                                                    </span>
                                                                </div>

                                                                {part.external_registration_proof && (
                                                                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60 text-slate-500">
                                                                        <span>Bukti / ID Reg:</span>
                                                                        <span className="font-mono font-semibold text-slate-700 truncate max-w-[150px]">
                                                                            {part.external_registration_proof}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Team Members Summary */}
                                                            {team && (
                                                                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <Users className="size-3.5 text-slate-400" />
                                                                        <span className="font-medium text-[11px]">
                                                                            {team.members_count} Anggota Tim
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700">
                                                                        {team.is_leader ? 'Ketua Tim' : 'Anggota'}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Completed Result details */}
                                                            {result && (
                                                                <div className="mt-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
                                                                    <div className="flex items-center justify-between text-xs">
                                                                        <span className="font-bold text-emerald-950 flex items-center gap-1">
                                                                            <Trophy className="size-3.5 text-emerald-600" />
                                                                            <span>{result.outcome_label}</span>
                                                                        </span>
                                                                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                                                                            {result.verification_status === 'verified' ? 'Terverifikasi' : 'Mandiri'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] font-semibold text-emerald-900 truncate">
                                                                        {result.achievement_title}
                                                                    </p>
                                                                    {result.certificate_path && (
                                                                        <a
                                                                            href={result.certificate_path.startsWith('http') ? result.certificate_path : `/storage/${result.certificate_path}`}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 pt-1 font-semibold"
                                                                        >
                                                                            <span>Lihat Sertifikat</span>
                                                                            <ExternalLink className="size-3" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions Toolbar */}
                                                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                                                            {part.can_manage && status !== 'completed' && status !== 'withdrawn' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedStagePart(part);
                                                                        setStageModalOpen(true);
                                                                    }}
                                                                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition cursor-pointer"
                                                                >
                                                                    Update Tahap
                                                                </button>
                                                            )}

                                                            {(status === 'in_progress' || status === 'completed') && part.can_manage && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedResultPart(part);
                                                                        setResultModalOpen(true);
                                                                    }}
                                                                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                                                                >
                                                                    {result ? 'Edit Prestasi' : 'Catat Prestasi'}
                                                                </button>
                                                            )}

                                                            <Link
                                                                href={`/competition-workspace/${comp?.slug || part.id}`}
                                                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition flex-1 text-center"
                                                            >
                                                                Workspace
                                                            </Link>

                                                            <Link
                                                                href={`/competitions/${comp?.slug || comp?.id}`}
                                                                className="px-2.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs transition"
                                                                title="Detail Lomba"
                                                            >
                                                                ↗
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
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
                                        onClick={() => router.get(`/competitions/${comp.slug || comp.id}`)}
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
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-xl border border-slate-200/90 relative my-6 space-y-5">
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
                        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
                                            href={`/competitions/${detailTeam.competition.slug || detailTeam.competition.id}`}
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
                                                href={`/competitions/${detailTeam.competition.slug || detailTeam.competition.id}`}
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

            {/* TRACK COMPETITION LIFECYCLE MODAL */}
            {trackModalOpen && selectedTrackComp && (
                <TrackCompetitionModal
                    isOpen={trackModalOpen}
                    onClose={() => setTrackModalOpen(false)}
                    competition={selectedTrackComp}
                />
            )}

            {/* UPDATE STAGE MODAL */}
            {stageModalOpen && selectedStagePart && (
                <UpdateStageModal
                    isOpen={stageModalOpen}
                    onClose={() => setStageModalOpen(false)}
                    participation={selectedStagePart}
                />
            )}

            {/* RECORD RESULT MODAL */}
            {resultModalOpen && selectedResultPart && (
                <RecordResultModal
                    isOpen={resultModalOpen}
                    onClose={() => setResultModalOpen(false)}
                    participation={selectedResultPart}
                />
            )}
        </AppLayout>
    );
}
