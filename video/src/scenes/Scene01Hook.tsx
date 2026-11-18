import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { AnimatedText } from '../components/AnimatedText';
import { theme } from '../theme';
import { SceneProps } from '../types';

export const Scene01Hook: React.FC<SceneProps> = ({ isPortrait = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for question
  const hookSpring = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });

  // Outgoing fade towards the end of scene (frame 180 to 210)
  const exitOpacity = interpolate(frame, [180, 210], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Scale dynamics: slow subtle push-in
  const cameraScale = interpolate(frame, [0, 210], [1, 1.05], {
    extrapolateRight: 'clamp',
  });

  // Subtitle reveal
  const subtitleSpring = spring({
    frame: frame - 45,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const subtitleOpacity = interpolate(subtitleSpring, [0, 1], [0, 1]);
  const subtitleY = interpolate(subtitleSpring, [0, 1], [25, 0]);

  // Pill badge entrance
  const badgeSpring = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0.8, 1]);
  const badgeOpacity = interpolate(badgeSpring, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: exitOpacity,
        transform: `scale(${cameraScale})`,
        overflow: 'hidden',
      }}
    >
      <Background accentColor="#1D4ED8" gridOpacity={0.05} glowPosition="center" />

      {/* Pill Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: isPortrait ? '8px 20px' : '10px 24px',
          borderRadius: theme.borderRadius.full,
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          marginBottom: isPortrait ? 32 : 40,
          opacity: badgeOpacity,
          transform: `scale(${badgeScale})`,
          backdropFilter: 'blur(10px)',
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: theme.colors.primary,
            boxShadow: `0 0 12px ${theme.colors.primary}`,
          }}
        />
        <span
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: isPortrait ? 18 : 16,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: theme.colors.textSecondary,
          }}
        >
          The Unanswered Question
        </span>
      </div>

      {/* Hero Provocative Question */}
      <div
        style={{
          maxWidth: isPortrait ? 900 : 1200,
          textAlign: 'center',
          padding: isPortrait ? '0 40px' : '0 60px',
          zIndex: 2,
        }}
      >
        <AnimatedText
          text="How many great ideas never become reality?"
          fontSize={isPortrait ? 68 : 84}
          fontWeight={800}
          letterSpacing="-0.04em"
          lineHeight={1.12}
          color={theme.colors.textHeadline}
          delay={10}
        />
      </div>

      {/* Supporting Subtitle */}
      <div
        style={{
          maxWidth: isPortrait ? 800 : 860,
          textAlign: 'center',
          marginTop: isPortrait ? 32 : 36,
          opacity: subtitleOpacity,
          transform: `translateY(${subtitleY}px)`,
          zIndex: 2,
        }}
      >
        <p
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: isPortrait ? 26 : 28,
            fontWeight: 400,
            lineHeight: 1.5,
            color: theme.colors.textSecondary,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Ambition is everywhere. But without the right ecosystem, potential stays locked.
        </p>
      </div>

      {/* Atmospheric Vignette Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at center, transparent 40%, rgba(11, 15, 25, 0.85) 100%)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />
    </div>
  );
};
