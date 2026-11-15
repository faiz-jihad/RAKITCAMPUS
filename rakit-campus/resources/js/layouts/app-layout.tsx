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
import { Bell, ChevronDown, ChevronRight, KeyRound, Layers, LogOut, RefreshCw, Settings, User } from 'lucide-react';
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
    const isLecturer = Boolean(user?.is_lecturer || user?.role === 'lecturer' || user?.campus?.role === 'lecturer');
    const [isGatewayOpen, setIsGatewayOpen] = useState(false);

    // Determine current Hub mode strictly
    const isCompetitionHub = useMemo(() => {
        return url.startsWith('/competitions') || url.startsWith('/competition-workspace');
    }, [url]);

    // Check explicit select_hub URL parameter only (never auto-popup on tab click or /dashboard)
    useEffect(() => {
        if (isLecturer) {
            setIsGatewayOpen(false);
            return;
        }

        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('select_hub') === '1' || params.get('select_hub') === 'true') {
                setIsGatewayOpen(true);
                return;
            }
        }

        // Jangan pernah memunculkan pop-up otomatis saat pindah tab atau klik Dashboard
        setIsGatewayOpen(false);
    }, [url, isLecturer]);

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
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center ring-1 ring-slate-200 shadow-2xs overflow-hidden">
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
                                <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
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
                            {!isLecturer && (
                                <DropdownMenuItem
                                    onSelect={() => setIsGatewayOpen(true)}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <Layers className="size-4 text-slate-400" />
                                    <div className="flex-1 flex items-center justify-between">
                                        <span>Ganti Ruang Kerja</span>
                                        <span className="text-[10px] text-blue-600 font-bold inline-flex items-center gap-1">
                                            <span>{isCompetitionHub ? 'Competition' : 'Project'}</span>
                                            <RefreshCw className="size-2.5" />
                                        </span>
                                    </div>
                                </DropdownMenuItem>
                            )}
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

    const navItems = useMemo(() => {
        if (isLecturer) {
            return [
                { label: 'Dashboard Pengampu', href: '/dashboard', active: url.startsWith('/dashboard') },
                { label: 'Kelola Ruang Kelas', href: '/classes', active: url.startsWith('/classes') },
                { label: 'Eksplorasi Proyek', href: '/projects', active: url.startsWith('/projects') },
            ];
        }

        if (isCompetitionHub) {
            return [
                { label: 'Eksplor Lomba', href: '/competitions?tab=explore', active: url === '/competitions' || url.includes('tab=explore') },
                { label: 'Cari Tim (MinSatu)', href: '/competitions?tab=teams', active: url.includes('tab=teams') },
                { label: 'Kategori', href: '/competitions?tab=categories', active: url.includes('tab=categories') },
                { label: 'Lomba Saya', href: '/competitions?tab=my_competitions', active: url.includes('tab=my_competitions') },
                { label: 'Workspace', href: '/competition-workspace', active: url.startsWith('/competition-workspace') },
                { label: 'Leaderboard', href: '/leaderboard?hub=competition', active: url.startsWith('/leaderboard') },
            ];
        }

        return [
            { label: 'Dashboard', href: '/dashboard', active: url.startsWith('/dashboard') },
            { label: 'Ruang Kelas', href: '/classes', active: url.startsWith('/classes') },
            { label: 'Proyek Kelas', href: '/projects', active: url.startsWith('/projects') },
            { label: 'Workspace', href: '/workspace', active: url.startsWith('/workspace') },
            { label: 'Leaderboard', href: '/leaderboard?hub=project', active: url.startsWith('/leaderboard') },
        ];
    }, [isLecturer, isCompetitionHub, url]);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
            {title && <Head title={title} />}

            {/* BIG HUB GATEWAY MODAL (Only for students, never for lecturers) */}
            {!isLecturer && (
                <HubGatewayModal
                    isOpen={isGatewayOpen}
                    onClose={() => setIsGatewayOpen(false)}
                    activeHub={isCompetitionHub ? 'competition' : 'project'}
                />
            )}

            {/* 1. TOP NAVBAR (Full-width edge-to-edge, sticky) */}
            <header className="w-full bg-white/95 dark:bg-[#06080F]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 transition-all">
                <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
                    {/* Brand Logo & Hub Switcher */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                        <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
                            <img
                                src="/images/rakit-mark.png"
                                alt="RAKIT"
                                className="h-7 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                            <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                                    RAKIT
                                </span>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800 tracking-wider">
                                    Campus
                                </span>
                            </div>
                        </Link>

                        <div className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-800" />

                        {/* Hub Selector */}
                        {isLecturer ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                <span className="size-1.5 rounded-full bg-blue-600" />
                                <span>Portal Dosen</span>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setIsGatewayOpen(true)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 transition cursor-pointer group"
                                title="Klik untuk berganti ruang kerja"
                            >
                                <Layers className="size-3.5 text-slate-500 group-hover:text-blue-600 transition" />
                                <span className="hidden xs:inline">{isCompetitionHub ? 'Competition Hub' : 'Project Hub'}</span>
                                <span className="xs:hidden">{isCompetitionHub ? 'Lomba' : 'Proyek'}</span>
                                <ChevronDown className="size-3 text-slate-400 group-hover:text-slate-600 transition" />
                            </button>
                        )}
                    </div>

                    {/* Desktop Navigation Links (Linear/GitHub style - clean text links) */}
                    <nav className="hidden md:flex items-center gap-1 overflow-x-auto">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition whitespace-nowrap ${
                                    item.active
                                        ? 'bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right User Actions (Always aligned right) */}
                    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                        {renderUserActions()}
                    </div>
                </div>

                {/* Mobile Subnav Strip: Smooth horizontal scroll, clean hairline border */}
                <div className="md:hidden border-t border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-[#06080F]/95 px-3 py-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition ${
                                item.active
                                    ? 'bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-white'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
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
