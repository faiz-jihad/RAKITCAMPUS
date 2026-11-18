import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
}

import {
    Archive,
    Award,
    Briefcase,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    FileText,
    FolderKanban,
    GitBranch,
    GraduationCap,
    Inbox,
    Layers,
    MessageSquare,
    PieChart,
    Sparkles,
    UserCheck,
    Users,
} from 'lucide-react';

export interface JigsawBoardItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | null;
    row: number; // 0, 1, 2
    col: number; // 0..5
}

interface ProjectJigsawBoardProps {
    activeTab: string;
    onSelectTab: (id: string) => void;
    // Dynamic badges/counts
    teamBalanceScore?: number | null;
    invitationsCount?: number;
    formationBadge?: string | null;
    membersBadge?: string | null;
    proposalBadge?: string | null;
    versionsCount?: number;
    documentsCount?: number;
    discussionsCount?: number;
    guidancesCount?: number;
    tasksCount?: number;
    milestonesCount?: number;
    progressPercentage?: number;
    utsStatus?: string | null;
    uasStatus?: string | null;
    isAcademic?: boolean;
}

const COLS = 6;
const ROWS = 3;
const CW = 185;
const CH = 136; // Generous height for balanced, authentic jigsaw puzzle pieces

interface SeamConfig {
    dir: number; // +1 or -1
    offset: number; // shift of tab center along seam in px (-10 to +10)
    depth: number; // tab protrusion depth in px (21 to 26)
    bulbW: number; // bulb head width in px (35 to 42)
    neckW: number; // neck width in px (19 to 24)
    tilt: number; // subtle asymmetry in px (-2 to +2)
}

// 12 Organic Horizontal Seams for 6x3 Grid (2 internal rows x 6 columns)
const H_SEAMS_DEF: SeamConfig[][] = [
    [
        { dir:  1, offset:  6, depth: 24, bulbW: 39, neckW: 22, tilt: -1 },
        { dir: -1, offset: -9, depth: 22, bulbW: 36, neckW: 20, tilt:  1 },
        { dir:  1, offset:  8, depth: 25, bulbW: 41, neckW: 23, tilt:  2 },
        { dir:  1, offset: -7, depth: 23, bulbW: 38, neckW: 21, tilt: -2 },
        { dir: -1, offset:  9, depth: 25, bulbW: 40, neckW: 24, tilt:  1 },
        { dir:  1, offset: -8, depth: 22, bulbW: 37, neckW: 20, tilt: -1 },
    ],
    [
        { dir: -1, offset: -7, depth: 23, bulbW: 37, neckW: 21, tilt:  1 },
        { dir:  1, offset:  9, depth: 26, bulbW: 41, neckW: 23, tilt: -1 },
        { dir:  1, offset: -8, depth: 22, bulbW: 38, neckW: 20, tilt: -2 },
        { dir: -1, offset:  7, depth: 24, bulbW: 39, neckW: 22, tilt:  1 },
        { dir:  1, offset: -6, depth: 25, bulbW: 40, neckW: 23, tilt: -1 },
        { dir: -1, offset:  8, depth: 23, bulbW: 36, neckW: 21, tilt:  2 },
    ],
];

// 15 Organic Vertical Seams for 6x3 Grid (3 rows x 5 internal column seams)
const V_SEAMS_DEF: SeamConfig[][] = [
    [
        { dir:  1, offset: -8, depth: 23, bulbW: 38, neckW: 22, tilt:  1 },
        { dir: -1, offset:  9, depth: 25, bulbW: 41, neckW: 23, tilt: -2 },
        { dir: -1, offset: -7, depth: 22, bulbW: 36, neckW: 20, tilt: -1 },
        { dir:  1, offset: -9, depth: 24, bulbW: 39, neckW: 22, tilt: -1 },
        { dir: -1, offset:  7, depth: 22, bulbW: 37, neckW: 21, tilt:  2 },
    ],
    [
        { dir:  1, offset:  8, depth: 25, bulbW: 40, neckW: 23, tilt: -2 },
        { dir: -1, offset: -8, depth: 22, bulbW: 37, neckW: 20, tilt:  1 },
        { dir:  1, offset:  6, depth: 24, bulbW: 39, neckW: 22, tilt:  2 },
        { dir: -1, offset:  8, depth: 23, bulbW: 38, neckW: 21, tilt: -1 },
        { dir:  1, offset: -7, depth: 24, bulbW: 40, neckW: 22, tilt:  1 },
    ],
    [
        { dir: -1, offset: -8, depth: 22, bulbW: 37, neckW: 20, tilt:  1 },
        { dir:  1, offset:  9, depth: 25, bulbW: 41, neckW: 23, tilt: -2 },
        { dir:  1, offset: -7, depth: 23, bulbW: 38, neckW: 21, tilt:  1 },
        { dir: -1, offset:  8, depth: 24, bulbW: 39, neckW: 22, tilt: -1 },
        { dir:  1, offset: -8, depth: 22, bulbW: 37, neckW: 21, tilt:  1 },
    ],
];

