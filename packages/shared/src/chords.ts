/**
 * Diatonic seventh-chord quality derivation. Given the semitone intervals
 * of a mode, we stack thirds (1-3-5-7) starting on each scale degree and
 * classify the resulting chord purely from the interval content - no
 * chord quality is ever hard-coded per mode/degree.
 */

export type ChordQuality =
  | 'maj7'
  | 'min7'
  | '7'
  | 'min7b5'
  | 'dim7'
  | 'minMaj7'
  | 'augMaj7'
  | 'aug7'
  | 'unknown';

/** Label used inline in the roman-numeral chart, matching lead-sheet convention. */
export const QUALITY_ROMAN_LABEL: Record<ChordQuality, string> = {
  maj7: 'maj7',
  min7: 'min7',
  '7': '7',
  min7b5: 'min7♭5',
  dim7: 'dim7',
  minMaj7: 'min(maj7)',
  augMaj7: 'maj7#5',
  aug7: '7#5',
  unknown: '?',
};

/** Suffix appended directly to a root note name, e.g. "Bb" + "maj7" -> "Bbmaj7". */
export const QUALITY_CHORD_SUFFIX: Record<ChordQuality, string> = {
  maj7: 'maj7',
  min7: 'm7',
  '7': '7',
  min7b5: 'm7♭5',
  dim7: 'dim7',
  minMaj7: 'm(maj7)',
  augMaj7: 'maj7#5',
  aug7: '7#5',
  unknown: '?',
};

/**
 * Extends a 7-note mode formula across two octaves so chord tones stacked
 * from any degree (including ones that wrap past the 7th) accumulate the
 * correct number of octaves.
 */
function extendTwoOctaves(intervals: number[]): number[] {
  const extended: number[] = [];
  for (let i = 0; i < 14; i++) {
    extended.push(intervals[i % 7] + 12 * Math.floor(i / 7));
  }
  return extended;
}

function classify(thirdInterval: number, fifthInterval: number, seventhInterval: number): ChordQuality {
  const key = `${thirdInterval},${fifthInterval},${seventhInterval}`;
  switch (key) {
    case '4,7,11': return 'maj7';
    case '3,7,10': return 'min7';
    case '4,7,10': return '7';
    case '3,6,10': return 'min7b5';
    case '3,6,9': return 'dim7';
    case '3,7,11': return 'minMaj7';
    case '4,8,11': return 'augMaj7';
    case '4,8,10': return 'aug7';
    default: return 'unknown';
  }
}

/** The semitone offsets (third, fifth, seventh) that define each quality - the inverse of `classify`. */
export const QUALITY_INTERVALS: Record<Exclude<ChordQuality, 'unknown'>, [number, number, number]> = {
  maj7: [4, 7, 11],
  min7: [3, 7, 10],
  '7': [4, 7, 10],
  min7b5: [3, 6, 10],
  dim7: [3, 6, 9],
  minMaj7: [3, 7, 11],
  augMaj7: [4, 8, 11],
  aug7: [4, 8, 10],
};

/**
 * Semitone offsets from the root for every tone of a chord of the given
 * quality, root included (e.g. `maj7` -> `[0, 4, 7, 11]`). Used to turn a
 * chord symbol back into actual notes, e.g. for audio playback.
 */
export function chordToneOffsets(quality: ChordQuality): number[] {
  if (quality === 'unknown') return [0];
  return [0, ...QUALITY_INTERVALS[quality]];
}

/**
 * Builds the diatonic 7th chord on `degreeIndex` (0-6) of a mode defined by
 * `intervals`, returning its quality and the semitone offset of its root
 * from the mode's tonic.
 */
export function diatonicSeventhChord(
  intervals: number[],
  degreeIndex: number
): { quality: ChordQuality; rootSemitoneOffset: number } {
  const extended = extendTwoOctaves(intervals);
  const root = extended[degreeIndex];
  const third = extended[degreeIndex + 2] - root;
  const fifth = extended[degreeIndex + 4] - root;
  const seventh = extended[degreeIndex + 6] - root;
  return { quality: classify(third, fifth, seventh), rootSemitoneOffset: intervals[degreeIndex] };
}
