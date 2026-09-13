import type { ModalInterchangeTable } from '@modal-interchange/shared';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export interface ModesResponse {
  modes: { name: string; aka?: string; formulaLabel: string }[];
  table: ModalInterchangeTable;
}

export interface TableResponse {
  table: ModalInterchangeTable;
}

export interface ApiError {
  error: string;
}

/** Fetches mode metadata plus the roman-numeral-only chart (no key applied). */
export async function fetchModes(): Promise<ModesResponse> {
  const res = await fetch(`${API_BASE}/api/modes`);
  if (!res.ok) throw new Error(`Failed to load modes (${res.status})`);
  return res.json();
}

/**
 * Fetches the chart resolved against a real key/tonic, e.g. "C" or "F#".
 * Throws with the backend's human-readable message when the key is invalid.
 */
export async function fetchTable(key: string): Promise<TableResponse> {
  const res = await fetch(`${API_BASE}/api/table?key=${encodeURIComponent(key)}`);
  const body = await res.json();
  if (!res.ok) {
    throw new Error((body as ApiError).error ?? `Failed to load table (${res.status})`);
  }
  return body;
}
