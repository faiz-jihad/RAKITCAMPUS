import AppLayout from '@/layouts/app-layout';
import { useLocale } from '@/hooks/use-locale';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    Bot,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Copy,
    Crown,
    ExternalLink,
    FileCode,
    FileText,
    FolderKanban,
    Kanban,
    Loader2,
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
import React, { useEffect, useRef, useState } from 'react';

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
    plan_name?: string;
    is_pro?: boolean;
    tier_label?: string;
    has_bonus?: boolean;
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
        subtitle: 'Diskusi ide inovasi, arsitektur teknis, dan roadmap fitur proyek.',
        icon: FolderKanban,
        badgeBg: 'bg-blue-50 text-blue-600 border-blue-200/60',
        suggestedPrompts: [
            'Bantu susun Problem Statement yang tajam untuk proyek kami.',
            'Buatkan rincian 5 tugas teknis MVP untuk diterapkan ke Kanban tim.',
            'Evaluasi kelayakan arsitektur stack yang kami gunakan.',
            'Rekomendasikan metodologi riset pengguna yang tepat.',
        ],
    },
    competition: {
        title: 'Competition Assistant',
        subtitle: 'Analisis syarat lomba, kriteria eligibilitas, dan checklist berkas.',
        icon: Trophy,
        badgeBg: 'bg-amber-50 text-amber-600 border-amber-200/60',
        suggestedPrompts: [
            'Apa saja berkas wajib dan checklist pendaftaran kompetisi kami?',
            'Bagaimana menyelaraskan solusi kami dengan kriteria penilaian juri?',
            'Rekomendasikan timeline persiapan pitch deck & dokumen proposal.',
            'Analisis potensi keunikan kompetitif solusi kami dibanding kompetitor.',
        ],
    },
    team: {
        title: 'Team Assistant',
        subtitle: 'Distribusi peran, alokasi beban tugas, dan sprint planning tim.',
        icon: Users,
        badgeBg: 'bg-purple-50 text-purple-600 border-purple-200/60',
        suggestedPrompts: [
            'Rekomendasikan pembagian peran optimal untuk anggota tim kami.',
            'Buatkan rencana Sprint 2 minggu dan pecah menjadi tugas-tugas Kanban.',
            'Bantu identifikasi potensi hambatan dalam alur pengerjaan tim.',
            'Saran format standup mingguan yang ringkas dan terukur.',
        ],
    },
    document: {
        title: 'Document Reviewer',
        subtitle: 'Bedah proposal, naskah presentasi, abstrak, dan laporan teknis.',
        icon: BookOpen,
        badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
        suggestedPrompts: [
            'Review draft abstrak proposal kami berikut dan beri masukan tajam.',
            'Cek apakah ada bagian krusial yang terlewat dalam dokumen ini.',
            'Tingkatkan keterbacaan, kejelasan argumen, dan struktur tulisan.',
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
                    title: parsed.title || 'Rekomendasi Tindakan',
                    payload: parsed.payload || parsed,
                },
            };
        } catch {
            // Fallback if parsing fails
        }
    }

    const jsonMatch = content.match(/```(?:json)?\s*(\{\s*"type"\s*:\s*"(?:create_tasks|create_sprint|save_to_proposal|create_checklist)"[\s\S]*?\})\s*```/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1]);
            const cleanContent = content.replace(jsonMatch[0], '').trim();
            return {
                cleanContent,
                action: {
                    type: parsed.type,
                    title: parsed.title || 'Rekomendasi Tindakan',
                    payload: parsed.payload || parsed,
                },
            };
        } catch {
            // Ignore
        }
    }

    return { cleanContent: content, action: null };
}

