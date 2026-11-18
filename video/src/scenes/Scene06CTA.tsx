import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { LogoMark } from '../components/LogoMark';
import { AnimatedText } from '../components/AnimatedText';
import { theme } from '../theme';
import { SceneProps } from '../types';

export const Scene06CTA: React.FC<SceneProps> = ({ isPortrait = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance springs
  const logoSpring = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, stiffness: 85 },
  });
  const logoScale = interpolate(logoSpring, [0, 1], [0.8, 1]);
  const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

  const ctaSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 13, stiffness: 90 },
  });
  const ctaY = interpolate(ctaSpring, [0, 1], [25, 0]);
  const ctaOpacity = interpolate(ctaSpring, [0, 1], [0, 1]);

  const buttonSpring = spring({
    frame: frame - 55,
    fps,
    config: { damping: 12, stiffness: 95 },
  });
  const buttonScale = interpolate(buttonSpring, [0, 1], [0.9, 1]);
  const buttonOpacity = interpolate(buttonSpring, [0, 1], [0, 1]);

  // Gentle pulse on the URL button
  const pulse = interpolate(Math.sin((frame - 60) / 18), [-1, 1], [1, 1.03]);

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
        padding: isPortrait ? '40px 30px' : '40px 60px',
        overflow: 'hidden',
      }}
    >
      <Background accentColor="#3B82F6" gridOpacity={0.06} glowPosition="center" />

      {/* RAKIT Brand Mark */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: isPortrait ? 28 : 36,
          zIndex: 2,
        }}
      >
        <LogoMark size={isPortrait ? 84 : 100} showText={true} glow={true} />
      </div>

      {/* Main Copy */}
      <div
        style={{
          maxWidth: isPortrait ? 850 : 1000,
          textAlign: 'center',
          zIndex: 2,
          marginBottom: 16,
        }}
      >
        <AnimatedText
          text="Your next move starts here."
          fontSize={isPortrait ? 56 : 74}
          fontWeight={900}
          letterSpacing="-0.04em"
          color={theme.colors.textHeadline}
          delay={15}
        />
      </div>

      {/* Secondary Copy */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          textAlign: 'center',
          maxWidth: 680,
          marginBottom: isPortrait ? 36 : 44,
          zIndex: 2,
        }}
      >
        <p
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: isPortrait ? 22 : 26,
            fontWeight: 400,
            color: theme.colors.textSecondary,
            lineHeight: 1.45,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Explore verified competitions, find complementary peers, and launch your next project with confidence.
        </p>
      </div>

      {/* High-Impact Production URL Button Pill */}
      <div
        style={{
          opacity: buttonOpacity,
          transform: `scale(${buttonScale * pulse})`,
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 16,
            padding: isPortrait ? '16px 36px' : '18px 44px',
            borderRadius: theme.borderRadius.full,
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow:
              '0 20px 45px -10px rgba(37, 99, 235, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 12px #10B981',
            }}
          />
          <span
            style={{
              fontFamily: theme.typography.fontFamily,
              fontSize: isPortrait ? 22 : 24,
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            rakitcampus.my.id
          </span>
          <span
            style={{
              fontFamily: theme.typography.mono,
              fontSize: 14,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.7)',
              letterSpacing: '0.05em',
            }}
          >
            JOIN NOW
          </span>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div
        style={{
          position: 'absolute',
          bottom: isPortrait ? 30 : 36,
          fontFamily: theme.typography.fontFamily,
          fontSize: 13,
          color: theme.colors.textMuted,
          letterSpacing: '0.04em',
          zIndex: 2,
        }}
      >
        Built for Indonesian student innovators, hackathons, and research teams.
      </div>
    </div>
  );
};
