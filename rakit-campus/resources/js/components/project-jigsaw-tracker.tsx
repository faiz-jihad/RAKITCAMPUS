import React from 'react';
import { JIGSAW_PIECE_PATHS } from './jigsaw-loading-screen';

export interface ProjectJigsawTrackerProps {
    classComplete: boolean;
    infoComplete: boolean;
    techComplete: boolean;
    proposalComplete: boolean;
    onScrollToCard?: (cardId: string) => void;
    isMerging: boolean;
    mergePhase: 'idle' | 'snapping' | 'fused' | 'complete';
    isMandiri?: boolean;
    currentStep?: number;
}

const PIECE_OFFSETS: Record<number, { dx: number; dy: number; rot: number }> = {
    0: { dx: -16, dy: -16, rot: -5 }, // Top-Left (Card 1)
    1: { dx: 16, dy: -16, rot: 5 },   // Top-Right (Card 2)
    3: { dx: -16, dy: 16, rot: 5 },   // Bottom-Left (Card 3)
    2: { dx: 16, dy: 16, rot: -5 },   // Bottom-Right (Card 4)
};

export default function ProjectJigsawTracker({
    classComplete,
    infoComplete,
    techComplete,
    proposalComplete,
    onScrollToCard,
    isMerging,
    mergePhase,
    isMandiri = false,
    currentStep = 1,
}: ProjectJigsawTrackerProps) {
    const steps = [
        {
            id: 'card-class',
            stepNumber: 1,
            line1: 'Jalur',
            line2: 'Proyek',
            title: 'Jalur Proyek',
            pieceIndex: 0,
            isComplete: classComplete,
            centerX: 48,
            textY: 44,
            gradId: 'jigsaw-grad-0',
            strokeColor: '#1D4ED8',
        },
        {
            id: 'card-info',
            stepNumber: 2,
            line1: 'Informasi',
            line2: 'Proyek',
            title: 'Informasi Proyek',
            pieceIndex: 1,
            isComplete: infoComplete,
            centerX: 152,
            textY: 44,
            gradId: 'jigsaw-grad-1',
            strokeColor: '#1E40AF',
        },
        {
            id: 'card-tech',
            stepNumber: 3,
            line1: 'Teknologi',
            line2: '& Tim',
            title: 'Teknologi & Tim',
            pieceIndex: 3,
            isComplete: techComplete,
            centerX: 48,
            textY: 144,
            gradId: 'jigsaw-grad-3',
            strokeColor: '#2563EB',
        },
        {
            id: 'card-proposal',
            stepNumber: 4,
            line1: 'Proposal',
            line2: 'Awal',
            title: 'Proposal Awal (v1)',
            pieceIndex: 2,
            isComplete: proposalComplete,
            centerX: 152,
            textY: 144,
            gradId: 'jigsaw-grad-2',
            strokeColor: '#172554',
        },
    ];

    const completedCount =
        (classComplete ? 1 : 0) +
        (infoComplete ? 1 : 0) +
        (techComplete ? 1 : 0) +
        (proposalComplete ? 1 : 0);

    const allCompleted = completedCount === 4;
    const isFusedOrComplete = mergePhase === 'fused' || mergePhase === 'complete';

    return (
        <div className="flex flex-col items-center justify-center relative select-none transition-all duration-500 py-2 sm:py-4">
            {/* Embedded Keyframes for In-Place Merge Animation */}
            <style>{`
                @keyframes mergeSeamBurst {
                    0% { filter: drop-shadow(0 0 0px #38bdf8); }
                    50% { filter: drop-shadow(0 0 20px #38bdf8); }
                    100% { filter: drop-shadow(0 4px 12px rgba(37, 99, 235, 0.35)); }
                }
                @keyframes mergeDiagonalSheen {
                    0% { transform: translate3d(-140%, -140%, 0) rotate(35deg); }
                    100% { transform: translate3d(260%, 260%, 0) rotate(35deg); }
                }
                @keyframes completeTextPop {
                    0% { transform: scale(0.6) translateY(8px); opacity: 0; }
                    70% { transform: scale(1.08) translateY(-2px); opacity: 1; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
                @keyframes completeRingPing {
                    0% { transform: scale(0.85); opacity: 1; }
                    100% { transform: scale(1.35); opacity: 0; }
                }
            `}</style>

            {/* Jigsaw Display Canvas */}
            <div className="relative w-[270px] h-[270px] sm:w-[300px] sm:h-[300px] flex items-center justify-center select-none">
                {/* Luminous aura blooming when all 4 completed */}
                <div
                    className={`absolute inset-0 rounded-none bg-blue-500/15 blur-2xl transition-all duration-700 pointer-events-none ${
                        allCompleted ? 'opacity-100 scale-110' : 'opacity-0 scale-90'
                    }`}
                />

                {/* 1. The 4 Animated Interlocking Jigsaw Pieces (Visible during editing & snapping) */}
                <svg
                    viewBox="0 0 200 200"
                    className={`w-full h-full overflow-visible transition-all duration-500 ${
                        isFusedOrComplete ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
                    }`}
                >
                    <defs>
                        {/* Cohesive Blue Color Palette Gradients */}
                        <linearGradient id="jigsaw-grad-0" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#2563EB" />
                        </linearGradient>
                        <linearGradient id="jigsaw-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="100%" stopColor="#1D4ED8" />
                        </linearGradient>
                        <linearGradient id="jigsaw-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#60A5FA" />
                            <stop offset="100%" stopColor="#3B82F6" />
                        </linearGradient>
                        <linearGradient id="jigsaw-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#1D4ED8" />
                            <stop offset="100%" stopColor="#1E3A8A" />
                        </linearGradient>
                    </defs>

                    {/* Faint Blueprint Guide Outlines */}
                    <g opacity="0.15">
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

                    {/* 4 Pieces */}
                    {steps.map((step) => {
                        const pathD = JIGSAW_PIECE_PATHS[step.pieceIndex];
                        const offset = PIECE_OFFSETS[step.pieceIndex];
                        const assembled = step.isComplete;
                        const isSnapping = mergePhase === 'snapping';
                        const isCurrent = step.stepNumber === currentStep;

                        // During snapping, pieces pull tight into center with magnetic lock
                        const transform = assembled || isSnapping
                            ? 'translate3d(0, 0, 0) rotate(0deg) scale(1)'
                            : `translate3d(${offset.dx}px, ${offset.dy}px, 0) rotate(${offset.rot}deg) scale(0.97)`;

                        return (
                            <g
                                key={`piece-${step.pieceIndex}`}
                                onClick={() => !isMerging && onScrollToCard?.(step.id)}
                                className={`${isMerging ? 'cursor-default' : 'cursor-pointer'} transition-all duration-300 group`}
                                style={{
                                    transform,
                                    transformOrigin: `${step.centerX}px ${step.textY + 6}px`,
                                    transition:
                                        'transform 0.35s cubic-bezier(0.34, 1.45, 0.64, 1), opacity 0.25s ease',
                                }}
                            >
                                <title>{`${step.title} (${assembled ? 'Lengkap' : 'Belum Lengkap'})${isCurrent ? ' — Sedang Aktif' : ''}`}</title>

                                {assembled ? (
                                    /* Assembled Piece: Rich Colored Blue Jigsaw Tile with Crisp White Label */
                                    <>
                                        <path
                                            d={pathD}
                                            fill={`url(#${step.gradId})`}
                                            stroke={isSnapping ? '#38BDF8' : isCurrent ? '#38BDF8' : step.strokeColor}
                                            strokeWidth={isSnapping ? 2 : isCurrent ? 2.5 : 1.5}
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                            className="transition-all duration-300 group-hover:brightness-110"
                                            filter={
                                                isSnapping
                                                    ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.8))'
                                                    : isCurrent
                                                    ? 'drop-shadow(0 0 10px rgba(56, 189, 248, 0.65)) drop-shadow(0 3px 6px rgba(15, 23, 42, 0.16))'
                                                    : 'drop-shadow(0 3px 6px rgba(15, 23, 42, 0.16))'
                                            }
                                        />
                                        {/* Inner Bevel Tactile Highlight */}
                                        <path
                                            d={pathD}
                                            fill="none"
                                            stroke="rgba(255, 255, 255, 0.45)"
                                            strokeWidth={0.85}
                                            strokeLinejoin="round"
                                        />
                                        {/* Label of Card Title - Perfectly Centered Proportional */}
                                        <text
                                            x={step.centerX}
                                            y={step.textY}
                                            textAnchor="middle"
                                            fill="#FFFFFF"
                                            fontSize="9.5"
                                            fontWeight="700"
                                            letterSpacing="-0.2px"
                                            filter="drop-shadow(0 1px 2px rgba(15, 23, 42, 0.35))"
                                            className="select-none pointer-events-none"
                                        >
                                            <tspan x={step.centerX} dy="0">
                                                {step.line1}
                                            </tspan>
                                            <tspan x={step.centerX} dy="13">
                                                {step.line2}
                                            </tspan>
                                        </text>
                                    </>
                                ) : (
                                    /* Incomplete Piece: Soft Ghost Tile or Active Step Highlight */
                                    <>
                                        <path
                                            d={pathD}
                                            fill={isCurrent ? '#EFF6FF' : '#F8FAFC'}
                                            stroke={isCurrent ? '#2563EB' : '#CBD5E1'}
                                            strokeWidth={isCurrent ? 2 : 1.5}
                                            strokeDasharray={isCurrent ? 'none' : '4 3'}
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                            filter={isCurrent ? 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.25))' : undefined}
                                            className="transition-colors duration-200 group-hover:fill-blue-50/50 group-hover:stroke-blue-300"
                                        />
                                        <text
                                            x={step.centerX}
                                            y={step.textY}
                                            textAnchor="middle"
                                            fill={isCurrent ? '#1D4ED8' : '#475569'}
                                            fontSize="9.5"
                                            fontWeight={isCurrent ? '700' : '600'}
                                            letterSpacing="-0.2px"
                                            className="select-none pointer-events-none transition-colors duration-200 group-hover:fill-blue-600"
                                        >
                                            <tspan x={step.centerX} dy="0">
                                                {step.line1}
                                            </tspan>
                                            <tspan x={step.centerX} dy="13">
                                                {step.line2}
                                            </tspan>
                                        </text>
                                    </>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* 2. The Merged Unified Tile (In-Place on the 4 Pieces when Fused/Complete - Sharp Edges, No Border Radius) */}
                <div
                    className={`absolute inset-0 rounded-none bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 shadow-xl border-2 border-sky-400 overflow-hidden flex flex-col items-center justify-center transition-all duration-500 ${
                        isFusedOrComplete ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
                    }`}
                    style={isFusedOrComplete ? { animation: 'mergeSeamBurst 0.9s ease-out forwards' } : undefined}
                >
                    {/* Diagonal Light Sheen Sweep */}
                    <div
                        className="absolute inset-0 pointer-events-none overflow-hidden z-10"
                        style={{ mixBlendMode: 'overlay' }}
                    >
                        <div
                            className="w-[80px] h-[400px] bg-gradient-to-r from-transparent via-white/50 to-transparent blur-sm"
                            style={{ animation: 'mergeDiagonalSheen 1.6s ease-in-out infinite' }}
                        />
                    </div>

                    {/* Expanding Ring Ripple when Complete */}
                    {mergePhase === 'complete' && (
                        <div
                            className="absolute inset-0 rounded-none border-2 border-sky-400 pointer-events-none"
                            style={{ animation: 'completeRingPing 1.2s cubic-bezier(0, 0, 0.2, 1) infinite' }}
                        />
                    )}

                    {/* Centered In-Place "COMPLETE" Typography directly on the merged jigsaw */}
                    {mergePhase === 'complete' ? (
                        <div
                            className="relative z-20 flex flex-col items-center justify-center space-y-1"
                            style={{ animation: 'completeTextPop 0.5s cubic-bezier(0.34, 1.45, 0.64, 1) forwards' }}
                        >
                            <h3 className="text-3xl sm:text-4xl font-black tracking-widest text-white uppercase drop-shadow-lg">
                                COMPLETE
                            </h3>
                            <span className="text-[11px] font-bold text-sky-200 tracking-wider uppercase">
                                Proyek Terakit Sempurna
                            </span>
                        </div>
                    ) : (
                        <div className="relative z-20 flex flex-col items-center justify-center space-y-1">
                            <span className="text-white text-xs font-bold tracking-wider uppercase animate-pulse">
                                Merakit 4 Bagian...
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* In-Place Status Line beneath the Jigsaw during submission */}
            {isMerging && (
                <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-blue-600 animate-in fade-in duration-300">
                    <span className="w-3.5 h-3.5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                    <span>Membuka ruang kerja proyek...</span>
                </div>
            )}
        </div>
    );
}
