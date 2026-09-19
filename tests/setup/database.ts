// Lo que comparten el arranque global y el de cada archivo: cargar .env.local (Vitest no lo hace
// solo) y averiguar si la base local responde.
import { existsSync, readFileSync } from 'node:fs'
import { supabaseUrlOrLocalDefault } from '../../src/lib/env'

const ENV_FILE = '.env.local'

export function loadEnvLocal(): void {
  if (!existsSync(ENV_FILE)) return
  for (const line of readFileSync(ENV_FILE, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) continue
    const [, name, value] = match
    if (process.env[name] === undefined && value.length > 0) {
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
