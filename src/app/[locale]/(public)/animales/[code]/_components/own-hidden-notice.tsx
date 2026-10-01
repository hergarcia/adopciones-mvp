import { getTranslations } from 'next-intl/server'
import { HiddenFromPublicNotice } from '@/components/pets/hidden-from-public-notice'
import { MY_PETS_PATH, myPetPath, petPath } from '@/lib/pets/paths'
import type { OwnHiddenReason } from '@/lib/pets/pet-page-state'
import type { PublicPet } from '@/lib/pets/types'
import { verifyPath } from '@/lib/verification/gate'

type Props = { pet: PublicPet; reason: OwnHiddenReason }

// Al publicador, por qué nadie más ve su ficha y qué hacer (FR-013): sin nivel 1, confirmar el
// teléfono; pausada, vencida o dada de baja, ese animal en «Mis animales», donde están sus acciones.
export async function OwnHiddenNotice({ pet, reason }: Props) {
  const [t, status] = await Promise.all([
    getTranslations('pets.page'),
    getTranslations('pets.status'),
  ])
  if (reason === 'no_level' || pet.editId === null) {
    return (
      <HiddenFromPublicNotice
        href={verifyPath({ reason: 'publish', next: petPath(pet.code), from: MY_PETS_PATH })}
        texts={{
          stamp: t('own_hidden_stamp'),
          body: t('own_hidden_body'),
          action: t('confirm_phone'),
        }}
      />
    )
  }

  const takedown = pet.takedown
  const body =
    reason === 'taken_down'
      ? t('own_taken_down_body', {
          reason:
            takedown === null
              ? ''
              : status(`takedown.reasons.${takedown.reason}`, { note: takedown.note ?? '' }),
        })
      : t(reason === 'paused' ? 'own_paused_body' : 'own_expired_body', {
          name: pet.name,
          sex: pet.sex,
        })
  return (
    <HiddenFromPublicNotice
      href={myPetPath(pet.editId)}
      texts={{
        stamp: t('own_hidden_stamp_state', { state: reason, sex: pet.sex }),
        body,
        action: t('to_my_pet', { name: pet.name }),
      }}
    />
  )
}
