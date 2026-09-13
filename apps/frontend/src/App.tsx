import { useEffect, useState } from 'react';
import type { ModalInterchangeTable as TableData } from '@modal-interchange/shared';
import type { ChordCell } from './chartTypes';
import { getBlankTable, resolveTable } from './modalInterchangeEngine';
import { KeyInput } from './components/KeyInput';
import { ModalInterchangeTable } from './components/ModalInterchangeTable';
import { ChordChartBuilder } from './components/ChordChartBuilder';
import './styles.css';

const DEFAULT_KEY = 'C';

export default function App() {
  const [key, setKey] = useState(DEFAULT_KEY);
  const [table, setTable] = useState<TableData>(() => {
    const initial = resolveTable(DEFAULT_KEY);
    return 'table' in initial ? initial.table : getBlankTable();
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedChord, setSelectedChord] = useState<ChordCell | null>(null);

  // The whole chart is computed right here in the browser - no server round
  // trip - which is what lets this app run as a single static file with no
  // backend at all. An empty/incomplete key just keeps the last valid chart
  // showing rather than flashing an error while the user is mid-edit.
  useEffect(() => {
    if (!key.trim()) return;
    const result = resolveTable(key);
    if ('table' in result) {
      setTable(result.table);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [key]);

  // Clicking the same table cell twice deselects it; otherwise it becomes
  // the pending chord for the click-to-place fallback to drag-and-drop.
  const handleSelectChord = (chord: ChordCell) => {
    setSelectedChord((prev) =>
      prev && prev.mode === chord.mode && prev.degreeIndex === chord.degreeIndex ? null : chord
    );
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>Modal Interchange Explorer</h1>
        <p>
          Borrow chords from the parallel modes of a shared tonic. Type a key below and every
          roman numeral in the chart resolves to a real chord in that key.
        </p>
      </header>

      <KeyInput value={key} onChange={setKey} error={error} />

      <ModalInterchangeTable data={table} selectedChord={selectedChord} onSelectChord={handleSelectChord} />

      <ChordChartBuilder
        selectedChord={selectedChord}
        onClearSelection={() => setSelectedChord(null)}
        songKey={table.key}
      />
    </div>
  );
}
