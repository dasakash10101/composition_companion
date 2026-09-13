import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * A separate build target from the normal `vite build`: inlines every JS
 * and CSS asset directly into one `dist-share/index.html`, so the whole app
 * can be shared as a single file that opens straight in any browser via
 * file:// - no server, no install, no internet connection required.
 *
 * Kept separate from vite.config.ts because inlining everything (including
 * jsPDF, which is normally lazy-loaded as its own chunk - see pdfExport.ts)
 * is a deliberate size/caching trade-off that only makes sense for this
 * "hand someone one file" use case, not for normal dev or a real static host.
 */
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-share',
  },
});
