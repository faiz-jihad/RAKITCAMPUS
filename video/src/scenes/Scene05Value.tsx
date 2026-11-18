import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { theme } from '../theme';
import { SceneProps } from '../types';

export const Scene05Value: React.FC<SceneProps> = ({ isPortrait = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 3 Value Pillars (every 110 frames)
  const pillars = [
    {
      num: '01',
      title: 'Discover opportunities.',
      subtitle: 'Never miss a hackathon, competition, or student grant that matches your skills.',
      color: theme.colors.primary,
    },
    {
      num: '02',
      title: 'Build something meaningful.',
      subtitle: 'Collaborate with complementary peers who share your drive and standards.',
      color: theme.colors.accentCyan,
    },
    {
      num: '03',
      title: 'Turn ambition into action.',
      subtitle: 'From initial team brainstorm to final deliverable submission on a single workspace.',
      color: theme.colors.accentEmerald,
    },
  ];

  // Camera scale
  const cameraScale = interpolate(frame, [0, 450], [0.98, 1.05], {
    extrapolateRight: 'clamp',
  });

  // Outgoing fade
  const exitOpacity = interpolate(frame, [410, 450], [1, 0], {
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
        padding: isPortrait ? '40px 30px' : '60px 80px',
        opacity: exitOpacity,
        transform: `scale(${cameraScale})`,
        overflow: 'hidden',
      }}
    >
      <Background accentColor="#059669" gridOpacity={0.05} glowPosition="center" />

      {/* Pill Eyebrow */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 22px',
          borderRadius: theme.borderRadius.full,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          marginBottom: 32,
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 10px #10B981',
          }}
        />
        <span
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: isPortrait ? 15 : 14,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#34D399',
          }}
        >
          The Ecosystem Difference
        </span>
      </div>

      {/* 3 Staggered Value Statements */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: isPortrait ? 24 : 32,
          width: '100%',
          maxWidth: isPortrait ? 800 : 1100,
          zIndex: 2,
        }}
      >
        {pillars.map((item, index) => {
          const itemSpring = spring({
            frame: frame - index * 35,
            fps,
            config: { damping: 14, stiffness: 90 },
          });

          const opacity = interpolate(itemSpring, [0, 1], [0, 1]);
          const translateX = interpolate(itemSpring, [0, 1], [-40, 0]);

          return (
            <div
              key={item.num}
              style={{
                display: 'flex',
                alignItems: isPortrait ? 'flex-start' : 'center',
                flexDirection: isPortrait ? 'column' : 'row',
                gap: isPortrait ? 12 : 36,
                padding: isPortrait ? '20px 24px' : '26px 36px',
                borderRadius: theme.borderRadius.xl,
                background: 'rgba(17, 24, 39, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(16px)',
                opacity,
                transform: `translateX(${translateX}px)`,
              }}
            >
              {/* Pillar Number */}
              <div
                style={{
                  fontFamily: theme.typography.mono,
                  fontSize: isPortrait ? 18 : 22,
                  fontWeight: 800,
                  color: item.color,
                  letterSpacing: '0.05em',
                  padding: '6px 14px',
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: `${item.color}15`,
                  border: `1px solid ${item.color}30`,
                }}
              >
                {item.num}
              </div>

              {/* Title & Subtitle */}
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: isPortrait ? 30 : 36,
                    fontWeight: 800,
                    color: theme.colors.textHeadline,
                    letterSpacing: '-0.03em',
                    margin: '0 0 6px 0',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: isPortrait ? 16 : 18,
                    fontWeight: 400,
                    color: theme.colors.textSecondary,
                    margin: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
