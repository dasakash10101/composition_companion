import type { ChordCell } from './chartTypes';
// Namespace import: see KeyInput's earlier note on why - the shared package
// ships as a prebuilt CommonJS module, and importing individual named
// values from it can fail to bundle in production; importing the whole
// namespace always works.
import * as SharedTheory from '@modal-interchange/shared';

const { chordToneOffsets } = SharedTheory;

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    // Browsers require a user gesture to (re)start audio - this is always
    // called from a click/drop handler, so that requirement is satisfied.
    void audioContext.resume();
  }
  return audioContext;
}

function pitchClassToMidi(pitchClass: number, octave: number): number {
  return pitchClass + (octave + 1) * 12;
}

function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Plays a set of pitch classes (0-11) as a chord, using simple oscillators
 * with a short envelope - a dependency-free "synth" stand-in that needs no
 * audio files. Each successive tone is voiced into the next octave up so
 * the chord doesn't collapse into a muddy cluster.
 */
export function playChordTones(pitchClasses: number[], durationSeconds = 1.4): void {
  if (pitchClasses.length === 0) return;

  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.28, now + 0.015);
  master.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);
  master.connect(ctx.destination);

  let previousMidi = -Infinity;
  pitchClasses.forEach((pitchClass, i) => {
    let octave = 3;
    let midi = pitchClassToMidi(pitchClass, octave);
    while (midi <= previousMidi) {
      octave += 1;
      midi = pitchClassToMidi(pitchClass, octave);
    }
    previousMidi = midi;

    const osc = ctx.createOscillator();
    osc.type = i === 0 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(midiToFrequency(midi), now);

    const voiceGain = ctx.createGain();
    voiceGain.gain.value = i === 0 ? 1 : 0.6;

    osc.connect(voiceGain);
    voiceGain.connect(master);
    osc.start(now);
    osc.stop(now + durationSeconds + 0.1);
    osc.onended = () => {
      osc.disconnect();
      voiceGain.disconnect();
    };
  });

  setTimeout(() => master.disconnect(), (durationSeconds + 0.2) * 1000);
}

/** Plays a chord cell (from the table or a placed bar) using its quality + root pitch class. */
export function playChordCell(chord: ChordCell, durationSeconds = 1.4): void {
  const offsets = chordToneOffsets(chord.quality);
  const pitchClasses = offsets.map((offset) => ((chord.rootPitchClass + offset) % 12 + 12) % 12);
  playChordTones(pitchClasses, durationSeconds);
}
