import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { BrowserFrame } from '../components/BrowserFrame';
import { theme } from '../theme';
import { SceneProps } from '../types';

export const Scene04ProductDemo: React.FC<SceneProps> = ({ isPortrait = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 4 Features, each 225 frames
  // Feature 1: 0 - 225
  // Feature 2: 225 - 450
  // Feature 3: 450 - 675
  // Feature 4: 675 - 900

  const activeFeatureIndex = Math.min(3, Math.floor(frame / 225));
  const featureLocalFrame = frame % 225;

  const features = [
    {
      badge: 'EXPLORE & DISCOVER',
      title: 'Unified Opportunity Hub',
      desc: 'Explore curated student competitions, hackathons, and research projects nationwide.',
      screenshot: 'screenshots/landing-hero.png',
      url: 'https://rakitcampus.my.id',
      accent: theme.colors.primary,
    },
    {
      badge: 'VERIFIED COMPETITIONS',
      title: 'Verified Tracks & Guidelines',
      desc: 'Instant access to rules, prize pools, submission dates, and official problem briefs.',
      screenshot: 'screenshots/competition-hub.png',
      url: 'https://rakitcampus.my.id/competitions',
      accent: theme.colors.accentCyan,
    },
    {
      badge: 'TEAM MATCHMAKING',
      title: 'Complementary Team Building',
      desc: 'Find the missing developer, UI/UX designer, or strategist for your competition team.',
      screenshot: 'screenshots/team-recruitment.png',
      url: 'https://rakitcampus.my.id/recruitment',
      accent: theme.colors.accentViolet,
    },
    {
      badge: 'EXECUTION WORKSPACE',
      title: 'Live Workspace & Deliverables',
      desc: 'Pessimistic concurrency-safe Kanban board with KPI pulse strip and mentor reviews.',
      screenshot: 'screenshots/workspace-kpi.png',
      url: 'https://rakitcampus.my.id/competition-workspace',
      accent: theme.colors.accentEmerald,
    },
  ];

  const current = features[activeFeatureIndex];

  // Smooth entrance spring for each feature step
  const stepSpring = spring({
    frame: featureLocalFrame,
    fps,
    config: { damping: 15, stiffness: 85 },
  });

  // Crossfade between feature steps (15 frames fade)
  const fadeIn = interpolate(featureLocalFrame, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOut = interpolate(featureLocalFrame, [205, 225], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const featureOpacity = fadeIn * fadeOut;

  // Gentle 3D perspective / camera tilt
  const rotateX = interpolate(stepSpring, [0, 1], [6, 2]);
  const scale = interpolate(stepSpring, [0, 1], [0.94, 1]);
  const translateY = interpolate(stepSpring, [0, 1], [30, 0]);

  // Subtle continuous scroll simulation across the screenshot
  const simulatedScrollY = interpolate(featureLocalFrame, [0, 225], [0, 90]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: isPortrait ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isPortrait ? '40px 30px' : '50px 70px',
        overflow: 'hidden',
      }}
    >
      <Background accentColor={current.accent} gridOpacity={0.05} glowPosition="center" />

      {/* Top Feature Step Progress Bar */}
      <div
        style={{
          position: 'absolute',
          top: isPortrait ? 30 : 40,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 12,
          zIndex: 10,
        }}
      >
        {features.map((item, idx) => {
          const isActive = idx === activeFeatureIndex;
          const isDone = idx < activeFeatureIndex;
          let progressWidth = 0;
          if (isDone) progressWidth = 100;
          if (isActive) progressWidth = (featureLocalFrame / 225) * 100;

          return (
            <div
              key={item.badge}
              style={{
                width: isPortrait ? 60 : 100,
                height: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progressWidth}%`,
                  backgroundColor: current.accent,
                  boxShadow: `0 0 10px ${current.accent}`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Left/Top Content Column: Feature Info */}
      <div
        style={{
          flex: isPortrait ? 'none' : '0 0 460px',
          width: isPortrait ? '100%' : 460,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: featureOpacity,
          zIndex: 5,
          marginBottom: isPortrait ? 24 : 0,
          marginRight: isPortrait ? 0 : 50,
        }}
      >
        {/* Category Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: theme.borderRadius.full,
            backgroundColor: `${current.accent}1A`,
            border: `1px solid ${current.accent}4D`,
            alignSelf: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: current.accent,
              boxShadow: `0 0 8px ${current.accent}`,
            }}
          />
          <span
            style={{
              fontFamily: theme.typography.fontFamily,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: current.accent,
            }}
          >
            {current.badge}
          </span>
        </div>

        {/* Feature Title */}
        <h2
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: isPortrait ? 38 : 46,
            fontWeight: 800,
            color: theme.colors.textHeadline,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            margin: '0 0 16px 0',
          }}
        >
          {current.title}
        </h2>

        {/* Feature Description */}
        <p
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: isPortrait ? 18 : 20,
            fontWeight: 400,
            color: theme.colors.textSecondary,
            lineHeight: 1.55,
            margin: '0 0 24px 0',
          }}
        >
          {current.desc}
        </p>

        {/* Feature Benefit Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 18px',
            borderRadius: theme.borderRadius.md,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10B981',
            }}
          />
          <span
            style={{
              fontFamily: theme.typography.mono,
              fontSize: 13,
              color: theme.colors.textSecondary,
            }}
          >
            Live production interface • rakitcampus.my.id
          </span>
        </div>
      </div>

      {/* Right/Bottom Content Column: Authentic Product Browser Mockup */}
      <div
        style={{
          flex: 1,
          width: '100%',
          height: isPortrait ? 520 : 660,
          perspective: 1400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: featureOpacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          zIndex: 4,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            transform: `rotateX(${rotateX}deg) rotateY(-2deg)`,
            transformStyle: 'preserve-3d',
            transition: 'transform 0.2s ease-out',
          }}
        >
          <BrowserFrame
            screenshot={current.screenshot}
            url={current.url}
            glowColor={current.accent}
            scrollY={simulatedScrollY}
          />
        </div>
      </div>
    </div>
  );
};
