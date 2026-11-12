import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Award,
    BookOpen,
    Bot,
    Check,
    CheckCircle2,
    ChevronDown,
    Clock,
    Copy,
    FileCode,
    FileText,
    FolderKanban,
    HelpCircle,
    Info,
    Kanban,
    Lock,
    MessageSquare,
    Paperclip,
    Plus,
    RefreshCw,
    Send,
    Share2,
    Shield,
    Sparkles,
    Trash2,
    Trophy,
    UploadCloud,
    User,
    Users,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface TeamItem {
    id: number;
    name: string;
    type: string;
    project?: { id: number; title: string; slug: string } | null;
    competitions?: Array<{ id: number; name: string; slug: string }>;
    members?: Array<{ id: number; role: string }>;
}

interface QuotaInfo {
    quota_limit: number;
    quota_used: number;
    quota_remaining: number;
    period_started_at: string | null;
    period_expires_at: string | null;
    reset_in_seconds: number | null;
    is_exhausted: boolean;
}

interface SessionItem {
    id: number;
    title: string;
    assistant_type: 'project' | 'competition' | 'team' | 'document';
    session_type: 'private' | 'shared' | 'project_linked';
    updated_at: string;
    is_own: boolean;
}

interface MessageItem {
    id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: string;
}

interface Props {
    teams: TeamItem[];
    activeTeam: TeamItem | null;
    quotaInfo: QuotaInfo | null;
    sessions: SessionItem[];
    activeSession: {
        id: number;
        title: string;
        assistant_type: 'project' | 'competition' | 'team' | 'document';
        session_type: 'private' | 'shared' | 'project_linked';
        is_own: boolean;
    } | null;
    messages: MessageItem[];
    assistantType: 'project' | 'competition' | 'team' | 'document';
}

const ASSISTANT_METADATA = {
    project: {
        title: 'AI Project Assistant',
        subtitle: 'Brainstorming ide, perumusan masalah, arsitektur solusi, roadmap, dan proposal proyek.',
        icon: FolderKanban,
        badgeCls: 'bg-blue-50 text-blue-700 border-blue-200/80',
        suggestedPrompts: [
            'Bantu susun Problem Statement yang tajam untuk proyek kami.',
            'Buatkan roadmap pengembangan fitur MVP selama 4 minggu.',
            'Evaluasi kelayakan teknis stack yang kami gunakan.',
            'Rekomendasikan metodologi riset dan validasi pengguna.',
        ],
    },
    competition: {
        title: 'Competition Assistant',
        subtitle: 'Analisis syarat lomba, kriteria eligibilitas, checklist pendaftaran, dan strategi juara.',
        icon: Trophy,
        badgeCls: 'bg-amber-50 text-amber-700 border-amber-200/80',
        suggestedPrompts: [
            'Apa saja berkas wajib dan checklist pendaftaran kompetisi kami?',
            'Bagaimana menyelaraskan proyek kami agar cocok dengan kriteria penilaian juri?',
            'Rekomendasikan strategi timeline persiapan pitch deck dan berkas submission.',
            'Analisis potensi keunikan kompetitif solusi kami dibanding peserta lain.',
        ],
    },
    team: {
        title: 'Team Assistant',
        subtitle: 'Distribusi peran, alokasi beban tugas, deteksi hambatan, dan koordinasi tim.',
        icon: Users,
        badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        suggestedPrompts: [
            'Rekomendasikan pembagian peran optimal untuk anggota tim kami.',
            'Bagaimana cara memecah milestone besar menjadi sprint mingguan yang terukur?',
            'Bantu identifikasi potensi bottleneck dalam pengerjaan proyek saat ini.',
            'Saran format standup mingguan yang efektif agar progres transparan.',
        ],
    },
    document: {
        title: 'Document Reviewer',
        subtitle: 'Bedah proposal, abstrak, laporan teknis, dan evaluasi kesesuaian terhadap rubrik.',
        icon: BookOpen,
        badgeCls: 'bg-purple-50 text-purple-700 border-purple-200/80',
        suggestedPrompts: [
            'Review draft executive summary / abstrak proposal kami berikut.',
            'Cek apakah ada bagian krusial yang terlewat dalam dokumen ini.',
            'Tingkatkan keterbacaan, kejelasan argumen, dan bobot akademis teks ini.',
            'Evaluasi kekuatan latar belakang masalah dan justifikasi urgensi solusi.',
        ],
    },
};

