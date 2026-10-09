import { routing } from '@/lib/i18n/routing'
import { claimApplicationNotices } from '@/lib/supabase/queries/application-response-records'
import { sendApplicationNotice } from './send-application-notice'

// Lo que una acción escribió en la bandeja de salida, de una tanda (research R3). Cada aviso ya se
// borró al tomarlo, así que dos vaciados a la vez no mandan el mismo dos veces; uno que no salió no
// se reintenta, igual que los recordatorios. Lo que quede lo barre el cron diario.
const NOTICES_PER_DRAIN = 50

export async function drainApplicationNotices(): Promise<void> {
  const notices = await claimApplicationNotices(NOTICES_PER_DRAIN)
  await Promise.all(notices.map((notice) => sendApplicationNotice(notice, routing.defaultLocale)))
}
