const HOW_TO_GET = 'Corré `pnpm exec supabase status -o env` y copiá los valores a .env.local.'

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'

// Cada nombre escrito entero: Next reemplaza `process.env.NEXT_PUBLIC_X` al compilar el bundle del
// browser, y un `process.env[name]` dinámico queda sin reemplazar, así que ahí diría que falta una
// variable que está. Son funciones y no valores porque las pruebas cargan .env.local después de
// importar este módulo.
const READERS = {
  NEXT_PUBLIC_SUPABASE_URL: () => process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: () => process.env.SUPABASE_SERVICE_ROLE_KEY,
}

type Name = keyof typeof READERS

function read(name: Name): string | undefined {
  const value = READERS[name]()
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
