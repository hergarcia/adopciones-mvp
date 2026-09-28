import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import {
  PetShareImage,
  SHARE_FONT,
  SHARE_IMAGE_SIZE,
  SHARE_PHOTO_SIZE,
} from '@/components/pets/pet-share-image'
import { APP_NAME } from '@/lib/config'
import { SHARE_IMAGE_MAX_BYTES } from '@/lib/pets/rules'
import { getShareCard } from '@/lib/supabase/queries/listed-pets'
import { zoneName } from '@/lib/zones/zone-name'

// La imagen de la vista previa (research R6): `next/og` no decodifica WebP, así que la portada pasa
// por `sharp` a JPEG, recortada conservando la parte de arriba, donde suele estar la cara. La salida
// de `ImageResponse` es PNG y pesa cerca de un mega: vuelve por `sharp` a JPEG, bajando la calidad
// hasta que entra en lo que WhatsApp acepta.
export const runtime = 'nodejs'

const QUALITIES = [80, 70, 60]

const font = readFile(
  join(
    process.cwd(),
    'src/app/[locale]/(public)/animales/[code]/imagen/BricolageGrotesque_Condensed-ExtraBold.ttf',
  ),
)

// La franja de 1200 × 440 centrada en la línea del primer tercio de la foto: en una vertical, la
// cara suele estar ahí, y un recorte al centro se quedaría con el lomo.
async function coverDataUrl(url: string): Promise<string | null> {
  const response = await fetch(url)
  if (!response.ok) return null
  const wide = await sharp(Buffer.from(await response.arrayBuffer()))
    .resize({
      width: SHARE_PHOTO_SIZE.width,
      height: SHARE_PHOTO_SIZE.height,
      fit: 'outside',
    })
    .toBuffer({ resolveWithObject: true })
  const room = wide.info.height - SHARE_PHOTO_SIZE.height
  const top = Math.min(
    room,
    Math.max(0, Math.round(wide.info.height / 3 - SHARE_PHOTO_SIZE.height / 2)),
  )
  const jpeg = await sharp(wide.data)
    .extract({
      left: Math.round((wide.info.width - SHARE_PHOTO_SIZE.width) / 2),
      top,
      ...SHARE_PHOTO_SIZE,
    })
    .jpeg({ quality: 90 })
    .toBuffer()
  return `data:image/jpeg;base64,${jpeg.toString('base64')}`
}

async function smallJpeg(png: Buffer): Promise<Buffer> {
  let jpeg = png
  for (const quality of QUALITIES) {
    // Cada calidad depende de cuánto pesó la anterior.
    // oxlint-disable-next-line no-await-in-loop
    jpeg = await sharp(png).jpeg({ quality, mozjpeg: true }).toBuffer()
    if (jpeg.length <= SHARE_IMAGE_MAX_BYTES) break
  }
  return jpeg
}

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const card = await getShareCard(code)
  const photo = card === null ? null : await coverDataUrl(card.coverUrl)
  if (card === null || photo === null) return new Response(null, { status: 404 })

  const image = new ImageResponse(
    <PetShareImage photo={photo} name={card.name} zone={zoneName(card.zone)} siteName={APP_NAME} />,
    {
      ...SHARE_IMAGE_SIZE,
      fonts: [{ name: SHARE_FONT, data: await font, weight: 800, style: 'normal' }],
    },
  )
  const jpeg = await smallJpeg(Buffer.from(await image.arrayBuffer()))
  return new Response(new Uint8Array(jpeg), {
    headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-store' },
  })
}
