// Mutation gate: 100 % on every file that has a test (docs/09 §Cada test prueba lo que dice probar).
// scripts/mutation.mjs narrows `mutate` to tested files and passes them with --mutate.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.config.ts' },
  plugins: ['@stryker-mutator/vitest-runner'],
  // TypeScript 7 dropped the classic compiler API: the typescript checker cannot run, and the
  // sandbox copy crashes rewriting tsconfig.json, so Stryker mutates in place and restores.
  inPlace: true,
  mutate: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**',
    '!src/components/ui/**',
    '!src/lib/supabase/types.ts',
    '!src/styles/**',
  ],
  coverageAnalysis: 'perTest',
  ignoreStatic: true,
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  thresholds: { high: 100, low: 100, break: 100 },
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/report.json' },
  tempDirName: '.stryker-tmp',
  timeoutMS: 20000,
}
