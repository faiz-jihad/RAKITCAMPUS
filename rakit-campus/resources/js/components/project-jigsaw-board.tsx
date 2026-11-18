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

// 12 Organic Horizontal Seams (2 internal rows x 6 columns)
// Realistic natural jigsaw: varied directions, positions, depths, bulb sizes & tilts
const H_SEAMS_DEF: SeamConfig[][] = [
    // Seam between Row 0 and Row 1 (6 columns)
    [
        { dir:  1, offset:  6, depth: 24, bulbW: 39, neckW: 22, tilt: -1 }, // col 0 (0,0 tab down into 1,0)
        { dir: -1, offset: -9, depth: 22, bulbW: 36, neckW: 20, tilt:  1 }, // col 1 (1,1 tab up into 0,1)
        { dir:  1, offset:  8, depth: 25, bulbW: 41, neckW: 23, tilt:  2 }, // col 2 (0,2 tab down into 1,2)
        { dir:  1, offset: -7, depth: 23, bulbW: 38, neckW: 21, tilt: -2 }, // col 3 (0,3 tab down into 1,3)
        { dir: -1, offset:  9, depth: 25, bulbW: 40, neckW: 24, tilt:  1 }, // col 4 (1,4 tab up into 0,4)
        { dir:  1, offset: -8, depth: 22, bulbW: 37, neckW: 20, tilt: -1 }, // col 5 (0,5 tab down into 1,5)
    ],
    // Seam between Row 1 and Row 2 (6 columns)
    [
        { dir: -1, offset: -7, depth: 23, bulbW: 37, neckW: 21, tilt:  1 }, // col 0 (2,0 tab up into 1,0)
        { dir:  1, offset:  9, depth: 26, bulbW: 41, neckW: 23, tilt: -1 }, // col 1 (1,1 tab down into 2,1)
        { dir:  1, offset: -8, depth: 22, bulbW: 38, neckW: 20, tilt: -2 }, // col 2 (1,2 tab down into 2,2)
        { dir: -1, offset:  7, depth: 24, bulbW: 39, neckW: 22, tilt:  1 }, // col 3 (2,3 tab up into 1,3)
        { dir:  1, offset: -6, depth: 25, bulbW: 40, neckW: 23, tilt: -1 }, // col 4 (1,4 tab down into 2,4)
        { dir: -1, offset:  8, depth: 23, bulbW: 36, neckW: 21, tilt:  2 }, // col 5 (2,5 tab up into 1,5)
    ],
];

// 15 Organic Vertical Seams (3 rows x 5 internal column seams)
// Varied directions, positions, depths, bulb sizes & tilts for rich natural variety
const V_SEAMS_DEF: SeamConfig[][] = [
    // Row 0 (5 seams)
    [
        { dir:  1, offset: -8, depth: 23, bulbW: 38, neckW: 22, tilt:  1 }, // 0,0 tab right into 0,1
        { dir: -1, offset:  9, depth: 25, bulbW: 41, neckW: 23, tilt: -2 }, // 0,2 tab left into 0,1
        { dir: -1, offset: -7, depth: 22, bulbW: 36, neckW: 20, tilt: -1 }, // 0,3 tab left into 0,2
        { dir:  1, offset: -9, depth: 24, bulbW: 39, neckW: 22, tilt: -1 }, // 0,3 tab right into 0,4
        { dir: -1, offset:  7, depth: 22, bulbW: 37, neckW: 21, tilt:  2 }, // 0,5 tab left into 0,4
    ],
    // Row 1 (5 seams)
    [
        { dir:  1, offset:  8, depth: 25, bulbW: 40, neckW: 23, tilt: -2 }, // 1,0 tab right into 1,1
        { dir: -1, offset: -8, depth: 22, bulbW: 37, neckW: 20, tilt:  1 }, // 1,2 tab left into 1,1
        { dir:  1, offset:  6, depth: 24, bulbW: 39, neckW: 22, tilt:  2 }, // 1,2 tab right into 1,3
        { dir: -1, offset:  8, depth: 23, bulbW: 38, neckW: 21, tilt: -1 }, // 1,4 tab left into 1,3
        { dir:  1, offset: -7, depth: 24, bulbW: 40, neckW: 22, tilt:  1 }, // 1,4 tab right into 1,5
    ],
    // Row 2 (5 seams)
    [
        { dir: -1, offset: -8, depth: 22, bulbW: 37, neckW: 20, tilt:  1 }, // 2,1 tab left into 2,0
        { dir:  1, offset:  9, depth: 25, bulbW: 41, neckW: 23, tilt: -2 }, // 2,1 tab right into 2,2
        { dir:  1, offset: -7, depth: 23, bulbW: 38, neckW: 21, tilt:  1 }, // 2,2 tab right into 2,3
        { dir: -1, offset:  8, depth: 24, bulbW: 39, neckW: 22, tilt: -1 }, // 2,4 tab left into 2,3
        { dir:  1, offset: -8, depth: 22, bulbW: 37, neckW: 21, tilt:  1 }, // 2,4 tab right into 2,5
    ],
];

