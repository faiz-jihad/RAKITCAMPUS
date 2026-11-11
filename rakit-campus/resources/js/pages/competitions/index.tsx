import ApplyCompetitionTeamModal, {
    type ApplyTeamData,
} from '@/components/competitions/ApplyCompetitionTeamModal';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Bookmark,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    Compass,
    ExternalLink,
    FileText,
    Filter,
    FolderKanban,
    Globe,
    GraduationCap,
    Heart,
    Layers,
    MapPin,
    MessageSquare,
    Plus,
    Search,
    Share2,
    ShieldCheck,
    Sparkles,
    Trophy,
    User,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
    id: number; // participation id
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
    totalNeededSlots = 2,
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
    stats,
}: Props) {
    // Main navigation tabs: teams (Cari Tim), explore (Eksplor Lomba), overview (Overview), categories (Kategori), my_competitions (Lomba Saya), recommendations (Rekomendasi)
    const [activeTab, setActiveTab] = useState<'teams' | 'explore' | 'overview' | 'categories' | 'my_competitions' | 'recommendations'>(
        (filters.tab as any) || 'teams'
    );

    // Sub-tab for My Competitions
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

    // Quick Competition Detail Modal (for Explore tab)
    const [selectedCompDetail, setSelectedCompDetail] = useState<Competition | null>(null);

    // User initials
    const userInitials = useMemo(() => {
        if (!currentUserInfo?.name) return 'FA';
        const parts = currentUserInfo.name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }, [currentUserInfo]);

    // Handle Bookmark Toggle
    const handleToggleBookmark = (e: React.MouseEvent, compId: number) => {
        e.stopPropagation();
        router.post(
            `/competitions/${compId}/bookmark`,
            {},
            {
                preserveScroll: true,
            }
        );
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

    const commonRoleOptions = [
        'UI/UX',
        'Frontend',
        'Backend',
        'Machine Learning',
        'Hustler',
        'Paper',
    ];

    // 10 Core Academic & Professional Categories as requested
    const coreCategoryList = [
        { key: 'technology', name: 'Technology & Engineering', icon: '💻', desc: 'Software, IoT, robotika, dan rekayasa teknik.' },
        { key: 'business_plan', name: 'Business & Entrepreneurship', icon: '📈', desc: 'Model bisnis rintisan, startup pitching, dan finance.' },
        { key: 'research', name: 'Research & Scientific Writing', icon: '🔬', desc: 'Karya tulis ilmiah, PKM, dan penelitian terapan.' },
        { key: 'innovation', name: 'Innovation & Product Dev', icon: '💡', desc: 'Inovasi produk tepat guna dan prototipe solusi nyata.' },
        { key: 'ui_ux', name: 'Design & Creative Industry', icon: '🎨', desc: 'UI/UX design, poster ilmiah, video animasi, dan branding.' },
        { key: 'programming', name: 'Data Science & Artificial Intelligence', icon: '🧠', desc: 'Analisis big data, machine learning, dan competitive programming.' },
        { key: 'hackathon', name: 'Hackathon & Fast Prototyping', icon: '⚡', desc: 'Selesaikan tantangan intensif 24-48 jam membangun produk.' },
        { key: 'entrepreneurship', name: 'Social Impact & Community', icon: '🤝', desc: 'Pemberdayaan masyarakat, SDGs, dan solusi sosial kampus.' },
        { key: 'scientific_writing', name: 'Debate & Public Speaking', icon: '🎙️', desc: 'Debat parlementer, speech contest, dan kepemimpinan.' },
        { key: 'other', name: 'Environmental & Sustainability', icon: '🌱', desc: 'Inovasi energi hijau, lingkungan, dan climate action.' },
    ];

    return (
        <AppLayout activeTab="lomba" title="Competition Hub — RakitCampus">
            {/* 2. SUB-NAVIGATION & ACTION TOOLBAR (Dashboard Style) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2 mb-4">
                {/* View Switcher Pills */}
                <div className="inline-flex items-center gap-1 bg-[#f1f3f7] p-1 rounded-full border border-slate-200/70 overflow-x-auto max-w-full">
                        <button
                            type="button"
                            onClick={() => setActiveTab('teams')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                activeTab === 'teams'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Cari Tim
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('explore')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                activeTab === 'explore'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Eksplor Lomba
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('categories')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                activeTab === 'categories'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Kategori
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('my_competitions')}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                                activeTab === 'my_competitions'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <span>Lomba Saya</span>
                            {(bookmarkedIds.length > 0 || myApplications.length > 0 || myTeams.length > 0) && (
                                <span className="size-1.5 rounded-full bg-blue-600" />
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('recommendations')}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                                activeTab === 'recommendations'
                                    ? 'bg-white text-slate-900 shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Rekomendasi
                        </button>
                    </div>

                    {/* Right CTA Button */}
                    <Link
                        href={route('competitions.create')}
                        className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 active:scale-[0.98] transition self-start sm:self-auto shrink-0"
                    >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                        <span>Bikin Tim</span>
                    </Link>
                </div>

            {/* MAIN CONTENT */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 space-y-8">

                {/* ========================================================= */}
                {/* TAB 1: CARI TIM (MinSatu Exact Signature Flow) */}
                {/* ========================================================= */}
                {activeTab === 'teams' && (
                    <div className="space-y-8">
                        {/* HERO SECTION */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-2 sm:py-6">
                            {/* Left Column: Heading & CTA */}
                            <div className="lg:col-span-6 space-y-4">
                                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                                    Kurang satu?
                                    <br />
                                    <span className="italic font-serif text-blue-600 font-semibold">
                                        Cari di sini.
                                    </span>
                                </h1>
                                <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
                                    Cari teman sefrekuensi buat lomba selanjutnya.
                                </p>
                                <div className="pt-2">
                                    <a
                                        href="#teams-section"
                                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 hover:text-blue-600 transition group"
                                    >
                                        <span>Cari tim</span>
                                        <ArrowUpRight className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </a>
                                </div>
                            </div>

                            {/* Right Column: Signature Royal Blue Team Slots Card */}
                            <div className="lg:col-span-6">
                                <div className="bg-[#1E50DE] rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
                                    <div className="absolute top-5 right-5 text-white/30">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                            <path d="M4 4h10l6 6v10H4V4z" />
                                        </svg>
                                    </div>

                                    {/* 4 Member Slots Grid */}
                                    <div className="grid grid-cols-4 gap-2.5 sm:gap-3 pt-2 pb-6">
                                        <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 border border-white/10 text-center">
                                            <div className="size-7 rounded-full bg-white/20 flex items-center justify-center">
                                                <User className="size-4 text-white" />
                                            </div>
                                            <span className="text-[11px] sm:text-xs font-medium text-white/90">
                                                Ide
                                            </span>
                                        </div>

                                        <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 border border-white/10 text-center">
                                            <div className="size-7 rounded-full bg-white/20 flex items-center justify-center">
                                                <User className="size-4 text-white" />
                                            </div>
                                            <span className="text-[11px] sm:text-xs font-medium text-white/90">
                                                Riset
                                            </span>
                                        </div>

                                        <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 border border-white/10 text-center">
                                            <div className="size-7 rounded-full bg-white/20 flex items-center justify-center">
                                                <User className="size-4 text-white" />
                                            </div>
                                            <span className="text-[11px] sm:text-xs font-medium text-white/90">
                                                Eksekusi
                                            </span>
                                        </div>

                                        <div className="bg-white text-blue-600 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 shadow-lg transform rotate-2 -translate-y-1 text-center">
                                            <div className="size-7 rounded-full bg-blue-50 flex items-center justify-center">
                                                <User className="size-4 text-blue-600 stroke-[2.5]" />
                                            </div>
                                            <span className="text-[11px] sm:text-xs font-black text-blue-600">
                                                Kamu?
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Stats */}
                                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/15">
                                        <div>
                                            <span className="text-[11px] text-white/70 block">
                                                Lagi buka rekrutmen
                                            </span>
                                            <span className="text-xl sm:text-2xl font-black text-white">
                                                {openRecruitingTeams.length} tim
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[11px] text-white/70 block">
                                                Mereka lagi butuh
                                            </span>
                                            <span className="text-xl sm:text-2xl font-black text-white">
                                                {totalNeededSlots} orang
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search & Filters */}
                        <div
                            id="teams-section"
                            className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-2.5"
                        >
                            <form
                                onSubmit={handleTeamFilterSubmit}
                                className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-slate-100/70 rounded-xl w-full"
                            >
                                <Search className="size-4 text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Cari lomba, role, atau skill..."
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
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'teams',
                                                team_search: teamSearch,
                                                team_category: e.target.value,
                                                team_role: teamRole,
                                            },
                                            { preserveState: true }
                                        );
                                    }}
                                    className="px-3.5 py-2.5 bg-slate-100/70 rounded-xl text-xs font-medium text-slate-700 border-0 focus:ring-0 cursor-pointer"
                                >
                                    <option value="">Semua kategori</option>
                                    {categories.map((c) => (
                                        <option key={c} value={c}>
                                            {c.replace('_', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={teamRole}
                                    onChange={(e) => {
                                        setTeamRole(e.target.value);
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'teams',
                                                team_search: teamSearch,
                                                team_category: teamCategory,
                                                team_role: e.target.value,
                                            },
                                            { preserveState: true }
                                        );
                                    }}
                                    className="px-3.5 py-2.5 bg-slate-100/70 rounded-xl text-xs font-medium text-slate-700 border-0 focus:ring-0 cursor-pointer"
                                >
                                    <option value="">Semua role</option>
                                    {commonRoleOptions.map((r) => (
                                        <option key={r} value={r}>
                                            {r}
                                        </option>
                                    ))}
                                </select>

                                {(teamSearch || teamCategory || teamRole) && (
                                    <button
                                        type="button"
                                        onClick={handleResetTeamFilter}
                                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                                    >
                                        Hapus filter
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Section Header */}
                        <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-black text-slate-900">
                                    Lagi buka rekrutmen
                                </h2>
                                <span className="px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700 text-xs font-bold">
                                    {openRecruitingTeams.length} tim
                                </span>
                            </div>
                            <span className="text-xs text-slate-400 font-medium">
                                {openRecruitingTeams.length} dari {openRecruitingTeams.length} tim aktif
                            </span>
                        </div>

                        {/* Recruiting Teams Grid */}
                        {openRecruitingTeams.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                                    <Users className="size-6" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Belum Ada Tim yang Sedang Merekrut
                                </h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                                    Bikin tim baru dan buka lowongan untuk mengajak teman se-kampus!
                                </p>
                                <Link
                                    href={route('competitions.create')}
                                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Bikin Tim Sekarang</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                                            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-5 group"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                                                        {comp.category?.replace('_', ' ') || 'HACKATHON'}
                                                    </span>
                                                    <div className="text-right">
                                                        <span className="text-[10px] text-slate-400 block font-medium">
                                                            Deadline daftar
                                                        </span>
                                                        <span className="text-xs font-bold text-slate-800">
                                                            {formattedDeadline}
                                                        </span>
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                    {comp.name}
                                                </h3>

                                                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                                    {comp.organizer || 'Kampus'}
                                                </p>

                                                {/* Section: LAGI BUTUHIN */}
                                                <div className="mt-4">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                                        LAGI BUTUHIN
                                                    </span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {roles.length > 0 ? (
                                                            roles.map((r) => (
                                                                <span
                                                                    key={r.id}
                                                                    className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                                                                >
                                                                    {r.name}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                                                                Semua Peran
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Visual Slots Row */}
                                                <div className="mt-4 flex items-center gap-1.5">
                                                    {Array.from({ length: membersCount }).map((_, idx) => (
                                                        <div
                                                            key={`filled-${idx}`}
                                                            className="size-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0"
                                                        >
                                                            <User className="size-4 fill-current" />
                                                        </div>
                                                    ))}
                                                    {Array.from({ length: Math.min(4, emptySlots) }).map((_, idx) => (
                                                        <div
                                                            key={`empty-${idx}`}
                                                            className="size-7 rounded-full border-2 border-dashed border-blue-400 text-blue-500 flex items-center justify-center shrink-0"
                                                        >
                                                            <User className="size-4" />
                                                        </div>
                                                    ))}
                                                    <span className="text-xs text-slate-500 font-medium ml-1.5">
                                                        {membersCount}/{maxCap} terisi
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bottom Leader Row */}
                                            <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="size-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                                                        {leaderInitials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-slate-900 truncate">
                                                            {team?.leader?.name || 'Ketua Tim'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 truncate">
                                                            Format lomba: {comp.competition_type || 'Hybrid'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDetailTeam(part);
                                                    }}
                                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                                                >
                                                    Detail ↗
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
                {/* TAB 2: EKSPLOR LOMBA (Full Directory Discovery) */}
                {/* ========================================================= */}
                {activeTab === 'explore' && (
                    <div className="space-y-6">
                        {/* Search & Multi-Filters Toolbar */}
                        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                            <form
                                onSubmit={handleExploreFilterSubmit}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/70 rounded-xl w-full"
                            >
                                <Search className="size-4 text-slate-400 shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Cari judul kompetisi, penyelenggara, atau deskripsi..."
                                    value={exploreSearch}
                                    onChange={(e) => setExploreSearch(e.target.value)}
                                    className="bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none w-full font-medium"
                                />
                                <button
                                    type="submit"
                                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                                >
                                    Cari
                                </button>
                            </form>

                            {/* Filters Row */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <select
                                    value={exploreCategory}
                                    onChange={(e) => {
                                        setExploreCategory(e.target.value);
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                category: e.target.value,
                                                level: exploreLevel,
                                                format: exploreFormat,
                                                type: exploreType,
                                            },
                                            { preserveState: true }
                                        );
                                    }}
                                    className="px-3 py-2 bg-slate-100/80 rounded-xl text-xs font-medium text-slate-700 border-0 cursor-pointer"
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
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                category: exploreCategory,
                                                level: e.target.value,
                                                format: exploreFormat,
                                                type: exploreType,
                                            },
                                            { preserveState: true }
                                        );
                                    }}
                                    className="px-3 py-2 bg-slate-100/80 rounded-xl text-xs font-medium text-slate-700 border-0 cursor-pointer"
                                >
                                    <option value="">Semua Tingkat</option>
                                    <option value="university">Tingkat Kampus</option>
                                    <option value="regional">Regional</option>
                                    <option value="national">Nasional</option>
                                    <option value="international">Internasional</option>
                                </select>

                                <select
                                    value={exploreFormat}
                                    onChange={(e) => {
                                        setExploreFormat(e.target.value);
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                category: exploreCategory,
                                                level: exploreLevel,
                                                format: e.target.value,
                                                type: exploreType,
                                            },
                                            { preserveState: true }
                                        );
                                    }}
                                    className="px-3 py-2 bg-slate-100/80 rounded-xl text-xs font-medium text-slate-700 border-0 cursor-pointer"
                                >
                                    <option value="">Semua Format</option>
                                    <option value="Online">Online / Daring</option>
                                    <option value="Offline">Offline / Luring</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>

                                <select
                                    value={exploreType}
                                    onChange={(e) => {
                                        setExploreType(e.target.value);
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                category: exploreCategory,
                                                level: exploreLevel,
                                                format: exploreFormat,
                                                type: e.target.value,
                                            },
                                            { preserveState: true }
                                        );
                                    }}
                                    className="px-3 py-2 bg-slate-100/80 rounded-xl text-xs font-medium text-slate-700 border-0 cursor-pointer"
                                >
                                    <option value="">Semua Jenis</option>
                                    <option value="team">Tim</option>
                                    <option value="individual">Individu</option>
                                </select>

                                {(exploreSearch || exploreCategory || exploreLevel || exploreFormat || exploreType) && (
                                    <button
                                        type="button"
                                        onClick={handleResetExploreFilter}
                                        className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer shrink-0"
                                    >
                                        Reset Filter
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Results Count Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-base sm:text-lg font-black text-slate-900">
                                Daftar Kompetisi Aktif
                            </h2>
                            <span className="text-xs text-slate-500 font-medium">
                                Menampilkan {competitions.data.length} dari {competitions.total} kompetisi
                            </span>
                        </div>

                        {/* Competitions Grid */}
                        {competitions.data.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                <Trophy className="size-10 text-slate-400 mx-auto mb-2" />
                                <h3 className="text-sm font-bold text-slate-900">
                                    Tidak Ada Kompetisi yang Sesuai Filter
                                </h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                    Coba ubah kata kunci pencarian atau reset filter untuk melihat semua kesempatan.
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResetExploreFilter}
                                    className="mt-4 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold"
                                >
                                    Lihat Semua Kompetisi
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {competitions.data.map((comp) => {
                                    const isSaved = bookmarkedIds.includes(comp.id);
                                    const isExpired = comp.registration_deadline && new Date(comp.registration_deadline) < new Date();
                                    const formattedDeadline = comp.registration_deadline
                                        ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : 'Terbuka';

                                    return (
                                        <div
                                            key={comp.id}
                                            onClick={() => router.get(`/competitions/${comp.id}`)}
                                            className={`bg-white rounded-2xl p-6 border transition-all cursor-pointer flex flex-col justify-between gap-5 group relative ${
                                                isExpired
                                                    ? 'border-slate-200/60 opacity-70 bg-slate-50/50'
                                                    : 'border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md'
                                            }`}
                                        >
                                            <div>
                                                {/* Top Row: Category & Bookmark Button */}
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                                                            {comp.category?.replace('_', ' ') || 'UMUM'}
                                                        </span>
                                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            {comp.level || 'Nasional'}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleToggleBookmark(e, comp.id)}
                                                        className={`p-1.5 rounded-lg border transition ${
                                                            isSaved
                                                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                                                : 'bg-white border-slate-200 text-slate-400 hover:text-rose-600'
                                                        }`}
                                                        title={isSaved ? 'Hapus dari Simpanan' : 'Simpan Lomba'}
                                                    >
                                                        <Bookmark className={`size-3.5 ${isSaved ? 'fill-current' : ''}`} />
                                                    </button>
                                                </div>

                                                {/* Title */}
                                                <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                    {comp.name}
                                                </h3>

                                                {/* Organizer */}
                                                <p className="text-xs font-semibold text-slate-400 mt-1">
                                                    {comp.organizer || 'Penyelenggara Terverifikasi'}
                                                </p>

                                                {/* Description preview */}
                                                {comp.description && (
                                                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                                        {comp.description}
                                                    </p>
                                                )}

                                                {/* Metadata pills */}
                                                <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100">
                                                        {comp.competition_type === 'individual' ? 'Individu' : `Tim (${comp.min_team_size || 1}-${comp.max_team_size || 5} org)`}
                                                    </span>
                                                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                                                        Format: {comp.competition_type || 'Hybrid'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bottom Deadline & Actions */}
                                            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block font-medium">
                                                        Deadline Pendaftaran
                                                    </span>
                                                    <span className={`font-bold ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                                                        {formattedDeadline} {isExpired ? '(Tutup)' : ''}
                                                    </span>
                                                </div>

                                                <span className="font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                                                    Lihat Detail ↗
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
                {/* TAB 3: KATEGORI (10 Academic & Professional Categories) */}
                {/* ========================================================= */}
                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-200/80 pb-3">
                            <h2 className="text-xl font-black text-slate-900">
                                Kategori Kompetisi Kampus
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Eksplorasi kesempatan berdasarkan bidang keilmuan, minat, dan disiplin akademik.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {coreCategoryList.map((cat, idx) => {
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
                                                <span className="text-2xl">{cat.icon}</span>
                                                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                                    {count} lomba
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition">
                                                {cat.name}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                                {cat.desc}
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                                            <span>Lihat Kompetisi</span>
                                            <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 4: LOMBA SAYA (Saved Bookmarks, Applications & Teams) */}
                {/* ========================================================= */}
                {activeTab === 'my_competitions' && (
                    <div className="space-y-6">
                        {/* Sub-Tabs Nav */}
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMySubTab('saved')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                        mySubTab === 'applications'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Pengajuan Saya ({myApplications.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMySubTab('teams')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
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
                                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"
                            >
                                <Plus className="size-3.5" />
                                <span>Bikin Tim</span>
                            </Link>
                        </div>

                        {/* SUB-VIEW 1: SAVED BOOKMARKS */}
                        {mySubTab === 'saved' && (
                            <div>
                                {savedCompetitions.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                        <Bookmark className="size-10 text-slate-400 mx-auto mb-2" />
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Belum Ada Kompetisi Tersimpan
                                        </h3>
                                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                            Simpan kompetisi yang menarik perhatianmu saat menjelajahi tab "Eksplor Lomba".
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('explore')}
                                            className="mt-4 px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-bold cursor-pointer"
                                        >
                                            Eksplor Lomba Sekarang
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {savedCompetitions.map((comp) => (
                                            <div
                                                key={comp.id}
                                                onClick={() => router.get(`/competitions/${comp.id}`)}
                                                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 group"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                                                            {comp.category?.replace('_', ' ') || 'HACKATHON'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleToggleBookmark(e, comp.id)}
                                                            className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600"
                                                            title="Hapus dari Bookmark"
                                                        >
                                                            <Bookmark className="size-3.5 fill-current" />
                                                        </button>
                                                    </div>
                                                    <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                        {comp.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                        {comp.organizer}
                                                    </p>
                                                </div>

                                                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                                                    <div>
                                                        <span className="text-[10px] text-slate-400 block">Deadline</span>
                                                        <span className="font-bold text-slate-800">
                                                            {comp.registration_deadline
                                                                ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
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

                        {/* SUB-VIEW 2: APPLICATIONS */}
                        {mySubTab === 'applications' && (
                            <div>
                                {myApplications.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                        <MessageSquare className="size-10 text-slate-400 mx-auto mb-2" />
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Belum Ada Pengajuan yang Dikirim
                                        </h3>
                                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                            Eksplor tim di tab "Cari Tim" dan ajukan dirimu ke peran yang cocok!
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('teams')}
                                            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                        >
                                            <span>Eksplor Tim Sekarang</span>
                                            <ArrowRight className="size-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {myApplications.map((app) => (
                                            <div
                                                key={app.id}
                                                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-sm font-bold text-slate-900">
                                                            {app.team_name}
                                                        </h4>
                                                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                            Posisi: {app.role_name}
                                                        </span>
                                                        {app.status === 'accepted' ? (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                                ✓ Diterima
                                                            </span>
                                                        ) : app.status === 'rejected' ? (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                                                                ✗ Ditolak
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                                                Menunggu
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500">
                                                        {app.competition_name} • Ketua: {app.leader_name || 'Ketua Tim'}
                                                    </p>
                                                    {app.message && (
                                                        <p className="text-xs text-slate-600 italic mt-1">
                                                            "{app.message}"
                                                        </p>
                                                    )}
                                                </div>

                                                {app.participation_id && app.status === 'accepted' && (
                                                    <Link
                                                        href={route('competitions.workspace', app.participation_id)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0"
                                                    >
                                                        <span>Buka Workspace</span>
                                                        <ArrowRight className="size-3.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SUB-VIEW 3: TEAMS */}
                        {mySubTab === 'teams' && (
                            <div>
                                {myTeams.length === 0 ? (
                                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-xs">
                                        <FolderKanban className="size-10 text-slate-400 mx-auto mb-2" />
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Belum Ada Tim Aktif
                                        </h3>
                                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                            Mulai dengan membentuk tim baru atau bergabung ke tim yang sedang merekrut.
                                        </p>
                                        <div className="mt-4 flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('teams')}
                                                className="px-4 py-2 rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                            >
                                                Cari Tim
                                            </button>
                                            <Link
                                                href={route('competitions.create')}
                                                className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                                            >
                                                Bikin Tim Baru
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
                                                        {team.is_leader ? (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                                                Ketua Tim
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                                Anggota
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {team.competition_name}
                                                    </p>
                                                    <div className="mt-2 text-xs text-slate-600">
                                                        Anggota: <strong>{team.members_count}</strong>
                                                        {team.max_size ? ` / ${team.max_size}` : ''} orang
                                                    </div>
                                                </div>

                                                <Link
                                                    href={route('competitions.workspace', team.id)}
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
                                                >
                                                    <span>Buka Workspace Tim</span>
                                                    <ArrowRight className="size-3.5" />
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
                {/* TAB 5: REKOMENDASI (Personalized Recommendations) */}
                {/* ========================================================= */}
                {activeTab === 'recommendations' && (
                    <div className="space-y-6">
                        <div className="border-b border-slate-200/80 pb-3">
                            <h2 className="text-xl font-black text-slate-900">
                                Rekomendasi Pintar untuk Profilmu
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Berdasarkan keahlian, program studi, dan minat lomba yang kamu miliki.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {recommendedCompetitions.map((comp) => (
                                <div
                                    key={comp.id}
                                    onClick={() => router.get(`/competitions/${comp.id}`)}
                                    className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-5 group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                                                {comp.category?.replace('_', ' ') || 'HACKATHON'}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                                95% Match
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                            {comp.name}
                                        </h3>
                                        <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                            {comp.organizer}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                            {comp.description}
                                        </p>
                                    </div>

                                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-medium">
                                            {comp.level || 'Nasional'}
                                        </span>
                                        <span className="font-bold text-blue-600">Detail Lomba ↗</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </main>

            {/* MINSATU DETAIL MODAL (Matching User Reference Screenshot) */}
            {detailTeam && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200/90 relative my-6 space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                {detailTeam.competition.name}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setDetailTeam(null)}
                                className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
                            >
                                <X className="size-4" />
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
                                    Deadline daftar
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
                                    Format lomba
                                </span>
                                <span className="text-sm font-bold text-slate-900 mt-0.5 block truncate">
                                    {detailTeam.competition.competition_type || 'Umum'}
                                </span>
                            </div>
                        </div>

                        {/* Location / Note */}
                        <div className="text-xs text-slate-500 font-medium -mt-2">
                            {detailTeam.competition.description || 'Informasi detail kompetisi dapat dilihat pada pedoman resmi.'}
                        </div>

                        {/* Two Columns */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            {/* Left Column (7 cols): Yang dicari & File link */}
                            <div className="md:col-span-7 space-y-6">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-900">
                                        Yang dicari
                                    </h4>
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                                        {detailTeam.team.description ||
                                            'Mencari rekan tim untuk berkolaborasi dan berkompetisi bersama.'}
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="text-xs font-bold text-slate-900">
                                            File & link
                                        </h4>
                                    </div>

                                    <div className="space-y-2">
                                        {detailTeam.competition.official_url && (
                                            <a
                                                href={detailTeam.competition.official_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-3 rounded-2xl border border-slate-200/90 flex items-center justify-between hover:border-blue-500 transition text-xs group"
                                            >
                                                <span className="font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                                                    <span>Website & Guidebook Resmi</span>
                                                    <ArrowUpRight className="size-3.5" />
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
                                                className="p-3 rounded-2xl border border-slate-200/90 flex items-center justify-between hover:border-blue-500 transition text-xs group"
                                            >
                                                <span className="font-bold text-blue-600 group-hover:underline flex items-center gap-1">
                                                    <span>Portal Registrasi Lomba</span>
                                                    <ArrowUpRight className="size-3.5" />
                                                </span>
                                                <span className="text-slate-400 text-[11px] truncate max-w-[180px]">
                                                    {detailTeam.competition.registration_url.replace(/^https?:\/\//, '')}
                                                </span>
                                            </a>
                                        )}

                                        <Link
                                            href={`/competitions/${detailTeam.competition.id}`}
                                            className="p-3 rounded-2xl border border-slate-200/90 flex items-center justify-between hover:border-blue-500 transition text-xs group bg-slate-50/50"
                                        >
                                            <span className="font-bold text-slate-700 group-hover:text-blue-600 flex items-center gap-1">
                                                <FileText className="size-3.5 text-slate-500" />
                                                <span>Dokumen & Syarat Lengkap</span>
                                            </span>
                                            <span className="text-blue-600 font-semibold text-[11px] flex items-center gap-0.5">
                                                Buka Detail <ArrowUpRight className="size-3" />
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column (5 cols): Soft Blue Formasi Card */}
                            <div className="md:col-span-5 bg-[#F0F5FF] rounded-2xl p-5 border border-blue-100 space-y-4">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                                    <Users className="size-4 text-blue-600" />
                                    <span>Formasi tim</span>
                                </div>

                                {/* Slot Count */}
                                <div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-4xl font-black text-blue-600">
                                            {Math.max(0, (detailTeam.competition.max_team_size || 3) - detailTeam.team.members_count)}
                                        </span>
                                        <span className="text-xs text-slate-600 font-bold">
                                            slot kosong
                                        </span>
                                    </div>

                                    {/* Visual Slots Row */}
                                    <div className="mt-3 flex items-center gap-1.5">
                                        {Array.from({ length: detailTeam.team.members_count }).map((_, idx) => (
                                            <div
                                                key={`f-${idx}`}
                                                className="size-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0"
                                            >
                                                <User className="size-4 fill-current" />
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
                                                className="size-7 rounded-full border-2 border-dashed border-blue-400 text-blue-500 flex items-center justify-center shrink-0"
                                            >
                                                <User className="size-4" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-xs text-blue-700 font-bold block mt-1.5">
                                        {detailTeam.team.members_count}/{detailTeam.competition.max_team_size || 3} terisi (
                                        {Math.max(0, (detailTeam.competition.max_team_size || 3) - detailTeam.team.members_count)} dicari)
                                    </span>
                                </div>

                                {/* Lagi Butuhin */}
                                <div className="space-y-1.5 pt-1">
                                    <span className="text-xs font-bold text-slate-700 block">
                                        Lagi butuhin
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {detailTeam.team.recruitment?.roles && detailTeam.team.recruitment.roles.length > 0 ? (
                                            detailTeam.team.recruitment.roles.map((r) => (
                                                <span
                                                    key={r.id}
                                                    className="px-3 py-1 rounded-full bg-white text-slate-800 text-xs font-bold shadow-2xs border border-slate-100"
                                                >
                                                    {r.name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-white text-slate-600 text-xs font-medium shadow-2xs border border-slate-100">
                                                Terbuka untuk semua role
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Ketua Tim */}
                                <div className="pt-2 border-t border-blue-200/60">
                                    <span className="text-[11px] text-slate-400 font-semibold block mb-1">
                                        Ketua tim
                                    </span>
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-9 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                            {detailTeam.team.leader?.name ? detailTeam.team.leader.name.charAt(0) : 'M'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-900 truncate">
                                                {detailTeam.team.leader?.name || 'Ketua Tim'}
                                            </div>
                                            <Link
                                                href={`/competitions/${detailTeam.competition.id}`}
                                                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
                                            >
                                                <span>Lihat halaman lomba</span>
                                                <ArrowUpRight className="size-3" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* CTA: Ajukan Diri */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const teamToApply = detailTeam;
                                            setDetailTeam(null);
                                            openApplyModal(teamToApply);
                                        }}
                                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow transition cursor-pointer"
                                    >
                                        Ajukan Diri Bergabung
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

                {/* FOOTER */}
                <footer className="pt-16 mt-16 border-t border-slate-200/70 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="max-w-md leading-relaxed text-slate-500">
                        rakitcampus adalah ekosistem kolaborasi dan informasi kompetisi mahasiswa. Kontak kamu dijaga dan baru dibuka ke rekan tim saat kamu mengajukan diri atau berdiskusi.
                    </p>
                    <div className="flex items-center gap-4 text-slate-600 font-medium shrink-0">
                        <a href="#" className="hover:text-slate-900">Tentang Kami</a>
                        <a href="#" className="hover:text-slate-900">Kebijakan Privasi</a>
                        <a href="#" className="hover:text-slate-900">Syarat & Ketentuan</a>
                    </div>
                </footer>

                {/* MinSatu Apply Modal */}
                <ApplyCompetitionTeamModal
                    isOpen={applyModalOpen}
                    onClose={() => setApplyModalOpen(false)}
                    teamData={selectedTeamData}
                    currentUserInfo={currentUserInfo}
                />
        </AppLayout>
    );
}
