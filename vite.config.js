/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react({ jsxRuntime: 'automatic' })],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    css: false,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        'src/test/**',
        'src/main.jsx',
        'src/router/**',
      ],
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const normalized = id.replace(/\\/g, '/');
            const packagePath = normalized.split('/node_modules/')[1] || '';

            if (packagePath.startsWith('react/') ||
                packagePath.startsWith('react-dom/') ||
                packagePath.startsWith('react-router-dom/')) {
              return 'vendor-react';
            }
            if (packagePath.startsWith('chart.js/') ||
                packagePath.startsWith('react-chartjs-2/') ||
                packagePath.startsWith('lightweight-charts/')) {
              return 'vendor-chart';
            }
            if (packagePath.startsWith('@stomp/') ||
                packagePath.startsWith('sockjs-client/')) {
              return 'vendor-stomp';
            }
            if (packagePath.startsWith('mermaid/') ||
                packagePath.startsWith('@mermaid-js/')) {
              return 'vendor-docs-mermaid';
            }
            if (packagePath.startsWith('marked/') ||
                packagePath.startsWith('github-markdown-css/')) {
              return 'vendor-docs-markdown';
            }
            if (packagePath.startsWith('@tanstack/react-query/') ||
                packagePath.startsWith('axios/') ||
                packagePath.startsWith('zustand/')) {
              return 'vendor-data';
            }

            const parts = packagePath.split('/');
            const packageName = packagePath.startsWith('@')
              ? `${parts[0]}-${parts[1]}`
              : parts[0];
            return `vendor-${packageName.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
          }
        },
      },
    },
  },
})
