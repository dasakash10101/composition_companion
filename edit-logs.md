# Edit Log

A chronological record of every change made to this project so far, in the order it happened.

---

## 1. Initial build — Modal Interchange Explorer

Built the whole app from scratch: a locally-hosted playground for modal interchange, reproducing the "Major Scale Chords" notebook chart, with the roman-numeral columns resolved to real chord names from a key typed into a text input.

**Structure created (npm workspaces monorepo):**
- `packages/shared/` — framework-free TypeScript music theory engine, used by both apps
  - `src/notes.ts` — pitch classes, note-name parsing (incl. flat/sharp enharmonics), transposition
  - `src/modes.ts` — the 7 modes (Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian) as semitone-offset formulas, with roman-numeral accidentals derived (not hard-coded) relative to Ionian
  - `src/chords.ts` — diatonic 7th-chord quality derivation (maj7/min7/7/min7♭5/dim7/...) by stacking thirds within each mode's own note collection
  - `src/table.ts` — combines the above into the full chart data structure
  - `src/index.ts` — barrel export (`export *`)
- `apps/backend/` — Express + TypeScript API
  - `src/server.ts` — Express app, CORS, JSON
  - `src/routes/modalInterchange.ts` — `GET /api/modes`, `GET /api/table?key=<note>`, `GET /api/modes/:modeName?key=<note>`
- `apps/frontend/` — React + Vite + TypeScript UI
  - `src/App.tsx`, `src/api.ts`
  - `src/components/KeyInput.tsx` — text input + quick natural-key buttons (C D E F G A B), the "variable" that drives the chart
  - `src/components/ModalInterchangeTable.tsx` — renders the 7×7 chart
  - `src/styles.css` — notebook-style bordered grid theme, light/dark aware
- Root `package.json` (npm workspaces), `tsconfig.base.json`, `.gitignore`, `README.md`

**Verified:** `npm install`, `npm run build` (all 3 packages), `npm run dev` (shared watch + backend `:4000` + frontend `:5173`), and manual API/UI checks against the handwritten chart (Dorian and Locrian rows spot-checked chord-for-chord).

**Notable fix during this pass:** `tsconfig.base.json`'s `moduleResolution: "Node"` errored under TypeScript 5.9 as deprecated; changed `module`/`moduleResolution` to `NodeNext`.

---

## 2. Added a sharp/flat piano-style key picker *(later reverted — see §3)*

Replaced the 7 natural-key quick buttons in `KeyInput.tsx` with a full 12-note piano-style picker (white/black key rows) plus a ♯/♭ spelling toggle, so all 12 pitch classes were reachable by click, not just naturals.

**Files touched:** `apps/frontend/src/components/KeyInput.tsx`, `apps/frontend/src/styles.css`.

**Side effect fixed:** this introduced the first runtime (non-type) import from `@modal-interchange/shared` into a component, which broke the frontend's production build — Rollup couldn't statically detect named exports from the shared package's `export *` barrel (CommonJS output). Fixed at the time by rewriting `packages/shared/src/index.ts` to use explicit named re-exports.

## 3. Reverted the piano-key picker

Per request, reverted §2 in full:
- `KeyInput.tsx` back to the simple 7-button natural-key row
- `styles.css` piano-key/toggle rules removed
- `packages/shared/src/index.ts` back to the original `export *` wildcard barrel (safe again, since nothing does a runtime import from it anymore)

---

## 4. Standalone executable build *(later reverted — see §5)*

Added `npm run build:exe`, which packaged the whole app (API + music theory engine + built frontend) into a single self-contained `.exe` using Node's Single Executable Applications feature, so it could run on another machine with nothing installed (no Node, no npm).

**Files added/touched:**
- `apps/backend/src/server.ts` — added SEA-aware static file serving (embedded frontend assets when packaged, `apps/frontend/dist` on disk otherwise), so one process serves both the API and the UI
- `scripts/build-exe.mjs` — build pipeline: build shared → build frontend → bundle backend with esbuild → generate `sea-config.json` embedding every frontend file → generate the SEA blob → inject it into a copy of `node.exe` via `postject`
- `package.json` — `build:exe` script, `esbuild` + `postject` devDependencies
- `.gitignore` — ignored the generated `sea-config.json` and the output executable
- `README.md` — documented the new workflow

