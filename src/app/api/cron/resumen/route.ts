import { digestSentEvent } from '@/lib/analytics/admin-events'
import { trackAll } from '@/lib/analytics/track'
import { isCronRequest } from '@/lib/cron/is-cron-request'
import { ROUTE_TASKS } from '@/lib/cron/route-tasks'
import { sendAdminDigest } from '@/lib/email/send-admin-digest'
import { sendPetAlertMails } from '@/lib/email/send-pet-alert-mail'
import { taskFailed } from '@/lib/errors/report'
import { routing } from '@/lib/i18n/routing'
import { claimAdminDigests } from '@/lib/supabase/queries/admin'

// De a uno y espaciados, como los recordatorios: Resend acepta unos pocos pedidos por segundo, y cada
// resumen ya quedó reclamado, así que uno rechazado por la ráfaga no se volvería a intentar.
const DIGEST_SPACING_MS = 600

// La llama la base (`admin_digest_tick`, a las 8 de Uruguay). Si no se pudo reclamar —una cola que no
// se pudo contar—, ese día no sale ningún resumen (FR-063). Después, en la misma corrida, los correos
// de avisos (historia #265, research R5): si una de las dos partes falla, la otra corre igual. Sin el
// secreto, 401 sin cuerpo.
export async function POST(request: Request) {
  if (!isCronRequest(request)) {
    return new Response(null, { status: 401 })
  }

  const claims = await claimAdminDigests().catch(taskFailed(ROUTE_TASKS.resumen, []))
  const now = new Date()
  for (const [index, claim] of claims.entries()) {
    if (index > 0) {
      // oxlint-disable-next-line no-await-in-loop -- de a uno a propósito: el límite de Resend
      await new Promise((resolve) => setTimeout(resolve, DIGEST_SPACING_MS))
    }
    // oxlint-disable-next-line no-await-in-loop -- de a uno a propósito: el límite de Resend
    const sent = await sendAdminDigest(claim, now, routing.defaultLocale)
    // oxlint-disable-next-line no-await-in-loop -- el evento de cada resumen que salió
    if (sent) await trackAll([digestSentEvent(claim, now)], { visit: false })
  }
  await sendPetAlertMails(routing.defaultLocale).catch(taskFailed(ROUTE_TASKS.resumen, undefined))
  return new Response(null, { status: 204 })
}
