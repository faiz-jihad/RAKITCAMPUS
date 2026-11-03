import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Workspace Tim & Kanban — RAKIT Campus" />

            <div className="min-h-screen bg-gradient-to-b from-[#FAF8FF] via-white to-[#F8F6FF] relative text-[#0E121B] pb-24 selection:bg-[#5448EE] selection:text-white">
                {/* Atmosphere background radial glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[340px] bg-gradient-to-b from-[#5448EE]/10 to-transparent blur-3xl pointer-events-none -z-0" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10 flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEDFD] text-[#5448EE] text-xs font-semibold mb-2 border border-[#5448EE]/20">
                                <Kanban className="size-3.5" />
                                <span>Manajemen Tugas & Kolaborasi Real-Time</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0E121B]">
                                Workspace & Tim Kolaborasi
                            </h1>
                            <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 leading-relaxed">
                                Kelola papan Kanban interaktif, delegasikan tugas, lacak sprint, dan pantau progres proyek kolaboratif Anda.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href="/projects/create"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-semibold shadow-md shadow-indigo-500/25 transition active:scale-95"
                            >
                                <Plus className="size-4" />
                                <span>Buat Tim & Proyek Baru</span>
                            </Link>
                        </div>
                    </div>

                    {/* Teams Grid */}
                    {teams.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-neutral-200/80 shadow-sm max-w-2xl mx-auto w-full">
                            <div className="size-14 rounded-2xl bg-[#EEEDFD] text-[#5448EE] flex items-center justify-center mx-auto mb-4">
                                <Kanban className="size-7" />
                            </div>
                            <h3 className="text-base font-bold text-neutral-900">Anda Belum Memiliki Tim Aktif</h3>
                            <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1.5 mb-6 leading-relaxed">
                                Bergabunglah dengan proyek yang sedang membuka rekrutmen anggota, ikuti kompetisi mahasiswa, atau inisiasi proyek baru bersama rekan kampus Anda.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <Link
                                    href="/projects"
                                    className="px-6 py-2.5 bg-[#5448EE] hover:bg-[#4336D6] text-white rounded-full text-xs font-semibold transition shadow-md shadow-indigo-500/20"
                                >
                                    Jelajahi Project Hub
                                </Link>
                                <Link
                                    href="/competitions"
                                    className="px-6 py-2.5 border border-neutral-200/90 hover:bg-neutral-50 text-neutral-700 rounded-full text-xs font-semibold transition"
                                >
                                    Cari Kompetisi
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map((t: any) => (
                                <div
                                    key={t.id}
                                    className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-purple-200 transition flex flex-col justify-between group"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                                t.type === 'competition'
                                                    ? 'bg-amber-50 text-amber-700 border border-amber-200/80'
                                                    : 'bg-[#EEEDFD] text-[#5448EE] border border-[#5448EE]/20'
                                            }`}>
                                                {t.type === 'competition' ? 'Tim Kompetisi' : 'Tim Proyek'}
                                            </span>

                                            {t.is_leader && (
                                                <span className="text-[10px] bg-purple-50 text-[#5448EE] border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">
                                                    👑 Leader
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-base font-extrabold text-neutral-900 group-hover:text-[#5448EE] transition line-clamp-1">
                                            {t.name}
                                        </h3>

                                        {t.project && (
                                            <p className="text-xs text-[#5448EE] font-medium mt-1 line-clamp-1">
                                                Proyek: {t.project.title}
                                            </p>
                                        )}

                                        {t.competition && (
                                            <p className="text-xs text-amber-600 font-medium mt-1 line-clamp-1">
                                                Lomba: {t.competition.name}
                                            </p>
                                        )}

                                        <p className="text-xs text-neutral-500 mt-2.5 line-clamp-2 leading-relaxed">
                                            {t.description || t.project?.short_description || 'Workspace koordinasi kolaborasi tim mahasiswa.'}
                                        </p>

                                        {/* Progress Bar */}
                                        <div className="mt-5 pt-4 border-t border-neutral-100">
                                            <div className="flex justify-between text-xs text-neutral-600 mb-1.5">
                                                <span className="font-medium text-neutral-500">Penyelesaian Tugas</span>
                                                <span className="font-bold text-neutral-900">{t.progress_percent}%</span>
                                            </div>
                                            <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-[#5448EE] h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(100, t.progress_percent)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Metrics Info */}
                                        <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                                            <div className="flex items-center gap-1.5">
                                                <Users className="size-3.5 text-neutral-400" />
                                                <span className="font-medium">{t.members?.length || 1} Anggota</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                                <span className="font-medium text-neutral-700">{t.done_tasks} / {t.total_tasks} Selesai</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                                        {t.project ? (
                                            <Link
                                                href={`/projects/${t.project.id}`}
                                                className="text-xs text-neutral-500 hover:text-neutral-900 font-medium transition"
                                            >
                                                Detail Proyek
                                            </Link>
                                        ) : (
                                            <span />
                                        )}

                                        <Link
                                            href={`/workspace/${t.id}`}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#181135] hover:bg-neutral-900 text-white rounded-full text-xs font-semibold shadow-xs transition"
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
            </div>
        </AppLayout>
    );
}