import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import sharp from 'sharp'
import { PetShareImage, SHARE_PHOTO_SIZE } from '@/components/pets/pet-share-image'
import { APP_NAME } from '@/lib/config'
import { shareFont } from '@/lib/og/share-font'
import { SHARE_FONT, SHARE_IMAGE_SIZE } from '@/lib/og/share-image'
import { smallJpeg } from '@/lib/og/small-jpeg'
import { getShareCard } from '@/lib/supabase/queries/listed-pets'
import { zoneName } from '@/lib/zones/zone-name'

// La imagen de la vista previa (research R6): `next/og` no decodifica WebP, así que la portada pasa
// por `sharp` a JPEG, entera en su 4:5.
export const runtime = 'nodejs'

// La portada entera a la medida de la tarjeta. Si no llegó en 4:5, se recorta conservando la parte
// de arriba, donde suele estar la cara.
async function coverDataUrl(url: string): Promise<string | null> {
  const response = await fetch(url)
  if (!response.ok) return null
  const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize({ ...SHARE_PHOTO_SIZE, fit: 'cover', position: 'top' })
    .jpeg({ quality: 90 })
    .toBuffer()
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ locale: string; code: string }> },
) {
  const { locale, code } = await params
  const card = await getShareCard(code)
  const photo = card === null ? null : await coverDataUrl(card.coverUrl)
  if (card === null || photo === null) return new Response(null, { status: 404 })

  const t = await getTranslations({ locale, namespace: 'pets.share' })
  const image = new ImageResponse(
    <PetShareImage
      photo={photo}
      name={card.name}
      zone={zoneName(card.zone)}
      adopted={card.isAdopted ? t('adopted_stamp', { sex: card.sex }) : undefined}
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
