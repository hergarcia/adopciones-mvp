import { getTranslations } from 'next-intl/server'
import {
  IdentityRequired,
  type IdentityRequiredState,
} from '@/components/applications/identity-required'
import { identityForPetPath } from '@/lib/applications/paths'
import { SUPPORT_EMAIL } from '@/lib/config'
import { petPath } from '@/lib/pets/paths'
import { getMyIdentity } from '@/lib/supabase/queries/identity'
import { identityStatus, type IdentityStatus } from '@/lib/verification/identity-status'
import { NO_GATE, verifyPath } from '@/lib/verification/gate'
import { identityStatusTexts } from '@/app/[locale]/_components/identity-status-texts'
import { instant } from '@/app/[locale]/_components/identity-texts'

type Props = { code: string; name: string; publisherName: string | null }

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

export async function IdentityRequiredScreen({ code, name, publisherName }: Props) {
  const [t, stamps, record] = await Promise.all([
    getTranslations('applications.identity'),
    getTranslations('identity.stamps'),
    getMyIdentity(),
  ])
  const status = record === null ? ({ kind: 'none' } as const) : identityStatus(record, new Date())
  const { state, lines } = await stateLines(status)
  return (
    <IdentityRequired
      state={state}
      texts={{
        title: t('title', { name }),
        body: t('body', { name, publisher: publisherName ?? t('publisher_fallback') }),
        stamp: state === 'request' ? '' : stamps(state),
        lines,
        verify: t('verify'),
        back: t('back', { name }),
      }}
      hrefs={{ verify: identityForPetPath(code), back: petPath(code) }}
      supportEmail={SUPPORT_EMAIL}
    />
  )
}
