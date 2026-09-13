import { useEffect, useState, type ChangeEvent } from 'react';
import type { Section, SectionKind, ChordCell } from '../chartTypes';
import { SECTION_KINDS, DEFAULT_TEMPO } from '../chartTypes';
import { ChartSection } from './ChartSection';
import { downloadChartAsPdf } from '../pdfExport';
import { playChordCell } from '../audio';

interface ChordChartBuilderProps {
  selectedChord: ChordCell | null;
  onClearSelection: () => void;
  /** The key currently set in the table above, shown on the PDF export if present. */
  songKey?: string;
}

const STORAGE_KEY = 'modal-interchange:chart-builder:v1';
const DEFAULT_BARS_PER_SECTION = 4;

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeBars(count: number) {
  return Array.from({ length: count }, () => ({ id: makeId(), chord: null }));
}

function loadInitialSections(): Section[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Backfill `tempo` for charts saved before it existed.
    return (parsed as Partial<Section>[]).map((s) => ({
      ...s,
      tempo: typeof s.tempo === 'number' ? s.tempo : DEFAULT_TEMPO,
    })) as Section[];
  } catch {
    return [];
  }
}

/**
 * A drag-and-drop chord chart builder: song sections (intro, verse, chorus,
 * bridge, solo, break, outro, ...), each with its own time signature and a
 * row of bars that chords from the table above can be dropped into.
 * Persisted to localStorage so a browser refresh doesn't lose the chart.
 */
export function ChordChartBuilder({ selectedChord, onClearSelection, songKey }: ChordChartBuilderProps) {
  const [sections, setSections] = useState<Section[]>(loadInitialSections);
  const [nextKind, setNextKind] = useState<SectionKind>('Verse');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
    } catch {
      // Best-effort persistence only (e.g. private browsing may block storage).
    }
  }, [sections]);

  const addSection = () => {
    setSections((prev) => {
      const countOfKind = prev.filter((s) => s.kind === nextKind).length;
      const label = `${nextKind} ${countOfKind + 1}`;
      const section: Section = {
        id: makeId(),
        kind: nextKind,
        label,
        timeSignature: '4/4',
        tempo: DEFAULT_TEMPO,
        bars: makeBars(DEFAULT_BARS_PER_SECTION),
      };
      return [...prev, section];
    });
  };

  const updateSection = (id: string, patch: Partial<Section>) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const addBar = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, bars: [...s.bars, { id: makeId(), chord: null }] } : s))
    );
  };

  const removeBar = (sectionId: string, barId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, bars: s.bars.filter((b) => b.id !== barId) } : s))
    );
  };

  const setBarChord = (sectionId: string, barId: string, chord: ChordCell | null) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, bars: s.bars.map((b) => (b.id === barId ? { ...b, chord } : b)) } : s
      )
    );
    onClearSelection();
    // Immediate audible feedback whenever a chord lands on a bar (drag-drop or click-to-place).
    if (chord) playChordCell(chord);
  };

  const clearChart = () => {
    if (sections.length === 0) return;
    if (confirm('Clear the whole chart? This removes every section and bar.')) {
      setSections([]);
    }
  };

  const handleKindChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setNextKind(event.target.value as SectionKind);
  };

  const handleDownloadPdf = () => {
    downloadChartAsPdf(sections, songKey).catch((err) => {
      console.error('Failed to generate PDF:', err);
      alert('Could not generate the PDF. See the console for details.');
    });
  };

  return (
    <section className="chart-builder">
      <div className="chart-builder__header">
        <h2>Chord Chart Builder</h2>
        <p>
          Drag a chord from the table above onto a bar below - or click a chord to select it, then click a bar
          to place it.
        </p>
      </div>

      {sections.length > 0 && (
        <div className="chart-builder__toolbar">
          <button type="button" className="chart-builder__download" onClick={handleDownloadPdf} title="Download this chart as a PDF">
            Download PDF
          </button>
          <button type="button" className="chart-builder__clear" onClick={clearChart}>
            Clear chart
          </button>
        </div>
      )}

      {sections.length === 0 ? (
        <p className="chart-builder__empty">No sections yet — add one below to start building your chart.</p>
      ) : (
        <div className="chart-builder__sections">
          {sections.map((section) => (
            <ChartSection
              key={section.id}
              section={section}
              selectedChord={selectedChord}
              onUpdate={(patch) => updateSection(section.id, patch)}
              onRemove={() => removeSection(section.id)}
              onAddBar={() => addBar(section.id)}
              onRemoveBar={(barId) => removeBar(section.id, barId)}
              onSetBarChord={(barId, chord) => setBarChord(section.id, barId, chord)}
            />
          ))}
        </div>
      )}

      <div className="chart-builder__add-row">
        <select value={nextKind} onChange={handleKindChange} aria-label="New section type">
          {SECTION_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <button type="button" className="chart-builder__add-section" onClick={addSection}>
          + Add section
        </button>
      </div>
    </section>
  );
}
