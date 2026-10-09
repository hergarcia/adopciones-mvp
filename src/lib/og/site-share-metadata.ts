import type { Metadata } from 'next'
import { APP_NAME } from '@/lib/config'
import { SHARE_IMAGE_SIZE } from './share-image'
import { siteShareVersion } from './site-share-version'

type SiteShare = {
  title: string
  description: string
  /** La frase que dibuja la imagen de la portada: entra en su versión y es su texto alternativo. */
  phrase: string
}

/** La tarjeta del enlace compartido con la imagen de la portada: la portada y las preguntas. */
export function siteShareMetadata({
  title,
  description,
  phrase,
}: SiteShare): Pick<Metadata, 'openGraph' | 'twitter'> {
  const image = {
    url: `/imagen?v=${siteShareVersion({ siteName: APP_NAME, phrase })}`,
    ...SHARE_IMAGE_SIZE,
  }
  return {
    openGraph: {
      type: 'website',
      siteName: APP_NAME,
      title,
      description,
      images: [{ ...image, type: 'image/jpeg', alt: phrase }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  }
}
