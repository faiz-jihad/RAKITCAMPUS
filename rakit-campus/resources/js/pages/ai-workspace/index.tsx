import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Award,
    BookOpen,
    Bot,
    Calendar,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Copy,
    ExternalLink,
    FileCode,
    FileText,
    FolderKanban,
    Kanban,
    Layers,
    ListChecks,
    Loader2,
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
    User,
    Users,
    X,
    Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// --- Interfaces ---
interface TeamItem {
    id: number;
    name: string;
    type: string;
    project?: { id: number; title: string; slug: string } | null;
    competitions?: Array<{ id: number; name: string; slug: string }>;
    members?: Array<{ id: number; role_name?: string }>;
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

interface AgenticAction {
    type: 'create_tasks' | 'create_sprint' | 'save_to_proposal' | 'create_checklist';
    title: string;
    payload: any;
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
        subtitle: 'Brainstorming ide, problem statement, arsitektur teknis, dan roadmap pengembangan fitur.',
        icon: FolderKanban,
        accent: 'blue',
        gradient: 'from-blue-600 to-indigo-600',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
        suggestedPrompts: [
            'Bantu susun Problem Statement yang tajam untuk proyek kami.',
            'Buatkan rincian 5 tugas teknis MVP untuk diterapkan ke Kanban tim.',
            'Evaluasi kelayakan arsitektur stack yang kami gunakan.',
            'Rekomendasikan metodologi riset pengguna yang tepat.',
        ],
    },
    competition: {
        title: 'Competition Assistant',
        subtitle: 'Analisis syarat lomba, kriteria eligibilitas, checklist pendaftaran, dan strategi juara.',
        icon: Trophy,
        accent: 'amber',
        gradient: 'from-amber-500 to-orange-600',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200/80',
        suggestedPrompts: [
            'Apa saja berkas wajib dan checklist pendaftaran kompetisi kami?',
            'Bagaimana menyelaraskan solusi kami dengan kriteria penilaian juri?',
            'Rekomendasikan timeline persiapan pitch deck & dokumen proposal.',
            'Analisis potensi keunikan kompetitif solusi kami.',
        ],
    },
    team: {
        title: 'Team Assistant',
        subtitle: 'Distribusi peran, alokasi beban tugas, deteksi hambatan, dan sprint planning tim.',
        icon: Users,
        accent: 'emerald',
        gradient: 'from-emerald-600 to-teal-600',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        suggestedPrompts: [
            'Rekomendasikan pembagian peran optimal untuk anggota tim kami.',
            'Buatkan rencana Sprint 2 minggu dan pecah menjadi tugas-tugas Kanban.',
            'Bantu identifikasi potensi bottleneck dalam pengerjaan proyek.',
            'Saran format standup mingguan yang efektif agar progres transparan.',
        ],
    },
    document: {
        title: 'Document Reviewer',
        subtitle: 'Bedah proposal, abstrak, laporan teknis, dan evaluasi kesesuaian terhadap rubrik juri.',
        icon: BookOpen,
        accent: 'purple',
        gradient: 'from-purple-600 to-pink-600',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200/80',
        suggestedPrompts: [
            'Review draft abstrak proposal kami berikut dan beri saran perbaikan.',
            'Cek apakah ada bagian krusial yang terlewat dalam dokumen ini.',
            'Tingkatkan keterbacaan, kejelasan argumen, dan bobot akademik teks ini.',
            'Evaluasi kekuatan latar belakang masalah dan justifikasi urgensi.',
        ],
    },
};

