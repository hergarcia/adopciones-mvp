// Las fotos firmadas se piden al mismo origen que la página y Vercel las reenvía a Storage sin pasar
// por una función. Desde otro origen, el teléfono abría una conexión más antes de bajar la portada,
// y el listado y la ficha pasaban el LCP de 2,5 s (#169). La firma viaja igual y vence igual.
const PHOTO_PATH = '/fotos'
const SIGNED_OBJECT = '/storage/v1/object/sign'

type Rewrite = { source: string; destination: string }

export function photoRewrites(supabaseUrl: string | undefined): Rewrite[] {
  if (!supabaseUrl) return []
  return [
    {
      source: `${PHOTO_PATH}/:path*`,
      destination: `${new URL(supabaseUrl).origin}${SIGNED_OBJECT}/:path*`,
    },
  ]
}

/** La URL firmada de Storage, pedida por el mismo origen; cualquier otra queda como estaba. */
export function sameOriginPhotoUrl(signedUrl: string): string {
  const url = URL.canParse(signedUrl) ? new URL(signedUrl) : null
  if (url === null || !url.pathname.startsWith(`${SIGNED_OBJECT}/`)) return signedUrl
  return `${PHOTO_PATH}${url.pathname.slice(SIGNED_OBJECT.length)}${url.search}`
}
