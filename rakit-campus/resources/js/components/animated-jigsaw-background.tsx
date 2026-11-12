import React, { useEffect, useState } from 'react';

// Grid Dimensions: 6 columns x 7 rows = 42 pieces
export const COLS = 6;
export const ROWS = 7;
export const CELL_SIZE = 100;
export const BOARD_WIDTH = COLS * CELL_SIZE; // 600
export const BOARD_HEIGHT = ROWS * CELL_SIZE; // 700

// Generous bleed past the screen edges so outer pieces extend completely off-screen
// This guarantees ZERO blue borders on any edge (top, bottom, left, right)
const BLEED = 80;

// Tab Directions for internal seams
// +1: tab points down into row r, -1: tab points up into row r-1
const H_TABS: number[][] = [
    [1, -1, 1, -1, 1, -1],  // seam 0 (between row 0 and 1)
    [-1, 1, -1, 1, -1, 1],  // seam 1 (between row 1 and 2)
    [1, -1, 1, -1, 1, -1],  // seam 2 (between row 2 and 3)
    [-1, 1, -1, 1, -1, 1],  // seam 3 (between row 3 and 4)
    [1, -1, 1, -1, 1, -1],  // seam 4 (between row 4 and 5)
    [-1, 1, -1, 1, -1, 1],  // seam 5 (between row 5 and 6)
];

// +1: tab points right into col c, -1: tab points left into col c-1
const V_TABS: number[][] = [
    [1, -1, 1, -1, 1], // row 0
    [-1, 1, -1, 1, -1], // row 1
    [1, -1, 1, -1, 1], // row 2
    [-1, 1, -1, 1, -1], // row 3
    [1, -1, 1, -1, 1], // row 4
    [-1, 1, -1, 1, -1], // row 5
    [1, -1, 1, -1, 1], // row 6
];

// Generate seamless horizontal edge with authentic cubic bezier jigsaw curves
function getHorizontalEdge(x0: number, y: number, x1: number, dir: number, reverse: boolean): string {
    if (dir === 0) {
        return reverse ? `L ${x0} ${y}` : `L ${x1} ${y}`;
    }

    if (!reverse) {
        return (
            `L ${x0 + 36} ${y} ` +
            `C ${x0 + 39} ${y} ${x0 + 40} ${y + dir * 4} ${x0 + 40} ${y + dir * 9} ` +
            `C ${x0 + 39} ${y + dir * 18} ${x0 + 31} ${y + dir * 24} ${x0 + 50} ${y + dir * 24} ` +
            `C ${x0 + 69} ${y + dir * 24} ${x0 + 61} ${y + dir * 18} ${x0 + 60} ${y + dir * 9} ` +
            `C ${x0 + 60} ${y + dir * 4} ${x0 + 61} ${y} ${x0 + 64} ${y} ` +
            `L ${x1} ${y}`
        );
    } else {
        return (
            `L ${x0 + 64} ${y} ` +
            `C ${x0 + 61} ${y} ${x0 + 60} ${y + dir * 4} ${x0 + 60} ${y + dir * 9} ` +
            `C ${x0 + 61} ${y + dir * 18} ${x0 + 69} ${y + dir * 24} ${x0 + 50} ${y + dir * 24} ` +
            `C ${x0 + 31} ${y + dir * 24} ${x0 + 39} ${y + dir * 18} ${x0 + 40} ${y + dir * 9} ` +
            `C ${x0 + 40} ${y + dir * 4} ${x0 + 39} ${y} ${x0 + 36} ${y} ` +
            `L ${x0} ${y}`
        );
    }
}

// Generate seamless vertical edge with authentic cubic bezier jigsaw curves
function getVerticalEdge(x: number, y0: number, y1: number, dir: number, reverse: boolean): string {
    if (dir === 0) {
        return reverse ? `L ${x} ${y0}` : `L ${x} ${y1}`;
    }

    if (!reverse) {
        return (
            `L ${x} ${y0 + 36} ` +
            `C ${x} ${y0 + 39} ${x + dir * 4} ${y0 + 40} ${x + dir * 9} ${y0 + 40} ` +
            `C ${x + dir * 18} ${y0 + 39} ${x + dir * 24} ${y0 + 31} ${x + dir * 24} ${y0 + 50} ` +
            `C ${x + dir * 24} ${y0 + 69} ${x + dir * 18} ${y0 + 61} ${x + dir * 9} ${y0 + 60} ` +
            `C ${x + dir * 4} ${y0 + 60} ${x} ${y0 + 61} ${x} ${y0 + 64} ` +
            `L ${x} ${y1}`
        );
    } else {
        return (
            `L ${x} ${y0 + 64} ` +
            `C ${x} ${y0 + 61} ${x + dir * 4} ${y0 + 60} ${x + dir * 9} ${y0 + 60} ` +
            `C ${x + dir * 18} ${y0 + 61} ${x + dir * 24} ${y0 + 69} ${x + dir * 24} ${y0 + 50} ` +
            `C ${x + dir * 24} ${y0 + 31} ${x + dir * 18} ${y0 + 39} ${x + dir * 9} ${y0 + 40} ` +
            `C ${x + dir * 4} ${y0 + 40} ${x} ${y0 + 39} ${x} ${y0 + 36} ` +
            `L ${x} ${y0}`
        );
    }
}

