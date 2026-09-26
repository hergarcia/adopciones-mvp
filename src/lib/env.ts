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
  RESEND_API_KEY: () => process.env.RESEND_API_KEY,
  RESEND_FROM: () => process.env.RESEND_FROM,
  SUPABASE_AUTH_GOOGLE_CLIENT_ID: () => process.env.SUPABASE_AUTH_GOOGLE_CLIENT_ID,
  SUPABASE_AUTH_GOOGLE_SECRET: () => process.env.SUPABASE_AUTH_GOOGLE_SECRET,
  TWILIO_ACCOUNT_SID: () => process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: () => process.env.TWILIO_AUTH_TOKEN,
  TWILIO_MESSAGING_SERVICE_SID: () => process.env.TWILIO_MESSAGING_SERVICE_SID,
  CRON_SECRET: () => process.env.CRON_SECRET,
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

// Las de las historias #9 y #10 son opcionales por diseño: sin credenciales de Google la opción
// no se muestra (FR-011), sin clave de Resend el correo se escribe a archivo (KL-006), y sin Twilio
// el mensaje va a disco contra la base local o falla en cualquier otra (FR-009c). Nada de eso es
// un error de configuración, así que no pueden pasar por `requireEnv`. Sin `CRON_SECRET` la ruta
// de la tarea programada rechaza todo: nadie de afuera la puede disparar.
export function optionalEnv(name: Name): string | undefined {
  return read(name)
}

// El sondeo del arnés necesita una URL incluso sin .env.local, para poder distinguir "no hay
// entorno" (se omite con aviso) de "hay entorno y falta una variable" (falla). Ver FR-024/FR-025.
export function supabaseUrlOrLocalDefault(): string {
  return read('NEXT_PUBLIC_SUPABASE_URL') ?? LOCAL_SUPABASE_URL
}
