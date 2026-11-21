import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { ProfileShareImage } from '@/components/profile/profile-share-image'
import { APP_NAME } from '@/lib/config'
import { shareFont } from '@/lib/og/share-font'
import { SHARE_FONT, SHARE_IMAGE_SIZE } from '@/lib/og/share-image'
import { smallJpeg } from '@/lib/og/small-jpeg'
import { publisherLevelLabel } from '@/lib/pets/publisher-level'
import { parseShareLevel } from '@/lib/profile/share-metadata'

export const runtime = 'nodejs'

// No lee la base ni la sesión: no sabe de quién es, y solo cambia con las palabras del nivel, que van
// en `?v=`; por eso se guarda para siempre.
export async function GET(
  _: Request,
  { params }: { params: Promise<{ locale: string; level: string }> },
) {
  const { locale, level: segment } = await params
  const key = publisherLevelLabel(parseShareLevel(segment))
  if (key === null) return new Response(null, { status: 404 })

  const t = await getTranslations({ locale, namespace: 'pets.page' })
  const image = new ImageResponse(<ProfileShareImage levelText={t(key)} siteName={APP_NAME} />, {
    ...SHARE_IMAGE_SIZE,
    fonts: [{ name: SHARE_FONT, data: await shareFont(), weight: 800, style: 'normal' }],
  })
  const jpeg = await smallJpeg(Buffer.from(await image.arrayBuffer()))
  return new Response(new Uint8Array(jpeg), {
    headers: {
      'content-type': 'image/jpeg',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}