// Seams specifically designed for 3x2 Grid (3 columns x 2 rows = 6 pieces per part)
const H_SEAMS_3X2: SeamConfig[] = [
    { dir:  1, offset:  6, depth: 24, bulbW: 39, neckW: 22, tilt: -1 }, // col 0
    { dir: -1, offset: -8, depth: 22, bulbW: 36, neckW: 20, tilt:  1 }, // col 1
    { dir:  1, offset:  7, depth: 25, bulbW: 40, neckW: 23, tilt: -1 }, // col 2
];

const V_SEAMS_3X2: SeamConfig[][] = [
    [
        { dir:  1, offset: -8, depth: 23, bulbW: 38, neckW: 22, tilt:  1 }, // (0,0) -> (0,1)
        { dir: -1, offset:  8, depth: 24, bulbW: 40, neckW: 23, tilt: -1 }, // (0,2) <- (0,1)
    ],
    [
        { dir: -1, offset:  7, depth: 23, bulbW: 37, neckW: 21, tilt:  1 }, // (1,1) -> (1,0)
        { dir:  1, offset: -7, depth: 24, bulbW: 39, neckW: 22, tilt: -1 }, // (1,1) -> (1,2)
    ],
];

function getH(x0: number, y: number, x1: number, seam: SeamConfig | null, reverse: boolean): string {
    if (!seam || seam.dir === 0) return reverse ? `L ${x0} ${y}` : `L ${x1} ${y}`;
    const xm = (x0 + x1) / 2 + (seam.offset || 0);
    const d = seam.depth * seam.dir;
    const halfBulb = seam.bulbW / 2;
    const halfNeck = seam.neckW / 2;
    const tilt = seam.tilt || 0;

    const u1 = xm - halfBulb - 5;
    const u2 = xm + halfBulb + 5;

    if (!reverse) {
        return [
            `L ${u1} ${y}`,
            `C ${u1 + 4} ${y} ${xm - halfNeck - 4} ${y + 0.05 * d} ${xm - halfNeck} ${y + 0.22 * d}`,
            `C ${xm - halfBulb - 3} ${y + 0.52 * d} ${xm - halfBulb * 0.7 + tilt} ${y + d} ${xm + tilt} ${y + d}`,
            `C ${xm + halfBulb * 0.7 + tilt} ${y + d} ${xm + halfBulb + 3} ${y + 0.52 * d} ${xm + halfNeck} ${y + 0.22 * d}`,
            `C ${xm + halfNeck + 4} ${y + 0.05 * d} ${u2 - 4} ${y} ${u2} ${y}`,
            `L ${x1} ${y}`
        ].join(' ');
    } else {
        return [
            `L ${u2} ${y}`,
            `C ${u2 - 4} ${y} ${xm + halfNeck + 4} ${y + 0.05 * d} ${xm + halfNeck} ${y + 0.22 * d}`,
            `C ${xm + halfBulb + 3} ${y + 0.52 * d} ${xm + halfBulb * 0.7 + tilt} ${y + d} ${xm + tilt} ${y + d}`,
            `C ${xm - halfBulb * 0.7 + tilt} ${y + d} ${xm - halfBulb - 3} ${y + 0.52 * d} ${xm - halfNeck} ${y + 0.22 * d}`,
            `C ${xm - halfNeck - 4} ${y + 0.05 * d} ${u1 + 4} ${y} ${u1} ${y}`,
            `L ${x0} ${y}`
        ].join(' ');
    }
}

