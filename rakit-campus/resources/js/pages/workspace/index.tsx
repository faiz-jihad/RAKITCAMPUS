import AppLayout from '@/layouts/app-layout';
import { useLocale } from '@/hooks/use-locale';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Award,
    CheckCircle2,
    Kanban,
    Users,
} from 'lucide-react';

interface Props {
    teams: any[];
}

export default function WorkspaceIndex({ teams }: Props) {
    const { t, locale, isEn } = useLocale();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: isEn ? 'Team Workspace' : 'Workspace Tim', href: '/workspace' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs} activeTab="task">
            <Head title={isEn ? 'Team Workspace & Kanban — RAKIT Campus' : 'Workspace Tim & Kanban — RAKIT Campus'} />

            <div className="space-y-6">
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                            {isEn ? 'Project Workspace' : 'Workspace Proyek'}
                        </h1>
                    </div>
                </div>

                {/* Teams Grid */}
                {teams.length === 0 ? (
                    <div className="p-10 text-center rounded-xl bg-white border border-slate-200/80 max-w-lg mx-auto w-full shadow-2xs">
                        <div className="size-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-200/80">
                            <Kanban className="size-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{isEn ? 'No Active Project Teams' : 'Belum Ada Tim Proyek Aktif'}</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
                            {isEn ? 'Manage your project task kanban board with your team in a structured way.' : 'Kelola papan kanban tugas proyek Anda bersama tim secara terstruktur.'}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2.5">
                            <Link
                                href="/projects"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs"
                            >
                                {isEn ? 'Explore Projects' : 'Jelajahi Proyek'}
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                        {teams.map((t: any) => (
                            <div
                                key={t.id}
                                className="group flex flex-col justify-between transition-all duration-300"
                            >
                                {/* LAPTOP DEVICE MOCKUP */}
                                <div className="relative w-full">
                                    {/* 1. LAPTOP SCREEN LID (Display Housing with Anodized Dark Aluminum Shell) */}
                                    <div className="relative bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-t-[18px] sm:rounded-t-[22px] p-2 sm:p-2.5 pb-0 border border-slate-700/80 ring-1 ring-white/10 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.35)] transition-all duration-500 group-hover:border-blue-500/60 group-hover:shadow-[0_16px_45px_-8px_rgba(37,99,235,0.4)]">
                                        {/* Top Bezel with Integrated HD Webcam */}
                                        <div className="relative w-full h-3 bg-black flex items-center justify-center select-none">
                                            <div className="size-1.5 rounded-full bg-slate-950 border border-slate-700/80 flex items-center justify-center shadow-inner">
                                                <div className="size-0.5 rounded-full bg-blue-500/40 group-hover:bg-blue-400 group-hover:shadow-[0_0_6px_rgba(96,165,250,0.9)] transition-all duration-300" />
                                            </div>
                                        </div>

                                        {/* 2. LAPTOP INNER DISPLAY (The Screen - Lights Up / Glows on Hover) */}
                                        <Link
                                            href={`/workspace/${t.id}`}
                                            className="relative block bg-slate-950 rounded-t-lg overflow-hidden border border-black/90 p-4 sm:p-5 text-left select-none min-h-[250px] flex flex-col justify-between cursor-pointer"
                                        >
                                            {/* Hover Glow Effect: Ambient Radial Light Sweep */}
                                            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.22)_0%,transparent_75%)] opacity-20 group-hover:opacity-100 transition-opacity duration-500" />

                                            {/* Screen Glass Reflection Overlay */}
                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05]" />

                                            {/* Light Sheen Sweep Overlay */}
                                            <div className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-blue-400/15 to-transparent -translate-x-[150%] group-hover:translate-x-[250%] transition-transform duration-1000 ease-in-out" />

                                            {/* Inner Display Border Glow on Hover */}
                                            <div className="pointer-events-none absolute inset-0 rounded-t-lg ring-1 ring-transparent group-hover:ring-blue-400/40 group-hover:shadow-[inset_0_0_22px_rgba(37,99,235,0.25)] transition-all duration-500" />

                                            {/* Mini Chrome / OS Topbar */}
                                            <div className="relative z-10 flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                                                {/* Window Controls */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <div className="size-2 rounded-full bg-slate-700 group-hover:bg-blue-500 transition-colors" />
                                                    <div className="size-2 rounded-full bg-slate-700 group-hover:bg-blue-400 transition-colors" />
                                                    <div className="size-2 rounded-full bg-slate-700 group-hover:bg-blue-300 transition-colors" />
                                                </div>

                                                {/* Mini URL pill */}
                                                <div className="hidden xs:flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[9px] text-slate-400 font-mono">
                                                    <span className="text-blue-400">~/workspace/</span>
                                                    <span className="text-slate-300 font-semibold">{t.id}</span>
                                                </div>

                                                {/* Badges */}
                                                <div className="flex items-center gap-1.5">
                                                    {t.is_leader && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded border border-slate-700 font-semibold">
                                                            <Award className="size-2.5 text-blue-400" />
                                                            <span>Leader</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Center Team Info Viewport */}
                                            <div className="relative z-10 my-3">
                                                <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-200 transition-colors line-clamp-1">
                                                    {t.name}
                                                </h3>

                                                {(t.project?.title || t.competition?.name) && (
                                                    <p className="text-xs text-blue-400 font-semibold mt-0.5 line-clamp-1">
                                                        {t.project?.title || t.competition?.name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Bottom Screen Metrics & Progress */}
                                            <div className="relative z-10 pt-2.5 border-t border-slate-800/80">
                                                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                                    <span className="font-medium text-slate-400">Progres</span>
                                                    <span className="font-bold text-slate-200 group-hover:text-blue-300 transition-colors">
                                                        {t.progress_percent}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-800/90 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500 group-hover:bg-blue-400 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                                                        style={{ width: `${Math.min(100, t.progress_percent)}%` }}
                                                    />
                                                </div>

                                                {/* Members & Tasks Status */}
                                                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="size-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                                        <span className="font-medium text-slate-300">{t.members?.length || 1} Anggota</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <CheckCircle2 className="size-3 text-blue-400" />
                                                        <span className="font-medium text-slate-300">{t.done_tasks} / {t.total_tasks} Selesai</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Display Bottom Chin Bezel */}
                                        <div className="relative w-full h-2 bg-slate-950 border-t border-black/80 flex items-center justify-center z-20">
                                            <div className="w-12 h-0.5 bg-slate-800 rounded-full" />
                                        </div>
                                    </div>

                                    {/* 3. RECESSED CENTER HINGE ASSEMBLY */}
                                    <div className="relative w-full h-1 bg-slate-950 flex items-center justify-center z-10 border-t border-black/80">
                                        <div className="w-24 sm:w-28 h-1 bg-slate-950 rounded-full shadow-inner border-x border-white/5" />
                                    </div>

                                    {/* 4. 3D UNIBODY ALUMINUM BASE CHASSIS */}
                                    <div className="relative w-[103%] -ml-[1.5%] z-20">
                                        {/* Horizon Surface */}
                                        <div className="w-full h-1.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border-t border-white/20 flex items-center justify-between px-4 sm:px-6">
                                            <div className="w-8 h-[1px] bg-black/40 rounded-full" />
                                            <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
                                            <div className="w-8 h-[1px] bg-black/40 rounded-full" />
                                        </div>

                                        {/* Chamfer Highlight */}
                                        <div className="w-full h-[1px] bg-gradient-to-r from-white/10 via-white/30 to-white/10" />

                                        {/* Front Lip / Chin with CNC Thumb Scoop */}
                                        <div className="w-full h-3.5 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 rounded-b-xl border-b border-black shadow-md relative flex items-start justify-center">
                                            <div className="w-16 sm:w-20 h-1 bg-slate-950 rounded-b-sm shadow-inner border-t border-white/15" />
                                        </div>
                                    </div>

                                    {/* 5. Realistic Ground Ambient Shadows & Hover Screen Floor Glow */}
                                    <div className="relative w-full select-none pointer-events-none mt-0.5">
                                        {/* Contact Shadow */}
                                        <div className="w-[96%] h-2 bg-black/40 blur-xs rounded-full mx-auto" />
                                        {/* Hover Blue Underglow ("Laptop Menyala") */}
                                        <div className="w-[85%] h-3 bg-blue-600/10 group-hover:bg-blue-500/40 blur-md rounded-full mx-auto -mt-1.5 transition-all duration-500" />
                                    </div>
                                </div>

                                {/* ACTION FOOTER */}
                                <div className="mt-4 pt-2 flex items-center justify-between gap-2 px-1">
                                    {t.project ? (
                                        <Link
                                            href={`/projects/${t.project.id}`}
                                            className="text-xs text-slate-500 hover:text-blue-600 font-semibold transition"
                                        >
                                            {isEn ? 'Project Details' : 'Detail Proyek'}
                                        </Link>
                                    ) : (
                                        <span />
                                    )}

                                    <Link
                                        href={`/workspace/${t.id}`}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-2xs group-hover:bg-blue-600 group-hover:shadow-[0_0_12px_rgba(37,99,235,0.4)] transition"
                                    >
                                        <Kanban className="size-3.5" />
                                        <span>{isEn ? 'Open Team Workspace' : 'Buka Workspace Tim'}</span>
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
