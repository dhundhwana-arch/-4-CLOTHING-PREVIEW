import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Library build: bundles the reusable Module 04 preview engine
// (src/index.ts) for consumption by Module 01 (custom-shirt-studio).
// React and three are peer-level externals of the host application.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-lib',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Shirt3DPreview',
      formats: ['es'],
      fileName: () => 'shirt-3d-preview.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'three', '@react-three/fiber', '@react-three/drei'],
    },
  },
});
