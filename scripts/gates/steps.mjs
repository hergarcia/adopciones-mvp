// Los pasos de gates:affected: el comando de cada uno y qué se mira de su resultado.
import { existsSync } from 'node:fs'
import { OUT } from './state.mjs'

/** @param {string} cmd @param {string[]} args */
const command = (cmd, args) => ({ cmd, args })
let reports = 0
// Cada paso de pruebas deja su reporte: de ahí sale qué archivo falló, para el reintento.
const vitest = (...args) => {
  const json = `${OUT}/vitest-${++reports}.json`
  return {
    run: command('pnpm', [
      'exec',
      'vitest',
      ...args,
      '--reporter=dot',
      '--reporter=json',
      `--outputFile.json=${json}`,
    ]),
    json,
    tests: true,
  }
}
const mutation = (...args) => ({
  label: 'mutation',
  run: command('node', ['scripts/mutation.mjs', ...args]),
  afterTests: true,
  mutation: true,
})
// Las compuertas leen el árbol con fs: ningún archivo cambiado entra en su grafo de imports, así
// que --changed nunca las elige.
const gatesProject = () => ({ label: 'test (compuertas)', ...vitest('run', '--project', 'gates') })
const statics = () => [
  { label: 'lint', run: command('pnpm', ['lint']) },
  { label: 'typecheck', run: command('pnpm', ['typecheck']) },
]

/** @param {'all' | string[]} e2e */
function e2eSteps(e2e) {
  if (e2e !== 'all' && !e2e.length) return []
  return [
    { label: 'build', run: command('pnpm', ['build']) },
    {
      label: e2e === 'all' ? 'e2e (todos)' : `e2e (${e2e.length})`,
      run: command('node', ['scripts/e2e.mjs', '--reporter=line', ...(e2e === 'all' ? [] : e2e)]),
      afterBuild: true,
      e2e: true,
    },
  ]
}

/** @param {{ wholeSuite: boolean, e2e: 'all' | string[] }} plan @param {string} mergeBase */
export function firstRunSteps(plan, mergeBase) {
  return [
    ...statics(),
    plan.wholeSuite
      ? { label: 'test (entera: cambió la base, la config o el arranque)', ...vitest('run') }
      : {
          label: 'test (lo cambiado)',
          ...vitest('run', '--changed', mergeBase, '--passWithNoTests'),
        },
    ...(plan.wholeSuite ? [] : [gatesProject()]),
    mutation('--base', mergeBase),
    ...e2eSteps(plan.e2e),
  ]
}

/**
 * @param {ReturnType<typeof import('./plan.mjs').planRetry>} retry
 * @param {string[]} fixChanged
 * @param {string} mergeBase
 */
export function retrySteps(retry, fixChanged, mergeBase) {
  const steps = statics()
  if (retry.wholeSuite) {
    steps.push({
      label: 'test (entera: el arreglo cambió la config o el arranque)',
      ...vitest('run'),
    })
  } else {
    if (retry.failedTests.length) {
      steps.push({ label: 'test (lo que falló)', ...vitest('run', ...retry.failedTests) })
    }
    const touched = fixChanged.filter((f) => existsSync(f))
    if (touched.length) {
      steps.push({
        label: 'test (lo que cambió el arreglo)',
        ...vitest('related', '--run', '--passWithNoTests', ...touched),
      })
    }
    steps.push(gatesProject())
  }
  if (retry.mutation === 'pending') steps.push(mutation('--base', mergeBase))
  else if (fixChanged.length) steps.push(mutation('--files', fixChanged.join(',')))
  steps.push(...e2eSteps(retry.e2e))
  return steps
}
