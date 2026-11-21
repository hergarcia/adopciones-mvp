import { ImageResponse } from 'next/og'
import { PetShareImage, SHARE_PHOTO_SIZE } from '@/components/pets/pet-share-image'
import type { ShareImageLevel } from '@/components/pets/share-preview-texts'
import { APP_NAME } from '@/lib/config'
import { coverDataUrl } from '@/lib/og/cover-data-url'
import { shareFont } from '@/lib/og/share-font'
import { SHARE_FONT, SHARE_IMAGE_SIZE } from '@/lib/og/share-image'
import { smallJpeg } from '@/lib/og/small-jpeg'

type Card = {
  /** La portada `full`, firmada. */
  coverUrl: string
  name: string
  /** Ya traducida; sin zona, la adoptada. */
  zone: string
  /** El sello de adoptado, ya traducido. */
  adopted?: string
  /** El nivel de quien publicó, ya traducido. */
  level?: ShareImageLevel
}

/**
 * La imagen de la vista previa de una ficha —la de un animal o la de una camada—, o un 404 si la
 * portada no se pudo bajar (research R6 de la #57).
 */
export async function shareImageResponse(card: Card): Promise<Response> {
  const photo = await coverDataUrl(card.coverUrl, SHARE_PHOTO_SIZE)
  if (photo === null) return new Response(null, { status: 404 })
  const image = new ImageResponse(
    <PetShareImage
      photo={photo}
      name={card.name}
      zone={card.zone}
      adopted={card.adopted}
      level={card.level}
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
