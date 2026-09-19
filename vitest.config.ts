import { defineConfig } from 'vitest/config'

export default defineConfig({
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
