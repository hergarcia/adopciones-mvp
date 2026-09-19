import { createClient } from '@supabase/supabase-js'
import { requireEnv } from '@/lib/env'
import type { Database } from './types'

// Saltea RLS. Existe para las tres cosas que no puede hacer la sesión de una persona: generar el
// enlace de ingreso sin saber de antemano si la dirección tiene cuenta (FR-006a), aplicar el tope
// mudo por dirección, y borrar una cuenta entera. Nadie lo importa fuera de lib/supabase/, y
// nunca se lo llama desde un componente.
export function createServiceSupabase() {
  return createClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
