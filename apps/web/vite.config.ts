/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const workspacePackages = [
  '@infinite-radio/shared',
  '@infinite-radio/composition-engine',
  '@infinite-radio/audio-engine',
  '@infinite-radio/stations',
  '@infinite-radio/design-system',
]

export default defineConfig({
  plugins: [react()],
  // Workspace packages ship TypeScript source; let Vite transform it directly
  // instead of pre-bundling so types and implementations never drift.
  optimizeDeps: {
    exclude: workspacePackages,
  },
  // Playwright writes traces and error contexts into test-results/ during
  // e2e runs; watching them would trigger full-page reloads mid-test.
  server: {
    watch: {
      ignored: ['**/test-results/**', '**/playwright-report/**'],
    },
  },
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    css: false,
  },
})
