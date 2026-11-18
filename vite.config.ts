import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Demo-application build (index.html at repository root).
// The reusable library entry point is src/index.ts (see vite.lib.config.ts).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
