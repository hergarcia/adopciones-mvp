#!/usr/bin/env node
// Regenera los tipos desde la base local. Es un script y no una redirección de shell porque `>` en
// PowerShell escribe CRLF, y con .gitattributes normalizando a LF el archivo versionado quedaría
// distinto del generado: la compuerta de deriva se pondría roja solo en Windows.
//   node scripts/db-types.mjs [--stdout]
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const TARGET = 'src/lib/supabase/types.ts'

export function generate() {
  return execFileSync('supabase', ['gen', 'types', 'typescript', '--local'], {
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
