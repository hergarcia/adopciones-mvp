// Las claves del proyecto de la nube para las pruebas de privacidad. Viven en `.env.cloud`, ignorado
// por git, y no en `.env.local`: un descuido ahí y `pnpm test` correría contra los datos de verdad.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'

export const CLOUD_ENV_FILE = '.env.cloud'

const NAMES = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY',
]
const LOCAL_HOSTS = new Set(['localhost', '0.0.0.0', '[::1]', 'host.docker.internal'])

const HOW_TO = `Creá ${CLOUD_ENV_FILE} en la raíz del repositorio con ${NAMES.join(', ')} del proyecto de la nube (docs/puesta-en-marcha.md §Comprobar contra el sitio de verdad).`

function isLocal({ protocol, hostname }) {
  return (
    protocol !== 'https:' ||
    LOCAL_HOSTS.has(hostname) ||
    hostname.startsWith('127.') ||
    hostname.endsWith('.localhost')
  )
}

function cloudUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL en ${CLOUD_ENV_FILE} no es una dirección: «${value}».`,
    )
  }
  if (isLocal(url)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL en ${CLOUD_ENV_FILE} es ${url.origin}, que no es la nube. ` +
        'Contra la base local, las mismas pruebas corren con `pnpm test`.',
    )
  }
  return url.origin
}

export function readCloudEnv(root) {
  const file = join(root, CLOUD_ENV_FILE)
  if (!existsSync(file)) throw new Error(`No está ${CLOUD_ENV_FILE}. ${HOW_TO}`)
  const values = parseEnv(readFileSync(file, 'utf8'))
  const missing = NAMES.filter((name) => !values[name])
  if (missing.length > 0) {
    throw new Error(`En ${CLOUD_ENV_FILE} falta ${missing.join(', ')}. ${HOW_TO}`)
  }
  return {
    NEXT_PUBLIC_SUPABASE_URL: cloudUrl(values.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: values.SUPABASE_SECRET_KEY,
  }
}