**Verified working:** built and ran `modal-interchange.exe` (~89MB), confirmed the API, embedded HTML, embedded JS/CSS (correct MIME types), and SPA-fallback routing all worked with zero files read from disk.

**Troubleshooting along the way:**
- `execFileSync` needed `shell: true` on Windows to invoke `npm.cmd`/`npx.cmd`, and then needed manual quoting of any argument containing a space (the repo path itself has spaces) since `shell: true` doesn't quote args automatically.
- Diagnosed a "double-click does nothing" report as `EADDRINUSE` — the dev server was already holding port 4000, so the exe crashed instantly and the console window closed before the error could be read. Resolved by running it from a terminal on a free port (`PORT=4700`) instead of double-clicking.

## 5. Reverted the standalone executable

Per request, reverted §4 in full:
- `server.ts` back to the plain API-only server (no SEA/static-serving logic)
- `scripts/build-exe.mjs` and the built `modal-interchange.exe` deleted
- `package.json` — `build:exe` script and `esbuild`/`postject` devDependencies removed, `node_modules`/lockfile resynced
- `.gitignore` and `README.md` exe-related entries removed

---

## 6. Chord Chart Builder

Added a drag-and-drop chord chart builder below the Modal Interchange table.

**New files:**
- `apps/frontend/src/chartTypes.ts` — data model (`ChordCell`, `Bar`, `Section`, `SectionKind`, `TIME_SIGNATURES`, drag MIME type)
- `apps/frontend/src/components/ChordChartBuilder.tsx` — top-level builder: section list, "+ Add section" control (with a section-type dropdown: Intro, Verse, Pre-Chorus, Chorus, Bridge, Solo, Break, Outro, Custom), "Clear chart", persists to `localStorage`
- `apps/frontend/src/components/ChartSection.tsx` — one song section: editable label (auto-numbered, e.g. "Verse 1"), per-section time signature dropdown (4/4, 3/4, 2/4, 6/8, 5/4, 7/8, 9/8, 12/8), its row of bars, remove-section button
- `apps/frontend/src/components/ChartBar.tsx` — one bar: a drag-and-drop target; click-to-clear when filled; per-bar remove button

**Files modified:**
- `apps/frontend/src/components/ModalInterchangeTable.tsx` — every chord cell is now `draggable` (carries a JSON chord payload) and click-selectable, as a fallback to drag-and-drop for touch devices
- `apps/frontend/src/App.tsx` — lifts `selectedChord` state so the table (source) and builder (target) can share the click-to-select-then-click-to-place flow; renders `<ChordChartBuilder>` below the table
- `apps/frontend/src/styles.css` — chart builder layout (sections, bars, toolbar), draggable/selected cell states in the table

**Verified:** `npm run build -w @modal-interchange/frontend` type-checks and builds clean; dev server hot-reloaded every new/changed file with zero errors.

---

## 7. This file

Added `edit-logs.md` at the repo root to record the above.

---

## 8. Per-section tempo + PDF export

**Tempo:** added a `tempo` (BPM) field to each chart section, entered via a number input right next to the time-signature dropdown (range 20–300, default 120), for the same reason time signature is per-section rather than global - a bridge or solo commonly runs at a different tempo than the rest of the song.

- `apps/frontend/src/chartTypes.ts` — added `tempo: number` to `Section`, plus `DEFAULT_TEMPO`/`MIN_TEMPO`/`MAX_TEMPO` constants
- `apps/frontend/src/components/ChartSection.tsx` — tempo input (free typing on change, clamped to range on blur)
- `apps/frontend/src/components/ChordChartBuilder.tsx` — new sections default to 120 BPM; old charts already saved in `localStorage` (from before this field existed) are backfilled with the default on load

**PDF export:** added a "Download PDF" button to the chart builder's toolbar that renders the whole chart - section labels, time signatures, tempos, and every bar's chord in the same bordered-box grid used on screen - to a PDF and triggers a browser download. Fully client-side, no server round trip.

- `apps/frontend/src/pdfExport.ts` (new) — builds the PDF with `jspdf`, 4 bars per row, paginating automatically when a section runs past the bottom of the page
- `apps/frontend/src/components/ChordChartBuilder.tsx` — "Download PDF" button, wired to a new `songKey` prop (shown as a subtitle on the PDF when a key is set)
- `apps/frontend/src/App.tsx` — passes `songKey={table?.key}` down
- `apps/frontend/package.json` — added `jspdf` dependency

