import { getTranslations } from 'next-intl/server'
import { APP_NAME, APP_URL } from '@/lib/config'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import { lostDayLabel } from '@/lib/verification/lost-notice'
import { sendEmail, type SendOutcome } from './send-email'

// Pasado un minuto sin respuesta del servicio de correo, el aviso cuenta como fallido (FR-010). El
// SDK no documenta una señal de aborto, así que es una carrera contra un temporizador.
const DEADLINE_MS = 60_000

async function withDeadline(sending: Promise<SendOutcome>): Promise<SendOutcome> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<SendOutcome>((resolve) => {
    timer = setTimeout(() => resolve({ ok: false }), DEADLINE_MS)
  })
  try {
    return await Promise.race([sending, late])
  } finally {
    clearTimeout(timer)
  }
}

// El aviso a la cuenta que perdió su número. Sin el número, sin nada de la cuenta que se lo quedó,
// y con un enlace común a «Mi perfil», que pide ingresar como siempre (FR-010, FR-012). Nunca
// lanza: si falla, quedarse con el número no se deshace y la cuenta se entera por su perfil. El log
// no lleva ni la dirección ni el id.
export async function sendNumberLost(input: {
  userId: string
  lostOn: string
  locale: string
}): Promise<void> {
  try {
    const to = await getAccountEmail(input.userId)
    if (to === null) {
      console.error('[correo] número perdido: no se encontró la dirección de la cuenta')
      return
    }

    const t = await getTranslations({ locale: input.locale, namespace: 'emails.number_lost' })
    const sent = await withDeadline(
      sendEmail({
        to,
        subject: t('subject'),
        url: new URL('/mi-perfil', APP_URL).toString(),
        lang: input.locale,
        texts: {
          heading: t('heading'),
          body: t('body', { date: lostDayLabel(input.lostOn, input.locale), app: APP_NAME }),
          button: t('button'),
          fallback: t('fallback'),
          footer: t('footer'),
        },
      }),
    )
    if (!sent.ok) console.error('[correo] número perdido: el servicio de correo no lo aceptó')
  } catch {
    console.error('[correo] número perdido: no se pudo mandar')
  }
}
