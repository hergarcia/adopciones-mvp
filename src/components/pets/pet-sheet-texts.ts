import { getFormatter, getTranslations } from 'next-intl/server'
import { livesWith } from '@/lib/pets/lives-with'
import { publisherLevelLabel } from '@/lib/pets/publisher-level'
import type { Pet, Publisher } from '@/lib/pets/types'

type FactsSource = Pick<
  Pet,
  | 'name'
  | 'sex'
  | 'size'
  | 'isNeutered'
  | 'vaccines'
  | 'hasChip'
  | 'goodWithKids'
  | 'goodWithDogs'
  | 'goodWithCats'
>

// Lo que comparten la ficha y la lista de quien administra: los datos del animal en dos renglones de
// lectura, y los textos de su galería.

/** «Mediana, castrada, vacunas al día, sin chip.» y «Convive con niños y gatos…». */
export async function petFactLines(pet: FactsSource): Promise<string[]> {
  const [t, format] = await Promise.all([getTranslations('pets.page.facts'), getFormatter()])
  const yesNo = (value: boolean) => (value ? 'yes' : 'no')
  return [
    t('health', {
      size: pet.size,
      neutered: yesNo(pet.isNeutered),
      sex: pet.sex,
      vaccines: pet.vaccines,
      chip: yesNo(pet.hasChip),
    }),
    livesWith(pet)
      .map(({ answer, who }) =>
        t(`lives_with.${answer}`, {
          who: format.list(who.map((companion) => t(`companions.${companion}`))),
        }),
      )
      .join(' '),
  ]
}

export async function petGalleryTexts(pet: Pick<Pet, 'name' | 'photos'>) {
  const t = await getTranslations('pets.page')
  const total = pet.photos.length
  return {
    label: t('gallery_label', { name: pet.name }),
    alts: pet.photos.map((_, index) => t('photo_alt', { n: index + 1, total, name: pet.name })),
    positions: pet.photos.map((_, index) => t('gallery_position', { n: index + 1, total })),
  }
}

/** Los de la nota de quien publica (`OwnerCard`): su foto, si rescata y su nivel en palabras. */
export async function publisherTexts(publisher: Publisher) {
  const [t, profile] = await Promise.all([
    getTranslations('pets.page'),
    getTranslations('profile.public'),
  ])
  const level = publisherLevelLabel(publisher.level)
  return {
    photoAlt: t('publisher_photo_alt', { name: publisher.name }),
    rescuer: profile('rescuer'),
    level: level === null ? null : t(level),
  }
}
