import { timingSafeEqual } from 'node:crypto'
import { track } from '@/lib/analytics/track'
import { sendIdentityResult } from '@/lib/email/send-identity-result'
import { optionalEnv } from '@/lib/env'
import { routing } from '@/lib/i18n/routing'
import { listPendingExpiryNotices, markExpiryNoticeSent } from '@/lib/supabase/queries/identity'

function authorized(given: string | null): boolean {
  const secret = optionalEnv('CRON_SECRET')
  if (secret === undefined || given === null) return false
  const a = Buffer.from(given)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

// La llama la base (`identity_expiry_mail_tick`, cada 5 minutos) cuando hay avisos de vencimiento
// pendientes. Las imágenes ya se borraron cuando esto corre, así que el correo nunca dice que se
// borraron sin que sea cierto (FR-028). Cada aviso se intenta una vez y se marca, salga o no; el
// evento se dispara igual, sin marca de visita (FR-035). Sin el secreto, 401 sin cuerpo.
export async function POST(request: Request) {
  if (!authorized(request.headers.get('x-cron-secret'))) {
    return new Response(null, { status: 401 })
  }

  const notices = await listPendingExpiryNotices().catch(() => [])
  await Promise.all(
    notices.map(async (notice) => {
      await sendIdentityResult({
        userId: notice.userId,
        result: { kind: 'expired', on: notice.expiredOn },
        locale: routing.defaultLocale,
      })
      await markExpiryNoticeSent(notice.userId)
      await track('identity_request_expired', { origin: notice.origin }, { visit: false })
    }),
  )
  return new Response(null, { status: 204 })
}
