// Lo que comparten el arranque global y el de cada archivo: cargar .env.local (Vitest no lo hace
// solo) y averiguar si la base local responde.
import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { supabaseUrlOrLocalDefault } from '../../src/lib/env'

const ENV_FILE = '.env.local'

// `parseEnv` y no una regex propia: en Windows el archivo suele quedar con CRLF, y
// `supabase status -o env` imprime los valores entre comillas. Una regex por línea descartaba el
// archivo entero con CRLF y dejaba las comillas puestas, así que las pruebas de base se omitían o
// decían que faltaba una variable que estaba ahí.
export function loadEnvLocal(): void {
  if (!existsSync(ENV_FILE)) return
  for (const [name, value] of Object.entries(parseEnv(readFileSync(ENV_FILE, 'utf8')))) {
    if (process.env[name] === undefined && value !== undefined && value.length > 0) {
      process.env[name] = value
    }
  }
}

export async function probeDatabase(): Promise<{ up: boolean; why: string }> {
  loadEnvLocal()
  const url = supabaseUrlOrLocalDefault()
  const why = `no responde la base local en ${url}. Levantala con \`pnpm exec supabase start\`.`
  try {
    const response = await fetch(`${url}/auth/v1/health`, { signal: AbortSignal.timeout(2000) })
    return { up: response.ok, why }
  } catch {
    return { up: false, why }
  }
}
