import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireEnv } from '@/lib/env'
import type { Database } from './types'

// La única puerta a la base. Nadie la importa fuera de lib/supabase/, y hay una regla de lint que
// lo verifica (docs/09 §Compuertas). La sesión de la app —ingreso, cookies— llega con la historia
// de registro e ingreso: acá no hay nada de eso todavía.
export function createClient() {
  return createSupabaseClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  )
}