// --- Clean markdown formatter component ---
function MarkdownRenderer({ content }: { content: string }) {
    const lines = content.split('\n');

    return (
        <div className="space-y-2 leading-relaxed text-slate-800 select-text text-xs">
            {lines.map((line, idx) => {
                const trimmed = line.trim();

                if (!trimmed) {
                    return <div key={idx} className="h-1.5" />;
                }

                if (trimmed.startsWith('### ')) {
                    return (
                        <h4 key={idx} className="text-xs font-bold text-slate-900 pt-2 pb-0.5">
                            {trimmed.slice(4)}
                        </h4>
                    );
                }

                if (trimmed.startsWith('## ')) {
                    return (
                        <h3 key={idx} className="text-sm font-bold text-slate-900 pt-2 pb-1 border-b border-slate-100">
                            {trimmed.slice(3)}
                        </h3>
                    );
                }

                if (trimmed.startsWith('# ')) {
                    return (
                        <h2 key={idx} className="text-base font-extrabold text-slate-900 pt-2 pb-1">
                            {trimmed.slice(2)}
                        </h2>
                    );
                }

                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const itemText = trimmed.slice(2);
                    return (
                        <div key={idx} className="flex items-start gap-2 pl-1">
                            <span className="size-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                            <span className="flex-1">{formatInline(itemText)}</span>
                        </div>
                    );
                }

                const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
                if (numMatch) {
                    return (
                        <div key={idx} className="flex items-start gap-2 pl-1">
                            <span className="text-xs font-bold text-indigo-600 min-w-[18px]">
                                {numMatch[1]}.
                            </span>
                            <span className="flex-1">{formatInline(numMatch[2])}</span>
                        </div>
                    );
                }

                if (trimmed.startsWith('> ')) {
                    return (
                        <div key={idx} className="border-l-2 border-indigo-500 bg-indigo-50/50 px-3 py-1.5 rounded-r-xl text-xs italic text-slate-700">
                            {formatInline(trimmed.slice(2))}
                        </div>
                    );
                }

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
                <strong key={keyIdx++} className="font-bold text-slate-900">
                    {matchedText.slice(2, -2)}
                </strong>
            );
        } else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
            parts.push(
                <code key={keyIdx++} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[11px] font-mono text-indigo-700 border border-slate-200/60">
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
    const { t, locale } = useLocale();
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
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

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
            setIsUpgradeModalOpen(true);
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
                setIsUpgradeModalOpen(true);
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

    // Execute Agentic Action
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

    const quotaPercentage = quotaInfo
        ? Math.min(100, Math.round((quotaInfo.quota_used / Math.max(1, quotaInfo.quota_limit)) * 100))
        : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`AI Workspace — ${currentMeta.title}`} />

            {/* Success Toast */}
            {successToast && (
                <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span>{successToast}</span>
                </div>
            )}

            <div className="space-y-5 pt-1 max-w-[1600px] mx-auto pb-16">
                {/* 1. TOP HERO CONTEXT CARD (Apple HIG Bento Squircle Card) */}
                <div className="bg-white rounded-3xl p-4.5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Mascot & Branding */}
                    <div className="flex items-center gap-3.5 sm:gap-4">
                        <div className="size-14 sm:size-16 rounded-2xl bg-indigo-50/80 border border-indigo-200/60 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
                            <img
                                src="/images/mascot/mascot-laptop.png"
                                alt="Sahabat RAKIT AI"
                                className="w-full h-full object-contain drop-shadow-xs select-none pointer-events-none transform hover:scale-105 transition"
                            />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                                <Sparkles className="size-3 text-indigo-600" />
                                <span>{t('ai_workspace.tag', 'AI Workspace & Automation Hub')}</span>
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                                {t('ai_workspace.title', 'Ruang Kerja Cerdas AI')}
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                                {t('ai_workspace.subtitle', 'Konsultasi ide proyek, analisis aturan lomba, dan automasi pembagian tugas Kanban dengan konteks tim terintegrasi.')}
                            </p>
                        </div>
                    </div>

                    {/* Right: Team Picker & Quota Bento Pill */}
                    <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto w-full lg:w-auto">
                        {teams.length > 0 && (
                            <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200/80 rounded-2xl px-3.5 py-2 shadow-2xs flex-1 sm:flex-initial justify-between sm:justify-start">
                                <div className="flex items-center gap-2 min-w-0">
                                    <Users className="size-3.5 text-slate-500 shrink-0" />
                                    <span className="text-xs font-medium text-slate-500 hidden sm:inline">{t('ai_workspace.team_label', 'Tim:')}</span>
                                </div>
                                <div className="relative min-w-0">
                                    <select
                                        value={activeTeam?.id || ''}
                                        onChange={(e) => {
                                            const tId = e.target.value;
                                            router.get(`/ai-workspace?team_id=${tId}&assistant=${assistantType}`);
                                        }}
                                        className="text-xs font-bold text-slate-800 bg-transparent pr-5 cursor-pointer focus:outline-hidden appearance-none truncate max-w-[180px] sm:max-w-none"
                                    >
                                        {teams.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} {t.project ? `(${t.project.title})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="size-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Quota Gauge Pill */}
                        {quotaInfo && (
                            <div className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold shadow-2xs shrink-0 ${
                                quotaInfo.is_exhausted
                                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                                    : 'bg-slate-100/80 border-slate-200/80 text-slate-700'
                            }`}>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                            {quotaInfo.plan_name && quotaInfo.plan_name !== 'Free' ? quotaInfo.plan_name : t('ai_workspace.quota_label', 'Kuota:')}
                                        </span>
                                        <span className="tabular-nums font-bold text-slate-900">
                                            {quotaInfo.quota_used}/{quotaInfo.quota_limit} {locale === 'en' ? 'sessions' : 'sesi'}
                                        </span>
                                    </div>
                                    <div className="w-20 h-1.5 rounded-full bg-slate-200 overflow-hidden mt-1">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                quotaInfo.is_exhausted ? 'bg-rose-500' : 'bg-indigo-600'
                                            }`}
                                            style={{ width: `${quotaPercentage}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-[11px] text-slate-400 shrink-0">
                                    ({quotaInfo.quota_remaining} {t('ai_workspace.sessions_remaining', 'tersisa')})
                                </span>

                                {quotaInfo.is_exhausted && (
                                    <button
                                        type="button"
                                        onClick={() => setIsUpgradeModalOpen(true)}
                                        className="ml-1 px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                                    >
                                        <Crown className="size-3" />
                                        <span>Upgrade</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. THREE-COLUMN BENTO GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* LEFT COLUMN: Modes & Sessions (3 cols - Order 2 on mobile) */}
                    <div className="order-2 lg:order-1 lg:col-span-3 space-y-4">
                        {/* Card: Assistant Modes */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs space-y-2.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 block">
                                Pilihan Mode Asisten
                            </span>
                            <div className="space-y-1.5">
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
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all text-left cursor-pointer active:scale-[0.99] ${
                                                isCurrent
                                                    ? 'bg-slate-900 text-white shadow-xs'
                                                    : 'bg-slate-50/70 hover:bg-slate-100 text-slate-700 border border-slate-200/60'
                                            }`}
                                        >
                                            <div className={`p-2 rounded-xl shrink-0 ${
                                                isCurrent
                                                    ? 'bg-white/20 text-white'
                                                    : meta.badgeBg
                                            }`}>
                                                <Icon className="size-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold truncate">{meta.title}</div>
                                                <div className={`text-[10px] truncate ${isCurrent ? 'text-slate-300' : 'text-slate-400'}`}>
                                                    {key === 'project' && 'Arsitektur & Solusi'}
                                                    {key === 'competition' && 'Analisis Berkas Lomba'}
                                                    {key === 'team' && 'Sprint & Pembagian Tugas'}
                                                    {key === 'document' && 'Bedah Proposal & Naskah'}
                                                </div>
                                            </div>
                                            {isCurrent && <ChevronRight className="size-4 text-white/70 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Card: Session History */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs space-y-3.5">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Riwayat Sesi Tim
                                </span>
                                <Link
                                    href="/ai-workspace/history"
                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                                >
                                    <span>Semua Sesi</span>
                                    <ArrowRight className="size-3" />
                                </Link>
                            </div>

                            {/* New Session Button */}
                            <button
                                type="button"
                                onClick={() => handleNewConversation()}
                                disabled={quotaInfo?.is_exhausted}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                    quotaInfo?.is_exhausted
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98] shadow-2xs'
                                }`}
                                title={quotaInfo?.is_exhausted ? 'Kuota AI Tim telah habis (10/10).' : 'Mulai sesi percakapan baru'}
                            >
                                <Plus className="size-4" />
                                <span>Percakapan Baru</span>
                            </button>

                            {/* Session List */}
                            <div className="space-y-1.5 max-h-[300px] overflow-y-auto no-scrollbar">
                                {sessions.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-slate-400 px-2">
                                        Belum ada riwayat sesi.
                                    </div>
                                ) : (
                                    sessions.map((sess) => {
                                        const isSelected = activeSession?.id === sess.id;
                                        return (
                                            <div
                                                key={sess.id}
                                                className={`group flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'bg-indigo-50 border border-indigo-200 text-indigo-950 font-bold shadow-2xs'
                                                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                                                }`}
                                            >
                                                <Link
                                                    href={`/ai-workspace?team_id=${activeTeam?.id}&assistant=${sess.assistant_type}&session_id=${sess.id}`}
                                                    className="flex-1 truncate pr-2"
                                                >
                                                    <div className="truncate font-semibold text-slate-800">{sess.title}</div>
                                                    <div className="text-[10px] text-slate-400 font-normal capitalize mt-0.5">
                                                        {sess.assistant_type} • {new Date(sess.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                    </div>
                                                </Link>
                                                {sess.is_own && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteSession(sess.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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

                    {/* CENTER COLUMN: Interactive Chat Area (6 cols - Order 1 on mobile) */}
                    <div className="order-1 lg:order-2 lg:col-span-6 bg-white border border-slate-200/80 rounded-3xl shadow-xs flex flex-col h-[560px] sm:h-[640px] lg:h-[700px] overflow-hidden">
                        {/* Chat Header Bar */}
                        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-white/95 backdrop-blur-xs flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`p-2 rounded-xl border shrink-0 ${currentMeta.badgeBg}`}>
                                    <AssistantIcon className="size-4" />
                                </div>
                                <div className="min-w-0">
                                    <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                                        {activeSession?.title || currentMeta.title}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 truncate">
                                        {currentMeta.subtitle}
                                    </p>
                                </div>
                            </div>

                            {/* Session Share Pill */}
                            {activeSession && (
                                <div className="flex items-center gap-2 shrink-0">
                                    {isShared ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                            <Users className="size-3 text-indigo-600" />
                                            <span>Dibagikan</span>
                                        </span>
                                    ) : (
                                        activeSession.is_own && (
                                            <button
                                                type="button"
                                                onClick={handleShareSession}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
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
                                <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 p-1">
                                    <X className="size-4" />
                                </button>
                            </div>
                        )}

                        {/* Messages Scroll Area */}
                        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto p-4 space-y-4">
                                    <div className="size-16 rounded-3xl bg-indigo-50/80 border border-indigo-200/60 flex items-center justify-center p-2.5 shrink-0 shadow-2xs">
                                        <img
                                            src="/images/mascot/mascot-laptop.png"
                                            alt="Sahabat RAKIT"
                                            className="w-full h-full object-contain drop-shadow-xs"
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                                            Konsultasi dengan {currentMeta.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                                            Pilih saran topik di bawah atau ketik langsung kebutuhan tim Anda untuk memulai:
                                        </p>
                                    </div>
                                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-left">
                                        {currentMeta.suggestedPrompts.map((prompt, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => {
                                                    setInputMessage(prompt);
                                                    textareaRef.current?.focus();
                                                }}
                                                className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 text-slate-700 hover:text-indigo-900 text-xs font-semibold text-left transition-all cursor-pointer flex items-start justify-between gap-2.5 group active:scale-[0.99] shadow-2xs"
                                            >
                                                <span className="line-clamp-2 leading-relaxed">{prompt}</span>
                                                <ArrowRight className="size-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
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
                                                <div className="size-8 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                                    <Bot className="size-4.5" />
                                                </div>
                                            )}

                                            <div className="max-w-[88%] space-y-2">
                                                {/* Conversational Bubble */}
                                                <div
                                                    className={`rounded-3xl px-4.5 py-3.5 leading-relaxed text-xs shadow-2xs ${
                                                        isUser
                                                            ? 'bg-slate-900 text-white rounded-tr-xs'
                                                            : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80'
                                                    }`}
                                                >
                                                    {isUser ? (
                                                        <div className="whitespace-pre-wrap select-text">{cleanContent}</div>
                                                    ) : (
                                                        <MarkdownRenderer content={cleanContent} />
                                                    )}

                                                    {/* Assistant Quick Actions */}
                                                    {!isUser && (
                                                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCopy(cleanContent, index)}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold transition cursor-pointer"
                                                                >
                                                                    {copiedIndex === index ? (
                                                                        <>
                                                                            <Check className="size-3 text-emerald-600" />
                                                                            <span className="text-emerald-700 font-bold">Tersalin</span>
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
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 font-semibold transition cursor-pointer"
                                                                >
                                                                    <FileText className="size-3" />
                                                                    <span>Simpan ke Proyek</span>
                                                                </button>
                                                            </div>

                                                            {/* Quick Prompters */}
                                                            {!action && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickExtractTasks(cleanContent)}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 font-semibold transition cursor-pointer"
                                                                        title="Ekstrak saran ini menjadi tugas Kanban otomatis"
                                                                    >
                                                                        <Zap className="size-3 text-emerald-600" />
                                                                        <span>Jadikan Kanban</span>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleQuickCreateSprint(cleanContent)}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60 font-semibold transition cursor-pointer"
                                                                        title="Jadikan saran ini Sprint baru di roadmap"
                                                                    >
                                                                        <Calendar className="size-3 text-purple-600" />
                                                                        <span>Jadikan Sprint</span>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Agentic Action Execution Card */}
                                                {!isUser && action && (
                                                    <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-4 space-y-3 shadow-2xs">
                                                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                                                            <div className="flex items-center gap-2">
                                                                <span className="p-1 rounded-lg bg-indigo-600 text-white">
                                                                    <Zap className="size-3.5" />
                                                                </span>
                                                                <span className="text-xs font-bold text-slate-900">
                                                                    {action.title}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100/80 text-indigo-700">
                                                                Tindakan Otomatis
                                                            </span>
                                                        </div>

                                                        {/* Action Payload Preview */}
                                                        {action.type === 'create_tasks' && Array.isArray(action.payload?.tasks) && (
                                                            <div className="space-y-1.5">
                                                                <div className="text-[11px] font-semibold text-slate-600">
                                                                    Rincian Tugas ({action.payload.tasks.length} item):
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                                                                    {action.payload.tasks.map((task: any, tIdx: number) => (
                                                                        <div
                                                                            key={tIdx}
                                                                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs shadow-2xs"
                                                                        >
                                                                            <div className="min-w-0 flex items-center gap-2">
                                                                                <span className="size-1.5 rounded-full bg-indigo-600 shrink-0" />
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
                                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                                                    task.priority === 'urgent' || task.priority === 'high'
                                                                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
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
                                                            <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1 text-xs">
                                                                <div className="font-bold text-slate-900">{action.payload?.title}</div>
                                                                <div className="text-[11px] text-slate-600">{action.payload?.description}</div>
                                                                <div className="text-[10px] text-slate-400 mt-1">
                                                                    Estimasi Durasi: {action.payload?.estimated_days || 14} Hari
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Execution Button / Result Banner */}
                                                        {executedResult ? (
                                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-emerald-200 text-xs text-slate-800 shadow-2xs">
                                                                <div className="flex items-center gap-2">
                                                                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                                                                    <span className="font-semibold text-emerald-900">{executedResult.message}</span>
                                                                </div>
                                                                {activeTeam && (
                                                                    <Link
                                                                        href={`/workspace/${activeTeam.id}`}
                                                                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                                                    >
                                                                        <span>Buka Papan</span>
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
                                                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                                                                >
                                                                    {isExecuting ? (
                                                                        <>
                                                                            <Loader2 className="size-3.5 animate-spin" />
                                                                            <span>Menerapkan ke Workspace...</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Zap className="size-3.5" />
                                                                            <span>Terapkan ke Workspace Tim</span>
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {isUser && (
                                                <div className="size-8 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                                                    <User className="size-4" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}

                            {isLoading && (
                                <div className="flex gap-3 items-center text-xs text-slate-500">
                                    <div className="size-8 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center shrink-0 animate-pulse">
                                        <Bot className="size-4" />
                                    </div>
                                    <div className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                                        <RefreshCw className="size-3 animate-spin text-indigo-600" />
                                        <span className="font-semibold text-slate-700">Sedang menyusun respon cerdas...</span>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* File Attachment Pill Preview */}
                        {attachedFile && (
                            <div className="mx-4 mb-2 px-3.5 py-2 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 flex items-center justify-between text-xs text-indigo-900">
                                <div className="flex items-center gap-2 truncate">
                                    <FileCode className="size-4 shrink-0 text-indigo-600" />
                                    <span className="truncate font-semibold">{attachedFile.name}</span>
                                    <span className="text-[10px] text-slate-500">
                                        ({Math.round(attachedFile.content.length / 1024)} KB)
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAttachedFile(null)}
                                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                >
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        )}

                        {/* Chat Input Bar */}
                        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/60">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSendMessage();
                                }}
                                className="space-y-2"
                            >
                                <div className="flex items-end gap-2.5 bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
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
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition cursor-pointer"
                                        title="Lampirkan dokumen naskah/kode"
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
                                        className="flex-1 bg-transparent border-0 focus:outline-hidden text-xs text-slate-800 placeholder:text-slate-400 resize-none py-1.5 px-1 max-h-32"
                                    />

                                    <button
                                        type="submit"
                                        disabled={(!inputMessage.trim() && !attachedFile) || isLoading}
                                        className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 active:scale-95 ${
                                            (!inputMessage.trim() && !attachedFile) || isLoading
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                                        }`}
                                    >
                                        <Send className="size-4" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                                    <span>Tekan <kbd className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px]">Enter</kbd> untuk kirim, <kbd className="font-mono bg-white border border-slate-200 px-1 py-0.5 rounded text-[10px]">Shift + Enter</kbd> baris baru</span>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Active Context & Companion (3 cols - Order 3 on mobile) */}
                    <div className="order-3 lg:order-3 lg:col-span-3 space-y-4">
                        {/* Live Context Bento Card */}
                        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-3.5 text-xs">
                            <div className="pb-2 border-b border-slate-100">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Konteks Tim Aktif
                                </span>
                            </div>

                            {activeTeam ? (
                                <div className="space-y-3.5">
                                    <div>
                                        <div className="text-[10px] text-slate-400 font-medium">Tim Terpilih:</div>
                                        <div className="font-extrabold text-slate-900 text-sm mt-0.5">{activeTeam.name}</div>
                                    </div>

                                    {activeTeam.project && (
                                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                                            <div className="text-[10px] text-slate-400 font-medium">Proyek Terkait:</div>
                                            <Link
                                                href={`/projects/${activeTeam.project.slug || activeTeam.project.id}`}
                                                className="font-bold text-slate-800 hover:text-indigo-600 hover:underline flex items-center justify-between gap-1 mt-1"
                                            >
                                                <span className="truncate">{activeTeam.project.title}</span>
                                                <ArrowRight className="size-3 text-slate-400 shrink-0" />
                                            </Link>
                                        </div>
                                    )}

                                    {activeTeam.competitions && activeTeam.competitions.length > 0 && (
                                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                                            <div className="text-[10px] text-slate-400 font-medium">Target Kompetisi:</div>
                                            <div className="space-y-1.5 mt-1.5">
                                                {activeTeam.competitions.map((c) => (
                                                    <Link
                                                        key={c.id}
                                                        href={`/competitions/${c.slug || c.id}`}
                                                        className="block text-xs font-semibold text-slate-800 hover:text-indigo-600 truncate"
                                                    >
                                                        {c.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-600">
                                        <span className="text-xs">Anggota Kolaborator:</span>
                                        <span className="font-bold text-slate-800">{activeTeam.members?.length || 1} Mahasiswa</span>
                                    </div>

                                    {/* Direct Kanban Shortcut */}
                                    <Link
                                        href={`/workspace/${activeTeam.id}`}
                                        className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
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

                        {/* Sahabat RAKIT Companion Card */}
                        <div className="bg-linear-to-br from-amber-50/80 to-amber-100/40 border border-amber-200/70 rounded-3xl p-4.5 shadow-xs space-y-2.5">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-2xl bg-white border border-amber-200 flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
                                    <img
                                        src="/images/mascot/mascot-trophy.png"
                                        alt="Mascot Tips"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">Sahabat RAKIT</h4>
                                    <span className="text-[10px] text-amber-700 font-semibold">Tips Produktivitas</span>
                                </div>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-600">
                                Gunakan tombol <strong>'Jadikan Kanban'</strong> pada balasan AI untuk langsung memuat saran teknis ke papan tugas tim Anda tanpa perlu entri manual!
                            </p>
                        </div>

                        {/* Safety Footnote */}
                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-4 space-y-1.5 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                                <Shield className="size-3.5 text-slate-500" />
                                <span>Keamanan Data & Privasi</span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-500">
                                Percakapan AI terisolasi khusus untuk tim Anda. Data dan prompt internal tim tidak dipublikasikan ke publik.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Paywall & Quota Exhausted Modal */}
            {isUpgradeModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5 animate-in fade-in zoom-in-95">
                        <button
                            type="button"
                            onClick={() => setIsUpgradeModalOpen(false)}
                            className="absolute top-5 right-5 size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>
                        <div className="text-center space-y-2">
                            <div className="size-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center shadow-xs">
                                <Crown className="size-7" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                Kuota AI Telah Mencapai Batas
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Sesi AI tim Anda saat ini telah habis ({quotaInfo?.quota_used}/{quotaInfo?.quota_limit} sesi).
                                Tambah kuota instan mulai <strong>Rp 15.000 (AI Pass)</strong> atau langganan <strong>RAKIT Pro (Rp 29.000/bln)</strong> untuk 100 sesi percakapan.
                            </p>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Link
                                href="/pricing"
                                className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
                            >
                                <span>Buka Paket & Kuota Tambahan</span>
                                <ArrowRight className="size-3.5" />
                            </Link>
                            <button
                                type="button"
                                onClick={() => setIsUpgradeModalOpen(false)}
                                className="w-full py-2.5 rounded-full text-slate-500 hover:text-slate-800 text-xs font-medium transition cursor-pointer"
                            >
                                Nanti Saja
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
