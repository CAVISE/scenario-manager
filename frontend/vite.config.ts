import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => ({
  legacy: {
    inconsistentCjsInterop: true,
  },

  plugins: [
    react(),
    ...(mode === 'analyze'
      ? [
          visualizer({
            open: false,
            gzipSize: true,
            brotliSize: true,
            filename: 'dist/stats.html',
          }),
        ]
      : []),
  ],

  build: {
    sourcemap: mode === 'analyze',
    chunkSizeWarningLimit: 700,

    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');
          const isPackage = (name: string) =>
            normalizedId.includes(`/node_modules/${name}/`);

          if (isPackage('@mui/icons-material')) return 'icons';
          if (isPackage('react') || isPackage('react-dom')) {
            return 'react-vendor';
          }
          if (isPackage('react-router-dom')) return 'router';
          if (
            isPackage('@mui/material') ||
            isPackage('@mui/system') ||
            isPackage('@emotion/react') ||
            isPackage('@emotion/styled') ||
            isPackage('@emotion/cache')
          ) {
            return 'mui';
          }
          if (isPackage('three-stdlib')) return 'three-stdlib';
          if (isPackage('three')) return 'three';
        },
      },
    },
  },
}));
