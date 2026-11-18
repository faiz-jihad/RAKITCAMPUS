import React from 'react';
import { Audio, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Background } from '../components/Background';
import { BrowserFrame } from '../components/BrowserFrame';
import { LogoMark } from '../components/LogoMark';
import { Scene06CTA } from '../scenes/Scene06CTA';
import { theme } from '../theme';
import { VideoProps } from '../types';

// Step Component for deep walkthrough
const DemoWalkthroughStep: React.FC<{
  stepNumber: string;
  category: string;
  title: string;
  description: string;
  bulletPoints: string[];
  screenshot: string;
  url: string;
  accent: string;
}> = ({
  stepNumber,
  category,
  title,
  description,
  bulletPoints,
  screenshot,
  url,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 85 },
  });

  const contentY = interpolate(entrance, [0, 1], [30, 0]);
  const contentOpacity = interpolate(entrance, [0, 1], [0, 1]);
  const mockupScale = interpolate(entrance, [0, 1], [0.93, 1]);

  // Subtle continuous scroll simulation across the feature
  const scrollY = interpolate(frame, [0, 600], [0, 160]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '50px 80px',
        overflow: 'hidden',
      }}
    >
      <Background accentColor={accent} gridOpacity={0.05} glowPosition="center" />

      {/* Left Annotation Column */}
      <div
        style={{
          width: 500,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: contentOpacity,
          transform: `translateY(${contentY}px)`,
          zIndex: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span
            style={{
              fontFamily: theme.typography.mono,
              fontSize: 14,
              fontWeight: 800,
              color: accent,
              padding: '4px 12px',
              borderRadius: theme.borderRadius.sm,
              backgroundColor: `${accent}18`,
              border: `1px solid ${accent}40`,
            }}
          >
            MODULE {stepNumber}
          </span>
          <span
            style={{
              fontFamily: theme.typography.fontFamily,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: theme.colors.textMuted,
            }}
          >
            {category}
          </span>
        </div>

        <h2
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: 44,
            fontWeight: 800,
            color: theme.colors.textHeadline,
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            margin: '0 0 16px 0',
          }}
        >
          {title}
        </h2>

        <p
          style={{
            fontFamily: theme.typography.fontFamily,
            fontSize: 18,
            fontWeight: 400,
            color: theme.colors.textSecondary,
            lineHeight: 1.6,
            margin: '0 0 28px 0',
          }}
        >
          {description}
        </p>

        {/* Feature Checkpoints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bulletPoints.map((point) => (
            <div
              key={point}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                borderRadius: theme.borderRadius.md,
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: accent,
                  boxShadow: `0 0 8px ${accent}`,
                }}
              />
              <span
                style={{
                  fontFamily: theme.typography.fontFamily,
                  fontSize: 15,
                  fontWeight: 500,
                  color: theme.colors.textPrimary,
                }}
              >
                {point}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Product Screen Showcase */}
      <div
        style={{
          flex: 1,
          maxWidth: 1160,
          height: 700,
          marginLeft: 60,
          transform: `scale(${mockupScale})`,
          zIndex: 4,
        }}
      >
        <BrowserFrame
          screenshot={screenshot}
          url={url}
          glowColor={accent}
          scrollY={scrollY}
        />
      </div>
    </div>
  );
};

