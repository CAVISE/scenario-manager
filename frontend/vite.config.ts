import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],

  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 700,

    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          router: ['react-router-dom'],
          mui: [
            '@mui/material',
            '@mui/joy',
            '@mui/system',
            '@mui/base',
            '@emotion/react',
            '@emotion/styled',
            '@emotion/cache',
          ],
          icons: ['@mui/icons-material'],
          three: ['three'],
          'three-stdlib': ['three-stdlib'],
        },
      },
    },
  },
});
