import type { ModalInterchangeTable } from '@modal-interchange/shared';
// Namespace import: see audio.ts's note on why - the shared package ships
// as a prebuilt CommonJS module, and importing individual named values
// from it doesn't reliably survive bundling; the whole namespace always does.
import * as SharedTheory from '@modal-interchange/shared';

const { buildModalInterchangeTable, parseNoteName, noteName } = SharedTheory;

/**
 * Computes the whole chart entirely in the browser - no server round trip.
 * This is what makes the built app shareable as a single static file: it
 * never depends on anything but the music theory engine bundled into it.
 */
export function getBlankTable(): ModalInterchangeTable {
  return buildModalInterchangeTable();
}

/**
 * Resolves the chart against a real key/tonic (e.g. "C", "F#", "Bb").
 * Mirrors the validation the old backend endpoint used to do, so the error
 * message stays the same.
 */
export function resolveTable(key: string): { table: ModalInterchangeTable } | { error: string } {
  const rootIndex = parseNoteName(key);
  if (rootIndex === null) {
    return {
      error: `"${key}" is not a recognizable note name. Try one of: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B.`,
    };
  }
  return { table: buildModalInterchangeTable(rootIndex, noteName(rootIndex)) };
}
