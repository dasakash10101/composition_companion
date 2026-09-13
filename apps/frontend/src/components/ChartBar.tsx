import type { DragEvent, MouseEvent } from 'react';
import type { Bar, ChordCell } from '../chartTypes';
import { CHORD_DRAG_MIME } from '../chartTypes';
import { playChordCell } from '../audio';

interface ChartBarProps {
  bar: Bar;
  index: number;
  /** A click-selected chord waiting to be placed (drag-and-drop fallback). */
  selectedChord: ChordCell | null;
  onPlace: (chord: ChordCell) => void;
  onClear: () => void;
  onRemove: () => void;
}

/** One bar/measure in the chart: a drop target that holds at most one chord. */
export function ChartBar({ bar, index, selectedChord, onPlace, onClear, onRemove }: ChartBarProps) {
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData(CHORD_DRAG_MIME) || event.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      onPlace(JSON.parse(raw) as ChordCell);
    } catch {
      // Ignore payloads that aren't a chord (e.g. something dragged in from elsewhere).
    }
  };

  const handleClick = () => {
    if (bar.chord) {
      onClear();
    } else if (selectedChord) {
      onPlace(selectedChord);
    }
  };

  const handlePlay = (event: MouseEvent) => {
    event.stopPropagation();
    if (bar.chord) playChordCell(bar.chord);
  };

  const classes = ['chart-bar'];
  if (bar.chord) classes.push('chart-bar--filled');
  else if (selectedChord) classes.push('chart-bar--droppable');

  return (
    <div
      className={classes.join(' ')}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      title={bar.chord ? 'Click to clear this bar' : selectedChord ? 'Click to place the selected chord' : 'Drag a chord here'}
    >
      <button
        type="button"
        className="chart-bar__remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        title="Remove bar"
        aria-label={`Remove bar ${index + 1}`}
      >
        ×
      </button>
      <span className="chart-bar__index">{index + 1}</span>
      <span className="chart-bar__chord">{bar.chord ? bar.chord.label : ''}</span>
      {bar.chord && (
        <button type="button" className="chart-bar__play" onClick={handlePlay} title="Play this chord" aria-label={`Play bar ${index + 1}`}>
          ▶
        </button>
      )}
    </div>
  );
}
