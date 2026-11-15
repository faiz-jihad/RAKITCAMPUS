import AppFooter from '@/components/app-footer';
import HubGatewayModal from '@/components/gateway/HubGatewayModal';
import { NotificationBell } from '@/components/notification-bell';
import { playNotificationChime, sendBrowserNotification } from '@/lib/push-notifications';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Award,
    Bell,
    BookmarkCheck,
    Bot,
    Briefcase,
    ChevronRight,
    ChevronsUpDown,
    Compass,
    FolderKanban,
    GraduationCap,
    KeyRound,
    Layers,
    LayoutDashboard,
    LogOut,
    Mail,
    PlusCircle,
    Puzzle,
    Settings,
    ShieldCheck,
    Trophy,
    User,
    Users,
} from 'lucide-react';

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
    const isAdmin = Boolean(
        user?.is_platform_admin ||
        user?.is_campus_admin ||
        user?.role === 'platform_admin' ||
        user?.role === 'campus_admin' ||
        user?.role === 'admin' ||
        user?.campus?.role === 'admin' ||
        user?.campus?.role === 'campus_admin'
    );
    const [isGatewayOpen, setIsGatewayOpen] = useState(false);

    // Persistent & route-aware active hub state (defaults to 'competition' to protect user flow)
    const [activeHub, setActiveHub] = useState<'competition' | 'project'>(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const hubParam = params.get('hub');
            if (hubParam === 'competition') return 'competition';
            if (hubParam === 'project') return 'project';

            const pathname = window.location.pathname;
            if (pathname.startsWith('/competitions') || pathname.startsWith('/competition-workspace')) {
                return 'competition';
            }
            if (
                pathname.startsWith('/projects') ||
                pathname.startsWith('/classes') ||
                (pathname.startsWith('/workspace') && !pathname.startsWith('/competition-workspace'))
            ) {
                return 'project';
            }

            try {
                const saved = localStorage.getItem('rakit_active_hub');
                if (saved === 'competition' || saved === 'project') {
                    return saved;
                }
            } catch {
                // ignore
            }
        }
        return 'competition';
    });
    const isCompetitionHub = activeHub === 'competition';

    // Synchronize hub state and prevent accidental jumping to project hub
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const hubParam = params.get('hub');
            const pathname = window.location.pathname;

            let detectedHub: 'competition' | 'project' | null = null;

            if (hubParam === 'competition') {
                detectedHub = 'competition';
            } else if (hubParam === 'project') {
                detectedHub = 'project';
            } else if (pathname.startsWith('/competitions') || pathname.startsWith('/competition-workspace')) {
                detectedHub = 'competition';
            } else if (
                pathname.startsWith('/projects') ||
                pathname.startsWith('/classes') ||
                (pathname.startsWith('/workspace') && !pathname.startsWith('/competition-workspace'))
            ) {
                detectedHub = 'project';
            } else if (pathname === '/dashboard') {
                if (!isAdmin) {
                    const saved = localStorage.getItem('rakit_active_hub');
                    // If student was in competition hub, prevent sudden jump to project dashboard from system redirects
                    if (saved === 'competition' && !params.has('hub')) {
                        router.get('/competitions');
                        return;
                    }
                }
                detectedHub = 'project';
            }

            if (detectedHub) {
                setActiveHub(detectedHub);
                try {
                    localStorage.setItem('rakit_active_hub', detectedHub);
                    sessionStorage.setItem('rakit_hub_chosen', detectedHub);
                } catch {
                    // ignore
                }
            } else {
                // On neutral pages (/notifications, /settings/*, /terms, /privacy, /leaderboard overall),
                // maintain currently saved active hub so the user never loses their hub context
                try {
                    const saved = localStorage.getItem('rakit_active_hub') as 'competition' | 'project' | null;
                    if (saved && (saved === 'competition' || saved === 'project')) {
                        setActiveHub(saved);
                    }
                } catch {
                    // ignore
                }
            }
        }
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
            {/* Ganti Ruang Kerja (Single Jigsaw Button: Chrome Extensions Style, Colored & Center Workspace Icon) */}
            <button
                type="button"
                onClick={() => setIsGatewayOpen(true)}
                className="relative w-[34px] h-[34px] sm:w-[38px] sm:h-[38px] flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none shrink-0"
                title={`Ganti Ruang Kerja (Aktif: ${isCompetitionHub ? 'Lomba Hub' : 'Proyek Hub'})`}
                aria-label={`Ganti Ruang Kerja (${isCompetitionHub ? 'Lomba Hub' : 'Proyek Hub'})`}
            >
                {/* SVG Jigsaw Piece (Chrome Extensions Style) */}
                <svg
                    viewBox="0 0 24 24"
                    className="w-full h-full overflow-visible transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_2px_4px_rgba(15,23,42,0.16)]"
                >
                    <defs>
                        <linearGradient id="nav-jigsaw-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#1D4ED8" />
                        </linearGradient>
                        <linearGradient id="nav-jigsaw-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M5 21q-.85 0-1.425-.575T3 19v-3.8q1.2 0 2.1-.762T6 12.5q0-1.15-.9-1.9T3 9.8V6q0-.825.588-1.412T5 4h3.05q.175-1.275 1.15-2.137T11.5 1q1.3 0 2.275.863T14.95 4H18q.825 0 1.413.588T20 6v3.35q.9.45 1.45 1.3T22 12.5q0 1.025-.55 1.875T20 15.65V19q0 .85-.587 1.425T18 21z"
                        fill={isCompetitionHub ? 'url(#nav-jigsaw-amber)' : 'url(#nav-jigsaw-blue)'}
                        stroke={isCompetitionHub ? '#B45309' : '#1E40AF'}
                        strokeWidth="0.5"
                        strokeLinejoin="round"
                        className="transition-colors duration-300"
                    />
                </svg>

                {/* Center Workspace Icon (Folder for Proyek Hub, Trophy for Lomba Hub) */}
                <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-200 group-hover:scale-105"
                    style={{ transform: 'translate(0.5px, 0.5px)' }}
                >
                    {isCompetitionHub ? (
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.2] drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.4)]" />
                    ) : (
                        <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[2.2] drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.4)]" />
                    )}
                </div>
            </button>

            <NotificationBell />

            {user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="p-0.5 rounded-full hover:ring-2 hover:ring-blue-400/40 transition cursor-pointer group focus:outline-none"
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
                            <DropdownMenuItem asChild>
                                <Link
                                    href="/ai-workspace"
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                                >
                                    <Bot className="size-4 text-blue-600" />
                                    <div className="flex-1 flex items-center justify-between">
                                        <span>AI Workspace</span>
                                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                            Kopilot
                                        </span>
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
                            <span className="text-base sm:text-xl font-black tracking-tight text-slate-900">
                                RAKIT CAMPUS
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation Tabs (Option 1: Underline Tabs - Clean Minimalist) */}
                    <div className="hidden md:flex items-center justify-center h-full overflow-x-auto scrollbar-none">
                        {isCompetitionHub ? (
                            <nav className="flex items-center gap-1 sm:gap-2 h-full">
                                <Link
                                    href="/competitions?tab=explore"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url === '/competitions' || url.includes('tab=explore')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Eksplor Lomba
                                </Link>
                                <Link
                                    href="/competitions?tab=teams"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url.includes('tab=teams')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Cari Tim
                                </Link>
                                <Link
                                    href="/competitions?tab=categories"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url.includes('tab=categories')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Kategori
                                </Link>
                                <Link
                                    href="/competitions?tab=my_competitions"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url.includes('tab=my_competitions')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Lomba Saya
                                </Link>
                                <Link
                                    href="/competition-workspace"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url.startsWith('/competition-workspace')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Workspace
                                </Link>
                                <Link
                                    href="/leaderboard?hub=competition"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url.startsWith('/leaderboard')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Leaderboard
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/admin"
                                        className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                                            url.startsWith('/admin')
                                                ? 'bg-rose-600 text-white shadow-sm'
                                                : 'text-rose-700 hover:text-rose-900 bg-rose-50 border border-rose-200/80 hover:bg-rose-100'
                                        }`}
                                    >
                                        <ShieldCheck className="size-3.5" />
                                        <span>Panel Admin</span>
                                    </Link>
                                )}
                                {isLecturer && (
                                    <Link
                                        href="/classes"
                                        className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition whitespace-nowrap flex items-center gap-1.5 ${
                                            url.startsWith('/classes')
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100'
                                        }`}
                                    >
                                        <GraduationCap className="size-3.5" />
                                        <span>Kelas Bimbingan</span>
                                    </Link>
                                )}
                            </nav>
                        ) : (
                            <nav className="flex items-center gap-1 sm:gap-2 h-full">
                                <Link
                                    href="/dashboard"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url.startsWith('/dashboard')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/classes"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url.startsWith('/classes')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Ruang Kelas
                                </Link>
                                <Link
                                    href="/projects"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url.startsWith('/projects')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Proyek
                                </Link>
                                <Link
                                    href="/workspace"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url.startsWith('/workspace')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Workspace
                                </Link>
                                <Link
                                    href="/leaderboard?hub=project"
                                    className={`relative h-14 sm:h-16 flex items-center px-3 sm:px-4 text-xs sm:text-sm transition-colors whitespace-nowrap ${
                                        url.startsWith('/leaderboard')
                                            ? 'text-blue-600 font-bold after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2.5px] after:bg-blue-600 after:rounded-full'
                                            : 'text-slate-500 hover:text-slate-900 font-medium hover:after:absolute hover:after:bottom-0 hover:after:left-2 hover:after:right-2 hover:after:h-[2px] hover:after:bg-slate-300 hover:after:rounded-full'
                                    }`}
                                >
                                    Leaderboard
                                </Link>
                            </nav>
                        )}
                    </div>

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
            <main className="w-full flex-1 max-w-[1600px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-7">
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

            {/* Platform Footer */}
            <AppFooter />

            {/* 3. MOBILE BOTTOM NAVIGATION (Fixed at bottom on mobile, Hub-aware) */}
            <nav
                aria-label="Mobile Navigation"
                className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden pb-[env(safe-area-inset-bottom,0px)]"
            >
                <div className="grid grid-cols-5 h-16 items-center px-1 max-w-lg mx-auto">
                    {isAdmin ? (
                        <>
                            {/* 1. Dashboard Admin */}
                            <Link
                                href="/admin"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url === '/admin' || url === '/dashboard'
                                        ? 'text-rose-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <LayoutDashboard
                                    className={`size-5 ${
                                        url === '/admin' || url === '/dashboard'
                                            ? 'stroke-[2.25] text-rose-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Admin</span>
                            </Link>

                            {/* 2. Verifikasi Mahasiswa */}
                            <Link
                                href="/admin/students"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.startsWith('/admin/students')
                                        ? 'text-rose-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <Users
                                    className={`size-5 ${
                                        url.startsWith('/admin/students')
                                            ? 'stroke-[2.25] text-rose-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Verifikasi</span>
                            </Link>

                            {/* 3. Kelola Lomba */}
                            <Link
                                href="/admin/competitions"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.startsWith('/admin/competitions')
                                        ? 'text-rose-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <Trophy
                                    className={`size-5 ${
                                        url.startsWith('/admin/competitions')
                                            ? 'stroke-[2.25] text-rose-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Kompetisi</span>
                            </Link>

                            {/* 4. Monitoring Email */}
                            <Link
                                href="/admin/notifications"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.startsWith('/admin/notifications')
                                        ? 'text-rose-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <Mail
                                    className={`size-5 ${
                                        url.startsWith('/admin/notifications')
                                            ? 'stroke-[2.25] text-rose-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Email</span>
                            </Link>

                            {/* 5. Aturan Leaderboard */}
                            <Link
                                href="/leaderboard/admin"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.startsWith('/leaderboard/admin')
                                        ? 'text-rose-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <Award
                                    className={`size-5 ${
                                        url.startsWith('/leaderboard/admin')
                                            ? 'stroke-[2.25] text-rose-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Poin</span>
                            </Link>
                        </>
                    ) : isCompetitionHub ? (
                        <>
                            {/* 1. Eksplor Lomba */}
                            <Link
                                href="/competitions?tab=explore"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    (url === '/competitions' || url.includes('tab=explore')) &&
                                    !url.includes('tab=teams') &&
                                    !url.includes('tab=my_competitions')
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <Compass
                                    className={`size-5 ${
                                        (url === '/competitions' || url.includes('tab=explore')) &&
                                        !url.includes('tab=teams') &&
                                        !url.includes('tab=my_competitions')
                                            ? 'stroke-[2.25] text-blue-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Eksplor</span>
                            </Link>

                            {/* 2. Cari Tim */}
                            <Link
                                href="/competitions?tab=teams"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.includes('tab=teams')
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <Users
                                    className={`size-5 ${
                                        url.includes('tab=teams') ? 'stroke-[2.25] text-blue-600' : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Cari Tim</span>
                            </Link>

                            {/* 3. Lomba Saya */}
                            <Link
                                href="/competitions?tab=my_competitions"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.includes('tab=my_competitions')
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <BookmarkCheck
                                    className={`size-5 ${
                                        url.includes('tab=my_competitions')
                                            ? 'stroke-[2.25] text-blue-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Lomba Saya</span>
                            </Link>

                            {/* 4. Workspace Tim */}
                            <Link
                                href="/competition-workspace"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.startsWith('/competition-workspace')
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <Briefcase
                                    className={`size-5 ${
                                        url.startsWith('/competition-workspace')
                                            ? 'stroke-[2.25] text-blue-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Workspace</span>
                            </Link>

                            {/* 5. Leaderboard */}
                            <Link
                                href="/leaderboard?hub=competition"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.startsWith('/leaderboard')
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <Trophy
                                    className={`size-5 ${
                                        url.startsWith('/leaderboard')
                                            ? 'stroke-[2.25] text-blue-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Peringkat</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            {/* 1. Dashboard */}
                            <Link
                                href="/dashboard"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url === '/dashboard' || url === '/'
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <LayoutDashboard
                                    className={`size-5 ${
                                        url === '/dashboard' || url === '/'
                                            ? 'stroke-[2.25] text-blue-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Dashboard</span>
                            </Link>

                            {/* 2. Ruang Kelas */}
                            <Link
                                href="/classes"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.startsWith('/classes')
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <GraduationCap
                                    className={`size-5 ${
                                        url.startsWith('/classes')
                                            ? 'stroke-[2.25] text-blue-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Kelas</span>
                            </Link>

                            {/* 3. Proyek Kelas */}
                            <Link
                                href="/projects"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.startsWith('/projects') && !url.startsWith('/projects/create')
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <FolderKanban
                                    className={`size-5 ${
                                        url.startsWith('/projects') && !url.startsWith('/projects/create')
                                            ? 'stroke-[2.25] text-blue-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Proyek</span>
                            </Link>

                            {/* 4. Workspace / Kelas */}
                            {isLecturer ? (
                                <Link
                                    href="/classes"
                                    className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                        url.startsWith('/classes')
                                            ? 'text-emerald-600 font-bold'
                                            : 'text-slate-500 hover:text-slate-800 font-medium'
                                    }`}
                                >
                                    <GraduationCap
                                        className={`size-5 ${
                                            url.startsWith('/classes')
                                                ? 'stroke-[2.25] text-emerald-600'
                                                : 'stroke-[1.75]'
                                        }`}
                                    />
                                    <span className="text-[10px] leading-none tracking-tight">Kelas</span>
                                </Link>
                            ) : (
                                <Link
                                    href="/workspace"
                                    className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                        url.startsWith('/workspace')
                                            ? 'text-blue-600 font-bold'
                                            : 'text-slate-500 hover:text-slate-800 font-medium'
                                    }`}
                                >
                                    <Layers
                                        className={`size-5 ${
                                            url.startsWith('/workspace')
                                                ? 'stroke-[2.25] text-blue-600'
                                                : 'stroke-[1.75]'
                                        }`}
                                    />
                                    <span className="text-[10px] leading-none tracking-tight">Workspace</span>
                                </Link>
                            )}

                            {/* 5. Leaderboard */}
                            <Link
                                href="/leaderboard?hub=project"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.startsWith('/leaderboard')
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <Trophy
                                    className={`size-5 ${
                                        url.startsWith('/leaderboard')
                                            ? 'stroke-[2.25] text-blue-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Peringkat</span>
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
}
