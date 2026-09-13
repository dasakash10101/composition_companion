import { noteName, transpose } from './notes';
import { MODES, ModeDefinition, romanNumeralForDegree, ROMAN_BASE } from './modes';
import { ChordQuality, QUALITY_ROMAN_LABEL, QUALITY_CHORD_SUFFIX, diatonicSeventhChord } from './chords';

/** One cell of the modal-interchange chart: a single scale degree of a single mode. */
export interface DegreeCell {
  degreeIndex: number;
  /** e.g. "♭III" - the roman numeral, including any accidental. */
  romanNumeral: string;
  quality: ChordQuality;
  /** e.g. "maj7" - shown next to the roman numeral. */
  qualityLabel: string;
  /** e.g. "♭III maj7" - the full roman-numeral chord symbol. */
  romanChordSymbol: string;
  /** Semitone offset of this chord's root from the mode's own tonic (0-11). */
  rootSemitoneOffset: number;
  /** Present only when a valid key/tonic was supplied. */
  noteName?: string;
  /** e.g. "B♭maj7" - the actual chord name in the selected key. */
  chordName?: string;
}

export interface ModeRow {
  mode: ModeDefinition['name'];
  aka?: string;
  formulaLabel: string;
  cells: DegreeCell[];
}

export interface ModalInterchangeTable {
  /** Root note name the table was computed for, if any. */
  key?: string;
  rows: ModeRow[];
}

/** Builds one mode's row of the chart. `keyRootIndex` (0-11) is optional. */
export function buildModeRow(mode: ModeDefinition, keyRootIndex?: number): ModeRow {
  const cells: DegreeCell[] = ROMAN_BASE.map((_, degreeIndex) => {
    const { quality, rootSemitoneOffset } = diatonicSeventhChord(mode.intervals, degreeIndex);
    const romanNumeral = romanNumeralForDegree(mode, degreeIndex);
    const qualityLabel = QUALITY_ROMAN_LABEL[quality];
    const cell: DegreeCell = {
      degreeIndex,
      romanNumeral,
      quality,
      qualityLabel,
      romanChordSymbol: `${romanNumeral} ${qualityLabel}`,
      rootSemitoneOffset,
    };
    if (keyRootIndex !== undefined) {
      const rootIndex = transpose(keyRootIndex, rootSemitoneOffset);
      const root = noteName(rootIndex);
      cell.noteName = root;
      cell.chordName = `${root}${QUALITY_CHORD_SUFFIX[quality]}`;
    }
    return cell;
  });

  return { mode: mode.name, aka: mode.aka, formulaLabel: mode.formulaLabel, cells };
}

/** Builds the full 7x7 modal-interchange table, optionally resolved to a real key. */
export function buildModalInterchangeTable(keyRootIndex?: number, keyDisplayName?: string): ModalInterchangeTable {
  return {
    key: keyDisplayName,
    rows: MODES.map((mode) => buildModeRow(mode, keyRootIndex)),
  };
}