**Performance note found and fixed along the way:** a static `import { jsPDF } from 'jspdf'` pulled jsPDF's ~390KB (plus its `html2canvas`/`dompurify` sub-dependencies) into the app's main bundle, tripping Vite's 500KB chunk-size warning. Changed `pdfExport.ts` to dynamically `import('jspdf')` inside the export function instead, so it's only fetched the first time someone clicks "Download PDF" - this dropped the main chunk from ~545KB back to ~154KB.

**Verified:** `npm run build -w @modal-interchange/frontend` builds clean with no size warnings; dev server hot-reloaded every change (including Vite auto-optimizing the new `jspdf` dependency) with zero errors.

---

## 9. Chord audio playback

Asked whether pointing me to MIDI files would let chords play in the browser. Since the app already computes each chord's exact root note + quality from the music theory engine, went with a dependency-free synthesized sound (Web Audio API oscillators) instead of requiring any audio files or MIDI parsing - the user picked this option explicitly over MIDI-file-based or sample/soundfont-based alternatives.

**Shared engine (source of truth for what notes a chord actually contains):**
- `packages/shared/src/chords.ts` — added `QUALITY_INTERVALS` (the third/fifth/seventh semitone offsets for each quality - the inverse of the existing `classify` lookup) and `chordToneOffsets(quality)`, which turns a quality like `maj7` into `[0, 4, 7, 11]`
- `packages/shared/src/table.ts` — added `rootSemitoneOffset` to `DegreeCell` so the frontend can compute each cell's absolute pitch class without re-deriving it

**Frontend:**
- `apps/frontend/src/audio.ts` (new) — `playChordTones(pitchClasses)` plays a set of notes as a chord using detuned triangle/sine oscillators with a short envelope, voicing each successive tone into the next octave up so it doesn't collapse into a muddy cluster; `playChordCell(chord)` builds those pitch classes from a `ChordCell`'s quality + root
- `apps/frontend/src/chartTypes.ts` — `ChordCell` now also carries `quality` and `rootPitchClass` (absolute 0-11, root assumed at C when no key is set), needed to reconstruct real notes for playback
- `apps/frontend/src/components/ModalInterchangeTable.tsx` — every cell got a small "▶" play button (top-right, `stopPropagation`'d so it doesn't also trigger the existing select/drag behavior)
- `apps/frontend/src/components/ChartBar.tsx` — filled bars got the same "▶" play button
- `apps/frontend/src/components/ChordChartBuilder.tsx` — placing a chord onto a bar (drag-drop or click-to-place) now auto-plays it for immediate feedback
- `apps/frontend/src/styles.css` — play button styling (hover-revealed on table cells, always visible on filled bars)

**Verified:** `npm run build -w @modal-interchange/frontend` type-checks and builds clean (main chunk unaffected in size, since `audio.ts` has no new dependencies); dev server hot-reloaded every change with zero errors; confirmed the API still returns the new `rootSemitoneOffset` field per cell.

---

## 10. Fixed a blank-screen bug in dev mode

The production build (`npm run build`) had been passing the whole time, but the **dev server** started throwing `Uncaught ReferenceError: exports is not defined at index.js:16` in the browser console, blanking the whole page - only surfaced now because `audio.ts` (§9) was the first file to import a *runtime value* (not just a TypeScript type) from `@modal-interchange/shared` while the dev server was actually running.

**Root cause:** `@modal-interchange/shared` is a symlinked npm workspace package. Vite's dev server treats symlinked monorepo packages as "project source" rather than a real dependency, so it skips its usual CommonJS-to-ESM conversion step for them. The package's compiled output is CommonJS (`exports.foo = ...`), so the browser tried to execute it directly as a native ES module - which has no `exports` global - and crashed before React ever mounted. (Production builds never hit this because Rollup's bundler handles CJS interop unconditionally, regardless of symlinks - only the dev server's on-demand pre-bundler has this monorepo-specific gap.)

**Fix:**
- `apps/frontend/vite.config.ts` — added `optimizeDeps.include: ['@modal-interchange/shared']` to force Vite to pre-bundle (and properly CJS→ESM-convert) the shared package despite the symlink
- Cleared the stale `apps/frontend/node_modules/.vite` cache and did a full restart so the fix took effect
- `apps/frontend/index.html` — also fixed an unrelated `favicon.ico 404` noticed in the same console screenshot, by inlining a simple emoji favicon

