import React from 'react';
import { staticFile } from 'remotion';
import { theme } from '../theme';

interface BrowserFrameProps {
  screenshot: string;
  url?: string;
  width?: number | string;
  height?: number | string;
  scrollY?: number;
  highlightBadge?: string;
  glowColor?: string;
  style?: React.CSSProperties;
}

export const BrowserFrame: React.FC<BrowserFrameProps> = ({
  screenshot,
  url = 'https://rakitcampus.my.id',
  width = '100%',
  height = '100%',
  scrollY = 0,
  highlightBadge,
  glowColor = theme.colors.primary,
  style = {},
}) => {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: theme.borderRadius.xl,
        overflow: 'hidden',
        background: '#0F172A',
        boxShadow: `
          0 35px 80px -20px rgba(0, 0, 0, 0.85),
          0 0 0 1px rgba(255, 255, 255, 0.12),
          0 0 40px -10px ${glowColor}33
        `,
        ...style,
      }}
    >
      {/* Top Browser Header Bar */}
      <div
        style={{
          height: 48,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
          gap: 16,
          zIndex: 10,
        }}
      >
        {/* macOS Window Controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              opacity: 0.85,
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#F59E0B',
              opacity: 0.85,
            }}
          />
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#10B981',
              opacity: 0.85,
            }}
          />
        </div>

        {/* Browser URL Pill */}
        <div
          style={{
            flex: 1,
            maxWidth: 420,
            margin: '0 auto',
            height: 28,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: theme.borderRadius.full,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0 14px',
            fontSize: 12,
            fontFamily: theme.typography.mono,
            color: '#94A3B8',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={{ color: '#F1F5F9', fontWeight: 500 }}>{url}</span>
        </div>

        {/* Feature Tag / Badge */}
        {highlightBadge && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#60A5FA',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '3px 10px',
              borderRadius: theme.borderRadius.full,
            }}
          >
            {highlightBadge}
          </div>
        )}
      </div>

      {/* Browser Body with Screenshot */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#0B0F19',
        }}
      >
        <img
          src={
            screenshot.startsWith('screenshots/')
              ? staticFile(screenshot)
              : staticFile(`screenshots/${screenshot}`)
          }
          alt={highlightBadge || 'RAKIT Interface'}
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            transform: `translateY(-${scrollY}px)`,
            willChange: 'transform',
          }}
        />

        {/* Soft Bottom Shadow Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            boxShadow: 'inset 0 -40px 60px -20px rgba(11, 15, 25, 0.6)',
          }}
        />
      </div>
    </div>
  );
};
