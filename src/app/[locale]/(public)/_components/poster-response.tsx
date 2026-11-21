import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { PetPoster, type PosterCard } from '@/components/pets/pet-poster'
import { coverDataUrl } from '@/lib/og/cover-data-url'
import { POSTER_LAYOUT, POSTER_SIZE } from '@/lib/og/poster-layout'
import { shareFont } from '@/lib/og/share-font'
import { SHARE_FONT } from '@/lib/og/share-image'

/**
 * El cartel para el estado y las historias (historia #275) como JPEG, o un 502 si la portada no se
 * pudo bajar: la ficha avisa que no se pudo y no cuenta nada. Es de quien publicó, así que no se
 * guarda en ningún lado.
 */
export async function posterResponse(
  card: Omit<PosterCard, 'photo'>,
  coverUrl: string,
): Promise<Response> {
  const photo = await coverDataUrl(coverUrl, POSTER_LAYOUT.photo)
  if (photo === null) return new Response(null, { status: 502 })
  const image = new ImageResponse(<PetPoster card={{ ...card, photo }} />, {
    ...POSTER_SIZE,
    fonts: [{ name: SHARE_FONT, data: await shareFont(), weight: 800, style: 'normal' }],
  })
  // El PNG de `ImageResponse` a este tamaño pesa varios megas; en JPEG sube rápido con datos móviles.
  const jpeg = await sharp(Buffer.from(await image.arrayBuffer()))
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer()
  return new Response(new Uint8Array(jpeg), {
    headers: { 'content-type': 'image/jpeg', 'cache-control': 'private, no-store' },
  })
}
