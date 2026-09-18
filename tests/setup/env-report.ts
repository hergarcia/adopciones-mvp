// Arranque de las pruebas. Hace dos cosas, y las dos existen para que un verde no esconda nada:
// carga .env.local (Vitest no lo hace solo) y decide si la base local está disponible.
// Sin base: se omite con aviso en la máquina, se falla en CI (FR-024). El detalle de lo omitido va
// a .verify-skips.json, que es por donde `pnpm verify` lo reporta (FR-005).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
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
    const response = await fetch(`${url}/auth/v1/health`, {
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}

export function recordSkip(what: string, why: string): void {
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

if (!databaseUp) {
  const why = `no responde la base local en ${url}. Levantala con \`supabase start\`.`
  if (process.env.CI) {
    throw new Error(
      `Las pruebas que necesitan la base no se omiten en CI: ${why} ` +
        'Un salteo silencioso en CI está prohibido (docs/09).',
    )
  }
  console.warn(`\n  ⚠  Se omiten las pruebas que necesitan la base: ${why}\n`)
  recordSkip('pruebas de privacidad y deriva de tipos', why)
}
