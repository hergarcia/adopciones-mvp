// Arranque de las pruebas. Carga .env.local (Vitest no lo hace solo) y averigua si la base local
// está disponible, una sola vez.
//
// No lanza: si lanzara, una base ausente haría fallar también las suites que no la necesitan, como
// la demostración de las compuertas. Quién falla y quién se omite lo decide `describeDb`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { describe, it } from 'vitest'
import { supabaseUrlOrLocalDefault } from '../../src/lib/env'

const SKIPS_FILE = '.verify-skips.json'
const ENV_FILE = '.env.local'

function loadEnvLocal(): void {
  if (!existsSync(ENV_FILE)) return
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) continue
    const [, name, value] = match
    if (process.env[name] === undefined && value.length > 0) {
      process.env[name] = value
    }
  }
}

async function isDatabaseUp(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/auth/v1/health`, { signal: AbortSignal.timeout(2000) })
    return response.ok
  } catch {
    return false
  }
}

function recordSkip(what: string, why: string): void {
  const existing: { what: string; why: string }[] = existsSync(SKIPS_FILE)
    ? JSON.parse(readFileSync(SKIPS_FILE, 'utf8'))
    : []
  if (!existing.some((skip) => skip.what === what)) {
    existing.push({ what, why })
    writeFileSync(SKIPS_FILE, `${JSON.stringify(existing, null, 2)}\n`)
  }
}

loadEnvLocal()

const url = supabaseUrlOrLocalDefault()

export const databaseUp = await isDatabaseUp(url)

const WHY = `no responde la base local en ${url}. Levantala con \`supabase start\`.`

if (!databaseUp && !process.env.CI) {
  console.warn(`\n  ⚠  Se omiten las pruebas que necesitan la base: ${WHY}\n`)
  recordSkip('pruebas de privacidad y deriva de tipos', WHY)
}

// En CI, una suite que necesita la base no se omite: se planta y dice por qué (docs/09).
function describeMissingDatabase(name: string, _define: () => void): void {
  describe(name, () => {
    it('necesita la base local, y en CI eso no se omite', () => {
      throw new Error(`${WHY} Un salteo silencioso en CI está prohibido (docs/09).`)
    })
  })
}

// Una suite que necesita la base: corre si está, se omite con aviso en la máquina si no está, y
// falla en CI. Se elige la función una sola vez, en lugar de ramificar en cada suite.
export const describeDb: (name: string, define: () => void) => void = databaseUp
  ? describe
  : process.env.CI
    ? describeMissingDatabase
    : describe.skip
