import type { ModalInterchangeTable as TableData } from '@modal-interchange/shared';

interface ModalInterchangeTableProps {
  data: TableData;
}

const DEGREE_HEADERS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/**
 * Renders the reference chart: one row per mode, one column per scale
 * degree. Each cell always shows the roman-numeral chord symbol; when a
 * key has been resolved it also shows the real chord name beneath it.
 */
export function ModalInterchangeTable({ data }: ModalInterchangeTableProps) {
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
              {row.cells.map((cell) => (
                <td key={cell.degreeIndex}>
                  <span className="roman">{cell.romanChordSymbol}</span>
                  {cell.chordName && <span className="chord-name">{cell.chordName}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
