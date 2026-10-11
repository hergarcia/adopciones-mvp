// Lighthouse con @lhci/cli y los mismos `settings` que la compuerta (.lighthouserc.json): teléfono de
// 390 px y red simulada. Corre en una carpeta temporal para no mezclarse con `pnpm lighthouse`.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const RUNS = 3
const LHCI = createRequire(import.meta.url).resolve('@lhci/cli/src/cli.js')

function median(values) {
  const sorted = values.toSorted((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function readResults(dir) {
  const results = join(dir, '.lighthouseci')
  if (!existsSync(results)) return []
  return readdirSync(results)
    .filter((file) => /^lhr-.*\.json$/.test(file))
    .map((file) => JSON.parse(readFileSync(join(results, file), 'utf8')))
}

function summary(lhrs) {
  const runs = lhrs.filter((lhr) => typeof lhr.categories?.performance?.score === 'number')
  if (runs.length === 0) return null
  return {
    runs: runs.length,
    lcp: median(runs.map((lhr) => lhr.audits['largest-contentful-paint'].numericValue)),
    score: Math.round(median(runs.map((lhr) => lhr.categories.performance.score)) * 100),
  }
}

/** Por dirección: cuántas corridas salieron, la mediana del LCP en ms y la de la nota; o null. */
export function lighthouseRuns(root, urls) {
  const { settings } = JSON.parse(readFileSync(join(root, '.lighthouserc.json'), 'utf8')).ci.collect
  const dir = mkdtempSync(join(tmpdir(), 'velocidad-'))
  try {
    const config = { ci: { collect: { url: urls, numberOfRuns: RUNS, settings } } }
    writeFileSync(join(dir, 'lighthouserc.json'), JSON.stringify(config))
    const { status } = spawnSync(
      process.execPath,
      [LHCI, 'collect', '--config=lighthouserc.json'],
      {
        cwd: dir,
        stdio: 'inherit',
      },
    )
    const lhrs = readResults(dir)
    // En Windows lhci puede salir con error al cerrar Chrome y dejar los resultados (KL-001).
    if (status !== 0) console.warn(`lhci salió con ${status}; se leen las corridas que dejó.`)
    return new Map(
      urls.map((url) => [url, summary(lhrs.filter((lhr) => lhr.requestedUrl === url))]),
    )
  } finally {
    rmSync(dir, { recursive: true, force: true, maxRetries: 3 })
  }
}
