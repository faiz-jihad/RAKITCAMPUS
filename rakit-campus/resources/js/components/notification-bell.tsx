import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { Bell, CheckCheck, ExternalLink, Sparkles } from 'lucide-react';

interface RecentNotification {
    id: string;
    data: {
        title?: string;
        message?: string;
        action_url?: string;
        category?: string;
    };
    read_at: string | null;
    created_at?: string | null;
}

export function NotificationBell() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user as any;
    const unreadCount = Number(user?.unread_notifications_count || 0);
    const recentNotifications = (user?.recent_notifications || []) as RecentNotification[];

    const handleMarkAllRead = () => {
        router.post(
            '/notifications/read-all',
            {},
            {
                preserveScroll: true,
            }
        );
    };

    const handleOpenNotification = (item: RecentNotification) => {
        const targetUrl = item.data?.action_url || '/notifications';
        if (!item.read_at) {
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

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" aria-label="Notifikasi">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2 shadow-xl border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifikasi</span>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                                {unreadCount} baru
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-blue-600 hover:text-blue-800 dark:text-blue-400 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                        >
                            <CheckCheck className="h-3 w-3" /> Tandai dibaca
                        </button>
                    )}
                </div>
                <DropdownMenuSeparator />
                {recentNotifications.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto py-1 space-y-1">
                        {recentNotifications.map((item) => (
                            <DropdownMenuItem
                                key={item.id}
                                onSelect={() => handleOpenNotification(item)}
                                className={`flex flex-col items-start gap-1 rounded-lg px-3 py-2 cursor-pointer ${
                                    !item.read_at ? 'bg-blue-50/70 dark:bg-blue-950/30' : ''
                                }`}
                            >
                                <div className="flex w-full items-center justify-between gap-2">
                                    <span className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1 flex items-center gap-1.5">
                                        {!item.read_at && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />}
                                        <span>{item.data?.title || 'Notifikasi Baru'}</span>
                                    </span>
                                    {item.created_at && (
                                        <span className="text-[10px] text-slate-400 shrink-0">{item.created_at}</span>
                                    )}
                                </div>
                                {item.data?.message && (
                                    <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-snug">
                                        {item.data.message}
                                    </p>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </div>
                ) : (
                    <div className="py-4 px-3 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col items-center gap-1">
                        <Sparkles className="h-4 w-4 text-slate-300" />
                        <p>Tidak ada notifikasi terbaru.</p>
                    </div>
                )}
                <DropdownMenuSeparator />
                <div className="p-1">
                    <Link
                        href="/notifications"
                        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
                    >
                        <span>Pusat Notifikasi Lengkap</span>
                        <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
