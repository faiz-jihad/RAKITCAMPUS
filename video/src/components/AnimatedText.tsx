import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { theme } from '../theme';

interface AnimatedTextProps {
  text: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: string;
  color?: string;
  lineHeight?: number | string;
  style?: React.CSSProperties;
  staggerWords?: boolean;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  delay = 0,
  fontSize = 48,
  fontWeight = 700,
  letterSpacing = '-0.03em',
  color = theme.colors.textHeadline,
  lineHeight = 1.15,
  style = {},
  staggerWords = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!staggerWords) {
    const entrance = spring({
      frame: frame - delay,
      fps,
      config: { damping: 14, stiffness: 90 },
    });

    const translateY = interpolate(entrance, [0, 1], [30, 0]);
    const opacity = interpolate(entrance, [0, 1], [0, 1]);

    return (
      <div
        style={{
          fontFamily: theme.typography.fontFamily,
          fontSize,
          fontWeight,
          letterSpacing,
          color,
          lineHeight,
          opacity,
          transform: `translateY(${translateY}px)`,
          ...style,
        }}
      >
        {text}
      </div>
    );
  }

  const words = text.split(' ');

  return (
    <div
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: `${fontSize * 0.28}px`,
        fontFamily: theme.typography.fontFamily,
        fontSize,
        fontWeight,
        letterSpacing,
        color,
        lineHeight,
        ...style,
      }}
    >
      {words.map((word, index) => {
        const wordDelay = delay + index * 4;
        const progress = spring({
          frame: frame - wordDelay,
          fps,
          config: { damping: 14, stiffness: 100 },
        });

        const translateY = interpolate(progress, [0, 1], [28, 0]);
        const opacity = interpolate(progress, [0, 1], [0, 1]);

        return (
          <span
            key={`${word}-${index}`}
            style={{
              display: 'inline-block',
              opacity,
              transform: `translateY(${translateY}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
