const HOW_TO_GET = 'Corré `pnpm exec supabase status -o env` y copiá los valores a .env.local.'

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'

type Name =
  'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY'

function read(name: Name): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

export function requireEnv(name: Name): string {
  const value = read(name)
  if (value === undefined) {
    throw new Error(`Falta la variable de entorno ${name}. ${HOW_TO_GET}`)
  }
  return value
}

// El sondeo del arnés necesita una URL incluso sin .env.local, para poder distinguir "no hay
// entorno" (se omite con aviso) de "hay entorno y falta una variable" (falla). Ver FR-024/FR-025.
export function supabaseUrlOrLocalDefault(): string {
  return read('NEXT_PUBLIC_SUPABASE_URL') ?? LOCAL_SUPABASE_URL
}

export function hasSupabaseEnv(): boolean {
  return read('NEXT_PUBLIC_SUPABASE_URL') !== undefined
}
