import ApplyCompetitionTeamModal, {
    type ApplyTeamData,
} from '@/components/competitions/ApplyCompetitionTeamModal';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ArrowUpRight,
    Briefcase,
    Calendar,
    Clock,
    FolderKanban,
    MessageSquare,
    Plus,
    Search,
    User,
    Users,
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
        total_needed_slots?: number;
        my_participations: number;
    };
    activeParticipation?: any;
}

export default function CompetitionIndex({
    competitions,
    openRecruitingTeams = [],
    totalNeededSlots = 2,
    myApplications = [],
    myTeams = [],
    currentUserInfo,
    categories,
    filters,
}: Props) {
    const [activeTab, setActiveTab] = useState<'teams' | 'applications' | 'my_teams'>(
        (filters.tab as any) || 'teams'
    );

    // Filter States
    const [teamSearch, setTeamSearch] = useState(filters.team_search || '');
    const [teamCategory, setTeamCategory] = useState(filters.team_category || '');
    const [teamRole, setTeamRole] = useState(filters.team_role || '');

    // MinSatu Apply Modal State
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [selectedTeamData, setSelectedTeamData] = useState<ApplyTeamData | null>(null);

    const handleFilterSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/competitions',
            {
                tab: activeTab,
                team_search: teamSearch,
                team_category: teamCategory,
                team_role: teamRole,
            },
            { preserveState: true }
        );
    };

    const handleResetFilter = () => {
        setTeamSearch('');
        setTeamCategory('');
        setTeamRole('');
        router.get('/competitions', { tab: activeTab });
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

    // User Initials
    const userInitials = useMemo(() => {
        if (!currentUserInfo?.name) return 'FA';
        const parts = currentUserInfo.name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }, [currentUserInfo]);

    const commonRoleOptions = [
        'UI/UX',
        'Frontend',
        'Backend',
        'Machine Learning',
        'Hustler',
        'Paper',
    ];

    return (
        <div className="min-h-screen bg-[#FAF9F5] text-slate-900 font-sans pb-24 selection:bg-blue-100 selection:text-blue-900">
            <Head title="Cari Rekan Tim Lomba & Hackathon — RakitCampus" />

            {/* TOP NAVBAR (Exact MinSatu Pattern) */}
            <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3 flex items-center justify-between">
                {/* Brand Logo */}
                <Link href="/competitions" className="flex items-center gap-2 group">
                    <div className="size-7 text-blue-600 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
                            <path d="M4 4h10l6 6v10H4V4z" />
                        </svg>
                    </div>
                    <span className="font-black text-xl tracking-tight text-slate-900">
                        rakit<span className="text-blue-600">campus</span>
                    </span>
                </Link>

                {/* Dark Navigation Pill (Cari Tim | Pengajuan | Timku) */}
                <nav className="bg-[#182232] rounded-full p-1 flex items-center gap-1 shadow-sm">
                    <button
                        onClick={() => setActiveTab('teams')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                            activeTab === 'teams'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        Cari Tim
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'applications'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        <span>Pengajuan</span>
                        {myApplications.length > 0 && (
                            <span className="size-1.5 rounded-full bg-blue-400" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('my_teams')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            activeTab === 'my_teams'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-300 hover:text-white'
                        }`}
                    >
                        <span>Timku</span>
                        {myTeams.length > 0 && (
                            <span className="size-1.5 rounded-full bg-emerald-400" />
                        )}
                    </button>
                </nav>

                {/* Right Actions: + Bikin Tim & Avatar */}
                <div className="flex items-center gap-3">
                    <Link
                        href={route('competitions.create')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                        <Plus className="size-3.5" />
                        <span>Bikin Tim</span>
                    </Link>

                    {currentUserInfo ? (
                        <Link
                            href={route('onboarding')}
                            title="Lengkapi Biodata / Profil"
                            className="size-9 rounded-full bg-white border border-slate-200 text-slate-900 font-bold text-xs flex items-center justify-center hover:border-blue-400 transition cursor-pointer shadow-xs"
                        >
                            {userInitials}
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="text-xs font-bold text-slate-700 hover:text-slate-900 px-2"
                        >
                            Masuk
                        </Link>
                    )}
                </div>
            </header>

            {/* Refresh link matching screenshot */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-end">
                <button
                    onClick={() => router.get('/competitions')}
                    className="text-[11px] text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                    Muat ulang
                </button>
            </div>

            {/* MAIN CONTAINER */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 space-y-8">
                {/* ========================================================= */}
                {/* TAB 1: CARI TIM (Exact MinSatu Screenshot Hero & Explorer) */}
                {/* ========================================================= */}
                {activeTab === 'teams' && (
                    <div className="space-y-8">
                        {/* HERO SECTION (Split 2 Columns) */}
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
                                    {/* Subtle Top Right Mark */}
                                    <div className="absolute top-5 right-5 text-white/30">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                            <path d="M4 4h10l6 6v10H4V4z" />
                                        </svg>
                                    </div>

                                    {/* 4 Member Slots Grid */}
                                    <div className="grid grid-cols-4 gap-2.5 sm:gap-3 pt-2 pb-6">
                                        {/* Slot 1: Ide */}
                                        <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 border border-white/10 text-center">
                                            <div className="size-7 rounded-full bg-white/20 flex items-center justify-center">
                                                <User className="size-4 text-white" />
                                            </div>
                                            <span className="text-[11px] sm:text-xs font-medium text-white/90">
                                                Ide
                                            </span>
                                        </div>

                                        {/* Slot 2: Riset */}
                                        <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 border border-white/10 text-center">
                                            <div className="size-7 rounded-full bg-white/20 flex items-center justify-center">
                                                <User className="size-4 text-white" />
                                            </div>
                                            <span className="text-[11px] sm:text-xs font-medium text-white/90">
                                                Riset
                                            </span>
                                        </div>

                                        {/* Slot 3: Eksekusi */}
                                        <div className="bg-white/15 backdrop-blur-xs rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 border border-white/10 text-center">
                                            <div className="size-7 rounded-full bg-white/20 flex items-center justify-center">
                                                <User className="size-4 text-white" />
                                            </div>
                                            <span className="text-[11px] sm:text-xs font-medium text-white/90">
                                                Eksekusi
                                            </span>
                                        </div>

                                        {/* Slot 4: White Angled Card "Kamu?" */}
                                        <div className="bg-white text-blue-600 rounded-2xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 shadow-lg transform rotate-2 -translate-y-1 text-center">
                                            <div className="size-7 rounded-full bg-blue-50 flex items-center justify-center">
                                                <User className="size-4 text-blue-600 stroke-[2.5]" />
                                            </div>
                                            <span className="text-[11px] sm:text-xs font-black text-blue-600">
                                                Kamu?
                                            </span>
                                        </div>
                                    </div>

                                    {/* Bottom Stats Row Inside Blue Card */}
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
                                                {totalNeededSlots || 2} orang
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SEARCH & FILTER BAR (Clean White Card) */}
                        <div
                            id="teams-section"
                            className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-2.5"
                        >
                            <form
                                onSubmit={handleFilterSubmit}
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
                                        onClick={handleResetFilter}
                                        className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                                    >
                                        Hapus filter
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* SECTION HEADER & TEAMS COUNT */}
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

                        {/* OPEN TEAMS GRID (Clean MinSatu Card Layout) */}
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
                                    const maxCap = comp.max_team_size || 5;

                                    const formattedDeadline = comp.registration_deadline
                                        ? new Date(comp.registration_deadline).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : 'Terbuka';

                                    return (
                                        <div
                                            key={part.id}
                                            className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-5"
                                        >
                                            <div>
                                                {/* Top Row: Category & Deadline */}
                                                <div className="flex items-start justify-between gap-2 mb-3">
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

                                                {/* Competition Title */}
                                                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                                                    <Link
                                                        href={route('competitions.show', comp.id)}
                                                        className="hover:text-blue-600 transition"
                                                    >
                                                        {comp.name}
                                                    </Link>
                                                </h3>

                                                {/* Organizer */}
                                                <p className="text-xs font-semibold text-slate-400 mt-0.5">
                                                    {comp.organizer || 'Kampus'}
                                                </p>

                                                {/* Team Info Box */}
                                                <div className="mt-3.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                                                    <div className="text-xs font-bold text-slate-900">
                                                        Tim {team?.name}
                                                    </div>
                                                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                                        {team?.description || 'Tim kompetisi sedang mempersiapkan karya terbaik.'}
                                                    </p>
                                                </div>

                                                {/* Roles Badges */}
                                                <div className="mt-4">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                                        Kebutuhan:
                                                    </span>
                                                    {roles.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {roles.map((r) => (
                                                                <span
                                                                    key={r.id}
                                                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200/60"
                                                                >
                                                                    <Briefcase className="size-3" />
                                                                    <span>{r.name}</span>
                                                                    <span className="text-[9px] px-1.5 py-0.2 bg-purple-200/70 text-purple-900 rounded-full font-black">
                                                                        {r.slots}
                                                                    </span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                                                            Semua peran terbuka
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Capacity Bar */}
                                                <div className="mt-4 pt-3 border-t border-slate-100">
                                                    <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                                        <span className="text-slate-400">Kapasitas</span>
                                                        <span className="text-slate-900">
                                                            {membersCount} / {maxCap} Anggota
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-blue-600 transition-all"
                                                            style={{
                                                                width: `${Math.min(100, (membersCount / maxCap) * 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-3">
                                                {team?.leader && (
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="size-7 rounded-full bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                                                            {team.leader.name.charAt(0)}
                                                        </div>
                                                        <div className="text-xs truncate">
                                                            <div className="font-bold text-slate-900 truncate">
                                                                {team.leader.name}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 truncate">
                                                                {team.leader.study_program || 'Ketua Tim'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {part.is_leader || part.is_member ? (
                                                    <Link
                                                        href={route('competitions.workspace', part.id)}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs shrink-0"
                                                    >
                                                        <span>Workspace</span>
                                                        <ArrowRight className="size-3" />
                                                    </Link>
                                                ) : part.my_application ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 shrink-0">
                                                        <Clock className="size-3" />
                                                        <span>Diajukan</span>
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => openApplyModal(part)}
                                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs hover:shadow cursor-pointer shrink-0"
                                                    >
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

                {/* ========================================================= */}
                {/* TAB 2: PENGAJUAN (User's Submitted Applications) */}
                {/* ========================================================= */}
                {activeTab === 'applications' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">
                                    Pengajuan Saya
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Daftar lamaran ke tim lomba yang sudah kamu kirimkan.
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                                {myApplications.length} Pengajuan
                            </span>
                        </div>

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

                {/* ========================================================= */}
                {/* TAB 3: TIMKU (User's Active Teams & Workspace Links) */}
                {/* ========================================================= */}
                {activeTab === 'my_teams' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">
                                    Tim Saya
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Semua tim kompetisi yang kamu ikuti atau pimpin.
                                </p>
                            </div>
                            <Link
                                href={route('competitions.create')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                            >
                                <Plus className="size-3.5" />
                                <span>Bikin Tim Baru</span>
                            </Link>
                        </div>

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
                                        onClick={() => setActiveTab('teams')}
                                        className="px-4 py-2 rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
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
            </main>

            {/* MinSatu Apply Modal */}
            <ApplyCompetitionTeamModal
                isOpen={applyModalOpen}
                onClose={() => setApplyModalOpen(false)}
                teamData={selectedTeamData}
                currentUserInfo={currentUserInfo}
            />
        </div>
    );
}
