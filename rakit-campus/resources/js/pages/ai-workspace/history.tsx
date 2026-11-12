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
    MessageSquare,
    Plus,
    Search,
    Share2,
    Trash2,
    Trophy,
    User,
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

const ASSISTANT_ICONS = {
    project: FolderKanban,
    competition: Trophy,
    team: Users,
    document: BookOpen,
};

const ASSISTANT_LABELS = {
    project: 'AI Project Assistant',
    competition: 'Competition Assistant',
    team: 'Team Assistant',
    document: 'Document Reviewer',
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

            <div className="space-y-6 pt-1 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/ai-workspace"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                            title="Kembali ke AI Workspace"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-black tracking-tight text-slate-900">
                                Riwayat Percakapan AI
                            </h1>
                            <p className="text-xs text-slate-500">
                                Daftar seluruh interaksi dan sesi konsultasi AI tim Anda.
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/ai-workspace"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition self-start sm:self-auto"
                    >
                        <Plus className="size-3.5" />
                        <span>Percakapan Baru</span>
                    </Link>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:w-72">
                        <Search className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari percakapan..."
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-xs font-semibold">
                        {['all', 'project', 'competition', 'team', 'document'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                                    filterType === type
                                        ? 'bg-white text-blue-600 shadow-2xs font-bold'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                {type === 'all' ? 'Semua' : type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sessions List */}
                {filteredSessions.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-2xs space-y-3">
                        <div className="size-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                            <Clock className="size-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">Tidak Ada Riwayat Percakapan</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Belum ada riwayat percakapan yang cocok dengan filter. Mulai konsultasi baru di AI Workspace.
                        </p>
                        <Link
                            href="/ai-workspace"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-2xs"
                        >
                            <Plus className="size-3.5" />
                            <span>Mulai Sekarang</span>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filteredSessions.map((session) => {
                            const Icon = ASSISTANT_ICONS[session.assistant_type] || Bot;
                            return (
                                <div
                                    key={session.id}
                                    className="p-4 bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl shadow-2xs transition flex items-center justify-between gap-4 group"
                                >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                        <div className="size-10 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition">
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                    {ASSISTANT_LABELS[session.assistant_type]}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="text-[10px] font-bold text-blue-600">
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

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                                            {new Date(session.updated_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                        <Link
                                            href={`/ai-workspace?team_id=${session.team_id}&session_id=${session.id}&assistant=${session.assistant_type}`}
                                            className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1"
                                        >
                                            <span>Buka</span>
                                            <ArrowRight className="size-3" />
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(session.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