export default function AiWorkspaceIndex({
    teams,
    activeTeam,
    quotaInfo,
    sessions,
    activeSession,
    messages: initialMessages,
    assistantType: initialAssistantType,
}: Props) {
    const [assistantType, setAssistantType] = useState<'project' | 'competition' | 'team' | 'document'>(
        activeSession?.assistant_type || initialAssistantType || 'project'
    );
    const [messages, setMessages] = useState<MessageItem[]>(initialMessages || []);
    const [inputMessage, setInputMessage] = useState('');
    const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [savedArtifactIndex, setSavedArtifactIndex] = useState<number | null>(null);
    const [isShared, setIsShared] = useState(activeSession?.session_type === 'shared');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync messages when activeSession changes
    useEffect(() => {
        setMessages(initialMessages || []);
        setIsShared(activeSession?.session_type === 'shared');
        if (activeSession?.assistant_type) {
            setAssistantType(activeSession.assistant_type);
        }
    }, [activeSession?.id, initialMessages]);

    // Auto scroll chat to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const getXsrfToken = () => {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
        return meta?.content || '';
    };

    // Handle New Conversation
    const handleNewConversation = (type = assistantType) => {
        if (!activeTeam) {
            alert('Pilih tim terlebih dahulu.');
            return;
        }
        if (quotaInfo?.is_exhausted) {
            alert('Kuota AI tim Anda sudah habis (10/10 percakapan). Quota akan direset otomatis setelah periode 5 hari berakhir.');
            return;
        }

        router.post(
            '/ai-workspace/sessions',
            {
                team_id: activeTeam.id,
                assistant_type: type,
                session_type: 'private',
                project_id: activeTeam.project?.id || null,
                competition_id: activeTeam.competitions?.[0]?.id || null,
            },
            {
                onError: (errors) => {
                    setErrorMsg(errors.quota || errors.error || 'Gagal memulai sesi baru.');
                },
            }
        );
    };

    // Handle Sending Message
    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const text = inputMessage.trim();
        if ((!text && !attachedFile) || isLoading) return;

        if (!activeSession) {
            // Automatically initialize a session if none open
            if (!activeTeam) {
                alert('Pilih tim terlebih dahulu untuk menggunakan AI Workspace.');
                return;
            }
            if (quotaInfo?.is_exhausted) {
                alert('Kuota AI tim Anda sudah habis (10/10 percakapan).');
                return;
            }

            setIsLoading(true);
            router.post(
                '/ai-workspace/sessions',
                {
                    team_id: activeTeam.id,
                    assistant_type: assistantType,
                    session_type: 'private',
                    project_id: activeTeam.project?.id || null,
                    competition_id: activeTeam.competitions?.[0]?.id || null,
                },
                {
                    onSuccess: () => {
                        // After redirect, message can be sent
                        setIsLoading(false);
                    },
                    onError: (errors) => {
                        setIsLoading(false);
                        setErrorMsg(errors.quota || errors.error || 'Gagal memulai percakapan.');
                    },
                }
            );
            return;
        }

        const userMsgContent = text;
        const currentFile = attachedFile;
        setInputMessage('');
        setAttachedFile(null);
        setErrorMsg(null);

        // Optimistically add user message
        const tempUserMsg: MessageItem = {
            id: Date.now(),
            role: 'user',
            content: userMsgContent + (currentFile ? `\n\n[Lampiran: ${currentFile.name}]` : ''),
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMsg]);
        setIsLoading(true);

        try {
            const res = await fetch(`/ai-workspace/sessions/${activeSession.id}/messages`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    message: userMsgContent,
                    file_content: currentFile ? currentFile.content : null,
                }),
            });

            const json = await res.json();

            if (res.ok && json.reply) {
                const assistantMsg: MessageItem = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: json.reply,
                    created_at: new Date().toISOString(),
                };
                setMessages((prev) => [...prev, assistantMsg]);
            } else {
                setErrorMsg(json.error || 'AI tidak dapat merespons saat ini. Silakan coba kembali.');
            }
        } catch {
            setErrorMsg('Terjadi kendala jaringan saat menghubungi AI.');
        } finally {
            setIsLoading(false);
        }
    };

    // File Upload Handler (for text, md, json, docx-extracted text)
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal untuk analisis AI adalah 2 MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            setAttachedFile({
                name: file.name,
                content: content.slice(0, 150000), // Safety cap
            });
        };
        reader.readAsText(file);
    };

    // Share Session with Team
    const handleShareSession = async () => {
        if (!activeSession) return;
        try {
            const res = await fetch(`/ai-workspace/sessions/${activeSession.id}/share`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });
            if (res.ok) {
                setIsShared(true);
                alert('Percakapan berhasil dibagikan ke seluruh anggota tim.');
            }
        } catch {
            alert('Gagal membagikan sesi.');
        }
    };

    // Save Output to Project Artifact
    const handleSaveArtifact = async (content: string, index: number) => {
        if (!activeSession) return;
        try {
            const title = prompt('Masukkan judul dokumen yang ingin disimpan ke Proyek:', 'Rekomendasi AI RAKIT');
            if (!title) return;

            const res = await fetch(`/ai-workspace/sessions/${activeSession.id}/artifact`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    title,
                    content,
                    artifact_type: assistantType === 'document' ? 'review' : 'document',
                    save_to_project: true,
                }),
            });

            if (res.ok) {
                setSavedArtifactIndex(index);
                setTimeout(() => setSavedArtifactIndex(null), 3000);
                alert('Dokumen berhasil disimpan ke artefak proyek!');
            }
        } catch {
            alert('Gagal menyimpan artefak.');
        }
    };

    // Copy Content
    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    // Delete Session
    const handleDeleteSession = (sessionId: number) => {
        if (!confirm('Hapus sesi percakapan ini? (Tindakan ini tidak dapat dibatalkan, dan kuota tidak akan dipulihkan)')) {
            return;
        }
        router.delete(`/ai-workspace/sessions/${sessionId}`);
    };

    const currentMeta = ASSISTANT_METADATA[assistantType];
    const AssistantIcon = currentMeta.icon;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Ruang Kerja Tim', href: '/workspace' },
        { title: 'AI Workspace', href: '/ai-workspace' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`RAKIT AI Workspace — ${currentMeta.title}`} />

            <div className="space-y-4 pt-1 max-w-[1600px] mx-auto">
                {/* Top Hub Bar: Team Selector & Quota Pill */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                            <Bot className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                                    RAKIT AI Workspace
                                </h1>
                                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Native Team AI
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-1">
                                Asisten cerdas terintegrasi untuk bimbingan proyek, persiapan lomba, dan review berkas.
                            </p>
                        </div>
                    </div>

                    {/* Team Selection Dropdown & Quota */}
                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        {teams.length > 0 && (
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-500 hidden md:inline">
                                    Tim Aktif:
                                </label>
                                <select
                                    value={activeTeam?.id || ''}
                                    onChange={(e) => {
                                        const tId = e.target.value;
                                        router.get(`/ai-workspace?team_id=${tId}&assistant=${assistantType}`);
                                    }}
                                    className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl px-3 py-2 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                                >
                                    {teams.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} {t.project ? `(${t.project.title})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Compact Quota Box */}
                        {quotaInfo && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                                <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                        Kuota AI Tim
                                    </div>
                                    <div className="text-xs font-black text-slate-800 tabular-nums">
                                        {quotaInfo.quota_used} / {quotaInfo.quota_limit} terpakai
                                    </div>
                                </div>
                                <div className="h-6 w-px bg-slate-200" />
                                <div className="text-[10px] text-slate-500">
                                    {quotaInfo.is_exhausted ? (
                                        <span className="font-bold text-rose-600">Habis</span>
                                    ) : (
                                        <span>
                                            <strong className="text-blue-600">{quotaInfo.quota_remaining}</strong> sisa
                                        </span>
                                    )}
                                    {quotaInfo.reset_in_seconds && (
                                        <div className="text-[9px] text-slate-400">
                                            Reset {Math.ceil(quotaInfo.reset_in_seconds / 86400)} hari
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3-Column Workspace Grid (Responsive) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* LEFT PANEL: Assistant Nav & Recent Sessions (3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Assistant Switcher */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-1 block">
                                Pilihan Asisten AI
                            </span>
                            {(Object.keys(ASSISTANT_METADATA) as Array<keyof typeof ASSISTANT_METADATA>).map((key) => {
                                const meta = ASSISTANT_METADATA[key];
                                const Icon = meta.icon;
                                const isCurrent = assistantType === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            setAssistantType(key);
                                            if (activeSession) {
                                                // If already in session, continue in current view
                                            } else if (activeTeam) {
                                                router.get(`/ai-workspace?team_id=${activeTeam.id}&assistant=${key}`);
                                            }
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                                            isCurrent
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                        }`}
                                    >
                                        <Icon className={`size-4 shrink-0 ${isCurrent ? 'text-white' : 'text-slate-400'}`} />
                                        <span className="truncate flex-1">{meta.title}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Recent History & New Conversation Action */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Riwayat Percakapan
                                </span>
                                <Link
                                    href="/ai-workspace/history"
                                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    <span>Semua</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </div>

                            {/* New Conversation Button */}
                            <button
                                type="button"
                                onClick={() => handleNewConversation()}
                                disabled={quotaInfo?.is_exhausted}
                                className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                                    quotaInfo?.is_exhausted
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                                title={quotaInfo?.is_exhausted ? 'Kuota AI Tim telah habis (10/10).' : 'Buat percakapan baru'}
                            >
                                <Plus className="size-3.5" />
                                <span>Mulai Percakapan Baru</span>
                            </button>

                            {/* Session List */}
                            <div className="space-y-1 max-h-[360px] overflow-y-auto no-scrollbar">
                                {sessions.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-slate-400">
                                        Belum ada percakapan. Mulai sekarang untuk berdiskusi dengan AI!
                                    </div>
                                ) : (
                                    sessions.map((sess) => {
                                        const isSelected = activeSession?.id === sess.id;
                                        return (
                                            <div
                                                key={sess.id}
                                                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold'
                                                        : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                                <Link
                                                    href={`/ai-workspace?team_id=${activeTeam?.id}&assistant=${sess.assistant_type}&session_id=${sess.id}`}
                                                    className="flex-1 truncate pr-2"
                                                >
                                                    <div className="truncate">{sess.title}</div>
                                                    <div className="text-[10px] text-slate-400 font-normal capitalize">
                                                        {sess.assistant_type} • {sess.session_type}
                                                    </div>
                                                </Link>
                                                {sess.is_own && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSession(sess.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                                                        title="Hapus sesi"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CENTER PANEL: Chat & Interaction (6 cols) */}
                    <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col h-[680px]">
                        {/* Chat Header */}
                        <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`p-2 rounded-xl border ${currentMeta.badgeCls}`}>
                                    <AssistantIcon className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                        {activeSession?.title || currentMeta.title}
                                    </h2>
                                    <p className="text-[11px] text-slate-500 truncate">
                                        {currentMeta.subtitle}
                                    </p>
                                </div>
                            </div>

                            {/* Session Actions (Share / Privacy) */}
                            {activeSession && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isShared ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <Users className="size-3" />
                                            <span>Dibagikan ke Tim</span>
                                        </span>
                                    ) : (
                                        activeSession.is_own && (
                                            <button
                                                type="button"
                                                onClick={handleShareSession}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                                title="Bagikan percakapan ini ke semua anggota tim"
                                            >
                                                <Share2 className="size-3" />
                                                <span>Bagikan</span>
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Error Banner */}
                        {errorMsg && (
                            <div className="mx-3 mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                                <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Messages Scroll Area */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto p-4 space-y-4">
                                    <div className="size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80">
                                        <AssistantIcon className="size-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">{currentMeta.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Siap membantu tim Anda. Ajukan pertanyaan atau pilih salah satu rekomendasi topik di bawah:
                                        </p>
                                    </div>
                                    <div className="w-full space-y-2 text-left">
                                        {currentMeta.suggestedPrompts.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setInputMessage(prompt);
                                                    textareaRef.current?.focus();
                                                }}
                                                className="w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs text-left transition cursor-pointer"
                                            >
                                                💡 {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isUser = msg.role === 'user';
                                    return (
                                        <div
                                            key={msg.id || index}
                                            className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {!isUser && (
                                                <div className="size-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                                                    <Bot className="size-4" />
                                                </div>
                                            )}

                                            <div
                                                className={`max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed ${
                                                    isUser
                                                        ? 'bg-blue-600 text-white rounded-tr-xs shadow-2xs'
                                                        : 'bg-slate-100/90 text-slate-800 rounded-tl-xs border border-slate-200/70'
                                                }`}
                                            >
                                                <div className="whitespace-pre-wrap select-text">{msg.content}</div>

                                                {/* Assistant Message Actions */}
                                                {!isUser && (
                                                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center gap-2 text-[10px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopy(msg.content, index)}
                                                            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                                        >
                                                            {copiedIndex === index ? (
                                                                <>
                                                                    <Check className="size-3 text-emerald-600" />
                                                                    <span className="text-emerald-600 font-bold">Tersalin</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Copy className="size-3" />
                                                                    <span>Salin</span>
                                                                </>
                                                            )}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveArtifact(msg.content, index)}
                                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition cursor-pointer"
                                                            title="Simpan ke Artefak / Dokumen Proyek"
                                                        >
                                                            {savedArtifactIndex === index ? (
                                                                <Check className="size-3 text-emerald-600" />
                                                            ) : (
                                                                <FileText className="size-3" />
                                                            )}
                                                            <span>Simpan ke Proyek</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {isUser && (
                                                <div className="size-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                                                    <User className="size-4" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}

                            {isLoading && (
                                <div className="flex gap-2.5 items-center text-xs text-slate-500">
                                    <div className="size-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                                        <Bot className="size-4" />
                                    </div>
                                    <div className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center gap-2">
                                        <RefreshCw className="size-3.5 animate-spin text-blue-600" />
                                        <span>RAKIT AI sedang berpikir & menyusun rekomendasi...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* File Attachment Pill Preview */}
                        {attachedFile && (
                            <div className="mx-3 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-800">
                                <div className="flex items-center gap-2 truncate">
                                    <FileCode className="size-3.5 shrink-0" />
                                    <span className="truncate font-semibold">{attachedFile.name}</span>
                                    <span className="text-[10px] text-blue-500">
                                        ({Math.round(attachedFile.content.length / 1024)} KB teks terbaca)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAttachedFile(null)}
                                    className="p-1 hover:text-rose-600"
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        )}

                        {/* Chat Input Box */}
                        <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 rounded-b-2xl">
                            <form onSubmit={handleSendMessage} className="space-y-2">
                                <div className="flex items-end gap-2 bg-white border border-slate-300 rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".txt,.md,.json,.csv,.doc,.docx,.pdf"
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                        title="Lampirkan dokumen teks untuk direview"
                                    >
                                        <Paperclip className="size-4" />
                                    </button>

                                    <textarea
                                        ref={textareaRef}
                                        rows={2}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder={`Tulis pertanyaan ke ${currentMeta.title}... (Tekan Enter untuk kirim)`}
                                        className="flex-1 bg-transparent border-0 focus:outline-hidden text-xs text-slate-800 placeholder:text-slate-400 resize-none py-1.5"
                                    />

                                    <button
                                        type="submit"
                                        disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
                                        className={`p-2 rounded-lg transition cursor-pointer shrink-0 ${
                                            (!inputMessage.trim() && !attachedFile) || isLoading
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                                        }`}
                                    >
                                        <Send className="size-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                                    <span>Gunakan Shift + Enter untuk baris baru</span>
                                    <span>Mendukung lampiran teks & kode</span>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Active Project Context & Permissions (3 cols) */}
                    <div className="lg:col-span-3 space-y-4">
                        {/* Context Card */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3.5 text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Konteks Aktif Tim
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    Live Data
                                </span>
                            </div>

                            {activeTeam ? (
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-[10px] text-slate-400">Tim:</div>
                                        <div className="font-bold text-slate-900">{activeTeam.name}</div>
                                    </div>

                                    {activeTeam.project && (
                                        <div>
                                            <div className="text-[10px] text-slate-400">Proyek Terhubung:</div>
                                            <Link
                                                href={`/projects/${activeTeam.project.slug || activeTeam.project.id}`}
                                                className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <span>{activeTeam.project.title}</span>
                                                <ArrowRight className="size-3" />
                                            </Link>
                                        </div>
                                    )}

                                    {activeTeam.competitions && activeTeam.competitions.length > 0 && (
                                        <div>
                                            <div className="text-[10px] text-slate-400">Kompetisi Target:</div>
                                            <div className="space-y-1 mt-1">
                                                {activeTeam.competitions.map((c) => (
                                                    <Link
                                                        key={c.id}
                                                        href={`/competitions/${c.slug || c.id}`}
                                                        className="block text-xs font-semibold text-slate-800 hover:text-blue-600"
                                                    >
                                                        🏆 {c.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="text-[10px] text-slate-400 mb-1">Anggota Tim Terdaftar:</div>
                                        <div className="text-slate-600 font-medium">
                                            {activeTeam.members?.length || 1} Mahasiswa
                                        </div>
                                    </div>

                                    {/* Direct links to workspace */}
                                    <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                                        <Link
                                            href={`/workspace/${activeTeam.id}`}
                                            className="w-full py-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
                                        >
                                            <Kanban className="size-3 text-slate-400" />
                                            <span>Buka Board Kanban Tim</span>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-400 text-center py-4">
                                    Belum ada tim aktif yang dipilih.
                                </div>
                            )}
                        </div>

                        {/* Privacy & Guardrail Notice */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                                <Shield className="size-3.5 text-blue-600" />
                                <span>Privasi & Integritas AI</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-500">
                                AI hanya memberikan rekomendasi dan saran. Data tim, anggota, tugas, dan berkas tidak akan diubah secara otomatis tanpa konfirmasi pengguna.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
