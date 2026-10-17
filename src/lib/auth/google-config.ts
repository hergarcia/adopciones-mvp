import { optionalEnv } from '@/lib/env'

// FR-011: sin el interruptor prendido, la opción no se le muestra a nadie. Es otra cosa que una
// caída momentánea de Google, que se trata como error y **no** esconde el botón: quien ya lo vio
// una vez creería que desapareció. El cliente y el secreto de Google viven solo en Supabase (el
// panel en la nube, el `.env` del CLI en local): la app nunca los lee, así que no los tiene.
//
// Vive solo, sin test: es lectura de configuración, que docs/09 deja explícitamente fuera de lo
// que vale la pena testear. La regla que sí importa —si Google verificó la dirección— está en
// google.ts, con su test.
export function isGoogleConfigured(): boolean {
  return optionalEnv('GOOGLE_SIGN_IN_ENABLED') === 'true'
}
