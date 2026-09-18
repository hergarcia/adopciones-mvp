import createMiddleware from 'next-intl/middleware'
import { routing } from '@/lib/i18n/routing'

// Next 16 llama `proxy` a lo que antes era `middleware`.
export default createMiddleware(routing)

// Todo menos las rutas de API, los internos de Next y cualquier cosa con punto (un archivo).
// El punto va escapado de verdad: `\\.` en el fuente es `\.` en la expresión, que es un punto
// literal. Con un solo backslash sería «cualquier carácter» y el proxy interceptaría de más.
export const config = {
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)',
}
