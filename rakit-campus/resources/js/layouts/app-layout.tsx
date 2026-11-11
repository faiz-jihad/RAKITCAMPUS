import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, ChevronRight, Settings } from 'lucide-react';
import React, { useMemo } from 'react';

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    activeTab?: 'dashboard' | 'lomba' | 'tim' | 'task';
    title?: string;
}

export default function AppLayout({
    children,
    breadcrumbs = [],
    activeTab,
    title,
}: AppLayoutProps) {
    const page = usePage<SharedData>();
    const auth = page.props.auth as any;
    const user = auth?.user;
    const url = page.url || '';

    // Determine active tab from explicit prop or URL
    const currentTab = useMemo(() => {
        if (activeTab) return activeTab;
        if (
            url.includes('tab=my_competitions') ||
            url.includes('subtab=teams') ||
            url.includes('tab=my_teams')
        ) {
            return 'tim';
        }
        if (url.startsWith('/competitions')) {
            return 'lomba';
        }
        if (url.startsWith('/workspace')) {
            return 'task';
        }
        if (url.startsWith('/dashboard')) {
            return 'dashboard';
        }
        return 'dashboard';
    }, [activeTab, url]);

    const initials = useMemo(() => {
        const name = user?.name || 'Mahasiswa';
        return (
            name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((w: string) => w[0].toUpperCase())
                .join('') || 'RC'
        );
    }, [user?.name]);

    const unreadCount = user?.unread_notifications_count || 0;

    return (
        <div className="min-h-screen bg-[#eceff3] p-3 sm:p-5 lg:p-7 font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
            {title && <Head title={title} />}

            {/* Giant Smooth Rounded Container matching Dashboard */}
            <main className="mx-auto max-w-[1400px] bg-[#fbfcfd] rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-7 lg:p-9 shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-slate-200/60">
                {/* 1. TOP NAVBAR (Unified Across All Pages) */}
                <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    {/* Brand Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition">
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="2.5" />
                                <circle cx="18" cy="8.5" r="2.5" />
                                <circle cx="18" cy="15.5" r="2.5" />
                                <circle cx="12" cy="19" r="2.5" />
                                <circle cx="6" cy="15.5" r="2.5" />
                                <circle cx="6" cy="8.5" r="2.5" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">
                            RakitCampus
                        </span>
                    </Link>

                    {/* Navigation Capsule / Pills */}
                    <nav className="inline-flex items-center gap-1 bg-[#f1f3f7] p-1 rounded-full border border-slate-200/70">
                        <Link
                            href="/dashboard"
                            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                                currentTab === 'dashboard'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/competitions"
                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                                currentTab === 'lomba'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Lomba
                        </Link>
                        <Link
                            href="/competitions?tab=my_competitions&subtab=teams"
                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                                currentTab === 'tim'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Tim Saya
                        </Link>
                        <Link
                            href="/workspace"
                            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition ${
                                currentTab === 'task'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Task Board
                        </Link>
                    </nav>

                    {/* Right User Actions */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/settings/profile"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Pengaturan"
                        >
                            <Settings className="w-5 h-5 stroke-[1.75]" />
                        </Link>
                        <Link
                            href="/notifications"
                            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative transition"
                            title="Notifikasi"
                        >
                            <Bell className="w-5 h-5 stroke-[1.75]" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                            )}
                        </Link>
                        <Link
                            href={user ? '/settings/profile' : '/login'}
                            className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-100 shadow-2xs overflow-hidden"
                            title={user?.name || 'Profil'}
                        >
                            {initials}
                        </Link>
                    </div>
                </header>

                {/* Optional Breadcrumbs Sub-row */}
                {breadcrumbs.length > 1 && (
                    <div className="flex items-center gap-1.5 pt-4 pb-1 text-xs text-slate-500">
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={crumb.href || idx}>
                                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                                {crumb.href && idx < breadcrumbs.length - 1 ? (
                                    <Link
                                        href={crumb.href}
                                        className="hover:text-blue-600 font-medium transition"
                                    >
                                        {crumb.title}
                                    </Link>
                                ) : (
                                    <span className="font-semibold text-slate-800 truncate max-w-[280px]">
                                        {crumb.title}
                                    </span>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}

                {/* Page Content */}
                <div className="pt-2">{children}</div>
            </main>
        </div>
    );
}
