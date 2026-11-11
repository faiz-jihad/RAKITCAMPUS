import HubGatewayModal from '@/components/gateway/HubGatewayModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, ChevronDown, ChevronRight, KeyRound, Layers, LogOut, Settings, User } from 'lucide-react';
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

    const renderUserActions = () => (
        <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
                href="/settings/profile"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                title="Pengaturan"
            >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
            </Link>
            <Link
                href="/notifications"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative transition"
                title="Notifikasi"
            >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
            </Link>

            {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 p-0.5 rounded-full hover:ring-2 hover:ring-blue-400/40 transition cursor-pointer group focus:outline-none"
                            title={user.name || 'Menu Profil'}
                            aria-label="Menu Profil"
                        >
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center ring-2 ring-slate-100 shadow-2xs overflow-hidden">
                                {user.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    initials
                                )}
                            </div>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition hidden sm:block" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-2xl shadow-xl border border-slate-200/90 bg-white z-50">
                        {/* User Header in Dropdown */}
                        <div className="px-3 py-2.5 bg-slate-50 rounded-xl mb-1 border border-slate-100">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-xs font-bold text-slate-900 truncate">
                                        {user.name}
                                    </div>
                                    <div className="text-[10px] text-slate-500 truncate">
                                        {user.email}
                                    </div>
                                    <div className="mt-1 flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded capitalize">
                                            {user.role || 'Mahasiswa'}
                                        </span>
                                        {user.campus && (
                                            <span className="text-[9px] text-slate-400 truncate">
                                                • {user.campus.name || user.campus}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DropdownMenuGroup className="space-y-0.5">
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/settings/profile"
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <User className="size-4 text-slate-400" />
                                    <span>Profil & Keahlian</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/settings/password"
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <KeyRound className="size-4 text-slate-400" />
                                    <span>Keamanan Sandi</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onSelect={() => setIsGatewayOpen(true)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                            >
                                <Layers className="size-4 text-slate-400" />
                                <div className="flex-1 flex items-center justify-between">
                                    <span>Ganti Ruang Kerja</span>
                                    <span className="text-[10px] text-blue-600 font-bold">
                                        {isCompetitionHub ? 'Competition' : 'Project'} ⇄
                                    </span>
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/notifications"
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <Bell className="size-4 text-slate-400" />
                                    <div className="flex-1 flex items-center justify-between">
                                        <span>Notifikasi</span>
                                        {unreadCount > 0 && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>

                        <DropdownMenuSeparator className="my-1 bg-slate-100" />

                        <DropdownMenuItem asChild>
                            <Link
                                method="post"
                                href="/logout"
                                as="button"
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer text-left"
                            >
                                <LogOut className="size-4 text-rose-600 shrink-0" />
                                <span>Keluar dari Akun</span>
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Link
                    href="/login"
                    className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                >
                    Masuk
                </Link>
            )}
        </div>
    );

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
                <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-4">
                    {/* Top Row on Mobile: Brand Logo + Hub Pill on Left, User Actions on Right */}
                    <div className="w-full md:w-auto flex items-center justify-between gap-3">
                        {/* Brand Logo & Active Hub Pill */}
                        <div className="flex items-center gap-2 sm:gap-3.5">
                            <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
                                <img
                                    src="/images/rakit-mark.png"
                                    alt="RAKIT"
                                    className="h-7 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
                                />
                                <div className="flex items-center gap-1.5">
                                    <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                                        RAKIT
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-blue-600 uppercase px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 tracking-wider">
                                        Campus
                                    </span>
                                </div>
                            </Link>

                            {/* Interactive Hub Pill Indicator */}
                            <button
                                type="button"
                                onClick={() => setIsGatewayOpen(true)}
                                className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition shadow-2xs cursor-pointer group ${
                                    isCompetitionHub
                                        ? 'bg-amber-50 hover:bg-amber-100/90 border border-amber-200/80 text-amber-900'
                                        : 'bg-blue-50 hover:bg-blue-100/90 border border-blue-200/80 text-blue-900'
                                }`}
                                title="Klik untuk berpindah ruang kerja"
                            >
                                <span
                                    className={`w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full ${
                                        isCompetitionHub ? 'bg-amber-500 animate-pulse' : 'bg-blue-600 animate-pulse'
                                    }`}
                                />
                                <span className="hidden xs:inline">{isCompetitionHub ? 'Competition Hub' : 'Project Hub'}</span>
                                <span className="xs:hidden">{isCompetitionHub ? 'Lomba' : 'Proyek'}</span>
                                <span
                                    className={`text-[9px] sm:text-[10px] font-semibold px-1 sm:px-1.5 py-0.5 rounded-md transition ${
                                        isCompetitionHub
                                            ? 'bg-amber-200/70 text-amber-900 group-hover:bg-amber-300'
                                            : 'bg-blue-200/70 text-blue-900 group-hover:bg-blue-300'
                                    }`}
                                >
                                    ⇄
                                </span>
                            </button>
                        </div>

                        {/* Mobile User Actions (visible on mobile only, beside brand) */}
                        <div className="flex md:hidden items-center gap-1.5">
                            {renderUserActions()}
                        </div>
                    </div>

                    {/* Navigation Capsule / Pills Tailored strictly to Active Hub */}
                    <div className="w-full md:w-auto flex justify-center md:justify-start overflow-x-auto scrollbar-none -mx-1 px-1">
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
                                    href="/competition-workspace"
                                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                        url.startsWith('/competition-workspace')
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
                    </div>

                    {/* Desktop Right User Actions */}
                    <div className="hidden md:flex items-center gap-2 sm:gap-2.5 shrink-0">
                        {renderUserActions()}
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
