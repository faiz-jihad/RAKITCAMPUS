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

            <div className="space-y-6">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                        Task Board
                    </h1>

                    <Link
                        href="/projects/create"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buat Proyek</span>
                    </Link>
                </div>

                {/* Teams Grid */}
                    {teams.length === 0 ? (
                        <div className="p-10 text-center rounded-xl bg-white border border-slate-200/80 max-w-lg mx-auto w-full shadow-2xs">
                            <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-200/80">
                                <Kanban className="size-6" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">Belum Ada Tim Proyek Aktif</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
                                Kelola papan kanban tugas proyek kelas Anda bersama tim secara terstruktur.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2.5">
                                <Link
                                    href="/projects"
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs"
                                >
                                    Jelajahi Proyek Kelas
                                </Link>
                                <Link
                                    href="/projects/create"
                                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
                                >
                                    + Buat Proyek Baru
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                            {teams.map((t: any) => (
                                <div
                                    key={t.id}
                                    className="bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition p-5 flex flex-col justify-between group"
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
