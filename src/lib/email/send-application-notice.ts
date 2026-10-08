import { getTranslations } from 'next-intl/server'
import { noticeEmail } from '@/lib/applications/notices'
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from '@/lib/config'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import type { ClaimedNotice } from '@/lib/supabase/queries/application-response-records'
import { deliverNotice } from './deliver-notice'
import { sendEmail } from './send-email'

// Un correo de la bandeja de salida (contracts §Correos): el nombre del animal, su sexo para
// concordar y el botón a la solicitud. Nunca un teléfono, una respuesta, una pregunta, un motivo ni
// el correo de nadie (FR-063). Nunca lanza: la respuesta del publicador ya está guardada (FR-064).
// El log no lleva dirección ni id.
export async function sendApplicationNotice(notice: ClaimedNotice, locale: string): Promise<void> {
  const { sent } = await deliverNotice(async () => {
    const to = await getAccountEmail(notice.recipientId)
    if (to === null) return { ok: false }
    const t = await getTranslations({ locale, namespace: 'emails.applications' })
    const values = {
      name: notice.petName,
      sex: notice.petSex ?? 'male',
      app: APP_NAME,
      email: SUPPORT_EMAIL,
    }
    const kind = notice.kind
    return sendEmail({
      to,
      subject: t(`${kind}.subject`, values),
      url: new URL(noticeEmail(kind, notice.applicationId).path, APP_URL).toString(),
      lang: locale,
      texts: {
        heading: t(`${kind}.heading`, values),
        body: t(`${kind}.body`, values),
        button: t(`${kind}.button`),
        fallback: t(`${kind}.fallback`),
        footer: t(`${kind}.footer`, values),
      },
    })
  })
  if (!sent) console.error(`[correo] solicitud ${notice.kind}: no se pudo mandar`)
}
