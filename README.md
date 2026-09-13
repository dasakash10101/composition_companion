# Modal Interchange Explorer

A locally-hosted playground for experimenting with **modal interchange**
(borrowing chords from the parallel modes of a shared tonic). It reproduces
the "Major Scale Chords" reference chart — one row per mode, one column per
scale degree (I–VII) — lets you type any key to see every roman numeral
resolved into a real chord, and includes a drag-and-drop chord chart builder
with audio preview and PDF export.

## Folder structure

```
modal_interchange/
├── packages/
│   └── shared/                 # Framework-free music theory engine (TS), used by the frontend (and the standalone API)
│       └── src/
│           ├── notes.ts        # pitch classes, note-name parsing, transposition
│           ├── modes.ts        # the 7 modes as semitone formulas + roman numeral accidentals
│           ├── chords.ts       # diatonic 7th-chord quality derivation (maj7/min7/7/min7b5/...)
│           └── table.ts        # combines the above into the full chart data structure
├── apps/
│   ├── backend/                 # Express + TypeScript API - standalone, optional (see below)
│   │   └── src/
│   │       ├── server.ts
│   │       └── routes/modalInterchange.ts   # GET /api/modes, /api/table?key=..., /api/modes/:name
│   └── frontend/                # React + Vite + TypeScript UI - fully client-side, no backend required
│       ├── vite.config.ts       # normal dev/build config
│       ├── vite.share.config.ts # single-file build config (see "Sharing the app")
│       └── src/
│           ├── App.tsx
│           ├── modalInterchangeEngine.ts     # computes the chart in the browser
│           ├── audio.ts                      # Web Audio synth for chord playback
│           ├── pdfExport.ts                  # renders the chart to a downloadable PDF
│           ├── chartTypes.ts                 # chord/bar/section data model
│           └── components/
│               ├── KeyInput.tsx              # the text input that drives the chart
│               ├── ModalInterchangeTable.tsx # renders the chart (drag/click source + play)
│               ├── ChordChartBuilder.tsx     # the chart builder (sections, PDF export)
│               ├── ChartSection.tsx          # one song section (label, time sig, tempo, bars)
│               └── ChartBar.tsx              # one bar - a drop target
└── package.json                  # npm workspaces root
```

## How the "variables fed from a text input" part works

The roman-numeral chart (`I maj7`, `♭III maj7`, `♭VII 7`, etc.) is always
computed from music theory alone and never changes. The **key/tonic you type**
into the text input is the one variable that feeds through every cell:
`modalInterchangeEngine.ts` resolves each roman numeral's interval against
that root note directly in the browser, and each cell renders both the roman
numeral *and* the real chord name (e.g. typing `Bb` turns `♭III maj7` into
`Dbmaj7`).

## Prerequisites

- Node.js 18+
- npm 9+

## Setup

```bash
npm install
```

This installs dependencies for the root, `packages/shared`, `apps/backend`,
and `apps/frontend` in one pass (npm workspaces).

## Running locally

```bash
npm run dev
```

This builds the shared package once, then starts (concurrently):

- **shared** — `tsc --watch`, so edits to the music theory engine rebuild instantly
- **backend** — Express API on **http://localhost:4000** (optional - the frontend doesn't call it; see below)
- **frontend** — Vite dev server on **http://localhost:5173**

Open **http://localhost:5173** in your browser.

## Sharing the app

The frontend computes everything itself (music theory, audio, PDF export) -
it never calls the backend. That makes it possible to build it as a **single
self-contained HTML file** that opens directly in any browser, offline, with
nothing installed:

```bash
npm run build:share
```

This produces `apps/frontend/dist-share/index.html` - every script and
style inlined into one file (~900KB) via `vite-plugin-singlefile`. Send that
one file to anyone; they double-click it (or drag it into a browser window)
and the whole app - table, drag-and-drop chart builder, chord playback, PDF
export - just works. No server, no install, no internet connection required.

(The backend's standalone API - see below - is unrelated to this; it's not
needed for the app to run, shared or otherwise.)

## Backend API (optional, standalone)

The Express API in `apps/backend` isn't used by the frontend, but still
works on its own if you want the same music theory engine over HTTP:

```bash
npm run dev:backend
```

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/modes` | Mode metadata + the roman-numeral-only chart |
| `GET /api/table?key=C` | Full chart resolved to a real key (`C`, `F#`, `Bb`, etc.) |
| `GET /api/modes/:modeName?key=C` | A single mode's row, e.g. `/api/modes/Dorian?key=G` |

## Production build

```bash
npm run build   # builds shared, backend, and frontend (multi-file, code-split)
npm start       # runs the built backend's standalone API
npm run preview -w @modal-interchange/frontend   # preview the built frontend
```
