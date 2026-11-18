import React from 'react';
import { Audio, Sequence, staticFile } from 'remotion';
import { Scene01Hook } from '../scenes/Scene01Hook';
import { Scene02Problem } from '../scenes/Scene02Problem';
import { Scene03Reveal } from '../scenes/Scene03Reveal';
import { Scene04ProductDemo } from '../scenes/Scene04ProductDemo';
import { Scene05Value } from '../scenes/Scene05Value';
import { Scene06CTA } from '../scenes/Scene06CTA';
import { VideoProps } from '../types';

export const RakitFlagshipPromo: React.FC<VideoProps> = () => {
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
      <Audio
        src={staticFile('audio/ambient-bed.wav')}
        volume={0.72}
      />

      {/* Audio FX: Pre-reveal riser */}
      <Sequence from={450} durationInFrames={90}>
        <Audio src={staticFile('audio/riser.wav')} volume={0.65} />
      </Sequence>

      {/* Audio FX: Brand reveal impact hit */}
      <Sequence from={540} durationInFrames={75}>
        <Audio src={staticFile('audio/bass-drop.wav')} volume={0.85} />
      </Sequence>

      {/* Audio FX: Transitions */}
      <Sequence from={210} durationInFrames={25}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.4} />
      </Sequence>
      <Sequence from={840} durationInFrames={25}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.4} />
      </Sequence>
      <Sequence from={1740} durationInFrames={25}>
        <Audio src={staticFile('audio/whoosh.wav')} volume={0.4} />
      </Sequence>

      {/* SCENE 01 — THE HOOK (0 - 7s = 210 frames) */}
      <Sequence from={0} durationInFrames={210}>
        <Scene01Hook isPortrait={false} />
      </Sequence>

      {/* SCENE 02 — THE PROBLEM (7 - 18s = 330 frames, frames 210 to 540) */}
      <Sequence from={210} durationInFrames={330}>
        <Scene02Problem isPortrait={false} />
      </Sequence>

      {/* SCENE 03 — THE REVEAL (18 - 28s = 300 frames, frames 540 to 840) */}
      <Sequence from={540} durationInFrames={300}>
        <Scene03Reveal isPortrait={false} />
      </Sequence>

      {/* SCENE 04 — PRODUCT DEMONSTRATION (28 - 58s = 900 frames, frames 840 to 1740) */}
      <Sequence from={840} durationInFrames={900}>
        <Scene04ProductDemo isPortrait={false} />
      </Sequence>

      {/* SCENE 05 — THE VALUE (58 - 68s = 300 frames, frames 1740 to 2040) */}
      <Sequence from={1740} durationInFrames={300}>
        <Scene05Value isPortrait={false} />
      </Sequence>

      {/* SCENE 06 — CALL TO ACTION (68 - 75s = 210 frames, frames 2040 to 2250) */}
      <Sequence from={2040} durationInFrames={210}>
        <Scene06CTA isPortrait={false} />
      </Sequence>
    </div>
  );
};
