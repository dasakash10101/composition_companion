/**
 * The seven modes of the major scale, defined purely as semitone-offset
 * formulas from a shared root (0). Everything else in the engine (roman
 * numeral accidentals, diatonic chord qualities) is *derived* from these
 * numbers rather than hard-coded, so the table always stays internally
 * consistent and is easy to extend (e.g. harmonic-minor modes) later.
 */

export type ModeName =
  | 'Ionian'
  | 'Dorian'
  | 'Phrygian'
  | 'Lydian'
  | 'Mixolydian'
  | 'Aeolian'
  | 'Locrian';

export interface ModeDefinition {
  name: ModeName;
  /** Common alternate name, e.g. Aeolian -> "Natural minor". */
  aka?: string;
  /** Alterations relative to the major (Ionian) scale, for display. */
  formulaLabel: string;
  /** Seven semitone offsets from the tonic, ascending. */
  intervals: number[];
}

export const MODES: ModeDefinition[] = [
  { name: 'Ionian', aka: 'Major scale', formulaLabel: 'Major scale (no alterations)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Dorian', formulaLabel: '♭3, ♭7', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian', formulaLabel: '♭2, ♭3, ♭6, ♭7', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian', formulaLabel: '#4', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Mixolydian', formulaLabel: '♭7', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Aeolian', aka: 'Natural minor', formulaLabel: '♭3, ♭6, ♭7', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Locrian', formulaLabel: '♭2, ♭3, ♭5, ♭6, ♭7', intervals: [0, 1, 3, 5, 6, 8, 10] },
];

export const IONIAN_INTERVALS = MODES[0].intervals;

export const ROMAN_BASE = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

/**
 * Returns the accidental (relative to the major scale on the same tonic)
 * for a given scale degree of a mode, e.g. Dorian's 3rd degree is a
 * semitone flatter than Ionian's -> "♭".
 */
export function accidentalForDegree(mode: ModeDefinition, degreeIndex: number): string {
  const diff = mode.intervals[degreeIndex] - IONIAN_INTERVALS[degreeIndex];
  switch (diff) {
    case 0: return '';
    case -1: return '♭';
    case -2: return '♭♭';
    case 1: return '#';
    case 2: return 'x';
    default: return '';
  }
}

export function romanNumeralForDegree(mode: ModeDefinition, degreeIndex: number): string {
  return `${accidentalForDegree(mode, degreeIndex)}${ROMAN_BASE[degreeIndex]}`;
}