**Verified:** confirmed via `curl` that `/src/audio.ts` now resolves `@modal-interchange/shared` through Vite's pre-bundled, `__commonJS`-wrapped chunk (proper ESM interop) instead of serving the raw CommonJS file.

---

## 11. Sticky (floating) table while scrolling

Made the Modal Interchange table pin to the top of the viewport once scrolled past, so it stays reachable for dragging chords into the chart builder further down the page instead of having to scroll back up.

- `apps/frontend/src/styles.css` — `.table-scroll` changed to `position: sticky; top: 0` with a `z-index`, an opaque background (so builder content doesn't show through as it scrolls underneath), a drop shadow for a "floating" look, and `max-height: 92vh` with `overflow: auto` as a safety cap so it can never eat the whole viewport on a short screen.

**Verified:** `npm run build -w @modal-interchange/frontend` builds clean; dev server hot-reloaded the CSS change with no errors.

---

## 12. Made the app shareable - standalone single-file build + a hosted link

Goal: anyone should be able to open the app in a browser with nothing installed - no Node, no npm, not even a server.

**Step 1 - removed the frontend's dependency on the backend.** Previously every keystroke in the key field hit `GET /api/table?key=...`. Since the whole computation is just the shared music theory engine (already bundled into the frontend for chord playback), there was no real reason for the round trip.
- `apps/frontend/src/modalInterchangeEngine.ts` (new) — computes the chart synchronously in the browser (`getBlankTable`, `resolveTable`), replacing `api.ts`
- `apps/frontend/src/api.ts` — deleted (nothing references it anymore)
- `apps/frontend/src/App.tsx` — swapped the fetch/debounce/loading-state dance for a direct synchronous call; typing now resolves instantly instead of after a 250ms debounce + network round trip
- The backend (`apps/backend`) is untouched and still works standalone over HTTP if anyone wants the API - the frontend just no longer needs it.

**Step 2 - a single self-contained HTML file.** Added `vite-plugin-singlefile` and a separate build target (`vite.share.config.ts`, kept apart from the normal `vite.config.ts` since inlining everything - including jsPDF, normally lazy-loaded - is a deliberate trade-off only worth making for this use case).
- `npm run build:share` → `apps/frontend/dist-share/index.html`, one ~940KB file with every script/style inlined, zero external references (verified: no external `src`/`href`, only `data:` URIs)
- Confirmed the inlined script is a self-contained `type="module"` block with jsPDF's dynamic `import()` fully inlined (no separate chunk left to fetch), so it opens correctly via `file://` - tested by double-clicking it directly
- Sent this file to the user directly (it's small enough to deliver as a chat attachment, unlike the earlier 89MB `.exe` attempt)

**Step 3 - also published it as a hosted, shareable link.** Since a link is often more convenient to share than a file, additionally published the same build as a Claude Artifact.
- Stripped the `<!doctype>`/`<html>`/`<head>`/`<body>` wrapper tags (Artifacts supply their own) via `sed`, keeping the `<title>`, inlined `<style>`, inlined `<script>`, and `<div id="root">`
- Before publishing, checked the app's existing CSS against the Artifact theming contract - it already had a real, deliberate design system (the notebook-paper look, drawn from the source photo, with light/dark tokens), so left the palette/typography alone entirely and only added the two guard rules Artifacts specifically need: `@media (prefers-color-scheme: dark) { :root:not([data-theme='light']) {...} }` and `:root[data-theme='dark'] {...}`, so an explicit light/dark choice in the Artifact viewer overrides the OS setting correctly
- First publish surfaced a real gap: the "Download PDF" button calls `doc.save()`, which triggers a direct browser download - silently blocked inside the Artifact sandbox. Fixed by routing PDF saves through the platform's `downloads` capability when available (`apps/frontend/src/pdfExport.ts` - `savePdf()` tries `window.claude.use('downloads')` first, falls back to the normal direct download everywhere else, since `window.claude` doesn't exist at all outside a Claude surface - the local dev app, the standalone shared file, or any other hosting)
- Declared `capabilities: {downloads: true}` on republish; the platform's warning about the blocked download link was gone on the next publish

**Verified:** `npm run build -w @modal-interchange/frontend` (normal build) and `npm run build:share` both type-check and build clean; confirmed the single-file build has no external references; confirmed the Artifact republish carried no capability warnings after the `downloads` fix.
