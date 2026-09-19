// Arranque global: corre una vez, en el proceso principal, que es el único lugar desde donde un
// aviso se ve siempre. Vitest se traga el console.warn de los archivos de setup por archivo, y un
// salteo que solo aparece como "2 skipped" en el conteo es un salteo silencioso (FR-024).
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { probeDatabase } from './database'

const SKIPS_FILE = '.verify-skips.json'

function recordSkip(what: string, why: string): void {
  const existing: { what: string; why: string }[] = existsSync(SKIPS_FILE)
    ? JSON.parse(readFileSync(SKIPS_FILE, 'utf8'))
    : []
  if (!existing.some((skip) => skip.what === what)) {
    existing.push({ what, why })
    writeFileSync(SKIPS_FILE, `${JSON.stringify(existing, null, 2)}\n`)
  }
}

export default async function setup(): Promise<void> {
  const { up, why } = await probeDatabase()
  if (up || process.env.CI) return

  console.warn(`\n  ⚠  Se omiten las pruebas que necesitan la base: ${why}\n`)
  recordSkip('pruebas de privacidad y deriva de tipos', why)
}
