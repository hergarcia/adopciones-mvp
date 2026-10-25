import { getTranslations } from 'next-intl/server'
import { cardView, listedCard, listedCardTexts } from '@/lib/pets/listed-card-view'
import type { ListedCardView, ListedPet } from '@/lib/pets/types'

// Las cards y el total del listado, traducidos en el servidor: los usan la página y la ruta de
// tandas, así el cliente no carga los mensajes (research R4).
export async function listedCardViews(pets: ListedPet[]): Promise<ListedCardView[]> {
  const [t, card, status, litter] = await Promise.all([
    getTranslations('pets'),
    getTranslations('pets.my_pets'),
    getTranslations('pets.status'),
    getTranslations('litters.card'),
  ])
  return pets.map((pet) =>
    cardView(
      listedCard(pet),
      listedCardTexts(pet, {
        // Las mismas palabras que la ficha, más el tamaño.
        petSummary: (one) =>
          t('card_summary', {
            summary: t('page.summary', {
              species: one.species,
              sex: one.sex,
              age: t('age', { unit: one.age.unit, value: one.age.value }),
            }),
            sex: one.sex,
            size: one.size,
          }),
        card,
        status,
        litter,
      }),
    ),
  )
}

export async function listingTotalText(total: number): Promise<string> {
  const t = await getTranslations('pets.listing')
  return t('total', { count: total })
}
