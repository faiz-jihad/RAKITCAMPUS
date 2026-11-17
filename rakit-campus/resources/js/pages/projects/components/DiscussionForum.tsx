import { router } from '@inertiajs/react';
import {
    AlertCircle,
    Bell,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    Info,
    MessageCircle,
    MessageSquare,
    MoreHorizontal,
    Pin,
    PinOff,
    Plus,
    Reply,
    Send,
    Sparkles,
    Trash2,
    Users,
} from 'lucide-react';
import { useRef, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReplyItem {
    id: number;
    user_id: number;
    body: string;
    created_at: string;
    author?: { id: number; name: string };
}

interface PostItem {
    id: number;
    user_id: number;
    kind: 'discussion' | 'announcement';
    title?: string | null;
    body: string;
    pinned: boolean;
    created_at: string;
    author?: { id: number; name: string };
    replies?: ReplyItem[];
}

interface Props {
    projectId: string | number;
    discussions: PostItem[];
    currentUserId?: number;
    isLeader: boolean;
    isMember: boolean;
    isLecturer?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function Avatar({ name, size = 8 }: { name?: string; size?: number }) {
    const initials = (name ?? '?')
        .split(' ')
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    const colors = [
        'bg-blue-600',
        'bg-indigo-600',
        'bg-violet-600',
        'bg-emerald-600',
        'bg-amber-600',
        'bg-rose-600',
        'bg-cyan-600',
    ];
    const color = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
    return (
        <div
            className={`w-${size} h-${size} rounded-full ${color} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs ring-2 ring-white`}
        >
            {initials}
        </div>
    );
}

// ─── Compose Box ─────────────────────────────────────────────────────────────

function ComposeBox({
    projectId,
    isLeader,
    forceOpen,
    onClose,
}: {
    projectId: string | number;
    isLeader: boolean;
    forceOpen?: boolean;
    onClose?: () => void;
}) {
    const [open, setOpen] = useState(forceOpen ?? false);
    const [kind, setKind] = useState<'discussion' | 'announcement'>('discussion');
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);

    const isOpen = forceOpen !== undefined ? forceOpen : open;

    const handleClose = () => {
        setOpen(false);
        onClose?.();
    };

    const submit = () => {
        if (!body.trim()) return;
        setLoading(true);
        router.post(
            `/projects/${projectId}/posts`,
            { kind, title: title.trim() || null, body: body.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    handleClose();
                    setTitle('');
                    setBody('');
                    setKind('discussion');
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    if (!isOpen) {
        return (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                    <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <MessageSquare className="size-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800">Mulai diskusi atau koordinasi baru</span>
                        <span className="text-[11px] text-slate-400">Bagikan update, ide, pertanyaan teknis, atau pengumuman ke anggota tim</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                    <Plus className="size-3.5" />
                    <span>Tulis Topik Baru</span>
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border-2 border-blue-500/20 bg-gradient-to-b from-blue-50/50 to-white p-5 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <MessageCircle className="size-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-900">Buat Utas Diskusi Tim</h4>
                        <p className="text-[10px] text-slate-400">Pesan ini akan dapat dibaca dan ditanggapi oleh seluruh anggota kelompok</p>
                    </div>
                </div>

                {/* Kind selector */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setKind('discussion')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            kind === 'discussion'
                                ? 'bg-white text-blue-700 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <MessageSquare className="size-3.5" />
                        <span>Diskusi Umum</span>
                    </button>
                    {isLeader && (
                        <button
                            type="button"
                            onClick={() => setKind('announcement')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                kind === 'announcement'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <Bell className="size-3.5" />
                            <span>Pengumuman Ketua</span>
                        </button>
                    )}
                </div>
            </div>

            {kind === 'announcement' && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    <Bell className="size-4 text-amber-600 shrink-0" />
                    <span>
                        <strong>Mode Pengumuman:</strong> Postingan akan ditandai dengan badge khusus Pengumuman Ketua agar diprioritaskan anggota tim.
                    </span>
                </div>
            )}

            {/* Title (optional) */}
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul topik diskusi (contoh: Pembagian API Auth, Kendala Sensor IoT, Jadwal Sinkronisasi)..."
                maxLength={200}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 transition"
            />

            {/* Body */}
            <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tuliskan detail koordinasi, pertanyaan, atau catatan untuk tim di sini..."
                maxLength={5000}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 transition"
            />

            <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                    Mendukung markdown sederhana dan pemisahan baris paragraf
                </span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={submit}
                        disabled={!body.trim() || loading}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                    >
                        <Send className="size-3.5" />
                        <span>{loading ? 'Mengirim...' : 'Kirim Postingan'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Reply Box ────────────────────────────────────────────────────────────────

function ReplyBox({
    projectId,
    postId,
    onDone,
}: {
    projectId: string | number;
    postId: number;
    onDone: () => void;
}) {
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const ref = useRef<HTMLTextAreaElement>(null);

    const submit = () => {
        if (!body.trim()) return;
        setLoading(true);
        router.post(
            `/projects/${projectId}/posts/${postId}/replies`,
            { body: body.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBody('');
                    onDone();
                },
                onFinish: () => setLoading(false),
            },
        );
    };

    return (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
            <textarea
                ref={ref}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit();
                }}
                placeholder="Tulis tanggapan atau solusi untuk utas ini (Ctrl+Enter untuk kirim)..."
                maxLength={2000}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
            />
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onDone}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                    Tutup
                </button>
                <button
                    type="button"
                    onClick={submit}
                    disabled={!body.trim() || loading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50 cursor-pointer"
                >
                    <Send className="size-3" />
                    <span>{loading ? 'Mengirim...' : 'Kirim Balasan'}</span>
                </button>
            </div>
        </div>
    );
}

// ─── Single Post Card ─────────────────────────────────────────────────────────

function PostCard({
    post,
    projectId,
    currentUserId,
    isLeader,
    isMember,
}: {
    post: PostItem;
    projectId: string | number;
    currentUserId?: number;
    isLeader: boolean;
    isMember: boolean;
}) {
    const [showReplies, setShowReplies] = useState(true);
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    const isAuthor = currentUserId === post.user_id;
    const canDelete = isAuthor || isLeader;
    const canPin = isLeader;
    const isAnnouncement = post.kind === 'announcement';
    const replyCount = post.replies?.length ?? 0;

    const handleDelete = () => {
        if (!confirm('Hapus postingan ini beserta semua tanggapannya?')) return;
        router.delete(`/projects/${projectId}/posts/${post.id}`, { preserveScroll: true });
    };

    const handlePin = () => {
        router.patch(`/projects/${projectId}/posts/${post.id}/pin`, {}, { preserveScroll: true });
    };

    return (
        <div
            className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isAnnouncement
                    ? 'border-amber-200/90 bg-gradient-to-b from-amber-50/40 to-white shadow-xs'
                    : post.pinned
                    ? 'border-blue-200/90 bg-gradient-to-b from-blue-50/40 to-white shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300'
            }`}
        >
            {/* Header info */}
            <div className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <Avatar name={post.author?.name} />
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-slate-900">{post.author?.name ?? 'Anggota Tim'}</span>
                                {isAnnouncement && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300/60">
                                        <Bell className="size-2.5" /> Pengumuman
                                    </span>
                                )}
                                {post.pinned && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                                        <Pin className="size-2.5" /> Disematkan
                                    </span>
                                )}
                                <span className="text-[11px] text-slate-400">{timeAgo(post.created_at)}</span>
                            </div>

                            {post.title && (
                                <h4 className="mt-1.5 text-sm font-bold text-slate-900 leading-snug">
                                    {post.title}
                                </h4>
                            )}
                        </div>
                    </div>

                    {/* Context menu for delete / pin */}
                    {(canDelete || canPin) && (
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setMenuOpen((v) => !v)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                            >
                                <MoreHorizontal className="size-4" />
                            </button>
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                                    <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-slate-200 bg-white shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
                                        {canPin && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handlePin();
                                                    setMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700 cursor-pointer text-left"
                                            >
                                                {post.pinned ? (
                                                    <>
                                                        <PinOff className="size-3.5 text-slate-400" />
                                                        <span>Lepas Sematan</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Pin className="size-3.5 text-blue-600" />
                                                        <span>Sematkan di Atas</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleDelete();
                                                    setMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 cursor-pointer text-left"
                                            >
                                                <Trash2 className="size-3.5" />
                                                <span>Hapus Utas</span>
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Body Content */}
                <p className="mt-3 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap pl-11">
                    {post.body}
                </p>

                {/* Actions: Reply button & Reply count */}
                <div className="mt-4 pl-11 flex items-center gap-3">
                    {isMember && (
                        <button
                            type="button"
                            onClick={() => {
                                setShowReplyBox(true);
                                setShowReplies(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50/80 hover:bg-blue-100 transition cursor-pointer"
                        >
                            <Reply className="size-3.5" />
                            <span>Balas Utas</span>
                        </button>
                    )}

                    {replyCount > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowReplies((v) => !v)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 transition cursor-pointer"
                        >
                            {showReplies ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                            <span>{replyCount} tanggapan</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Replies section */}
            {showReplies && replyCount > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 pl-8 flex flex-col gap-3">
                    {post.replies!.map((r) => (
                        <div
                            key={r.id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-2xs"
                        >
                            <Avatar name={r.author?.name} size={6} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-slate-900">
                                        {r.author?.name ?? 'Anggota'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400">{timeAgo(r.created_at)}</span>
                                        {(currentUserId === r.user_id || isLeader) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!confirm('Hapus balasan ini?')) return;
                                                    router.delete(`/projects/${projectId}/posts/${r.id}`, {
                                                        preserveScroll: true,
                                                    });
                                                }}
                                                className="text-slate-300 hover:text-red-500 transition cursor-pointer"
                                                title="Hapus tanggapan"
                                            >
                                                <Trash2 className="size-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {r.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Reply composer */}
            {showReplyBox && (
                <div className="p-4 pt-0 pl-14">
                    <ReplyBox
                        projectId={projectId}
                        postId={post.id}
                        onDone={() => setShowReplyBox(false)}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DiscussionForum({
    projectId,
    discussions = [],
    currentUserId,
    isLeader,
    isMember,
    isLecturer,
}: Props) {
    const [filter, setFilter] = useState<'all' | 'announcement' | 'discussion'>('all');
    const [isComposing, setIsComposing] = useState(false);

    const canPost = (isMember || isLeader) && !isLecturer;

    const filtered = discussions.filter((d) => {
        if (filter === 'announcement') return d.kind === 'announcement';
        if (filter === 'discussion') return d.kind === 'discussion';
        return true;
    });

    const pinnedPosts = filtered.filter((d) => d.pinned);
    const normalPosts = filtered.filter((d) => !d.pinned);

    return (
        <div className="flex flex-col gap-6">
            {/* ── 1. Edukasi & Banner Fungsi Penggunaan ── */}
            <div className="glass-card rounded-2xl p-6 shadow-xs border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="size-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                            <MessageSquare className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-black text-slate-900 tracking-tight">
                                    Ruang Diskusi & Koordinasi Tim
                                </h3>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                                    <Users className="size-3" /> Internal Tim
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
                                Ruang komunikasi resmi antar anggota kelompok proyek. Gunakan untuk menyelaraskan roadmap, mengabarkan progres, mendiskusikan kendala teknis, serta pengumuman resmi dari ketua tim.
                            </p>
                        </div>
                    </div>

                    {canPost && !isComposing && (
                        <button
                            type="button"
                            onClick={() => setIsComposing(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition cursor-pointer shrink-0"
                        >
                            <Plus className="size-4" />
                            <span>Mulai Topik Diskusi</span>
                        </button>
                    )}
                </div>

                {/* 3 Panduan Fungsi Penggunaan */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-slate-200/60">
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
                        <div className="size-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Bell className="size-3.5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-800 block">1. Pengumuman Ketua</span>
                            <span className="text-[11px] text-slate-500 leading-snug">
                                Ketua membagikan tenggat waktu tugas, link repositori, atau jadwal sync kelompok.
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
                        <div className="size-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <Sparkles className="size-3.5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-800 block">2. Diskusi Teknis & Ide</span>
                            <span className="text-[11px] text-slate-500 leading-snug">
                                Anggota mendiskusikan arsitektur sistem, desain antarmuka, dan pembagian modul.
                            </span>
                        </div>
                    </div>

                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/80 border border-slate-100 shadow-2xs">
                        <div className="size-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <HelpCircle className="size-3.5" />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-slate-800 block">3. Tanya Jawab & Kendala</span>
                            <span className="text-[11px] text-slate-500 leading-snug">
                                Laporkan kendala bug/blocker pengerjaan agar anggota lain dapat memberikan tanggapan.
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 2. Form Composer Diskusi Baru ── */}
            {canPost && (
                <ComposeBox
                    projectId={projectId}
                    isLeader={isLeader}
                    forceOpen={isComposing ? true : undefined}
                    onClose={() => setIsComposing(false)}
                />
            )}

            {/* ── 3. Filter Kategori & Counter ── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            filter === 'all'
                                ? 'bg-white text-slate-900 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        Semua ({discussions.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('announcement')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            filter === 'announcement'
                                ? 'bg-white text-amber-700 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Bell className="size-3" />
                        <span>Pengumuman</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('discussion')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                            filter === 'discussion'
                                ? 'bg-white text-blue-700 shadow-xs'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <MessageSquare className="size-3" />
                        <span>Diskusi Umum</span>
                    </button>
                </div>

                <span className="text-xs text-slate-400">
                    Menampilkan {filtered.length} dari {discussions.length} topik
                </span>
            </div>

            {/* ── 4. Empty State (Jika Belum Ada Diskusi) ── */}
            {filtered.length === 0 && (
                <div className="glass-card rounded-2xl p-10 shadow-xs text-center flex flex-col items-center gap-4">
                    <div className="size-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                        <MessageCircle className="size-8" />
                    </div>
                    <div className="max-w-md">
                        <h4 className="text-sm font-bold text-slate-900">
                            {filter === 'all'
                                ? 'Belum Ada Diskusi Aktif'
                                : filter === 'announcement'
                                ? 'Belum Ada Pengumuman Resmi'
                                : 'Belum Ada Diskusi Umum'}
                        </h4>
                        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                            {canPost
                                ? 'Mulai koordinasi pertama dengan rekan satu tim Anda sekarang agar pengerjaan proyek lebih terarah dan transparan.'
                                : 'Belum ada obrolan atau pengumuman yang dibagikan pada proyek ini.'}
                        </p>
                    </div>

                    {canPost && (
                        <button
                            type="button"
                            onClick={() => setIsComposing(true)}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                            <Plus className="size-4" />
                            <span>Mulai Diskusi Sekarang</span>
                        </button>
                    )}
                </div>
            )}

            {/* ── 5. Utas yang Disematkan (Pinned) ── */}
            {pinnedPosts.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                        <Pin className="size-3.5" />
                        <span>Utas Disematkan / Penting</span>
                    </div>
                    {pinnedPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            projectId={projectId}
                            currentUserId={currentUserId}
                            isLeader={isLeader}
                            isMember={canPost}
                        />
                    ))}
                </div>
            )}

            {/* ── 6. Daftar Semua Postingan Normal ── */}
            {normalPosts.length > 0 && (
                <div className="flex flex-col gap-3">
                    {pinnedPosts.length > 0 && (
                        <span className="text-xs font-bold text-slate-500">Postingan Lainnya</span>
                    )}
                    {normalPosts.map((post) => (
                        <PostCard
                            key={post.id}
                            post={post}
                            projectId={projectId}
                            currentUserId={currentUserId}
                            isLeader={isLeader}
                            isMember={canPost}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
