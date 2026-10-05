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
    exclude: ['node_modules', '.next', 'tests/gates/fixtures/**'],
    globalSetup: ['tests/setup/global-notice.ts'],
    setupFiles: ['tests/setup/env-report.ts'],
    passWithNoTests: false,
    // Tres proyectos para que el gancho de commit nombre lo que corre (`--project unit --project
    // gates`, segundos) sin mantener una lista aparte: las de base tardan minutos y van en
    // gates:affected, `pnpm verify` y CI. Las de compuertas lanzan procesos y las de base comparten
    // la base local, así que cada una corre en serie, y las de base cuando terminaron las otras.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: 'gates',
          include: ['tests/gates/**/*.test.ts'],
          fileParallelism: false,
          sequence: { groupOrder: 0 },
        },
      },
      {
        extends: true,
        test: {
          name: 'db',
          include: ['tests/db/**/*.test.ts'],
          fileParallelism: false,
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
})
