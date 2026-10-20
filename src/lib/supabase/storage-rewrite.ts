// Los objetos firmados de Storage, pedidos por el origen de la página: el teléfono no abre otra
// conexión antes de la portada, y la firma viaja y vence igual (docs/07, decisión 2026-10-20).
const SAME_ORIGIN_PATH = '/fotos'
const SIGNED_OBJECT = '/storage/v1/object/sign'

type Rewrite = { source: string; destination: string }

export function storageRewrites(supabaseUrl: string | undefined): Rewrite[] {
  if (!supabaseUrl) return []
  return [
    {
      source: `${SAME_ORIGIN_PATH}/:path*`,
      destination: `${new URL(supabaseUrl).origin}${SIGNED_OBJECT}/:path*`,
    },
  ]
}

/** La URL firmada de Storage, pedida por el mismo origen; cualquier otra queda como estaba. */
export function sameOriginStorageUrl(signedUrl: string): string {
  const url = URL.canParse(signedUrl) ? new URL(signedUrl) : null
  if (url === null || !url.pathname.startsWith(`${SIGNED_OBJECT}/`)) return signedUrl
  return `${SAME_ORIGIN_PATH}${url.pathname.slice(SIGNED_OBJECT.length)}${url.search}`
}
