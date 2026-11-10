import ApplyCompetitionTeamModal, {
    type ApplyTeamData,
} from '@/components/competitions/ApplyCompetitionTeamModal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    Briefcase,
    Calendar,
    CheckCircle2,
    Clock,
    Globe,
    MessageSquare,
    Plus,
    Search,
    ShieldCheck,
    Sparkles,
    Trophy,
    User,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface Competition {
    id: number;
    name: string;
    slug: string;
    organizer: string;
    description: string;
    category: string;
    level?: string;
    competition_type?: string;
    scope: string;
    registration_deadline: string | null;
    min_team_size: number;
    max_team_size: number;
    status: string;
    verification_status: string;
    prize_info?: string;
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

interface Props {
    competitions: {
        data: Competition[];
        current_page: number;
        last_page: number;
        total: number;
    };
    openRecruitingTeams?: RecruitingTeam[];
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
    };
    stats?: {
        total: number;
        open_registration: number;
        national_international: number;
        open_teams_count: number;
        my_participations: number;
    };
    activeParticipation?: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Beranda', href: '/' },
    { title: 'Lomba & Kompetisi', href: '/competitions' },
];

export default function CompetitionIndex({
    competitions,
    openRecruitingTeams = [],
    currentUserInfo,
    categories,
    statuses,
    levels = ['local', 'regional', 'national', 'international'],
    filters,
    stats,
    activeParticipation,
}: Props) {
    const [activeTab, setActiveTab] = useState<'teams' | 'competitions'>(
        (filters.tab as 'teams' | 'competitions') || 'teams'
    );

    // MinSatu Team Explorer Filter States
    const [teamSearch, setTeamSearch] = useState(filters.team_search || '');
    const [teamCategory, setTeamCategory] = useState(filters.team_category || '');
    const [teamRole, setTeamRole] = useState(filters.team_role || '');

    // Competitions Catalog Filter States
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [status, setStatus] = useState(filters.status || '');
    const [level, setLevel] = useState(filters.level || '');

    // MinSatu Apply Modal State
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [selectedTeamData, setSelectedTeamData] = useState<ApplyTeamData | null>(null);

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

    const handleCatalogSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/competitions',
            { tab: 'competitions', search, category, status, level },
            { preserveState: true }
        );
    };

    const handleCatalogFilterChange = (cat: string, stat: string, lvl: string) => {
        setCategory(cat);
        setStatus(stat);
        setLevel(lvl);
        router.get(
            '/competitions',
            { tab: 'competitions', search, category: cat, status: stat, level: lvl },
            { preserveState: true }
        );
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

    const commonRoleFilters = [
        { label: 'Semua Peran', value: '' },
        { label: 'UI/UX Designer', value: 'UI/UX' },
        { label: 'Frontend / Web', value: 'Frontend' },
        { label: 'Backend / AI', value: 'Backend' },
        { label: 'Hustler / Bisnis', value: 'Hustler' },
        { label: 'Karya Tulis / Riset', value: 'Peneliti' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Competition Hub — Cari Rekan Tim & Katalog Kompetisi" />

            <div className="min-h-screen bg-[#F8FAFC] relative text-slate-900 pb-24 overflow-hidden">
                <div className="pointer-events-none absolute -top-24 -left-20 h-[480px] w-[480px] rounded-full bg-blue-100/50 blur-[110px]" />
                <div className="pointer-events-none absolute top-48 -right-20 h-[380px] w-[380px] rounded-full bg-slate-200/50 blur-[100px]" />
                <div className="pointer-events-none absolute top-2/3 left-8 h-[360px] w-[360px] rounded-full bg-amber-100/40 blur-[100px]" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-6">
                    {/* Header Banner */}
                    <div className="glass-surface rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-white/85 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm border border-white/80">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-800 text-xs font-bold tracking-wide mb-3 border border-blue-500/20 shadow-2xs">
                                <Sparkles className="size-3.5 text-blue-600" />
                                <span>MinSatu Flow • Team Matching & Competition Hub</span>
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                                Lomba, Hackathon & Temukan Rekan Tim
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                                Temukan tim kompetisi yang sedang mencari keahlian Anda, atau ajukan diri secara langsung! Hubungi ketua tim melalui WhatsApp, bentuk kontingen terbaik kampus, dan raih prestasi membanggakan.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href={route('competitions.create')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
                            >
                                <Plus className="size-4" />
                                <span>Daftarkan Kompetisi Baru</span>
                            </Link>
                        </div>
                    </div>

                    {/* Active Workspace Banner if User is Competing */}
                    {activeParticipation && (
                        <div className="glass-card rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                    <Trophy className="size-5" />
                                </div>
                                <div>
                                    <div className="text-xs font-bold text-blue-900">
                                        Tim Anda Sedang Berkompetisi di {activeParticipation.competition?.name}
                                    </div>
                                    <p className="text-[11px] text-blue-700/80 mt-0.5">
                                        Nama Tim: <strong>{activeParticipation.team?.name}</strong> • Tahap:{' '}
                                        <span className="capitalize">{activeParticipation.stage?.replace('_', ' ')}</span>
                                    </p>
                                </div>
                            </div>
                            <Link
                                href={route('competitions.workspace', activeParticipation.id)}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs shrink-0"
                            >
                                <span>Buka Workspace Tim</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                        </div>
                    )}

                    {/* Stats Overview */}
                    {stats && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div
                                onClick={() => setActiveTab('teams')}
                                className={`glass-card rounded-2xl p-5 bg-white/85 flex flex-col justify-between cursor-pointer transition ${
                                    activeTab === 'teams' ? 'ring-2 ring-blue-500 shadow-md' : 'hover:border-blue-200'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                                        Tim Merekrut (MinSatu)
                                    </span>
                                    <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Users className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
                                        {stats.open_teams_count || openRecruitingTeams.length}
                                    </div>
                                    <p className="text-[11px] text-blue-600/80 mt-0.5">Tim aktif membuka lowongan anggota</p>
                                </div>
                            </div>

                            <div
                                onClick={() => setActiveTab('competitions')}
                                className={`glass-card rounded-2xl p-5 bg-white/85 flex flex-col justify-between cursor-pointer transition ${
                                    activeTab === 'competitions' ? 'ring-2 ring-blue-500 shadow-md' : 'hover:border-blue-200'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                        Total Kompetisi
                                    </span>
                                    <div className="size-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                                        <Trophy className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                        {stats.total}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Tersedia di katalog</p>
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-5 bg-white/85 flex flex-col justify-between">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                                        Pendaftaran Buka
                                    </span>
                                    <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Calendar className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                                        {stats.open_registration}
                                    </div>
                                    <p className="text-[11px] text-emerald-600/80 mt-0.5">Siap menerima pendaftaran tim</p>
                                </div>
                            </div>

                            <div className="glass-card rounded-2xl p-5 bg-white/85 flex flex-col justify-between">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                                        Partisipasi Saya
                                    </span>
                                    <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                        <Award className="size-4" />
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight">
                                        {stats.my_participations}
                                    </div>
                                    <p className="text-[11px] text-amber-600/80 mt-0.5">Riwayat keikutsertaan tim</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Main MinSatu Dual-Tab Switcher */}
                    <div className="flex items-center gap-3 p-1.5 bg-slate-200/80 rounded-2xl w-fit">
                        <button
                            onClick={() => {
                                setActiveTab('teams');
                                router.get('/competitions', { tab: 'teams' }, { preserveState: true });
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                activeTab === 'teams'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <Users className="size-4 text-blue-600" />
                            <span>Eksplor Tim / Cari Rekan (MinSatu)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-extrabold">
                                {openRecruitingTeams.length}
                            </span>
                        </button>

                        <button
                            onClick={() => {
                                setActiveTab('competitions');
                                router.get('/competitions', { tab: 'competitions' }, { preserveState: true });
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                activeTab === 'competitions'
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <Trophy className="size-4 text-amber-600" />
                            <span>Katalog Semua Kompetisi</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-extrabold">
                                {competitions.total}
                            </span>
                        </button>
                    </div>

                    {/* TAB 1: MINSATU TEAM EXPLORER */}
                    {activeTab === 'teams' && (
                        <div className="space-y-6 animate-in fade-in">
                            {/* Filter Bar for Teams */}
                            <div className="glass-card rounded-2xl p-4 bg-white/85 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <form onSubmit={handleTeamFilterSubmit} className="relative w-full md:w-96">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari tim, ide proyek, atau nama lomba..."
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                                    />
                                </form>

                                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                    <select
                                        value={teamCategory}
                                        onChange={(e) => {
                                            setTeamCategory(e.target.value);
                                            router.get(
                                                '/competitions',
                                                { tab: 'teams', team_search: teamSearch, team_category: e.target.value, team_role: teamRole },
                                                { preserveState: true }
                                            );
                                        }}
                                        className="text-xs bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    >
                                        <option value="">Semua Kategori Lomba</option>
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c.replace('_', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>

                                    {(teamSearch || teamCategory || teamRole) && (
                                        <button
                                            onClick={() => {
                                                setTeamSearch('');
                                                setTeamCategory('');
                                                setTeamRole('');
                                                router.get('/competitions', { tab: 'teams' });
                                            }}
                                            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                                        >
                                            Reset Filter
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Quick Role Badges Pills */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                                    Cari Peran:
                                </span>
                                {commonRoleFilters.map((rf) => (
                                    <button
                                        key={rf.value}
                                        onClick={() => {
                                            setTeamRole(rf.value);
                                            router.get(
                                                '/competitions',
                                                { tab: 'teams', team_search: teamSearch, team_category: teamCategory, team_role: rf.value },
                                                { preserveState: true }
                                            );
                                        }}
                                        className={`px-3 py-1.5 rounded-full font-bold transition whitespace-nowrap cursor-pointer ${
                                            teamRole === rf.value
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        {rf.label}
                                    </button>
                                ))}
                            </div>

                            {/* Open Recruiting Teams Grid */}
                            {openRecruitingTeams.length === 0 ? (
                                <div className="glass-card rounded-3xl p-14 text-center bg-white/85 border border-dashed border-slate-300">
                                    <div className="size-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                                        <Users className="size-8" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        Belum Ada Tim yang Sedang Merekrut
                                    </h3>
                                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                                        Jadilah pemimpin tim pertama! Pilih kompetisi dari tab "Katalog Semua Kompetisi", bentuk tim baru, dan buka rekrutmen anggota untuk mengajak rekan se-kampus.
                                    </p>
                                    <button
                                        onClick={() => setActiveTab('competitions')}
                                        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition cursor-pointer"
                                    >
                                        <span>Lihat Katalog Kompetisi</span>
                                        <ArrowRight className="size-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {openRecruitingTeams.map((part) => {
                                        const comp = part.competition;
                                        const team = part.team;
                                        const roles = team?.recruitment?.roles || [];
                                        const membersCount = team?.members_count || 1;
                                        const maxCap = comp.max_team_size || 5;
                                        const isFull = membersCount >= maxCap;

                                        return (
                                            <div
                                                key={part.id}
                                                className="glass-card rounded-3xl p-6 bg-white/85 hover:bg-white/95 border border-white/80 hover:border-blue-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group relative"
                                            >
                                                <div>
                                                    {/* Top Badges */}
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80">
                                                                {comp.category?.replace('_', ' ') || 'Kompetisi'}
                                                            </span>
                                                            {part.category_track && (
                                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
                                                                    Track: {part.category_track}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                                                            <CheckCircle2 className="size-3" />
                                                            <span>Open Recruitment</span>
                                                        </span>
                                                    </div>

                                                    {/* Target Competition Info */}
                                                    <div className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                                                        <Trophy className="size-3 text-amber-500 shrink-0" />
                                                        <Link
                                                            href={route('competitions.show', comp.id)}
                                                            className="hover:text-blue-600 transition truncate underline-offset-2 hover:underline"
                                                        >
                                                            {comp.name}
                                                        </Link>
                                                    </div>

                                                    {/* Team Name */}
                                                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                        {team?.name}
                                                    </h3>

                                                    {/* Team Description / Tagline */}
                                                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                                                        {team?.description || 'Tim kompetisi sedang mempersiapkan karya inovasi terbaik dan mencari rekan anggota.'}
                                                    </p>

                                                    {/* Team Leader Card */}
                                                    {team?.leader && (
                                                        <div className="mt-3.5 p-2.5 rounded-2xl bg-slate-50/90 border border-slate-100 flex items-center gap-2.5">
                                                            <div className="size-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                                                {team.leader.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-bold text-slate-900 truncate">
                                                                    {team.leader.name}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 truncate">
                                                                    Ketua Tim • {team.leader.study_program || 'Mahasiswa'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Required Roles Badges (MinSatu Style) */}
                                                    <div className="mt-4">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                                            Peran yang Dibutuhkan:
                                                        </span>
                                                        {roles.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {roles.map((r) => (
                                                                    <span
                                                                        key={r.id}
                                                                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/70"
                                                                    >
                                                                        <Briefcase className="size-3" />
                                                                        <span>{r.name}</span>
                                                                        <span className="text-[9px] px-1.5 py-0.2 bg-purple-200/60 text-purple-900 rounded-full font-black">
                                                                            {r.slots}
                                                                        </span>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                                                                <Briefcase className="size-3 text-slate-400" />
                                                                <span>Semua Peran Terbuka (Hacker/Hipster/Hustler)</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Capacity Progress Bar */}
                                                    <div className="mt-4 pt-3 border-t border-slate-100">
                                                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                                            <span className="text-slate-500">Kapasitas Formasi:</span>
                                                            <span className="text-slate-900">
                                                                {membersCount} / {maxCap} Mahasiswa
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-300 ${
                                                                    isFull ? 'bg-amber-500' : 'bg-blue-600'
                                                                }`}
                                                                style={{ width: `${Math.min(100, (membersCount / maxCap) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* MinSatu CTA Action */}
                                                <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                                        <Calendar className="size-3.5 text-slate-400" />
                                                        <span>
                                                            {comp.registration_deadline
                                                                ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                                                      day: 'numeric',
                                                                      month: 'short',
                                                                  })
                                                                : 'Terbuka'}
                                                        </span>
                                                    </div>

                                                    {part.is_leader ? (
                                                        <Link
                                                            href={route('competitions.workspace', part.id)}
                                                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                                                        >
                                                            <span>Buka Workspace</span>
                                                            <ArrowRight className="size-3" />
                                                        </Link>
                                                    ) : part.is_member ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                                            <CheckCircle2 className="size-3.5" />
                                                            <span>Anggota Tim</span>
                                                        </span>
                                                    ) : part.my_application ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                                                            <Clock className="size-3.5" />
                                                            <span>Lamaran Terkirim</span>
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => openApplyModal(part)}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm hover:shadow cursor-pointer"
                                                        >
                                                            <Sparkles className="size-3.5" />
                                                            <span>Ajukan Diri</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: COMPETITIONS CATALOG */}
                    {activeTab === 'competitions' && (
                        <div className="space-y-6 animate-in fade-in">
                            {/* Filter Bar */}
                            <div className="glass-card rounded-2xl p-4 bg-white/85 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <form onSubmit={handleCatalogSearch} className="relative w-full md:w-96">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari nama kompetisi, penyelenggara, topik..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                                    />
                                </form>

                                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                                    <select
                                        value={category}
                                        onChange={(e) => handleCatalogFilterChange(e.target.value, status, level)}
                                        className="text-xs bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    >
                                        <option value="">Semua Kategori</option>
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c.replace('_', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={level}
                                        onChange={(e) => handleCatalogFilterChange(category, status, e.target.value)}
                                        className="text-xs bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    >
                                        <option value="">Semua Tingkat</option>
                                        {levels.map((lvl) => (
                                            <option key={lvl} value={lvl}>
                                                {lvl.toUpperCase()}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        value={status}
                                        onChange={(e) => handleCatalogFilterChange(category, e.target.value, level)}
                                        className="text-xs bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    >
                                        <option value="">Semua Status</option>
                                        {statuses.map((s) => (
                                            <option key={s} value={s}>
                                                {s.replace('_', ' ').toUpperCase()}
                                            </option>
                                        ))}
                                    </select>

                                    {(category || status || level || search) && (
                                        <button
                                            onClick={() => {
                                                setSearch('');
                                                setCategory('');
                                                setStatus('');
                                                setLevel('');
                                                router.get('/competitions', { tab: 'competitions' });
                                            }}
                                            className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Competitions Grid */}
                            {competitions.data.length === 0 ? (
                                <div className="glass-card rounded-3xl p-14 text-center bg-white/85">
                                    <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
                                        <Trophy className="size-7" />
                                    </div>
                                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                                        Tidak Ada Kompetisi yang Ditemukan
                                    </h3>
                                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                                        Coba sesuaikan kata kunci atau bersihkan filter untuk menampilkan lebih banyak daftar kompetisi aktif.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {competitions.data.map((comp) => {
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
                                                className="glass-card rounded-3xl p-6 bg-white/85 hover:bg-white/95 border border-white/85 hover:border-blue-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-5 group"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between gap-2 mb-3">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80">
                                                                {comp.category?.replace('_', ' ') || 'Kompetisi'}
                                                            </span>
                                                            {comp.level && (
                                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                                                                    {comp.level}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {comp.verification_status === 'verified' && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                                                <ShieldCheck className="size-3" />
                                                                <span>Terverifikasi</span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">
                                                        <Link href={route('competitions.show', comp.id)}>
                                                            {comp.name}
                                                        </Link>
                                                    </h3>

                                                    <p className="text-xs font-semibold text-slate-500 mt-1">
                                                        {comp.organizer}
                                                    </p>

                                                    <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                                                        {comp.description || 'Kompetisi mahasiswa dengan peluang kolaborasi tim berimbang.'}
                                                    </p>

                                                    {comp.prize_info && (
                                                        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-semibold border border-amber-200/70">
                                                            <Trophy className="size-3 text-amber-600" />
                                                            <span className="truncate max-w-[260px]">{comp.prize_info}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-4 text-slate-500">
                                                        <span className="inline-flex items-center gap-1">
                                                            <Calendar className="size-3.5 text-slate-400" />
                                                            <span>{formattedDeadline}</span>
                                                        </span>
                                                        <span className="inline-flex items-center gap-1">
                                                            <Users className="size-3.5 text-slate-400" />
                                                            <span>
                                                                {comp.min_team_size} - {comp.max_team_size} mhs
                                                            </span>
                                                        </span>
                                                    </div>

                                                    <Link
                                                        href={route('competitions.show', comp.id)}
                                                        className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 transition"
                                                    >
                                                        <span>Detail</span>
                                                        <ArrowRight className="size-3.5" />
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            {competitions.last_page > 1 && (
                                <div className="flex items-center justify-center gap-2 pt-6">
                                    {Array.from({ length: competitions.last_page }).map((_, i) => (
                                        <Link
                                            key={i}
                                            href={`/competitions?tab=competitions&page=${i + 1}&category=${category}&status=${status}&level=${level}&search=${search}`}
                                            className={`size-8 rounded-xl text-xs font-bold flex items-center justify-center transition ${
                                                competitions.current_page === i + 1
                                                    ? 'bg-blue-600 text-white shadow-2xs'
                                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {i + 1}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

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