function getV(x: number, y0: number, y1: number, seam: SeamConfig | null, reverse: boolean): string {
    if (!seam || seam.dir === 0) return reverse ? `L ${x} ${y0}` : `L ${x} ${y1}`;
    const ym = (y0 + y1) / 2 + (seam.offset || 0);
    const d = seam.depth * seam.dir;
    const halfBulb = seam.bulbW / 2;
    const halfNeck = seam.neckW / 2;
    const tilt = seam.tilt || 0;

    const v1 = ym - halfBulb - 5;
    const v2 = ym + halfBulb + 5;

    if (!reverse) {
        return [
            `L ${x} ${v1}`,
            `C ${x} ${v1 + 4} ${x + 0.05 * d} ${ym - halfNeck - 4} ${x + 0.22 * d} ${ym - halfNeck}`,
            `C ${x + 0.52 * d} ${ym - halfBulb - 3} ${x + d} ${ym - halfBulb * 0.7 + tilt} ${x + d} ${ym + tilt}`,
            `C ${x + d} ${ym + halfBulb * 0.7 + tilt} ${x + 0.52 * d} ${ym + halfBulb + 3} ${x + 0.22 * d} ${ym + halfNeck}`,
            `C ${x + 0.05 * d} ${ym + halfNeck + 4} ${x} ${v2 - 4} ${x} ${v2}`,
            `L ${x} ${y1}`
        ].join(' ');
    } else {
        return [
            `L ${x} ${v2}`,
            `C ${x} ${v2 - 4} ${x + 0.05 * d} ${ym + halfNeck + 4} ${x + 0.22 * d} ${ym + halfNeck}`,
            `C ${x + 0.52 * d} ${ym + halfBulb + 3} ${x + d} ${ym + halfBulb * 0.7 + tilt} ${x + d} ${ym + tilt}`,
            `C ${x + d} ${ym - halfBulb * 0.7 + tilt} ${x + 0.52 * d} ${ym - halfBulb - 3} ${x + 0.22 * d} ${ym - halfNeck}`,
            `C ${x + 0.05 * d} ${ym - halfNeck - 4} ${x} ${v1 + 4} ${x} ${v1}`,
            `L ${x} ${y0}`
        ].join(' ');
    }
}

function getPiecePath6x3(r: number, c: number): string {
    const isTop = r === 0;
    const isBottom = r === ROWS - 1;
    const isLeft = c === 0;
    const isRight = c === COLS - 1;

    const x0 = c * CW;
    const x1 = (c + 1) * CW;
    const y0 = r * CH;
    const y1 = (r + 1) * CH;

    const topSeam = isTop ? null : H_SEAMS_DEF[r - 1][c];
    const rightSeam = isRight ? null : V_SEAMS_DEF[r][c];
    const bottomSeam = isBottom ? null : H_SEAMS_DEF[r][c];
    const leftSeam = isLeft ? null : V_SEAMS_DEF[r][c - 1];

    let p = `M ${x0} ${y0} `;
    p += getH(x0, y0, x1, topSeam, false) + ' ';
    p += getV(x1, y0, y1, rightSeam, false) + ' ';
    p += getH(x0, y1, x1, bottomSeam, true) + ' ';
    p += getV(x0, y0, y1, leftSeam, true) + ' ';
    p += 'Z';
    return p;
}

function getPiecePath3x2(r: number, c: number): string {
    const isTop = r === 0;
    const isBottom = r === 1;
    const isLeft = c === 0;
    const isRight = c === 2;

    const x0 = c * CW;
    const x1 = (c + 1) * CW;
    const y0 = r * CH;
    const y1 = (r + 1) * CH;

    const topSeam = isTop ? null : H_SEAMS_3X2[c];
    const rightSeam = isRight ? null : V_SEAMS_3X2[r][c];
    const bottomSeam = isBottom ? null : H_SEAMS_3X2[c];
    const leftSeam = isLeft ? null : V_SEAMS_3X2[r][c - 1];

    let p = `M ${x0} ${y0} `;
    p += getH(x0, y0, x1, topSeam, false) + ' ';
    p += getV(x1, y0, y1, rightSeam, false) + ' ';
    p += getH(x0, y1, x1, bottomSeam, true) + ' ';
    p += getV(x0, y0, y1, leftSeam, true) + ' ';
    p += 'Z';
    return p;
}

// 3 Bagian logical categorization for the 18-piece puzzle (6 pieces per part in 3x2 grid)
interface JigsawPartInfo {
    id: number;
    title: string;
    subtitle: string;
    shortTitle: string;
    badgeRange: string;
    itemIndices: number[];
}

const PARTS_INFO: JigsawPartInfo[] = [
    {
        id: 0,
        title: 'Inisiasi & Formasi Tim',
        subtitle: 'Overview proyek, spesifikasi peran, matchmaking & susunan tim',
        shortTitle: '1. Inisiasi Tim',
        badgeRange: '1–6',
        itemIndices: [0, 1, 2, 3, 4, 5],
    },
    {
        id: 1,
        title: 'Proposal & Kolaborasi',
        subtitle: 'Living proposal dinamis, versi berkas, diskusi tim & arahan dosen',
        shortTitle: '2. Proposal & Tim',
        badgeRange: '7–12',
        itemIndices: [6, 7, 8, 9, 10, 11],
    },
    {
        id: 2,
        title: 'Eksekusi & Evaluasi',
        subtitle: 'Tasks kanban, progres sprint, evaluasi UTS/UAS & portofolio akhir',
        shortTitle: '3. Eksekusi & Nilai',
        badgeRange: '13–18',
        itemIndices: [12, 13, 14, 15, 16, 17],
    },
];

