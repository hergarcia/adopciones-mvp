import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { requireEnv } from '@/lib/env'
import type { Database } from './types'
import { SESSION_COOKIE_MAX_AGE } from './session'

// El cliente con la sesión de quien está mirando. Nadie lo importa fuera de lib/supabase/.
export async function createServerSupabase() {
  const store = await cookies()

  return createServerClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (toSet) => {
          try {
            for (const { name, value, options } of toSet) {
              store.set(name, value, { ...options, maxAge: SESSION_COOKIE_MAX_AGE })
            }
          } catch {
            // Un Server Component no puede escribir cookies. El refresco lo hace el proxy, que sí
            // puede, así que acá no hay nada que hacer y tampoco nada roto.
          }
        },
      },
    },
  )
}
