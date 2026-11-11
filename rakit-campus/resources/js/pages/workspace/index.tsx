import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    CheckCircle2,
    Clock,
    FolderKanban,
    Kanban,
    Plus,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';

interface Props {
    teams: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Workspace Tim', href: '/workspace' },
];

export default function WorkspaceIndex({ teams }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs} activeTab="task">
            <Head title="Workspace Tim & Kanban — RAKIT Campus" />

            <div className="space-y-6 pt-2">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 mb-2">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1d3557] tracking-tight">
                            Workspace & Task Board
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                            Kelola papan Kanban tim, lacak progres sprint, dan koordinasikan tugas anggota secara terstruktur.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href="/projects/create"
                            className="inline-flex items-center gap-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-full px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-sm shadow-blue-500/20 active:scale-[0.98] transition"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Bikin Tim & Proyek</span>
                        </Link>
                    </div>
                </div>

                {/* Teams Grid */}
                    {teams.length === 0 ? (
                        <div className="p-12 text-center glass-card rounded-3xl bg-white/85 max-w-2xl mx-auto w-full">
                            <div className="size-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                <Kanban className="size-7" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Anda Belum Memiliki Tim Aktif</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
                                Bergabunglah dengan proyek yang sedang membuka rekrutmen anggota, ikuti kompetisi mahasiswa, atau inisiasi proyek baru bersama rekan kampus Anda.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Link
                                    href="/projects"
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                                >
                                    Jelajahi Project Hub
                                </Link>
                                <Link
                                    href="/competitions"
                                    className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
                                >
                                    Cari Kompetisi
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {teams.map((t: any) => (
                                <div
                                    key={t.id}
                                    className="glass-card rounded-3xl p-6 bg-white/85 hover:bg-white/95 border border-white/85 hover:border-blue-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${
                                                t.type === 'competition'
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                                                    : 'bg-blue-50 text-blue-700 border-blue-200/80'
                                            }`}>
                                                {t.type === 'competition' ? 'Tim Kompetisi' : 'Tim Proyek'}
                                            </span>

                                            {t.is_leader && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-slate-900 text-white px-2.5 py-0.5 rounded-md font-bold">
                                                    <Award className="size-3 text-amber-400" />
                                                    <span>Leader</span>
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition line-clamp-1">
                                            {t.name}
                                        </h3>

                                        {t.project && (
                                            <p className="text-xs text-blue-600 font-semibold mt-1 line-clamp-1">
                                                Proyek: {t.project.title}
                                            </p>
                                        )}

                                        {t.competition && (
                                            <p className="text-xs text-amber-600 font-semibold mt-1 line-clamp-1">
                                                Lomba: {t.competition.name}
                                            </p>
                                        )}

                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                                            {t.description || t.project?.short_description || 'Workspace koordinasi kolaborasi tim mahasiswa.'}
                                        </p>

                                        {/* Progress Bar */}
                                        <div className="mt-5 pt-4 border-t border-slate-100">
                                            <div className="flex justify-between text-xs text-slate-600 mb-1.5">
                                                <span className="font-medium text-slate-500">Penyelesaian Tugas</span>
                                                <span className="font-bold text-slate-900">{t.progress_percent}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, t.progress_percent)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Metrics Info */}
                                        <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="size-3.5 text-slate-400" />
                                                <span className="font-medium">{t.members?.length || 1} Anggota</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                <span className="font-medium text-slate-700">{t.done_tasks} / {t.total_tasks} Selesai</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                                        {t.project ? (
                                            <Link
                                                href={`/projects/${t.project.id}`}
                                                className="text-xs text-slate-500 hover:text-slate-900 font-semibold transition"
                                            >
                                                Detail Proyek
                                            </Link>
                                        ) : (
                                            <span />
                                        )}

                                        <Link
                                            href={`/workspace/${t.id}`}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-2xs transition"
                                        >
                                            <Kanban className="size-3.5" />
                                            <span>Buka Kanban</span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </AppLayout>
    );
}
