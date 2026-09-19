// Mutation gate: 100 % on every file that has a test (docs/09 §Cada test prueba lo que dice probar).
// scripts/mutation.mjs narrows `mutate` to tested files, passes them with --mutate, and puts the
// matching test files in STRYKER_TEST_COMMAND.
//
// The command runner, not the vitest runner (decision 2026-09-19, F01). The vitest runner never
// activates a mutant against Vitest 5: it instruments the file, runs the tests and every mutant
// survives, so the gate reported 0 % and could never pass. F00 could not have seen it — there was
// nothing to mutate. Details and the reopening condition in docs/known-limitations.md (KL-008).
const TEST_COMMAND = process.env.STRYKER_TEST_COMMAND ?? 'pnpm exec vitest run'

/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  testRunner: 'command',
  commandRunner: { command: TEST_COMMAND },
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
  // The command runner cannot report which test covered which mutant, so every mutant runs the
  // whole (narrow) command. `ignoreStatic` needs per-test coverage, so it goes too.
  coverageAnalysis: 'off',
  ignoreStatic: false,
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  thresholds: { high: 100, low: 100, break: 100 },
  reporters: ['clear-text', 'progress', 'html', 'json'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  jsonReporter: { fileName: 'reports/mutation/report.json' },
  tempDirName: '.stryker-tmp',
  timeoutMS: 60000,
}
