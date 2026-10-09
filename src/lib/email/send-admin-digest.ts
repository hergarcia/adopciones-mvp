import { getTranslations } from 'next-intl/server'
import { digestLines, digestTotal } from '@/lib/admin/digest'
import { adminPathFrom } from '@/lib/admin/paths'
import type { DigestClaim } from '@/lib/admin/types'
import { APP_NAME, APP_URL } from '@/lib/config'
import { getAccountEmail } from '@/lib/supabase/queries/accounts'
import { deliverNotice } from './deliver-notice'
import { sendEmail } from './send-email'

// «Hay cosas esperando en Administrar» (contracts §Correo): cuántos y desde cuándo en cada cola,
// nada de las personas (FR-062). Se intenta una vez y nunca lanza: el día ya quedó reclamado y no se
// reintenta (FR-063). Sin dirección no sale. El log no lleva dirección ni id.
export async function sendAdminDigest(
  claim: DigestClaim,
  now: Date,
  locale: string,
): Promise<boolean> {
  const { sent } = await deliverNotice(async () => {
    const to = await getAccountEmail(claim.userId)
    if (to === null) return { ok: false }
    const [digest, home] = await Promise.all([
      getTranslations({ locale, namespace: 'emails.admin_digest' }),
      getTranslations({ locale, namespace: 'admin.home' }),
    ])
    const count = digestTotal(claim)
    return sendEmail({
      to,
      subject: digest('subject', { count, app: APP_NAME }),
      url: new URL(adminPathFrom('digest'), APP_URL).toString(),
      lang: locale,
      texts: {
        heading: digest('heading', { count }),
        body: digest('body'),
        button: digest('button'),
        fallback: digest('fallback'),
        footer: digest('footer', { app: APP_NAME }),
      },
      extras: { lines: digestLines(claim, now, { digest, home }) },
    })
  })
  if (!sent) console.error('[correo] resumen: no se pudo mandar')
  return sent
}
