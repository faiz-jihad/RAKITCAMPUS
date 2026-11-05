import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Database,
    Filter,
    HelpCircle,
    Mail,
    RefreshCw,
    RotateCcw,
    Send,
    Server,
    ShieldAlert,
    ShieldCheck,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Admin Kampus', href: '/admin' },
    { title: 'Monitoring Notifikasi', href: '/admin/notifications' },
];

interface LogItem {
    id: number;
    idempotency_key: string | null;
    notification_type: string;
    category: string;
    priority: string;
    channel: string;
    recipient_email: string | null;
    subject: string | null;
    status: 'queued' | 'sent' | 'failed' | 'skipped';
    error_message: string | null;
    retry_count: number;
    last_attempted_at: string | null;
    sent_at: string | null;
    created_at: string;
    recipient: { id: number; name: string; email: string } | null;
}

interface Props {
    providerConfig: {
        mailer: string;
        is_configured: boolean;
        status: string;
        note: string;
        host: string;
        port: string | number;
        encryption: string;
        username: string;
        has_password: boolean;
        from_address: string;
        from_name: string;
    };
    queueHealth: {
        connection: string;
        pending_jobs: number;
        failed_jobs: number;
        status: string;
    };
    statistics: {
        total: number;
        sent: number;
        failed: number;
        queued: number;
        skipped: number;
        success_rate: number;
        last_successful_at: string;
        last_failure_at: string;
        last_failure_reason: string | null;
    };
    logs: {
        data: LogItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: {
        status?: string;
        channel?: string;
        category?: string;
        search?: string;
    };
}

export default function AdminNotificationsIndex({
    providerConfig,
    queueHealth,
    statistics,
    logs,
    filters,
}: Props) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const { data: testData, setData: setTestData, post: postTest, processing: testProcessing } = useForm({
        email: '',
    });

    const handleSendTestEmail = (e: React.FormEvent) => {
        e.preventDefault();
        postTest('/admin/notifications/send-test', {
            preserveScroll: true,
            onSuccess: () => setTestData('email', ''),
        });
    };

    const handleFilterChange = (newFilters: Record<string, string | undefined>) => {
        router.get(
            '/admin/notifications',
            { ...filters, ...newFilters },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleRetry = (logId: number) => {
        router.post(
            `/admin/notifications/retry/${logId}`,
            {},
            { preserveScroll: true }
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monitoring Notifikasi & Email — Admin RAKIT Campus" />

            <div className="container mx-auto max-w-7xl px-4 py-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Monitoring Notifikasi & Email
                            </h1>
                            <Badge
                                variant={providerConfig.is_configured ? 'default' : 'destructive'}
                                className={providerConfig.is_configured ? 'bg-emerald-600' : 'bg-rose-600'}
                            >
                                {providerConfig.status}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Observasi infrastruktur pengiriman email transactional, antrean job queue, dan audit log notifikasi platform.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload({ preserveScroll: true })}
                            className="flex items-center gap-1.5 text-xs"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Refresh Metrik</span>
                        </Button>
                    </div>
                </div>

                {/* Grid 3 Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 1. Provider Status */}
                    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Mail className="h-4 w-4 text-blue-600" />
                                    Email Provider (SMTP)
                                </CardTitle>
                                {providerConfig.is_configured ? (
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950" />
                                ) : (
                                    <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950" />
                                )}
                            </div>
                            <CardDescription className="text-xs">
                                {providerConfig.note}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Mailer Driver:</span>
                                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{providerConfig.mailer}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Host & Port:</span>
                                <span className="font-mono text-slate-800 dark:text-slate-200">{providerConfig.host}:{providerConfig.port} ({providerConfig.encryption})</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Username:</span>
                                <span className="font-mono text-slate-800 dark:text-slate-200">{providerConfig.username}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-500">Sender Address:</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400">{providerConfig.from_address}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Queue Health */}
                    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Server className="h-4 w-4 text-indigo-600" />
                                    Queue Worker & Scheduler
                                </CardTitle>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    queueHealth.failed_jobs > 0
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                }`}>
                                    {queueHealth.status}
                                </span>
                            </div>
                            <CardDescription className="text-xs">
                                Koneksi driver: <strong className="font-mono">{queueHealth.connection}</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Jobs Tertunda (Pending):</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{queueHealth.pending_jobs} antrean</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-slate-500">Gagal Dieksekusi (Failed):</span>
                                <span className={`font-semibold ${queueHealth.failed_jobs > 0 ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {queueHealth.failed_jobs} job
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-500">Scheduled Reminders:</span>
                                <span className="text-emerald-600 font-medium">Hourly (Active)</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Send Test Email Card */}
                    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white">
                                <Send className="h-4 w-4 text-emerald-600" />
                                Uji Koneksi Email (Live Test)
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Kirimkan pesan uji nyata untuk memverifikasi apakah provider email berfungsi.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSendTestEmail} className="space-y-3">
                                <Input
                                    type="email"
                                    placeholder="alamat.email@tujuan.com"
                                    value={testData.email}
                                    onChange={(e) => setTestData('email', e.target.value)}
                                    required
                                    className="text-xs h-9"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={testProcessing || !testData.email}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 flex items-center justify-center gap-1.5"
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    <span>{testProcessing ? 'Mengirim Pesan...' : 'Kirim Email Uji Coba'}</span>
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Delivery Statistics Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-xs text-slate-500">Total Log</span>
                        <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{statistics.total}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Terkirim (Sent)</span>
                        <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{statistics.sent}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">Gagal (Failed)</span>
                        <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{statistics.failed}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Antrean (Queued)</span>
                        <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{statistics.queued}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-xs text-slate-500">Dilewati (Skipped)</span>
                        <div className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">{statistics.skipped}</div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-xs text-slate-500">Tingkat Keberhasilan</span>
                        <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{statistics.success_rate}%</div>
                    </div>
                </div>

