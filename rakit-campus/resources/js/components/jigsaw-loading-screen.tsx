import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { router } from '@inertiajs/react';
import { RAKIT_MARK_DATA_URI } from './rakit-mark-data-uri';

// Dimensions for the Jigsaw Logo Canvas
const CANVAS_SIZE = 200;

// Authentic Cubic Bezier Jigsaw Paths for a 2x2 interlocking grid (4 pieces)
// Each piece is 100x100 with matching tabs & sockets along the internal seams (x=100, y=100)
export const JIGSAW_PIECE_PATHS = [
    // Piece 0: Top-Left (TL)
    // Top: Flat (0,0)->(100,0)
    // Right: Tab pointing RIGHT into TR (dir = +1)
    // Bottom: Tab pointing DOWN into BL (dir = +1, drawn reversed 100->0)
    // Left: Flat (0,100)->(0,0)
    `M 0 0 ` +
    `L 100 0 ` +
    `L 100 36 C 100 39 104 40 109 40 C 118 39 122 31 122 50 C 122 69 118 61 109 60 C 104 60 100 61 100 64 L 100 100 ` +
    `L 64 100 C 61 100 60 104 60 109 C 61 118 69 122 50 122 C 31 122 39 118 40 109 C 40 104 39 100 36 100 L 0 100 ` +
    `L 0 0 Z`,

    // Piece 1: Top-Right (TR)
    // Top: Flat (100,0)->(200,0)
    // Right: Flat (200,0)->(200,100)
    // Bottom: Socket receiving tab from BR pointing UP (dir = -1, drawn reversed 200->100)
    // Left: Socket receiving tab from TL (dir = +1, drawn reversed 100->0)
    `M 100 0 ` +
    `L 200 0 ` +
    `L 200 100 ` +
    `L 164 100 C 161 100 160 96 160 91 C 161 82 169 78 150 78 C 131 78 139 82 140 91 C 140 96 139 100 136 100 L 100 100 ` +
    `L 100 64 C 100 61 104 60 109 60 C 118 61 122 69 122 50 C 122 31 118 39 109 40 C 104 40 100 39 100 36 L 100 0 Z`,

    // Piece 2: Bottom-Right (BR)
    // Top: Tab pointing UP into TR (dir = -1, 100->200)
    // Right: Flat (200,100)->(200,200)
    // Bottom: Flat (200,200)->(100,200)
    // Left: Tab pointing LEFT into BL (dir = -1, drawn reversed 200->100)
    `M 100 100 ` +
    `L 136 100 C 139 100 140 96 140 91 C 139 82 131 78 150 78 C 169 78 161 82 160 91 C 160 96 161 100 164 100 L 200 100 ` +
    `L 200 200 ` +
    `L 100 200 ` +
    `L 100 164 C 100 161 96 160 91 160 C 82 161 78 169 78 150 C 78 131 82 139 91 140 C 96 140 100 139 100 136 L 100 100 Z`,

    // Piece 3: Bottom-Left (BL)
    // Top: Socket receiving tab from TL (dir = +1, 0->100)
    // Right: Socket receiving tab from BR (dir = -1, 100->200)
    // Bottom: Flat (100,200)->(0,200)
    // Left: Flat (0,200)->(0,100)
    `M 0 100 ` +
    `L 36 100 C 39 100 40 104 40 109 C 39 118 31 122 50 122 C 69 122 61 118 60 109 C 60 104 61 100 64 100 L 100 100 ` +
    `L 100 136 C 100 139 96 140 91 140 C 82 139 78 131 78 150 C 78 169 82 161 91 160 C 96 160 100 161 100 164 L 100 200 ` +
    `L 0 200 ` +
    `L 0 100 Z`,
];

