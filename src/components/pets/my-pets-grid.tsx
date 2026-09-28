import { getTranslations } from 'next-intl/server'
import { cardView } from '@/lib/pets/listed-card-view'
import { editPetPath } from '@/lib/pets/paths'
import type { PetSummary } from '@/lib/pets/types'
import { zoneName } from '@/lib/zones/zone-name'
import { MyPetActions } from './my-pet-actions'
import { PetWall } from './pet-wall'
import { shareTexts } from './share-texts'

// La pared de lo que la persona ya pegó, con las mismas cards del listado público. La card sigue
// abriendo la edición (FR-014); debajo, «Ver ficha» y «Compartir».
export async function MyPetsGrid({ pets }: { pets: PetSummary[] }) {
  const t = await getTranslations('pets.my_pets')
  const seePet = (await getTranslations('pets.page'))('see_pet')
  const shares = await Promise.all(pets.map((pet) => shareTexts(pet.name)))
  const cards = pets.map((pet) =>
    cardView(
      { ...pet, key: pet.id, href: editPetPath(pet.id) },
      {
        urgent: t('urgent'),
        alt: t('photo_alt', {
          name: pet.name,
          species: pet.species,
          sex: pet.sex,
          zone: zoneName(pet.zone),
        }),
      },
    ),
  )

  return (
    <PetWall
      cards={cards}
      columns="wall"
      below={pets.map((pet, index) => (
        <MyPetActions key={pet.id} code={pet.code} texts={{ seePet, share: shares[index] }} />
      ))}
    />
  )
}