// --- Helper to extract agentic action from text ---
function parseAgenticAction(content: string): { cleanContent: string; action: AgenticAction | null } {
    const actionMatch = content.match(/```json:action\s*([\s\S]*?)\s*```/);
    if (actionMatch) {
        try {
            const parsed = JSON.parse(actionMatch[1]);
            const cleanContent = content.replace(actionMatch[0], '').trim();
            return {
                cleanContent,
                action: {
                    type: parsed.type,
                    title: parsed.title || 'Tindakan Disarankan AI',
                    payload: parsed.payload || parsed,
                },
            };
        } catch {
            // Fallback if parsing fails
        }
    }

    // Secondary attempt for standard json block with recognized type
    const jsonMatch = content.match(/```(?:json)?\s*(\{\s*"type"\s*:\s*"(?:create_tasks|create_sprint|save_to_proposal|create_checklist)"[\s\S]*?\})\s*```/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1]);
            const cleanContent = content.replace(jsonMatch[0], '').trim();
            return {
                cleanContent,
                action: {
                    type: parsed.type,
                    title: parsed.title || 'Tindakan Disarankan AI',
                    payload: parsed.payload || parsed,
                },
            };
        } catch {
            // Ignore
        }
    }

    return { cleanContent: content, action: null };
}

// --- Simple clean markdown formatter component ---
function MarkdownRenderer({ content }: { content: string }) {
    const lines = content.split('\n');

    return (
        <div className="space-y-2 leading-relaxed text-slate-800 dark:text-slate-100 select-text">
            {lines.map((line, idx) => {
                const trimmed = line.trim();

                // Empty line
                if (!trimmed) {
                    return <div key={idx} className="h-1.5" />;
                }

                // Header 3
                if (trimmed.startsWith('### ')) {
                    return (
                        <h4 key={idx} className="text-sm font-bold text-slate-900 dark:text-white pt-2 pb-0.5">
                            {trimmed.slice(4)}
                        </h4>
                    );
                }

                // Header 2
                if (trimmed.startsWith('## ')) {
                    return (
                        <h3 key={idx} className="text-base font-extrabold text-slate-900 dark:text-white pt-3 pb-1 border-b border-slate-100 dark:border-slate-800">
                            {trimmed.slice(3)}
                        </h3>
                    );
                }

                // Header 1
                if (trimmed.startsWith('# ')) {
                    return (
                        <h2 key={idx} className="text-lg font-black text-slate-900 dark:text-white pt-3 pb-1">
                            {trimmed.slice(2)}
                        </h2>
                    );
                }

                // Unordered list item
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const itemText = trimmed.slice(2);
                    return (
                        <div key={idx} className="flex items-start gap-2 pl-1">
                            <span className="size-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                            <span className="flex-1">{formatInline(itemText)}</span>
                        </div>
                    );
                }

                // Numbered list item
                const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
                if (numMatch) {
                    return (
                        <div key={idx} className="flex items-start gap-2 pl-1">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 min-w-[18px]">
                                {numMatch[1]}.
                            </span>
                            <span className="flex-1">{formatInline(numMatch[2])}</span>
                        </div>
                    );
                }

                // Blockquote
                if (trimmed.startsWith('> ')) {
                    return (
                        <div key={idx} className="border-l-3 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 px-3 py-1.5 rounded-r-lg text-xs italic text-slate-700 dark:text-slate-300">
                            {formatInline(trimmed.slice(2))}
                        </div>
                    );
                }

                // Regular paragraph
                return <p key={idx}>{formatInline(line)}</p>;
            })}
        </div>
    );
}

