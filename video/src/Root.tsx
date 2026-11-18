import React from 'react';
import { Composition } from 'remotion';
import { RakitFlagshipPromo } from './compositions/RakitFlagshipPromo';
import { RakitShortPromo } from './compositions/RakitShortPromo';
import { RakitProductDemo } from './compositions/RakitProductDemo';

export const Root: React.FC = () => {
  return (
    <>
      {/* Deliverable A: Flagship Promotional Video (16:9, 75s @ 30fps = 2250 frames) */}
      <Composition
        id="RakitFlagshipPromo"
        component={RakitFlagshipPromo}
        durationInFrames={2250}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'RAKIT Campus',
          tagline: 'Your next big idea deserves somewhere to grow.',
          url: 'https://rakitcampus.my.id',
        }}
      />

      {/* Deliverable B: Short Promotional Video for Reels/Shorts/TikTok (9:16, 25s @ 30fps = 750 frames) */}
      <Composition
        id="RakitShortPromo"
        component={RakitShortPromo}
        durationInFrames={750}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          title: 'RAKIT Campus',
          tagline: 'One ecosystem. More possibilities.',
          url: 'https://rakitcampus.my.id',
        }}
      />

      {/* Deliverable C: In-Depth Product Demonstration Video (16:9, 90s @ 30fps = 2700 frames) */}
      <Composition
        id="RakitProductDemo"
        component={RakitProductDemo}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: 'RAKIT Campus Walkthrough',
          tagline: 'Explore real workflows from discovery to execution.',
          url: 'https://rakitcampus.my.id',
        }}
      />
    </>
  );
};
