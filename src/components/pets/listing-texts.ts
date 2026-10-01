import { getTranslations } from 'next-intl/server'
import { cardTexts, cardView, listedCard, stampOf } from '@/lib/pets/listed-card-view'
import type { ListedCardView, ListedPet } from '@/lib/pets/types'

// Las cards y el total del listado, traducidos en el servidor: los usan la página y la ruta de
// tandas, así el cliente no carga los mensajes (research R4).
export async function listedCardViews(pets: ListedPet[]): Promise<ListedCardView[]> {
  const [t, card, status] = await Promise.all([
    getTranslations('pets'),
    getTranslations('pets.my_pets'),
    getTranslations('pets.status'),
  ])
  return pets.map((pet) =>
    cardView(listedCard(pet), {
      age: t('age', { unit: pet.age.unit, value: pet.age.value }),
      ...cardTexts(pet, card),
      stamp: stampOf({ state: pet.status, sex: pet.sex }, status),
    }),
  )
}

export async function listingTotalText(total: number): Promise<string> {
  const t = await getTranslations('pets.listing')
  return t('total', { count: total })
}