// Natural floating scatter offsets when disconnected
const PIECE_OFFSETS = [
    { dx: -20, dy: -18, rot: -6, origin: '25% 25%' },   // 0: Top-Left floats top-left
    { dx: 20, dy: -16, rot: 6, origin: '75% 25%' },     // 1: Top-Right floats top-right
    { dx: 18, dy: 16, rot: -5, origin: '75% 75%' },     // 2: Bottom-Right floats bottom-right
    { dx: -18, dy: 16, rot: 6, origin: '25% 75%' },     // 3: Bottom-Left floats bottom-left
];

export interface JigsawLoadingScreenProps {
    /** Whether to show as a full-screen fixed overlay (default: true) */
    fullScreen?: boolean;
    /** Single loading message (default: 'Memuat...') */
    message?: string;
    /** Size of the logo puzzle in pixels (default: 180) */
    size?: number;
    /** Optional callback when user clicks close */
    onClose?: () => void;
    /** Custom container class */
    className?: string;
}

export function JigsawLoadingScreen({
    fullScreen = true,
    message = 'Memuat...',
    size = 180,
    onClose,
    className = '',
}: JigsawLoadingScreenProps) {
    // Animation Step: 0 to 9
    // 0: Scatter
    // 1: Piece 0 assembled
    // 2: Piece 1 assembled
    // 3: Piece 2 assembled
    // 4: Piece 3 assembled (100% UTUH!)
    // 5-7: Hold fully assembled + sheen wave + pulse
    // 8: Dissolve / uncouple back to scatter
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % 9);
        }, 220); // Snappy 220ms beat (~2s full assemble-and-shine cycle)

        return () => clearInterval(interval);
    }, []);

    const isAssembled = (pieceIndex: number) => {
        if (step === 0 || step === 8) return false;
        return step >= pieceIndex + 1;
    };

    const isFullyAssembled = step >= 4 && step <= 7;
    const isJustCompleted = step === 4;

    // Progress bar value (0 to 100%)
    const progressPercent = Math.min(100, Math.round(((Math.min(step, 4)) / 4) * 100));

    return (
        <div
            className={`select-none ${
                fullScreen
                    ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-md'
                    : 'relative flex flex-col items-center justify-center p-6'
            } ${className}`}
            role="status"
            aria-live="polite"
            aria-label="Memuat platform RAKIT Campus..."
        >
            {/* Embedded CSS for Luminous Sheen Wave */}
            <style>{`
                @keyframes jigsawLogoSheenSweep {
                    0% {
                        transform: translate3d(-150%, -150%, 0) rotate(35deg);
                    }
                    100% {
                        transform: translate3d(250%, 250%, 0) rotate(35deg);
                    }
                }
                @keyframes jigsawGentleAura {
                    0%, 100% {
                        transform: scale(0.95);
                        opacity: 0.45;
                    }
                    50% {
                        transform: scale(1.15);
                        opacity: 0.85;
                    }
                }
            `}</style>

            {/* Optional Close Button (if onClose provided) */}
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    aria-label="Tutup loading screen"
                >
                    <X className="size-5" />
                </button>
            )}

            {/* Ambient Lighting Backdrop */}
            <div
                className="absolute w-[360px] h-[360px] rounded-full bg-radial from-blue-400/25 via-sky-300/10 to-transparent blur-3xl pointer-events-none -z-10"
                style={{ animation: 'jigsawGentleAura 4s ease-in-out infinite' }}
            />

            {/* ============================================================== */}
            {/* JIGSAW LOGO CONTAINER                                          */}
            {/* ============================================================== */}
            <div
                className="relative flex items-center justify-center"
                style={{ width: `${size}px`, height: `${size}px` }}
            >
                {/* Luminous Snap Aura blooming when completed */}
                <div
                    className={`absolute inset-0 rounded-3xl bg-blue-500/20 blur-xl transition-all duration-700 pointer-events-none ${
                        isFullyAssembled ? 'scale-110 opacity-100' : 'scale-90 opacity-0'
                    }`}
                />

                <svg
                    viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
                    className="w-full h-full overflow-visible transition-transform duration-500 ease-out"
                    style={{
                        transform: isJustCompleted ? 'scale(1.05)' : 'scale(1)',
                    }}
                >
                    <defs>
                        {/* 4 Distinct ClipPaths for each Jigsaw Piece */}
                        {JIGSAW_PIECE_PATHS.map((pathD, idx) => (
                            <clipPath key={`clip-path-${idx}`} id={`jigsaw-logo-clip-${idx}`}>
                                <path d={pathD} />
                            </clipPath>
                        ))}

                        {/* Physical drop-shadow for each piece */}
                        <filter id="jigsawPieceShadow" x="-25%" y="-25%" width="150%" height="150%">
                            <feDropShadow dx="0" dy="4" stdDeviation="4.5" floodColor="#0F172A" floodOpacity="0.16" />
                        </filter>

                        {/* Snap Glow for the newly connected piece */}
                        <filter id="jigsawSnapGlow" x="-30%" y="-30%" width="160%" height="160%">
                            <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#38BDF8" floodOpacity="0.8" />
                        </filter>
                    </defs>

                    {/* Faint Blueprint Guide Outlines (showing where pieces will snap) */}
                    <g opacity="0.18">
                        {JIGSAW_PIECE_PATHS.map((pathD, idx) => (
                            <path
                                key={`guide-${idx}`}
                                d={pathD}
                                fill="none"
                                stroke="#94A3B8"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                            />
                        ))}
                    </g>

                    {/* The 4 Animated Interlocking Pieces */}
                    {JIGSAW_PIECE_PATHS.map((pathD, idx) => {
                        const assembled = isAssembled(idx);
                        const offset = PIECE_OFFSETS[idx];
                        const isSnapping = step === idx + 1;

                        const transform = assembled
                            ? 'translate3d(0, 0, 0) rotate(0deg) scale(1)'
                            : `translate3d(${offset.dx}px, ${offset.dy}px, 0) rotate(${offset.rot}deg) scale(1.06)`;

                        return (
                            <g
                                key={`piece-${idx}`}
                                style={{
                                    transform,
                                    transformOrigin: offset.origin,
                                    transition:
                                        step === 8
                                            ? 'transform 0.35s ease-out, opacity 0.3s ease'
                                            : 'transform 0.24s cubic-bezier(0.34, 1.45, 0.64, 1), opacity 0.2s ease',
                                    filter: isSnapping ? 'url(#jigsawSnapGlow)' : 'url(#jigsawPieceShadow)',
                                }}
                            >
                                {/* 1. Base White Puzzle Tile (provides crisp physical body) */}
                                <path
                                    d={pathD}
                                    fill="#FFFFFF"
                                    stroke={isSnapping ? '#38BDF8' : '#CBD5E1'}
                                    strokeWidth={1.5}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                    className="transition-colors duration-300"
                                />

                                {/* 2. The Logo rakit-mark Clipped into this exact Piece (Embedded Base64 Data URI) */}
                                <image
                                    href={RAKIT_MARK_DATA_URI}
                                    xlinkHref={RAKIT_MARK_DATA_URI}
                                    x="16"
                                    y="16"
                                    width="168"
                                    height="168"
                                    preserveAspectRatio="xMidYMid meet"
                                    clipPath={`url(#jigsaw-logo-clip-${idx})`}
                                    style={{ clipPath: `url(#jigsaw-logo-clip-${idx})` }}
                                />

                                {/* 3. Inner Bevel Highlight for Realistic 3D Tactile Edge */}
                                <path
                                    d={pathD}
                                    fill="none"
                                    stroke="rgba(255, 255, 255, 0.75)"
                                    strokeWidth={0.75}
                                    strokeLinejoin="round"
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* Diagonal Light Sheen Wave when Logo is Fully Assembled */}
                {isFullyAssembled && (
                    <div
                        className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-10"
                        style={{ mixBlendMode: 'overlay' }}
                    >
                        <div
                            className="w-[60px] h-[300px] bg-gradient-to-r from-transparent via-white/90 to-transparent blur-md"
                            style={{ animation: 'jigsawLogoSheenSweep 1.8s ease-in-out infinite' }}
                        />
                    </div>
                )}

            </div>

            {/* Single Loading Text */}
            <p className="mt-10 sm:mt-11 text-sm sm:text-[15px] font-semibold text-slate-700 tracking-tight select-none">
                {message}
            </p>

            {/* Glowing Segmented Progress Bar */}
            <div className="w-40 sm:w-48 h-1 bg-slate-100 rounded-full overflow-hidden mt-3.5 relative shadow-inner">
                <div
                    className={`h-full bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 rounded-full transition-all duration-200 shadow-xs ${
                        isFullyAssembled ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
        </div>
    );
}

export interface JigsawTriggerMatch {
    allowed: boolean;
    message?: string;
}

/**
 * Determines whether a given Inertia visit should trigger the Jigsaw loading screen.
 * Strictly limited to:
 * 1. Landing page ('/') clicking any internal route entering the website
 * 2. Register page (/register) when submitting form (POST)
 * 3. Login page (/login) when submitting form (POST)
 * 4. Switching between /login and /register (GET transitions between auth pages)
 * 5. Onboarding (/onboarding) when submitting completed biodata (POST)
 */
export function checkJigsawTrigger(event: any): JigsawTriggerMatch {
    const visit = event?.detail?.visit;
    if (!visit) return { allowed: false };

    // Explicit opt-out flag (only if visit.showJigsaw is explicitly false)
    if (visit.showJigsaw === false) {
        return { allowed: false };
    }

    // Explicit opt-in flag
    if (visit.showJigsaw === true) {
        return { allowed: true, message: visit.jigsawMessage || 'Memuat...' };
    }

    if (typeof window === 'undefined') return { allowed: false };

    const currentPath = (window.location.pathname || '').replace(/\/+$/, '') || '/';
    let destPath = '';
    let isDifferentSearch = false;

    try {
        const destUrl = visit.url instanceof URL
            ? visit.url
            : new URL(visit.url, window.location.origin);

        destPath = (destUrl.pathname || '').replace(/\/+$/, '') || '/';
        isDifferentSearch = destUrl.search !== window.location.search;
    } catch {
        destPath = String(visit.url || '').split('?')[0].replace(/\/+$/, '') || '/';
    }

    const method = (visit.method || 'get').toLowerCase();

    // 1. Landing page ('/') navigating to internal routes inside the website
    if (currentPath === '/') {
        if (destPath !== '/' || isDifferentSearch) {
            return {
                allowed: true,
                message: 'Menyiapkan RAKIT Campus...',
            };
        }
    }

    // 2. Register form submission (POST /register)
    if (method === 'post' && (destPath === '/register' || currentPath === '/register')) {
        return {
            allowed: true,
            message: 'Mendaftarkan akun kamu...',
        };
    }

    // 3. Login form submission (POST /login)
    if (method === 'post' && (destPath === '/login' || currentPath === '/login')) {
        return {
            allowed: true,
            message: 'Memverifikasi akun...',
        };
    }

    // 4. Switching between Register and Login
    if (currentPath === '/login' && destPath === '/register') {
        return {
            allowed: true,
            message: 'Membuka formulir pendaftaran...',
        };
    }
    if (currentPath === '/register' && destPath === '/login') {
        return {
            allowed: true,
            message: 'Membuka halaman masuk...',
        };
    }

    // 5. Onboarding / lengkapi biodata form submission (POST /onboarding)
    if (method === 'post' && (destPath === '/onboarding' || currentPath === '/onboarding' || destPath.startsWith('/onboarding'))) {
        return {
            allowed: true,
            message: 'Menyimpan profil & menghubungkan tim...',
        };
    }

    // All other pages/routes/actions are disallowed from showing the Jigsaw loading screen
    return { allowed: false };
}

/**
 * Hook to automatically show the Jigsaw Loading Screen during Inertia page navigations
 */
export function useJigsawLoader() {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Memuat...');
    const activeRequestsRef = React.useRef(0);
    const isJigsawActiveRef = React.useRef(false);
    const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const safetyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimers = React.useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (safetyTimeoutRef.current) {
            clearTimeout(safetyTimeoutRef.current);
            safetyTimeoutRef.current = null;
        }
    }, []);

    const dismiss = React.useCallback(() => {
        activeRequestsRef.current = 0;
        isJigsawActiveRef.current = false;
        clearTimers();
        setIsLoading(false);
    }, [clearTimers]);

    useEffect(() => {
        const handleBefore = (event: any) => {
            const trigger = checkJigsawTrigger(event);
            if (trigger.allowed) {
                // Completely suppress Inertia's top progress bar for Jigsaw flows
                if (event?.detail?.visit) {
                    event.detail.visit.showProgress = false;
                }
                const np = document.getElementById('nprogress');
                if (np) {
                    np.style.display = 'none';
                    np.remove();
                }
            }
        };

        const handleStart = (event: any) => {
            const trigger = checkJigsawTrigger(event);
            if (!trigger.allowed) {
                // Not one of the 5 allowed flows -> do NOT activate jigsaw loader!
                return;
            }

            // Suppress Inertia's top progress bar and remove any lingering element
            if (event?.detail?.visit) {
                event.detail.visit.showProgress = false;
            }
            const np = document.getElementById('nprogress');
            if (np) {
                np.style.display = 'none';
                np.remove();
            }

            isJigsawActiveRef.current = true;
            activeRequestsRef.current++;
            if (trigger.message) {
                setLoadingMessage(trigger.message);
            }

            // Immediately display the Jigsaw loading screen for the 5 selected flows
            setIsLoading(true);

            // Safety watchdog: auto-dismiss after 3.5 seconds to prevent any freeze
            if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
            safetyTimeoutRef.current = setTimeout(() => {
                dismiss();
            }, 3500);
        };

        const handleComplete = () => {
            if (!isJigsawActiveRef.current) return;
            activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1);
            if (activeRequestsRef.current === 0) {
                dismiss();
            }
        };

        const handleNavigate = () => {
            // Remove any leftover NProgress element
            const np = document.getElementById('nprogress');
            if (np) {
                np.style.display = 'none';
                np.remove();
            }
            // When Inertia renders the new page in the DOM, immediately dismiss the loader!
            dismiss();
        };

        const beforeListener = router.on('before', handleBefore);
        const startListener = router.on('start', handleStart);
        const finishListener = router.on('finish', handleComplete);
        const navigateListener = router.on('navigate', handleNavigate);
        const successListener = router.on('success', handleComplete);
        const cancelListener = router.on('cancel', handleComplete);
        const errorListener = router.on('error', handleComplete);

        return () => {
            beforeListener();
            startListener();
            finishListener();
            navigateListener();
            successListener();
            cancelListener();
            errorListener();
            clearTimers();
        };
    }, [clearTimers, dismiss]);

    return { isLoading, loadingMessage, dismiss };
}

/**
 * Standalone Global Loader that listens to Inertia page transitions
 */
export function GlobalJigsawLoader() {
    const { isLoading, loadingMessage, dismiss } = useJigsawLoader();

    // Support Esc key to dismiss loader if user chooses
    useEffect(() => {
        if (!isLoading) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                dismiss();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLoading, dismiss]);

    if (!isLoading) return null;
    return (
        <>
            <style>{`
                #nprogress,
                #nprogress .bar,
                #nprogress .peg,
                #nprogress .spinner {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    height: 0 !important;
                }
            `}</style>
            <JigsawLoadingScreen fullScreen={true} message={loadingMessage} onClose={dismiss} />
        </>
    );
}

export default JigsawLoadingScreen;

