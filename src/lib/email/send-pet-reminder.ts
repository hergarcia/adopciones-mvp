import { getTranslations } from 'next-intl/server'
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from '@/lib/config'
import { myPetPath, renewalPath, renewalPhotoPath } from '@/lib/pets/paths'
import type { Sex } from '@/lib/pets/options'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'
import { sendEmail } from './send-email'
import { withDeadline } from './with-deadline'

// «¿Tobi sigue disponible?» (FR-017, contracts §Correos): la portada, el día en que vence, «Sigue
// disponible», que renueva sin ingresar, y «Ya no está disponible», que lleva al animal en «Mis
// animales». Las tres direcciones llevan el token o el id del animal, nada de la persona (FR-020).
// Se intenta una vez y nunca lanza: el recordatorio ya quedó marcado y el vencimiento llega igual.
// El log no lleva dirección ni id.
export async function sendPetReminder(input: {
  ownerId: string
  petId: string
  name: string
  sex: Sex
  expiresAt: Date
  token: string
  locale: string
}): Promise<boolean> {
  try {
    const to = await getAccountEmail(input.ownerId)
    if (to === null) {
      console.error('[correo] recordatorio: no se encontró la dirección de la cuenta')
      return false
    }

    const t = await getTranslations({ locale: input.locale, namespace: 'emails.pet_reminder' })
    const date = new Intl.DateTimeFormat(input.locale, {
      day: 'numeric',
      month: 'long',
      timeZone: URUGUAY_TIME_ZONE,
    }).format(input.expiresAt)
    const values = { name: input.name, sex: input.sex, date, app: APP_NAME, email: SUPPORT_EMAIL }
    const sent = await withDeadline(
      sendEmail({
        to,
        subject: t('subject', values),
        url: new URL(renewalPath(input.token), APP_URL).toString(),
        lang: input.locale,
        texts: {
          heading: t('heading', values),
          body: t('body', values),
          button: t('button'),
          fallback: t('fallback'),
          footer: t('footer', values),
        },
        extras: {
          image: {
            src: new URL(renewalPhotoPath(input.token), APP_URL).toString(),
            alt: input.name,
          },
          secondary: {
            label: t('not_available'),
            url: new URL(myPetPath(input.petId), APP_URL).toString(),
          },
        },
      }),
    )
    if (!sent.ok) console.error('[correo] recordatorio: el servicio de correo no lo aceptó')
    return sent.ok
  } catch {
    console.error('[correo] recordatorio: no se pudo mandar')
    return false
  }
}
