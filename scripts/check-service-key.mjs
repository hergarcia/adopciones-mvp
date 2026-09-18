#!/usr/bin/env node
// Compuerta de privacidad: la clave de servicio saltea RLS, así que no puede llegar al browser ni
// quedar versionada. Declara qué mira, porque una compuerta sin sujeto declarado puede pasar en
// verde sin haber mirado nada. Corre dentro de `pnpm lint` (docs/09 §Compuertas).
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'

const SERVICE_KEY_NAME = 'SUPABASE_SERVICE_ROLE_KEY'
const EXPOSED_PREFIX = 'NEXT_PUBLIC_'

// Una variable con el prefijo público y la palabra de la clave de servicio en el mismo nombre.
const EXPOSED_NAME = new RegExp(`${EXPOSED_PREFIX}[A-Z0-9_]*SERVICE_ROLE[A-Z0-9_]*`)

// Un JWT cuyo payload declara el rol de servicio: es la forma de la clave local de Supabase.
const SERVICE_KEY_VALUE = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/

const SKIP_BINARY = /\.(png|jpe?g|webp|ico|woff2?|ttf|pdf|lock|yaml)$/i
const MAX_BYTES = 2_000_000

const findings = []

function tracked() {
  return execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function isServiceRoleJwt(line) {
  const match = line.match(SERVICE_KEY_VALUE)
  if (!match) return false
  try {
    const payload = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url').toString('utf8'))
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

for (const file of tracked()) {
  if (SKIP_BINARY.test(file) || file === 'scripts/check-service-key.mjs') continue
  try {
    if (statSync(file).size > MAX_BYTES) continue
  } catch {
    continue
  }

  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, index) => {
    const where = `${file}:${index + 1}`

    if (EXPOSED_NAME.test(line)) {
      findings.push(
        `${where} — expone la clave de servicio al browser con el prefijo ${EXPOSED_PREFIX}`,
      )
    }
    if (isServiceRoleJwt(line)) {
      findings.push(`${where} — hay una clave de servicio escrita literal y versionada`)
    }
    if (
      file === '.env.example' &&
      line.startsWith(`${SERVICE_KEY_NAME}=`) &&
      line.trim() !== `${SERVICE_KEY_NAME}=`
    ) {
      findings.push(`${where} — .env.example trae un valor real; tiene que quedar vacío`)
    }
  })
}

if (findings.length > 0) {
  console.error(`check-service-key: ${findings.length} problema(s) con ${SERVICE_KEY_NAME}:`)
  for (const finding of findings) console.error(`  · ${finding}`)
  process.exit(1)
}

console.log(`check-service-key: ${SERVICE_KEY_NAME} no está expuesta ni versionada.`)
