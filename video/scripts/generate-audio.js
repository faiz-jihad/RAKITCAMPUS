// Script to generate high quality cinematic audio assets for Remotion promo video
// Pure Node.js - No external dependencies required

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function createWavBuffer(numChannels, sampleRate, samples) {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const numFrames = samples.length / numChannels;
  const dataSize = numFrames * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // Bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    let s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7fff;
    buffer.writeInt16LE(Math.round(intSample), offset);
    offset += 2;
  }

  return buffer;
}

const outDir = path.join(__dirname, '../public/audio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Generate bass-drop.wav (2.5 seconds, stereo)
{
  const duration = 2.5;
  const totalFrames = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalFrames * 2);

  for (let i = 0; i < totalFrames; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Pitch envelope: sweeps from 110Hz down to 36Hz
    const freq = 110 * Math.exp(-progress * 2.8) + 36;
    const phase = 2 * Math.PI * (110 * (1 - Math.exp(-progress * 2.8)) / 2.8 + 36 * t);
    
    // Sub oscillator + second harmonic for warmth
    const sub = Math.sin(phase);
    const warm = 0.25 * Math.sin(phase * 2);
    
    // Initial transient punch
    const punch = Math.exp(-t * 28) * (Math.random() * 0.15 + Math.sin(2 * Math.PI * 180 * t) * 0.35);

    // Amplitude decay envelope
    const env = Math.exp(-progress * 2.2) * (1 - Math.exp(-t * 60));
    const val = (sub * 0.75 + warm + punch) * env * 0.85;

    samples[i * 2] = val;     // Left
    samples[i * 2 + 1] = val; // Right
  }

  fs.writeFileSync(path.join(outDir, 'bass-drop.wav'), createWavBuffer(2, SAMPLE_RATE, samples));
  console.log('Generated bass-drop.wav');
}

// 2. Generate whoosh.wav (0.75 seconds, stereo with dynamic pan)
{
  const duration = 0.75;
  const totalFrames = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalFrames * 2);

  let filterStateL = 0;
  let filterStateR = 0;

  for (let i = 0; i < totalFrames; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Gaussian bell envelope
    const env = Math.exp(-Math.pow((progress - 0.45) / 0.22, 2));
    
    // Dynamic filter cutoff sweeping up then down
    const cutoff = 400 + 2200 * Math.sin(progress * Math.PI);
    const alpha = Math.min(0.9, (2 * Math.PI * cutoff) / SAMPLE_RATE);

    const whiteNoiseL = (Math.random() * 2 - 1);
    const whiteNoiseR = (Math.random() * 2 - 1);

    filterStateL += alpha * (whiteNoiseL - filterStateL);
    filterStateR += alpha * (whiteNoiseR - filterStateR);

    // Smooth stereo pan from left to right
    const panL = Math.cos(progress * Math.PI * 0.5);
    const panR = Math.sin(progress * Math.PI * 0.5);

    samples[i * 2] = filterStateL * env * panL * 0.55;
    samples[i * 2 + 1] = filterStateR * env * panR * 0.55;
  }

  fs.writeFileSync(path.join(outDir, 'whoosh.wav'), createWavBuffer(2, SAMPLE_RATE, samples));
  console.log('Generated whoosh.wav');
}

// 3. Generate riser.wav (3.2 seconds, stereo)
{
  const duration = 3.2;
  const totalFrames = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalFrames * 2);

  let phase = 0;
  let noiseState = 0;

  for (let i = 0; i < totalFrames; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;

    // Rising frequency curve from 120Hz to 880Hz
    const freq = 120 + 760 * Math.pow(progress, 2.2);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;

    // Amplitude builds exponentially with small modulation
    const lfo = 1 + 0.15 * Math.sin(2 * Math.PI * (4 + 12 * progress) * t);
    const env = Math.pow(progress, 1.8) * lfo;

    // Rising noise element
    const cutoff = 300 + 4000 * Math.pow(progress, 2);
    const alpha = (2 * Math.PI * cutoff) / SAMPLE_RATE;
    const rawNoise = Math.random() * 2 - 1;
    noiseState += alpha * (rawNoise - noiseState);

    const tonal = Math.sin(phase) + 0.3 * Math.sin(phase * 2);
    const mixed = (tonal * 0.6 + noiseState * 0.4) * env * 0.65;

    // Stereo widening towards the end
    const spread = progress * 0.4;
    samples[i * 2] = mixed * (1 - spread);
    samples[i * 2 + 1] = mixed * (1 + spread);
  }

  fs.writeFileSync(path.join(outDir, 'riser.wav'), createWavBuffer(2, SAMPLE_RATE, samples));
  console.log('Generated riser.wav');
}

