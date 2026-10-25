import { getTranslations } from 'next-intl/server'
import type { YoungInReview } from '@/lib/pets/review-types'
import type { YoungInReviewTexts } from './young-in-review-list'

/** Los textos de las crías de una camada en revisión, ya con el nombre y el sexo de cada una. */
export async function youngInReviewTexts(young: YoungInReview[]): Promise<YoungInReviewTexts> {
  const [page, pets, review] = await Promise.all([
    getTranslations('litters.page'),
    getTranslations('pets.page'),
    getTranslations('litters.review'),
  ])
  return {
    title: page('young_title'),
    noPhotos: review('no_photos'),
    young: Object.fromEntries(
      young.map((one) => {
        const total = one.photos.length
        return [
          one.id,
          {
            sex: page('young_sex', { sex: one.sex }),
            photosLabel: pets('gallery_label', { name: one.name }),
            photoAlts: one.photos.map((_, index) =>
              pets('photo_alt', { n: index + 1, total, name: one.name }),
            ),
          },
        ]
      }),
    ),
  }
}
