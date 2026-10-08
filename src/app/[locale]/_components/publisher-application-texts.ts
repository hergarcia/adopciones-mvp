import { getTranslations } from 'next-intl/server'
import type { ApplicantHeaderProps } from '@/components/applications/applicant-header'
import type { PublisherDecision } from '@/components/applications/publisher-application-decision'
import type { PublisherActions } from '@/lib/applications/publisher-actions'
import type { Applicant } from '@/lib/applications/types'
import { levelsPath, publicProfilePath } from '@/lib/profile/public-paths'
import { rejectSheetTexts, responseActionTexts } from './inbox-action-texts'
import { applicantTexts } from './inbox-texts'

// Las partes de una solicitud para el publicador (historia #65) que arma el servidor: quién la
// mandó y la decisión que ofrece, ya traducidas.

/** Quién la mandó, arriba de la solicitud: la explicación de niveles vuelve a `back`. */
export async function applicantHeader(
  applicant: Applicant,
  back: string,
): Promise<ApplicantHeaderProps> {
  const t = await getTranslations('inbox.detail')
  return {
    avatar: applicant.avatar,
    level: applicant.level,
    levelsHref: levelsPath(applicant.level, back),
    profileHref: publicProfilePath(applicant.publicId),
    texts: { ...(await applicantTexts(applicant, true)), profile: t('profile') },
  }
}

/** La decisión que ofrece la solicitud: responder, dejar sin efecto la aceptación, o nada. */
export async function publisherDecision(
  actions: PublisherActions,
  name: string,
): Promise<PublisherDecision | null> {
  if (actions.accept !== null) {
    const t = await getTranslations('inbox.detail')
    const remaining = actions.ask?.kind === 'offer' ? actions.ask.remaining : 0
    return {
      kind: 'respond',
      accept: actions.accept,
      ask: actions.ask,
      texts: {
        contactLater: t('contact_later'),
        actions: await responseActionTexts(name, remaining),
      },
    }
  }
  if (actions.revoke) return { kind: 'revoke', texts: await rejectSheetTexts(name, 'revoke') }
  return null
}
