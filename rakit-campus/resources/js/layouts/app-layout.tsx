import AppFooter from '@/components/app-footer';
import HubGatewayModal from '@/components/gateway/HubGatewayModal';
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
    ChevronDown,
    ChevronRight,
    Compass,
    FolderKanban,
    KeyRound,
    Layers,
    LayoutDashboard,
    LogOut,
    PlusCircle,
    Settings,
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
    const showHubSelectorProp = (page.props as any).show_hub_selector;

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
                (pathname.startsWith('/workspace') && !pathname.startsWith('/competition-workspace'))
            ) {
                detectedHub = 'project';
            } else if (pathname === '/dashboard') {
                const saved = localStorage.getItem('rakit_active_hub');
                // If user was in competition hub, prevent sudden jump to project dashboard from system redirects
                if (saved === 'competition' && !params.has('hub')) {
                    router.get('/competitions');
                    return;
                } else {
                    detectedHub = 'project';
                }
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

    const isCompetitionHub = activeHub === 'competition';

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

            // Fresh login trigger only when no hub has EVER been chosen
            if (user && !sessionStorage.getItem('rakit_hub_chosen') && !localStorage.getItem('rakit_active_hub')) {
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
    const prevUnreadRef = useRef<number>(unreadCount);

    useEffect(() => {
        if (unreadCount > prevUnreadRef.current) {
            playNotificationChime();
            sendBrowserNotification('RAKIT Campus — Notifikasi Baru', {
                body: `Anda memiliki ${unreadCount} notifikasi baru. Klik untuk meninjau.`,
            });
        }
        prevUnreadRef.current = unreadCount;
    }, [unreadCount]);

    const renderUserActions = () => (
        <div className="flex items-center gap-1.5 sm:gap-2">
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
                                        {isCompetitionHub ? 'Lomba Hub' : 'Campus Hub'} ⇄
                                    </span>
                                </div>
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
                <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
                    {/* Brand Logo & Active Hub Pill */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <Link
                            href={isCompetitionHub ? '/competitions' : '/dashboard'}
                            className="flex items-center gap-1.5 sm:gap-2 group shrink-0"
                        >
                            <img
                                src="/images/rakit-mark.png"
                                alt="RAKIT"
                                className="h-6 sm:h-8 w-auto object-contain transition-transform group-hover:scale-105"
                            />
                            <div className="flex items-center gap-1.5">
                                <span className="text-base sm:text-xl font-black tracking-tight text-slate-900">
                                    RAKIT
                                </span>
                                <span className="hidden sm:inline-block text-[10px] font-bold text-blue-600 uppercase px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/80 tracking-wider">
                                    Campus
                                </span>
                            </div>
                        </Link>

                        {/* Interactive Hub Pill Indicator */}
                        <button
                            type="button"
                            onClick={() => setIsGatewayOpen(true)}
                            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-700 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer group shrink-0"
                            title="Beralih Ruang Kerja (Hub)"
                        >
                            <span
                                className={`size-1.5 rounded-full shrink-0 ${
                                    isCompetitionHub ? 'bg-amber-500' : 'bg-blue-600'
                                }`}
                            />
                            <span className="hidden sm:inline">{isCompetitionHub ? 'Lomba Hub' : 'Campus Hub'}</span>
                            <span className="sm:hidden">{isCompetitionHub ? 'Lomba' : 'Campus'}</span>
                            <ArrowLeftRight className="size-2.5 sm:size-3 text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" />
                        </button>
                    </div>

                    {/* Desktop Navigation Capsule / Pills (Hidden on Mobile, placed in Bottom Nav) */}
                    <div className="hidden md:flex items-center justify-center overflow-x-auto scrollbar-none">
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
                                    Cari Tim
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
                                <Link
                                    href="/leaderboard?hub=competition"
                                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                        url.startsWith('/leaderboard')
                                            ? 'bg-[#2563eb] text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Leaderboard
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
                                    Proyek
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
                                <Link
                                    href="/leaderboard?hub=project"
                                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                                        url.startsWith('/leaderboard')
                                            ? 'bg-[#2563eb] text-white shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Leaderboard
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

                    {/* Right User Actions (visible on all screens) */}
                    <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                        {renderUserActions()}
                    </div>
                </div>
            </header>

            {/* 2. MAIN FULL SCREEN CONTENT AREA (with safe bottom padding for mobile bottom bar) */}
            <main className="w-full flex-1 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 md:pb-7">
                {/* Optional Breadcrumbs Sub-row */}
                {breadcrumbs.length > 1 && (
                    <div className="flex items-center gap-1.5 pb-3 sm:pb-4 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
                        {breadcrumbs.map((crumb, idx) => (
                            <React.Fragment key={crumb.href || idx}>
                                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                                {crumb.href && idx < breadcrumbs.length - 1 ? (
                                    <Link
                                        href={crumb.href}
                                        className="hover:text-blue-600 font-medium transition shrink-0"
                                    >
                                        {crumb.title}
                                    </Link>
                                ) : (
                                    <span className="font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-[320px] shrink-0">
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
                    {isCompetitionHub ? (
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

                            {/* 2. Proyek Kelas */}
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

                            {/* 3. Workspace */}
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

                            {/* 4. Leaderboard */}
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

                            {/* 5. Buat Proyek */}
                            <Link
                                href="/projects/create"
                                className={`flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition ${
                                    url.startsWith('/projects/create')
                                        ? 'text-blue-600 font-bold'
                                        : 'text-slate-500 hover:text-slate-800 font-medium'
                                }`}
                            >
                                <PlusCircle
                                    className={`size-5 ${
                                        url.startsWith('/projects/create')
                                            ? 'stroke-[2.25] text-blue-600'
                                            : 'stroke-[1.75]'
                                    }`}
                                />
                                <span className="text-[10px] leading-none tracking-tight">Buat</span>
                            </Link>
                        </>
                    )}
                </div>
            </nav>
        </div>
    );
}