// Calculate mathematically closed path for piece at (r, c) with 80px bleed on outer perimeter
function computeBleedingPiecePath(r: number, c: number): string {
    const isTop = r === 0;
    const isBottom = r === ROWS - 1;
    const isLeft = c === 0;
    const isRight = c === COLS - 1;

    // Outer boundary coordinates including bleed off-screen
    const leftX = isLeft ? -BLEED : c * CELL_SIZE;
    const rightX = isRight ? BOARD_WIDTH + BLEED : (c + 1) * CELL_SIZE;
    const topY = isTop ? -BLEED : r * CELL_SIZE;
    const bottomY = isBottom ? BOARD_HEIGHT + BLEED : (r + 1) * CELL_SIZE;

    // Normal cell coordinates for inner seams
    const innerX0 = c * CELL_SIZE;
    const innerX1 = (c + 1) * CELL_SIZE;
    const innerY0 = r * CELL_SIZE;
    const innerY1 = (r + 1) * CELL_SIZE;

    const topDir = isTop ? 0 : H_TABS[r - 1][c];
    const rightDir = isRight ? 0 : V_TABS[r][c];
    const bottomDir = isBottom ? 0 : H_TABS[r][c];
    const leftDir = isLeft ? 0 : V_TABS[r][c - 1];

    let p = `M ${leftX} ${topY} `;

    // 1. TOP EDGE (Left to Right)
    if (isTop) {
        p += `L ${rightX} ${topY} `;
    } else {
        p += getHorizontalEdge(innerX0, innerY0, innerX1, topDir, false) + ' ';
    }

    // 2. RIGHT EDGE (Top to Bottom)
    if (isRight) {
        p += `L ${rightX} ${bottomY} `;
    } else {
        p += getVerticalEdge(innerX1, innerY0, innerY1, rightDir, false) + ' ';
    }

    // 3. BOTTOM EDGE (Right to Left)
    if (isBottom) {
        p += `L ${leftX} ${bottomY} `;
    } else {
        p += getHorizontalEdge(innerX0, innerY1, innerX1, bottomDir, true) + ' ';
    }

    // 4. LEFT EDGE (Bottom to Top)
    if (isLeft) {
        p += `L ${leftX} ${topY} `;
    } else {
        p += getVerticalEdge(innerX0, innerY0, innerY1, leftDir, true) + ' ';
    }

    p += 'Z';
    return p;
}

// Snake Assembly Order: each piece connects directly to the one placed right before it
export const SNAKE_ORDER: { row: number; col: number; id: number }[] = [];
let idCounter = 0;
for (let r = 0; r < ROWS; r++) {
    if (r % 2 === 0) {
        for (let c = 0; c < COLS; c++) {
            SNAKE_ORDER.push({ row: r, col: c, id: idCounter++ });
        }
    } else {
        for (let c = COLS - 1; c >= 0; c--) {
            SNAKE_ORDER.push({ row: r, col: c, id: idCounter++ });
        }
    }
}

// Precomputed closed paths for all 42 pieces
export const PIECE_PATHS: Record<string, string> = {};
for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
        PIECE_PATHS[`${r}-${c}`] = computeBleedingPiecePath(r, c);
    }
}

// Natural scattered offset for each piece before it connects
function getPieceOffset(row: number, col: number) {
    const dx = (col - (COLS - 1) / 2) * 16 + ((row % 2 === 0 ? 1 : -1) * 12);
    const dy = (row - (ROWS - 1) / 2) * 16 + ((col % 2 === 0 ? -1 : 1) * 10);
    const rot = ((col * 4 + row * 6) % 15) - 7;
    return { dx, dy, rot };
}

const TOTAL_PIECES = COLS * ROWS; // 42
const HOLD_STEPS = 24; // ~4 seconds holding fully whole
const DISSOLVE_STEPS = 6;
const TOTAL_CYCLE_STEPS = TOTAL_PIECES + HOLD_STEPS + DISSOLVE_STEPS; // 72

interface Props {
    className?: string;
}

