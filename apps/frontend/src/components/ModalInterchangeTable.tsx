import type { DragEvent, MouseEvent } from 'react';
import type { ModalInterchangeTable as TableData, DegreeCell } from '@modal-interchange/shared';
import { CHORD_DRAG_MIME, type ChordCell } from '../chartTypes';
import { playChordCell } from '../audio';

interface ModalInterchangeTableProps {
  data: TableData;
  /** Currently click-selected chord (for the click-to-place fallback to drag-and-drop). */
  selectedChord: ChordCell | null;
  onSelectChord: (chord: ChordCell) => void;
}

const DEGREE_HEADERS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Mirrors the shared package's own note-name spelling (sharps), so a resolved
// key's display name can be turned back into a pitch class without a runtime
// import from the shared package just for this one lookup.
const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function toChordCell(cell: DegreeCell, mode: string, keyIndex: number): ChordCell {
  return {
    label: cell.chordName ?? cell.romanChordSymbol,
    romanChordSymbol: cell.romanChordSymbol,
    chordName: cell.chordName,
    mode,
    degreeIndex: cell.degreeIndex,
    quality: cell.quality,
    rootPitchClass: ((keyIndex + cell.rootSemitoneOffset) % 12 + 12) % 12,
  };
}

/**
 * Renders the reference chart: one row per mode, one column per scale
 * degree. Each cell always shows the roman-numeral chord symbol; when a
 * key has been resolved it also shows the real chord name beneath it.
 *
 * Every cell doubles as a chord source for the chart builder below: drag it
 * directly onto a bar, or click it to select it and then click a bar to
 * place it (a fallback for browsers/devices where drag-and-drop is awkward).
 * A small play button previews the chord's sound in place.
 */
export function ModalInterchangeTable({ data, selectedChord, onSelectChord }: ModalInterchangeTableProps) {
  const keyIndex = data.key ? CHROMATIC.indexOf(data.key) : 0;

  const handleDragStart = (event: DragEvent<HTMLTableCellElement>, chord: ChordCell) => {
    const payload = JSON.stringify(chord);
    event.dataTransfer.setData(CHORD_DRAG_MIME, payload);
    event.dataTransfer.setData('text/plain', payload);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const handlePlay = (event: MouseEvent, chord: ChordCell) => {
    event.stopPropagation();
    playChordCell(chord);
  };

  return (
    <div className="table-scroll">
      <table className="modal-table">
        <caption>
          Major Scale Chords{data.key ? ` — in the key of ${data.key}` : ''}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="mode-col">Mode</th>
            {DEGREE_HEADERS.map((h) => (
              <th scope="col" key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row) => (
            <tr key={row.mode}>
              <th scope="row" className="mode-col">
                <span className="mode-name">{row.mode}</span>
                {row.aka && <span className="mode-aka">({row.aka})</span>}
                <span className="mode-formula">{row.formulaLabel}</span>
              </th>
              {row.cells.map((cell) => {
                const chord = toChordCell(cell, row.mode, keyIndex);
                const isSelected =
                  selectedChord?.mode === row.mode && selectedChord?.degreeIndex === cell.degreeIndex;
                return (
                  <td
                    key={cell.degreeIndex}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chord)}
                    onClick={() => onSelectChord(chord)}
                    className={isSelected ? 'chord-cell chord-cell--selected' : 'chord-cell'}
                    title="Drag to the chart below, or click to select it"
                  >
                    <button
                      type="button"
                      className="chord-cell__play"
                      onClick={(e) => handlePlay(e, chord)}
                      title="Play this chord"
                      aria-label={`Play ${chord.label}`}
                    >
                      ▶
                    </button>
                    <span className="roman">{cell.romanChordSymbol}</span>
                    {cell.chordName && <span className="chord-name">{cell.chordName}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
