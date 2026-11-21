import { getTranslations } from 'next-intl/server'
import { HeldOffer } from '@/components/applications/held-offer'
import {
  IdentityRequired,
  type IdentityRequiredState,
} from '@/components/applications/identity-required'
import { MY_APPLICATIONS_PATH, applyHoldPath, identityForPetPath } from '@/lib/applications/paths'
import { SUPPORT_EMAIL } from '@/lib/config'
import { petPath } from '@/lib/pets/paths'
import type { PetPhotoData } from '@/lib/pets/types'
import { getMyIdentity } from '@/lib/supabase/queries/identity'
import { identityStatus, type IdentityStatus } from '@/lib/verification/identity-status'
import { NO_GATE, verifyPath } from '@/lib/verification/gate'
import { identityStatusTexts } from '@/app/[locale]/_components/identity-status-texts'
import { heldLineText } from '@/app/[locale]/_components/application-texts'
import { instant } from '@/app/[locale]/_components/identity-texts'

type Props = {
  code: string
  /** La camada de la cría que se pide, para que el cuestionario sepa volver a ella. */
  litterCode: string | null
  name: string
  publisherName: string | null
  cover: PetPhotoData | null
  /**
   * Dejar escrita la solicitud (historia #289): `hold` la ofrece si el pedido sigue en revisión al
   * leerlo acá; `held`, que ya dejó una para este animal.
   */
  offer: 'hold' | 'held' | null
}

// Lo que dice el aviso según el pedido de identidad de quien solicita (US3-AS3, US3-AS4): sin uno
// abierto, la tirita para pedirla desde este animal; en revisión, desde qué día y que llega un
// correo; con el tope, el día en que puede volver a pedirla y la ayuda, como en su verificación.
async function stateLines(
  status: IdentityStatus,
): Promise<{ state: IdentityRequiredState; lines: string[] }> {
  if (status.kind === 'in_review') {
    const t = await getTranslations('applications.identity')
    const sent = await instant(status.sentAt)
    return {
      state: 'in_review',
      lines: [t('in_review_sent', { date: sent.date }), t('in_review_mail')],
    }
  }
  if (status.kind === 'capped') {
    const texts = await identityStatusTexts(status, 1, verifyPath(NO_GATE))
    return { state: 'capped', lines: texts.lines }
  }
  return { state: 'request', lines: [] }
}

async function offerOf(
  offer: Props['offer'],
  state: IdentityRequiredState,
  props: Pick<Props, 'code' | 'litterCode' | 'name' | 'publisherName'>,
) {
  if (offer === null || (offer === 'hold' && state !== 'in_review')) return null
  const t = await getTranslations('applications.held')
  if (offer === 'held') {
    return (
      <HeldOffer
        state="waiting"
        href={MY_APPLICATIONS_PATH}
        texts={{ waiting: t('waiting', { name: props.name }), toMine: t('to_mine') }}
      />
    )
  }
  return (
    <HeldOffer
      state="offer"
      href={applyHoldPath(props.code, props.litterCode)}
      texts={{ offer: t('offer'), line: await heldLineText(props.publisherName) }}
    />
  )
}

// La opción de dejarla escrita sale del pedido leído acá, al dibujar, y no solo de la puerta: si se
// resolvió entre las dos lecturas, la pantalla no ofrece algo que ya no puede hacer.
export async function IdentityRequiredScreen({
  code,
  litterCode,
  name,
  publisherName,
  cover,
  offer,
}: Props) {
  const [t, form, stamps, record] = await Promise.all([
    getTranslations('applications.identity'),
    getTranslations('applications.form'),
    getTranslations('identity.stamps'),
    getMyIdentity(),
  ])
  const status = record === null ? ({ kind: 'none' } as const) : identityStatus(record, new Date())
  const { state, lines } = await stateLines(status)
  const offerNode = await offerOf(offer, state, { code, litterCode, name, publisherName })
  return (
    <IdentityRequired
      state={state}
      cover={cover}
      texts={{
        photoAlt: form('photo_alt', { name }),
        title: t('title', { name }),
        body: t('body', { name, publisher: publisherName ?? t('publisher_fallback') }),
        stamp: state === 'request' ? '' : stamps(state),
        lines,
        verify: t('verify'),
        back: t('back', { name }),
      }}
      hrefs={{ verify: identityForPetPath(code), back: petPath(code) }}
      supportEmail={SUPPORT_EMAIL}
      offer={offerNode}
    />
  )
}
