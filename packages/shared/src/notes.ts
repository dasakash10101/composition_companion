/**
 * Pitch-class utilities. Notes are represented internally as integers 0-11
 * (0 = C), which keeps every calculation in the rest of the engine simple
 * integer arithmetic. Sharps are used as the canonical display spelling;
 * common flat spellings are accepted as input and normalized to sharps.
 */

export const CHROMATIC = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

export type NoteName = (typeof CHROMATIC)[number];

/** Flat / enharmonic spellings a user might type, mapped to our sharp-based scale. */
const ENHARMONIC_TO_SHARP: Record<string, NoteName> = {
  Db: 'C#',
  Eb: 'D#',
  Fb: 'E',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
  Cb: 'B',
  'E#': 'F',
  'B#': 'C',
};

/**
 * Parses a free-typed root note (e.g. "c", "F#", "Bb") into a pitch class
 * 0-11. Returns null when the input isn't a recognizable note name.
 */
export function parseNoteName(input: string): number | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  let note = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  note = note.replace('♯', '#').replace('♭', 'b');
  // Re-uppercase a lowercase accidental letter isn't needed; only the flat/sharp
  // marker matters and both '#' and 'b' are already in the right case.

  if ((CHROMATIC as readonly string[]).includes(note)) {
    return CHROMATIC.indexOf(note as NoteName);
  }

  const enharmonic = ENHARMONIC_TO_SHARP[note];
  if (enharmonic) {
    return CHROMATIC.indexOf(enharmonic);
  }

  return null;
}

/** Transposes a root pitch class up by `semitones`, wrapping within an octave. */
export function transpose(rootIndex: number, semitones: number): number {
  return ((rootIndex + semitones) % 12 + 12) % 12;
}

/** Display name for a pitch class 0-11. */
export function noteName(index: number): NoteName {
  return CHROMATIC[((index % 12) + 12) % 12];
}