export function AnimatedJigsawBackground({ className = '' }: Props) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev + 1) % TOTAL_CYCLE_STEPS);
        }, 160); // 160ms per piece connection step (~6.7s for full puzzle assembly)

        return () => clearInterval(interval);
    }, []);

    const assembledCount = step >= TOTAL_PIECES ? TOTAL_PIECES : step;
    const isComplete = assembledCount === TOTAL_PIECES;
    const isDissolving = step >= TOTAL_PIECES + HOLD_STEPS;

    return (
        <div
            className={`absolute inset-0 pointer-events-none select-none z-0 overflow-hidden bg-gradient-to-br from-[#38BDF8] via-[#0EA5E9] to-[#0284C7] ${className}`}
            aria-hidden="true"
        >
            {/* Embedded Keyframes for Shimmer Wave Across Complete Puzzle */}
            <style>{`
                @keyframes puzzleBackgroundSheen {
                    0% {
                        transform: translate3d(-120%, -120%, 0) rotate(35deg);
                    }
                    100% {
                        transform: translate3d(240%, 240%, 0) rotate(35deg);
                    }
                }
            `}</style>

            {/* Ambient Lighting Underlayer */}
            <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-black/15 pointer-events-none z-0" />

            {/* SVG Canvas Covering 100% of the Background Viewport with 4% Scale & Bleed (Zero Blue Edge Gaps) */}
            <svg
                viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
                preserveAspectRatio="xMidYMid slice"
                className="absolute inset-0 w-full h-full overflow-hidden scale-[1.04] origin-center"
            >
                <defs>
                    {/* Realistic physical drop-shadow for each individual white piece */}
                    <filter id="bgPieceShadow" x="-25%" y="-25%" width="150%" height="150%">
                        <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0F172A" floodOpacity="0.18" />
                    </filter>
                </defs>

                {/* LAYER 1: Blueprint Slot Guides (subtle dashed outlines waiting to be filled) */}
                <g opacity="0.35">
                    {SNAKE_ORDER.map(({ row, col }) => {
                        const path = PIECE_PATHS[`${row}-${col}`];
                        return (
                            <path
                                key={`bg-slot-${row}-${col}`}
                                d={path}
                                fill="rgba(255, 255, 255, 0.12)"
                                stroke="#FFFFFF"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                strokeLinejoin="round"
                            />
                        );
                    })}
                </g>

                {/* LAYER 2: The 42 Interlocking White Jigsaw Pieces with Zero Blue Margins */}
                {SNAKE_ORDER.map(({ row, col, id }) => {
                    const path = PIECE_PATHS[`${row}-${col}`];
                    const isAssembled = assembledCount > id && !isDissolving;
                    const offset = getPieceOffset(row, col);

                    const transformStyle = isAssembled
                        ? 'translate3d(0, 0, 0) scale(1) rotate(0deg)'
                        : `translate3d(${offset.dx}px, ${offset.dy}px, 0) scale(1.15) rotate(${offset.rot}deg)`;

                    const pieceOpacity = isAssembled ? 1 : 0;

                    return (
                        <g
                            key={`bg-piece-${row}-${col}`}
                            style={{
                                transform: transformStyle,
                                transformOrigin: `${col * CELL_SIZE + 50}px ${row * CELL_SIZE + 50}px`,
                                opacity: pieceOpacity,
                                transition: isDissolving
                                    ? 'opacity 0.6s ease'
                                    : 'transform 0.48s cubic-bezier(0.34, 1.45, 0.64, 1), opacity 0.35s ease',
                            }}
                            filter="url(#bgPieceShadow)"
                        >
                            {/* Pure Crisp White Jigsaw Piece with Clean Neutral Cut Lines (Zero Blue Border) */}
                            <path
                                d={path}
                                fill="#FFFFFF"
                                stroke="#CBD5E1"
                                strokeWidth={1.25}
                                strokeLinejoin="round"
                                strokeLinecap="round"
                                className="transition-colors duration-300"
                            />
                        </g>
                    );
                })}
            </svg>

            {/* LAYER 3: Luminous Sheen Sweeping Across the Background when Utuh */}
            {isComplete && !isDissolving && (
                <div
                    className="absolute inset-0 pointer-events-none overflow-hidden z-10"
                    style={{ mixBlendMode: 'overlay' }}
                >
                    <div
                        className="w-[120px] h-[1200px] bg-gradient-to-r from-transparent via-white/80 to-transparent blur-xl"
                        style={{ animation: 'puzzleBackgroundSheen 2.6s ease-in-out infinite' }}
                    />
                </div>
            )}
        </div>
    );
}

export default AnimatedJigsawBackground;
