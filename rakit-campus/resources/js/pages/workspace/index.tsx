import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Clock, FolderKanban, Kanban, Plus, Trophy, Users, ShieldAlert } from 'lucide-react';

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
            <Head title="Workspace Tim — RAKIT Campus" />

            <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="p-1 rounded bg-blue-50 text-blue-600">
                                <Kanban className="size-4" />
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                                Workspace & Tim Kolaborasi
                            </h1>
                        </div>
                        <p className="text-xs text-neutral-500">
                            Kelola papan Kanban, pembagian tugas, progres milestone, dan koordinasi tim secara langsung di web.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/projects/create"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
                        >
                            <Plus className="size-3.5" />
                            Buat Tim & Proyek Baru
                        </Link>
                    </div>
                </div>

                {/* Teams List */}
                {teams.length === 0 ? (
                    <div className="p-12 text-center bg-white rounded-xl border border-neutral-200">
                        <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                            <Kanban className="size-6" />
                        </div>
                        <h3 className="text-base font-bold text-neutral-900">Anda Belum Memiliki Tim Aktif</h3>
                        <p className="text-xs text-neutral-500 max-w-md mx-auto mt-1 mb-5">
                            Bergabunglah dengan proyek yang sedang membuka rekrutmen atau daftarkan tim baru untuk mengikuti kompetisi mahasiswa.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link
                                href="/projects"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
                            >
                                Jelajah Project Hub
                            </Link>
                            <Link
                                href="/competitions"
                                className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-medium transition"
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
                                className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                            t.type === 'competition'
                                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                                        }`}>
                                            {t.type === 'competition' ? 'Tim Kompetisi' : 'Tim Proyek'}
                                        </span>

                                        {t.is_leader && (
                                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                                                Leader Tim
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-base font-bold text-neutral-900 line-clamp-1">{t.name}</h3>

                                    {t.project && (
                                        <p className="text-xs text-blue-600 font-medium mt-0.5 line-clamp-1">
                                            Proyek: {t.project.title}
                                        </p>
                                    )}

                                    {t.competition && (
                                        <p className="text-xs text-amber-600 font-medium mt-0.5 line-clamp-1">
                                            Kompetisi: {t.competition.name}
                                        </p>
                                    )}

                                    <p className="text-xs text-neutral-500 mt-2 line-clamp-2">
                                        {t.description || t.project?.short_description || 'Workspace koordinasi kolaborasi tim mahasiswa.'}
                                    </p>

                                    {/* Progress */}
                                    <div className="mt-4 pt-3 border-t border-neutral-100">
                                        <div className="flex justify-between text-xs text-neutral-600 mb-1">
                                            <span>Penyelesaian Tugas</span>
                                            <span className="font-semibold text-neutral-900">{t.progress_percent}%</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${Math.min(100, t.progress_percent)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Members info */}
                                    <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="size-3.5" />
                                            <span>{t.members?.length || 1} Anggota</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                                            <span>{t.done_tasks} / {t.total_tasks} Selesai</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                                    {t.project ? (
                                        <Link
                                            href={`/projects/${t.project.id}`}
                                            className="text-xs text-neutral-500 hover:text-neutral-900 transition"
                                        >
                                            Detail Proyek
                                        </Link>
                                    ) : (
                                        <span />
                                    )}

                                    <Link
                                        href={`/workspace/${t.id}`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition"
                                    >
                                        <Kanban className="size-3" />
                                        Buka Kanban
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
