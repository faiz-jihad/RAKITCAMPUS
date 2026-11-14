import {
    AlertCircle,
    ArrowUpRight,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Code,
    ExternalLink,
    Filter,
    GitBranch,
    GitCommit,
    GitMerge,
    GitPullRequest,
    Github,
    Layers,
    Link2,
    Loader2,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    Unlink,
    User,
    UserCheck,
    Users,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import GitHubConnectModal from './GitHubConnectModal';
import GitHubHeatmap from './GitHubHeatmap';
import GitHubMappingModal from './GitHubMappingModal';
import GitHubMemberDetailModal from './GitHubMemberDetailModal';

interface Props {
    teamId: number;
    initialRepo?: any;
    initialData?: any;
    canManage: boolean;
    allMembers: any[];
}

export default function GitHubContributionMonitor({
    teamId,
    initialRepo,
    initialData,
    canManage,
    allMembers = [],
}: Props) {
    const [repo, setRepo] = useState<any>(initialRepo);
    const [overview, setOverview] = useState<any>(initialData);
    const [activeSubTab, setActiveSubTab] = useState<'overview' | 'members' | 'branches' | 'timeline' | 'settings'>('overview');

    // Modals
    const [connectModalOpen, setConnectModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [mappingModalData, setMappingModalData] = useState<any>(null);

    // Dynamic loading states
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [membersData, setMembersData] = useState<any>(null);
    const [branchesData, setBranchesData] = useState<any[]>([]);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [mappingsData, setMappingsData] = useState<any[]>([]);

    // Search in timeline
    const [timelineSearch, setTimelineSearch] = useState('');

    const isConnected = Boolean(repo && (repo.status === 'active' || repo.sync_status === 'synced' || repo.sync_status === 'syncing'));

    // Fetch overview data if not provided
    const fetchOverview = async () => {
        if (!isConnected) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/v1/workspaces/${teamId}/github/overview`);
            if (res.ok) {
                const json = await res.json();
                setOverview(json.data);
                if (json.data?.repository) {
                    setRepo(json.data.repository);
                }
            }
        } catch (e) {
            console.error('Failed to load GitHub overview', e);
        } finally {
            setLoading(false);
        }
    };

    // Fetch members analytics
    const fetchMembers = async () => {
        try {
            const res = await fetch(`/api/v1/workspaces/${teamId}/github/contributors`);
            if (res.ok) {
                const json = await res.json();
                setMembersData(json.data);
            }
        } catch (e) {
            console.error('Failed to load members analytics', e);
        }
    };

    // Fetch branches analytics
    const fetchBranches = async () => {
        try {
            const res = await fetch(`/api/v1/workspaces/${teamId}/github/branches`);
            if (res.ok) {
                const json = await res.json();
                setBranchesData(json.data || []);
            }
        } catch (e) {
            console.error('Failed to load branches', e);
        }
    };

    // Fetch activity timeline
    const fetchTimeline = async () => {
        try {
            const res = await fetch(`/api/v1/workspaces/${teamId}/github/activity?per_page=40`);
            if (res.ok) {
                const json = await res.json();
                setTimelineData(json.data || []);
            }
        } catch (e) {
            console.error('Failed to load activity timeline', e);
        }
    };

    // Fetch mappings
    const fetchMappings = async () => {
        try {
            const res = await fetch(`/api/v1/workspaces/${teamId}/github/mappings`);
            if (res.ok) {
                const json = await res.json();
                setMappingsData(json.data || []);
            }
        } catch (e) {
            console.error('Failed to load mappings', e);
        }
    };

    // Manual sync trigger
    const handleTriggerSync = async () => {
        if (!canManage || syncing) return;
        setSyncing(true);
        try {
            const res = await fetch(`/api/v1/workspaces/${teamId}/github/repository/sync`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                // Refresh data after short interval
                setTimeout(() => {
                    fetchOverview();
                    if (activeSubTab === 'members') fetchMembers();
                    if (activeSubTab === 'branches') fetchBranches();
                    if (activeSubTab === 'timeline') fetchTimeline();
                    setSyncing(false);
                }, 3000);
            } else {
                setSyncing(false);
            }
        } catch (e) {
            console.error('Sync failed', e);
            setSyncing(false);
        }
    };

    // Disconnect repository
    const handleDisconnect = async () => {
        if (!canManage) return;
        if (!confirm(`Yakin ingin memutuskan koneksi repositori '${repo?.full_name}' dari Workspace tim ini?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/v1/workspaces/${teamId}/github/repository`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (res.ok) {
                setRepo(null);
                setOverview(null);
            }
        } catch (e) {
            console.error('Disconnect failed', e);
        }
    };

    // Sub-tab switching effects
    useEffect(() => {
        if (!isConnected) return;
        if (activeSubTab === 'members' && !membersData) fetchMembers();
        if (activeSubTab === 'branches' && branchesData.length === 0) fetchBranches();
        if (activeSubTab === 'timeline' && timelineData.length === 0) fetchTimeline();
        if (activeSubTab === 'settings' && mappingsData.length === 0) fetchMappings();
    }, [activeSubTab, isConnected]);

    // =========================================================================
    // 1. EMPTY STATE (NOT CONNECTED)
    // =========================================================================
    if (!isConnected) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-2xs text-center space-y-6 animate-in fade-in">
                <div className="size-16 rounded-3xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
                    <Github className="size-8" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                        Hubungkan Repositori GitHub Tim
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                        Pantau aktivitas kontribusi commit, keterlibatan branch, serta riwayat pull request seluruh anggota tim secara otomatis dan transparan.
                    </p>
                </div>

                {/* 3 Value Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left pt-2">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                        <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                            <GitCommit className="size-3.5 text-blue-600" />
                            <span>1 Repositori untuk Semua</span>
                        </span>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Cukup masukkan 1 URL repositori, RAKIT otomatis memetakan kontribusi seluruh anggota tim.
                        </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                        <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                            <Calendar className="size-3.5 text-emerald-600" />
                            <span>Heatmap & Konsistensi</span>
                        </span>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Visualisasi heatmap 365 hari dan tren commit harian yang terukur dan objektif.
                        </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                        <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
                            <Shield className="size-3.5 text-purple-600" />
                            <span>Aman & Terverifikasi</span>
                        </span>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            Dukungan repositori publik maupun privat melalui integrasi GitHub App dan Webhook.
                        </p>
                    </div>
                </div>

                {canManage ? (
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={() => setConnectModalOpen(true)}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Hubungkan Repositori Sekarang</span>
                        </button>
                    </div>
                ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 max-w-md mx-auto">
                        Repositori GitHub belum dikonfigurasi. Silakan hubungi Team Leader atau Admin Workspace untuk menghubungkan repositori.
                    </div>
                )}

                <GitHubConnectModal
                    isOpen={connectModalOpen}
                    onClose={() => setConnectModalOpen(false)}
                    teamId={teamId}
                    onConnected={() => {
                        fetchOverview();
                    }}
                />
            </div>
        );
    }

    // =========================================================================
    // 2. CONNECTED STATE (DASHBOARD & MONITORING)
    // =========================================================================
    const metrics = overview?.metrics || {
        total_commits: 0,
        total_branches: 0,
        active_contributors: 0,
        pull_requests_created: 0,
        pull_requests_merged: 0,
        pull_requests_open: 0,
        total_additions: 0,
        total_deletions: 0,
    };

    const isSyncing = repo?.sync_status === 'syncing' || syncing;

    return (
        <div className="space-y-5 animate-in fade-in">
            {/* Top Repo Banner Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                    <div className="size-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Github className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <a
                                href={repo?.html_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm sm:text-base font-extrabold text-slate-900 hover:text-blue-600 transition flex items-center gap-1.5 truncate"
                            >
                                <span className="truncate">{repo?.full_name}</span>
                                <ExternalLink className="size-3.5 text-slate-400 shrink-0" />
                            </a>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono font-bold shrink-0">
                                {repo?.default_branch || 'main'}
                            </span>
                            {repo?.is_private && (
                                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold shrink-0">
                                    Private
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                <span>
                                    Sinkronisasi:{' '}
                                    {repo?.last_synced_at
                                        ? new Date(repo.last_synced_at).toLocaleDateString('id-ID', {
                                              day: 'numeric',
                                              month: 'short',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                        : 'Belum pernah'}
                                </span>
                            </span>
                            {isSyncing ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600">
                                    <Loader2 className="size-3 animate-spin" />
                                    <span>Sedang Menganalisis...</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                    <span>Tersinkronisasi</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={handleTriggerSync}
                        disabled={isSyncing}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-50"
                        title="Sinkronisasi ulang commit terbaru"
                    >
                        <RefreshCw className={`size-3.5 text-blue-600 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Sinkronisasi...' : 'Sinkronkan'}</span>
                    </button>

                    {canManage && (
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('settings')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition shadow-2xs cursor-pointer"
                        >
                            <span>Kelola Integrasi</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-Navigation Segmented Bar */}
            <div className="overflow-x-auto no-scrollbar">
                <nav className="inline-flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70 min-w-full sm:min-w-0">
                    <button
                        type="button"
                        onClick={() => setActiveSubTab('overview')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            activeSubTab === 'overview'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Layers className="size-3.5" />
                        <span>Ringkasan</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSubTab('members')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            activeSubTab === 'members'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Users className="size-3.5" />
                        <span>Kontribusi Anggota</span>
                        {allMembers.length > 0 && (
                            <span className="px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                                {allMembers.length}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSubTab('branches')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            activeSubTab === 'branches'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <GitBranch className="size-3.5" />
                        <span>Branch ({metrics.total_branches})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveSubTab('timeline')}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            activeSubTab === 'timeline'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Clock className="size-3.5" />
                        <span>Aktivitas & Log</span>
                    </button>

                    {canManage && (
                        <button
                            type="button"
                            onClick={() => setActiveSubTab('settings')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                                activeSubTab === 'settings'
                                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Link2 className="size-3.5" />
                            <span>Pengaturan & Pemetaan</span>
                        </button>
                    )}
                </nav>
            </div>

            {/* ============================================================= */}
            {/* SUB-TAB 1: RINGKASAN (OVERVIEW)                                */}
            {/* ============================================================= */}
            {activeSubTab === 'overview' && (
                <div className="space-y-5 animate-in fade-in">
                    {/* 4 Primary Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500">Total Commit</span>
                                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <GitCommit className="size-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                {metrics.total_commits.toLocaleString()}
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                {metrics.recent_commits_30d ?? metrics.total_commits} commit dalam 30 hari terakhir
                            </span>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500">Kontributor Aktif</span>
                                <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                    <Users className="size-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                {metrics.active_contributors}
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                Mahasiswa & kolaborator terdata
                            </span>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500">Branch Terpantau</span>
                                <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                    <GitBranch className="size-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                {metrics.total_branches}
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                Default branch: <strong className="text-slate-700">{repo?.default_branch || 'main'}</strong>
                            </span>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500">Pull Requests</span>
                                <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                    <GitPullRequest className="size-4" />
                                </div>
                            </div>
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                                {metrics.pull_requests_merged} <span className="text-sm font-semibold text-slate-400">/ {metrics.pull_requests_created}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-1 block">
                                {metrics.pull_requests_open} PR terbuka saat ini
                            </span>
                        </div>
                    </div>

                    {/* Contribution Heatmap */}
                    <GitHubHeatmap
                        days={overview?.heatmap?.days || []}
                        totalCommits={overview?.heatmap?.total_commits || metrics.total_commits}
                        totalActiveDays={overview?.heatmap?.total_active_days || 0}
                    />

                    {/* 30-Day Commit Trend Chart & Top Contributors Bento */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                        {/* Daily Trend Chart (8 cols) */}
                        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                                        Tren Commit Harian (30 Hari Terakhir)
                                    </h3>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Frekuensi push kode ke seluruh branch repositori
                                    </p>
                                </div>
                            </div>

                            {/* Bar Chart */}
                            <div className="h-44 flex items-end gap-1.5 pt-4">
                                {(overview?.daily_trends || []).map((trend: any, idx: number) => {
                                    const maxInTrend = Math.max(1, ...((overview?.daily_trends || []).map((t: any) => t.commits)));
                                    const heightPct = trend.commits > 0 ? Math.min(100, Math.max(15, (trend.commits / maxInTrend) * 100)) : 5;
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                                            <div
                                                style={{ height: `${heightPct}%` }}
                                                className={`w-full rounded-t-sm transition-all duration-300 ${
                                                    trend.commits > 0
                                                        ? 'bg-blue-600 group-hover:bg-blue-700'
                                                        : 'bg-slate-100'
                                                }`}
                                                title={`${trend.commits} commit pada ${trend.date}`}
                                            />
                                            {idx % 5 === 0 && (
                                                <span className="text-[8px] text-slate-400 font-mono">
                                                    {trend.label}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Top Contributors Card (4 cols) */}
                        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                                    Kontributor Teratas
                                </h3>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                    Berdasarkan jumlah commit yang terverifikasi
                                </p>
                            </div>

                            <div className="space-y-2.5">
                                {(overview?.top_contributors || []).length === 0 ? (
                                    <p className="text-xs text-slate-400 py-4 text-center">Belum ada data kontributor.</p>
                                ) : (
                                    (overview?.top_contributors || []).map((contributor: any, idx: number) => (
                                        <div
                                            key={contributor.id}
                                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="text-xs font-black text-slate-400 w-4 text-center">
                                                    #{idx + 1}
                                                </span>
                                                <div className="size-8 rounded-lg overflow-hidden bg-slate-200 shrink-0">
                                                    {contributor.avatar ? (
                                                        <img src={contributor.avatar} alt={contributor.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-600">
                                                            {contributor.name?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <span className="text-xs font-bold text-slate-900 truncate block">
                                                        {contributor.name}
                                                    </span>
                                                    {contributor.login && (
                                                        <span className="text-[10px] text-slate-400 font-mono truncate block">
                                                            @{contributor.login}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs font-extrabold text-blue-600 shrink-0">
                                                {contributor.commits} commit
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* SUB-TAB 2: KONTRIBUSI ANGGOTA (MEMBERS)                         */}
            {/* ============================================================= */}
            {activeSubTab === 'members' && (
                <div className="space-y-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">
                                    Rekap Kontribusi Anggota Workspace
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Klik anggota tim untuk melihat detail commit, partisipasi branch, dan linimasa kontribusi.
                                </p>
                            </div>
                        </div>

                        {/* Members Grid / List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {(membersData?.members || []).map((m: any) => (
                                <div
                                    key={m.user_id}
                                    onClick={() => setSelectedMember(m)}
                                    className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition cursor-pointer flex flex-col justify-between gap-3 group"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="size-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                                {m.avatar || m.github_avatar ? (
                                                    <img
                                                        src={m.avatar || m.github_avatar}
                                                        alt={m.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-600">
                                                        {m.name.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                                                    {m.name}
                                                </h4>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5">
                                                    <span>{m.role}</span>
                                                    {m.github_login && (
                                                        <span>• @{m.github_login}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {m.is_mapped ? (
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 shrink-0">
                                                Terhubung
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium shrink-0">
                                                Belum Ada Commit
                                            </span>
                                        )}
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-medium">Commit</span>
                                            <span className="text-xs font-extrabold text-slate-900">
                                                {m.total_commits}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-medium">Hari Aktif</span>
                                            <span className="text-xs font-extrabold text-slate-900">
                                                {m.active_days}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-medium">Pull Request</span>
                                            <span className="text-xs font-extrabold text-slate-900">
                                                {m.prs_created ?? 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Unmapped Contributors Section */}
                    {(membersData?.unmapped || []).length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                            <div className="border-b border-slate-100 pb-2">
                                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                                    Kontributor GitHub yang Belum Terpetakan ({membersData.unmapped.length})
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    Daftar identitas commit GitHub yang belum dikaitkan dengan profil anggota tim di Workspace.
                                </p>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {membersData.unmapped.map((u: any) => (
                                    <div
                                        key={u.contributor_id}
                                        className="py-2.5 flex items-center justify-between gap-3 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="size-7 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                                                {u.avatar ? (
                                                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="size-3.5 m-auto text-slate-400" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-bold text-slate-800 truncate block">
                                                    {u.name} {u.login ? `(@${u.login})` : ''}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono truncate block">
                                                    {u.email || 'Email commit tersembunyi'} • {u.total_commits} commit
                                                </span>
                                            </div>
                                        </div>

                                        {canManage && u.mapping_id && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMappingModalData({
                                                        mappingId: u.mapping_id,
                                                        name: u.name,
                                                        login: u.login,
                                                        email: u.email,
                                                    });
                                                }}
                                                className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer shrink-0"
                                            >
                                                Petakan ke Anggota
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================================= */}
            {/* SUB-TAB 3: BRANCHES                                            */}
            {/* ============================================================= */}
            {activeSubTab === 'branches' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 animate-in fade-in">
                    <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Daftar Branch & Aktivitas Pengerjaan
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Pantau pergerakan fitur dan cabang pengembangan tim
                            </p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                            {branchesData.length} Branch
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {branchesData.map((b) => (
                            <div
                                key={b.id}
                                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                            <GitBranch className="size-3.5 text-blue-600" />
                                            <span>{b.name}</span>
                                        </span>
                                        {b.is_default && (
                                            <span className="px-2 py-0.2 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60">
                                                Default
                                            </span>
                                        )}
                                        {b.is_deleted && (
                                            <span className="px-2 py-0.2 rounded-md bg-rose-50 text-rose-700 text-[10px] font-bold">
                                                Dihapus di GitHub
                                            </span>
                                        )}
                                    </div>
                                    {b.latest_commit && (
                                        <p className="text-[11px] text-slate-500 line-clamp-1">
                                            <span className="font-mono text-slate-700 font-semibold">{b.latest_commit.sha}</span>:{' '}
                                            {b.latest_commit.message} — <strong className="text-slate-700">{b.latest_commit.author_name}</strong>
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-4 text-xs shrink-0 text-slate-500">
                                    <div className="text-right">
                                        <span className="font-bold text-slate-900 block">{b.commit_count} commit</span>
                                        <span className="text-[10px] text-slate-400 block">{b.contributors_count} kontributor</span>
                                    </div>
                                    {b.last_activity && (
                                        <span className="text-[11px] text-slate-400">
                                            {new Date(b.last_activity).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* SUB-TAB 4: AKTIVITAS & TIMELINE                                */}
            {/* ============================================================= */}
            {activeSubTab === 'timeline' && (
                <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4 animate-in fade-in">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">
                                Linimasa Aktivitas Repositori
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Log kronologis commit, pull request, dan penggabungan kode
                            </p>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {timelineData.length === 0 ? (
                            <p className="text-xs text-slate-400 py-8 text-center">Belum ada rekaman aktivitas.</p>
                        ) : (
                            timelineData.map((item) => (
                                <div key={item.id} className="py-3 flex items-start gap-3 text-xs">
                                    <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                        {item.type === 'pull_request' ? (
                                            <GitPullRequest className="size-4 text-purple-600" />
                                        ) : (
                                            <GitCommit className="size-4 text-blue-600" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <a
                                                href={item.html_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-bold text-slate-900 hover:text-blue-600 transition truncate"
                                            >
                                                {item.title}
                                            </a>
                                            {item.sha && (
                                                <span className="font-mono text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded bg-slate-100">
                                                    {item.sha}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                                            <span className="font-semibold text-slate-700">
                                                {item.user?.name || item.author_name}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {new Date(item.timestamp).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                            {item.branches && item.branches.length > 0 && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-mono text-[10px] text-slate-500">
                                                        [{item.branches.join(', ')}]
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ============================================================= */}
            {/* SUB-TAB 5: PENGATURAN & PEMETAAN (SETTINGS)                   */}
            {/* ============================================================= */}
            {activeSubTab === 'settings' && canManage && (
                <div className="space-y-4 animate-in fade-in">
                    {/* Contributor Mapping Table */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900">
                                Manajemen Pemetaan Kontributor
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Tinjau kecocokan akun GitHub kontributor dengan identitas mahasiswa di Workspace.
                            </p>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                                        <th className="pb-2.5">Identitas GitHub</th>
                                        <th className="pb-2.5">Anggota RAKIT</th>
                                        <th className="pb-2.5">Metode</th>
                                        <th className="pb-2.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {mappingsData.map((m) => (
                                        <tr key={m.id} className="py-2.5">
                                            <td className="py-2.5 pr-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-900">{m.name}</span>
                                                    {m.login && <span className="text-slate-400 font-mono text-[10px]">@{m.login}</span>}
                                                </div>
                                                <span className="text-[10px] text-slate-400 block">{m.email}</span>
                                            </td>
                                            <td className="py-2.5 pr-3">
                                                {m.user ? (
                                                    <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                                                        <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                        <span>{m.user.name}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-600 font-medium">Belum dipetakan</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 pr-3">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                                    {m.mapping_type}
                                                </span>
                                            </td>
                                            <td className="py-2.5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMappingModalData({
                                                            mappingId: m.id,
                                                            name: m.name,
                                                            login: m.login,
                                                            email: m.email,
                                                            currentUserId: m.user?.id,
                                                        });
                                                    }}
                                                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer"
                                                >
                                                    Ubah
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Webhook Configuration Guide */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                        <div className="border-b border-slate-100 pb-2">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                                Konfigurasi GitHub Webhook (Opsional untuk Pembaruan Real-Time)
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Tambahkan webhook pada pengaturan repositori GitHub Anda agar aktivitas sinkron secara instan.
                            </p>
                        </div>

                        <div className="space-y-2 text-xs">
                            <div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Payload URL</span>
                                <code className="block p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px] mt-0.5 select-all">
                                    {window.location.origin}/api/v1/integrations/github/webhook
                                </code>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-slate-600">
                                <div>
                                    <strong className="text-slate-800 block">Content type:</strong>
                                    <code>application/json</code>
                                </div>
                                <div>
                                    <strong className="text-slate-800 block">Events:</strong>
                                    <span>Pushes, Pull requests, Pull request reviews, Branch creation/deletion</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone: Disconnect */}
                    <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-5 space-y-3">
                        <div>
                            <h3 className="text-xs sm:text-sm font-bold text-rose-900">
                                Putuskan Integrasi Repositori
                            </h3>
                            <p className="text-[11px] text-rose-700 mt-0.5">
                                Memutuskan koneksi repositori dari Workspace ini. Data riwayat lokal akan diarsipkan.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleDisconnect}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                            <Unlink className="size-3.5" />
                            <span>Putuskan Repositori</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <GitHubMemberDetailModal
                member={selectedMember}
                onClose={() => setSelectedMember(null)}
                repoFullName={repo?.full_name}
            />

            {mappingModalData && (
                <GitHubMappingModal
                    isOpen={Boolean(mappingModalData)}
                    onClose={() => setMappingModalData(null)}
                    teamId={teamId}
                    mappingId={mappingModalData.mappingId}
                    contributorName={mappingModalData.name}
                    contributorLogin={mappingModalData.login}
                    contributorEmail={mappingModalData.email}
                    currentUserId={mappingModalData.currentUserId}
                    allMembers={allMembers}
                    onMapped={() => {
                        fetchMembers();
                        fetchMappings();
                    }}
                />
            )}
        </div>
    );
}
