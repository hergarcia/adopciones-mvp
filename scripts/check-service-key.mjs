#!/usr/bin/env node
// Compuerta de privacidad: ninguna clave privada puede llegar al browser ni quedar versionada. La
// de servicio saltea RLS; la de Resend manda correo en nombre del dominio, que es de lo que vive
// el phishing. Corre en `pnpm lint` y en el gancho de pre-commit (docs/09 §Compuertas).
// Dice cuántos archivos miró y falla si no miró ninguno: una compuerta que pasa sin mirar es peor
// que no tenerla.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { problemsIn } from './service-key/matchers.mjs'

const BINARY = /\.(png|jpe?g|webp|ico|woff2?|ttf|pdf)$/i
// El lockfile es enorme y lo escribe pnpm; este script y su test nombran los patrones a propósito.
const SKIP = new Set(['pnpm-lock.yaml', 'scripts/check-service-key.mjs'])
const SKIP_PREFIX = 'scripts/service-key/'

const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  .split('\n')
  .map((line) => line.trim())
  .filter((file) => file && !BINARY.test(file) && !SKIP.has(file) && !file.startsWith(SKIP_PREFIX))

const findings = []
const unreadable = []
for (const file of files) {
  let text
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    // Versionado pero borrado del árbol de trabajo: no hay nada que leer, y se dice.
    unreadable.push(file)
    continue
  }
  text.split('\n').forEach((line, index) => {
    for (const problem of problemsIn(file, line)) {
      findings.push(`${file}:${index + 1} — ${problem}`)
    }
  })
}

const scanned = files.length - unreadable.length
if (scanned === 0) {
  console.error('check-service-key: no miró ningún archivo. ¿Se corrió fuera del repo?')
  process.exit(1)
}
if (findings.length > 0) {
  console.error(`check-service-key: ${findings.length} problema(s) con claves privadas:`)
  for (const finding of findings) console.error(`  · ${finding}`)
  process.exit(1)
}
const skipped =
  unreadable.length > 0 ? ` (${unreadable.length} borrados sin commitear, no leídos)` : ''
console.log(
  `check-service-key: ${scanned} archivos mirados${skipped}; ninguna clave privada está expuesta ni versionada.`,
)
