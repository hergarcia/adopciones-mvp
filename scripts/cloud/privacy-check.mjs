#!/usr/bin/env node
// Las pruebas de privacidad de la base, contra el proyecto de la nube (historia #169, US6, research
// R15). Barre las personas de prueba antes y después, pasen o fallen, e imprime la tabla regla por
// regla para pegar en la historia. Una regla que falla o que no corrió la deja abierta (FR-051).
//   node scripts/cloud/privacy-check.mjs
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readCloudEnv } from './cloud-env.mjs'
import { judge, outcomesByFile, pathOf } from './privacy-results.mjs'
import { sweepSyntheticPeople } from './synthetic-people.mjs'
import { markdownTable, uruguayNow } from './table.mjs'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const REPORT = '.artifacts/cloud/privacidad.json'
const PROBE_KEY = pathToFileURL(join(ROOT, 'scripts/cloud/health-probe-key.mjs')).href

// `phones.test.ts` no corre contra la nube: antes y después de cada prueba borra la tabla entera de
// envíos de códigos (`clearSends`), y con ella volverían a cero los topes por número y del sitio de
// las personas de verdad. Lo suyo de privacidad, que el teléfono de otra persona no se lee con sesión
// ni sin ella, lo prueba también `vouches.test.ts`, que no toca nada ajeno a sus personas de prueba.
const RULES = [
  {
    rule: 'El contacto se ve solo con la solicitud aceptada',
    files: ['applications-privacy', 'application-responses-privacy', 'adoptions-privacy'],
  },
  { rule: 'El teléfono nunca es público', files: ['profiles', 'vouches'] },
  {
    rule: 'Las imágenes de identidad las ve solo quien revisa y se borran al resolver',
    files: ['identity'],
  },
  { rule: 'El teléfono no sirve para ingresar (KL-017)', files: ['phone-sign-in'] },
]
const BY_HAND = [
  'Sin respaldos donde sobreviva una imagen de identidad borrada (KL-11-1)',
  'a mano',
  'a mano',
  'pegar la captura del plan del proyecto: gratuito, sin recuperación a un punto',
]

function runTests(env) {
  rmSync(join(ROOT, REPORT), { force: true })
  const files = RULES.flatMap((rule) => rule.files.map(pathOf))
  // Cada consulta cruza hasta la nube: las pruebas que arman varias escenas pasan los 5 s de siempre.
  const options = [
    ...files,
    '--testTimeout=30000',
    '--reporter=default',
    '--reporter=json',
    `--outputFile.json=${REPORT}`,
  ]
  spawnSync('pnpm', ['exec', 'vitest', 'run', '--project', 'db', ...options], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      ...env,
      NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --import="${PROBE_KEY}"`.trim(),
    },
  })
}

async function main() {
  const env = readCloudEnv(ROOT)
  const before = await sweepSyntheticPeople(env)
  let after
  try {
    runTests(env)
  } finally {
    after = await sweepSyntheticPeople(env)
  }
  const byFile = outcomesByFile(join(ROOT, REPORT))
  const rows = RULES.map(({ rule, files }) => [
    rule,
    files.map(pathOf).join(', '),
    ...judge(files, byFile),
  ])
  console.log(`\n## Privacidad contra el sitio de verdad\n`)
  console.log(`${env.NEXT_PUBLIC_SUPABASE_URL} · ${uruguayNow()} (hora de Uruguay)\n`)
  console.log(markdownTable(['Regla', 'Pruebas', 'Resultado', 'Detalle'], [...rows, BY_HAND]))
  console.log(
    `\nPersonas de prueba: ${before.removed} de una corrida anterior, borradas al empezar; ` +
      `${after.removed} borradas al terminar; quedan ${after.left}.`,
  )
  const allPassed = rows.every((row) => row[2] === 'pasó')
  return allPassed && after.left === 0 ? 0 : 1
}

try {
  process.exitCode = await main()
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
