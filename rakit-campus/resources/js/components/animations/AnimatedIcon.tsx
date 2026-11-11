import React from 'react';

export type AnimatedIconType =
    | 'trophy'
    | 'rocket'
    | 'search'
    | 'team'
    | 'sparkles'
    | 'folder'
    | 'clock'
    | 'target'
    | 'check';

interface Props {
    name: AnimatedIconType;
    size?: number;
    className?: string;
    primaryColor?: string;
    accentColor?: string;
}

/**
 * AnimatedIcon
 * High-performance, art-directed animated SVG icons inspired by LottieFiles free animations.
 * Completely zero-dependency, 60fps GPU-accelerated CSS keyframe animations,
 * zero external network lag, zero emojis.
 */
export default function AnimatedIcon({
    name,
    size = 48,
    className = '',
    primaryColor = '#2563eb',
    accentColor = '#3b82f6',
}: Props) {
    const dim = `${size}px`;

    switch (name) {
        case 'trophy':
            return (
                <div
                    className={`inline-flex items-center justify-center shrink-0 ${className}`}
                    style={{ width: dim, height: dim }}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full overflow-visible"
                    >
                        <style>{`
                            @keyframes trophyFloat {
                                0%, 100% { transform: translateY(0px) rotate(0deg); }
                                50% { transform: translateY(-4px) rotate(1deg); }
                            }
                            @keyframes starTwinkle1 {
                                0%, 100% { transform: scale(0.6) rotate(0deg); opacity: 0.3; }
                                50% { transform: scale(1.15) rotate(45deg); opacity: 1; }
                            }
                            @keyframes starTwinkle2 {
                                0%, 100% { transform: scale(1.1) rotate(45deg); opacity: 0.9; }
                                50% { transform: scale(0.5) rotate(0deg); opacity: 0.2; }
                            }
                            @keyframes sheenSweep {
                                0% { transform: translateX(-20px); opacity: 0; }
                                30% { opacity: 0.8; }
                                60%, 100% { transform: translateX(25px); opacity: 0; }
                            }
                            .trophy-body { animation: trophyFloat 3.6s ease-in-out infinite; transform-origin: 32px 50px; }
                            .star-1 { animation: starTwinkle1 2.2s ease-in-out infinite; transform-origin: 50px 14px; }
                            .star-2 { animation: starTwinkle2 2.6s ease-in-out infinite 0.6s; transform-origin: 14px 28px; }
                            .sheen { animation: sheenSweep 3.2s ease-in-out infinite; }
                        `}</style>
                        <g className="trophy-body">
                            {/* Pedestal Base */}
                            <path
                                d="M22 52H42V56C42 57.1 41.1 58 40 58H24C22.9 58 22 57.1 22 56V52Z"
                                fill="#1e293b"
                            />
                            <path
                                d="M26 46H38V52H26V46Z"
                                fill="#334155"
                            />
                            {/* Stem */}
                            <path
                                d="M29 38H35V46H29V38Z"
                                fill="#cbd5e1"
                            />
                            {/* Left Handle */}
                            <path
                                d="M19 16C13 16 11 22 11 26C11 31 16 34 22 34V30C18 30 15 28 15 26C15 23 16 20 19 20V16Z"
                                fill={accentColor}
                                opacity="0.8"
                            />
                            {/* Right Handle */}
                            <path
                                d="M45 16C51 16 53 22 53 26C53 31 48 34 42 34V30C46 30 49 28 49 26C49 23 48 20 45 20V16Z"
                                fill={accentColor}
                                opacity="0.8"
                            />
                            {/* Cup Body with Gradient */}
                            <path
                                d="M20 14H44C44 26 38 38 32 38C26 38 20 26 20 14Z"
                                fill={primaryColor}
                            />
                            {/* Cup Rim */}
                            <rect
                                x="19"
                                y="12"
                                width="26"
                                height="4"
                                rx="2"
                                fill="#60a5fa"
                            />
                            {/* Inner Cup Shading */}
                            <path
                                d="M24 16H40C39.5 24 35.5 33 32 35C28.5 33 24.5 24 24 16Z"
                                fill="white"
                                fillOpacity="0.18"
                            />
                            {/* Center Star Badge on Cup */}
                            <polygon
                                points="32,21 33.5,24.5 37,25 34.5,27.5 35,31 32,29.5 29,31 29.5,27.5 27,25 30.5,24.5"
                                fill="#fde047"
                            />
                        </g>
                        {/* Twinkling Stars */}
                        <g className="star-1">
                            <path
                                d="M50 10L51.2 13.5L54.5 14.5L51.2 15.5L50 19L48.8 15.5L45.5 14.5L48.8 13.5L50 10Z"
                                fill="#fbbf24"
                            />
                        </g>
                        <g className="star-2">
                            <path
                                d="M14 25L14.8 27.2L17 28L14.8 28.8L14 31L13.2 28.8L11 28L13.2 27.2L14 25Z"
                                fill="#60a5fa"
                            />
                        </g>
                    </svg>
                </div>
            );

        case 'rocket':
            return (
                <div
                    className={`inline-flex items-center justify-center shrink-0 ${className}`}
                    style={{ width: dim, height: dim }}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full overflow-visible"
                    >
                        <style>{`
                            @keyframes rocketFly {
                                0%, 100% { transform: translate(0px, 0px) rotate(0deg); }
                                50% { transform: translate(2px, -3px) rotate(1.5deg); }
                            }
                            @keyframes flameFlicker {
                                0%, 100% { transform: scale(1) translate(0px, 0px); opacity: 0.95; }
                                50% { transform: scale(1.15) translate(-1px, 2px); opacity: 1; }
                            }
                            @keyframes smokePuff {
                                0% { transform: translate(0px, 0px) scale(0.5); opacity: 0.8; }
                                100% { transform: translate(-8px, 12px) scale(1.4); opacity: 0; }
                            }
                            .rocket-group { animation: rocketFly 2.8s ease-in-out infinite; transform-origin: 32px 32px; }
                            .flame { animation: flameFlicker 0.4s ease-in-out infinite alternate; transform-origin: 22px 42px; }
                            .smoke-1 { animation: smokePuff 1.8s ease-out infinite; transform-origin: 18px 46px; }
                            .smoke-2 { animation: smokePuff 1.8s ease-out infinite 0.7s; transform-origin: 20px 48px; }
                        `}</style>
                        {/* Exhaust Smoke Particles */}
                        <circle cx="17" cy="48" r="3" fill="#e2e8f0" className="smoke-1" />
                        <circle cx="21" cy="52" r="2.5" fill="#cbd5e1" className="smoke-2" />

                        <g className="rocket-group">
                            {/* Thrust Flame */}
                            <g className="flame">
                                <path
                                    d="M23 39L15 47C14 48 15 50 17 49L25 41Z"
                                    fill="#f97316"
                                />
                                <path
                                    d="M22 40L17 45C16.5 45.5 17 46.5 18 46L23 41Z"
                                    fill="#fde047"
                                />
                            </g>
                            {/* Left Fin */}
                            <path
                                d="M26 31L18 35C16 36 17 39 19 39L27 37Z"
                                fill="#1e3a8a"
                            />
                            {/* Right Fin */}
                            <path
                                d="M37 20L41 28C42 30 39 31 37 31L35 23Z"
                                fill="#1e3a8a"
                            />
                            {/* Rocket Main Fuselage */}
                            <path
                                d="M23 40C20 33 26 21 44 14C49 12 51 14 50 19C43 37 31 43 24 40Z"
                                fill={primaryColor}
                            />
                            {/* Nose Cone Accent */}
                            <path
                                d="M42 15C46 13 49 14 50 19C48 21 45 22 42 22C42 19 42 16 42 15Z"
                                fill="#ef4444"
                            />
                            {/* Porthole Ring */}
                            <circle cx="34" cy="27" r="4.5" fill="#93c5fd" />
                            {/* Porthole Glass */}
                            <circle cx="34" cy="27" r="3" fill="#0f172a" />
                            <circle cx="35" cy="26" r="1" fill="white" />
                        </g>
                    </svg>
                </div>
            );

        case 'search':
            return (
                <div
                    className={`inline-flex items-center justify-center shrink-0 ${className}`}
                    style={{ width: dim, height: dim }}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full overflow-visible"
                    >
                        <style>{`
                            @keyframes radarPulse {
                                0% { r: 8px; opacity: 0.8; stroke-width: 2px; }
                                100% { r: 24px; opacity: 0; stroke-width: 0.5px; }
                            }
                            @keyframes lensTilt {
                                0%, 100% { transform: rotate(0deg) translate(0, 0); }
                                50% { transform: rotate(-6deg) translate(-2px, -2px); }
                            }
                            @keyframes dotBlink {
                                0%, 100% { opacity: 0.2; transform: scale(0.8); }
                                50% { opacity: 1; transform: scale(1.3); }
                            }
                            .radar-ring-1 { animation: radarPulse 2.4s ease-out infinite; transform-origin: 28px 28px; }
                            .radar-ring-2 { animation: radarPulse 2.4s ease-out infinite 0.8s; transform-origin: 28px 28px; }
                            .lens-body { animation: lensTilt 3.8s ease-in-out infinite; transform-origin: 28px 28px; }
                            .target-dot { animation: dotBlink 1.6s ease-in-out infinite; transform-origin: 28px 28px; }
                        `}</style>
                        {/* Radar Ripples */}
                        <circle
                            cx="28"
                            cy="28"
                            r="12"
                            stroke={primaryColor}
                            fill="none"
                            className="radar-ring-1"
                        />
                        <circle
                            cx="28"
                            cy="28"
                            r="18"
                            stroke={accentColor}
                            fill="none"
                            className="radar-ring-2"
                        />

                        {/* Center Target Dot */}
                        <circle cx="28" cy="28" r="3" fill="#3b82f6" className="target-dot" />

                        {/* Magnifying Glass */}
                        <g className="lens-body">
                            {/* Glass Shadow */}
                            <circle cx="28" cy="28" r="14" fill="#3b82f6" fillOpacity="0.08" />
                            {/* Outer Rim */}
                            <circle
                                cx="28"
                                cy="28"
                                r="14"
                                stroke={primaryColor}
                                strokeWidth="3"
                                fill="none"
                            />
                            {/* Glass Glare Arc */}
                            <path
                                d="M20 22C22 18 26 16 30 16"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                            {/* Handle Joint */}
                            <circle cx="39" cy="39" r="2.5" fill="#1e293b" />
                            {/* Handle */}
                            <path
                                d="M40 40L53 53"
                                stroke="#1e293b"
                                strokeWidth="4.5"
                                strokeLinecap="round"
                            />
                        </g>
                    </svg>
                </div>
            );

        case 'team':
            return (
                <div
                    className={`inline-flex items-center justify-center shrink-0 ${className}`}
                    style={{ width: dim, height: dim }}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full overflow-visible"
                    >
                        <style>{`
                            @keyframes nodePulse1 {
                                0%, 100% { transform: scale(1); }
                                50% { transform: scale(1.12); }
                            }
                            @keyframes nodePulse2 {
                                0%, 100% { transform: scale(1.1); }
                                50% { transform: scale(1); }
                            }
                            @keyframes nodePulse3 {
                                0%, 100% { transform: scale(0.96); }
                                50% { transform: scale(1.08); }
                            }
                            @keyframes pathFlow {
                                0% { stroke-dashoffset: 24; }
                                100% { stroke-dashoffset: 0; }
                            }
                            @keyframes orbitRotate {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                            .node-1 { animation: nodePulse1 3.2s ease-in-out infinite; transform-origin: 32px 18px; }
                            .node-2 { animation: nodePulse2 3.2s ease-in-out infinite 0.7s; transform-origin: 18px 44px; }
                            .node-3 { animation: nodePulse3 3.2s ease-in-out infinite 1.4s; transform-origin: 46px 44px; }
                            .flow-line { stroke-dasharray: 4 3; animation: pathFlow 1.6s linear infinite; }
                            .orbit-group { animation: orbitRotate 6s linear infinite; transform-origin: 32px 34px; }
                        `}</style>
                        {/* Connecting Line Triangular Paths */}
                        <line
                            x1="32"
                            y1="18"
                            x2="18"
                            y2="44"
                            stroke="#93c5fd"
                            strokeWidth="2"
                            className="flow-line"
                        />
                        <line
                            x1="18"
                            y1="44"
                            x2="46"
                            y2="44"
                            stroke="#93c5fd"
                            strokeWidth="2"
                            className="flow-line"
                        />
                        <line
                            x1="46"
                            y1="44"
                            x2="32"
                            y2="18"
                            stroke="#93c5fd"
                            strokeWidth="2"
                            className="flow-line"
                        />

                        {/* Orbiting Spark */}
                        <g className="orbit-group">
                            <circle cx="32" cy="24" r="2" fill="#3b82f6" />
                        </g>

                        {/* Node 1: Top Leader */}
                        <g className="node-1">
                            <circle cx="32" cy="18" r="9" fill={primaryColor} />
                            <circle cx="32" cy="16" r="3.2" fill="white" />
                            <path
                                d="M26.5 24C27.5 21 29.5 20.5 32 20.5C34.5 20.5 36.5 21 37.5 24"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* Node 2: Bottom-Left Member */}
                        <g className="node-2">
                            <circle cx="18" cy="44" r="8" fill="#10b981" />
                            <circle cx="18" cy="42" r="2.8" fill="white" />
                            <path
                                d="M13 49C14 46.5 16 46 18 46C20 46 22 46.5 23 49"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </g>

                        {/* Node 3: Bottom-Right Member (Looking for You) */}
                        <g className="node-3">
                            <circle cx="46" cy="44" r="8" fill="#6366f1" />
                            <circle cx="46" cy="42" r="2.8" fill="white" />
                            <path
                                d="M41 49C42 46.5 44 46 46 46C48 46 50 46.5 51 49"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                            />
                        </g>
                    </svg>
                </div>
            );

        case 'sparkles':
            return (
                <div
                    className={`inline-flex items-center justify-center shrink-0 ${className}`}
                    style={{ width: dim, height: dim }}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full overflow-visible"
                    >
                        <style>{`
                            @keyframes sparklePulseMain {
                                0%, 100% { transform: scale(0.9) rotate(0deg); opacity: 0.9; }
                                50% { transform: scale(1.12) rotate(15deg); opacity: 1; }
                            }
                            @keyframes sparkleSatellite1 {
                                0%, 100% { transform: scale(0.5) translate(0, 0); opacity: 0.2; }
                                50% { transform: scale(1.1) translate(1px, -2px); opacity: 1; }
                            }
                            @keyframes sparkleSatellite2 {
                                0%, 100% { transform: scale(1.1) translate(0, 0); opacity: 0.9; }
                                50% { transform: scale(0.5) translate(-1px, 2px); opacity: 0.3; }
                            }
                            .main-sparkle { animation: sparklePulseMain 2.6s ease-in-out infinite; transform-origin: 32px 32px; }
                            .sat-1 { animation: sparkleSatellite1 2.1s ease-in-out infinite 0.4s; transform-origin: 48px 18px; }
                            .sat-2 { animation: sparkleSatellite2 2.4s ease-in-out infinite 0.8s; transform-origin: 16px 46px; }
                        `}</style>
                        {/* Glow halo */}
                        <circle cx="32" cy="32" r="16" fill={primaryColor} fillOpacity="0.12" />

                        {/* Main Center 4-Point Star */}
                        <g className="main-sparkle">
                            <path
                                d="M32 14C32 24 24 32 14 32C24 32 32 40 32 50C32 40 40 32 50 32C40 32 32 24 32 14Z"
                                fill={primaryColor}
                            />
                            <path
                                d="M32 22C32 28 28 32 22 32C28 32 32 36 32 42C32 36 36 32 42 32C36 32 32 28 32 22Z"
                                fill="#93c5fd"
                            />
                        </g>

                        {/* Top-Right Small Star */}
                        <g className="sat-1">
                            <path
                                d="M48 12C48 16 44 19 40 19C44 19 48 22 48 26C48 22 52 19 56 19C52 19 48 16 48 12Z"
                                fill="#fbbf24"
                            />
                        </g>

                        {/* Bottom-Left Micro Star */}
                        <g className="sat-2">
                            <path
                                d="M16 42C16 45 13 47 10 47C13 47 16 49 16 52C16 49 19 47 22 47C19 47 16 45 16 42Z"
                                fill={accentColor}
                            />
                        </g>
                    </svg>
                </div>
            );

        case 'folder':
            return (
                <div
                    className={`inline-flex items-center justify-center shrink-0 ${className}`}
                    style={{ width: dim, height: dim }}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full overflow-visible"
                    >
                        <style>{`
                            @keyframes docSlide {
                                0%, 100% { transform: translateY(0); }
                                50% { transform: translateY(-4px); }
                            }
                            @keyframes folderPulse {
                                0%, 100% { transform: scale(1); }
                                50% { transform: scale(1.02); }
                            }
                            .doc-card { animation: docSlide 3s ease-in-out infinite; }
                            .folder-front { animation: folderPulse 3s ease-in-out infinite; transform-origin: 32px 42px; }
                        `}</style>
                        {/* Folder Back */}
                        <path
                            d="M12 22C12 20 13.5 18 15.5 18H25L29 22H48.5C50.5 22 52 23.5 52 25.5V46C52 48 50.5 50 48.5 50H15.5C13.5 50 12 48 12 46V22Z"
                            fill="#94a3b8"
                        />

                        {/* Document Sheets popping up */}
                        <g className="doc-card">
                            <rect
                                x="19"
                                y="14"
                                width="26"
                                height="22"
                                rx="3"
                                fill="white"
                                stroke="#e2e8f0"
                                strokeWidth="1"
                            />
                            {/* Lines on Doc */}
                            <line x1="23" y1="19" x2="33" y2="19" stroke={primaryColor} strokeWidth="2" strokeLinecap="round" />
                            <line x1="23" y1="24" x2="39" y2="24" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="23" y1="28" x2="36" y2="28" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                        </g>

                        {/* Folder Front Cover */}
                        <path
                            className="folder-front"
                            d="M11 28C11 26 12.5 25 14.5 25H49.5C51.5 25 53 26 53 28L51 47C51 49 49.5 51 47.5 51H16.5C14.5 51 13 49 13 47L11 28Z"
                            fill={primaryColor}
                        />
                    </svg>
                </div>
            );

        case 'clock':
            return (
                <div
                    className={`inline-flex items-center justify-center shrink-0 ${className}`}
                    style={{ width: dim, height: dim }}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full overflow-visible"
                    >
                        <style>{`
                            @keyframes clockRotate {
                                0% { transform: rotate(0deg); }
                                100% { transform: rotate(360deg); }
                            }
                            @keyframes clockPulseRing {
                                0%, 100% { transform: scale(1); opacity: 0.2; }
                                50% { transform: scale(1.08); opacity: 0.5; }
                            }
                            .second-hand { animation: clockRotate 6s linear infinite; transform-origin: 32px 32px; }
                            .hour-hand { animation: clockRotate 48s linear infinite; transform-origin: 32px 32px; }
                            .clock-aura { animation: clockPulseRing 2.4s ease-in-out infinite; transform-origin: 32px 32px; }
                        `}</style>
                        {/* Outer Glow Halo */}
                        <circle cx="32" cy="32" r="24" fill={primaryColor} className="clock-aura" />

                        {/* Clock Case */}
                        <circle
                            cx="32"
                            cy="32"
                            r="20"
                            fill="white"
                            stroke={primaryColor}
                            strokeWidth="3"
                        />

                        {/* 12, 3, 6, 9 Tick Marks */}
                        <rect x="31" y="16" width="2" height="4" rx="1" fill="#94a3b8" />
                        <rect x="44" y="31" width="4" height="2" rx="1" fill="#94a3b8" />
                        <rect x="31" y="44" width="2" height="4" rx="1" fill="#94a3b8" />
                        <rect x="16" y="31" width="4" height="2" rx="1" fill="#94a3b8" />

                        {/* Hour Hand */}
                        <line
                            x1="32"
                            y1="32"
                            x2="38"
                            y2="28"
                            stroke="#1e293b"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            className="hour-hand"
                        />

                        {/* Minute/Second Hand */}
                        <line
                            x1="32"
                            y1="32"
                            x2="32"
                            y2="20"
                            stroke="#ef4444"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            className="second-hand"
                        />

                        {/* Center Pin */}
                        <circle cx="32" cy="32" r="2.5" fill="#1e293b" />
                        <circle cx="32" cy="32" r="1" fill="#ef4444" />
                    </svg>
                </div>
            );

        case 'target':
            return (
                <div
                    className={`inline-flex items-center justify-center shrink-0 ${className}`}
                    style={{ width: dim, height: dim }}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full overflow-visible"
                    >
                        <style>{`
                            @keyframes targetRingScale {
                                0%, 100% { transform: scale(1); opacity: 0.8; }
                                50% { transform: scale(1.06); opacity: 1; }
                            }
                            @keyframes bullseyePing {
                                0% { r: 4px; opacity: 1; }
                                100% { r: 12px; opacity: 0; }
                            }
                            .ring-outer { animation: targetRingScale 2.8s ease-in-out infinite; transform-origin: 32px 32px; }
                            .ping-dot { animation: bullseyePing 1.8s ease-out infinite; }
                        `}</style>
                        <circle
                            cx="32"
                            cy="32"
                            r="22"
                            stroke="#e2e8f0"
                            strokeWidth="2"
                            fill="none"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="16"
                            stroke={accentColor}
                            strokeWidth="2.5"
                            fill="none"
                            className="ring-outer"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="10"
                            stroke={primaryColor}
                            strokeWidth="3"
                            fill="#eff6ff"
                        />
                        <circle
                            cx="32"
                            cy="32"
                            r="4"
                            fill="#ef4444"
                            className="ping-dot"
                        />
                        <circle cx="32" cy="32" r="4" fill="#ef4444" />
                    </svg>
                </div>
            );

        case 'check':
            return (
                <div
                    className={`inline-flex items-center justify-center shrink-0 ${className}`}
                    style={{ width: dim, height: dim }}
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 64 64"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full overflow-visible"
                    >
                        <style>{`
                            @keyframes checkDraw {
                                0% { stroke-dashoffset: 30; }
                                100% { stroke-dashoffset: 0; }
                            }
                            @keyframes circleExpand {
                                0% { transform: scale(0.85); opacity: 0.7; }
                                50% { transform: scale(1.04); opacity: 1; }
                                100% { transform: scale(1); opacity: 1; }
                            }
                            .check-path { stroke-dasharray: 30; animation: checkDraw 1.2s ease-out forwards; }
                            .check-circle { animation: circleExpand 1.6s ease-out; transform-origin: 32px 32px; }
                        `}</style>
                        <circle
                            cx="32"
                            cy="32"
                            r="22"
                            fill="#ecfdf5"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            className="check-circle"
                        />
                        <path
                            d="M22 32L28 38L42 24"
                            stroke="#10b981"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="check-path"
                        />
                    </svg>
                </div>
            );

        default:
            return null;
    }
}
