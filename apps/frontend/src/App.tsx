import { useEffect, useState } from 'react';
import type { ModalInterchangeTable as TableData } from '@modal-interchange/shared';
import { fetchModes, fetchTable } from './api';
import { KeyInput } from './components/KeyInput';
import { ModalInterchangeTable } from './components/ModalInterchangeTable';
import './styles.css';

export default function App() {
  const [key, setKey] = useState('C');
  const [table, setTable] = useState<TableData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load the roman-numeral-only chart once on mount so something renders
  // immediately, before any key has resolved.
  useEffect(() => {
    fetchModes()
      .then((res) => setTable(res.table))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Whenever the key input changes, debounce a request to resolve every
  // roman numeral in the chart into a real chord name for that tonic.
  useEffect(() => {
    if (!key.trim()) return;

    const handle = setTimeout(() => {
      fetchTable(key)
        .then((res) => {
          setTable(res.table);
          setError(null);
        })
        .catch((err) => setError(err.message));
    }, 250);

    return () => clearTimeout(handle);
  }, [key]);

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

      {loading && <p className="status">Loading chart…</p>}
      {!loading && table && <ModalInterchangeTable data={table} />}
    </div>
  );
}
