#!/usr/bin/env node
// Regenera los tipos desde la base local. Es un script y no una redirección de shell porque `>` en
// PowerShell escribe CRLF, y con .gitattributes normalizando a LF el archivo versionado quedaría
// distinto del generado: la compuerta de deriva se pondría roja solo en Windows.
//   node scripts/db-types.mjs [--stdout]
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const TARGET = 'src/lib/supabase/types.ts'

// El CLI del proyecto, por ruta y con el mismo Node: un `supabase` a secas resolvería por PATH y
// puede caer en una instalación del sistema con otra versión. Pasó de verdad acá: la del sistema
// no entendía una clave de config que la del proyecto ya requiere.
const CLI = 'node_modules/supabase/dist/supabase.js'

export function generate() {
  return execFileSync(process.execPath, [CLI, 'gen', 'types', 'typescript', '--local'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }).replaceAll('\r\n', '\n')
}

if (process.argv[1]?.endsWith('db-types.mjs')) {
  const types = generate()
  if (process.argv.includes('--stdout')) {
    process.stdout.write(types)
  } else {
    mkdirSync(dirname(TARGET), { recursive: true })
    writeFileSync(TARGET, types, { encoding: 'utf8' })
    console.log(`db:types: ${TARGET} regenerado (${types.split('\n').length} líneas, LF).`)
  }
}
