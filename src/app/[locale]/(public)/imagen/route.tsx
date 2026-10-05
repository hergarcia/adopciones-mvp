import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { SiteShareImage } from '@/components/site/site-share-image'
import { APP_NAME } from '@/lib/config'
import { shareFont } from '@/lib/og/share-font'
import { SHARE_FONT, SHARE_IMAGE_SIZE } from '@/lib/og/share-image'
import { smallJpeg } from '@/lib/og/small-jpeg'

export const runtime = 'nodejs'

// La vista previa de la portada (research R5). No lee la base: es la misma para todos y solo cambia
// con el nombre o la frase, que viajan en `?v=`; por eso se guarda para siempre.
export async function GET(_: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'home' })
  const image = new ImageResponse(
    <SiteShareImage siteName={APP_NAME} phrase={t('hero.title')} tagline={t('share.tagline')} />,
    {
      ...SHARE_IMAGE_SIZE,
      fonts: [{ name: SHARE_FONT, data: await shareFont(), weight: 800, style: 'normal' }],
    },
  )
  const jpeg = await smallJpeg(Buffer.from(await image.arrayBuffer()))
  return new Response(new Uint8Array(jpeg), {
    headers: {
      'content-type': 'image/jpeg',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}
