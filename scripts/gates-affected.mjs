#!/usr/bin/env node
// La compuerta de las rondas intermedias de una historia (cada user story, cada arreglo): lint,
// typecheck, solo las pruebas y la mutación de lo que cambió desde una base, y el build con los e2e
// que tocan lo cambiado. La suite completa corre una vez al cerrar el build (`pnpm verify`) y en CI.
//   node scripts/gates-affected.mjs [--base <ref>] [--no-fetch] [--dry-run]
// La base por omisión es origin/main; una user story pasa el commit en que empezó.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { planGates } from './gates/plan.mjs'
import { reportSkips, resetSkips } from './gates/skips.mjs'

const argv = process.argv.slice(2)
const baseIdx = argv.indexOf('--base')
const base = baseIdx >= 0 ? argv[baseIdx + 1] : 'origin/main'
const dryRun = argv.includes('--dry-run')

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const lines = (s) =>
  s
    .split('\n')
    .map((l) => l.trim().replaceAll('\\', '/'))
    .filter(Boolean)

if (!argv.includes('--no-fetch') && base.startsWith('origin/')) {
  git('fetch', '--quiet', 'origin', base.slice('origin/'.length))
}
const mergeBase = git('merge-base', base, 'HEAD')
const changed = [
  ...new Set([
    ...lines(git('diff', '--name-only', `${mergeBase}..HEAD`)),
    ...lines(git('diff', '--name-only', 'HEAD')),
    ...lines(git('ls-files', '--others', '--exclude-standard')),
  ]),
]
const E2E_DIR = 'tests/e2e'
const specs = existsSync(E2E_DIR)
  ? readdirSync(E2E_DIR)
      .filter((f) => f.endsWith('.spec.ts'))
      .map((f) => `${E2E_DIR}/${f}`)
  : []
const plan = planGates(changed, specs)

/** @param {string} cmd @param {string[]} args */
const command = (cmd, args) => ({ cmd, args })
const vitest = (...args) => command('pnpm', ['exec', 'vitest', 'run', '--reporter=dot', ...args])
const steps = [
  { label: 'lint', run: command('pnpm', ['lint']) },
  { label: 'typecheck', run: command('pnpm', ['typecheck']) },
  plan.wholeSuite
    ? {
        label: 'test (entera: cambió la base, la config o el arranque)',
        run: vitest(),
        tests: true,
      }
    : {
        label: 'test (lo cambiado)',
        run: vitest('--changed', mergeBase, '--passWithNoTests'),
        tests: true,
      },
  // Las compuertas leen el árbol con fs: ningún archivo cambiado entra en su grafo de imports, así
  // que --changed nunca las elige.
  ...(plan.wholeSuite
    ? []
    : [{ label: 'test (compuertas)', run: vitest('--project', 'gates'), tests: true }]),
  {
    label: 'mutation',
    run: command('node', ['scripts/mutation.mjs', '--base', mergeBase]),
    afterTests: true,
  },
]
if (plan.e2e === 'all' || plan.e2e.length) {
  steps.push(
    { label: 'build', run: command('pnpm', ['build']) },
    {
      label: plan.e2e === 'all' ? 'e2e (todos)' : `e2e (${plan.e2e.length})`,
      run: command('node', [
        'scripts/e2e.mjs',
        '--reporter=line',
        ...(plan.e2e === 'all' ? [] : plan.e2e),
      ]),
      afterBuild: true,
    },
  )
}

console.log(
  `gates:affected — base ${base} (${mergeBase.slice(0, 8)}), ${changed.length} archivo(s) cambiados`,
)
for (const { label, run } of steps) console.log(`  · ${label}: ${run.cmd} ${run.args.join(' ')}`)
if (dryRun) process.exit(0)

resetSkips()
const failed = []
for (const step of steps) {
  if (step.afterTests && failed.some((f) => f.tests)) continue
  if (step.afterBuild && failed.some((f) => f.label === 'build')) continue
  console.log(`\n=== ${step.label} ===`)
  const result = spawnSync(step.run.cmd, step.run.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status !== 0) failed.push(step)
}
console.log(
  failed.length
    ? `\ngates:affected: ROJO — ${failed.map((f) => f.label).join(', ')}`
    : '\ngates:affected: verde',
)
reportSkips()
process.exit(failed.length ? 1 : 0)