export const RakitProductDemo: React.FC<VideoProps> = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#0B0F19',
        overflow: 'hidden',
      }}
    >
      {/* Audio Layer */}
      <Audio src={staticFile('audio/ambient-bed.wav')} volume={0.7} />

      {/* Transition sounds */}
      <Sequence from={240} durationInFrames={25}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.35} />
      </Sequence>
      <Sequence from={840} durationInFrames={25}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.35} />
      </Sequence>
      <Sequence from={1440} durationInFrames={25}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.35} />
      </Sequence>
      <Sequence from={2040} durationInFrames={25}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.35} />
      </Sequence>

      {/* SEQUENCE 1: INTRO TITLE (0 - 8s = 240 frames) */}
      <Sequence from={0} durationInFrames={240}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Background accentColor="#3B82F6" gridOpacity={0.06} glowPosition="center" />
          <LogoMark size={96} showText={true} glow={true} />
          <h1
            style={{
              fontFamily: theme.typography.fontFamily,
              fontSize: 54,
              fontWeight: 800,
              color: theme.colors.textHeadline,
              letterSpacing: '-0.03em',
              marginTop: 36,
              marginBottom: 12,
            }}
          >
            Product Architecture & Deep Dive
          </h1>
          <p
            style={{
              fontFamily: theme.typography.fontFamily,
              fontSize: 22,
              color: theme.colors.textSecondary,
              maxWidth: 760,
              textAlign: 'center',
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            A comprehensive tour of RAKIT's authentic workflows: Opportunity Discovery, Verified Competitions, Team Matchmaking, and High-Concurrency Workspaces.
          </p>
        </div>
      </Sequence>

      {/* SEQUENCE 2: DISCOVERY HUB & BENTO (8 - 28s = 600 frames, 240 to 840) */}
      <Sequence from={240} durationInFrames={600}>
        <DemoWalkthroughStep
          stepNumber="01"
          category="EXPLORATION"
          title="Curated Opportunity Discovery"
          description="Browse campus competitions, national hackathons, and research incubators curated directly for student innovators."
          bulletPoints={[
            'Multi-faceted search and track categorization',
            'Bento layout for clear visual prioritization',
            'Real-time deadlines and registration badges',
          ]}
          screenshot="screenshots/landing-hero.png"
          url="https://rakitcampus.my.id"
          accent={theme.colors.primary}
        />
      </Sequence>

      {/* SEQUENCE 3: COMPETITION HUB (28 - 48s = 600 frames, 840 to 1440) */}
      <Sequence from={840} durationInFrames={600}>
        <DemoWalkthroughStep
          stepNumber="02"
          category="COMPETITIONS"
          title="Verified Competitions & Rulebooks"
          description="Access validated competitions with official rulebooks, team size constraints, and direct registration links without third-party noise."
          bulletPoints={[
            'Verified badges from official university & industry hosts',
            'Prize pool transparency and track criteria breakdown',
            'Instant 1-click team formation links',
          ]}
          screenshot="screenshots/competition-hub.png"
          url="https://rakitcampus.my.id/competitions"
          accent={theme.colors.accentCyan}
        />
      </Sequence>

      {/* SEQUENCE 4: TEAM MATCHMAKING (48 - 68s = 600 frames, 1440 to 2040) */}
      <Sequence from={1440} durationInFrames={600}>
        <DemoWalkthroughStep
          stepNumber="03"
          category="TEAM RECRUITMENT"
          title="Complementary Team Matching"
          description="Eliminate the friction of looking for teammates. Post openings by role (Frontend, Backend, AI/ML, UI/UX, Pitcher) or apply directly."
          bulletPoints={[
            'Skill and framework based candidate profiles',
            'Role vacancy cards with team chemistry indicators',
            'Seamless in-platform team invitation workflows',
          ]}
          screenshot="screenshots/team-recruitment.png"
          url="https://rakitcampus.my.id/recruitment"
          accent={theme.colors.accentViolet}
        />
      </Sequence>

      {/* SEQUENCE 5: WORKSPACE & DELIVERABLES (68 - 84s = 480 frames, 2040 to 2520) */}
      <Sequence from={2040} durationInFrames={480}>
        <DemoWalkthroughStep
          stepNumber="04"
          category="EXECUTION"
          title="Concurrency-Safe Team Workspace"
          description="Manage project execution with a live Kanban board, KPI pulse strip, and milestone deliverable submission backed by atomic database transactions."
          bulletPoints={[
            'Pessimistic concurrency locking for 200+ simultaneous users',
            'Task status drag-and-drop with real-time sprint metrics',
            'Deliverables checklist with mentor feedback loops',
          ]}
          screenshot="screenshots/workspace-kpi.png"
          url="https://rakitcampus.my.id/competition-workspace"
          accent={theme.colors.accentEmerald}
        />
      </Sequence>

      {/* SEQUENCE 6: CLOSING & GET STARTED (84 - 90s = 180 frames, 2520 to 2700) */}
      <Sequence from={2520} durationInFrames={180}>
        <Scene06CTA isPortrait={false} />
      </Sequence>
    </div>
  );
};
