// Qué corre `pnpm gates:affected` según los archivos que cambiaron. Lint, typecheck y la mutación
// de lo cambiado corren siempre; acá se decide el resto.

// Las pruebas de base leen el esquema migrado, no importan las migraciones: `vitest --changed`
// nunca las elegiría por un cambio en supabase/. Lo mismo con la configuración y el arranque.
const WHOLE_SUITE = [
  /^package\.json$/,
  /^pnpm-(lock|workspace)\.yaml$/,
  /^tsconfig[^/]*\.json$/,
  /^vitest\.config\.ts$/,
  /^supabase\//,
  /^tests\/setup\//,
]

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
