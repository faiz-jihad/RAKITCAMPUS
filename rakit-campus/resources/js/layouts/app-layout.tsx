import HubGatewayModal from '@/components/gateway/HubGatewayModal';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, Bell, ChevronRight, Settings } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

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
    const showHubSelectorProp = (page.props as any).show_hub_selector;

    const [isGatewayOpen, setIsGatewayOpen] = useState(false);

    // Determine current Hub mode strictly
    const isCompetitionHub = useMemo(() => {
        return url.startsWith('/competitions') || url.startsWith('/competition-workspace');
    }, [url]);

    // Check login or initial session trigger
    useEffect(() => {
        if (showHubSelectorProp) {
            setIsGatewayOpen(true);
            return;
        }

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('select_hub') === '1' || params.get('select_hub') === 'true') {
                setIsGatewayOpen(true);
                return;
            }

            // Fresh login or new browser session trigger when landing on root/dashboard
            if (user && !sessionStorage.getItem('rakit_hub_chosen')) {
                if (url === '/dashboard' || url === '/') {
                    setIsGatewayOpen(true);
                }
            }
        }
    }, [showHubSelectorProp, user, url]);

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

            {/* BIG HUB GATEWAY MODAL (Triggered upon login or clicking switcher) */}
            <HubGatewayModal
                isOpen={isGatewayOpen}
                onClose={() => setIsGatewayOpen(false)}
                activeHub={isCompetitionHub ? 'competition' : 'project'}
            />

            {/* 1. TOP NAVBAR (Full-width edge-to-edge, sticky) */}
            <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-all">
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    {/* Brand Logo & Active Hub Pill */}
                    <div className="flex items-center gap-3 sm:gap-4">
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

                        {/* Interactive Hub Pill Indicator */}
                        <button
                            type="button"
                            onClick={() => setIsGatewayOpen(true)}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer group ${
                                isCompetitionHub
                                    ? 'bg-amber-50 hover:bg-amber-100/90 border border-amber-200/80 text-amber-900'
                                    : 'bg-blue-50 hover:bg-blue-100/90 border border-blue-200/80 text-blue-900'
                            }`}
                            title="Klik untuk berpindah ruang kerja"
                        >
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    isCompetitionHub ? 'bg-amber-500 animate-pulse' : 'bg-blue-600 animate-pulse'
                                }`}
                            />
                            <span>{isCompetitionHub ? 'Competition Hub' : 'Project Hub'}</span>
                            <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition ${
                                    isCompetitionHub
                                        ? 'bg-amber-200/70 text-amber-900 group-hover:bg-amber-300'
                                        : 'bg-blue-200/70 text-blue-900 group-hover:bg-blue-300'
                                }`}
                            >
                                Ganti Hub ⇄
                            </span>
                        </button>
                    </div>

                    {/* Navigation Capsule / Pills Tailored strictly to Active Hub */}
                    {isCompetitionHub ? (
                        <nav className="inline-flex items-center gap-1 bg-[#f1f3f7] p-1 rounded-full border border-slate-200/70 overflow-x-auto max-w-full">
                            <Link
                                href="/competitions?tab=explore"
                                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                    url === '/competitions' || url.includes('tab=explore')
                                        ? 'bg-[#2563eb] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Eksplor Lomba
                            </Link>
                            <Link
                                href="/competitions?tab=teams"
                                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                    url.includes('tab=teams')
                                        ? 'bg-[#2563eb] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Cari Tim (MinSatu)
                            </Link>
                            <Link
                                href="/competitions?tab=categories"
                                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                    url.includes('tab=categories')
                                        ? 'bg-[#2563eb] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Kategori
                            </Link>
                            <Link
                                href="/competitions?tab=my_competitions"
                                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                    url.includes('tab=my_competitions')
                                        ? 'bg-[#2563eb] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Lomba Saya
                            </Link>
                            <Link
                                href="/workspace"
                                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                    url.startsWith('/workspace')
                                        ? 'bg-[#2563eb] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Workspace
                            </Link>
                        </nav>
                    ) : (
                        <nav className="inline-flex items-center gap-1 bg-[#f1f3f7] p-1 rounded-full border border-slate-200/70 overflow-x-auto max-w-full">
                            <Link
                                href="/dashboard"
                                className={`px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                                    url.startsWith('/dashboard')
                                        ? 'bg-[#2563eb] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/projects"
                                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                    url.startsWith('/projects')
                                        ? 'bg-[#2563eb] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Proyek Kelas
                            </Link>
                            <Link
                                href="/workspace"
                                className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                    url.startsWith('/workspace')
                                        ? 'bg-[#2563eb] text-white shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Task Board
                            </Link>
                            <Link
                                href="/projects/create"
                                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition whitespace-nowrap"
                            >
                                + Buat Proyek
                            </Link>
                        </nav>
                    )}

                    {/* Right User Actions & Quick Switch Button */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={() => setIsGatewayOpen(true)}
                            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
                        >
                            <span>{isCompetitionHub ? 'Pindah ke Proyek' : 'Pindah ke Lomba'}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        </button>

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
