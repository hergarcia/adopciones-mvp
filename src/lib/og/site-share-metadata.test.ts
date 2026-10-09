// Covers: US1-AS8, FR-040 (research R5: la tarjeta con la imagen de la portada y su versión)
import { describe, expect, it } from 'vitest'
import { APP_NAME } from '@/lib/config'
import { siteShareMetadata } from './site-share-metadata'
import { siteShareVersion } from './site-share-version'

const SHARE = {
  title: '¿Cómo reconocer una estafa antes de adoptar?',
  description: 'La señal más común y qué hacer.',
  phrase: 'Perros y gatos en adopción.',
}
const URL_OF = `/imagen?v=${siteShareVersion({ siteName: APP_NAME, phrase: SHARE.phrase })}`

describe('siteShareMetadata', () => {
  it('arma Open Graph con el título, la descripción, el sitio y la imagen versionada', () => {
    expect(siteShareMetadata(SHARE).openGraph).toEqual({
      type: 'website',
      siteName: APP_NAME,
      title: SHARE.title,
      description: SHARE.description,
      images: [{ url: URL_OF, width: 1200, height: 630, type: 'image/jpeg', alt: SHARE.phrase }],
    })
  })

  it('la tarjeta grande de Twitter usa la misma imagen', () => {
    expect(siteShareMetadata(SHARE).twitter).toEqual({
      card: 'summary_large_image',
      title: SHARE.title,
      description: SHARE.description,
      images: [URL_OF],
    })
  })

  it('la versión cambia con la frase de la imagen, no con el título', () => {
    const url = (share: typeof SHARE) => siteShareMetadata(share).twitter?.images
    expect(url({ ...SHARE, title: 'Otro título' })).toEqual(url(SHARE))
    expect(url({ ...SHARE, phrase: 'Gatos en adopción.' })).not.toEqual(url(SHARE))
  })
})
