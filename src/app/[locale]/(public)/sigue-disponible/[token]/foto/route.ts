import sharp from 'sharp'
import { hashRenewalToken, isRenewalToken } from '@/lib/pets/renewal-token'
import { getRenewalLinkCover } from '@/lib/supabase/queries/pet-renewal'

export const runtime = 'nodejs'

type Context = { params: Promise<{ token: string }> }

// La portada del correo «¿sigue disponible?» (research R7): con el mismo token que el enlace, así la
// dirección no dice nada de nadie y deja de servir cuando el enlace vence o el animal se borra. En
// JPEG porque Outlook de escritorio no muestra WebP.
export async function GET(_: Request, { params }: Context) {
  const { token } = await params
  const cover = isRenewalToken(token)
    ? await getRenewalLinkCover(hashRenewalToken(token)).catch(() => null)
    : null
  if (cover === null) return new Response(null, { status: 404 })

  const jpeg = await sharp(Buffer.from(await cover.arrayBuffer()))
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer()
  return new Response(new Uint8Array(jpeg), {
    headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=86400' },
  })
}
