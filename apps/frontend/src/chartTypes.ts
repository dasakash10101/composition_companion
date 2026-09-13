import type { ChordQuality } from '@modal-interchange/shared';

/** A chord as it's carried between the Modal Interchange table and the chart builder. */
export interface ChordCell {
  /** What to actually display in a bar - the real chord name when a key is set, else the roman numeral. */
  label: string;
  romanChordSymbol: string;
  chordName?: string;
  mode: string;
  degreeIndex: number;
  /** Chord quality (maj7, min7, ...) - needed to reconstruct actual notes for audio playback. */
  quality: ChordQuality;
  /** Absolute pitch class (0-11, 0 = C) of this chord's root - assumes a C tonic when no key is set. */
  rootPitchClass: number;
}

/** Custom drag MIME type for chord payloads (JSON-encoded ChordCell). */
export const CHORD_DRAG_MIME = 'application/x-modal-interchange-chord';

export const SECTION_KINDS = [
  'Intro',
  'Verse',
  'Pre-Chorus',
  'Chorus',
  'Bridge',
  'Solo',
  'Break',
  'Outro',
  'Custom',
] as const;

export type SectionKind = (typeof SECTION_KINDS)[number];

export const TIME_SIGNATURES = ['4/4', '3/4', '2/4', '6/8', '5/4', '7/8', '9/8', '12/8'] as const;

export const DEFAULT_TEMPO = 120;
export const MIN_TEMPO = 20;
export const MAX_TEMPO = 300;

export interface Bar {
  id: string;
  chord: ChordCell | null;
}

export interface Section {
  id: string;
  kind: SectionKind;
  /** Editable display name, e.g. "Verse 1" - defaults from `kind` but the user can rename freely. */
  label: string;
  timeSignature: string;
  /** Tempo in BPM. Per-section, since a bridge or solo commonly differs from the rest of the song. */
  tempo: number;
  bars: Bar[];
}