// 4. Generate ambient-bed.wav (95 seconds, stereo cinematic score)
{
  const duration = 95.0;
  const totalFrames = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(totalFrames * 2);

  // Chord progression: Am (A2, C3, E3, B3) -> Fmaj7 (F2, C3, E3, A3) -> Cmaj (C3, G3, D4, E4) -> Gsus (G2, D3, G3, B3)
  // Base frequencies (Hz)
  const chords = [
    [110.00, 164.81, 220.00, 261.63, 329.63, 493.88], // Am9
    [87.31, 130.81, 174.61, 261.63, 329.63, 440.00],  // Fmaj7
    [130.81, 196.00, 261.63, 293.66, 329.63, 392.00], // Cadd9
    [98.00, 146.83, 196.00, 246.94, 293.66, 392.00],  // G/B
  ];

  const chordDuration = 12.0; // 12 seconds per chord
  const phases = new Float64Array(16);

  for (let i = 0; i < totalFrames; i++) {
    const t = i / SAMPLE_RATE;
    const chordIndex = Math.floor(t / chordDuration) % chords.length;
    const nextChordIndex = (chordIndex + 1) % chords.length;
    const chordProgress = (t % chordDuration) / chordDuration;
    const crossfade = 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, (chordProgress - 0.75) / 0.25)));

    const activeChordA = chords[chordIndex];
    const activeChordB = chords[nextChordIndex];

    let left = 0;
    let right = 0;

    // Macro structural energy envelope
    // 0-7s: quiet suspense (0.35)
    // 7-18s: building curiosity (0.50)
    // 18-28s: reveal impact & breath (0.80)
    // 28-58s: pulsing product showcase (0.90)
    // 58-73s: soaring emotional value (0.95)
    // 73-90s: triumphant closure & graceful fade (0.75 -> 0.0)
    let macroEnergy = 0.4;
    if (t < 7) {
      macroEnergy = 0.35 + 0.15 * (t / 7);
    } else if (t < 18) {
      macroEnergy = 0.50 + 0.25 * ((t - 7) / 11);
    } else if (t < 28) {
      macroEnergy = 0.75 + 0.10 * Math.sin(((t - 18) / 10) * Math.PI);
    } else if (t < 58) {
      macroEnergy = 0.85 + 0.05 * Math.sin(t * 0.8);
    } else if (t < 75) {
      macroEnergy = 0.95;
    } else {
      const fadeProgress = (t - 75) / (duration - 75);
      macroEnergy = Math.max(0, 0.95 * Math.pow(1 - fadeProgress, 1.8));
    }

    // Gentle rhythmic pulse (120 BPM = 2 Hz, subtle tech syncopation)
    const techPulse = t > 26 ? (1 + 0.08 * Math.sin(2 * Math.PI * 2.0 * t)) : 1.0;

    // Synthesize oscillators across voices
    const numVoices = 6;
    for (let v = 0; v < numVoices; v++) {
      const freqA = activeChordA[v];
      const freqB = activeChordB[v];
      const freq = freqA * (1 - crossfade) + freqB * crossfade;

      // Gentle detune for analog warmth
      const detuneL = 1.0008;
      const detuneR = 0.9992;

      phases[v * 2] = (phases[v * 2] || 0) + (2 * Math.PI * freq * detuneL) / SAMPLE_RATE;
      phases[v * 2 + 1] = (phases[v * 2 + 1] || 0) + (2 * Math.PI * freq * detuneR) / SAMPLE_RATE;

      const oscL = Math.sin(phases[v * 2]) + 0.25 * Math.sin(phases[v * 2] * 2) + 0.08 * Math.sin(phases[v * 2] * 3);
      const oscR = Math.sin(phases[v * 2 + 1]) + 0.25 * Math.sin(phases[v * 2 + 1] * 2) + 0.08 * Math.sin(phases[v * 2 + 1] * 3);

      // Low frequency modulation per voice
      const lfo = 0.85 + 0.15 * Math.sin(t * 0.4 + v);
      const voiceWeight = v === 0 ? 0.35 : (0.6 / (v * 0.7 + 1));

      left += oscL * voiceWeight * lfo;
      right += oscR * voiceWeight * lfo;
    }

    // Subtle warm vinyl / tape hiss for high-end cinematic texture
    const tapeAir = (Math.random() * 2 - 1) * 0.012;

    const masterGain = 0.26 * macroEnergy * techPulse;
    samples[i * 2] = (left * masterGain + tapeAir);
    samples[i * 2 + 1] = (right * masterGain + tapeAir);
  }

  fs.writeFileSync(path.join(outDir, 'ambient-bed.wav'), createWavBuffer(2, SAMPLE_RATE, samples));
  console.log('Generated ambient-bed.wav (95s, stereo)');
}

console.log('All cinematic audio assets generated successfully.');
