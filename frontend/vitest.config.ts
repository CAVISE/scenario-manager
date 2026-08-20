import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    clearMocks: true,
    exclude: ['**/node_modules/**', '**/tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/tests/e2e/**'],
      thresholds: {
        lines: 35,
        functions: 30,
        branches: 30,
        statements: 35,
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@hooks': '/src/hooks',
      '@utils': '/src/utils',
      '@store': '/src/store',
      '@types': '/src/types',
      '@assets': '/src/assets',
      '@editor': '/src/pages/Editor',
      '@editor-components': '/src/pages/Editor/components',
      '@editor-hooks': '/src/pages/Editor/hooks',
      '@right-panel': '/src/pages/components/RightPanel',
    },
  },
});
