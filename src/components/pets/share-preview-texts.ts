import { getTranslations } from 'next-intl/server'
import { publisherLevelLabel } from '@/lib/pets/publisher-level'
import { shareDescription } from '@/lib/pets/share-description'
import type { Publisher } from '@/lib/pets/types'

/**
 * El nivel de quien publicó con las palabras del sello de la ficha, o null sin nivel. La ruta de la
 * imagen pasa el idioma: fuera de una página no hay uno pedido.
 */
export async function shareLevelText(
  level: Publisher['level'],
  locale?: string,
): Promise<string | null> {
  const key = publisherLevelLabel(level)
  if (key === null) return null
  const t = await (locale === undefined
    ? getTranslations('pets.page')
    : getTranslations({ locale, namespace: 'pets.page' }))
  return t(key)
}

/** El texto debajo del título en la vista previa de un animal o una camada (historia #244). */
export async function sharePreviewDescription(input: {
  zone: string
  adopted: boolean
  level: Publisher['level']
}): Promise<string> {
  const [t, level] = await Promise.all([getTranslations('pets'), shareLevelText(input.level)])
  return shareDescription(
    { zone: input.zone, adopted: input.adopted, level },
    {
      listing: t('metadata.listing.title'),
      withLevel: (zone, levelText) => t('share.description', { zone, level: levelText }),
    },
  )
}
