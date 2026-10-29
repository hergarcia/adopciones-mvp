import { getTranslations } from 'next-intl/server'
import { publisherLevelLabel } from '@/lib/pets/publisher-level'
import { shareDescription } from '@/lib/pets/share-description'
import type { Publisher } from '@/lib/pets/types'

export type ShareImageLevel = {
  /** «Quien publica», para que el nivel no se lea como algo del animal. */
  lead: string
  /** El nivel con las palabras del sello de la ficha. */
  text: string
}

/** El nivel de quien publicó para la imagen, o null sin nivel. La ruta pasa el idioma: fuera de una página no hay uno pedido. */
export async function shareImageLevel(
  level: Publisher['level'],
  locale: string,
): Promise<ShareImageLevel | null> {
  const key = publisherLevelLabel(level)
  if (key === null) return null
  const t = await getTranslations({ locale, namespace: 'pets' })
  return { lead: t('share.image_publisher'), text: t(`page.${key}`) }
}

/** El texto debajo del título en la vista previa de un animal o una camada. */
export async function sharePreviewDescription(input: {
  zone: string
  adopted: boolean
  level: Publisher['level']
}): Promise<string> {
  const t = await getTranslations('pets')
  const key = publisherLevelLabel(input.level)
  return shareDescription(
    { zone: input.zone, adopted: input.adopted, publisher: key && t(`share.publisher.${key}`) },
    {
      listing: t('metadata.listing.title'),
      withPublisher: (zone, publisher) => t('share.description', { zone, publisher }),
    },
  )
}
