import { getTranslations } from 'next-intl/server'
import { handoverLineTexts } from '@/components/adoptions/handover-line-texts'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import { petInboxPath } from '@/lib/applications/paths'
import { cardTexts, cardView, stampOf } from '@/lib/pets/listed-card-view'
import { MY_PETS_PATH, editPetPath } from '@/lib/pets/paths'
import type { PetSummary } from '@/lib/pets/types'
import { verifyPath } from '@/lib/verification/gate'
import { expiryLine } from './expiry-texts'
import { MyPetActions } from './my-pet-actions'
import { PetWall } from './pet-wall'
import { PetPhoto } from './pet-photo'
import { shareTexts } from './share-texts'
import { petStatusTexts } from './status-texts'
import { takedownText } from './takedown-texts'

// La pared de lo que la persona ya pegó, con las mismas cards del listado público y el sello del
// estado sobre la foto. La card sigue abriendo la edición (FR-014); debajo, sus acciones.
type Props = {
  pets: PetSummary[]
  /** Cuántas solicitudes tiene cada animal y cuántas son nuevas, por id (historia #65). */
  inbox: ReadonlyMap<string, { fresh: number; total: number }>
  /** A quién se entregó cada adoptado, por id (historia #67). */
  adoptions: ReadonlyMap<string, PetAdoptionSummary>
}

export async function MyPetsGrid({ pets, inbox, adoptions }: Props) {
  const [t, page, status, inboxTexts] = await Promise.all([
    getTranslations('pets.my_pets'),
    getTranslations('pets.page'),
    getTranslations('pets.status'),
    getTranslations('inbox.my_pets'),
  ])
  const inboxLink = (petId: string) => {
    const counts = inbox.get(petId)
    if (counts === undefined || counts.total === 0) return null
    const label =
      counts.fresh > 0 ? inboxTexts('fresh', { count: counts.fresh }) : inboxTexts('all')
    return { href: petInboxPath(petId), label }
  }
  const now = new Date()
  const texts = await Promise.all(
    pets.map(async (pet) => {
      const [share, actions, takedown, expiry, handover] = await Promise.all([
        shareTexts(pet.name),
        petStatusTexts(pet),
        takedownText(pet),
        expiryLine(pet, now),
        pet.state === 'adopted' ? handoverLineTexts(adoptions.get(pet.id), pet.sex) : null,
      ])
      return { seePet: page('see_pet'), share, status: actions, takedown, expiry, handover }
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
      photo={PetPhoto}
      below={pets.map((pet, index) => (
        <MyPetActions
          key={pet.id}
          pet={pet}
          returnPath={MY_PETS_PATH}
          gateHref={gateHref}
          texts={texts[index]}
          inbox={inboxLink(pet.id)}
        />
      ))}
    />
  )
}
