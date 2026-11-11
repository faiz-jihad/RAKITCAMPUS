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
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
            {title && <Head title={title} />}

            {/* 1. TOP NAVBAR (Full-width edge-to-edge, sticky) */}
            <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all">
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
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
                    <nav className="inline-flex items-center gap-1 bg-[#f1f3f7] p-1 rounded-full border border-slate-200/70 overflow-x-auto max-w-full">
                        <Link
                            href="/dashboard"
                            className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                currentTab === 'dashboard'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/competitions"
                            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                currentTab === 'lomba'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Lomba
                        </Link>
                        <Link
                            href="/competitions?tab=my_competitions&subtab=teams"
                            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                currentTab === 'tim'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Tim Saya
                        </Link>
                        <Link
                            href="/workspace"
                            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                currentTab === 'task'
                                    ? 'bg-[#2563eb] text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            Task Board
                        </Link>
                    </nav>

                    {/* Right User Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
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
                </div>
            </header>

            {/* 2. MAIN FULL SCREEN CONTENT AREA (No outer border or enclosing rounded box) */}
            <main className="w-full flex-1 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
                {/* Optional Breadcrumbs Sub-row */}
                {breadcrumbs.length > 1 && (
                    <div className="flex items-center gap-1.5 pb-4 text-xs text-slate-500">
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
                <div>{children}</div>
            </main>
        </div>
    );
}
