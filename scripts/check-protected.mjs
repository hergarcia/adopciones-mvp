#!/usr/bin/env node
// Compuerta de CI: un PR que cambia lo que juzga a los agentes necesita la etiqueta
// `reglas-aprobadas`, que pone Hernán (docs/09 §Las reglas no se tocan solas).
//   PR_LABELS="a,b" node scripts/check-protected.mjs --base origin/main
import { execFileSync } from 'node:child_process'
import { needsApproval } from './protected/rules.mjs'

const APPROVAL = 'reglas-aprobadas'

const args = process.argv.slice(2)
const baseIdx = args.indexOf('--base')
const base = baseIdx >= 0 ? args[baseIdx + 1] : 'origin/main'

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const show = (ref, file) => {
  try {
    return git('show', `${ref}:${file}`)
  } catch {
    return null
  }
}

const mergeBase = git('merge-base', base, 'HEAD').trim()
const changed = git('diff', '--name-only', '--no-renames', `${mergeBase}..HEAD`)
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
const findings = changed
  .map((file) => needsApproval(file, show(mergeBase, file), show('HEAD', file)))
  .filter(Boolean)

if (findings.length === 0) {
  console.log(
    `check-protected: ${changed.length} archivo(s) cambiado(s); ninguno juzga a los agentes.`,
  )
  process.exit(0)
}
const list = findings.map((f) => `  · ${f}`).join('\n')
const labels = (process.env.PR_LABELS ?? '').split(',').map((label) => label.trim())
if (labels.includes(APPROVAL)) {
  console.log(
    `check-protected: cambios a lo que juzga a los agentes, aprobados por Hernán:\n${list}`,
  )
  process.exit(0)
}
console.error(
  `check-protected: el PR cambia lo que juzga a los agentes y no tiene la etiqueta ${APPROVAL}:\n${list}`,
)
process.exit(1)
