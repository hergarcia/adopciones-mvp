// Entrar con Google pasa por el origen del sitio: Supabase no tiene dirección pública en el servidor
// propio (docs/07, decisión 2026-11-24), así que la app reenvía la autorización y la vuelta de
// Google. Solo esos dos caminos: el resto de Auth queda adentro.
const AUTH = '/auth/v1'
const AUTHORIZE = `${AUTH}/authorize`
const PUBLIC_PATHS = [AUTHORIZE, `${AUTH}/callback`]

type Rewrite = { source: string; destination: string }

export function authRewrites(supabaseUrl: string | undefined): Rewrite[] {
  if (!supabaseUrl) return []
  const origin = new URL(supabaseUrl).origin
  return PUBLIC_PATHS.map((path) => ({ source: path, destination: `${origin}${path}` }))
}

/** La autorización de Google pedida por el origen del sitio; cualquier otra queda como estaba. */
export function sameOriginAuthUrl(authorizeUrl: string, siteUrl: string): string {
  if (!URL.canParse(authorizeUrl)) return authorizeUrl
  const url = new URL(authorizeUrl)
  if (url.pathname !== AUTHORIZE) return authorizeUrl
  const site = new URL(siteUrl)
  return `${site.origin}${url.pathname}${url.search}`
}
