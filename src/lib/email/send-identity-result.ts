import { getTranslations } from 'next-intl/server'
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from '@/lib/config'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import type { RejectionReason } from '@/lib/verification/identity'
import { lostDayLabel } from '@/lib/verification/lost-notice'
import { sendEmail } from './send-email'
import { withDeadline } from './with-deadline'

export type IdentityResult =
  | { kind: 'approved'; on: string; levelTwoNow: boolean }
  | { kind: 'rejected'; on: string; reason: RejectionReason; retryOn: string | null }
  | { kind: 'expired'; on: string }

const PROFILE_PATH = '/mi-perfil'
const IDENTITY_PATH = '/verificar-identidad'

async function texts(result: IdentityResult, locale: string) {
  const day = (value: string) => lostDayLabel(value, locale)
  switch (result.kind) {
    case 'approved': {
      const t = await getTranslations({ locale, namespace: 'emails.identity_approved' })
      const values = { date: day(result.on), app: APP_NAME }
      return {
        t,
        path: PROFILE_PATH,
        body: result.levelTwoNow ? t('body', values) : t('body_needs_phone', values),
        button: t('button'),
      }
    }
    case 'rejected': {
      const t = await getTranslations({ locale, namespace: 'emails.identity_rejected' })
      const reasons = await getTranslations({ locale, namespace: 'identity.rejection' })
      const values = {
        date: day(result.on),
        app: APP_NAME,
        reason: reasons(`${result.reason}.inline`),
        advice: reasons(`${result.reason}.advice`, { email: SUPPORT_EMAIL }),
      }
      // El tercero en 30 días dice el día del tope y la ayuda en lugar de invitar a reintentar
      // (FR-026); el enlace lleva al estado, que dice lo mismo.
      return result.retryOn === null
        ? { t, path: `${IDENTITY_PATH}?pedir=1`, body: t('body', values), button: t('button') }
        : {
            t,
            path: IDENTITY_PATH,
            body: t('body_capped', {
              ...values,
              retry: day(result.retryOn),
              email: SUPPORT_EMAIL,
            }),
            button: t('button_capped'),
          }
    }
    default: {
      const t = await getTranslations({ locale, namespace: 'emails.identity_expired' })
      return {
        t,
        path: `${IDENTITY_PATH}?pedir=1`,
        body: t('body', { date: day(result.on), app: APP_NAME }),
        button: t('button'),
      }
    }
  }
}

// El correo del resultado de un pedido (FR-026): qué pasó, desde qué día, que las imágenes se
// borraron y el paso siguiente, con un enlace común al sitio, que pide ingresar como siempre. Sin
// imágenes, sin datos de la cédula y sin quién resolvió. Se intenta una vez y nunca lanza: si falla,
// la resolución no se deshace y la persona lo ve al entrar. El log no lleva dirección ni id.
export async function sendIdentityResult(input: {
  userId: string
  result: IdentityResult
  locale: string
}): Promise<void> {
  const label = `[correo] identidad ${input.result.kind}`
  try {
    const to = await getAccountEmail(input.userId)
    if (to === null) {
      console.error(`${label}: no se encontró la dirección de la cuenta`)
      return
    }

    const { t, path, body, button } = await texts(input.result, input.locale)
    const sent = await withDeadline(
      sendEmail({
        to,
        subject: t('subject'),
        url: new URL(path, APP_URL).toString(),
        lang: input.locale,
        texts: {
          heading: t('heading'),
          body,
          button,
          fallback: t('fallback'),
          footer: t('footer'),
        },
      }),
    )
    if (!sent.ok) console.error(`${label}: el servicio de correo no lo aceptó`)
  } catch {
    console.error(`${label}: no se pudo mandar`)
  }
}
