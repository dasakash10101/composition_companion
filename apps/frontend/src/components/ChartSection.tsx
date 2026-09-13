import type { ChangeEvent } from 'react';
import type { Section, ChordCell } from '../chartTypes';
import { SECTION_KINDS, TIME_SIGNATURES, MIN_TEMPO, MAX_TEMPO, DEFAULT_TEMPO } from '../chartTypes';
import { ChartBar } from './ChartBar';

interface ChartSectionProps {
  section: Section;
  selectedChord: ChordCell | null;
  onUpdate: (patch: Partial<Section>) => void;
  onRemove: () => void;
  onAddBar: () => void;
  onRemoveBar: (barId: string) => void;
  onSetBarChord: (barId: string, chord: ChordCell | null) => void;
}

/** One song section (verse, chorus, ...): its own label, time signature, and row of bars. */
export function ChartSection({
  section,
  selectedChord,
  onUpdate,
  onRemove,
  onAddBar,
  onRemoveBar,
  onSetBarChord,
}: ChartSectionProps) {
  const handleKindChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ kind: event.target.value as Section['kind'] });
  };

  // Let the user type freely (e.g. clearing the field to enter "120") and only
  // clamp to the valid BPM range once they're done editing.
  const handleTempoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = Number(event.target.value);
    if (event.target.value === '' || Number.isNaN(raw)) return;
    onUpdate({ tempo: raw });
  };

  const handleTempoBlur = () => {
    onUpdate({ tempo: Math.min(MAX_TEMPO, Math.max(MIN_TEMPO, Math.round(section.tempo) || DEFAULT_TEMPO)) });
  };

  return (
    <div className="chart-section">
      <div className="chart-section__header">
        <select value={section.kind} onChange={handleKindChange} className="chart-section__kind" aria-label="Section type">
          {SECTION_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={section.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="chart-section__label"
          aria-label="Section label"
        />
        <label className="chart-section__time">
          Time
          <select
            value={section.timeSignature}
            onChange={(e) => onUpdate({ timeSignature: e.target.value })}
            aria-label="Time signature"
          >
            {TIME_SIGNATURES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="chart-section__tempo">
          Tempo
          <input
            type="number"
            value={section.tempo}
            onChange={handleTempoChange}
            onBlur={handleTempoBlur}
            min={MIN_TEMPO}
            max={MAX_TEMPO}
            aria-label="Tempo in beats per minute"
          />
          <span className="chart-section__tempo-unit">BPM</span>
        </label>
        <button type="button" className="chart-section__remove" onClick={onRemove} title="Remove section" aria-label="Remove section">
          ✕
        </button>
      </div>

      <div className="chart-section__bars">
        {section.bars.map((bar, i) => (
          <ChartBar
            key={bar.id}
            bar={bar}
            index={i}
            selectedChord={selectedChord}
            onPlace={(chord) => onSetBarChord(bar.id, chord)}
            onClear={() => onSetBarChord(bar.id, null)}
            onRemove={() => onRemoveBar(bar.id)}
          />
        ))}
        <button type="button" className="chart-section__add-bar" onClick={onAddBar} title="Add bar" aria-label="Add bar">
          +
        </button>
      </div>
    </div>
  );
}
