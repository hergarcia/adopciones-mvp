#!/usr/bin/env node
// Le dice al CI si el PR toca código (`code=true`) o solo texto: lo escribe en $GITHUB_OUTPUT.
//   node scripts/ci-scope.mjs --base <ref>
import { execFileSync } from 'node:child_process'
import { appendFileSync } from 'node:fs'
import { touchesCode } from './gates/docs-only.mjs'

const argv = process.argv.slice(2)
const baseIdx = argv.indexOf('--base')
if (baseIdx < 0) throw new Error('ci-scope: falta --base <ref>')
const changed = execFileSync('git', ['diff', '--name-only', `${argv[baseIdx + 1]}...HEAD`], {
  encoding: 'utf8',
})
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)
const code = touchesCode(changed)
console.log(
  `ci-scope: ${changed.length} archivo(s) cambiados, ${code ? 'toca código' : 'solo texto'}`,
)
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `code=${code}\n`)
