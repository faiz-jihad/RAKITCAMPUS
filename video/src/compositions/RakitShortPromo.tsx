import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { Scene01Hook } from '../scenes/Scene01Hook';
import { Scene03Reveal } from '../scenes/Scene03Reveal';
import { Scene04ProductDemo } from '../scenes/Scene04ProductDemo';
import { Scene06CTA } from '../scenes/Scene06CTA';
import { VideoProps } from '../types';

export const RakitShortPromo: React.FC<VideoProps> = () => {
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
      {/* Audio Layer: Cinematic Ambient Score */}
      <Audio src={staticFile('audio/ambient-bed.wav')} volume={0.8} />

      {/* Audio FX: Reveal Impact */}
      <Sequence from={120} durationInFrames={75}>
        <Audio src={staticFile('audio/bass-drop.wav')} volume={0.85} />
      </Sequence>

      {/* Audio FX: Transitions */}
      <Sequence from={240} durationInFrames={25}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.45} />
      </Sequence>
      <Sequence from={540} durationInFrames={25}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.45} />
      </Sequence>

      {/* Scene 1: The Hook (0 - 4s = 120 frames) */}
      <Sequence from={0} durationInFrames={120}>
        <Scene01Hook isPortrait={true} />
      </Sequence>

      {/* Scene 2: Brand Reveal (4 - 8s = 120 frames, frames 120 to 240) */}
      <Sequence from={120} durationInFrames={120}>
        <Scene03Reveal isPortrait={true} />
      </Sequence>

      {/* Scene 3: Rapid Product Showcase (8 - 18s = 300 frames, frames 240 to 540) */}
      <Sequence from={240} durationInFrames={300}>
        <Scene04ProductDemo isPortrait={true} />
      </Sequence>

      {/* Scene 4: Call to Action (18 - 25s = 210 frames, frames 540 to 750) */}
      <Sequence from={540} durationInFrames={210}>
        <Scene06CTA isPortrait={true} />
      </Sequence>
    </div>
  );
};
