import { getTranslations } from 'next-intl/server'
import { LazyUnblockButton } from '@/components/moderation/lazy-unblock-button'
import { HiddenFromPublicNotice } from '@/components/pets/hidden-from-public-notice'
import { PetUnavailable } from '@/components/pets/pet-unavailable'
import { signInWithNext } from '@/lib/auth/next-destination'
import type { OwnHiddenLitterReason } from '@/lib/litters/litter-page-state'
import { litterPanelPath, litterPath } from '@/lib/litters/paths'
import type { PublicLitter } from '@/lib/litters/types'
import { MY_PETS_PATH } from '@/lib/pets/paths'
import { verifyPath } from '@/lib/verification/gate'
import { unblockTexts } from '@/app/[locale]/_components/moderation-texts'

// Lo que ve del enlace quien no es la dueña cuando no hay ficha (FR-022, FR-037): un mensaje fijo,
// sin foto, nombre, zona ni nada de quien la publicó, y el camino al listado. Pausada o vencida dice
// eso (FR-019 de la #206).
export async function LitterUnavailableScreen({
  code,
  kind,
  offerSignIn,
}: {
  code: string
  kind: 'missing' | 'unavailable' | 'paused' | 'expired'
  /** Sin sesión: por si quien mira es quien la publicó. */
  offerSignIn: boolean
}) {
  const [t, pets] = await Promise.all([
    getTranslations('litters.page'),
    getTranslations('pets.page'),
  ])
  return (
    <PetUnavailable
      signInHref={signInWithNext(litterPath(code))}
      texts={{
        title: t(`${kind}_title`),
        body: t(`${kind}_body`),
        toListing: pets('to_listing'),
        signIn: offerSignIn ? t('sign_in_to_see') : undefined,
      }}
    />
  )
}

// La camada de alguien que bloqueaste (FR-025): sin nada de ella, con «Desbloquear»; al
// desbloquear, la ficha se vuelve a dibujar entera.
export async function BlockedLitterScreen({
  code,
  publisherPublicId,
}: {
  code: string
  publisherPublicId: string
}) {
  const [t, page, pets] = await Promise.all([
    getTranslations('moderation.block'),
    getTranslations('litters.page'),
    getTranslations('pets.page'),
  ])
  return (
    <PetUnavailable
      texts={{ title: t('pet_title'), body: page('blocked_body'), toListing: pets('to_listing') }}
      action={
        <LazyUnblockButton
          publicId={publisherPublicId}
          returnPath={litterPath(code)}
          texts={await unblockTexts()}
        />
      }
    />
  )
}

// A quien la publicó, por qué nadie más ve su camada y qué hacer (FR-024): sin nivel 1, confirmar
// el teléfono; dada de baja, el motivo y «Mis animales»; pausada o vencida, el camino a su panel,
// donde se reanuda o se vuelve a publicar (FR-021 de la #206).
export async function OwnHiddenLitterNotice({
  litter,
  reason,
}: {
  litter: PublicLitter
  reason: OwnHiddenLitterReason
}) {
  const [t, pets, status] = await Promise.all([
    getTranslations('litters.page'),
    getTranslations('pets.page'),
    getTranslations('pets.status'),
  ])
  const takedown = litter.takedown
  if (reason === 'taken_down' && takedown !== null) {
    return (
      <HiddenFromPublicNotice
        href={MY_PETS_PATH}
        texts={{
          stamp: pets('own_hidden_stamp'),
          body: t('own_taken_down_body', {
            reason: status(`takedown.reasons.${takedown.reason}`, { note: takedown.note ?? '' }),
          }),
          action: t('to_my_pets'),
        }}
      />
    )
  }
  if ((reason === 'paused' || reason === 'expired') && litter.editId !== null) {
    return (
      <HiddenFromPublicNotice
        href={litterPanelPath(litter.editId)}
        texts={{
          stamp: pets('own_hidden_stamp'),
          body: t(`own_${reason}_body`),
          action: t('to_panel'),
        }}
      />
    )
  }
  return (
    <HiddenFromPublicNotice
      href={verifyPath({ reason: 'publish', next: litterPath(litter.code), from: MY_PETS_PATH })}
      texts={{
        stamp: pets('own_hidden_stamp'),
        body: t('own_hidden_body'),
        action: pets('confirm_phone'),
      }}
    />
  )
}
