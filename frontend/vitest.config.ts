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
    tsconfigPaths: true,
  },
});
