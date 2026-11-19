import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Bot,
    Clock,
    FolderKanban,
    Plus,
    Search,
    Trash2,
    Trophy,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';

interface SessionItem {
    id: number;
    title: string;
    assistant_type: 'project' | 'competition' | 'team' | 'document';
    session_type: 'private' | 'shared' | 'project_linked';
    team_name: string;
    team_id: number;
    updated_at: string;
}

interface Props {
    sessions: SessionItem[];
}

const ASSISTANT_CONFIG = {
    project: {
        label: 'AI Project Assistant',
        icon: FolderKanban,
        badgeBg: 'bg-blue-50 text-blue-600 border-blue-200/60',
    },
    competition: {
        label: 'Competition Assistant',
        icon: Trophy,
        badgeBg: 'bg-amber-50 text-amber-600 border-amber-200/60',
    },
    team: {
        label: 'Team Assistant',
        icon: Users,
        badgeBg: 'bg-purple-50 text-purple-600 border-purple-200/60',
    },
    document: {
        label: 'Document Reviewer',
        icon: BookOpen,
        badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
    },
};

export default function AiHistoryIndex({ sessions }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    const filteredSessions = sessions.filter((s) => {
        const matchesQuery =
            s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.team_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || s.assistant_type === filterType;
        return matchesQuery && matchesType;
    });

    const handleDelete = (id: number) => {
        if (!confirm('Hapus sesi percakapan ini secara permanen?')) return;
        router.delete(`/ai-workspace/sessions/${id}`);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Ruang Kerja Tim', href: '/workspace' },
        { title: 'AI Workspace', href: '/ai-workspace' },
        { title: 'Riwayat AI', href: '/ai-workspace/history' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Riwayat Percakapan AI — RAKIT Campus" />

            <div className="space-y-6 pt-1 max-w-5xl mx-auto pb-20">
                {/* Header: Apple Bento Context Card */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <Link
                            href="/ai-workspace"
                            className="size-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shrink-0 active:scale-95 shadow-2xs"
                            title="Kembali ke AI Workspace"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                                <Clock className="size-3 text-indigo-600" />
                                <span>Arsip Percakapan</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                                Riwayat Konsultasi AI
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Log seluruh interaksi, rekomendasi strategi, dan sesi konsultasi tim Anda.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/ai-workspace"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition self-start sm:self-auto active:scale-95"
                    >
                        <Plus className="size-3.5" />
                        <span>Percakapan Baru</span>
                    </Link>
                </div>

                {/* Filter & Search Bar: Apple Segmented Pill */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative w-full sm:w-80">
                        <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari judul percakapan atau tim..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-2xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden shadow-2xs transition"
                        />
                    </div>

                    {/* Segmented Control */}
                    <div className="w-full sm:w-auto overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
                        <div className="flex items-center gap-1 bg-slate-200/60 p-1.5 rounded-2xl text-xs font-semibold shrink-0">
                            {[
                                { key: 'all', label: 'Semua' },
                                { key: 'project', label: 'Proyek' },
                                { key: 'competition', label: 'Lomba' },
                                { key: 'team', label: 'Tim' },
                                { key: 'document', label: 'Dokumen' },
                            ].map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setFilterType(t.key)}
                                    className={`px-3.5 py-1.5 rounded-xl capitalize transition-all cursor-pointer text-xs whitespace-nowrap shrink-0 ${
                                        filterType === t.key
                                            ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sessions List */}
                {filteredSessions.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-slate-200/80 rounded-3xl shadow-xs space-y-3.5">
                        <div className="size-16 rounded-3xl bg-indigo-50/80 border border-indigo-200/60 flex items-center justify-center p-2.5 mx-auto shadow-2xs">
                            <img
                                src="/images/mascot/mascot-sleep.png"
                                alt="Mascot Empty"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-800">
                            Tidak Ada Riwayat Percakapan
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                            Belum ada riwayat sesi yang cocok dengan kriteria pencarian. Mulai konsultasi baru di AI Workspace untuk mengotomasi alur tim Anda.
                        </p>
                        <div className="pt-2">
                            <Link
                                href="/ai-workspace"
                                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-2xs active:scale-95"
                            >
                                <Plus className="size-3.5" />
                                <span>Mulai Konsultasi AI</span>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredSessions.map((session) => {
                            const config = ASSISTANT_CONFIG[session.assistant_type] || {
                                label: 'Asisten AI',
                                icon: Bot,
                                badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
                            };
                            const Icon = config.icon;

                            return (
                                <div
                                    key={session.id}
                                    className="p-4 sm:p-5 bg-white border border-slate-200/80 hover:border-indigo-300 rounded-3xl shadow-xs hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className={`size-12 rounded-2xl border flex items-center justify-center shrink-0 transition shadow-2xs ${config.badgeBg}`}>
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    {config.label}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/60">
                                                    Tim: {session.team_name}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[10px] text-slate-400 capitalize">
                                                    {session.session_type}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900 truncate">
                                                {session.title}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                                        <span className="text-[11px] text-slate-400">
                                            {new Date(session.updated_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                        <Link
                                            href={`/ai-workspace?team_id=${session.team_id}&session_id=${session.id}&assistant=${session.assistant_type}`}
                                            className="px-4 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-2xs"
                                        >
                                            <span>Buka Sesi</span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(session.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                            title="Hapus sesi"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
