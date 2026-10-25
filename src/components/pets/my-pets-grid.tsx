import { getTranslations } from 'next-intl/server'
import { endAdoptionTexts, handoverLineTexts } from '@/components/adoptions/handover-line-texts'
import type { PetAdoptionSummary } from '@/lib/adoptions/types'
import { petInboxPath } from '@/lib/applications/paths'
import { cardTexts, cardView, litterCardTexts, stampOf } from '@/lib/pets/listed-card-view'
import { MY_PETS_PATH, editPetPath } from '@/lib/pets/paths'
import type { PetSummary } from '@/lib/pets/types'
import { litterEditPath } from '@/lib/litters/paths'
import type { MyLitter } from '@/lib/litters/types'
import { myWallEntries } from '@/lib/litters/my-wall'
import { LitterYoungSummary } from '@/components/litters/litter-young-summary'
import { MyLitterActions } from '@/components/litters/my-litter-actions'
import { verifyPath } from '@/lib/verification/gate'
import { expiryLine } from './expiry-texts'
import { MyPetActions } from './my-pet-actions'
import { PetWall } from './pet-wall'
import { PetPhoto } from './pet-photo'
import { shareTexts } from './share-texts'
import { petStatusTexts } from './status-texts'
import { takedownText } from './takedown-texts'

// «Camada» es femenino: una dada de baja lleva el sello y el motivo concordados como los de una hembra
// dada de baja, «Dada de baja: …» (#205, FR-044).
const TAKEN_DOWN_LITTER = { state: 'taken_down', sex: 'female' } as const

// La pared de lo que la persona ya pegó, con las mismas cards del listado público y el sello del
// estado sobre la foto. La card sigue abriendo la edición (FR-014); debajo, sus acciones. Las
// camadas van en el mismo orden, con sus crías debajo (#205, FR-042).
type Props = {
  pets: PetSummary[]
  litters: MyLitter[]
  /** Cuántas solicitudes tiene cada animal y cuántas son nuevas, por id (historia #65). */
  inbox: ReadonlyMap<string, { fresh: number; total: number }>
  /** A quién se entregó cada adoptado, por id (historia #67). */
  adoptions: ReadonlyMap<string, PetAdoptionSummary>
  /** Lo que va debajo de a quién se lo dio, por id: el seguimiento (historia #69). */
  followUps?: ReadonlyMap<string, React.ReactNode>
  /** La encuesta, debajo de la fila del animal que se dio, por id (historia #71). */
  surveys?: ReadonlyMap<string, React.ReactNode>
}

export async function MyPetsGrid({ pets, litters, inbox, adoptions, followUps, surveys }: Props) {
  const [t, page, status, inboxTexts, mine, litterCard] = await Promise.all([
    getTranslations('pets.my_pets'),
    getTranslations('pets.page'),
    getTranslations('pets.status'),
    getTranslations('inbox.my_pets'),
    getTranslations('litters.my'),
    getTranslations('litters.card'),
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
      const adopted = pet.state === 'adopted'
      const adoption = adoptions.get(pet.id)
      const [share, actions, takedown, expiry, handover, endAdoption] = await Promise.all([
        shareTexts(pet.name),
        petStatusTexts(pet),
        takedownText(pet),
        expiryLine(pet, now),
        adopted ? handoverLineTexts(adoption, pet.sex) : null,
        adopted ? endAdoptionTexts(pet, adoption) : null,
      ])
      return {
        seePet: page('see_pet'),
        share,
        status: { ...actions, endAdoption },
        takedown,
        expiry,
        handover,
      }
    }),
  )
  const textsById = new Map(pets.map((pet, index) => [pet.id, texts[index]]))
  const gateHref = verifyPath({ reason: 'publish', next: MY_PETS_PATH, from: MY_PETS_PATH })
  const entries = myWallEntries(pets, litters)

  const cards = entries.map((entry) =>
    entry.kind === 'pet'
      ? cardView(
          { ...entry.pet, key: entry.pet.id, href: editPetPath(entry.pet.id) },
          { ...cardTexts(entry.pet, t), stamp: stampOf(entry.pet, status) },
        )
      : cardView(
          { ...entry.litter, key: entry.litter.id, href: litterEditPath(entry.litter.id) },
          {
            ...litterCardTexts(entry.litter, litterCard, t),
            stamp: entry.litter.takedown === null ? undefined : stampOf(TAKEN_DOWN_LITTER, status),
          },
        ),
  )
  const litterShares = new Map(
    await Promise.all(
      litters.map(async (litter) => [litter.id, await shareTexts(litter.name)] as const),
    ),
  )
  const litterTakedowns = new Map(
    await Promise.all(
      litters.map(
        async (litter) =>
          [
            litter.id,
            await takedownText({ ...TAKEN_DOWN_LITTER, takedown: litter.takedown }),
          ] as const,
      ),
    ),
  )
  const below = entries.map((entry) => {
    if (entry.kind === 'litter') {
      const { litter } = entry
      const share = litterShares.get(litter.id)
      return (
        <div key={litter.id} className="flex flex-col gap-3">
          <LitterYoungSummary
            texts={{
              count: mine('young_count', { count: litter.young.length }),
              young: litter.young.map((one) => ({
                key: one.id,
                line: mine('young_line', { name: one.name, sex: one.sex }),
              })),
            }}
          />
          {share === undefined ? null : (
            <MyLitterActions
              litter={litter}
              texts={{
                seeLitter: page('see_pet'),
                share,
                edit: page('edit'),
                takedown: litterTakedowns.get(litter.id) ?? null,
              }}
            />
          )}
        </div>
      )
    }
    const pet = entry.pet
    const petTexts = textsById.get(pet.id)
    return petTexts === undefined ? null : (
      <MyPetActions
        key={pet.id}
        pet={pet}
        returnPath={MY_PETS_PATH}
        gateHref={gateHref}
        texts={petTexts}
        inbox={inboxLink(pet.id)}
        followUp={followUps?.get(pet.id)}
      />
    )
  })

  return (
    <PetWall
      cards={cards}
      photo={PetPhoto}
      beneathRow={entries.map((entry) =>
        entry.kind === 'pet' ? (surveys?.get(entry.pet.id) ?? null) : null,
      )}
      below={below}
    />
  )
}
