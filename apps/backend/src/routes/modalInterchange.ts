import { Router } from 'express';
import { MODES, buildModalInterchangeTable, buildModeRow, parseNoteName, noteName } from '@modal-interchange/shared';

export const modalInterchangeRouter = Router();

/**
 * GET /api/modes
 * Static metadata + the roman-numeral-only chart (no key applied yet).
 * The frontend renders this immediately on load, before the user types
 * anything into the key input.
 */
modalInterchangeRouter.get('/modes', (_req, res) => {
  const table = buildModalInterchangeTable();
  res.json({
    modes: MODES.map((m) => ({ name: m.name, aka: m.aka, formulaLabel: m.formulaLabel })),
    table,
  });
});

/**
 * GET /api/table?key=<note>
 * The key/tonic (e.g. "C", "F#", "Bb") is the "variable" that feeds the
 * chart: every roman numeral cell is resolved to a real chord name for
 * that shared tonic, which is exactly what modal interchange means -
 * borrowing chords from parallel modes of the same root.
 */
modalInterchangeRouter.get('/table', (req, res) => {
  const rawKey = typeof req.query.key === 'string' ? req.query.key : '';
  const rootIndex = parseNoteName(rawKey);

  if (rootIndex === null) {
    res.status(400).json({
      error: `"${rawKey}" is not a recognizable note name. Try one of: C, C#, Db, D, D#, Eb, E, F, F#, Gb, G, G#, Ab, A, A#, Bb, B.`,
    });
    return;
  }

  const table = buildModalInterchangeTable(rootIndex, noteName(rootIndex));
  res.json({ table });
});

/**
 * GET /api/modes/:modeName?key=<note>
 * A single row, useful for isolating one mode at a time.
 */
modalInterchangeRouter.get('/modes/:modeName', (req, res) => {
  const mode = MODES.find((m) => m.name.toLowerCase() === req.params.modeName.toLowerCase());
  if (!mode) {
    res.status(404).json({ error: `Unknown mode "${req.params.modeName}". Valid modes: ${MODES.map((m) => m.name).join(', ')}.` });
    return;
  }

  const rawKey = typeof req.query.key === 'string' ? req.query.key : '';
  const rootIndex = rawKey ? parseNoteName(rawKey) : undefined;
  if (rawKey && rootIndex === null) {
    res.status(400).json({ error: `"${rawKey}" is not a recognizable note name.` });
    return;
  }

  res.json({ row: buildModeRow(mode, rootIndex ?? undefined) });
});
