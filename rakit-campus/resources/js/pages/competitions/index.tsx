import AnimatedIcon from '@/components/animations/AnimatedIcon';
import SeoHead from '@/components/seo/SeoHead';
import ApplyCompetitionTeamModal, {
    type ApplyTeamData,
} from '@/components/competitions/ApplyCompetitionTeamModal';
import CreateCompetitionTeamModal from '@/components/competitions/CreateCompetitionTeamModal';
import RecordResultModal from '@/components/competitions/RecordResultModal';
import TrackCompetitionModal from '@/components/competitions/TrackCompetitionModal';
import UpdateStageModal from '@/components/competitions/UpdateStageModal';
import AppLayout from '@/layouts/app-layout';
import { getCompetitionCover } from '@/lib/competition-cover';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    Award,
    Bookmark,
    Briefcase,
    Calendar,
    Check,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Cpu,
    ExternalLink,
    FileText,
    Folder,
    FolderKanban,
    Globe,
    GraduationCap,
    Info,
    Layers,
    Leaf,
    Link2,
    Loader2,
    MapPin,
    MessageSquare,
    Mic,
    Palette,
    Plus,
    Search,
    Send,
    ShieldCheck,
    Sparkles,
    Star,
    Terminal,
    TrendingUp,
    Trophy,
    User,
    UserCheck,
    UserPlus,
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
        tasks_count?: number;
        completed_tasks_count?: number;
        progress_percent?: number;
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
    tasks_count?: number;
    completed_tasks_count?: number;
    progress_percent?: number;
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
    openCompetitionOptions?: any[];
    openRecruitingTeams?: RecruitingTeam[];
    radarCandidates?: any[];
    sentInvitationUserIds?: number[];
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
    organizers?: string[];
    filters: {
        search?: string;
        organizer?: string;
        category?: string;
        status?: string;
        level?: string;
        tab?: string;
        view?: string;
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
    openCompetitionOptions,
    openRecruitingTeams = [],
    radarCandidates = [],
    sentInvitationUserIds = [],
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
    organizers = [],
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
    const [exploreOrganizer, setExploreOrganizer] = useState(safeFilters.organizer || '');
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

    // Radar Rekrutmen inside Cari Tim States
    const [teamViewMode, setTeamViewMode] = useState<'teams' | 'radar'>(() => {
        if ((safeFilters as any).view === 'radar') return 'radar';
        if (typeof window !== 'undefined') {
            const p = new URLSearchParams(window.location.search);
            if (p.get('view') === 'radar') return 'radar';
        }
        return 'teams';
    });
    const [radarPersonaFilter, setRadarPersonaFilter] = useState<'all' | 'Hacker' | 'Hipster' | 'Hustler'>('all');
    const [radarSearch, setRadarSearch] = useState('');
    const [selectedRadarCandidate, setSelectedRadarCandidate] = useState<any | null>(null);
    const [radarInviteModalOpen, setRadarInviteModalOpen] = useState(false);
    const [inviteParticipationId, setInviteParticipationId] = useState<string | number>('');
    const [inviteRoleName, setInviteRoleName] = useState('Anggota Tim');
    const [inviteMessage, setInviteMessage] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [localInvitedIds, setLocalInvitedIds] = useState<number[]>([]);
    const [inviteSuccessToast, setInviteSuccessToast] = useState<{ show: boolean; name: string } | null>(null);

    const myLedTeams = useMemo(() => {
        return myTeams.filter((t: any) => t.is_leader);
    }, [myTeams]);

    const openRadarInvite = (candidate: any) => {
        setSelectedRadarCandidate(candidate);
        if (myLedTeams.length > 0) {
            setInviteParticipationId(myLedTeams[0].id);
            const defaultRole = candidate.persona === 'Hipster'
                ? 'UI/UX Designer'
                : (candidate.persona === 'Hustler' ? 'Pitcher / Hustler' : 'Fullstack / Hacker');
            setInviteRoleName(defaultRole);
            const candName = candidate.user?.name || candidate.name || 'Rekan';
            setInviteMessage(`Halo ${candName}, mari bergabung dengan tim kami untuk kompetisi!`);
            setRadarInviteModalOpen(true);
        } else {
            if (confirm(`Anda belum memiliki tim kompetisi yang dipimpin. Buat tim kompetisi baru sekarang untuk merekrut ${candidate.user?.name || candidate.name}?`)) {
                setCreateTeamPreselectedCompId(null);
                setCreateTeamModalOpen(true);
            }
        }
    };

    const handleSendRadarInvite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteParticipationId || !selectedRadarCandidate) return;

        setIsInviting(true);
        const studentId = selectedRadarCandidate.user?.id || selectedRadarCandidate.id;
        const candName = selectedRadarCandidate.user?.name || selectedRadarCandidate.name || 'Rekan Mahasiswa';

        router.post(
            `/competition-workspace/${inviteParticipationId}/send-invitation`,
            {
                student_id: studentId,
                role_name: inviteRoleName,
                message: inviteMessage,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    if (studentId) {
                        setLocalInvitedIds((prev) => (prev.includes(studentId) ? prev : [...prev, studentId]));
                    }
                    setRadarInviteModalOpen(false);
                    setSelectedRadarCandidate(null);
                    setInviteMessage('');
                    setInviteSuccessToast({ show: true, name: candName });
                    setTimeout(() => {
                        setInviteSuccessToast(null);
                    }, 4000);
                },
                onFinish: () => setIsInviting(false),
            }
        );
    };

    const filteredRadarCandidates = useMemo(() => {
        return radarCandidates.filter((cand: any) => {
            const student = cand.user || cand;
            const personaMatch = radarPersonaFilter === 'all' || cand.persona === radarPersonaFilter;
            if (!personaMatch) return false;

            if (!radarSearch.trim()) return true;
            const q = radarSearch.toLowerCase();
            const name = (student.name || '').toLowerCase();
            const study = (student.study_program || '').toLowerCase();
            const campus = (student.campus_name || student.campus?.name || '').toLowerCase();
            const skills = (cand.matched_skills || cand.skills || []).map((s: any) => (typeof s === 'string' ? s.toLowerCase() : (s.name || '').toLowerCase()));

            return name.includes(q) || study.includes(q) || campus.includes(q) || skills.some((s: string) => s.includes(q));
        });
    }, [radarCandidates, radarPersonaFilter, radarSearch]);

    const [radarPage, setRadarPage] = useState(1);
    const RADAR_PER_PAGE = 6;
    const totalRadarPages = Math.ceil(filteredRadarCandidates.length / RADAR_PER_PAGE);
    const paginatedRadarCandidates = useMemo(() => {
        const start = (radarPage - 1) * RADAR_PER_PAGE;
        return filteredRadarCandidates.slice(start, start + RADAR_PER_PAGE);
    }, [filteredRadarCandidates, radarPage]);

    React.useEffect(() => {
        setRadarPage(1);
    }, [radarPersonaFilter, radarSearch]);

    const [myCompPage, setMyCompPage] = useState(1);
    const MY_COMP_PER_PAGE = 6;

    React.useEffect(() => {
        setMyCompPage(1);
    }, [myLifecycleFilter]);

    // Team Recruitment Detail Modal State
    const [detailTeam, setDetailTeam] = useState<RecruitingTeam | null>(null);

    // Team Recruitment Apply Modal State
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [selectedTeamData, setSelectedTeamData] = useState<ApplyTeamData | null>(null);

    // Create Team Modal State
    const [createTeamModalOpen, setCreateTeamModalOpen] = useState(false);
    const [createTeamPreselectedCompId, setCreateTeamPreselectedCompId] = useState<number | null>(null);

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
                organizer: exploreOrganizer,
                category: exploreCategory,
                level: exploreLevel,
                format: exploreFormat,
                type: exploreType,
                status: exploreStatus,
                sort: exploreSort,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetExploreFilter = () => {
        setExploreSearch('');
        setExploreOrganizer('');
        setExploreCategory('');
        setExploreLevel('');
        setExploreFormat('');
        setExploreType('');
        setExploreStatus('');
        setExploreSort('deadline_asc');
        router.get('/competitions', { tab: 'explore' }, { preserveState: true, preserveScroll: true });
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
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResetTeamFilter = () => {
        setTeamSearch('');
        setTeamCategory('');
        setTeamRole('');
        router.get('/competitions', { tab: 'teams' }, { preserveState: true, preserveScroll: true });
    };

    const openApplyModal = (part: RecruitingTeam) => {
        setSelectedTeamData({
            participationId: part.id,
            teamName: part.team?.name || 'Tim Kompetisi',
            competitionName: part.competition.name,
            organizer: part.competition.organizer,
            leaderName: part.team?.leader?.name,
            isMember: part.is_member,
            isLeader: part.is_leader,
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
                {/* 1. TOP HERO CONTEXT CARD (Apple HIG Bento Squircle Card) */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                        <div className="size-16 rounded-2xl bg-indigo-50/80 border border-indigo-200/60 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
                            <img
                                src="/images/mascot/mascot-trophy.png"
                                alt="Mascot Trophy"
                                className="w-full h-full object-contain drop-shadow-xs select-none pointer-events-none transform hover:scale-105 transition"
                            />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                                <Trophy className="size-3 text-indigo-600" />
                                <span>Competition Hub & Talent Radar</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                                Competition Hub Mahasiswa
                            </h1>
                            <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                                Eksplorasi kompetisi bergengsi, temukan rekan tim lintas prodi, dan pantau linimasa karya lomba nasional.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setCreateTeamPreselectedCompId(null);
                            setCreateTeamModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-2xs transition shrink-0 cursor-pointer self-start md:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Buat Tim Baru</span>
                    </button>
                </div>

                {/* 2. APPLE HIG SEGMENTED TAB BAR */}
                <div className="flex items-center gap-1.5 bg-slate-200/60 p-1.5 rounded-2xl overflow-x-auto text-xs font-semibold shadow-2xs">
                    {[
                        { key: 'explore', label: 'Eksplor Lomba', icon: Trophy },
                        { key: 'teams', label: 'Cari Rekan & Tim', icon: Users },
                        { key: 'categories', label: 'Kategori Minat', icon: Layers },
                        { key: 'my_competitions', label: 'Lomba Saya', icon: Bookmark },
                        { key: 'recommendations', label: 'Rekomendasi AI', icon: Sparkles },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isCurrent = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => {
                                    setActiveTab(tab.key as any);
                                    router.get('/competitions', { tab: tab.key }, { preserveState: true, preserveScroll: true });
                                }}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer whitespace-nowrap ${
                                    isCurrent
                                        ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Icon className="size-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* ========================================================= */}
                {/* TAB 1: EKSPLOR LOMBA                                     */}
                {/* ========================================================= */}
                {activeTab === 'explore' && (
                    <div className="space-y-6 sm:space-y-8">
                        {/* BENTO SHOWCASE GRID: 4 Cohesive Tiles */}
                        {spotlightComp && (
                            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-stretch">
                                {/* Tile 1: Spotlight Hero (lg:col-span-7 xl:col-span-8) */}
                                <div className="md:col-span-2 lg:col-span-7 xl:col-span-8 bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between group">
                                    <div className="relative aspect-[4/5] sm:aspect-auto sm:h-64 md:h-auto md:w-5/12 md:aspect-[4/5] overflow-hidden bg-slate-950 shrink-0">
                                        <img
                                            src={getCompetitionCover(spotlightComp)}
                                            alt={spotlightComp.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-black/20" />

                                        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                                            <span className="px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs">
                                                <Trophy className="size-3" />
                                                <span>Sorotan</span>
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white/90 text-[10px] font-semibold uppercase">
                                                {spotlightComp.level || 'Nasional'}
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => handleToggleBookmark(e, spotlightComp.id)}
                                            className={`absolute top-3.5 right-3.5 p-2 rounded-full backdrop-blur-md transition cursor-pointer active:scale-95 ${
                                                bookmarkedIds.includes(spotlightComp.id)
                                                    ? 'bg-rose-500 text-white shadow-2xs'
                                                    : 'bg-black/40 hover:bg-black/60 text-white'
                                            }`}
                                            title={bookmarkedIds.includes(spotlightComp.id) ? 'Hapus Simpanan' : 'Simpan'}
                                        >
                                            <Bookmark className={`w-3.5 h-3.5 ${bookmarkedIds.includes(spotlightComp.id) ? 'fill-current' : ''}`} />
                                        </button>

                                        <div className="absolute bottom-3 left-3.5 text-white">
                                            <span className="text-[10px] text-white/70 block uppercase tracking-wider font-bold">Deadline</span>
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

                                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                                {spotlightComp.organizer}
                                            </span>
                                            <Link href={`/competitions/${spotlightComp.slug || spotlightComp.id}`} className="group/link block">
                                                <h2 className="text-base sm:text-xl font-extrabold text-slate-900 group-hover/link:text-indigo-600 transition tracking-tight leading-snug line-clamp-2 mt-1">
                                                    {spotlightComp.name}
                                                </h2>
                                            </Link>
                                            {spotlightComp.description && (
                                                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                                    {spotlightComp.description}
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                                                    {spotlightComp.competition_type || 'Tim'}
                                                </span>
                                                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase">
                                                    {spotlightComp.category?.replace('_', ' ') || 'Teknologi'}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/competitions/${spotlightComp.slug || spotlightComp.id}`}
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition active:scale-95"
                                            >
                                                <span>Detail</span>
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Tile 2: Deadlines Countdown (lg:col-span-5 xl:col-span-4) */}
                                <div className="md:col-span-2 lg:col-span-5 xl:col-span-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                            <div className="flex items-center gap-2.5">
                                                <div className="size-8 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center shadow-2xs">
                                                    <Clock className="size-4" />
                                                </div>
                                                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                                                    Deadline Terdekat
                                                </h3>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Segera Ditutup</span>
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
                                                            className="py-2.5 flex items-center justify-between gap-3 group block"
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">
                                                                    {comp.name}
                                                                </h4>
                                                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                                    {comp.organizer}
                                                                </p>
                                                            </div>
                                                            <span
                                                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
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

                                    <div className="pt-2.5 border-t border-slate-100 text-right">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const el = document.getElementById('catalog-section');
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition"
                                        >
                                            Lihat Semua Katalog ↓
                                        </button>
                                    </div>
                                </div>

                                {/* Tile 3: Cari Rekan Tim (lg:col-span-6) */}
                                <div
                                    onClick={() => setActiveTab('teams')}
                                    className="col-span-1 md:col-span-1 lg:col-span-6 bg-indigo-50/50 rounded-3xl p-5 sm:p-6 border border-indigo-200/70 shadow-xs hover:border-indigo-400 transition cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="size-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                                                <Users className="size-5" />
                                            </span>
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                                                    Cari Rekan Tim
                                                </h3>
                                                <span className="text-[11px] text-slate-500">
                                                    {openRecruitingTeams.length} tim aktif membuka lowongan peran
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                                            Eksplor Tim →
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap mt-3">
                                        {openRecruitingTeams.slice(0, 3).map((team: any) => (
                                            <span
                                                key={team.id}
                                                className="px-3 py-1 rounded-full bg-white border border-indigo-200/80 text-[11px] font-semibold text-slate-800 shadow-2xs truncate max-w-[200px]"
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
                                <div className="col-span-1 md:col-span-1 lg:col-span-6 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="size-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                                                <Layers className="size-5" />
                                            </span>
                                            <div>
                                                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                                                    Kategori Unggulan
                                                </h3>
                                                <span className="text-[11px] text-slate-500">
                                                    Filter cepat minat kompetisi
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('categories')}
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                                        >
                                            Semua ({categories.length})
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-1.5 flex-wrap mt-3">
                                        {categories.slice(0, 5).map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => {
                                                    setExploreCategory(cat);
                                                    router.get('/competitions', { tab: 'explore', category: cat }, { preserveState: true });
                                                }}
                                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer active:scale-95 ${
                                                    exploreCategory === cat
                                                        ? 'bg-indigo-600 text-white shadow-2xs'
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
                                    value={exploreOrganizer}
                                    onChange={(e) => {
                                        setExploreOrganizer(e.target.value);
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                organizer: e.target.value,
                                                category: exploreCategory,
                                                level: exploreLevel,
                                                format: exploreFormat,
                                                type: exploreType,
                                                status: exploreStatus,
                                                sort: exploreSort,
                                            },
                                            { preserveState: true, preserveScroll: true }
                                        );
                                    }}
                                    className="w-full lg:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer truncate max-w-[170px]"
                                    title="Filter Penyelenggara Kompetisi"
                                >
                                    <option value="">Semua Penyelenggara</option>
                                    {organizers.map((org) => (
                                        <option key={org} value={org}>
                                            {org}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={exploreCategory}
                                    onChange={(e) => {
                                        setExploreCategory(e.target.value);
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                organizer: exploreOrganizer,
                                                category: e.target.value,
                                                level: exploreLevel,
                                                format: exploreFormat,
                                                type: exploreType,
                                                status: exploreStatus,
                                                sort: exploreSort,
                                            },
                                            { preserveState: true, preserveScroll: true }
                                        );
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
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                organizer: exploreOrganizer,
                                                category: exploreCategory,
                                                level: e.target.value,
                                                format: exploreFormat,
                                                type: exploreType,
                                                status: exploreStatus,
                                                sort: exploreSort,
                                            },
                                            { preserveState: true, preserveScroll: true }
                                        );
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
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                organizer: exploreOrganizer,
                                                category: exploreCategory,
                                                level: exploreLevel,
                                                format: e.target.value,
                                                type: exploreType,
                                                status: exploreStatus,
                                                sort: exploreSort,
                                            },
                                            { preserveState: true, preserveScroll: true }
                                        );
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
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                organizer: exploreOrganizer,
                                                category: exploreCategory,
                                                level: exploreLevel,
                                                format: exploreFormat,
                                                type: e.target.value,
                                                status: exploreStatus,
                                                sort: exploreSort,
                                            },
                                            { preserveState: true, preserveScroll: true }
                                        );
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
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                organizer: exploreOrganizer,
                                                category: exploreCategory,
                                                level: exploreLevel,
                                                format: exploreFormat,
                                                type: exploreType,
                                                status: e.target.value,
                                                sort: exploreSort,
                                            },
                                            { preserveState: true, preserveScroll: true }
                                        );
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
                                        router.get(
                                            '/competitions',
                                            {
                                                tab: 'explore',
                                                search: exploreSearch,
                                                organizer: exploreOrganizer,
                                                category: exploreCategory,
                                                level: exploreLevel,
                                                format: exploreFormat,
                                                type: exploreType,
                                                status: exploreStatus,
                                                sort: e.target.value,
                                            },
                                            { preserveState: true, preserveScroll: true }
                                        );
                                    }}
                                    className="w-full lg:w-auto px-2.5 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-blue-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer truncate"
                                >
                                    <option value="deadline_asc">Deadline Terdekat</option>
                                    <option value="deadline_desc">Deadline Terlama</option>
                                    <option value="latest">Terbaru</option>
                                </select>

                                {(exploreSearch || exploreOrganizer || exploreCategory || exploreLevel || exploreFormat || exploreType || exploreStatus) && (
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5.5">
                                {catalogCompetitions.map((comp) => {
                                    const isSaved = bookmarkedIds.includes(comp.id);
                                    const isExpired = comp.registration_deadline && new Date(comp.registration_deadline) < new Date();
                                    const isClosed = isExpired || comp.status === 'closed' || comp.status === 'completed' || comp.status === 'cancelled';
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

                                    const teamLabel = comp.min_team_size && comp.max_team_size
                                        ? comp.min_team_size === comp.max_team_size
                                            ? comp.min_team_size === 1
                                                ? 'Individu'
                                                : `${comp.min_team_size} Orang`
                                            : `${comp.min_team_size}-${comp.max_team_size} Orang`
                                        : '1 Tim';

                                    const topPillText = comp.prize_info
                                        ? comp.prize_info
                                        : isClosed
                                            ? 'Pendaftaran Tutup'
                                            : daysLeft !== null
                                                ? (daysLeft === 0 ? 'Tutup Hari Ini' : `${daysLeft} Hari Lagi`)
                                                : 'Pendaftaran Buka';

                                    return (
                                        <div
                                            key={comp.id}
                                            onClick={() => router.get(`/competitions/${comp.slug || comp.id}`)}
                                            className={`relative aspect-[3/4.4] sm:aspect-[3/4.25] w-full rounded-[28px] sm:rounded-[32px] overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col justify-between group select-none ${
                                                isClosed
                                                    ? 'border-white/10 opacity-80'
                                                    : 'border-white/15 shadow-md hover:shadow-2xl hover:-translate-y-1.5'
                                            }`}
                                        >
                                            {/* Full-bleed Cover Background Poster */}
                                            <img
                                                src={getCompetitionCover(comp)}
                                                alt={comp.name}
                                                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${
                                                    isClosed ? 'grayscale-35' : ''
                                                }`}
                                            />

                                            {/* Soft Top Vignette for Floating Controls */}
                                            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />

                                            {/* Deep Frosted Dark Gradient Overlay for Bottom Content */}
                                            <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent pointer-events-none" />

                                            {/* Top Floating Controls: Price/Status Pill & Circular Bookmark */}
                                            <div className="relative z-10 p-3.5 sm:p-4 flex items-center justify-between gap-2">
                                                <div className="px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white text-xs sm:text-sm font-bold tracking-tight shadow-md max-w-[72%] truncate">
                                                    {topPillText}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={(e) => handleToggleBookmark(e, comp.id)}
                                                    className={`size-9 sm:size-10 rounded-full backdrop-blur-md flex items-center justify-center transition cursor-pointer shadow-md shrink-0 ${
                                                        isSaved
                                                            ? 'bg-rose-500 text-white shadow-rose-500/30'
                                                            : 'bg-black/40 hover:bg-black/60 text-white border border-white/20'
                                                    }`}
                                                    title={isSaved ? 'Hapus Simpanan' : 'Simpan Lomba'}
                                                >
                                                    <Bookmark className={`size-4 sm:size-4.5 ${isSaved ? 'fill-current' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Middle Floating Carousel Pagination Dots */}
                                            <div className="relative z-10 flex justify-center -mb-2">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md border border-white/10 shadow-xs">
                                                    <span className="w-4 h-1.5 rounded-full bg-white"></span>
                                                    <span className="size-1.5 rounded-full bg-white/40"></span>
                                                    <span className="size-1.5 rounded-full bg-white/40"></span>
                                                    <span className="size-1.5 rounded-full bg-white/40"></span>
                                                    <span className="size-1.5 rounded-full bg-white/40"></span>
                                                </div>
                                            </div>

                                            {/* Bottom Info Section */}
                                            <div className="relative z-10 p-4 sm:p-5 pt-0 flex flex-col gap-2.5 sm:gap-3">
                                                {/* Title & Level Rating */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-1 group-hover:text-blue-200 transition-colors">
                                                        {comp.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1 text-amber-400 text-xs sm:text-sm font-bold shrink-0 ml-1">
                                                        <Star className="size-3.5 sm:size-4 fill-amber-400 text-amber-400" />
                                                        <span className="text-white/95">{comp.level || 'Nasional'}</span>
                                                    </div>
                                                </div>

                                                {/* Organizer with MapPin */}
                                                <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-white/80 line-clamp-1 -mt-1">
                                                    <MapPin className="size-3.5 sm:size-4 text-white/70 shrink-0" />
                                                    <span className="truncate">{comp.organizer || 'Penyelenggara Terverifikasi'}</span>
                                                    {comp.format && (
                                                        <span className="text-white/50 text-[11px] shrink-0">• {comp.format}</span>
                                                    )}
                                                </div>

                                                {/* 3 Specs Row */}
                                                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2.5 border-t border-white/10 text-[11px] sm:text-xs text-white/85">
                                                    <div className="flex items-center gap-1.5 truncate" title={`Ukuran Tim: ${teamLabel}`}>
                                                        <Users className="size-3.5 sm:size-4 text-white/60 shrink-0" />
                                                        <span className="truncate">{teamLabel}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 truncate" title={`Kategori: ${comp.category?.replace('_', ' ') || 'Umum'}`}>
                                                        <Trophy className="size-3.5 sm:size-4 text-white/60 shrink-0" />
                                                        <span className="truncate capitalize">{comp.category?.replace('_', ' ') || 'Umum'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 truncate" title={`Deadline: ${formattedDeadline}`}>
                                                        <Calendar className="size-3.5 sm:size-4 text-white/60 shrink-0" />
                                                        <span className="truncate">{isClosed ? 'Selesai' : formattedDeadline}</span>
                                                    </div>
                                                </div>

                                                {/* Crisp White Pill CTA Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.get(`/competitions/${comp.slug || comp.id}`);
                                                    }}
                                                    className="w-full py-2.5 sm:py-3 px-4 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer active:scale-[0.99] group/btn"
                                                >
                                                    <FileText className="size-4 text-slate-900 group-hover/btn:text-blue-600 transition-colors" />
                                                    <span>Detail Lomba</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination with preserveScroll */}
                        {competitions && competitions.last_page > 1 && (
                            <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
                                {Array.from({ length: competitions.last_page }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => {
                                            router.get(
                                                '/competitions',
                                                {
                                                    tab: 'explore',
                                                    page,
                                                    search: exploreSearch,
                                                    organizer: exploreOrganizer,
                                                    category: exploreCategory,
                                                    level: exploreLevel,
                                                    format: exploreFormat,
                                                    type: exploreType,
                                                    status: exploreStatus,
                                                    sort: exploreSort,
                                                },
                                                { preserveState: true, preserveScroll: true }
                                            );
                                        }}
                                        className={`size-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                                            competitions.current_page === page
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: CARI TIM & RADAR REKRUTMEN                        */}
                {/* ========================================================= */}
                {activeTab === 'teams' && (
                    <div className="space-y-6">
                        {/* Segmented Switcher: Cari Tim vs Radar Rekrutmen */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start border border-slate-200/80">
                                <button
                                    type="button"
                                    onClick={() => setTeamViewMode('teams')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        teamViewMode === 'teams'
                                            ? 'bg-white text-slate-900 shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Users className="size-3.5 text-blue-600" />
                                    <span>Tim Membuka Rekrutmen</span>
                                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-700 font-bold">
                                        {openRecruitingTeams.length}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTeamViewMode('radar')}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                        teamViewMode === 'radar'
                                            ? 'bg-white text-slate-900 shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    <Sparkles className="size-3.5 text-amber-500" />
                                    <span>Radar Rekrutmen Talenta</span>
                                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 text-amber-700 font-bold">
                                        {radarCandidates.length}
                                    </span>
                                </button>
                            </div>

                            {teamViewMode === 'teams' && totalNeededSlots > 0 && (
                                <span className="text-xs text-slate-500 font-medium">
                                    Tersedia <strong className="text-slate-800">{totalNeededSlots} posisi</strong> untuk mahasiswa
                                </span>
                            )}
                            {teamViewMode === 'radar' && (
                                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                    <Sparkles className="size-3 text-amber-500" />
                                    <span>Rekomendasi Persona <strong>Hacker, Hipster, Hustler</strong></span>
                                </span>
                            )}
                        </div>

                        {teamViewMode === 'teams' && (
                            <>
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
                                        router.get('/competitions', { tab: 'teams', team_search: teamSearch, team_category: e.target.value, team_role: teamRole }, { preserveState: true, preserveScroll: true });
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
                                        router.get('/competitions', { tab: 'teams', team_search: teamSearch, team_category: teamCategory, team_role: e.target.value }, { preserveState: true, preserveScroll: true });
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
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCreateTeamPreselectedCompId(null);
                                        setCreateTeamModalOpen(true);
                                    }}
                                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Bentuk Tim Baru</span>
                                </button>
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
                                        ? new Date(comp.registration_deadline).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                          })
                                        : 'Open';

                                    // Build member list for stacked avatars
                                    const memberAvatars: Array<{ name: string; avatar: string | null; role: string }> = [];
                                    if (team?.leader) {
                                        memberAvatars.push({
                                            name: team.leader.name,
                                            avatar: team.leader.avatar || null,
                                            role: 'Ketua Tim',
                                        });
                                    }
                                    if (Array.isArray(team?.members)) {
                                        team.members.forEach((m: any) => {
                                            if (m.user_id !== team?.leader?.id && m.name) {
                                                memberAvatars.push({
                                                    name: m.name,
                                                    avatar: m.avatar,
                                                    role: m.role_name || 'Anggota',
                                                });
                                            }
                                        });
                                    }
                                    if (memberAvatars.length === 0) {
                                        memberAvatars.push({
                                            name: team?.name || 'Tim',
                                            avatar: null,
                                            role: 'Tim',
                                        });
                                    }

                                    const descText =
                                        team?.recruitment?.description ||
                                        team?.description ||
                                        `Mencari rekan tim untuk ${comp.name}. Terbuka peran: ${
                                            roles.map((r: any) => r.name).join(', ') || 'Anggota Tim'
                                        }.`;

                                    const avatarPalette = [
                                        'bg-blue-100 text-blue-700',
                                        'bg-emerald-100 text-emerald-700',
                                        'bg-amber-100 text-amber-700',
                                        'bg-purple-100 text-purple-700',
                                        'bg-rose-100 text-rose-700',
                                    ];

                                    return (
                                        <div
                                            key={part.id}
                                            onClick={() => setDetailTeam(part)}
                                            className="group bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-slate-300 rounded-[28px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
                                        >
                                            <div className="space-y-3.5">
                                                {/* Top Row: Folder Status Pill & Deadline */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60">
                                                        <Folder className="size-3 text-blue-600" />
                                                        <span>Rekrutmen Tim</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                                                        {formattedDeadline}
                                                    </span>
                                                </div>

                                                {/* Team Name & Competition Badge */}
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                                                        {team.name}
                                                    </h3>
                                                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                                                        <div
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold max-w-full truncate"
                                                            title={`Target Kompetisi: ${comp.name}`}
                                                        >
                                                            <Trophy className="size-3 text-amber-500 shrink-0" />
                                                            <span className="truncate">{comp.name}</span>
                                                        </div>
                                                        {comp.category && (
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-200/60">
                                                                {comp.category.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Roles Needed */}
                                                {roles.length > 0 && (
                                                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-slate-500 font-medium flex items-center gap-1">
                                                                <Briefcase className="size-3 text-slate-400" />
                                                                <span>Dibutuhkan:</span>
                                                            </span>
                                                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                                                                {roles.length} Posisi Terbuka
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {roles.map((r: any) => (
                                                                <span
                                                                    key={r.id}
                                                                    className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/60 text-slate-700 text-[11px] font-medium transition-colors flex items-center gap-1.5"
                                                                    title={r.requirements ? `Syarat: ${r.requirements}` : r.name}
                                                                >
                                                                    <span className="size-1.5 rounded-full bg-blue-500 shrink-0" />
                                                                    <span>{r.name}</span>
                                                                    {r.slots > 1 && (
                                                                        <span className="text-[10px] text-slate-400 font-normal">({r.slots} posisi)</span>
                                                                    )}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Description */}
                                                {descText && (
                                                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                                        {descText}
                                                    </p>
                                                )}

                                                {/* Capacity Slot Badges */}
                                                <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                                            <Users className="size-3.5 text-slate-400" />
                                                            <span>Formasi Tim ({membersCount}/{maxCap})</span>
                                                        </span>
                                                        {emptySlots > 0 ? (
                                                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
                                                                Sisa {emptySlots} Posisi
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                                                                Formasi Lengkap
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-1.5">
                                                        {Array.from({ length: maxCap }).map((_, idx) => {
                                                            const isFilled = idx < membersCount;
                                                            const member = memberAvatars[idx];
                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    title={
                                                                        isFilled
                                                                            ? member
                                                                                ? `${member.name} (${member.role})`
                                                                                : `Personel #${idx + 1} (Terisi)`
                                                                            : `Posisi Personel #${idx + 1} (Terbuka)`
                                                                    }
                                                                    className={`size-7 rounded-lg flex items-center justify-center transition-all ${
                                                                        isFilled
                                                                            ? 'bg-blue-600 text-white shadow-2xs'
                                                                            : 'border border-dashed border-slate-300 bg-slate-50 text-slate-300'
                                                                    }`}
                                                                >
                                                                    <User className="size-3.5 stroke-[2.2]" />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Team Member Avatars Stack */}
                                                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                                    <div className="flex items-center -space-x-2 overflow-hidden">
                                                        {memberAvatars.slice(0, 4).map((m, idx) => {
                                                            const initials = m.name
                                                                ? m.name.split(/\s+/).map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
                                                                : 'U';
                                                            const colorClass = avatarPalette[idx % avatarPalette.length];

                                                            return m.avatar ? (
                                                                <img
                                                                    key={idx}
                                                                    src={m.avatar}
                                                                    alt={m.name}
                                                                    title={`${m.name} (${m.role})`}
                                                                    className="size-7 rounded-full object-cover ring-2 ring-white shadow-2xs"
                                                                />
                                                            ) : (
                                                                <div
                                                                    key={idx}
                                                                    title={`${m.name} (${m.role})`}
                                                                    className={`size-7 rounded-full ${colorClass} font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-2xs`}
                                                                >
                                                                    {initials}
                                                                </div>
                                                            );
                                                        })}
                                                        {emptySlots > 0 && (
                                                            <div
                                                                className="size-7 rounded-full bg-slate-100 border border-dashed border-slate-300 text-slate-400 font-medium text-[9px] flex items-center justify-center ring-2 ring-white"
                                                                title={`${emptySlots} posisi terbuka`}
                                                            >
                                                                +{emptySlots}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/60 select-none">
                                                        Merekrut
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Bottom Action Button */}
                                            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                                <span className="text-xs text-slate-500 font-medium">
                                                    {roles.length} Posisi · {membersCount}/{maxCap} Person
                                                </span>

                                                {part.is_member || part.is_leader ? (
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold shadow-2xs">
                                                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                        <span>Tergabung</span>
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openApplyModal(part);
                                                        }}
                                                        className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition active:scale-[0.98] shadow-xs flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                        <Plus className="size-3.5 stroke-[2.5]" />
                                                        <span>Gabung Tim</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        </>
                    )}

                    {/* SUB-VIEW 2: RADAR REKRUTMEN TALENTA KANDIDAT */}
                    {teamViewMode === 'radar' && (
                        <div className="space-y-5">
                            {/* Banner Callout with Mascot Heart (Apple iOS HIG Card) */}
                            <div className="rounded-[28px] bg-white p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1 max-w-xl">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60 mb-1">
                                        <Users className="size-3.5 text-blue-600" />
                                        <span>Radar Talenta & Rekrutmen</span>
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                                        Cari Rekan & Bentuk Tim Kolaborasi
                                    </h3>
                                    <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed">
                                        Temukan rekan mahasiswa kampus dengan profil komplementer (Developer, UI/UX Designer, Hustler) untuk diajak berkolaborasi atau diundang ke tim kompetisi Anda.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <img
                                        src="/images/mascot/mascot-heart.png"
                                        alt="Mascot RAKIT"
                                        className="w-14 sm:w-16 h-auto object-contain drop-shadow-sm select-none pointer-events-none hidden sm:block"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCreateTeamPreselectedCompId(null);
                                            setCreateTeamModalOpen(true);
                                        }}
                                        className="px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition active:scale-[0.98] shadow-xs cursor-pointer flex items-center gap-1.5"
                                    >
                                        <Plus className="size-3.5 stroke-[2.5]" />
                                        <span>Bentuk Tim Baru</span>
                                    </button>
                                </div>
                            </div>

                            {/* Radar Filter Toolbar */}
                            <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-2.5">
                                <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl w-full border border-slate-100">
                                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama kandidat, prodi, kampus, atau keahlian (React, Figma, Pitching)..."
                                        value={radarSearch}
                                        onChange={(e) => setRadarSearch(e.target.value)}
                                        className="bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none w-full font-medium"
                                    />
                                    {radarSearch && (
                                        <button
                                            type="button"
                                            onClick={() => setRadarSearch('')}
                                            className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Persona Segmented Filter */}
                                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto shrink-0 overflow-x-auto">
                                    {(['all', 'Hacker', 'Hipster', 'Hustler'] as const).map((persona) => {
                                        const label =
                                            persona === 'all'
                                                ? 'Semua Talenta'
                                                : persona === 'Hacker'
                                                ? 'Hacker (Dev)'
                                                : persona === 'Hipster'
                                                ? 'Hipster (UI/UX)'
                                                : 'Hustler (Lead)';
                                        const isActive = radarPersonaFilter === persona;
                                        return (
                                            <button
                                                key={persona}
                                                type="button"
                                                onClick={() => setRadarPersonaFilter(persona)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                                                    isActive
                                                        ? 'bg-white text-slate-900 shadow-2xs'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Candidates Grid */}
                            {filteredRadarCandidates.length === 0 ? (
                                <div className="bg-white rounded-2xl p-10 sm:p-12 text-center border border-slate-200/80 shadow-xs">
                                    <img
                                        src="/images/mascot/mascot-thinking.png"
                                        alt="Mascot Thinking"
                                        className="w-20 h-20 object-contain mx-auto mb-3 select-none pointer-events-none drop-shadow-sm"
                                    />
                                    <h4 className="text-sm font-bold text-slate-900">
                                        Tidak Ada Kandidat yang Cocok
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Coba sesuaikan kata kunci pencarian atau filter persona talenta.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                                    {paginatedRadarCandidates.map((cand: any, idx: number) => {
                                        const student = cand.user || cand;
                                        const persona = cand.persona || 'Hacker';
                                        const skills: string[] = cand.matched_skills || cand.skills || [];
                                        const score = cand.final_score || 85;
                                        const isInvited =
                                            (sentInvitationUserIds || []).includes(student.id) ||
                                            localInvitedIds.includes(student.id);

                                        const personaStyle =
                                            persona === 'Hipster'
                                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                                : persona === 'Hustler'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                : 'bg-blue-50 text-blue-700 border-blue-200';

                                        return (
                                            <div
                                                key={student.id || idx}
                                                className="bg-white rounded-[28px] border border-slate-200/80 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all duration-200 p-5 flex flex-col justify-between group"
                                            >
                                                <div className="space-y-3.5">
                                                    {/* Top Header: Avatar + Identity + Status Badge */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="size-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 border-2 border-white shadow-xs overflow-hidden">
                                                                {student.avatar ? (
                                                                    <img src={student.avatar} alt={student.name} className="size-full object-cover" />
                                                                ) : (
                                                                    <span>{(student.name || 'M').charAt(0).toUpperCase()}</span>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate group-hover:text-blue-600 transition-colors">
                                                                    {student.name}
                                                                </h3>
                                                                <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                                                    {student.study_program || 'Mahasiswa'}{student.semester ? ` · Sem ${student.semester}` : ''}
                                                                </p>
                                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                                                    {student.campus_name || student.campus?.name || 'Perguruan Tinggi'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {isInvited ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shrink-0">
                                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                                <span>Terkirim</span>
                                                            </span>
                                                        ) : (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border tracking-wide uppercase shrink-0 ${personaStyle}`}>
                                                                <span className="size-1.5 rounded-full bg-current" />
                                                                <span>{persona}</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Skills Pills */}
                                                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                                        {skills.slice(0, 3).map((skill: any, sIdx: number) => {
                                                            const sName = typeof skill === 'string' ? skill : skill.name;
                                                            return (
                                                                <span
                                                                    key={sIdx}
                                                                    className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/60 text-slate-700 text-[11px] font-medium truncate max-w-[140px]"
                                                                >
                                                                    {sName}
                                                                </span>
                                                            );
                                                        })}
                                                        {skills.length > 3 && (
                                                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                                                                +{skills.length - 3}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* 3-Column Metrics Stats Row */}
                                                    <div className="py-2.5 px-3 rounded-2xl bg-slate-50/70 border border-slate-100 grid grid-cols-3 divide-x divide-slate-200/60 text-center">
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-900 flex items-center justify-center gap-1">
                                                                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                                                                <span>{(score / 20).toFixed(1)}</span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Rating</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-900">
                                                                {score}%
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Kesiapan</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-900">
                                                                {student.semester ? `Sem ${student.semester}` : 'Aktif'}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Status</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Bottom CTA Button */}
                                                <div className="pt-4 mt-3 border-t border-slate-100">
                                                    {isInvited ? (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            className="w-full py-2.5 rounded-full bg-slate-100 text-slate-500 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed select-none border border-slate-200/70"
                                                        >
                                                            <Check className="size-3.5 text-emerald-600 stroke-[2.5]" />
                                                            <span className="text-slate-600 font-semibold">Undangan Terkirim</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => openRadarInvite(cand)}
                                                            className="w-full py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center transition-all shadow-xs hover:shadow active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer group"
                                                        >
                                                            <UserPlus className="size-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                                                            <span>{myLedTeams.length > 0 ? 'Undang ke Tim' : 'Ajak Kolaborasi'}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Radar Candidates Pagination */}
                            {totalRadarPages > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-3 border-t border-slate-200/80">
                                    <p className="text-xs text-slate-500 font-medium">
                                        Menampilkan <strong className="text-slate-800">{(radarPage - 1) * RADAR_PER_PAGE + 1}</strong> - <strong className="text-slate-800">{Math.min(radarPage * RADAR_PER_PAGE, filteredRadarCandidates.length)}</strong> dari <strong className="text-slate-800">{filteredRadarCandidates.length}</strong> kandidat
                                    </p>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            disabled={radarPage === 1}
                                            onClick={() => setRadarPage(p => Math.max(1, p - 1))}
                                            className="px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                                        >
                                            <ChevronLeft className="size-3.5" />
                                            <span>Sebelumnya</span>
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalRadarPages }).map((_, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => setRadarPage(i + 1)}
                                                    className={`size-8 rounded-xl flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                                                        radarPage === i + 1
                                                            ? 'bg-slate-900 text-white shadow-xs'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            disabled={radarPage === totalRadarPages}
                                            onClick={() => setRadarPage(p => Math.min(totalRadarPages, p + 1))}
                                            className="px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                                        >
                                            <span>Berikutnya</span>
                                            <ChevronRight className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: KATEGORI                                          */}
                {/* ========================================================= */}
                {activeTab === 'categories' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('explore')}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition mb-1 cursor-pointer"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Kembali ke Eksplor Lomba
                                </button>
                                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                                    Kategori Kompetisi
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pilih bidang peminatan untuk menemukan perlombaan yang relevan dengan keahlianmu.
                                </p>
                            </div>
                            <span className="self-start sm:self-auto text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                {coreCategoryList.length} Bidang
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                            {coreCategoryList.map((cat) => {
                                const IconComponent = cat.icon;
                                const count = categoryCounts[cat.key] || 0;
                                const colorConfig: Record<string, { bg: string; text: string; border: string }> = {
                                    technology: { bg: 'bg-blue-50/80', text: 'text-blue-600', border: 'border-blue-100' },
                                    business_plan: { bg: 'bg-emerald-50/80', text: 'text-emerald-600', border: 'border-emerald-100' },
                                    research: { bg: 'bg-purple-50/80', text: 'text-purple-600', border: 'border-purple-100' },
                                    innovation: { bg: 'bg-amber-50/80', text: 'text-amber-600', border: 'border-amber-100' },
                                    ui_ux: { bg: 'bg-rose-50/80', text: 'text-rose-600', border: 'border-rose-100' },
                                    programming: { bg: 'bg-indigo-50/80', text: 'text-indigo-600', border: 'border-indigo-100' },
                                    hackathon: { bg: 'bg-orange-50/80', text: 'text-orange-600', border: 'border-orange-100' },
                                    entrepreneurship: { bg: 'bg-teal-50/80', text: 'text-teal-600', border: 'border-teal-100' },
                                    scientific_writing: { bg: 'bg-violet-50/80', text: 'text-violet-600', border: 'border-violet-100' },
                                    other: { bg: 'bg-green-50/80', text: 'text-green-600', border: 'border-green-100' },
                                };
                                const cStyle = colorConfig[cat.key] || colorConfig.technology;

                                return (
                                    <div
                                        key={cat.key}
                                        onClick={() => {
                                            setExploreCategory(cat.key);
                                            setActiveTab('explore');
                                            router.get('/competitions', { tab: 'explore', category: cat.key });
                                        }}
                                        className="group relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-3.5">
                                                <div className={`w-10 h-10 rounded-xl ${cStyle.bg} ${cStyle.text} ${cStyle.border} border flex items-center justify-center transition-all duration-200 group-hover:scale-105`}>
                                                    <IconComponent className="w-5 h-5 stroke-[1.8]" />
                                                </div>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/60 text-slate-600 text-xs font-semibold group-hover:bg-blue-50 group-hover:text-blue-700 group-hover:border-blue-100 transition-colors">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${count > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                    {count} lomba
                                                </span>
                                            </div>

                                            <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                                                {cat.name}
                                            </h3>

                                            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-2">
                                                {cat.desc}
                                            </p>
                                        </div>

                                        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                                            <span>Jelajahi kompetisi</span>
                                            <ArrowUpRight className="w-4 h-4 stroke-[2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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

                        {/* CASE 1: APPLICATIONS (Team Recruitment User Requests) */}
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

                                    const totalMyCompPages = Math.ceil(filteredParticipations.length / MY_COMP_PER_PAGE);
                                    const paginatedParticipations = filteredParticipations.slice(
                                        (myCompPage - 1) * MY_COMP_PER_PAGE,
                                        myCompPage * MY_COMP_PER_PAGE
                                    );

                                    return (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {paginatedParticipations.map((part) => {
                                                const comp = part.competition;
                                                const team = part.team;
                                                const status = part.lifecycle_status;

                                                const tasksCount = part.tasks_count ?? (team as any)?.tasks_count ?? 0;
                                                const completedTasksCount = part.completed_tasks_count ?? (team as any)?.completed_tasks_count ?? 0;
                                                const progressPercent =
                                                    part.progress_percent ??
                                                    (team as any)?.progress_percent ??
                                                    (tasksCount > 0
                                                        ? Math.round((completedTasksCount / tasksCount) * 100)
                                                        : (status === 'completed' ? 100 : (status === 'in_progress' ? 50 : (status === 'registered' ? 25 : 0))));

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

                                                const statusLabel =
                                                    status === 'planning'
                                                        ? 'Rencana'
                                                        : status === 'registered'
                                                        ? 'Terdaftar Resmi'
                                                        : status === 'in_progress'
                                                        ? 'Sedang Berjalan'
                                                        : status === 'completed'
                                                        ? 'Selesai'
                                                        : 'Dibatalkan';

                                                const workspaceUrl = `/competition-workspace/${comp?.slug || part.id}`;

                                                return (
                                                    <div key={part.id} className="group relative flex flex-col transition-all duration-300 hover:-translate-y-1.5">
                                                        {/* 3D Folder Card Container */}
                                                        <Link
                                                            href={workspaceUrl}
                                                            className="block cursor-pointer focus:outline-none"
                                                        >
                                                            <div className="relative pt-6">
                                                                {/* Top Back Folder Tab */}
                                                                <div className="absolute top-0 left-0 h-8 w-32 sm:w-36 rounded-t-2xl bg-gradient-to-b from-slate-200 to-slate-300/80 border-t border-x border-slate-300/70 shadow-xs flex items-center px-3.5">
                                                                    <span className="text-[10px] font-mono font-bold text-slate-600 truncate">
                                                                        ~/workspace/{part.team?.id || part.id}
                                                                    </span>
                                                                </div>

                                                                {/* Peeking White Paper Sheet(s) inside the folder pocket */}
                                                                <div className="absolute top-2.5 left-4 right-4 h-14 rounded-t-xl bg-white border-t border-x border-slate-200/90 shadow-2xs px-3.5 py-1.5 transition-transform duration-300 group-hover:-translate-y-2 pointer-events-none z-0">
                                                                    <div className="space-y-1 opacity-60">
                                                                        <div className="h-1.5 w-24 bg-slate-200 rounded-full" />
                                                                        <div className="h-1.5 w-40 bg-slate-100 rounded-full" />
                                                                    </div>
                                                                </div>

                                                                {/* Front Folder Pocket Body */}
                                                                <div className="relative z-10 rounded-[24px] bg-white border border-slate-200/90 shadow-[0_8px_24px_rgba(0,0,0,0.04)] group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.08)] transition-all duration-300 p-5 sm:p-6 overflow-hidden flex flex-col justify-between min-h-[210px]">
                                                                    {/* Subtle top edge curve */}
                                                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none" />

                                                                    <div>
                                                                        {/* Top Row: Role & Status Pills */}
                                                                        <div className="flex items-center justify-between gap-2 mb-3">
                                                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                                                                                {statusLabel}
                                                                            </span>
                                                                            <div className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 border border-slate-200/60">
                                                                                <Award className="size-3 text-slate-500" />
                                                                                <span>{team?.is_leader ? 'Leader' : 'Anggota'}</span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Team Name & Competition */}
                                                                        <div className="space-y-1 mb-4">
                                                                            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug line-clamp-1 group-hover:text-blue-600 transition">
                                                                                {team?.name || 'Mandiri'}
                                                                            </h3>
                                                                            <p className="text-xs sm:text-sm font-medium text-slate-500 leading-normal line-clamp-1">
                                                                                {comp?.name || 'Kompetisi'}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {/* Progress & Bottom Metadata */}
                                                                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                                                                        {/* Progress Row */}
                                                                        <div>
                                                                            <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1">
                                                                                <span className="text-slate-400 font-medium">Progres</span>
                                                                                <span className="text-slate-800 font-bold">{progressPercent}%</span>
                                                                            </div>
                                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                                <div
                                                                                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                                                    style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Meta Stats Row */}
                                                                        <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500 pt-0.5">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <Users className="size-3.5 text-slate-400 shrink-0" />
                                                                                <span>{team?.members_count || 1} Anggota</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5">
                                                                                <CheckCircle2 className="size-3.5 text-slate-400 shrink-0" />
                                                                                <span>{completedTasksCount}/{tasksCount} Selesai</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>

                                                        {/* Bottom Meta & Quick Action Toolbar */}
                                                        <div className="mt-3 flex items-center justify-between gap-2 px-1 text-xs">
                                                            <div className="flex items-center gap-1.5">
                                                                {part.stage_label && (
                                                                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-[140px]">
                                                                        {part.stage_label}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center gap-1.5">
                                                                {part.can_manage && status !== 'completed' && status !== 'withdrawn' && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedStagePart(part);
                                                                            setStageModalOpen(true);
                                                                        }}
                                                                        className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition cursor-pointer"
                                                                    >
                                                                        Update Tahap
                                                                    </button>
                                                                )}
                                                                <Link
                                                                    href={`/competitions/${comp?.slug || comp?.id}`}
                                                                    className="p-1 text-slate-400 hover:text-slate-700 transition"
                                                                    title="Detail Lomba"
                                                                >
                                                                    <ExternalLink className="size-3.5" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            </div>

                                            {/* Folder Cards Pagination */}
                                            {totalMyCompPages > 1 && (
                                                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-200/80">
                                                    <p className="text-xs text-slate-500 font-medium">
                                                        Menampilkan <strong className="text-slate-800">{(myCompPage - 1) * MY_COMP_PER_PAGE + 1}</strong> - <strong className="text-slate-800">{Math.min(myCompPage * MY_COMP_PER_PAGE, filteredParticipations.length)}</strong> dari <strong className="text-slate-800">{filteredParticipations.length}</strong> tim
                                                    </p>

                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            disabled={myCompPage === 1}
                                                            onClick={() => setMyCompPage(p => Math.max(1, p - 1))}
                                                            className="px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <ChevronLeft className="size-3.5" />
                                                            <span>Sebelumnya</span>
                                                        </button>

                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: totalMyCompPages }).map((_, i) => (
                                                                <button
                                                                    key={i}
                                                                    type="button"
                                                                    onClick={() => setMyCompPage(i + 1)}
                                                                    className={`size-8 rounded-xl flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                                                                        myCompPage === i + 1
                                                                            ? 'bg-slate-900 text-white shadow-xs'
                                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                                    }`}
                                                                >
                                                                    {i + 1}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <button
                                                            type="button"
                                                            disabled={myCompPage === totalMyCompPages}
                                                            onClick={() => setMyCompPage(p => Math.min(totalMyCompPages, p + 1))}
                                                            className="px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <span>Berikutnya</span>
                                                            <ChevronRight className="size-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
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

            {/* TEAM RECRUITMENT DETAIL MODAL */}
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
                                            kuota terbuka
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

                                {/* CTA: Ajukan Diri or Already Member Status */}
                                <div className="pt-1">
                                    {detailTeam.is_member || detailTeam.is_leader ? (
                                        <div className="space-y-2">
                                            <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 text-center flex items-center justify-center gap-1.5">
                                                <CheckCircle2 className="size-4 text-emerald-600" />
                                                <span>Anda Sudah Bergabung dalam Tim Ini</span>
                                            </div>
                                            <Link
                                                href={`/workspace/${detailTeam.team.id}`}
                                                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center block transition shadow-2xs"
                                            >
                                                Buka Workspace Tim
                                            </Link>
                                        </div>
                                    ) : (
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
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* RADAR REKRUTMEN INVITATION MODAL */}
            {radarInviteModalOpen && selectedRadarCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
                    <div className="w-full max-w-md p-5 sm:p-6 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Send className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Undang Rekan ke Tim Lomba</h3>
                                    <p className="text-[11px] text-slate-400">Perekrutan resmi tim kompetisi</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setRadarInviteModalOpen(false);
                                    setSelectedRadarCandidate(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSendRadarInvite} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Calon Anggota Terpilih</label>
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                        {(selectedRadarCandidate.user?.name || selectedRadarCandidate.name || 'M').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900 truncate">
                                            {selectedRadarCandidate.user?.name || selectedRadarCandidate.name}
                                        </p>
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {selectedRadarCandidate.user?.study_program || 'Mahasiswa'}
                                            {selectedRadarCandidate.user?.semester ? ` • Sem ${selectedRadarCandidate.user?.semester}` : ''}
                                            {selectedRadarCandidate.user?.campus_name ? ` • ${selectedRadarCandidate.user?.campus_name}` : ''}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                        {selectedRadarCandidate.persona || 'Hacker'}
                                    </span>
                                </div>
                            </div>

                            {myLedTeams.length > 1 && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Tim Kompetisi Sasaran</label>
                                    <select
                                        value={inviteParticipationId}
                                        onChange={(e) => setInviteParticipationId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 cursor-pointer"
                                    >
                                        {myLedTeams.map((team: any) => (
                                            <option key={team.id} value={team.id}>
                                                {team.team_name || team.name} ({team.competition_name || 'Kompetisi'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Peran / Posisi yang Ditawarkan <span className="text-blue-600">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={inviteRoleName}
                                    onChange={(e) => setInviteRoleName(e.target.value)}
                                    placeholder="Contoh: UI/UX Designer, Frontend Developer, Hustler / Pitcher"
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                                />
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {['Frontend Developer', 'UI/UX Designer', 'Backend Engineer', 'Pitcher / Hustler', 'Data & AI'].map((qr) => (
                                        <button
                                            key={qr}
                                            type="button"
                                            onClick={() => setInviteRoleName(qr)}
                                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                                                inviteRoleName === qr
                                                    ? 'bg-blue-600 text-white shadow-2xs'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                                            }`}
                                        >
                                            {qr}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Pesan Undangan (Opsional)
                                </label>
                                <textarea
                                    rows={3}
                                    value={inviteMessage}
                                    onChange={(e) => setInviteMessage(e.target.value)}
                                    placeholder="Tuliskan alasan mengajak bergabung atau fokus peran yang disiapkan..."
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                                />
                            </div>

                            <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-2">
                                <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                                <span>
                                    Mahasiswa akan menerima notifikasi undangan di aplikasi dan email mereka. Keanggotaan resmi berlaku setelah mahasiswa menyetujui undangan ini.
                                </span>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setRadarInviteModalOpen(false);
                                        setSelectedRadarCandidate(null);
                                    }}
                                    className="px-4 py-2 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isInviting}
                                    className="px-5 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition active:scale-[0.98] shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {isInviting ? (
                                        <>
                                            <Loader2 className="size-3.5 animate-spin" />
                                            <span>Mengirim...</span>
                                        </>
                                    ) : (
                                        <span>Kirim Undangan Rekrutmen</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE COMPETITION TEAM MODAL */}
            <CreateCompetitionTeamModal
                isOpen={createTeamModalOpen}
                onClose={() => setCreateTeamModalOpen(false)}
                competitions={openCompetitionOptions || competitions.data}
                preselectedCompId={createTeamPreselectedCompId}
            />

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

            {/* FLOATING INVITATION SUCCESS TOAST */}
            {inviteSuccessToast?.show && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-2xl border border-slate-800 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span>Undangan rekrutmen berhasil dikirim ke {inviteSuccessToast.name}!</span>
                </div>
            )}
        </AppLayout>
    );
}
