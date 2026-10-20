// Las fotos firmadas de Storage, pedidas por el origen de la página: el teléfono no abre otra
// conexión antes de la portada, y la firma viaja y vence igual (docs/07, decisión 2026-10-20). Solo
// la forma exacta de una foto: un comodín dejaba pasar `%2e%2e` hacia otras rutas de Supabase.
const SAME_ORIGIN_PATH = '/fotos'
const SIGNED_OBJECT = '/storage/v1/object/sign'
const BUCKET = 'pet-photos'
const ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const SIZE = 'thumb|card|full'
const SIGNED_PHOTO = new RegExp(`^${SIGNED_OBJECT}(/${BUCKET}/${ID}/${ID}/(?:${SIZE})\\.webp)$`)

type Rewrite = { source: string; destination: string }

export function storageRewrites(supabaseUrl: string | undefined): Rewrite[] {
  if (!supabaseUrl) return []
  return [
    {
      source: `${SAME_ORIGIN_PATH}/${BUCKET}/:owner(${ID})/:photo(${ID})/:size(${SIZE}).webp`,
      destination: `${new URL(supabaseUrl).origin}${SIGNED_OBJECT}/${BUCKET}/:owner/:photo/:size.webp`,
    },
  ]
}

/** La URL firmada de una foto, pedida por el mismo origen; cualquier otra queda como estaba. */
export function sameOriginStorageUrl(signedUrl: string): string {
  if (!URL.canParse(signedUrl)) return signedUrl
  const url = new URL(signedUrl)
  const photoPath = SIGNED_PHOTO.exec(url.pathname)?.[1]
  return photoPath ? `${SAME_ORIGIN_PATH}${photoPath}${url.search}` : signedUrl
}
