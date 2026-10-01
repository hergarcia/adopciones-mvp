import { getTranslations } from 'next-intl/server'
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from '@/lib/config'
import type { Sex } from '@/lib/pets/options'
import { myPetPath } from '@/lib/pets/paths'
import type { Takedown } from '@/lib/pets/types'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import { sendEmail } from './send-email'
import { withDeadline } from './with-deadline'

// «Dimos de baja a Tobi» (FR-027, contracts §Correos): el motivo tal cual, que ya no se ve, que se
// puede borrar desde «Mis animales» y la dirección de ayuda. Nunca quién decidió (FR-029). Sale
// después de la baja y nunca lanza: si falla, la baja queda y el motivo se ve en «Mis animales». El
// log no lleva dirección ni id.
export async function sendPetTakedown(input: {
  ownerId: string
  petId: string
  name: string
  sex: Sex
  takedown: Takedown
  locale: string
}): Promise<void> {
  try {
    const to = await getAccountEmail(input.ownerId)
    if (to === null) {
      console.error('[correo] baja: no se encontró la dirección de la cuenta')
      return
    }

    const t = await getTranslations({ locale: input.locale, namespace: 'emails.pet_takedown' })
    const reasons = await getTranslations({
      locale: input.locale,
      namespace: 'pets.status.takedown.reasons',
    })
    const reason = reasons(input.takedown.reason, { note: input.takedown.note ?? '' })
    const values = { name: input.name, sex: input.sex, reason, app: APP_NAME, email: SUPPORT_EMAIL }
    const sent = await withDeadline(
      sendEmail({
        to,
        subject: t('subject', values),
        url: new URL(myPetPath(input.petId), APP_URL).toString(),
        lang: input.locale,
        texts: {
          heading: t('heading', values),
          body: t('body', values),
          button: t('button'),
          fallback: t('fallback'),
          footer: t('footer', values),
        },
      }),
    )
    if (!sent.ok) console.error('[correo] baja: el servicio de correo no lo aceptó')
  } catch {
    console.error('[correo] baja: no se pudo mandar')
  }
}