/**
 * Returns a smooth, authentic, organic jigsaw tab along a horizontal edge between (x0, y) and (x1, y).
 */
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

/**
 * Returns a smooth, authentic, organic jigsaw tab along a vertical edge between (x, y0) and (x, y1).
 */
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

function getPiecePath(r: number, c: number): string {
    const isTop = r === 0;
    const isBottom = r === ROWS - 1;
    const isLeft = c === 0;
    const isRight = c === COLS - 1;

    const x0 = c * CW;
    const x1 = (c + 1) * CW;
    const y0 = r * CH;
    const y1 = (r + 1) * CH;

    // Both adjacent pieces share the exact same seam definition!
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

// Interconnected assembly chain:
// Every single piece in this sequence connects directly to the one immediately before it!
const CONNECTED_CHAIN_IDS: string[] = [
    // Row 0: left to right (interconnected horizontally)
    'overview',        // (0, 0) - Initial anchor
    'requirements',    // (0, 1) -> snaps to overview
    'matchmaking',     // (0, 2) -> snaps to requirements
    'team_balance',    // (0, 3) -> snaps to matchmaking
    'invitations',     // (0, 4) -> snaps to team_balance
    'formation',       // (0, 5) -> snaps to invitations
    // Connection drops down into Row 1 right edge
    'lecturer_review', // (1, 5) -> snaps down to formation
    // Row 1: right to left (interconnected horizontally)
    'discussion',      // (1, 4) -> snaps to lecturer_review
    'documents',       // (1, 3) -> snaps to discussion
    'versions',        // (1, 2) -> snaps to documents
    'proposal',        // (1, 1) -> snaps to versions
    'members',         // (1, 0) -> snaps to proposal
    // Connection drops down into Row 2 left edge
    'tasks',           // (2, 0) -> snaps down to members
    // Row 2: left to right (interconnected horizontally)
    'milestones',      // (2, 1) -> snaps to tasks
    'progress',        // (2, 2) -> snaps to milestones
    'uts',             // (2, 3) -> snaps to progress
    'uas',             // (2, 4) -> snaps to uts
    'archive',         // (2, 5) -> snaps to uas
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

    // Exact 18 items mapped to 6x3 grid
    const items: JigsawBoardItem[] = [
        // Row 0: Inisiasi, Overview & Formasi Tim
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

        // Row 1: Anggota, Proposal, Dokumen & Kolaborasi
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

        // Row 2: Eksekusi (Kanban, Milestones) & Evaluasi (UTS, UAS, Portofolio)
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

    // Find the currently active item
    const activeItem = items.find((it) => it.id === activeTab);
    // Find hovered item
    const hoveredItem = hoveredId ? items.find((it) => it.id === hoveredId) : null;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    // GSAP ScrollTrigger Animation: Perakitan puzzle mulus 60/120fps tanpa patah-patah
    useEffect(() => {
        if (!svgRef.current || !containerRef.current) return;

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top 85%', // Memicu begitu section puzzle mencapai area pandang
                    once: true,
                    fastScrollEnd: true,
                    preventOverlaps: true,
                },
            });

            CONNECTED_CHAIN_IDS.forEach((id, index) => {
                const pieceEl = svgRef.current?.querySelector(`[data-jigsaw-id="${id}"]`);
                const item = items.find((it) => it.id === id);
                if (pieceEl && item) {
                    const cx = (item.col + 0.5) * CW;
                    const cy = (item.row + 0.5) * CH;

                    tl.fromTo(
                        pieceEl,
                        {
                            autoAlpha: 0,
                            scale: 0.92,
                            y: -14,
                            transformOrigin: `${cx}px ${cy}px`,
                        },
                        {
                            autoAlpha: 1,
                            scale: 1,
                            y: 0,
                            duration: 0.28,
                            ease: 'power2.out',
                            force3D: true,
                            clearProps: 'transform,opacity,visibility',
                        },
                        index * 0.042 // Stagger cepat 42ms: animasi mengalir super mulus
                    );
                }
            });

            ScrollTrigger.refresh();
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="w-full select-none py-1">
            {/* Assembled 6x3 Jigsaw Puzzle Board (Responsive SVG Container) */}
            <div className="w-full overflow-visible pb-3 pt-1">
                <svg
                    ref={svgRef}
                    viewBox="-12 -12 1134 432"
                    className="w-full max-w-6xl mx-auto h-auto drop-shadow-sm overflow-visible"
                >
                    <defs>
                        {/* Gradient for active piece */}
                        <linearGradient id="puzzle-active-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="100%" stopColor="#1D4ED8" />
                        </linearGradient>

                        {/* Drop shadow filter for active piece */}
                        <filter id="puzzle-active-shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#1D4ED8" floodOpacity="0.35" />
                        </filter>

                        {/* Drop shadow filter for hovered piece */}
                        <filter id="puzzle-hover-shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#3B82F6" floodOpacity="0.25" />
                        </filter>
                    </defs>

                    {/* 1. LAYER BASE: RENDER INACTIVE & UNHOVERED PIECES */}
                    {items.map((item) => {
                        const isAcademicOnly = ACADEMIC_ONLY_IDS.includes(item.id);
                        const isDisabled = !isAcademic && isAcademicOnly;

                        const isActive = activeTab === item.id;
                        const isHovered = hoveredId === item.id;
                        if (!isDisabled && (isActive || isHovered)) return null; // Rendered in upper layers

                        const Icon = item.icon;
                        const pathD = getPiecePath(item.row, item.col);

                        if (isDisabled) {
                            return (
                                <g
                                    key={item.id}
                                    data-jigsaw-id={item.id}
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
                                data-jigsaw-id={item.id}
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

                    {/* 2. LAYER HOVER: RENDER CURRENTLY HOVERED PIECE (Clean on top of base layer) */}
                    {hoveredItem && hoveredItem.id !== activeTab && !(!isAcademic && ACADEMIC_ONLY_IDS.includes(hoveredItem.id)) && (() => {
                        const Icon = hoveredItem.icon;
                        const pathD = getPiecePath(hoveredItem.row, hoveredItem.col);

                        return (
                            <g
                                key={hoveredItem.id}
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredId(hoveredItem.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onClick={() => onSelectTab(hoveredItem.id)}
                                filter="url(#puzzle-hover-shadow)"
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

                    {/* 3. LAYER ACTIVE: RENDER CURRENT ACTIVE PIECE (Topmost, Vibrant Solid/Electric Blue) */}
                    {activeItem && !(!isAcademic && ACADEMIC_ONLY_IDS.includes(activeItem.id)) && (() => {
                        const Icon = activeItem.icon;
                        const pathD = getPiecePath(activeItem.row, activeItem.col);

                        return (
                            <g
                                key={activeItem.id}
                                data-jigsaw-id={activeItem.id}
                                className="cursor-pointer"
                                filter="url(#puzzle-active-shadow)"
                                onClick={() => onSelectTab(activeItem.id)}
                            >
                                <title>{`Menu aktif: ${activeItem.label}`}</title>
                                <path
                                    d={pathD}
                                    fill="url(#puzzle-active-grad)"
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
            </div>
        </div>
    );
}
