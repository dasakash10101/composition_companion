# Modal Interchange Explorer

A locally-hosted playground for experimenting with **modal interchange**
(borrowing chords from the parallel modes of a shared tonic). It reproduces
the "Major Scale Chords" reference chart — one row per mode, one column per
scale degree (I–VII) — and lets you type any key into a text input to see
every roman numeral resolved into a real chord name for that key.

## Folder structure

```
modal_interchange/
├── packages/
│   └── shared/            # Framework-free music theory engine (TS), used by both apps
│       └── src/
│           ├── notes.ts   # pitch classes, note-name parsing, transposition
│           ├── modes.ts   # the 7 modes as semitone formulas + roman numeral accidentals
│           ├── chords.ts  # diatonic 7th-chord quality derivation (maj7/min7/7/min7b5/...)
│           └── table.ts   # combines the above into the full chart data structure
├── apps/
│   ├── backend/            # Express + TypeScript API
│   │   └── src/
│   │       ├── server.ts
│   │       └── routes/modalInterchange.ts   # GET /api/modes, /api/table?key=..., /api/modes/:name
│   └── frontend/           # React + Vite + TypeScript UI
│       └── src/
│           ├── App.tsx
│           ├── api.ts
│           └── components/
│               ├── KeyInput.tsx              # the text input that drives the chart
│               └── ModalInterchangeTable.tsx # renders the chart
└── package.json             # npm workspaces root
```

## How the "variables fed from a text input" part works

The roman-numeral chart (`I maj7`, `♭III maj7`, `♭VII 7`, etc.) is always
computed from music theory alone and never changes. The **key/tonic you type**
into the text input is the one variable that feeds through every cell: the
frontend sends it to `GET /api/table?key=<note>`, the backend resolves each
roman numeral's interval against that root note, and each cell renders both
the roman numeral *and* the real chord name (e.g. typing `Bb` turns `♭III maj7`
into `Dbmaj7`).

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
- **backend** — Express API on **http://localhost:4000**
- **frontend** — Vite dev server on **http://localhost:5173**

Open **http://localhost:5173** in your browser.

## API reference

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/modes` | Mode metadata + the roman-numeral-only chart |
| `GET /api/table?key=C` | Full chart resolved to a real key (`C`, `F#`, `Bb`, etc.) |
| `GET /api/modes/:modeName?key=C` | A single mode's row, e.g. `/api/modes/Dorian?key=G` |

## Production build

```bash
npm run build   # builds shared, backend, and frontend
npm start       # runs the built backend (serves the API only)
npm run preview -w @modal-interchange/frontend   # preview the built frontend
```
