#!/usr/bin/env node
// La compuerta completa: las siete etapas de CLAUDE.md §Comandos, en orden, cortando en la primera
// que falla. Es un script de Node y no una cadena de `&&` porque tiene que comportarse igual en
// PowerShell 7 y en bash, y porque el orden de las etapas vive en un solo lugar.
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'

const SKIPS_FILE = '.verify-skips.json'

const STAGES = [
  { name: 'lint', script: 'lint' },
  { name: 'typecheck', script: 'typecheck' },
  { name: 'test', script: 'test' },
  { name: 'mutation', script: 'mutation' },
  { name: 'build', script: 'build' },
  { name: 'e2e', script: 'e2e' },
  { name: 'lighthouse', script: 'lighthouse' },
]

const bar = '─'.repeat(60)

function run({ name, script }, index) {
  console.log(`\n${bar}\n  ${index + 1}/${STAGES.length}  ${name}\n${bar}`)
  const result = spawnSync('pnpm', ['run', script], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  return result.status ?? 1
}

// Una etapa puede omitir un check (sin base local, por ejemplo). Se escribe en un archivo y se
// reporta acá: un verde nunca debe esconder algo que no se verificó.
function reportSkips() {
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

rmSync(SKIPS_FILE, { force: true })

for (const [index, stage] of STAGES.entries()) {
  const status = run(stage, index)
  if (status !== 0) {
    console.error(`\n${bar}\n  Cortó en ${stage.name}. Las siguientes no corrieron.\n${bar}`)
    reportSkips()
    process.exit(status)
  }
}

console.log(`\n${bar}\n  Las siete etapas en verde.\n${bar}`)
reportSkips()
