import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { theme } from '../theme';

interface BackgroundProps {
  accentColor?: string;
  gridOpacity?: number;
  glowPosition?: 'center' | 'top' | 'bottom' | 'split';
}

export const Background: React.FC<BackgroundProps> = ({
  accentColor = theme.colors.primary,
  gridOpacity = 0.04,
  glowPosition = 'center',
}) => {
  const frame = useCurrentFrame();

  // Subtle breathing glow animation
  const glowPulse = interpolate(
    Math.sin(frame / 25),
    [-1, 1],
    [0.75, 1.1],
    { extrapolateRight: 'clamp' }
  );

  const glowMoveY = interpolate(
    Math.sin(frame / 40),
    [-1, 1],
    [-20, 20],
    { extrapolateRight: 'clamp' }
  );

  let glowY = '50%';
  if (glowPosition === 'top') glowY = '25%';
  if (glowPosition === 'bottom') glowY = '75%';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: theme.colors.bg,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* Primary Atmospheric Ambient Radial Spot */}
      <div
        style={{
          position: 'absolute',
          top: `calc(${glowY} + ${glowMoveY}px)`,
          left: '50%',
          transform: `translate(-50%, -50%) scale(${glowPulse})`,
          width: 1400,
          height: 1000,
          background: `radial-gradient(ellipse at center, ${accentColor} 0%, rgba(37, 99, 235, 0.12) 35%, rgba(15, 23, 42, 0) 70%)`,
          opacity: 0.35,
          filter: 'blur(90px)',
        }}
      />

      {/* Secondary Cyan/Violet Subtle Edge Glow */}
      <div
        style={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: 700,
          height: 700,
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, rgba(15, 23, 42, 0) 65%)',
          filter: 'blur(100px)',
          opacity: 0.4,
        }}
      />

      {/* Precision Geometric Grid Lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, ${gridOpacity}) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, ${gridOpacity}) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          maskImage:
            'radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0.1) 90%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, rgba(0,0,0,1) 40%, rgba(0,0,0,0.1) 90%)',
        }}
      />

      {/* Subtle Top Border Glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '15%',
          right: '15%',
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
        }}
      />
    </div>
  );
};
