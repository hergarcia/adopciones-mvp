// Una etapa puede omitir un check (sin base local, por ejemplo). Se escribe en un archivo y se
// reporta al final: un verde nunca debe esconder algo que no se verificó.
import { existsSync, readFileSync, rmSync } from 'node:fs'

const SKIPS_FILE = '.verify-skips.json'

export function resetSkips() {
  rmSync(SKIPS_FILE, { force: true })
}

export function reportSkips() {
  if (!existsSync(SKIPS_FILE)) {
    console.log('\n  No se omitió ningún check.')
    return
  }
  let skips
  try {
    skips = JSON.parse(readFileSync(SKIPS_FILE, 'utf8'))
  } catch (error) {
    console.log(`\n  No se pudo leer ${SKIPS_FILE}: ${error.message}`)
    return
  }
  if (!Array.isArray(skips) || skips.length === 0) {
    console.log('\n  No se omitió ningún check.')
    return
  }
  console.log(`\n  Checks omitidos (${skips.length}):`)
  for (const skip of skips) {
    console.log(`    · ${skip.what} — ${skip.why}`)
  }
}
