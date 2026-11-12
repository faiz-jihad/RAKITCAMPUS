import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { type NotificationItem, type NotificationPreferenceItem } from '@/types/notifications';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { 
    AlertTriangle, 
    Bell, 
    BellOff, 
    Check, 
    CheckCheck, 
    Clock, 
    ExternalLink, 
    FolderKanban, 
    GraduationCap, 
    Info, 
    Lock, 
    Mail, 
    Settings, 
    ShieldAlert, 
    Sliders, 
    Sparkles, 
    Trash2, 
    Trophy, 
    Users,
    Volume2
} from 'lucide-react';
import { getPushPermissionStatus, playNotificationChime, requestPushPermission, sendBrowserNotification } from '@/lib/push-notifications';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Notifikasi', href: '/notifications' },
];

interface Props {
    notifications: {
        data: NotificationItem[];
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    unreadCount: number;
    currentFilter: string;
    currentCategory: string;
    preferences: Record<string, NotificationPreferenceItem>;
    categories: Record<string, { name: string; description: string; mandatory_email: boolean }>;
}

export default function NotificationsIndex({
    notifications,
    unreadCount,
    currentFilter,
    currentCategory,
    preferences,
    categories,
}: Props) {
    const [prefOpen, setPrefOpen] = useState(false);
    const [pushStatus, setPushStatus] = useState<string>(() => getPushPermissionStatus());

    const handleEnablePush = async () => {
        const res = await requestPushPermission();
        setPushStatus(res);
    };

    const handleTestNotification = () => {
        playNotificationChime();
        sendBrowserNotification('Uji Coba Push Notifikasi', {
            body: 'Push notifikasi browser aktif dan terhubung normal dengan RAKIT Campus.',
        });
    };

    const { data: prefData, setData: setPrefData, post: postPrefs, processing: prefProcessing } = useForm({
        preferences: Object.keys(preferences).reduce((acc, key) => {
            acc[key] = {
                in_app: preferences[key]?.in_app ?? true,
                email: preferences[key]?.email ?? true,
            };
            return acc;
        }, {} as Record<string, { in_app: boolean; email: boolean }>),
    });

    const handleFilterChange = (filter: string, category: string) => {
        router.get(
            '/notifications',
            { filter, category },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleMarkAsRead = (id: string) => {
        router.patch(
            `/notifications/${id}/read`,
            {},
            { preserveScroll: true }
        );
    };

    const handleMarkAllAsRead = () => {
        router.post(
            '/notifications/read-all',
            {},
            { preserveScroll: true }
        );
    };

    const handleDelete = (id: string) => {
        if (confirm('Hapus notifikasi ini?')) {
            router.delete(
                `/notifications/${id}`,
                { preserveScroll: true }
            );
        }
    };

    const handleSavePreferences = (e: React.FormEvent) => {
        e.preventDefault();
        postPrefs('/notifications/preferences', {
            onSuccess: () => setPrefOpen(false),
            preserveScroll: true,
        });
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'project_hub':
                return <FolderKanban className="h-4 w-4 text-blue-500" />;
            case 'competition_hub':
                return <Trophy className="h-4 w-4 text-amber-500" />;
            case 'class_management':
                return <GraduationCap className="h-4 w-4 text-emerald-500" />;
            case 'account_security':
                return <ShieldAlert className="h-4 w-4 text-rose-500" />;
            case 'deadline_reminders':
                return <Clock className="h-4 w-4 text-orange-500" />;
            default:
                return <Bell className="h-4 w-4 text-slate-500" />;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'critical':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">KRITIS</span>;
            case 'high':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">TINGGI</span>;
            case 'medium':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">SEDANG</span>;
            default:
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">INFO</span>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Pusat Notifikasi — RAKIT Campus" />

            <div className="max-w-5xl mx-auto space-y-6 pt-2">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Pusat Notifikasi
                        </h1>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="bg-blue-600 text-white font-semibold">
                                {unreadCount} Belum Dibaca
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300"
                            >
                                <CheckCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span>Tandai Semua Dibaca</span>
                            </Button>
                        )}

                        {/* Preferences Dialog */}
                        <Dialog open={prefOpen} onOpenChange={setPrefOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
                                    <Sliders className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                    <span>Preferensi Notifikasi</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <form onSubmit={handleSavePreferences}>
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <Settings className="h-5 w-5 text-blue-600" />
                                            <span>Preferensi Notifikasi & Email</span>
                                        </DialogTitle>
                                        <DialogDescription>
                                            Atur saluran penerimaan notifikasi in-app dan email untuk setiap modul aktivitas kampus Anda.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                                        {Object.entries(categories).map(([catKey, catMeta]) => {
                                            const isMandatory = catMeta.mandatory_email;
                                            const currentInApp = prefData.preferences[catKey]?.in_app ?? true;
                                            const currentEmail = isMandatory ? true : (prefData.preferences[catKey]?.email ?? true);

                                            return (
                                                <div key={catKey} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                                {getCategoryIcon(catKey)}
                                                                {catMeta.name}
                                                            </h4>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                                {catMeta.description}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                                                        {/* In-App Toggle */}
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={currentInApp}
                                                                onChange={(e) => {
                                                                    setPrefData('preferences', {
                                                                        ...prefData.preferences,
                                                                        [catKey]: {
                                                                            ...prefData.preferences[catKey],
                                                                            in_app: e.target.checked,
                                                                        },
                                                                    });
                                                                }}
                                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                            />
                                                            <span className="text-slate-700 dark:text-slate-300 font-medium">In-App Portal</span>
                                                        </label>

                                                        {/* Email Toggle */}
                                                        <label className={`flex items-center gap-2 ${isMandatory ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                                                            <input
                                                                type="checkbox"
                                                                disabled={isMandatory}
                                                                checked={currentEmail}
                                                                onChange={(e) => {
                                                                    if (isMandatory) return;
                                                                    setPrefData('preferences', {
                                                                        ...prefData.preferences,
                                                                        [catKey]: {
                                                                            ...prefData.preferences[catKey],
                                                                            email: e.target.checked,
                                                                        },
                                                                    });
                                                                }}
                                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                            />
                                                            <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                                                                <Mail className="h-3 w-3 text-slate-400" />
                                                                <span>Notifikasi Email</span>
                                                                {isMandatory && (
                                                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">(Wajib)</span>
                                                                )}
                                                            </span>
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={() => setPrefOpen(false)}>
                                            Batal
                                        </Button>
                                        <Button type="submit" disabled={prefProcessing} className="bg-blue-600 hover:bg-blue-700 text-white">
                                            {prefProcessing ? 'Menyimpan...' : 'Simpan Preferensi'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* PUSH NOTIFICATION BROWSER ACTIVATION BANNER */}
                <div className="bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white border border-blue-200/80 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="size-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Bell className="size-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-bold text-slate-900">
                                    Push Notifikasi Peramban
                                </h3>
                                {pushStatus === 'granted' ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                        <span>Aktif & Terhubung</span>
                                    </span>
                                ) : pushStatus === 'denied' ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                        Diblokir di Peramban
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        Belum Diaktifkan
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Terima notifikasi instan pada layar desktop atau ponsel saat ada undangan rekan tim, tugas baru, dan pengumuman lomba.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {pushStatus === 'granted' ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTestNotification}
                                className="text-xs font-semibold rounded-xl border-slate-300 hover:bg-blue-50 hover:text-blue-600"
                            >
                                <Volume2 className="size-3.5 mr-1" />
                                <span>Uji Suara & Notifikasi</span>
                            </Button>
                        ) : (
                            <Button
                                onClick={handleEnablePush}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                            >
                                <Bell className="size-3.5 mr-1" />
                                <span>Aktifkan Push Notifikasi</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Status */}
                    <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 text-xs">
                        <button
                            onClick={() => handleFilterChange('all', currentCategory)}
                            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                                currentFilter === 'all'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => handleFilterChange('unread', currentCategory)}
                            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                                currentFilter === 'unread'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                        >
                            Belum Dibaca {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-1.5 text-xs">
                        {[
                            { key: 'all', label: 'Semua Kategori' },
                            { key: 'project_hub', label: 'Project Hub' },
                            { key: 'competition_hub', label: 'Competition Hub' },
                            { key: 'class_management', label: 'Kelas' },
                            { key: 'deadline_reminders', label: 'Deadline' },
                            { key: 'account_security', label: 'Keamanan' },
                        ].map((cat) => (
                            <button
                                key={cat.key}
                                onClick={() => handleFilterChange(currentFilter, cat.key)}
                                className={`px-3 py-1.5 rounded-lg font-medium transition-all border ${
                                    currentCategory === cat.key
                                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 shadow-sm'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notification List */}
                <div className="space-y-3">
                    {notifications.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-12 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-4">
                                <BellOff className="h-7 w-7" />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                Tidak ada notifikasi ditemukan
                            </h3>
                            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                                {currentFilter === 'unread'
                                    ? 'Semua notifikasi Anda sudah dibaca. Anda sedang up-to-date!'
                                    : 'Belum ada notifikasi yang terkirim pada kategori atau filter ini.'}
                            </p>
                        </div>
                    ) : (
                        notifications.data.map((item) => {
                            const isUnread = !item.read_at;
                            const data = item.data || {};
                            const priority = data.priority || 'medium';
                            const category = data.category || 'general';

                            return (
                                <div
                                    key={item.id}
                                    className={`relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-2xl border transition-all ${
                                        isUnread
                                            ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50 shadow-sm'
                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }`}
                                >
                                    {/* Left Accent indicator for unread */}
                                    {isUnread && (
                                        <div className="absolute top-5 left-2 h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-950" />
                                    )}

                                    {/* Main Content */}
                                    <div className="flex items-start gap-4 flex-1 pl-2">
                                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                                            {getCategoryIcon(category)}
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {data.title || 'Notifikasi'}
                                                </h3>
                                                {getPriorityBadge(priority)}
                                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                                    • {new Date(item.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </span>
                                            </div>

                                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                {data.message}
                                            </p>

                                            {/* Details key-value pills if present */}
                                            {data.details && Object.keys(data.details).length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-1.5">
                                                    {Object.entries(data.details).map(([k, v]) => (
                                                        <span
                                                            key={k}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                                                        >
                                                            <strong className="text-slate-500 dark:text-slate-400 font-medium">{k}:</strong>
                                                            <span>{String(v)}</span>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0">
                                        {data.action_url && (
                                            <a
                                                href={data.action_url}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                                            >
                                                <span>{data.action_text || 'Lihat'}</span>
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}

                                        {isUnread ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleMarkAsRead(item.id)}
                                                className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                                title="Tandai telah dibaca"
                                            >
                                                <Check className="h-4 w-4" />
                                                <span className="hidden sm:inline">Dibaca</span>
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(item.id)}
                                                className="text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                title="Hapus notifikasi"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {notifications.last_page > 1 && (
                    <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800 text-sm">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Menampilkan halaman {notifications.current_page} dari {notifications.last_page} ({notifications.total} total)
                        </span>

                        <div className="flex gap-1">
                            {notifications.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        link.active
                                            ? 'bg-blue-600 text-white font-semibold'
                                            : !link.url
                                            ? 'text-slate-300 dark:text-slate-700 pointer-events-none'
                                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
