import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireEnv } from '@/lib/env'

// La única puerta a la base. Nadie la importa fuera de lib/supabase/, y hay una regla de lint que
// lo verifica (docs/09 §Compuertas). La sesión de la app —ingreso, cookies— llega con la historia
// de registro e ingreso: acá no hay nada de eso todavía.
//
// Todavía sin el genérico `Database`: `src/lib/supabase/types.ts` se genera desde la base local
// (`pnpm db:types`) y no se escribe a mano, así que entra cuando US3 se verifica contra una base
// levantada. La compuerta de deriva (tests/db/types-drift.test.ts) es la que lo mantiene al día.
export function createClient() {
  return createSupabaseClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  )
}
