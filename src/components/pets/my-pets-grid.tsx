import { getTranslations } from 'next-intl/server'
import { cardTexts, cardView, stampOf } from '@/lib/pets/listed-card-view'
import { MY_PETS_PATH, editPetPath } from '@/lib/pets/paths'
import type { PetSummary } from '@/lib/pets/types'
import { verifyPath } from '@/lib/verification/gate'
import { MyPetActions } from './my-pet-actions'
import { PetWall } from './pet-wall'
import { shareTexts } from './share-texts'
import { petStatusTexts } from './status-texts'
import { takedownText } from './takedown-texts'

// La pared de lo que la persona ya pegó, con las mismas cards del listado público y el sello del
// estado sobre la foto. La card sigue abriendo la edición (FR-014); debajo, sus acciones.
export async function MyPetsGrid({ pets }: { pets: PetSummary[] }) {
  const [t, page, status] = await Promise.all([
    getTranslations('pets.my_pets'),
    getTranslations('pets.page'),
    getTranslations('pets.status'),
  ])
  const texts = await Promise.all(
    pets.map(async (pet) => {
      const [share, actions, takedown] = await Promise.all([
        shareTexts(pet.name),
        petStatusTexts(pet),
        takedownText(pet),
      ])
      return { seePet: page('see_pet'), share, status: actions, takedown }
    }),
  )
  const cards = pets.map((pet) =>
    cardView(
      { ...pet, key: pet.id, href: editPetPath(pet.id) },
      { ...cardTexts(pet, t), stamp: stampOf(pet, status) },
    ),
  )
  const gateHref = verifyPath({ reason: 'publish', next: MY_PETS_PATH, from: MY_PETS_PATH })

  return (
    <PetWall
      cards={cards}
      columns="wall"
      below={pets.map((pet, index) => (
        <MyPetActions
          key={pet.id}
          pet={pet}
          returnPath={MY_PETS_PATH}
          gateHref={gateHref}
          texts={texts[index]}
        />
      ))}
    />
  )
}
