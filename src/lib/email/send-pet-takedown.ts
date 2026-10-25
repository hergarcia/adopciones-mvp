import { getTranslations } from 'next-intl/server'
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from '@/lib/config'
import { MY_PETS_PATH, myPetPath } from '@/lib/pets/paths'
import type { Takedown } from '@/lib/pets/types'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import { sendEmail } from './send-email'
import { withDeadline } from './with-deadline'
import { reportEmailFailure } from './report-email-failure'

// «Dimos de baja a Tobi» (FR-027, contracts §Correos): el motivo tal cual, que ya no se ve, que se
// puede borrar desde «Mis animales» y la dirección de ayuda. Nunca quién decidió (FR-029). Sale
// después de la baja y nunca lanza: si falla, la baja queda y el motivo se ve en «Mis animales». El
// log no lleva dirección ni id. Una camada tiene su texto: la baja alcanza a sus crías, y su motivo se
// lee en «Mis animales» (#205, FR-044).
export async function sendPetTakedown(input: {
  ownerId: string
  subject: { kind: 'pet'; petId: string } | { kind: 'litter' }
  name: string
  takedown: Takedown
  locale: string
}): Promise<void> {
  try {
    const to = await getAccountEmail(input.ownerId)
    if (to === null) {
      await reportEmailFailure('baja: no se encontró la dirección de la cuenta')
      return
    }

    const isLitter = input.subject.kind === 'litter'
    const t = await getTranslations({ locale: input.locale, namespace: 'emails.pet_takedown' })
    const litter = await getTranslations({
      locale: input.locale,
      namespace: 'emails.litter_takedown',
    })
    const text = isLitter ? litter : t
    const reasons = await getTranslations({
      locale: input.locale,
      namespace: 'pets.status.takedown.reasons',
    })
    const reason = reasons(input.takedown.reason, { note: input.takedown.note ?? '' })
    const values = { name: input.name, reason, app: APP_NAME, email: SUPPORT_EMAIL }
    const path = input.subject.kind === 'pet' ? myPetPath(input.subject.petId) : MY_PETS_PATH
    const sent = await withDeadline(
      sendEmail({
        to,
        subject: text('subject', values),
        url: new URL(path, APP_URL).toString(),
        lang: input.locale,
        texts: {
          heading: text('heading', values),
          body: text('body', values),
          button: t('button'),
          fallback: t('fallback'),
          footer: text('footer', values),
        },
      }),
    )
    if (!sent.ok) await reportEmailFailure('baja: el servicio de correo no lo aceptó')
  } catch {
    await reportEmailFailure('baja: no se pudo mandar')
  }
}