// Inline formatting (bold, code, links)
function formatInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    // Pattern for **bold** and `code`
    const regex = /(\*\*.*?\*\*|`.*?`)/;

    while (remaining.length > 0) {
        const match = remaining.match(regex);
        if (!match || match.index === undefined) {
            parts.push(remaining);
            break;
        }

        if (match.index > 0) {
            parts.push(remaining.substring(0, match.index));
        }

        const matchedText = match[0];
        if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
            parts.push(
                <strong key={keyIdx++} className="font-bold text-slate-900 dark:text-white">
                    {matchedText.slice(2, -2)}
                </strong>
            );
        } else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
            parts.push(
                <code key={keyIdx++} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-blue-700 dark:text-blue-300 border border-slate-200/60 dark:border-slate-700">
                    {matchedText.slice(1, -1)}
                </code>
            );
        }

        remaining = remaining.substring(match.index + matchedText.length);
    }

    return parts;
}

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
    const [successToast, setSuccessToast] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [isShared, setIsShared] = useState(activeSession?.session_type === 'shared');

    // Executing action state
    const [executingActionId, setExecutingActionId] = useState<string | null>(null);
    const [executedActions, setExecutedActions] = useState<Record<string, { success: boolean; message: string }>>({});

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
            alert('Kuota AI tim Anda sudah habis (10/10 percakapan). Kuota akan direset otomatis setelah periode 5 hari berakhir.');
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
    const handleSendMessage = async (customPrompt?: string) => {
        const text = (customPrompt ?? inputMessage).trim();
        if ((!text && !attachedFile) || isLoading) return;

        if (!activeSession) {
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
            content: userMsgContent + (currentFile ? `\n\n[Lampiran Dokumen: ${currentFile.name}]` : ''),
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

    // Execute Agentic Action (Real DB Mutation with user confirmation)
    const handleExecuteAction = async (action: AgenticAction, actionKey: string) => {
        if (!activeSession) return;

        setExecutingActionId(actionKey);
        try {
            const res = await fetch(`/ai-workspace/sessions/${activeSession.id}/execute-action`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
                body: JSON.stringify({
                    action_type: action.type,
                    payload: action.payload,
                }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setExecutedActions((prev) => ({
                    ...prev,
                    [actionKey]: { success: true, message: data.message || 'Berhasil diterapkan!' },
                }));
                setSuccessToast(data.message || 'Tindakan berhasil diterapkan ke Workspace Tim!');
                setTimeout(() => setSuccessToast(null), 5000);
            } else {
                alert(data.error || 'Gagal menerapkan aksi ke workspace.');
            }
        } catch {
            alert('Terjadi kesalahan jaringan saat menerapkan aksi.');
        } finally {
            setExecutingActionId(null);
        }
    };

    // Quick trigger: prompt AI to generate agentic action from existing message
    const handleQuickExtractTasks = (sourceMessage: string) => {
        const prompt = `Berdasarkan rekomendasi di atas, buatkan SATU blok json:action create_tasks yang berisi minimal 3-5 tugas teknis terstruktur dengan title, description, priority (urgent|high|medium|low), dan recommended_role agar dapat langsung saya terapkan ke papan Kanban tim.`;
        handleSendMessage(prompt);
    };

    const handleQuickCreateSprint = (sourceMessage: string) => {
        const prompt = `Berdasarkan hasil diskusi di atas, formulasikan rencana Sprint baru dengan blok json:action create_sprint lengkap dengan title, description, dan estimated_days agar dapat langsung saya jadikan milestone tim.`;
        handleSendMessage(prompt);
    };

    // File Upload Handler
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
                content: content.slice(0, 150000),
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
                setSuccessToast('Percakapan berhasil dibagikan ke seluruh anggota tim!');
                setTimeout(() => setSuccessToast(null), 3000);
            }
        } catch {
            alert('Gagal membagikan sesi.');
        }
    };

    // Save Output to Project Artifact
    const handleSaveArtifact = async (content: string) => {
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
                setSuccessToast('Dokumen berhasil disimpan ke artefak proyek!');
                setTimeout(() => setSuccessToast(null), 3000);
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

            {/* Success Toast */}
            {successToast && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span>{successToast}</span>
                </div>
            )}

            <div className="space-y-4 pt-1 max-w-[1600px] mx-auto">
                {/* Modern Organic Top Header Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 p-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl shadow-xs transition-all">
                    <div className="flex items-center gap-3.5">
                        <div className={`size-11 rounded-2xl bg-gradient-to-tr ${currentMeta.gradient} text-white flex items-center justify-center shadow-md shadow-blue-500/10 shrink-0`}>
                            <Bot className="size-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                                    RAKIT AI Workspace
                                </h1>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/90 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    <Sparkles className="size-2.5 text-blue-600" />
                                    Agentic Copilot
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                Asisten cerdas dengan eksekusi tugas otomatis ke Kanban, Sprint, dan Dokumen Proyek.
                            </p>
                        </div>
                    </div>

                    {/* Team Selection Dropdown & Quota Pill */}
                    <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                        {teams.length > 0 && (
                            <div className="flex items-center gap-1.5 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-1 pr-2">
                                <span className="text-[11px] font-semibold text-slate-400 pl-2 hidden sm:inline">
                                    Tim:
                                </span>
                                <select
                                    value={activeTeam?.id || ''}
                                    onChange={(e) => {
                                        const tId = e.target.value;
                                        router.get(`/ai-workspace?team_id=${tId}&assistant=${assistantType}`);
                                    }}
                                    className="text-xs font-bold text-slate-800 bg-transparent rounded-xl px-2 py-1.5 cursor-pointer focus:outline-hidden"
                                >
                                    {teams.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.name} {t.project ? `(${t.project.title})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Quota Pill */}
                        {quotaInfo && (
                            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                                <div>
                                    <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                        Kuota AI Tim
                                    </div>
                                    <div className="text-xs font-black text-slate-800 tabular-nums">
                                        {quotaInfo.quota_used} / {quotaInfo.quota_limit} sesi
                                    </div>
                                </div>
                                <div className="h-5 w-px bg-slate-200" />
                                <div className="text-[10px] text-slate-500">
                                    {quotaInfo.is_exhausted ? (
                                        <span className="font-bold text-rose-600">Habis</span>
                                    ) : (
                                        <span>
                                            <strong className="text-blue-600 font-bold">{quotaInfo.quota_remaining}</strong> sisa
                                        </span>
                                    )}
                                    {quotaInfo.reset_in_seconds && (
                                        <div className="text-[9px] text-slate-400">
                                            Reset {Math.ceil(quotaInfo.reset_in_seconds / 86400)}h
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3-Column Clean Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                    {/* LEFT PANEL: Assistant Nav & Session History (3 cols) */}
                    <div className="lg:col-span-3 space-y-3.5">
                        {/* Assistant Modes Card */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-3.5 shadow-xs space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-1 block">
                                Mode Asisten AI
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
                                            if (!activeSession && activeTeam) {
                                                router.get(`/ai-workspace?team_id=${activeTeam.id}&assistant=${key}`);
                                            }
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                                            isCurrent
                                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-xl shrink-0 ${isCurrent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                            <Icon className="size-4" />
                                        </div>
                                        <span className="truncate flex-1">{meta.title}</span>
                                        {isCurrent && <ChevronRight className="size-3.5 text-white/80 shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Recent History & New Conversation Action */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-3.5 shadow-xs space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Riwayat Percakapan
                                </span>
                                <Link
                                    href="/ai-workspace/history"
                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
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
                                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                    quotaInfo?.is_exhausted
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md'
                                }`}
                                title={quotaInfo?.is_exhausted ? 'Kuota AI Tim telah habis (10/10).' : 'Buat percakapan baru'}
                            >
                                <Plus className="size-4" />
                                <span>Mulai Percakapan Baru</span>
                            </button>

                            {/* Session List */}
                            <div className="space-y-1.5 max-h-[340px] overflow-y-auto no-scrollbar">
                                {sessions.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-slate-400 px-2">
                                        Belum ada riwayat diskusi. Mulai percakapan untuk berkolaborasi dengan AI!
                                    </div>
                                ) : (
                                    sessions.map((sess) => {
                                        const isSelected = activeSession?.id === sess.id;
                                        return (
                                            <div
                                                key={sess.id}
                                                className={`group flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-blue-50/80 border border-blue-200 text-blue-900 font-bold'
                                                        : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                                <Link
                                                    href={`/ai-workspace?team_id=${activeTeam?.id}&assistant=${sess.assistant_type}&session_id=${sess.id}`}
                                                    className="flex-1 truncate pr-2"
                                                >
                                                    <div className="truncate font-semibold text-slate-800">{sess.title}</div>
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
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CENTER PANEL: Conversational Area & Agentic Execution (6 cols) */}
                    <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl shadow-xs flex flex-col h-[740px] overflow-hidden">
                        {/* Chat Header */}
                        <div className="px-4 py-3.5 border-b border-slate-200/70 flex items-center justify-between gap-3 bg-white/70 backdrop-blur-xs">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2 rounded-2xl border ${currentMeta.badgeBg}`}>
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

                            {/* Session Actions (Share / Live Status) */}
                            {activeSession && (
                                <div className="flex items-center gap-2 shrink-0">
                                    {isShared ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            <Users className="size-3" />
                                            <span>Dibagikan ke Tim</span>
                                        </span>
                                    ) : (
                                        activeSession.is_own && (
                                            <button
                                                type="button"
                                                onClick={handleShareSession}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
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
                            <div className="mx-4 mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="size-4 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                                <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700">
                                    <X className="size-4" />
                                </button>
                            </div>
                        )}

                        {/* Messages Scroll Area */}
                        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-5 text-xs">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-4 space-y-4">
                                    <div className={`size-14 rounded-3xl bg-gradient-to-tr ${currentMeta.gradient} text-white flex items-center justify-center shadow-lg shadow-blue-500/10`}>
                                        <AssistantIcon className="size-7" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900">{currentMeta.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                            {currentMeta.subtitle} Ajukan pertanyaan atau gunakan rekomendasi topik berikut:
                                        </p>
                                    </div>
                                    <div className="w-full space-y-2 text-left pt-2">
                                        {currentMeta.suggestedPrompts.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setInputMessage(prompt);
                                                    textareaRef.current?.focus();
                                                }}
                                                className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 text-slate-700 hover:text-blue-700 text-xs font-medium text-left transition-all cursor-pointer flex items-center gap-2 group"
                                            >
                                                <Sparkles className="size-3.5 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
                                                <span className="flex-1">{prompt}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isUser = msg.role === 'user';
                                    const { cleanContent, action } = isUser ? { cleanContent: msg.content, action: null } : parseAgenticAction(msg.content);
                                    const actionKey = `action-${msg.id || index}`;
                                    const isExecuting = executingActionId === actionKey;
                                    const executedResult = executedActions[actionKey];

                                    return (
                                        <div
                                            key={msg.id || index}
                                            className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                                        >
                                            {!isUser && (
                                                <div className={`size-8 rounded-2xl bg-gradient-to-tr ${currentMeta.gradient} text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs`}>
                                                    <Bot className="size-4" />
                                                </div>
                                            )}

                                            <div className="max-w-[88%] space-y-2.5">
                                                {/* Conversational Bubble */}
                                                <div
                                                    className={`rounded-3xl px-4.5 py-3.5 leading-relaxed text-xs shadow-2xs ${
                                                        isUser
                                                            ? 'bg-blue-600 text-white rounded-tr-xs'
                                                            : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
                                                    }`}
                                                >
                                                    {isUser ? (
                                                        <div className="whitespace-pre-wrap select-text">{cleanContent}</div>
                                                    ) : (
                                                        <MarkdownRenderer content={cleanContent} />
                                                    )}

                                                    {/* Assistant Message Quick Bar */}
                                                    {!isUser && (
                                                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCopy(cleanContent, index)}
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
                                                                    onClick={() => handleSaveArtifact(cleanContent)}
                                                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition cursor-pointer"
                                                                >
                                                                    <FileText className="size-3" />
                                                                    <span>Simpan ke Proyek</span>
                                                                </button>
                                                            </div>

                                                            {/* Quick Agentic Prompters (if no action attached) */}
                                                            {!action && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickExtractTasks(cleanContent)}
                                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 font-semibold transition cursor-pointer"
                                                                        title="Ekstrak saran ini menjadi tugas Kanban otomatis"
                                                                    >
                                                                        <Zap className="size-2.5 text-blue-600" />
                                                                        <span>Jadikan Kanban</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickCreateSprint(cleanContent)}
                                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 font-semibold transition cursor-pointer"
                                                                        title="Jadikan saran ini Sprint baru di roadmap"
                                                                    >
                                                                        <Calendar className="size-2.5 text-emerald-600" />
                                                                        <span>Jadikan Sprint</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Agentic Action Execution Card */}
                                                {!isUser && action && (
                                                    <div className="rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 p-3.5 shadow-sm space-y-2.5 transition-all">
                                                        <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-blue-100">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="p-1 rounded-lg bg-blue-600 text-white">
                                                                    <Zap className="size-3" />
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-900">
                                                                    {action.title}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                                                                Siap Diterapkan
                                                            </span>
                                                        </div>

                                                        {/* Action Payload Preview */}
                                                        {action.type === 'create_tasks' && Array.isArray(action.payload?.tasks) && (
                                                            <div className="space-y-1.5">
                                                                <div className="text-[11px] font-medium text-slate-600">
                                                                    Rincian Tugas yang Akan Ditambahkan ke Board Tim ({action.payload.tasks.length} item):
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                                                    {action.payload.tasks.map((task: any, tIdx: number) => (
                                                                        <div
                                                                            key={tIdx}
                                                                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-200/80 text-xs shadow-2xs"
                                                                        >
                                                                            <div className="min-w-0 flex items-center gap-2">
                                                                                <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                                                                                <span className="font-semibold text-slate-800 truncate">
                                                                                    {task.title}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 shrink-0">
                                                                                {task.recommended_role && (
                                                                                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                                                        {task.recommended_role}
                                                                                    </span>
                                                                                )}
                                                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                                                                                    task.priority === 'urgent' || task.priority === 'high'
                                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                                                }`}>
                                                                                    {task.priority || 'medium'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {action.type === 'create_sprint' && (
                                                            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1 text-xs">
                                                                <div className="font-bold text-slate-900">{action.payload?.title}</div>
                                                                <div className="text-[11px] text-slate-600">{action.payload?.description}</div>
                                                                <div className="text-[10px] text-slate-400">
                                                                    Estimasi Durasi: {action.payload?.estimated_days || 14} Hari
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Execution Button / Result Banner */}
                                                        {executedResult ? (
                                                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                                                                <div className="flex items-center gap-2">
                                                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                                                    <span className="font-bold">{executedResult.message}</span>
                                                                </div>
                                                                {activeTeam && (
                                                                    <Link
                                                                        href={`/workspace/${activeTeam.id}`}
                                                                        className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                                                                    >
                                                                        <span>Buka Board</span>
                                                                        <ExternalLink className="size-3" />
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-2 pt-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleExecuteAction(action, actionKey)}
                                                                    disabled={isExecuting}
                                                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
                                                                >
                                                                    {isExecuting ? (
                                                                        <>
                                                                            <Loader2 className="size-3.5 animate-spin" />
                                                                            <span>Menerapkan ke Workspace...</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Zap className="size-3.5" />
                                                                            <span>Konfirmasi & Terapkan ke Workspace Tim</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {isUser && (
                                                <div className="size-8 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                                                    <User className="size-4" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}

                            {isLoading && (
                                <div className="flex gap-3 items-center text-xs text-slate-500">
                                    <div className={`size-8 rounded-2xl bg-gradient-to-tr ${currentMeta.gradient} text-white flex items-center justify-center shrink-0 animate-pulse`}>
                                        <Bot className="size-4" />
                                    </div>
                                    <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
                                        <RefreshCw className="size-3.5 animate-spin text-blue-600" />
                                        <span className="font-medium">RAKIT AI sedang berpikir & menyusun solusi...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* File Attachment Pill Preview */}
                        {attachedFile && (
                            <div className="mx-4 mb-2 px-3.5 py-2 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-800">
                                <div className="flex items-center gap-2 truncate">
                                    <FileCode className="size-4 shrink-0 text-blue-600" />
                                    <span className="truncate font-semibold">{attachedFile.name}</span>
                                    <span className="text-[10px] text-blue-500">
                                        ({Math.round(attachedFile.content.length / 1024)} KB teks)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAttachedFile(null)}
                                    className="p-1 hover:text-rose-600 cursor-pointer"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Modern Floating Chat Input Box */}
                        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="space-y-2"
                            >
                                <div className="flex items-end gap-2 bg-white border border-slate-200/90 rounded-2xl p-2 shadow-xs focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
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
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                                        title="Lampirkan dokumen teks untuk direview"
                                    >
                                        <Paperclip className="size-4" />
                                    </button>

                                    <textarea
                                        ref={textareaRef}
                                        rows={1}
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder={`Tanya ${currentMeta.title}... (Tekan Enter untuk kirim)`}
                                        className="flex-1 bg-transparent border-0 focus:outline-hidden text-xs text-slate-800 placeholder:text-slate-400 resize-none py-2 px-1 max-h-32"
                                    />

                                    <button
                                        type="submit"
                                        disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
                                        className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                                            (!inputMessage.trim() && !attachedFile) || isLoading
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20'
                                        }`}
                                    >
                                        <Send className="size-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 px-2">
                                    <span>Gunakan <kbd className="font-mono bg-slate-100 px-1 py-0.5 rounded">Shift + Enter</kbd> untuk baris baru</span>
                                    <span>Mendukung eksekusi tindakan & lampiran dokumen</span>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Live Active Context & Safety Guardrail (3 cols) */}
                    <div className="lg:col-span-3 space-y-3.5">
                        {/* Live Context Card */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs space-y-3 text-xs">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Konteks Live Tim
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    Terhubung
                                </span>
                            </div>

                            {activeTeam ? (
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-medium">Tim Aktif:</div>
                                        <div className="font-bold text-slate-900 text-sm mt-0.5">{activeTeam.name}</div>
                                    </div>

                                    {activeTeam.project && (
                                        <div className="p-2.5 rounded-2xl bg-blue-50/50 border border-blue-100">
                                            <div className="text-[10px] text-blue-600 font-semibold">Proyek Terkait:</div>
                                            <Link
                                                href={`/projects/${activeTeam.project.slug || activeTeam.project.id}`}
                                                className="font-bold text-slate-800 hover:text-blue-600 hover:underline flex items-center justify-between gap-1 mt-0.5"
                                            >
                                                <span className="truncate">{activeTeam.project.title}</span>
                                                <ArrowRight className="size-3 text-blue-600 shrink-0" />
                                            </Link>
                                        </div>
                                    )}

                                    {activeTeam.competitions && activeTeam.competitions.length > 0 && (
                                        <div className="p-2.5 rounded-2xl bg-amber-50/50 border border-amber-100">
                                            <div className="text-[10px] text-amber-700 font-semibold">Target Kompetisi:</div>
                                            <div className="space-y-1 mt-1">
                                                {activeTeam.competitions.map((c) => (
                                                    <Link
                                                        key={c.id}
                                                        href={`/competitions/${c.slug || c.id}`}
                                                        className="block text-xs font-bold text-slate-800 hover:text-amber-800 truncate"
                                                    >
                                                        🏆 {c.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                                        <span className="text-[11px]">Anggota Tim:</span>
                                        <span className="font-bold text-slate-800">{activeTeam.members?.length || 1} Mahasiswa</span>
                                    </div>

                                    {/* Direct Kanban Shortcut */}
                                    <Link
                                        href={`/workspace/${activeTeam.id}`}
                                        className="w-full py-2 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                                    >
                                        <Kanban className="size-3.5" />
                                        <span>Buka Papan Kanban Tim</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className="text-slate-400 text-center py-6 text-xs">
                                    Belum ada tim aktif yang dipilih.
                                </div>
                            )}
                        </div>

                        {/* Safety & Agentic Guardrail Notice */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-4 space-y-2 text-xs text-slate-600">
                            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                                <Shield className="size-4 text-blue-600" />
                                <span>Agentic Safety Guardrail</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-500">
                                RAKIT AI dapat merekomendasikan dan memformulasikan tugas teknis secara otomatis, namun data tugas dan roadmap tim <strong>tidak akan pernah diterapkan tanpa klik konfirmasi Anda</strong>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
