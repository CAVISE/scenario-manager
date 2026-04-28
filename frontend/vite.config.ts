import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 35,
        functions: 30,
        branches: 30,
        statements: 35,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', 'three-stdlib'],
          mui: ['@mui/material', '@mui/icons-material', '@mui/joy'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
