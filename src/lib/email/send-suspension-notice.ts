import { getTranslations } from 'next-intl/server'
import { APP_NAME, APP_URL, SUPPORT_EMAIL } from '@/lib/config'
import { DEFAULT_DESTINATION } from '@/lib/auth/next-destination'
import { SUSPENDED_SCREEN_PATH } from '@/lib/moderation/paths'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import { deliverNotice } from './deliver-notice'
import { sendEmail } from './send-email'

export type SuspensionNotice =
  { kind: 'suspended'; userId: string; reason: string } | { kind: 'reactivated'; userId: string }

// «Suspendimos tu cuenta» y «Tu cuenta está activa de nuevo» (contracts §Correos): el motivo tal
// cual, que la plantilla escapa, el correo de ayuda y el enlace a la cuenta. Ninguno nombra a quien
// reportó ni a quien suspendió. Sale después de la decisión y nunca lanza (FR-031); el log no lleva
// dirección ni id.
async function noticeTexts(notice: SuspensionNotice, locale: string) {
  const values = { app: APP_NAME, email: SUPPORT_EMAIL }
  const t =
    notice.kind === 'suspended'
      ? await getTranslations({ locale, namespace: 'emails.account_suspended' })
      : await getTranslations({ locale, namespace: 'emails.account_reactivated' })
  const reason = notice.kind === 'suspended' ? notice.reason : ''
  return {
    subject: t('subject', values),
    path: notice.kind === 'suspended' ? SUSPENDED_SCREEN_PATH : DEFAULT_DESTINATION,
    texts: {
      heading: t('heading', values),
      body: t('body', { ...values, reason }),
      button: t('button', values),
      fallback: t('fallback'),
      footer: t('footer', values),
    },
  }
}

export async function sendSuspensionNotice(notice: SuspensionNotice, locale: string) {
  const { sent } = await deliverNotice(async () => {
    const to = await getAccountEmail(notice.userId)
    if (to === null) return { ok: false }
    const { subject, path, texts } = await noticeTexts(notice, locale)
    return sendEmail({
      to,
      subject,
      url: new URL(path, APP_URL).toString(),
      lang: locale,
      texts,
    })
  })
  if (!sent) console.error(`[correo] cuenta ${notice.kind}: no se pudo mandar`)
}
