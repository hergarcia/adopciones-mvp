#!/usr/bin/env node
// La etapa e2e. Sin flujos críticos todavía, termina en verde y **dice** que no había nada que
// verificar (FR-017): `playwright test --pass-with-no-tests` pasa pero no imprime nada, y una
// etapa muda no se distingue de una que se salteó. Cuando haya specs, corre Playwright tal cual.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'

const DIR = 'tests/e2e'
const specs = existsSync(DIR)
  ? readdirSync(DIR, { recursive: true }).filter((file) => /\.spec\.(ts|tsx)$/.test(String(file)))
  : []

if (specs.length === 0) {
  console.log(
    `e2e: no hay flujos críticos en ${DIR}/ todavía — nada que verificar. ` +
      'Llegan con publicar, solicitar y aceptar.',
  )
  process.exit(0)
}

const result = spawnSync('pnpm', ['exec', 'playwright', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
process.exit(result.status ?? 1)
