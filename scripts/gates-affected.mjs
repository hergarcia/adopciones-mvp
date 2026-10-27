#!/usr/bin/env node
// La compuerta de las rondas intermedias de una historia (cada user story, cada arreglo): lint,
// typecheck, solo las pruebas y la mutación de lo que cambió desde una base, y el build con los e2e
// que tocan lo cambiado. La suite completa corre una vez al cerrar el build (`pnpm verify`) y en CI.
//   node scripts/gates-affected.mjs [--base <ref>] [--retry] [--no-fetch] [--dry-run]
// La base por omisión es origin/main; una user story pasa el commit en que empezó. Después de un
// arreglo, --retry con la misma base corre lo que quedó rojo y lo que cambió el arreglo, nada más.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { pendingAfter, planGates, planRetry } from './gates/plan.mjs'
import { reportSkips, resetSkips } from './gates/skips.mjs'
import { clearReports, failedFiles, readState, snapshot, writeState } from './gates/state.mjs'
import { firstRunSteps, retrySteps } from './gates/steps.mjs'

const argv = process.argv.slice(2)
const baseIdx = argv.indexOf('--base')
const base = baseIdx >= 0 ? argv[baseIdx + 1] : 'origin/main'
const dryRun = argv.includes('--dry-run')

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim()
const slash = (p) => p.replaceAll('\\', '/')
const lines = (s) =>
  s
    .split('\n')
    .map((l) => slash(l.trim()))
    .filter(Boolean)

if (!argv.includes('--no-fetch') && base.startsWith('origin/')) {
  git('fetch', '--quiet', 'origin', base.slice('origin/'.length))
}
const mergeBase = git('merge-base', base, 'HEAD')

const last = argv.includes('--retry') ? readState(mergeBase) : null
const tree = snapshot()
const E2E_DIR = 'tests/e2e'
const specs = existsSync(E2E_DIR)
  ? readdirSync(E2E_DIR)
      .filter((f) => f.endsWith('.spec.ts'))
      .map((f) => `${E2E_DIR}/${f}`)
  : []

let steps
let e2e
let summary
if (last) {
  const fixChanged = lines(git('diff', '--name-only', last.tree, tree))
  const retry = planRetry(last.pending, fixChanged, specs)
  e2e = retry.e2e
  steps = retrySteps(retry, fixChanged, mergeBase)
  summary = `reintento sobre la corrida anterior, ${fixChanged.length} archivo(s) cambiados por el arreglo`
} else {
  const changed = [
    ...new Set([
      ...lines(git('diff', '--name-only', `${mergeBase}..HEAD`)),
      ...lines(git('diff', '--name-only', 'HEAD')),
      ...lines(git('ls-files', '--others', '--exclude-standard')),
    ]),
  ]
  const plan = planGates(changed, specs)
  e2e = plan.e2e
  steps = firstRunSteps(plan, mergeBase)
  summary = `base ${base} (${mergeBase.slice(0, 8)}), ${changed.length} archivo(s) cambiados`
}

console.log(`gates:affected — ${summary}`)
if (argv.includes('--retry') && !last) {
  console.log('  (sin una corrida anterior con esta base: corre la compuerta entera)')
}
for (const { label, run } of steps) console.log(`  · ${label}: ${run.cmd} ${run.args.join(' ')}`)
if (dryRun) process.exit(0)

clearReports()
resetSkips()
const failed = []
const passed = []
const failedTestFiles = []
let testsCrashed = false
for (const step of steps) {
  if (step.afterTests && failed.some((f) => f.tests)) continue
  if (step.afterBuild && failed.some((f) => f.label === 'build')) continue
  console.log(`\n=== ${step.label} ===`)
  const result = spawnSync(step.run.cmd, step.run.args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  if (result.status === 0) {
    passed.push(step)
    continue
  }
  failed.push(step)
  if (step.json) {
    const files = failedFiles(step.json)
    if (files.length) failedTestFiles.push(...files)
    else testsCrashed = true
  }
}
writeState({
  mergeBase,
  tree,
  pending: pendingAfter({
    failedTestFiles,
    testsCrashed,
    mutationPassed: passed.some((s) => s.mutation) || !steps.some((s) => s.mutation),
    e2ePassed: passed.some((s) => s.e2e) || !steps.some((s) => s.e2e),
    e2e,
  }),
})
console.log(
  failed.length
    ? `\ngates:affected: ROJO — ${failed.map((f) => f.label).join(', ')}\n` +
        `Después del arreglo: pnpm gates:affected --base ${base} --retry`
    : '\ngates:affected: verde',
)
reportSkips()
process.exit(failed.length ? 1 : 0)
