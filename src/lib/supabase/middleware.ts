import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'
import { requireEnv } from '@/lib/env'
import type { Database } from './types'
import { SESSION_COOKIE_MAX_AGE } from './session'

// Refresca la sesión y la vuelve a emitir con treinta días de vida (KL-005). Es el único lugar
// que puede escribir la cookie en cada pedido, así que sin esto la sesión se venceria sola.
export async function refreshSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'),
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, { ...options, maxAge: SESSION_COOKIE_MAX_AGE })
          }
        },
      },
    },
  )

  // getClaims y no getSession: verifica la firma del token en vez de confiar en la cookie, dispara
  // el refresco y, con las claves de firma asimétricas, valida en local sin ir al servicio de Auth
  // en cada pedido.
  await supabase.auth.getClaims()
}
