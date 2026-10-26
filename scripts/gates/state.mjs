// Lo que una corrida de gates:affected le deja al reintento: qué quedó rojo y una foto del árbol.
import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'

export const OUT = '.artifacts/gates'
const STATE = `${OUT}/last.json`
const REPORT = /^vitest-\d+\.json$/

const slash = (p) => p.replaceAll('\\', '/')

// El árbol de trabajo como objeto de git, con lo que todavía no tiene commit: así el reintento sabe
// qué tocó el arreglo. Se arma en un índice aparte; el de verdad no se toca.
export function snapshot() {
  const index = join(tmpdir(), `gates-index-${process.pid}`)
  const real = execFileSync('git', ['rev-parse', '--git-path', 'index'], {
    encoding: 'utf8',
  }).trim()
  const env = { ...process.env, GIT_INDEX_FILE: index }
  try {
    if (existsSync(real)) copyFileSync(real, index)
    else execFileSync('git', ['read-tree', 'HEAD'], { env })
    execFileSync('git', ['add', '-A'], { env })
    return execFileSync('git', ['write-tree'], { env, encoding: 'utf8' }).trim()
  } finally {
    rmSync(index, { force: true })
  }
}

// Una corrida con otra base es de otra user story, de otro arreglo o de un main que se movió.
export function readState(mergeBase) {
  if (!existsSync(STATE)) return null
  const state = JSON.parse(readFileSync(STATE, 'utf8'))
  return state.mergeBase === mergeBase ? state : null
}

export function writeState(state) {
  writeFileSync(STATE, JSON.stringify(state, null, 2))
}

export function clearReports() {
  mkdirSync(OUT, { recursive: true })
  for (const f of readdirSync(OUT)) if (REPORT.test(f)) rmSync(join(OUT, f))
}

/** Los archivos de prueba que fallaron según el reporte JSON de vitest; vacío si no hay reporte. */
export function failedFiles(json) {
  if (!existsSync(json)) return []
  const report = JSON.parse(readFileSync(json, 'utf8'))
  return report.testResults
    .filter((t) => t.status === 'failed')
    .map((t) => slash(relative(process.cwd(), t.name)))
}
