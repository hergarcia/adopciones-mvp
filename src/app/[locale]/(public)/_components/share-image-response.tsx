import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { PetShareImage, SHARE_PHOTO_SIZE } from '@/components/pets/pet-share-image'
import { APP_NAME } from '@/lib/config'
import { shareFont } from '@/lib/og/share-font'
import { SHARE_FONT, SHARE_IMAGE_SIZE } from '@/lib/og/share-image'
import { smallJpeg } from '@/lib/og/small-jpeg'

// La portada entera a la medida de la tarjeta. `next/og` no decodifica WebP, así que pasa por
// `sharp` a JPEG; si no llegó en 4:5, se recorta conservando la parte de arriba, donde suele estar
// la cara.
async function coverDataUrl(url: string): Promise<string | null> {
  const response = await fetch(url)
  if (!response.ok) return null
  const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize({ ...SHARE_PHOTO_SIZE, fit: 'cover', position: 'top' })
    .jpeg({ quality: 90 })
    .toBuffer()
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`
}

type Card = {
  /** La portada `full`, firmada. */
  coverUrl: string
  name: string
  /** Ya traducida; sin zona, la adoptada. */
  zone: string
  /** El sello de adoptado, ya traducido. */
  adopted?: string
}

/**
 * La imagen de la vista previa de una ficha —la de un animal o la de una camada—, o un 404 si la
 * portada no se pudo bajar (research R6 de la #57).
 */
export async function shareImageResponse(card: Card): Promise<Response> {
  const photo = await coverDataUrl(card.coverUrl)
  if (photo === null) return new Response(null, { status: 404 })
  const image = new ImageResponse(
    <PetShareImage
      photo={photo}
      name={card.name}
      zone={card.zone}
      adopted={card.adopted}
      siteName={APP_NAME}
    />,
    {
      ...SHARE_IMAGE_SIZE,
      fonts: [{ name: SHARE_FONT, data: await shareFont(), weight: 800, style: 'normal' }],
    },
  )
  const jpeg = await smallJpeg(Buffer.from(await image.arrayBuffer()))
  return new Response(new Uint8Array(jpeg), {
    headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-store' },
  })
}
