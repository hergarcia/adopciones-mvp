import { getTranslations } from 'next-intl/server'
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from '@/lib/config'
import { renewalPath, renewalPhotoPath } from '@/lib/pets/paths'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import { URUGUAY_TIME_ZONE } from '@/lib/verification/rules'
import { reportEmailFailure } from './report-email-failure'
import { sendEmail } from './send-email'
import { withDeadline } from './with-deadline'

// «¿<nombre> sigue disponible?» de un animal o de una camada (FR-017 de la #59, FR-011 de la #206):
// la portada, el día en que vence, «Sigue disponible», que renueva sin ingresar, y «Ya no está
// disponible», que lleva a su pantalla en «Mis animales». Las direcciones llevan el token o el id de
// lo publicado, nada de la persona. Se intenta una vez y nunca lanza: el recordatorio ya quedó
// marcado y el vencimiento llega igual. El log no lleva dirección ni id.
export async function sendReminderEmail(input: {
  ownerId: string
  namespace: 'emails.pet_reminder' | 'emails.litter_reminder'
  /** El nombre y, de un animal, su sexo para los textos. */
  values: { name: string; sex?: string }
  expiresAt: Date
  token: string
  /** «Ya no está disponible»: el animal o la camada en «Mis animales». */
  notAvailablePath: string
  locale: string
}): Promise<boolean> {
  try {
    const to = await getAccountEmail(input.ownerId)
    if (to === null) {
      await reportEmailFailure('recordatorio: no se encontró la dirección de la cuenta')
      return false
    }

    const t = await getTranslations({ locale: input.locale, namespace: input.namespace })
    const date = new Intl.DateTimeFormat(input.locale, {
      day: 'numeric',
      month: 'long',
      timeZone: URUGUAY_TIME_ZONE,
    }).format(input.expiresAt)
    const values = { ...input.values, date, app: APP_NAME, email: SUPPORT_EMAIL }
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
            alt: input.values.name,
          },
          secondary: {
            label: t('not_available'),
            url: new URL(input.notAvailablePath, APP_URL).toString(),
          },
        },
      }),
    )
    if (!sent.ok) await reportEmailFailure('recordatorio: el servicio de correo no lo aceptó')
    return sent.ok
  } catch {
    await reportEmailFailure('recordatorio: no se pudo mandar')
    return false
  }
}
