import { getTranslations } from 'next-intl/server'
import { cardView, listedCard } from '@/lib/pets/listed-card-view'
import type { ListedCardView, ListedPet } from '@/lib/pets/types'
import { zoneName } from '@/lib/zones/zone-name'

// Las cards y el total del listado, traducidos en el servidor: los usan la página y la ruta de
// tandas, así el cliente no carga los mensajes (research R4).
export async function listedCardViews(pets: ListedPet[]): Promise<ListedCardView[]> {
  const t = await getTranslations('pets')
  return pets.map((pet) =>
    cardView(listedCard(pet), {
      age: t('age', { unit: pet.age.unit, value: pet.age.value }),
      urgent: t('my_pets.urgent'),
      alt: t('my_pets.photo_alt', {
        name: pet.name,
        species: pet.species,
        sex: pet.sex,
        zone: zoneName(pet.zone),
      }),
    }),
  )
}

export async function listingTotalText(total: number): Promise<string> {
  const t = await getTranslations('pets.listing')
  return t('total', { count: total })
}
