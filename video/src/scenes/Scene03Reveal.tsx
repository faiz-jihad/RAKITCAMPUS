import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { LogoMark } from '../components/LogoMark';
import { AnimatedText } from '../components/AnimatedText';
import { theme } from '../theme';
import { SceneProps } from '../types';

export const Scene03Reveal: React.FC<SceneProps> = ({ isPortrait = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for logo reveal
  const logoSpring = spring({
    frame: frame - 10,
    fps,
    config: { damping: 13, stiffness: 85 },
  });

  const logoScale = interpolate(logoSpring, [0, 1], [0.65, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

  // Optical shockwave / energy ring expansion
  const shockwaveProgress = interpolate(frame, [10, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const shockwaveScale = interpolate(shockwaveProgress, [0, 1], [0.5, 3.2]);
  const shockwaveOpacity = interpolate(shockwaveProgress, [0, 0.3, 1], [0, 0.7, 0]);

  // Secondary text entrance
  const textSpring = spring({
    frame: frame - 40,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const textY = interpolate(textSpring, [0, 1], [30, 0]);
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);

  // Outgoing transition
  const exitOpacity = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
        overflow: 'hidden',
      }}
    >
      <Background accentColor="#2563EB" gridOpacity={0.07} glowPosition="center" />

      {/* Optical Shockwave Ring */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          border: '2px solid rgba(59, 130, 246, 0.6)',
          boxShadow: '0 0 40px rgba(59, 130, 246, 0.4)',
          transform: `scale(${shockwaveScale})`,
          opacity: shockwaveOpacity,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* Large Glowing Logo Mark */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: isPortrait ? 28 : 36,
          zIndex: 2,
        }}
      >
        <LogoMark size={isPortrait ? 88 : 108} showText={false} glow={true} />
      </div>

      {/* Bold Announcement Headline */}
      <div
        style={{
          textAlign: 'center',
          maxWidth: isPortrait ? 900 : 1200,
          padding: '0 30px',
          zIndex: 2,
        }}
      >
        <AnimatedText
          text="Meet RAKIT."
          fontSize={isPortrait ? 76 : 96}
          fontWeight={900}
          letterSpacing="-0.04em"
          color={theme.colors.textHeadline}
          delay={25}
        />
      </div>

      {/* Supporting Value Proposition */}
      <div
        style={{
          maxWidth: isPortrait ? 800 : 960,
          textAlign: 'center',
          marginTop: isPortrait ? 20 : 24,
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          zIndex: 2,
        }}
      >
        <h2
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: isPortrait ? 32 : 38,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #60A5FA 0%, #E2E8F0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em',
            margin: '0 0 16px 0',
          }}
        >
          One ecosystem. More possibilities.
        </h2>

        <p
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: isPortrait ? 20 : 22,
            fontWeight: 400,
            color: theme.colors.textSecondary,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          Connecting ambitious students, verified competitions, complementary teams, and real-time workspaces in one unified platform.
        </p>
      </div>

      {/* Futuristic Horizontal Precision Line */}
      <div
        style={{
          marginTop: isPortrait ? 36 : 48,
          width: interpolate(frame - 40, [0, 50], [0, isPortrait ? 280 : 420], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          height: 1,
          background:
            'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8), transparent)',
          zIndex: 2,
        }}
      />
    </div>
  );
};
