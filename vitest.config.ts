import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // El mismo alias que tsconfig: lo que se prueba tiene que resolverse igual que lo que se
  // compila, y las reglas de capas del lint leen `@/`, así que el código fuente lo usa.
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs', 'tests/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'tests/gates/fixtures/**'],
    globalSetup: ['tests/setup/global-notice.ts'],
    setupFiles: ['tests/setup/env-report.ts'],
    // Las suites de base y las de compuertas lanzan procesos externos; en paralelo se pisan.
    fileParallelism: false,
    passWithNoTests: false,
  },
})
