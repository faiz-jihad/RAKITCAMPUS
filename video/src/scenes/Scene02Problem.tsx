import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { AnimatedText } from '../components/AnimatedText';
import { theme } from '../theme';
import { SceneProps } from '../types';

export const Scene02Problem: React.FC<SceneProps> = ({ isPortrait = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Camera slow pan & push
  const cameraScale = interpolate(frame, [0, 330], [0.98, 1.04], {
    extrapolateRight: 'clamp',
  });

  // Exit fade (frames 300-330)
  const exitOpacity = interpolate(frame, [300, 330], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Problem cards config
  const problemPoints = [
    {
      title: 'Scattered Information',
      desc: 'Competitions and hackathons hidden across dozens of unorganized channels.',
      tag: 'NO VERIFIED SOURCE',
      color: '#EF4444',
    },
    {
      title: 'Isolated Teams',
      desc: 'Brilliant minds searching for complementary developers, designers, and leads.',
      tag: 'ROLE MISMATCH',
      color: '#F59E0B',
    },
    {
      title: 'Execution Friction',
      desc: 'Projects stall without structured milestones, deliverable tracking, or feedback.',
      tag: 'LOST MOMENTUM',
      color: '#8B5CF6',
    },
  ];

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
        padding: isPortrait ? '40px 30px' : '40px 80px',
      }}
    >
      <Background accentColor="#3B82F6" gridOpacity={0.06} glowPosition="top" />

      {/* Pill Eyebrow */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 20px',
          borderRadius: theme.borderRadius.full,
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          marginBottom: 24,
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#EF4444',
            boxShadow: '0 0 10px #EF4444',
          }}
        />
        <span
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: isPortrait ? 16 : 14,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#F87171',
          }}
        >
          The Real Challenge
        </span>
      </div>

      {/* Main Headline */}
      <div
        style={{
          maxWidth: isPortrait ? 950 : 1100,
          textAlign: 'center',
          marginBottom: isPortrait ? 36 : 48,
          zIndex: 2,
        }}
      >
        <AnimatedText
          text="Great ideas exist everywhere. Connecting the dots is the hard part."
          fontSize={isPortrait ? 52 : 64}
          fontWeight={800}
          letterSpacing="-0.035em"
          lineHeight={1.15}
          color={theme.colors.textHeadline}
          delay={5}
        />
      </div>

      {/* Three Problem Friction Cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: isPortrait ? 'column' : 'row',
          gap: isPortrait ? 20 : 28,
          width: '100%',
          maxWidth: isPortrait ? 600 : 1240,
          justifyContent: 'center',
          alignItems: 'stretch',
          zIndex: 2,
        }}
      >
        {problemPoints.map((item, index) => {
          const cardSpring = spring({
            frame: frame - (30 + index * 18),
            fps,
            config: { damping: 14, stiffness: 95 },
          });

          const translateY = interpolate(cardSpring, [0, 1], [40, 0]);
          const opacity = interpolate(cardSpring, [0, 1], [0, 1]);
          const scale = interpolate(cardSpring, [0, 1], [0.92, 1]);

          return (
            <div
              key={item.title}
              style={{
                flex: 1,
                background: 'rgba(17, 24, 39, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: theme.borderRadius.xl,
                padding: isPortrait ? '24px 28px' : '32px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(16px)',
                opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
              }}
            >
              <div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: theme.borderRadius.sm,
                    background: `${item.color}18`,
                    border: `1px solid ${item.color}40`,
                    fontFamily: theme.typography.mono,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: item.color,
                    marginBottom: 16,
                  }}
                >
                  {item.tag}
                </div>

                <h3
                  style={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: isPortrait ? 26 : 24,
                    fontWeight: 700,
                    color: theme.colors.textHeadline,
                    margin: '0 0 12px 0',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: isPortrait ? 18 : 16,
                    fontWeight: 400,
                    color: theme.colors.textSecondary,
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </div>

              {/* Progress friction bar */}
              <div
                style={{
                  marginTop: 24,
                  height: 3,
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${interpolate(frame - (40 + index * 18), [0, 60], [0, 100], {
                      extrapolateLeft: 'clamp',
                      extrapolateRight: 'clamp',
                    })}%`,
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
