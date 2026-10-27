// Qué corre `pnpm gates:affected` según los archivos que cambiaron. Lint, typecheck y la mutación
// de lo cambiado corren siempre; acá se decide el resto.

// Las pruebas de base leen el esquema migrado, no importan las migraciones: `vitest --changed`
// nunca las elegiría por un cambio en supabase/. Lo mismo con la configuración y el arranque.
const CONFIG = [
  /^package\.json$/,
  /^pnpm-(lock|workspace)\.yaml$/,
  /^tsconfig[^/]*\.json$/,
  /^vitest\.config\.ts$/,
  /^tests\/setup\//,
]
const WHOLE_SUITE = [...CONFIG, /^supabase\//]

const SCREEN = [
  /^src\/(?!.*\.test\.tsx?$).*\.(tsx|css)$/,
  /^src\/app\//,
  /^messages\//,
  /^public\//,
  /^next\.config\./,
]

const ALL_E2E = [/^tests\/e2e\/support\//, /^playwright\.config\.ts$/]

const SPEC = /^tests\/e2e\/[^/]+\.spec\.ts$/
// El presupuesto de peso (150 KB de JS inicial) solo se mide en estos specs: cualquier cambio de
// pantalla puede romperlo, y en #95 un arreglo lo rompió sin que ninguna ronda lo viera hasta CI.
const BUDGET = /-rendimiento\.spec\.ts$/

const touches = (changed, patterns) => changed.some((file) => patterns.some((re) => re.test(file)))

/**
 * @param {string[]} changed archivos cambiados respecto de la base, con `/`
 * @param {string[]} specs todos los specs de tests/e2e, con `/`
 * @returns {{ wholeSuite: boolean, e2e: 'all' | string[] }} sin specs, no hace falta el build
 */
export function planGates(changed, specs) {
  const wholeSuite = touches(changed, WHOLE_SUITE)
  if (touches(changed, ALL_E2E)) return { wholeSuite, e2e: 'all' }
  const selected = new Set(changed.filter((file) => SPEC.test(file) && specs.includes(file)))
  if (touches(changed, SCREEN))
    for (const spec of specs.filter((s) => BUDGET.test(s))) selected.add(spec)
  return { wholeSuite, e2e: [...selected].sort() }
}

/**
 * Lo que dejó pendiente una corrida, para que el reintento lo vuelva a correr con el mismo alcance.
 * @typedef {{ tests: { whole: boolean, files: string[] }, mutation: boolean, e2e: 'all' | string[] }} Pending
 */

/**
 * El reintento después de un arreglo: lo que quedó rojo, con el alcance que tenía, y lo que tocó el
 * arreglo. Un arreglo a una migración no vuelve a pedir la suite entera, que ya corrió una vez: corre
 * la prueba que falló, y la suite entera queda para el cierre y el CI. Un cambio de configuración
 * sí la pide, porque puede romper cualquier prueba.
 * @param {Pending} pending
 * @param {string[]} fixChanged archivos que cambió el arreglo desde la corrida anterior, con `/`
 * @param {string[]} specs todos los specs de tests/e2e, con `/`
 * @returns {{ wholeSuite: boolean, failedTests: string[], mutation: 'pending' | 'fix', e2e: 'all' | string[] }}
 */
export function planRetry(pending, fixChanged, specs) {
  const wholeSuite = pending.tests.whole || touches(fixChanged, CONFIG)
  const fix = planGates(fixChanged, specs)
  const e2e =
    pending.e2e === 'all' || fix.e2e === 'all'
      ? 'all'
      : [...new Set([...pending.e2e, ...fix.e2e])].sort()
  return {
    wholeSuite,
    failedTests: wholeSuite ? [] : pending.tests.files,
    mutation: pending.mutation ? 'pending' : 'fix',
    e2e,
  }
}

/**
 * Qué deja pendiente una corrida para el reintento.
 * @param {{ failedTestFiles: string[], testsCrashed: boolean, mutationPassed: boolean, e2ePassed: boolean, e2e: 'all' | string[] }} run
 *   testsCrashed: un paso de pruebas falló sin nombrar un archivo (el arranque, la configuración)
 * @returns {Pending}
 */
export function pendingAfter(run) {
  return {
    tests: {
      whole: run.testsCrashed,
      files: run.testsCrashed ? [] : [...new Set(run.failedTestFiles)].sort(),
    },
    mutation: !run.mutationPassed,
    e2e: run.e2ePassed ? [] : run.e2e,
  }
}
