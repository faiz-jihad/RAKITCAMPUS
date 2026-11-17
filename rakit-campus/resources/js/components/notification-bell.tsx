import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Bell,
    BellOff,
    CheckCheck,
    FolderKanban,
    GraduationCap,
    Trophy,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface RecentNotification {
    id: string;
    data: {
        title?: string;
        message?: string;
        action_url?: string;
        link?: string;
        category?: string;
        type?: string;
        team_name?: string;
        status?: string;
    };
    read_at: string | null;
    created_at?: string | null;
}

interface NotificationBellProps {
    className?: string;
    triggerClassName?: string;
}

export function NotificationBell({ className, triggerClassName }: NotificationBellProps = {}) {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user as any;

    const initialUnread = Number(user?.unread_notifications_count || 0);
    const initialRecent = (user?.recent_notifications || []) as RecentNotification[];

    const [unreadCount, setUnreadCount] = useState<number>(initialUnread);
    const [recentNotifications, setRecentNotifications] = useState<RecentNotification[]>(initialRecent);
    const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

    useEffect(() => {
        setUnreadCount(Number(user?.unread_notifications_count || 0));
        setRecentNotifications((user?.recent_notifications || []) as RecentNotification[]);
    }, [user?.unread_notifications_count, user?.recent_notifications]);

    // Live background polling & window focus sync for production reliability
    useEffect(() => {
        if (!user?.id) return;

        const refreshNotifications = () => {
            router.reload({
                only: ['auth'],
            });
        };

        // Poll every 45 seconds when window is active
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                refreshNotifications();
            }
        }, 45000);

        // Immediate sync when user focuses back to the tab
        const handleFocus = () => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                refreshNotifications();
            }
        };

        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleFocus);
        };
    }, [user?.id]);

    const handleMarkAllRead = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isMarkingAll || unreadCount === 0) return;

        setIsMarkingAll(true);
        // Optimistic UI update
        setUnreadCount(0);
        setRecentNotifications((prev) =>
            prev.map((item) => ({ ...item, read_at: new Date().toISOString() }))
        );

        router.post(
            '/notifications/read-all',
            {},
            {
                preserveScroll: true,
                onFinish: () => setIsMarkingAll(false),
            }
        );
    };

    const handleOpenNotification = (item: RecentNotification) => {
        let targetUrl = item.data?.action_url || item.data?.link || '/notifications';

        // Normalize legacy competition workspace URLs to prevent 404
        if (targetUrl.includes('/competitions/workspace/')) {
            targetUrl = targetUrl.replace('/competitions/workspace/', '/competition-workspace/');
        }

        if (!item.read_at) {
            // Optimistically mark as read
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setRecentNotifications((prev) =>
                prev.map((n) => (n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n))
            );

            router.patch(
                `/notifications/${item.id}/read`,
                {},
                {
                    preserveScroll: true,
                    onSuccess: () => router.visit(targetUrl),
                    onError: () => router.visit(targetUrl),
                }
            );
        } else {
            router.visit(targetUrl);
        }
    };

    const getCategoryIcon = (category?: string, type?: string) => {
        if (category === 'project_hub' || type?.includes('project') || type?.includes('application')) {
            return <FolderKanban className="size-3.5 text-blue-600" />;
        }
        if (category === 'competition_hub' || type?.includes('competition')) {
            return <Trophy className="size-3.5 text-amber-600" />;
        }
        if (category === 'class_management' || type?.includes('class')) {
            return <GraduationCap className="size-3.5 text-emerald-600" />;
        }
        if (type?.includes('invitation') || type?.includes('team')) {
            return <Users className="size-3.5 text-blue-600" />;
        }
        return <Bell className="size-3.5 text-slate-500" />;
    };

    const getNotificationTitle = (item: RecentNotification) => {
        if (item.data?.title) return item.data.title;
        if (item.data?.type === 'application_accepted') return 'Lamaran Diterima';
        if (item.data?.type === 'application_rejected') return 'Lamaran Ditolak';
        if (item.data?.type === 'application_submitted') return 'Lamaran Baru Masuk';
        if (item.data?.type === 'invitation_received') return 'Undangan Rekrutmen Tim';
        if (item.data?.team_name) return `Tim ${item.data.team_name}`;
        return 'Notifikasi Baru';
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className={
                        triggerClassName ||
                        "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative transition cursor-pointer focus:outline-none"
                    }
                    title="Notifikasi"
                    aria-label="Notifikasi"
                >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className={`w-80 sm:w-96 p-2 rounded-2xl shadow-2xl border border-slate-200/90 bg-white z-50 ${className || ''}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">Notifikasi</span>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                                {unreadCount} baru
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            disabled={isMarkingAll}
                            className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                        >
                            <CheckCheck className="size-3.5" />
                            <span>Tandai dibaca</span>
                        </button>
                    )}
                </div>

                <DropdownMenuSeparator className="my-1 bg-slate-100" />

                {/* Notifications List */}
                {recentNotifications.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto py-1 space-y-1">
                        {recentNotifications.map((item) => {
                            const isUnread = !item.read_at;
                            const title = getNotificationTitle(item);
                            return (
                                <DropdownMenuItem
                                    key={item.id}
                                    onSelect={() => handleOpenNotification(item)}
                                    className={`flex items-start gap-3 rounded-xl p-2.5 cursor-pointer transition ${
                                        isUnread
                                            ? 'bg-blue-50/50 hover:bg-blue-50/80 border border-blue-100/60'
                                            : 'hover:bg-slate-50 border border-transparent'
                                    }`}
                                >
                                    <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                        {getCategoryIcon(item.data?.category, item.data?.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                                                {title}
                                            </p>
                                            {item.created_at && (
                                                <span className="text-[10px] text-slate-400 shrink-0">
                                                    {item.created_at}
                                                </span>
                                            )}
                                        </div>
                                        {item.data?.message && (
                                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                                                {item.data.message}
                                            </p>
                                        )}
                                    </div>
                                    {isUnread && (
                                        <span className="size-2 rounded-full bg-blue-600 shrink-0 mt-1.5 ring-2 ring-white" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-7 px-4 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-1.5">
                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-1">
                            <BellOff className="size-5" />
                        </div>
                        <p className="font-semibold text-slate-700">Tidak ada notifikasi baru</p>
                        <p className="text-[11px] text-slate-400 max-w-[200px]">
                            Semua aktivitas dan info terbaru akan muncul di sini.
                        </p>
                    </div>
                )}

                <DropdownMenuSeparator className="my-1 bg-slate-100" />

                {/* Footer */}
                <div className="p-1">
                    <Link
                        href="/notifications"
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
                    >
                        <span>Pusat Notifikasi Lengkap</span>
                        <ArrowRight className="size-3.5" />
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
