import { optionalEnv } from '@/lib/env'

// FR-011: sin credenciales cargadas, la opción no se le muestra a nadie. Es otra cosa que una
// caída momentánea de Google, que se trata como error y **no** esconde el botón: quien ya lo vio
// una vez creería que desapareció.
//
// Vive solo, sin test: es lectura de configuración, que docs/09 deja explícitamente fuera de lo
// que vale la pena testear. La regla que sí importa —si Google verificó la dirección— está en
// google.ts, con su test.
export function isGoogleConfigured(): boolean {
  return (
    optionalEnv('SUPABASE_AUTH_GOOGLE_CLIENT_ID') !== undefined &&
    optionalEnv('SUPABASE_AUTH_GOOGLE_SECRET') !== undefined
  )
}
