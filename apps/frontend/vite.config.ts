import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      // dist-share/ (built by `npm run build:share`) sits inside this
      // project root; without this, the dev server's watcher treats its
      // own build output as source and triggers spurious full-page reloads.
      ignored: ['**/dist-share/**'],
    },
  },
  optimizeDeps: {
    // @modal-interchange/shared is a symlinked workspace package, so Vite's
    // dev server treats it as project source rather than a dependency and
    // skips converting its compiled CommonJS output to ESM - which breaks
    // with "exports is not defined" the moment anything imports a runtime
    // value (not just a type) from it. Forcing it into the pre-bundle step
    // fixes that.
    include: ['@modal-interchange/shared'],
  },
});
