import React from 'react';
import { theme } from '../theme';

interface LogoMarkProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  glow?: boolean;
}

export const LogoMark: React.FC<LogoMarkProps> = ({
  size = 54,
  showText = true,
  textColor = theme.colors.textPrimary,
  glow = true,
}) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.32,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      {/* Precision Geometric Logo Icon */}
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {glow && (
          <div
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: theme.borderRadius.lg,
              background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
              filter: 'blur(10px)',
              opacity: 0.65,
            }}
          />
        )}
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* Rounded Squircle Container */}
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill="#0F172A"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="3"
          />
          {/* Interlocking Pillars: "R" and Connected Nodes */}
          <path
            d="M32 26V74M32 26H54C62.8366 26 70 33.1634 70 42C70 50.8366 62.8366 58 54 58H32M52 58L68 74"
            stroke="url(#rakit_gradient)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Futuristic Connecting Dot */}
          <circle cx="68" cy="42" r="5" fill="#60A5FA" />
          <defs>
            <linearGradient
              id="rakit_gradient"
              x1="32"
              y1="26"
              x2="70"
              y2="74"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#60A5FA" />
              <stop offset="0.5" stopColor="#3B82F6" />
              <stop offset="1" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: size * 0.68,
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: textColor,
            }}
          >
            RAKIT
          </span>
          <span
            style={{
              fontSize: size * 0.22,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: theme.colors.primary,
              marginTop: 4,
            }}
          >
            Campus
          </span>
        </div>
      )}
    </div>
  );
};
