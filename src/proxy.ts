import createMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from '@/lib/i18n/routing'
import { refreshSession } from '@/lib/supabase/middleware'
import { VISIT_COOKIE } from '@/lib/analytics/track'

// Next 16 llama `proxy` a lo que antes era `middleware`.
const handleI18n = createMiddleware(routing)

export default async function proxy(request: NextRequest) {
  const response = handleI18n(request)
  await refreshSession(request, response)

  // La marca de visita nace acá y muere con el navegador: sin `maxAge` es una cookie de sesión.
  // Encadena los eventos de una misma visita sin identificar a nadie (FR-030c).
  if (!request.cookies.has(VISIT_COOKIE)) {
    response.cookies.set(VISIT_COOKIE, crypto.randomUUID(), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  }

  return response
}

// Todo menos las rutas de API, los internos de Next, cualquier cosa con punto (un archivo) y
// `auth`. El punto va escapado de verdad: `\\.` en el fuente es `\.` en la expresión, que es un
// punto literal. Con un solo backslash sería «cualquier carácter» y el proxy interceptaría de más.
//
// `auth` está excluido porque `localePrefix` es 'as-needed': sin la exclusión, next-intl
// reescribiría /auth/confirm a /es/auth/confirm, que no existe, y el enlace del correo y la vuelta
// de Google darían 404. Lo prueba tests/e2e/alta.spec.ts abriendo el enlace de verdad.
export const config = {
  matcher: '/((?!api|auth|_next|_vercel|.*\\..*).*)',
}
