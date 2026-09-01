import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import svgr from 'vite-plugin-svgr';
import compression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => ({
  resolve: {
    tsconfigPaths: true,
  },

  server: {
    port: 3000,
    open: true,
    strictPort: false,
    hmr: {
      overlay: true,
    },
  },

  plugins: [
    react(),

    svgr({
      svgrOptions: {
        icon: true,
      },
    }),

    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),

    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),

    ...(mode === 'analyze'
      ? [
          visualizer({
            open: true,
            gzipSize: true,
            brotliSize: true,
            filename: 'dist/stats.html',
            template: 'treemap',
          }),
        ]
      : []),
  ],

  build: {
    // minify: false,
    // sourcemap: true,
    sourcemap: mode === 'production' ? 'hidden' : true,
    chunkSizeWarningLimit: 1000,
    minify: mode === 'production' ? 'esbuild' : false,

    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',

        codeSplitting: {
          groups: [
            {
              name: 'vendor-three',
              test: /\/three\//,
            },
            {
              name: 'vendor-react',
              test: /\/react(?:-dom)?\//,
            },
            {
              name: 'vendor-router',
              test: /\/react-router(?:-dom)?\//,
            },
            {
              name: 'vendor-emotion',
              test: /\/@emotion\//,
            },
            {
              name: 'vendor-mui',
              test: /\/@mui\//,
            },
            {
              name: 'vendor-zustand',
              test: /\/zustand\//,
            },
            {
              name: 'vendor-common',
              test: /\/node_modules\//,
            },
            {
              name: 'pages',
              test: /\/src\/pages\//,
            },
          ],
        },
      },
      external: [],
    },
    target: 'es2020',
    emptyOutDir: true,
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'three',
      'zustand',
    ],
    exclude: ['three-stdlib'],
  },

  css: {
    modules: {
      localsConvention: 'camelCase',
      generateScopedName:
        mode === 'production'
          ? '[hash:base64:8]'
          : '[name]__[local]__[hash:base64:5]',
    },
    preprocessorOptions: {
      scss: {
        loadPaths: ['./src'],
        additionalData: `@use "styles/variables" as *;`,
      },
    },
  },

  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
}));
