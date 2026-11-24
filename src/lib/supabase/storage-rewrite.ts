// Las fotos firmadas de Storage, pedidas por el origen de la página: el teléfono no abre otra
// conexión antes de la portada, y la firma viaja y vence igual (docs/07, decisión 2026-10-20). En el
// servidor propio es además el único camino: Supabase no tiene dirección pública (decisión
// 2026-11-24). Solo la forma exacta de cada foto: un comodín dejaba pasar `%2e%2e` hacia otras
// rutas de Supabase.
const SAME_ORIGIN_PATH = '/fotos'
const SIGNED_OBJECT = '/storage/v1/object/sign'
const PHOTO_BUCKETS = ['pet-photos', 'follow-up-photos']
const AVATARS = 'avatars'
const ID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
const SIZE = 'thumb|card|full'
const SIGNED_PHOTO = new RegExp(
  `^${SIGNED_OBJECT}(/(?:${PHOTO_BUCKETS.join('|')})/${ID}/${ID}/(?:${SIZE})\\.webp|/${AVATARS}/${ID}/avatar\\.webp)$`,
)

type Rewrite = { source: string; destination: string }

export function storageRewrites(supabaseUrl: string | undefined): Rewrite[] {
  if (!supabaseUrl) return []
  const signed = `${new URL(supabaseUrl).origin}${SIGNED_OBJECT}`
  return [
    ...PHOTO_BUCKETS.map((bucket) => ({
      source: `${SAME_ORIGIN_PATH}/${bucket}/:owner(${ID})/:photo(${ID})/:size(${SIZE}).webp`,
      destination: `${signed}/${bucket}/:owner/:photo/:size.webp`,
    })),
    {
      source: `${SAME_ORIGIN_PATH}/${AVATARS}/:owner(${ID})/avatar.webp`,
      destination: `${signed}/${AVATARS}/:owner/avatar.webp`,
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