export default function ProjectJigsawBoard({
    activeTab,
    onSelectTab,
    teamBalanceScore,
    invitationsCount,
    formationBadge,
    membersBadge,
    proposalBadge,
    versionsCount,
    documentsCount,
    discussionsCount,
    guidancesCount,
    tasksCount,
    milestonesCount,
    progressPercentage,
    utsStatus,
    uasStatus,
    isAcademic = true,
}: ProjectJigsawBoardProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    // Academic track only features: disabled and greyed out for independent (mandiri) projects
    const ACADEMIC_ONLY_IDS = ['proposal', 'versions', 'uts', 'uas', 'lecturer_review'];

    // Exact 18 items mapped to full list
    const items: JigsawBoardItem[] = [
        // Row 0 of 6x3 (or Part 1: Inisiasi & Formasi Tim)
        { id: 'overview', label: 'Overview Proyek', icon: Layers, row: 0, col: 0 },
        { id: 'requirements', label: 'Spesifikasi Tim', icon: Briefcase, row: 0, col: 1 },
        { id: 'matchmaking', label: 'Smart Matchmaking', icon: Sparkles, row: 0, col: 2 },
        {
            id: 'team_balance',
            label: 'Keseimbangan Tim',
            icon: PieChart,
            badge: teamBalanceScore ? `${teamBalanceScore}%` : null,
            row: 0,
            col: 3,
        },
        {
            id: 'invitations',
            label: 'Undangan Tim',
            icon: Inbox,
            badge: invitationsCount ? String(invitationsCount) : null,
            row: 0,
            col: 4,
        },
        {
            id: 'formation',
            label: 'Alur Formasi',
            icon: UserCheck,
            badge: formationBadge || 'Draft',
            row: 0,
            col: 5,
        },

        // Row 1 of 6x3 (or Part 2: Proposal & Kolaborasi)
        {
            id: 'members',
            label: 'Anggota Tim',
            icon: Users,
            badge: membersBadge || null,
            row: 1,
            col: 0,
        },
        {
            id: 'proposal',
            label: 'Living Proposal',
            icon: FileText,
            badge: proposalBadge || 'Draft',
            row: 1,
            col: 1,
        },
        {
            id: 'versions',
            label: 'Versi Proposal',
            icon: GitBranch,
            badge: versionsCount ? `v${versionsCount}` : 'v1',
            row: 1,
            col: 2,
        },
        {
            id: 'documents',
            label: 'Dokumen & Berkas',
            icon: Download,
            badge: documentsCount ? String(documentsCount) : null,
            row: 1,
            col: 3,
        },
        {
            id: 'discussion',
            label: 'Diskusi Tim',
            icon: MessageSquare,
            badge: discussionsCount ? String(discussionsCount) : null,
            row: 1,
            col: 4,
        },
        {
            id: 'lecturer_review',
            label: 'Arahan Dosen',
            icon: GraduationCap,
            badge: guidancesCount ? String(guidancesCount) : null,
            row: 1,
            col: 5,
        },

        // Row 2 of 6x3 (or Part 3: Eksekusi & Evaluasi)
        {
            id: 'tasks',
            label: 'Tasks & Kanban',
            icon: FolderKanban,
            badge: tasksCount !== undefined ? String(tasksCount) : null,
            row: 2,
            col: 0,
        },
        {
            id: 'milestones',
            label: 'Milestones & Target',
            icon: Clock,
            badge: milestonesCount ? String(milestonesCount) : null,
            row: 2,
            col: 1,
        },
        {
            id: 'progress',
            label: 'Progress Proyek',
            icon: Sparkles,
            badge: progressPercentage !== undefined ? `${progressPercentage}%` : null,
            row: 2,
            col: 2,
        },
        {
            id: 'uts',
            label: 'Snapshot UTS',
            icon: GraduationCap,
            badge: utsStatus || 'Menunggu',
            row: 2,
            col: 3,
        },
        {
            id: 'uas',
            label: 'Snapshot UAS',
            icon: Award,
            badge: uasStatus || 'Menunggu',
            row: 2,
            col: 4,
        },
        {
            id: 'archive',
            label: 'Portofolio Akhir',
            icon: Archive,
            badge: 'Showcase',
            row: 2,
            col: 5,
        },
    ];

    // Determine initial active part based on current activeTab
    const getPartForTab = (tabId: string): number => {
        if (['overview', 'requirements', 'matchmaking', 'team_balance', 'invitations', 'formation'].includes(tabId)) return 0;
        if (['members', 'proposal', 'versions', 'documents', 'discussion', 'lecturer_review'].includes(tabId)) return 1;
        if (['tasks', 'milestones', 'progress', 'uts', 'uas', 'archive'].includes(tabId)) return 2;
        return 0;
    };

    const [activePart, setActivePart] = useState<number>(() => getPartForTab(activeTab));
    const [touchStartX, setTouchStartX] = useState<number | null>(null);

    // Keep activePart synchronized whenever activeTab changes
    useEffect(() => {
        const targetPart = getPartForTab(activeTab);
        setActivePart(targetPart);
    }, [activeTab]);

    const containerRef = useRef<HTMLDivElement | null>(null);
    const svg6x3Ref = useRef<SVGSVGElement | null>(null);
    const svg3x2Ref = useRef<SVGSVGElement | null>(null);

    // GSAP animation when switching activePart in 3x2 mode
    useEffect(() => {
        if (!svg3x2Ref.current) return;
        const pieces = svg3x2Ref.current.querySelectorAll('.jigsaw-piece-3x2');
        if (pieces.length > 0) {
            gsap.fromTo(
                pieces,
                { autoAlpha: 0, scale: 0.95, y: -8 },
                {
                    autoAlpha: 1,
                    scale: 1,
                    y: 0,
                    duration: 0.22,
                    stagger: 0.03,
                    ease: 'power2.out',
                    force3D: true,
                    clearProps: 'transform,opacity,visibility',
                }
            );
        }
    }, [activePart]);

    // Items for current 3x2 part
    const currentPartInfo = PARTS_INFO[activePart];
    const currentPartItems = currentPartInfo.itemIndices.map((idx, localIndex) => {
        const baseItem = items[idx];
        return {
            ...baseItem,
            localRow: Math.floor(localIndex / 3), // 0 or 1
            localCol: localIndex % 3,             // 0, 1, or 2
        };
    });

    const activeItem = items.find((it) => it.id === activeTab);
    const hoveredItem = hoveredId ? items.find((it) => it.id === hoveredId) : null;

    // Helper to render pieces in 3x2 mode
    const render3x2Board = () => {
        return (
            <svg
                ref={svg3x2Ref}
                viewBox="-12 -12 579 296"
                className="w-full max-w-xl mx-auto h-auto drop-shadow-sm overflow-visible"
            >
                <defs>
                    <linearGradient id="puzzle-active-grad-3x2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#1D4ED8" />
                    </linearGradient>

                    <filter id="puzzle-active-shadow-3x2" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1D4ED8" floodOpacity="0.35" />
                    </filter>

                    <filter id="puzzle-hover-shadow-3x2" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#3B82F6" floodOpacity="0.25" />
                    </filter>
                </defs>

                {/* 1. LAYER BASE (INACTIVE) */}
                {currentPartItems.map((item) => {
                    const isAcademicOnly = ACADEMIC_ONLY_IDS.includes(item.id);
                    const isDisabled = !isAcademic && isAcademicOnly;
                    const isActive = activeTab === item.id;
                    const isHovered = hoveredId === item.id;
                    if (!isDisabled && (isActive || isHovered)) return null;

                    const Icon = item.icon;
                    const pathD = getPiecePath3x2(item.localRow, item.localCol);

                    if (isDisabled) {
                        return (
                            <g
                                key={item.id}
                                className="jigsaw-piece-3x2 cursor-not-allowed select-none opacity-80"
                            >
                                <title>{`${item.label} — Khusus Proyek Jalur Akademik (Nonaktif)`}</title>
                                <path
                                    d={pathD}
                                    fill="#F1F5F9"
                                    stroke="#CBD5E1"
                                    strokeWidth={1.5}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                />
                                <foreignObject
                                    x={item.localCol * CW}
                                    y={item.localRow * CH}
                                    width={CW}
                                    height={CH}
                                    className="pointer-events-none"
                                >
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none">
                                        <Icon className="size-6 mb-1 text-slate-400 shrink-0" />
                                        <span className="text-[12px] sm:text-[13px] font-bold text-slate-400 leading-tight line-clamp-2 px-2">
                                            {item.label}
                                        </span>
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase mt-1 tracking-tight bg-slate-200 text-slate-500 border border-slate-300 shadow-2xs">
                                            Khusus Akademik
                                        </span>
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    }

                    return (
                        <g
                            key={item.id}
                            className="jigsaw-piece-3x2 cursor-pointer"
                            onMouseEnter={() => setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => onSelectTab(item.id)}
                        >
                            <title>{`Klik untuk membuka ${item.label}`}</title>
                            <path
                                d={pathD}
                                fill="#FFFFFF"
                                stroke="#CBD5E1"
                                strokeWidth={1.5}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                className="transition-colors duration-150 hover:stroke-blue-400"
                            />
                            <foreignObject
                                x={item.localCol * CW}
                                y={item.localRow * CH}
                                width={CW}
                                height={CH}
                                className="pointer-events-none"
                            >
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none">
                                    <Icon className="size-6 mb-1 text-blue-600 shrink-0" />
                                    <span className="text-[12px] sm:text-[13px] font-extrabold text-slate-800 leading-tight line-clamp-2 px-2">
                                        {item.label}
                                    </span>
                                    {item.badge && (
                                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mt-1 tracking-tight bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}

                {/* 2. LAYER HOVER */}
                {hoveredItem && hoveredItem.id !== activeTab && currentPartItems.some(it => it.id === hoveredItem.id) && !(!isAcademic && ACADEMIC_ONLY_IDS.includes(hoveredItem.id)) && (() => {
                    const localMatch = currentPartItems.find(it => it.id === hoveredItem.id)!;
                    const Icon = hoveredItem.icon;
                    const pathD = getPiecePath3x2(localMatch.localRow, localMatch.localCol);

                    return (
                        <g
                            key={hoveredItem.id}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredId(hoveredItem.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => onSelectTab(hoveredItem.id)}
                            filter="url(#puzzle-hover-shadow-3x2)"
                        >
                            <title>{`Klik untuk membuka ${hoveredItem.label}`}</title>
                            <path
                                d={pathD}
                                fill="#F0F7FF"
                                stroke="#3B82F6"
                                strokeWidth={2.2}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            <foreignObject
                                x={localMatch.localCol * CW}
                                y={localMatch.localRow * CH}
                                width={CW}
                                height={CH}
                                className="pointer-events-none"
                            >
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none">
                                    <Icon className="size-6 mb-1 text-blue-600 shrink-0 scale-110 transition-transform duration-150" />
                                    <span className="text-[12px] sm:text-[13px] font-black text-blue-900 leading-tight line-clamp-2 px-2">
                                        {hoveredItem.label}
                                    </span>
                                    {hoveredItem.badge && (
                                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mt-1 tracking-tight bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
                                            {hoveredItem.badge}
                                        </span>
                                    )}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })()}

                {/* 3. LAYER ACTIVE */}
                {activeItem && currentPartItems.some(it => it.id === activeItem.id) && !(!isAcademic && ACADEMIC_ONLY_IDS.includes(activeItem.id)) && (() => {
                    const localMatch = currentPartItems.find(it => it.id === activeItem.id)!;
                    const Icon = activeItem.icon;
                    const pathD = getPiecePath3x2(localMatch.localRow, localMatch.localCol);

                    return (
                        <g
                            key={activeItem.id}
                            className="cursor-pointer"
                            filter="url(#puzzle-active-shadow-3x2)"
                            onClick={() => onSelectTab(activeItem.id)}
                        >
                            <title>{`Menu aktif: ${activeItem.label}`}</title>
                            <path
                                d={pathD}
                                fill="url(#puzzle-active-grad-3x2)"
                                stroke="#93C5FD"
                                strokeWidth={2.5}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            <foreignObject
                                x={localMatch.localCol * CW}
                                y={localMatch.localRow * CH}
                                width={CW}
                                height={CH}
                                className="pointer-events-none"
                            >
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none text-white">
                                    <Icon className="size-6 mb-1 text-white shrink-0 scale-110" />
                                    <span className="text-[12px] sm:text-[13px] font-black leading-tight line-clamp-2 px-2 text-white">
                                        {activeItem.label}
                                    </span>
                                    {activeItem.badge && (
                                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mt-1 tracking-tight bg-white text-blue-700 shadow-xs">
                                            {activeItem.badge}
                                        </span>
                                    )}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })()}
            </svg>
        );
    };

    // Helper to render full 6x3 board (Desktop mode)
    const render6x3Board = () => {
        return (
            <svg
                ref={svg6x3Ref}
                viewBox="-12 -12 1134 432"
                className="w-full max-w-6xl mx-auto h-auto drop-shadow-sm overflow-visible"
            >
                <defs>
                    <linearGradient id="puzzle-active-grad-6x3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2563EB" />
                        <stop offset="100%" stopColor="#1D4ED8" />
                    </linearGradient>

                    <filter id="puzzle-active-shadow-6x3" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1D4ED8" floodOpacity="0.35" />
                    </filter>

                    <filter id="puzzle-hover-shadow-6x3" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#3B82F6" floodOpacity="0.25" />
                    </filter>
                </defs>

                {/* 1. LAYER BASE */}
                {items.map((item) => {
                    const isAcademicOnly = ACADEMIC_ONLY_IDS.includes(item.id);
                    const isDisabled = !isAcademic && isAcademicOnly;
                    const isActive = activeTab === item.id;
                    const isHovered = hoveredId === item.id;
                    if (!isDisabled && (isActive || isHovered)) return null;

                    const Icon = item.icon;
                    const pathD = getPiecePath6x3(item.row, item.col);

                    if (isDisabled) {
                        return (
                            <g
                                key={item.id}
                                className="cursor-not-allowed select-none opacity-80"
                            >
                                <title>{`${item.label} — Khusus Proyek Jalur Akademik (Nonaktif)`}</title>
                                <path
                                    d={pathD}
                                    fill="#F1F5F9"
                                    stroke="#CBD5E1"
                                    strokeWidth={1.5}
                                    strokeLinejoin="round"
                                    strokeLinecap="round"
                                />
                                <foreignObject
                                    x={item.col * CW}
                                    y={item.row * CH}
                                    width={CW}
                                    height={CH}
                                    className="pointer-events-none"
                                >
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none">
                                        <Icon className="size-6 mb-1 text-slate-400 shrink-0" />
                                        <span className="text-[13px] font-bold text-slate-400 leading-tight line-clamp-2 px-2">
                                            {item.label}
                                        </span>
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase mt-1 tracking-tight bg-slate-200 text-slate-500 border border-slate-300 shadow-2xs">
                                            Khusus Akademik
                                        </span>
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    }

                    return (
                        <g
                            key={item.id}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredId(item.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => onSelectTab(item.id)}
                        >
                            <title>{`Klik untuk membuka menu ${item.label}`}</title>
                            <path
                                d={pathD}
                                fill="#FFFFFF"
                                stroke="#CBD5E1"
                                strokeWidth={1.5}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                className="transition-colors duration-150"
                            />
                            <foreignObject
                                x={item.col * CW}
                                y={item.row * CH}
                                width={CW}
                                height={CH}
                                className="pointer-events-none"
                            >
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none">
                                    <Icon className="size-6 mb-1 text-blue-600 shrink-0" />
                                    <span className="text-[13px] font-extrabold text-slate-800 leading-tight line-clamp-2 px-2">
                                        {item.label}
                                    </span>
                                    {item.badge && (
                                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mt-1 tracking-tight bg-blue-50 text-blue-700 border border-blue-200/60 shadow-2xs">
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}

                {/* 2. LAYER HOVER */}
                {hoveredItem && hoveredItem.id !== activeTab && !(!isAcademic && ACADEMIC_ONLY_IDS.includes(hoveredItem.id)) && (() => {
                    const Icon = hoveredItem.icon;
                    const pathD = getPiecePath6x3(hoveredItem.row, hoveredItem.col);

                    return (
                        <g
                            key={hoveredItem.id}
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredId(hoveredItem.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => onSelectTab(hoveredItem.id)}
                            filter="url(#puzzle-hover-shadow-6x3)"
                        >
                            <title>{`Klik untuk membuka menu ${hoveredItem.label}`}</title>
                            <path
                                d={pathD}
                                fill="#F0F7FF"
                                stroke="#3B82F6"
                                strokeWidth={2.2}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                className="transition-colors duration-150"
                            />
                            <foreignObject
                                x={hoveredItem.col * CW}
                                y={hoveredItem.row * CH}
                                width={CW}
                                height={CH}
                                className="pointer-events-none"
                            >
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none">
                                    <Icon className="size-6 mb-1 text-blue-600 shrink-0 scale-110 transition-transform duration-150" />
                                    <span className="text-[13px] font-black text-blue-900 leading-tight line-clamp-2 px-2">
                                        {hoveredItem.label}
                                    </span>
                                    {hoveredItem.badge && (
                                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mt-1 tracking-tight bg-blue-100 text-blue-800 border border-blue-300 shadow-2xs">
                                            {hoveredItem.badge}
                                        </span>
                                    )}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })()}

                {/* 3. LAYER ACTIVE */}
                {activeItem && !(!isAcademic && ACADEMIC_ONLY_IDS.includes(activeItem.id)) && (() => {
                    const Icon = activeItem.icon;
                    const pathD = getPiecePath6x3(activeItem.row, activeItem.col);

                    return (
                        <g
                            key={activeItem.id}
                            className="cursor-pointer"
                            filter="url(#puzzle-active-shadow-6x3)"
                            onClick={() => onSelectTab(activeItem.id)}
                        >
                            <title>{`Menu aktif: ${activeItem.label}`}</title>
                            <path
                                d={pathD}
                                fill="url(#puzzle-active-grad-6x3)"
                                stroke="#93C5FD"
                                strokeWidth={2.5}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                            />
                            <foreignObject
                                x={activeItem.col * CW}
                                y={activeItem.row * CH}
                                width={CW}
                                height={CH}
                                className="pointer-events-none"
                            >
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center select-none text-white">
                                    <Icon className="size-6 mb-1 text-white shrink-0 scale-110" />
                                    <span className="text-[13px] font-black leading-tight line-clamp-2 px-2 text-white">
                                        {activeItem.label}
                                    </span>
                                    {activeItem.badge && (
                                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase mt-1 tracking-tight bg-white text-blue-700 shadow-xs">
                                            {activeItem.badge}
                                        </span>
                                    )}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })()}
            </svg>
        );
    };

    return (
        <div ref={containerRef} className="w-full select-none py-1">
            {/* RESPONSIVE 3x2 JIGSAW PUZZLE (Always shown on mobile/tablet < lg) */}
            <div className="block lg:hidden">
                {/* Subtitle & Quick Navigation (Prev/Next) */}
                <div className="flex items-center justify-between gap-2 px-1 mb-2 text-xs">
                    <button
                        type="button"
                        onClick={() => setActivePart((prev) => (prev > 0 ? prev - 1 : 2))}
                        className="inline-flex items-center gap-1 py-1 px-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold transition cursor-pointer select-none"
                    >
                        <ChevronLeft className="size-4" />
                        <span className="hidden sm:inline">Sebelumnya</span>
                    </button>

                    <div className="text-center min-w-0">
                        <span className="font-extrabold text-slate-900 text-xs block truncate">
                            {currentPartInfo.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium hidden sm:block truncate">
                            {currentPartInfo.subtitle}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={() => setActivePart((prev) => (prev < 2 ? prev + 1 : 0))}
                        className="inline-flex items-center gap-1 py-1 px-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold transition cursor-pointer select-none"
                    >
                        <span className="hidden sm:inline">Berikutnya</span>
                        <ChevronRight className="size-4" />
                    </button>
                </div>

                {/* 3x2 Puzzle Interactive Area with Touch Swipe Support */}
                <div
                    className="w-full overflow-visible pb-2 pt-0.5 touch-pan-y"
                    onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
                    onTouchEnd={(e) => {
                        if (touchStartX === null) return;
                        const diff = e.changedTouches[0].clientX - touchStartX;
                        if (diff > 45) {
                            // Swiped right -> prev part
                            setActivePart((prev) => (prev > 0 ? prev - 1 : 2));
                        } else if (diff < -45) {
                            // Swiped left -> next part
                            setActivePart((prev) => (prev < 2 ? prev + 1 : 0));
                        }
                        setTouchStartX(null);
                    }}
                >
                    {render3x2Board()}
                </div>

                {/* Carousel Pagination Dots */}
                <div className="flex items-center justify-center gap-2 pt-1 pb-1">
                    {[0, 1, 2].map((dot) => (
                        <button
                            key={dot}
                            type="button"
                            onClick={() => setActivePart(dot)}
                            className={`transition-all duration-200 rounded-full cursor-pointer ${
                                activePart === dot
                                    ? 'w-6 h-2 bg-blue-600 shadow-2xs'
                                    : 'size-2 bg-slate-300 hover:bg-slate-400'
                            }`}
                            aria-label={`Pindah ke Bagian ${dot + 1}`}
                            title={`Bagian ${dot + 1}: ${PARTS_INFO[dot].title}`}
                        />
                    ))}
                    <span className="text-[10px] font-bold text-slate-400 ml-1">
                        {activePart + 1} / 3
                    </span>
                </div>
            </div>

            {/* FULL 6x3 JIGSAW PUZZLE (Visible on Desktop >= lg) */}
            <div className="hidden lg:block">
                <div className="w-full overflow-visible pb-3 pt-1">
                    {render6x3Board()}
                </div>
            </div>
        </div>
    );
}