                {/* Delivery Logs Table Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Riwayat Log Pengiriman Notifikasi
                            </h2>
                            <p className="text-xs text-slate-500">
                                Audit trail terperinci setiap pengiriman pesan notifikasi via In-App maupun Email.
                            </p>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleFilterChange({ search: searchTerm });
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    type="text"
                                    placeholder="Cari email, subjek..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="text-xs h-8 w-48"
                                />
                                <Button type="submit" size="sm" variant="secondary" className="text-xs h-8">
                                    Cari
                                </Button>
                            </form>

                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
                                className="text-xs h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-slate-700 dark:text-slate-300"
                            >
                                <option value="">Semua Status</option>
                                <option value="sent">Sent</option>
                                <option value="failed">Failed</option>
                                <option value="queued">Queued</option>
                                <option value="skipped">Skipped</option>
                            </select>

                            <select
                                value={filters.channel || ''}
                                onChange={(e) => handleFilterChange({ channel: e.target.value || undefined })}
                                className="text-xs h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-slate-700 dark:text-slate-300"
                            >
                                <option value="">Semua Saluran</option>
                                <option value="email">Email</option>
                                <option value="in_app">In-App</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">Waktu</th>
                                    <th className="py-3 px-4">Penerima</th>
                                    <th className="py-3 px-4">Tipe & Saluran</th>
                                    <th className="py-3 px-4">Subjek Pesan</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400">
                                            Tidak ada riwayat log pengiriman ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString('id-ID', {
                                                    dateStyle: 'short',
                                                    timeStyle: 'medium',
                                                })}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-slate-900 dark:text-white">
                                                    {log.recipient?.name || log.recipient_email || '-'}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {log.recipient_email || log.recipient?.email || '-'}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                                                    <span className={`h-2 w-2 rounded-full ${log.channel === 'email' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                                                    <span className="uppercase text-[10px]">{log.channel}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                    {log.notification_type}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 max-w-xs">
                                                <div className="truncate font-medium text-slate-800 dark:text-slate-200" title={log.subject || ''}>
                                                    {log.subject || '-'}
                                                </div>
                                                {log.error_message && (
                                                    <div className="text-[10px] text-rose-500 truncate mt-0.5" title={log.error_message}>
                                                        Err: {log.error_message}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                {log.status === 'sent' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3 w-3" /> Sent
                                                    </span>
                                                )}
                                                {log.status === 'queued' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                                                        <Clock className="h-3 w-3" /> Queued
                                                    </span>
                                                )}
                                                {log.status === 'failed' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                                                        <XCircle className="h-3 w-3" /> Failed ({log.retry_count}x)
                                                    </span>
                                                )}
                                                {log.status === 'skipped' && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                        Skipped
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                {log.status === 'failed' && log.channel === 'email' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRetry(log.id)}
                                                        className="text-[11px] h-7 px-2 text-rose-600 hover:text-rose-700"
                                                    >
                                                        <RotateCcw className="h-3 w-3 mr-1" /> Retry
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.last_page > 1 && (
                        <div className="flex items-center justify-between pt-4 text-xs">
                            <span className="text-slate-500">
                                Menampilkan halaman {logs.current_page} dari {logs.last_page} ({logs.total} total)
                            </span>
                            <div className="flex gap-1">
                                {logs.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : !link.url
                                                ? 'text-slate-300 pointer-events-none'
                                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
