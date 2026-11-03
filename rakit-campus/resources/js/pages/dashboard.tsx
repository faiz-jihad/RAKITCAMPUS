import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    Award,
    Calendar,
    CheckCircle2,
    Clock,
    FolderKanban,
    Kanban,
    Plus,
    ShieldCheck,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
        campus: string;
        major: string;
        nim?: string;
        availability: string;
        skills: any[];
    };
    stats: {
        my_teams_count: number;
        pending_tasks_count: number;
        recommended_matches_count: number;
        upcoming_competitions_count: number;
    };
    myTeams: any[];
    myTasks: any[];
    recommendedProjects: any[];
    upcomingCompetitions: any[];
    recentActivities: any[];
    profileCompletion?: { percent: number; missing: string[] };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({
    user,
    stats,
    myTeams = [],
    myTasks = [],
    recommendedProjects = [],
    upcomingCompetitions = [],
    recentActivities = [],
    profileCompletion,
}: Props) {
    const priorityColors: Record<string, string> = {
        urgent: 'bg-red-50 text-red-700 border-red-200',
        high: 'bg-amber-50 text-amber-700 border-amber-200',
        medium: 'bg-blue-50 text-blue-700 border-blue-200',
        low: 'bg-neutral-50 text-neutral-600 border-neutral-200',
    };

    const statusLabels: Record<string, string> = {
        todo: 'To Do',
        in_progress: 'Sedang Dikerjakan',
        in_review: 'Dalam Review',
        completed: 'Selesai',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard — RAKIT Campus" />

            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Hero / Student Banner */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    <ShieldCheck className="size-3" />
                                    Mahasiswa Terverifikasi
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-neutral-200 border border-white/15">
                                    {user.campus}
                                </span>
                                {user.nim && (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-white/10 text-neutral-300">
                                        NIM: {user.nim}
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                Halo, {user.name} 👋
                            </h1>
                            <p className="text-sm text-neutral-300 mt-1.5 max-w-2xl leading-relaxed">
                                {user.major} • Bangun tim kolaborasi, selesaikan tugas kanban, dan raih prestasi kompetisi nyata di kampus.
                            </p>

                            {/* Skills pill */}
                            {user.skills && user.skills.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                                    <span className="text-xs text-neutral-400">Keahlian Anda:</span>
                                    {user.skills.slice(0, 4).map((s: any) => (
                                        <span key={s.id} className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 font-medium">
                                            {s.name}
                                        </span>
                                    ))}
                                    {user.skills.length > 4 && (
                                        <span className="text-[11px] text-neutral-400">+{user.skills.length - 4} lainnya</span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quick CTA Buttons */}
                        <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0">
                            <Link
                                href="/projects/create"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow transition"
                            >
                                <Plus className="size-3.5" />
                                Buat Proyek Baru
                            </Link>
                            <Link
                                href="/matching"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold border border-white/20 transition"
                            >
                                <Sparkles className="size-3.5" />
                                Smart Matching Rekan
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Profile Completion Alert if incomplete */}
                {profileCompletion && profileCompletion.percent < 80 && (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                                {profileCompletion.percent}%
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-amber-900">Profil Anda Belum 100% Lengkap</h4>
                                <p className="text-[11px] text-amber-700">
                                    Tambahkan keahlian dan jam ketersediaan agar Anda lebih mudah direkrut oleh Project Leader.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/settings/profile"
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium self-start sm:self-auto transition"
                        >
                            Lengkapi Profil
                        </Link>
                    </div>
                )}

                {/* 4 Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                        href="/workspace"
                        className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition group"
                    >
                        <div className="flex items-center justify-between text-neutral-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Tim & Workspace</span>
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                                <Kanban className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-neutral-900">{stats.my_teams_count} Tim Aktif</div>
                        <span className="text-[11px] text-blue-600 font-medium block mt-1">
                            Buka papan Kanban kolaborasi &rarr;
                        </span>
                    </Link>

                    <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                        <div className="flex items-center justify-between text-neutral-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Tugas Perlu Dikerjakan</span>
                            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                                <Clock className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-neutral-900">{stats.pending_tasks_count} Tugas</div>
                        <span className="text-[11px] text-neutral-500 block mt-1">
                            Dari seluruh proyek yang Anda ikuti
                        </span>
                    </div>

                    <Link
                        href="/matching"
                        className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-purple-300 hover:shadow-md transition group"
                    >
                        <div className="flex items-center justify-between text-neutral-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Peluang Match</span>
                            <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition">
                                <Sparkles className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-neutral-900">{stats.recommended_matches_count} Rekomendasi</div>
                        <span className="text-[11px] text-purple-600 font-medium block mt-1">
                            Sesuai keahlian & minat Anda &rarr;
                        </span>
                    </Link>

                    <Link
                        href="/competitions"
                        className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition group"
                    >
                        <div className="flex items-center justify-between text-neutral-500 mb-2">
                            <span className="text-xs font-semibold uppercase tracking-wider">Kompetisi Terbuka</span>
                            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
                                <Trophy className="size-4" />
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-neutral-900">{stats.upcoming_competitions_count} Kompetisi</div>
                        <span className="text-[11px] text-emerald-600 font-medium block mt-1">
                            Bentuk tim & rebut prestasi &rarr;
                        </span>
                    </Link>
                </div>

                {/* Main 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Teams & Tasks */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Section: My Teams & Workspaces */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                                <div>
                                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                        <Kanban className="size-4 text-blue-600" />
                                        Tim Kolaborasi & Workspace Saya
                                    </h2>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        Papan kerja tim untuk pembagian tugas, sprint, dan milestone.
                                    </p>
                                </div>
                                <Link
                                    href="/workspace"
                                    className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
                                >
                                    Lihat Semua &rarr;
                                </Link>
                            </div>

                            {myTeams.length === 0 ? (
                                <div className="text-center py-8 px-4 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                                    <FolderKanban className="size-8 text-neutral-400 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-neutral-700">Belum tergabung dalam tim manapun</p>
                                    <p className="text-[11px] text-neutral-500 max-w-sm mx-auto mt-1 mb-3">
                                        Lamar posisi di proyek kampus atau buat proyek Anda sendiri untuk memulai kolaborasi.
                                    </p>
                                    <div className="flex justify-center gap-2">
                                        <Link
                                            href="/projects"
                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                                        >
                                            Cari Proyek
                                        </Link>
                                        <Link
                                            href="/projects/create"
                                            className="px-3 py-1.5 border border-neutral-200 hover:bg-white text-neutral-700 rounded-lg text-xs font-medium transition"
                                        >
                                            Buat Proyek
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {myTeams.map((team: any) => (
                                        <div
                                            key={team.id}
                                            className="p-4 border border-neutral-200 rounded-xl hover:border-blue-200 hover:shadow-xs transition bg-white"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-sm font-bold text-neutral-900">{team.name}</h3>
                                                        {team.is_leader && (
                                                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-semibold">
                                                                Leader
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-medium capitalize">
                                                            {team.type}
                                                        </span>
                                                    </div>
                                                    {team.project && (
                                                        <p className="text-xs text-blue-600 font-medium mt-0.5">
                                                            {team.project.title}
                                                        </p>
                                                    )}
                                                </div>

                                                <Link
                                                    href={`/workspace/${team.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium self-start sm:self-auto transition"
                                                >
                                                    <Kanban className="size-3" />
                                                    Buka Workspace
                                                    <ArrowRight className="size-3" />
                                                </Link>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mt-3">
                                                <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                                                    <span>Progres Tugas Selesai</span>
                                                    <span className="font-semibold text-neutral-800">
                                                        {team.done_tasks} / {team.total_tasks} ({team.progress_percent}%)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-1.5 rounded-full"
                                                        style={{ width: `${Math.min(100, team.progress_percent)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Members preview */}
                                            <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                                                <div className="flex items-center gap-2">
                                                    <Users className="size-3.5" />
                                                    <span>
                                                        {team.members.map((m: any) => m.name).join(', ')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Section: My Assigned Tasks */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-100">
                                <div>
                                    <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                                        <CheckCircle2 className="size-4 text-emerald-600" />
                                        Tugas Kanban Prioritas Saya
                                    </h2>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        Tugas yang ditugaskan kepada Anda di seluruh papan kerja tim.
                                    </p>
                                </div>
                            </div>

                            {myTasks.length === 0 ? (
                                <div className="text-center py-6 px-4 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                                    <CheckCircle2 className="size-8 text-neutral-400 mx-auto mb-2" />
                                    <p className="text-xs font-semibold text-neutral-700">Tidak ada tugas tertunda saat ini</p>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">
                                        Semua tugas Anda telah selesai, atau Anda belum memiliki tugas baru di tim.
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2.5">
                                    {myTasks.map((task: any) => (
                                        <div
                                            key={task.id}
                                            className="p-3 border border-neutral-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50 transition"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="size-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                                                <div>
                                                    <h4 className="text-xs font-bold text-neutral-900">{task.title}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                                                        <span>Tim: {task.team?.name}</span>
                                                        {task.milestone && (
                                                            <>
                                                                <span>•</span>
                                                                <span>Milestone: {task.milestone.title}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                                    priorityColors[task.priority] || priorityColors.medium
                                                }`}>
                                                    {task.priority}
                                                </span>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium">
                                                    {statusLabels[task.status] || task.status}
                                                </span>
                                                {task.team_id && (
                                                    <Link
                                                        href={`/workspace/${task.team_id}`}
                                                        className="p-1 rounded text-neutral-400 hover:text-neutral-900 transition"
                                                        title="Buka Papan Kanban"
                                                    >
                                                        <ArrowRight className="size-3.5" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Recommendations & Competitions */}
                    <div className="flex flex-col gap-6">
                        {/* Smart Matching Preview */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-100">
                                <div>
                                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                                        <Sparkles className="size-4 text-purple-600" />
                                        Rekomendasi Proyek
                                    </h3>
                                    <p className="text-[11px] text-neutral-500">Kecocokan keahlian & profil</p>
                                </div>
                                <Link
                                    href="/matching"
                                    className="text-xs text-purple-600 hover:text-purple-800 font-medium transition"
                                >
                                    Semua &rarr;
                                </Link>
                            </div>

                            {recommendedProjects.length === 0 ? (
                                <p className="text-xs text-neutral-500 py-3 text-center">
                                    Belum ada rekomendasi proyek baru saat ini.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {recommendedProjects.map((rec: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 flex flex-col gap-1.5"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-neutral-900 line-clamp-1">
                                                    {rec.project?.title || rec.title}
                                                </span>
                                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 shrink-0">
                                                    {rec.match_score}% Match
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-neutral-500 line-clamp-2">
                                                {rec.explanation || rec.project?.short_description}
                                            </p>
                                            <div className="flex justify-end pt-1">
                                                <Link
                                                    href={`/projects/${rec.project?.id || rec.project_id || rec.id}`}
                                                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 transition"
                                                >
                                                    Lihat Detail Proyek &rarr;
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Upcoming Competitions */}
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-100">
                                <div>
                                    <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                                        <Trophy className="size-4 text-amber-500" />
                                        Kompetisi Kampus
                                    </h3>
                                    <p className="text-[11px] text-neutral-500">Peluang prestasi mahasiswa</p>
                                </div>
                                <Link
                                    href="/competitions"
                                    className="text-xs text-amber-600 hover:text-amber-800 font-medium transition"
                                >
                                    Semua &rarr;
                                </Link>
                            </div>

                            {upcomingCompetitions.length === 0 ? (
                                <p className="text-xs text-neutral-500 py-3 text-center">
                                    Tidak ada kompetisi aktif saat ini.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {upcomingCompetitions.map((comp: any) => (
                                        <div
                                            key={comp.id}
                                            className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 flex flex-col gap-1.5"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-neutral-900 line-clamp-1">
                                                    {comp.name}
                                                </span>
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase shrink-0">
                                                    {comp.category || 'Lomba'}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-neutral-500 line-clamp-2">
                                                {comp.theme || comp.organizer}
                                            </p>
                                            <div className="flex items-center justify-between pt-1 text-[11px] text-neutral-500">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="size-3" />
                                                    {comp.registration_deadline ? new Date(comp.registration_deadline).toLocaleDateString('id-ID') : 'Segera'}
                                                </span>
                                                <Link
                                                    href={`/competitions/${comp.id}`}
                                                    className="font-semibold text-blue-600 hover:text-blue-800 transition"
                                                >
                                                    Bentuk Tim &rarr;
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Team Activities */}
                        {recentActivities.length > 0 && (
                            <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
                                <h3 className="text-sm font-bold text-neutral-900 mb-3 pb-3 border-b border-neutral-100 flex items-center gap-1.5">
                                    <Activity className="size-4 text-neutral-500" />
                                    Aktivitas Terbaru Tim
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {recentActivities.map((act: any) => (
                                        <div key={act.id} className="text-xs">
                                            <p className="text-neutral-800">
                                                <span className="font-semibold">{act.actor?.name || 'Seseorang'}</span>{' '}
                                                {act.description}
                                            </p>
                                            <span className="text-[10px] text-neutral-400">
                                                {act.team?.name} • {new Date(act.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
